const express = require('express');
const router = express.Router();
const { db, logAudit, calculateDaysToExpiry, getExpiryTier, getLocalDateString, getSettingsMap } = require('../db');

// GET all batches with medicine details and expiry tiers
router.get('/', (req, res) => {
  try {
    const { status, medicine_id } = req.query;
    let query = `
      SELECT 
        b.*,
        m.code as medicine_code,
        m.barcode as medicine_barcode,
        m.brand_name,
        m.generic_name,
        m.dosage_strength,
        m.dosage_form,
        m.unit_of_measure
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND b.status = ?`;
      params.push(status);
    }
    if (medicine_id) {
      query += ` AND b.medicine_id = ?`;
      params.push(medicine_id);
    }

    query += ` ORDER BY b.expiration_date ASC`;

    const batches = db.prepare(query).all(...params);
    const settings = getSettingsMap();
    const today = new Date();

    const enriched = batches.map(b => {
      const days = calculateDaysToExpiry(b.expiration_date, today);
      return {
        ...b,
        days_to_expiry: days,
        expiry_tier: getExpiryTier(days, settings),
        is_expired: days <= 0
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new batch (direct stock-in)
router.post('/', (req, res) => {
  try {
    const {
      medicine_id,
      batch_number,
      manufacturing_date,
      expiration_date,
      quantity,
      unit_cost,
      selling_price,
      supplier_name,
      reference_no,
      notes
    } = req.body;

    if (!medicine_id || !batch_number || !expiration_date || !quantity) {
      return res.status(400).json({ error: 'Medicine, batch number, expiration date, and quantity are required.' });
    }

    const med = db.prepare('SELECT * FROM medicines WHERE id = ?').get(medicine_id);
    if (!med) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number greater than zero.' });
    }

    const todayStr = getLocalDateString();
    if (expiration_date <= todayStr) {
      return res.status(400).json({ error: 'Expiration date must be in the future. Cannot receive already-expired batches into inventory.' });
    }

    const mfg = manufacturing_date || todayStr;
    if (mfg > todayStr) {
      return res.status(400).json({ error: 'Manufacturing date cannot be in the future.' });
    }
    if (new Date(expiration_date) <= new Date(mfg)) {
      return res.status(400).json({ error: 'Expiration date must be later than manufacturing date.' });
    }

    const cost = parseFloat(unit_cost);
    if (isNaN(cost) || cost <= 0) {
      return res.status(400).json({ error: 'Unit cost is required and must be greater than zero.' });
    }

    const price = parseFloat(selling_price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'Selling price is required and must be greater than zero.' });
    }

    const stmt = db.prepare(`
      INSERT INTO batches (
        medicine_id, batch_number, manufacturing_date, expiration_date,
        initial_quantity, current_quantity, unit_cost, selling_price,
        supplier_name, status, received_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `);

    const result = stmt.run(
      medicine_id,
      batch_number.trim(),
      mfg,
      expiration_date,
      qty,
      qty,
      cost,
      price,
      supplier_name || med.supplier_name || 'Generic Supplier',
      todayStr
    );

    const batchId = result.lastInsertRowid;

    // Record in transactions ledger
    const lastTx = db.prepare('SELECT id FROM transactions ORDER BY id DESC LIMIT 1').get();
    const txCode = `TX-IN-${Date.now()}-${Math.floor(Math.random() * 10000)}-${lastTx ? lastTx.id + 1 : 1}`;

    db.prepare(`
      INSERT INTO transactions (
        transaction_code, transaction_type, medicine_id, batch_id,
        quantity, unit_price, total_amount, reference_no,
        is_override, override_reason, operator_name, notes
      ) VALUES (?, 'stock_in', ?, ?, ?, ?, ?, ?, 0, NULL, 'Lourdes Gincen L. Cesista', ?)
    `).run(
      txCode,
      medicine_id,
      batchId,
      qty,
      cost,
      qty * cost,
      reference_no || 'MANUAL-STOCKIN',
      notes || `Stock-in of batch ${batch_number}`
    );

    logAudit('STOCK_IN', 'BATCH', batchId, {
      medicine: med.brand_name,
      batch_number,
      quantity: qty,
      expiration_date,
      unit_cost: cost
    });

    res.status(201).json({
      id: batchId,
      message: 'Batch registered and stock-in recorded successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Safe Batch Disposal (Expired or Damaged)
router.post('/:id/dispose', (req, res) => {
  try {
    const batchId = req.params.id;
    const { quantity, reason, notes } = req.body;

    const batch = db.prepare(`
      SELECT b.*, m.brand_name, m.generic_name 
      FROM batches b 
      JOIN medicines m ON b.medicine_id = m.id 
      WHERE b.id = ?
    `).get(batchId);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const disposeQty = parseInt(quantity) || batch.current_quantity;
    if (disposeQty <= 0 || disposeQty > batch.current_quantity) {
      return res.status(400).json({ error: 'Invalid disposal quantity' });
    }

    const remaining = batch.current_quantity - disposeQty;
    const newStatus = remaining === 0 ? 'disposed' : batch.status;

    db.prepare(`
      UPDATE batches 
      SET current_quantity = ?, status = ?
      WHERE id = ?
    `).run(remaining, newStatus, batchId);

    // Record in transactions
    const lastTx = db.prepare('SELECT id FROM transactions ORDER BY id DESC LIMIT 1').get();
    const txCode = `TX-DISP-${Date.now()}-${lastTx ? lastTx.id + 1 : 1}`;

    db.prepare(`
      INSERT INTO transactions (
        transaction_code, transaction_type, medicine_id, batch_id,
        quantity, unit_price, total_amount, reference_no,
        is_override, override_reason, operator_name, notes
      ) VALUES (?, 'disposal', ?, ?, ?, ?, ?, ?, 0, NULL, 'Lourdes Gincen L. Cesista', ?)
    `).run(
      txCode,
      batch.medicine_id,
      batchId,
      disposeQty,
      batch.unit_cost,
      disposeQty * batch.unit_cost,
      reason || 'EXPIRED_DISPOSAL',
      notes || `Safe disposal of batch ${batch.batch_number}: ${reason}`
    );

    logAudit('DISPOSAL', 'BATCH', batchId, {
      medicine: batch.brand_name,
      batch_number: batch.batch_number,
      disposed_quantity: disposeQty,
      reason: reason || 'Expired/Damaged',
      notes
    });

    res.json({
      message: 'Batch disposal recorded successfully in inventory and audit trail',
      remaining_quantity: remaining,
      status: newStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update batch cost and selling price (with mandatory audit trail)
router.patch('/:id', (req, res) => {
  try {
    const batchId = req.params.id;
    const { unit_cost, selling_price, reason, operator_name } = req.body;

    const batch = db.prepare(`
      SELECT b.*, m.brand_name, m.generic_name
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.id = ?
    `).get(batchId);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    const newCost = parseFloat(unit_cost);
    const newPrice = parseFloat(selling_price);

    if (isNaN(newCost) || newCost <= 0) {
      return res.status(400).json({ error: 'Unit cost must be a positive number greater than zero.' });
    }
    if (isNaN(newPrice) || newPrice <= 0) {
      return res.status(400).json({ error: 'Selling price must be a positive number greater than zero.' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'A mandatory justification reason is required to adjust batch pricing in the audit trail.' });
    }

    const oldCost = batch.unit_cost;
    const oldPrice = batch.selling_price;

    db.prepare(`
      UPDATE batches
      SET unit_cost = ?, selling_price = ?
      WHERE id = ?
    `).run(newCost, newPrice, batchId);

    logAudit('PRICE_ADJUSTMENT', 'BATCH', batchId, {
      medicine: batch.brand_name,
      batch_number: batch.batch_number,
      old_unit_cost: oldCost,
      new_unit_cost: newCost,
      old_selling_price: oldPrice,
      new_selling_price: newPrice,
      reason: reason.trim()
    }, operator_name || 'Lourdes Gincen L. Cesista');

    res.json({
      message: 'Batch pricing updated successfully and recorded in audit trail.',
      batch_id: batchId,
      unit_cost: newCost,
      selling_price: newPrice
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

