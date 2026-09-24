const express = require('express');
const router = express.Router();
const { db, logAudit, calculateDaysToExpiry, getExpiryTier, getLocalDateString, getSettingsMap } = require('../db');

// Comprehensive FEFO+ analysis handler with configurable window and Cold-Start Rule
const handleAnalysis = (req, res) => {
  try {
    const today = new Date();
    const todayStr = getLocalDateString();
    const settings = getSettingsMap();

    // Read configurable observation window N (10, 20, or 30 days; default 30)
    const rawWindow = parseInt(settings.forecasting_window_days || settings.history_days_fefo_plus || '30', 10);
    const validWindows = [10, 20, 30];
    const N = validWindows.includes(rawWindow) ? rawWindow : 30;

    // Check how many operational stock-out days exist in system
    const historyStats = db.prepare(`
      SELECT 
        MIN(DATE(created_at)) as oldest_tx,
        MAX(DATE(created_at)) as latest_tx,
        COUNT(DISTINCT DATE(created_at)) as distinct_sales_days
      FROM transactions
      WHERE transaction_type = 'stock_out'
    `).get();

    let totalHistorySpanDays = 0;
    if (historyStats && historyStats.oldest_tx) {
      const oldestDays = calculateDaysToExpiry(historyStats.oldest_tx, today);
      totalHistorySpanDays = Math.max(1, Math.abs(oldestDays));
    }

    // Cold-Start Baseline Rule:
    // If elapsed transaction history t < N, the system suppresses automated forecasting
    // and operates under standard FEFO dispatching and manual reorder points.
    const isColdStart = totalHistorySpanDays < N;
    const hasEnoughData = !isColdStart;

    // Fetch all medicines
    const medicines = db.prepare('SELECT * FROM medicines ORDER BY brand_name ASC').all();

    const medicineAnalysis = [];
    const atRiskBatches = [];

    // Prepare statements outside loop for optimal execution plan reuse
    const getBatchesStmt = db.prepare(`
      SELECT * FROM batches
      WHERE medicine_id = ? AND status = 'active' AND current_quantity > 0 AND expiration_date > ?
      ORDER BY expiration_date ASC
    `);

    const latestBatchCostStmt = db.prepare(`
      SELECT unit_cost FROM batches WHERE medicine_id = ? ORDER BY id DESC LIMIT 1
    `);

    const latestPoItemCostStmt = db.prepare(`
      SELECT unit_cost FROM purchase_order_items WHERE medicine_id = ? ORDER BY id DESC LIMIT 1
    `);

    const salesQueryStmt = !isColdStart ? db.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as total_sold
      FROM transactions
      WHERE medicine_id = ? AND transaction_type = 'stock_out'
        AND created_at >= DATE('now', '-' || ? || ' days')
    `) : null;

    for (const med of medicines) {
      // Look up previous batch / purchase record unit cost
      const batchCostRow = latestBatchCostStmt.get(med.id);
      const poCostRow = !batchCostRow ? latestPoItemCostStmt.get(med.id) : null;
      const latestCost = batchCostRow ? batchCostRow.unit_cost : (poCostRow ? poCostRow.unit_cost : 10.0);
      med.latest_unit_cost = latestCost;

      // Fetch active unexpired batches in FEFO order
      const batches = getBatchesStmt.all(med.id, todayStr);

      const totalCurrentStock = batches.reduce((sum, b) => sum + b.current_quantity, 0);
      const leadTime = med.supplier_lead_time_days || 5;
      const bufferDays = med.buffer_days || parseInt(settings.default_buffer_days || '3', 10) || 3;

      if (isColdStart) {
        // COLD-START BASELINE ACTIVE:
        // Suppress automated forecasting; use standard FEFO and manual reorder threshold
        const evaluatedBatches = batches.map(b => {
          const daysToExpiry = calculateDaysToExpiry(b.expiration_date, today);
          const tier = getExpiryTier(daysToExpiry, settings);

          return {
            ...b,
            medicine_code: med.code,
            brand_name: med.brand_name,
            generic_name: med.generic_name,
            unit_of_measure: med.unit_of_measure,
            adqs: null,
            days_to_expiry: daysToExpiry,
            days_to_consume: null,
            expiry_risk_margin: null,
            q_waste: 0,
            expiry_tier: tier,
            is_at_waste_risk: false,
            risk_status: 'COLD_START_STANDARD_FEFO'
          };
        });

        medicineAnalysis.push({
          medicine: med,
          total_stock: totalCurrentStock,
          latest_unit_cost: latestCost,
          adqs: null,
          analysis_window_days: N,
          is_cold_start: true,
          suggested_reorder_level: null,
          suggested_purchase_quantity: totalCurrentStock <= med.reorder_threshold
            ? Math.max(0, (med.reorder_threshold * 2) - totalCurrentStock)
            : 0,
          lead_time_days: leadTime,
          buffer_days: bufferDays,
          current_threshold: med.reorder_threshold,
          threshold_diff: 0,
          is_low_stock: totalCurrentStock <= med.reorder_threshold,
          batches: evaluatedBatches
        });
      } else {
        // PREDICTIVE ENGINE ACTIVE (t >= N):
        // Formula: D_hat_i = (1 / N) * SUM(S_i,t) over N operational days
        const salesQuery = salesQueryStmt.get(med.id, N);

        const totalSold = salesQuery ? salesQuery.total_sold : 0;
        const adqs = parseFloat((totalSold / N).toFixed(2));

        // Dynamic Reorder Point: R_i = (D_hat_i * L_i) + (D_hat_i * K_buffer)
        const computedReorder = Math.ceil(adqs * (leadTime + bufferDays));
        // Safe floor: if ADQS == 0 (no sales recorded or drug was out of stock),
        // fallback to manual threshold to protect against censored demand wiping threshold to 0
        const suggestedReorder = adqs > 0 ? computedReorder : (med.reorder_threshold || 20);

        // Suggested purchase quantity when replenishment is needed
        const suggestedPurchaseQty = totalCurrentStock <= suggestedReorder
          ? Math.max(1, Math.ceil((suggestedReorder * 2) - totalCurrentStock))
          : 0;

        // Evaluate batches along FEFO dispatch queue
        let cumulativeStock = 0;
        const evaluatedBatches = batches.map(b => {
          cumulativeStock += b.current_quantity;
          const daysToExpiry = calculateDaysToExpiry(b.expiration_date, today);
          const tier = getExpiryTier(daysToExpiry, settings);

          let daysToConsume = null;
          let expiryRiskMargin = null;
          let isAtWasteRisk = false;
          let qWaste = 0;

          if (adqs > 0) {
            // T_consume = Q_i,b / D_hat_i
            // Using cumulative stock along queue accounts for batches waiting behind earlier stock
            daysToConsume = parseFloat((cumulativeStock / adqs).toFixed(1));
            // Delta T_i,b = T_expiry - T_consume
            expiryRiskMargin = parseFloat((daysToExpiry - daysToConsume).toFixed(1));
            isAtWasteRisk = expiryRiskMargin < 0;

            // Q_waste = Q_i,b - (D_hat_i * T_expiry)
            if (isAtWasteRisk && daysToExpiry > 0) {
              const expectedUnitsSoldBeforeExpiry = adqs * daysToExpiry;
              qWaste = Math.max(0, Math.round(b.current_quantity - expectedUnitsSoldBeforeExpiry));
              if (qWaste === 0 && isAtWasteRisk) qWaste = 1;
            }
          } else {
            // Zero demand velocity -> high risk if expiring within warning/critical range
            daysToConsume = 9999;
            expiryRiskMargin = daysToExpiry - 9999;
            isAtWasteRisk = daysToExpiry <= 90;
            if (isAtWasteRisk && daysToExpiry > 0) {
              qWaste = b.current_quantity;
            }
          }

          const batchObj = {
            ...b,
            medicine_code: med.code,
            brand_name: med.brand_name,
            generic_name: med.generic_name,
            unit_of_measure: med.unit_of_measure,
            adqs,
            days_to_expiry: daysToExpiry,
            days_to_consume: daysToConsume,
            expiry_risk_margin: expiryRiskMargin,
            q_waste: qWaste,
            expiry_tier: tier,
            is_at_waste_risk: isAtWasteRisk,
            risk_status: isAtWasteRisk ? 'NEGATIVE_MARGIN' : 'SAFE_MARGIN'
          };

          if (isAtWasteRisk && daysToExpiry > 0) {
            atRiskBatches.push(batchObj);
          }

          return batchObj;
        });

        medicineAnalysis.push({
          medicine: med,
          total_stock: totalCurrentStock,
          latest_unit_cost: latestCost,
          adqs,
          analysis_window_days: N,
          is_cold_start: false,
          suggested_reorder_level: suggestedReorder,
          suggested_purchase_quantity: suggestedPurchaseQty,
          lead_time_days: leadTime,
          buffer_days: bufferDays,
          current_threshold: med.reorder_threshold,
          threshold_diff: suggestedReorder - med.reorder_threshold,
          is_low_stock: totalCurrentStock <= med.reorder_threshold,
          is_dynamically_low: totalCurrentStock <= suggestedReorder,
          batches: evaluatedBatches
        });
      }
    }

    // Sort at-risk batches by lowest/most negative margin
    atRiskBatches.sort((a, b) => a.expiry_risk_margin - b.expiry_risk_margin);

    res.json({
      is_cold_start: isColdStart,
      has_enough_data: hasEnoughData,
      forecasting_window_days: N,
      history_days_recorded: totalHistorySpanDays,
      history_days_required: N,
      at_risk_batches: atRiskBatches,
      medicine_analysis: medicineAnalysis
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/', handleAnalysis);
router.get('/analysis', handleAnalysis);

// Apply suggested reorder level to medicine threshold
router.post('/apply-suggested-threshold/:id', (req, res) => {
  try {
    const medId = req.params.id;
    const { suggested_value } = req.body || {};

    const med = db.prepare('SELECT * FROM medicines WHERE id = ?').get(medId);
    if (!med) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const newThreshold = parseInt(suggested_value);
    if (isNaN(newThreshold) || newThreshold < 0) {
      return res.status(400).json({ error: 'Invalid suggested reorder threshold value.' });
    }

    db.prepare('UPDATE medicines SET reorder_threshold = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newThreshold, medId);

    logAudit(
      'UPDATE_REORDER_THRESHOLD_SUGGESTED',
      'MEDICINE',
      medId,
      {
        medicine: med.brand_name,
        previous_threshold: med.reorder_threshold,
        accepted_suggested_threshold: newThreshold
      }
    );

    res.json({
      message: `Reorder threshold for ${med.brand_name} updated to computed value of ${newThreshold} units.`,
      new_threshold: newThreshold
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk apply suggested reorder levels
router.post('/bulk-apply-suggested', (req, res) => {
  try {
    const { updates = [], operator_name = 'Lourdes Gincen L. Cesista' } = req.body || {};

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Array of updates with medicine_id and suggested_value is required.' });
    }

    const applied = [];
    const bulkTx = db.transaction((list) => {
      const updateStmt = db.prepare('UPDATE medicines SET reorder_threshold = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const getMedStmt = db.prepare('SELECT id, brand_name, reorder_threshold FROM medicines WHERE id = ?');
      for (const item of list) {
        const val = parseInt(item.suggested_value, 10);
        if (isNaN(val) || val < 0) continue;
        const med = getMedStmt.get(item.medicine_id);
        if (med) {
          updateStmt.run(val, med.id);
          applied.push({
            medicine_id: med.id,
            brand_name: med.brand_name,
            old_threshold: med.reorder_threshold,
            new_threshold: val
          });
        }
      }

      if (applied.length > 0) {
        logAudit(
          'BULK_UPDATE_REORDER_THRESHOLDS',
          'MEDICINE',
          null,
          {
            items_count: applied.length,
            updates: applied
          },
          operator_name
        );
      }
    });

    bulkTx(updates);

    res.json({
      message: `Successfully applied dynamic reorder thresholds to ${applied.length} medicines.`,
      count: applied.length,
      applied
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
