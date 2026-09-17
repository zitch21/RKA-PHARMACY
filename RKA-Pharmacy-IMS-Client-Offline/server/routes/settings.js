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

// Update settings
router.put('/', (req, res) => {
  try {
    const updates = req.body; // e.g. { safe_threshold_days: '180', ... }
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, description) VALUES (?, ?, ?)');

    const updateMany = db.transaction((entries) => {
      for (const [key, value] of Object.entries(entries)) {
        stmt.run(key, String(value), `User updated setting ${key}`);
      }
    });

    updateMany(updates);
    logAudit('UPDATE_SETTINGS', 'SYSTEM', 'CONFIGURATION', updates);

    res.json({ message: 'Settings updated successfully', settings: updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
