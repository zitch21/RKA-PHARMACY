const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all audit trail logs with filtering
router.get('/', (req, res) => {
  try {
    const { action, entity_type, limit = 100, page = 1, search } = req.query;
    let query = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];

    if (action) {
      query += ` AND action = ?`;
      params.push(action);
    }
    if (entity_type) {
      query += ` AND entity_type = ?`;
      params.push(entity_type);
    }
    if (search) {
      query += ` AND (details LIKE ? OR entity_id LIKE ? OR operator LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY timestamp DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const logs = db.prepare(query).all(...params);

    let countQuery = `SELECT COUNT(*) as count FROM audit_logs WHERE 1=1`;
    const countParams = [];
    if (action) {
      countQuery += ` AND action = ?`;
      countParams.push(action);
    }
    if (entity_type) {
      countQuery += ` AND entity_type = ?`;
      countParams.push(entity_type);
    }
    if (search) {
      countQuery += ` AND (details LIKE ? OR entity_id LIKE ? OR operator LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const total = db.prepare(countQuery).get(...countParams)?.count || 0;

    res.json({
      logs,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export audit trail to CSV
router.get('/export-csv', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC').all();

    let csv = 'ID,Timestamp,Action,Entity Type,Entity ID,Operator,Details\n';
    for (const log of logs) {
      const detailsClean = (log.details || '').replace(/"/g, '""');
      csv += `${log.id},"${log.timestamp}","${log.action}","${log.entity_type}","${log.entity_id}","${log.operator}","${detailsClean}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rka_pharmacy_audit_trail.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
