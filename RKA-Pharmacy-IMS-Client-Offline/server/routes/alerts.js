const express = require('express');
const router = express.Router();
const { db, logAudit, calculateDaysToExpiry, getExpiryTier, getLocalDateString, getSettingsMap } = require('../db');

// GET all active alerts across inventory (annotated with acknowledgment status)
router.get('/', (req, res) => {
  try {
    const today = new Date();
    const todayStr = getLocalDateString();
    const settings = getSettingsMap();

    // Map existing acknowledgments
    const ackRows = db.prepare('SELECT alert_key, acknowledged_by, acknowledged_at FROM alert_acknowledgments').all();
    const ackMap = {};
    for (const a of ackRows) {
      ackMap[a.alert_key] = a;
    }

    // Expiration alerts across active or expired batches
    const batches = db.prepare(`
      SELECT 
        b.*,
        m.code as medicine_code,
        m.barcode as medicine_barcode,
        m.brand_name,
        m.generic_name,
        m.unit_of_measure,
        m.reorder_threshold
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.current_quantity > 0 AND b.status != 'disposed'
      ORDER BY b.expiration_date ASC
    `).all();

    const expiredBatches = [];
    const criticalBatches = [];
    const warningBatches = [];
    const monitorBatches = [];
    const safeBatches = [];

    for (const b of batches) {
      const days = calculateDaysToExpiry(b.expiration_date, today);
      const tier = getExpiryTier(days, settings);
      const alertKey = `batch_expiry_${b.id}`;
      const ackInfo = ackMap[alertKey];

      const enriched = {
        ...b,
        alert_key: alertKey,
        days_to_expiry: days,
        expiry_tier: tier,
        is_acknowledged: !!ackInfo,
        acknowledged_at: ackInfo ? ackInfo.acknowledged_at : null,
        acknowledged_by: ackInfo ? ackInfo.acknowledged_by : null
      };

      if (tier === 'Expired') {
        expiredBatches.push(enriched);
      } else if (tier === 'Critical') {
        criticalBatches.push(enriched);
      } else if (tier === 'Warning') {
        warningBatches.push(enriched);
      } else if (tier === 'Monitor') {
        monitorBatches.push(enriched);
      } else {
        safeBatches.push(enriched);
      }
    }

    // Stock alerts (Low stock & Out of stock) - strictly evaluates unexpired active units
    const stockStats = db.prepare(`
      SELECT 
        m.id,
        m.code,
        m.barcode,
        m.brand_name,
        m.generic_name,
        m.dosage_strength,
        m.dosage_form,
        m.unit_of_measure,
        m.reorder_threshold,
        m.supplier_lead_time_days,
        m.buffer_days,
        COALESCE(SUM(CASE WHEN b.status = 'active' AND b.current_quantity > 0 AND b.expiration_date > ? THEN b.current_quantity ELSE 0 END), 0) as total_stock
      FROM medicines m
      LEFT JOIN batches b ON m.id = b.medicine_id
      GROUP BY m.id
      ORDER BY m.brand_name ASC
    `).all(todayStr);

    const outOfStock = [];
    const lowStock = [];

    for (const item of stockStats) {
      const alertKey = item.total_stock === 0
        ? `medicine_outofstock_${item.id}`
        : `medicine_lowstock_${item.id}`;
      const ackInfo = ackMap[alertKey];

      const enrichedItem = {
        ...item,
        alert_key: alertKey,
        is_acknowledged: !!ackInfo,
        acknowledged_at: ackInfo ? ackInfo.acknowledged_at : null,
        acknowledged_by: ackInfo ? ackInfo.acknowledged_by : null
      };

      if (item.total_stock === 0) {
        outOfStock.push(enrichedItem);
      } else if (item.total_stock <= item.reorder_threshold) {
        lowStock.push(enrichedItem);
      }
    }

    const totalAlertsCount = 
      expiredBatches.length + 
      criticalBatches.length + 
      warningBatches.length + 
      lowStock.length + 
      outOfStock.length;

    res.json({
      summary: {
        total_alerts: totalAlertsCount,
        expired_count: expiredBatches.length,
        critical_count: criticalBatches.length,
        warning_count: warningBatches.length,
        monitor_count: monitorBatches.length,
        safe_count: safeBatches.length,
        low_stock_count: lowStock.length,
        out_of_stock_count: outOfStock.length
      },
      expired: expiredBatches,
      critical: criticalBatches,
      warning: warningBatches,
      monitor: monitorBatches,
      low_stock: lowStock,
      out_of_stock: outOfStock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Acknowledge an alert manually (with immutable audit trail logging)
router.post('/acknowledge', (req, res) => {
  try {
    const { alert_key, alert_type, entity_id, operator_name = 'Lourdes Gincen L. Cesista' } = req.body;

    if (!alert_key) {
      return res.status(400).json({ error: 'Alert key is required.' });
    }

    db.prepare(`
      INSERT OR REPLACE INTO alert_acknowledgments (alert_key, alert_type, entity_id, acknowledged_by, acknowledged_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(alert_key, alert_type || 'GENERAL', parseInt(entity_id) || 0, operator_name);

    logAudit(
      'ALERT_ACKNOWLEDGED',
      'ALERT',
      alert_key,
      { alert_key, alert_type, entity_id },
      operator_name
    );

    res.json({
      message: 'Alert acknowledged successfully and logged in audit trail.',
      alert_key,
      acknowledged_by: operator_name,
      acknowledged_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
