const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../db');

// GET all settings as a key-value dictionary
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings with validation for forecasting_window_days and audit logging
router.put('/', (req, res) => {
  try {
    const updates = { ...(req.body || {}) };
    const operator = (req.body && req.body.operator_name) || 'Lourdes Gincen L. Cesista';

    // Validate forecasting_window_days if provided
    if (updates.forecasting_window_days !== undefined) {
      const windowVal = parseInt(updates.forecasting_window_days, 10);
      if (![10, 20, 30].includes(windowVal)) {
        return res.status(400).json({ error: 'Forecasting baseline window must be 10, 20, or 30 operational days.' });
      }
      updates.forecasting_window_days = String(windowVal);
      // Keep legacy history_days_fefo_plus in sync
      updates.history_days_fefo_plus = String(windowVal);
    }

    // Validate po_drafting_mode if provided
    if (updates.po_drafting_mode !== undefined) {
      if (!['manual', 'instant_auto'].includes(updates.po_drafting_mode)) {
        return res.status(400).json({ error: 'PO drafting automation mode must be "manual" or "instant_auto".' });
      }
      updates.po_drafting_mode = String(updates.po_drafting_mode);
    }

    const previousRows = db.prepare('SELECT key, value FROM settings').all();
    const previousMap = {};
    for (const r of previousRows) previousMap[r.key] = r.value;

    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, description) VALUES (?, ?, ?)');

    const updateMany = db.transaction((entries) => {
      for (const [key, value] of Object.entries(entries)) {
        if (key === 'operator_name') continue;
        stmt.run(key, String(value), `User updated setting ${key}`);
      }
    });

    updateMany(updates);

    logAudit('UPDATE_SETTINGS', 'SYSTEM', 'CONFIGURATION', {
      previous: previousMap,
      updated_fields: updates,
      forecasting_window_days: updates.forecasting_window_days
    }, operator);

    res.json({ message: 'Settings updated successfully', settings: updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
