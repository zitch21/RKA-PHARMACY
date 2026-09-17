const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../db');

// Helper to compute expiry tier based on days
function getExpiryTier(days) {
  if (days <= 0) return 'Expired';
  if (days <= 30) return 'Critical';
  if (days <= 90) return 'Warning';
  if (days <= 180) return 'Monitor';
  return 'Safe';
}

// GET all medicines with total stock, active batches, and earliest expiry
router.get('/', (req, res) => {
  try {
    const medicines = db.prepare(`
      SELECT 
        m.*,
        COALESCE(SUM(CASE WHEN b.status = 'active' AND b.current_quantity > 0 THEN b.current_quantity ELSE 0 END), 0) as total_stock,
        COUNT(CASE WHEN b.status = 'active' AND b.current_quantity > 0 THEN b.id END) as active_batches_count,
        MIN(CASE WHEN b.status = 'active' AND b.current_quantity > 0 THEN b.expiration_date END) as earliest_expiration_date
      FROM medicines m
      LEFT JOIN batches b ON m.id = b.medicine_id
      GROUP BY m.id
      ORDER BY m.brand_name ASC
    `).all();

    const today = new Date();
    const result = medicines.map(m => {
      let daysToEarliestExpiry = null;
      let expiryTier = 'None';
      if (m.earliest_expiration_date) {
        const expDate = new Date(m.earliest_expiration_date);
        daysToEarliestExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        expiryTier = getExpiryTier(daysToEarliestExpiry);
      }

      const isLowStock = m.total_stock <= m.reorder_threshold;
      const isOutOfStock = m.total_stock === 0;

      return {
        ...m,
        days_to_earliest_expiry: daysToEarliestExpiry,
        expiry_tier: expiryTier,
        is_low_stock: isLowStock,
        is_out_of_stock: isOutOfStock
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single medicine by ID with all batches
router.get('/:id', (req, res) => {
  try {
    const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(req.params.id);
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const batches = db.prepare(`
      SELECT * FROM batches 
      WHERE medicine_id = ? 
      ORDER BY expiration_date ASC
    `).all(req.params.id);

    const today = new Date();
    const enrichedBatches = batches.map(b => {
      const expDate = new Date(b.expiration_date);
      const days = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      return {
        ...b,
        days_to_expiry: days,
        expiry_tier: getExpiryTier(days),
        is_expired: days <= 0
      };
    });

    res.json({
      ...medicine,
      batches: enrichedBatches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rapid barcode lookup (Scanner input)
router.get('/barcode/:barcode', (req, res) => {
  try {
    const barcode = req.params.barcode.trim();
    const medicine = db.prepare('SELECT * FROM medicines WHERE barcode = ?').get(barcode);
    if (!medicine) {
      return res.status(404).json({ error: 'No medicine registered with this barcode' });
    }

    // Retrieve active batches ordered by earliest expiry (FEFO)
    const batches = db.prepare(`
      SELECT * FROM batches 
      WHERE medicine_id = ? AND status = 'active' AND current_quantity > 0
      ORDER BY expiration_date ASC
    `).all(medicine.id);

    const today = new Date();
    const enrichedBatches = batches.map(b => {
      const expDate = new Date(b.expiration_date);
      const days = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      return {
        ...b,
        days_to_expiry: days,
        expiry_tier: getExpiryTier(days),
        is_expired: days <= 0
      };
    });

    const totalStock = enrichedBatches.reduce((acc, b) => acc + b.current_quantity, 0);

    // Identify recommended FEFO batch (earliest unexpired batch)
    const fefoBatch = enrichedBatches.find(b => b.days_to_expiry > 0) || null;

    res.json({
      ...medicine,
      total_stock: totalStock,
      batches: enrichedBatches,
      recommended_batch: fefoBatch
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new medicine
router.post('/', (req, res) => {
  try {
    const {
      code,
      barcode,
      brand_name,
      generic_name,
      dosage_strength,
      dosage_form,
      category,
      unit_of_measure,
      reorder_threshold,
      supplier_lead_time_days,
      buffer_days,
      supplier_name,
      description
    } = req.body;

    if (!brand_name || !generic_name || !dosage_strength || !dosage_form) {
      return res.status(400).json({ error: 'Please provide brand name, generic name, dosage, and form.' });
    }

    // Auto-generate code if missing
    let finalCode = code;
    if (!finalCode) {
      const last = db.prepare("SELECT id FROM medicines ORDER BY id DESC LIMIT 1").get();
      const nextId = last ? last.id + 1 : 1;
      finalCode = `MED-${String(nextId).padStart(3, '0')}`;
    }

    // Auto-generate internal barcode if missing
    let finalBarcode = barcode && barcode.trim() !== '' ? barcode.trim() : `RKA-${finalCode}-INT`;

    // Check uniqueness
    const checkExists = db.prepare('SELECT id FROM medicines WHERE barcode = ? OR code = ?').get(finalBarcode, finalCode);
    if (checkExists) {
      return res.status(400).json({ error: 'A medicine with this barcode or item code already exists.' });
    }

    const stmt = db.prepare(`
      INSERT INTO medicines (
        code, barcode, brand_name, generic_name, dosage_strength, dosage_form,
        category, unit_of_measure, reorder_threshold, supplier_lead_time_days,
        buffer_days, supplier_name, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      finalCode,
      finalBarcode,
      brand_name.trim(),
      generic_name.trim(),
      dosage_strength.trim(),
      dosage_form.trim(),
      category || 'Medicine',
      unit_of_measure || 'Piece',
      parseInt(reorder_threshold) || 20,
      parseInt(supplier_lead_time_days) || 5,
      parseInt(buffer_days) || 3,
      supplier_name || 'Generic Supplier',
      description || ''
    );

    logAudit(
      'CREATE_MEDICINE',
      'MEDICINE',
      result.lastInsertRowid,
      { code: finalCode, brand_name, generic_name, barcode: finalBarcode }
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      code: finalCode,
      barcode: finalBarcode,
      message: 'Medicine registered successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update medicine profile
router.put('/:id', (req, res) => {
  try {
    const medId = req.params.id;
    const current = db.prepare('SELECT * FROM medicines WHERE id = ?').get(medId);
    if (!current) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const {
      brand_name,
      generic_name,
      dosage_strength,
      dosage_form,
      category,
      unit_of_measure,
      reorder_threshold,
      supplier_lead_time_days,
      buffer_days,
      supplier_name,
      description,
      barcode
    } = req.body;

    const stmt = db.prepare(`
      UPDATE medicines SET
        brand_name = ?,
        generic_name = ?,
        dosage_strength = ?,
        dosage_form = ?,
        category = ?,
        unit_of_measure = ?,
        reorder_threshold = ?,
        supplier_lead_time_days = ?,
        buffer_days = ?,
        supplier_name = ?,
        description = ?,
        barcode = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      brand_name ?? current.brand_name,
      generic_name ?? current.generic_name,
      dosage_strength ?? current.dosage_strength,
      dosage_form ?? current.dosage_form,
      category ?? current.category,
      unit_of_measure ?? current.unit_of_measure,
      reorder_threshold !== undefined ? parseInt(reorder_threshold) : current.reorder_threshold,
      supplier_lead_time_days !== undefined ? parseInt(supplier_lead_time_days) : current.supplier_lead_time_days,
      buffer_days !== undefined ? parseInt(buffer_days) : current.buffer_days,
      supplier_name ?? current.supplier_name,
      description ?? current.description,
      barcode ?? current.barcode,
      medId
    );

    logAudit(
      'UPDATE_MEDICINE',
      'MEDICINE',
      medId,
      { before: current, updated_fields: req.body }
    );

    res.json({ message: 'Medicine updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete medicine
router.delete('/:id', (req, res) => {
  try {
    const medId = req.params.id;
    const current = db.prepare('SELECT * FROM medicines WHERE id = ?').get(medId);
    if (!current) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    // Check if recorded in transactions ledger
    const txCheck = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE medicine_id = ?').get(medId);
    if (txCheck && txCheck.count > 0) {
      return res.status(400).json({
        error: `Cannot delete ${current.brand_name} because it has ${txCheck.count} recorded transactions in the audit ledger. Archive or mark inactive instead.`
      });
    }

    // Check active batches with stock
    const batchCheck = db.prepare("SELECT COALESCE(SUM(current_quantity), 0) as total FROM batches WHERE medicine_id = ? AND status = 'active'").get(medId);
    if (batchCheck && batchCheck.total > 0) {
      return res.status(400).json({
        error: `Cannot delete ${current.brand_name} because it still has ${batchCheck.total} units in stock across active batches.`
      });
    }

    db.prepare('DELETE FROM medicines WHERE id = ?').run(medId);

    logAudit('DELETE_MEDICINE', 'MEDICINE', medId, { deleted: current });
    res.json({ message: 'Medicine deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
