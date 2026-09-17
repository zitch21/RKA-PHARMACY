const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../db');

function getExpiryTier(days) {
  if (days <= 0) return 'Expired';
  if (days <= 30) return 'Critical';
  if (days <= 90) return 'Warning';
  if (days <= 180) return 'Monitor';
  return 'Safe';
}

// Comprehensive FEFO+ analysis handler
const handleAnalysis = (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Read configured history window (default 30 days)
    const historySetting = db.prepare("SELECT value FROM settings WHERE key = 'history_days_fefo_plus'").get();
    const historyDays = parseInt(historySetting ? historySetting.value : '30') || 30;

    // Check how many days of stock-out history exist in system
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
      const oldest = new Date(historyStats.oldest_tx);
      const span = Math.max(1, Math.ceil((today - oldest) / (1000 * 60 * 60 * 24)));
      totalHistorySpanDays = span;
    }

    const hasEnoughData = totalHistorySpanDays >= historyDays;

    // Fetch all medicines
    const medicines = db.prepare('SELECT * FROM medicines ORDER BY brand_name ASC').all();

    // For each medicine, calculate Average Daily Quantity Sold (ADQS)
    // Note: We use max(days recorded, 1) or historyDays window
    const analysisWindowDays = Math.max(totalHistorySpanDays, 1);

    const medicineAnalysis = [];
    const atRiskBatches = [];

    for (const med of medicines) {
      // Stock sold in window
      const salesQuery = db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total_sold
        FROM transactions
        WHERE medicine_id = ? AND transaction_type = 'stock_out'
          AND created_at >= DATE('now', '-' || ? || ' days')
      `).get(med.id, analysisWindowDays);

      const totalSold = salesQuery ? salesQuery.total_sold : 0;
      const adqs = parseFloat((totalSold / analysisWindowDays).toFixed(2));

      // Calculate suggested reorder level
      // Suggested = ADQS * (Lead Time + Buffer Days)
      const leadTime = med.supplier_lead_time_days || 5;
      const bufferDays = med.buffer_days || 3;
      const suggestedReorder = Math.ceil(adqs * (leadTime + bufferDays));

      // Fetch active unexpired batches
      const batches = db.prepare(`
        SELECT * FROM batches
        WHERE medicine_id = ? AND status = 'active' AND current_quantity > 0
        ORDER BY expiration_date ASC
      `).all(med.id);

      const totalCurrentStock = batches.reduce((sum, b) => sum + b.current_quantity, 0);

      const evaluatedBatches = batches.map(b => {
        const expDate = new Date(b.expiration_date);
        const daysToExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        const tier = getExpiryTier(daysToExpiry);

        let daysToConsume = null;
        let expiryRiskMargin = null;
        let isAtWasteRisk = false;

        if (adqs > 0) {
          daysToConsume = parseFloat((b.current_quantity / adqs).toFixed(1));
          expiryRiskMargin = parseFloat((daysToExpiry - daysToConsume).toFixed(1));
          // Negative margin = unlikely to be consumed before expiry!
          isAtWasteRisk = expiryRiskMargin < 0;
        } else {
          // Zero sales velocity -> high risk if expiring within warning/critical range
          daysToConsume = 9999;
          expiryRiskMargin = daysToExpiry - 9999;
          isAtWasteRisk = daysToExpiry <= 90;
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
        adqs,
        analysis_window_days: analysisWindowDays,
        suggested_reorder_level: suggestedReorder,
        lead_time_days: leadTime,
        buffer_days: bufferDays,
        current_threshold: med.reorder_threshold,
        threshold_diff: suggestedReorder - med.reorder_threshold,
        is_low_stock: totalCurrentStock <= med.reorder_threshold,
        batches: evaluatedBatches
      });
    }

    // Sort at-risk batches by lowest/most negative margin
    atRiskBatches.sort((a, b) => a.expiry_risk_margin - b.expiry_risk_margin);

    res.json({
      has_enough_data: hasEnoughData,
      history_days_recorded: totalHistorySpanDays,
      history_days_required: historyDays,
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
    const { suggested_value } = req.body;

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

module.exports = router;
