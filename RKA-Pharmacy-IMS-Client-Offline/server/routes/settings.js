const express = require('express');
const router = express.Router();
const { db, logAudit, performSystemReset, resetDemoDb } = require('../db');
const { requireAdminRole } = require('../middleware/authMiddleware');

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
router.put('/', requireAdminRole, (req, res) => {
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

    // Validate expiry threshold hierarchy if any threshold is being updated
    const thresholdKeys = ['critical_threshold_days', 'warning_threshold_days', 'monitor_threshold_days', 'safe_threshold_days'];
    const hasThresholdUpdates = thresholdKeys.some(k => updates[k] !== undefined);
    if (hasThresholdUpdates) {
      const currentRows = db.prepare("SELECT key, value FROM settings WHERE key IN ('critical_threshold_days', 'warning_threshold_days', 'monitor_threshold_days', 'safe_threshold_days')").all();
      const currentMap = {};
      for (const r of currentRows) currentMap[r.key] = parseInt(r.value, 10);

      const critical = updates.critical_threshold_days !== undefined ? parseInt(updates.critical_threshold_days, 10) : currentMap.critical_threshold_days;
      const warning = updates.warning_threshold_days !== undefined ? parseInt(updates.warning_threshold_days, 10) : currentMap.warning_threshold_days;
      const monitor = updates.monitor_threshold_days !== undefined ? parseInt(updates.monitor_threshold_days, 10) : currentMap.monitor_threshold_days;
      const safe = updates.safe_threshold_days !== undefined ? parseInt(updates.safe_threshold_days, 10) : currentMap.safe_threshold_days;

      if ([critical, warning, monitor, safe].some(v => isNaN(v) || v <= 0)) {
        return res.status(400).json({ error: 'Threshold days must be positive integers greater than zero.' });
      }

      if (!(critical < warning && warning < monitor && monitor < safe)) {
        return res.status(400).json({
          error: 'Invalid threshold hierarchy. Days must follow: Critical < Warning < Monitor < Safe (e.g., 30 < 60 < 90 < 180).'
        });
      }
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

// POST factory system reset (complete data wipe, admin login & settings retained, pre-wipe backup created)
router.post('/system-reset', requireAdminRole, async (req, res) => {
  try {
    const operator = (req.body && req.body.operator_name) || (req.user && req.user.full_name) || 'Lourdes Gincen L. Cesista';
    const result = await performSystemReset({ operator_name: operator });
    res.json(result);
  } catch (err) {
    console.error('System reset error:', err);
    res.status(500).json({ error: err.message || 'System reset failed' });
  }
});

// POST demo sandbox reset (resets demo database back to fresh demo state)
router.post('/demo-reset', (req, res) => {
  try {
    resetDemoDb();
    res.json({ success: true, message: 'Demo sandbox reset to pristine initial state.' });
  } catch (err) {
    console.error('Demo reset error:', err);
    res.status(500).json({ error: err.message || 'Demo reset failed' });
  }
});

// GET database storage metrics & page statistics
router.get('/db-stats', (req, res) => {
  try {
    const pageCount = Number(db.pragma('page_count', { simple: true }));
    const pageSize = Number(db.pragma('page_size', { simple: true }));
    const freelistCount = Number(db.pragma('freelist_count', { simple: true }));
    const totalBytes = pageCount * pageSize;
    const freeBytes = freelistCount * pageSize;

    res.json({
      page_count: pageCount,
      page_size: pageSize,
      freelist_count: freelistCount,
      total_bytes: totalBytes,
      total_kb: Math.round(totalBytes / 1024),
      free_kb: Math.round(freeBytes / 1024),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST compact & optimize database (VACUUM, PRAGMA wal_checkpoint(TRUNCATE), PRAGMA optimize)
router.post('/optimize', (req, res) => {
  try {
    const operator = (req.body && req.body.operator_name) || (req.user && req.user.full_name) || 'Lourdes Gincen L. Cesista';

    const beforePages = Number(db.pragma('page_count', { simple: true }));
    const pageSize = Number(db.pragma('page_size', { simple: true }));
    const beforeFree = Number(db.pragma('freelist_count', { simple: true }));
    const sizeBeforeBytes = beforePages * pageSize;

    // Execute WAL truncate, VACUUM, and optimize query planner
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.exec('VACUUM');
    db.pragma('optimize');

    const afterPages = Number(db.pragma('page_count', { simple: true }));
    const afterFree = Number(db.pragma('freelist_count', { simple: true }));
    const sizeAfterBytes = afterPages * pageSize;
    const reclaimedBytes = Math.max(0, sizeBeforeBytes - sizeAfterBytes);

    logAudit('DB_OPTIMIZE', 'SYSTEM', 'DATABASE', {
      pages_before: beforePages,
      pages_after: afterPages,
      page_size: pageSize,
      reclaimed_bytes: reclaimedBytes
    }, operator);

    res.json({
      success: true,
      message: 'Database compacted and optimized successfully.',
      details: {
        page_size: pageSize,
        pages_before: beforePages,
        pages_after: afterPages,
        freelist_before: beforeFree,
        freelist_after: afterFree,
        size_before_kb: Math.round(sizeBeforeBytes / 1024),
        size_after_kb: Math.round(sizeAfterBytes / 1024),
        reclaimed_kb: Math.round(reclaimedBytes / 1024)
      }
    });
  } catch (err) {
    console.error('Database optimization error:', err);
    res.status(500).json({ error: err.message || 'Database optimization failed' });
  }
});

module.exports = router;
