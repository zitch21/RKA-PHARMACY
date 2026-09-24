const express = require('express');
const router = express.Router();
const { db, logAudit, getLocalDateString } = require('../db');

// GET all transactions with filtering
router.get('/', (req, res) => {
  try {
    const { type, medicine_id, limit = 100, page = 1 } = req.query;
    let query = `
      SELECT 
        t.*,
        m.code as medicine_code,
        m.brand_name,
        m.generic_name,
        m.dosage_strength,
        m.dosage_form,
        b.batch_number,
        b.expiration_date
      FROM transactions t
      JOIN medicines m ON t.medicine_id = m.id
      LEFT JOIN batches b ON t.batch_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      query += ` AND t.transaction_type = ?`;
      params.push(type);
    }
    if (medicine_id) {
      query += ` AND t.medicine_id = ?`;
      params.push(medicine_id);
    }

    query += ` ORDER BY t.created_at DESC, t.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const transactions = db.prepare(query).all(...params);

    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM transactions WHERE 1=1
      ${type ? 'AND transaction_type = ?' : ''}
      ${medicine_id ? 'AND medicine_id = ?' : ''}
    `).get(...[type, medicine_id].filter(Boolean)).count;

    res.json({
      transactions,
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST stock-out (Dispensing / Sales)
// Supports single or batch items
router.post('/stock-out', (req, res) => {
  try {
    const { items, reference_no, notes, operator_name = 'Lourdes Gincen L. Cesista' } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one item to dispense.' });
    }

    const todayStr = getLocalDateString();
    const today = new Date();

    const processStockOut = db.transaction((dispenseItems) => {
      const processedTransactions = [];
      const receiptNo = reference_no || `RCPT-${Date.now().toString().slice(-6)}`;

      for (const item of dispenseItems) {
        let { medicine_id, batch_id, quantity, override_reason, status_confirmed, expiry_status } = item;
        const qtyToDispense = parseInt(quantity);

        if (!medicine_id && batch_id) {
          const bRow = db.prepare('SELECT medicine_id FROM batches WHERE id = ?').get(batch_id);
          if (bRow) medicine_id = bRow.medicine_id;
        }

        if (!medicine_id || qtyToDispense <= 0) {
          throw new Error('Invalid item or quantity specified.');
        }

        const med = db.prepare('SELECT * FROM medicines WHERE id = ?').get(medicine_id);
        if (!med) {
          throw new Error(`Medicine with ID ${medicine_id} not found.`);
        }

        // Fetch all active unexpired batches for this medicine sorted by expiration date (FEFO)
        const activeBatches = db.prepare(`
          SELECT * FROM batches
          WHERE medicine_id = ? AND status = 'active' AND current_quantity > 0
          ORDER BY expiration_date ASC
        `).all(medicine_id);

        if (activeBatches.length === 0) {
          throw new Error(`No available stock for ${med.brand_name} (${med.generic_name}).`);
        }

        // Determine earliest valid FEFO batch
        const unexpiredBatches = activeBatches.filter(b => b.expiration_date > todayStr);
        if (unexpiredBatches.length === 0) {
          throw new Error(`All remaining batches for ${med.brand_name} are expired. Cannot dispense expired stock!`);
        }

        const fefoBatch = unexpiredBatches[0];
        let isOverride = 0;
        let finalReason = null;
        const allocations = [];

        // Check if user explicitly selected a non-FEFO batch (Manual Override)
        if (batch_id) {
          const selectedBatch = db.prepare('SELECT * FROM batches WHERE id = ?').get(batch_id);
          if (!selectedBatch) {
            throw new Error(`Selected batch ${batch_id} not found.`);
          }

          // Strict block on expired batches (Expired <= 0 days -> Blocked from release)
          if (selectedBatch.expiration_date <= todayStr) {
            throw new Error(`Batch ${selectedBatch.batch_number} expired on ${selectedBatch.expiration_date} and is BLOCKED from release!`);
          }

          if (selectedBatch.id !== fefoBatch.id) {
            // User selected non-FEFO batch -> requires override justification
            if (!override_reason || override_reason.trim() === '') {
              throw new Error(
                `Override required: Batch ${selectedBatch.batch_number} is not the earliest-expiring batch (Earliest is ${fefoBatch.batch_number}, exp: ${fefoBatch.expiration_date}). Please provide an override reason.`
              );
            }
            if (selectedBatch.current_quantity < qtyToDispense) {
              throw new Error(`Batch ${selectedBatch.batch_number} only has ${selectedBatch.current_quantity} units available.`);
            }
            isOverride = 1;
            finalReason = override_reason.trim();
            allocations.push({ batch: selectedBatch, qty: qtyToDispense });
          }
        }

        // Standard FEFO workflow (Auto-assigned or earliest batch selected):
        // Issue from the earliest batch; if not enough, proceed with the next batch until requested quantity is filled
        if (allocations.length === 0) {
          const totalAvailable = unexpiredBatches.reduce((acc, b) => acc + b.current_quantity, 0);
          if (totalAvailable < qtyToDispense) {
            throw new Error(`Insufficient stock for ${med.brand_name}. Requested ${qtyToDispense} units, but only ${totalAvailable} available across all unexpired batches.`);
          }

          let remainingNeeded = qtyToDispense;
          for (const b of unexpiredBatches) {
            if (remainingNeeded <= 0) break;
            const take = Math.min(b.current_quantity, remainingNeeded);
            if (take > 0) {
              allocations.push({ batch: b, qty: take });
              remainingNeeded -= take;
            }
          }
        }

        // Process each batch allocation
        for (const alloc of allocations) {
          const targetBatch = alloc.batch;
          const allocQty = alloc.qty;
          const remainingQty = targetBatch.current_quantity - allocQty;
          const newStatus = remainingQty === 0 ? 'consumed' : 'active';

          // Update batch stock
          db.prepare(`
            UPDATE batches 
            SET current_quantity = ?, status = ?
            WHERE id = ?
          `).run(remainingQty, newStatus, targetBatch.id);

          // Record transaction - POS Price Lockdown: strictly enforce approved batch selling price
          const lastTx = db.prepare('SELECT id FROM transactions ORDER BY id DESC LIMIT 1').get();
          const txCode = `TX-OUT-${Date.now()}-${Math.floor(Math.random() * 10000)}-${lastTx ? lastTx.id + 1 : 1}`;
          const unitPrice = parseFloat(targetBatch.selling_price);
          if (isNaN(unitPrice) || unitPrice <= 0) {
            throw new Error(`Batch ${targetBatch.batch_number} does not have a valid selling price configured.`);
          }
          const totalAmount = allocQty * unitPrice;

          db.prepare(`
            INSERT INTO transactions (
              transaction_code, transaction_type, medicine_id, batch_id,
              quantity, unit_price, total_amount, reference_no,
              is_override, override_reason, operator_name, notes
            ) VALUES (?, 'stock_out', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            txCode,
            medicine_id,
            targetBatch.id,
            allocQty,
            unitPrice,
            totalAmount,
            receiptNo,
            isOverride,
            finalReason,
            operator_name,
            notes || (allocations.length > 1 ? `Multi-batch FEFO split (${targetBatch.batch_number})` : 'Clinic stock-out')
          );

          // Record audit log
          logAudit(
            isOverride ? 'STOCK_OUT_OVERRIDE' : 'STOCK_OUT',
            'TRANSACTION',
            txCode,
            {
              receipt_no: receiptNo,
              medicine: med.brand_name,
              batch_number: targetBatch.batch_number,
              quantity: allocQty,
              unit_price: unitPrice,
              total_amount: totalAmount,
              is_override: isOverride === 1,
              override_reason: finalReason,
              status_confirmed: !!status_confirmed,
              expiry_status: expiry_status || null,
              remaining_batch_qty: remainingQty,
              is_multi_batch_split: allocations.length > 1
            },
            operator_name
          );

          processedTransactions.push({
            tx_code: txCode,
            medicine: med.brand_name,
            batch_number: targetBatch.batch_number,
            quantity: allocQty,
            unit_price: unitPrice,
            total_amount: totalAmount,
            is_override: isOverride === 1,
            override_reason: finalReason
          });
        }
      }

      return { receipt_no: receiptNo, transactions: processedTransactions };
    });

    const result = processStockOut(items);
    res.status(201).json({
      message: 'Dispensing completed successfully',
      ...result
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST Stock Adjustment (Count reconciliation or damage)
router.post('/adjustment', (req, res) => {
  try {
    const { batch_id, actual_quantity, reason, notes, operator_name = 'Lourdes Gincen L. Cesista' } = req.body || {};

    if (!batch_id || actual_quantity === undefined || !reason) {
      return res.status(400).json({ error: 'Batch ID, actual quantity, and reason are required.' });
    }

    const batch = db.prepare(`
      SELECT b.*, m.brand_name, m.generic_name 
      FROM batches b 
      JOIN medicines m ON b.medicine_id = m.id 
      WHERE b.id = ?
    `).get(batch_id);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const newQty = parseInt(actual_quantity);
    if (newQty < 0) {
      return res.status(400).json({ error: 'Actual quantity cannot be negative.' });
    }

    const diff = newQty - batch.current_quantity;
    if (diff === 0) {
      return res.json({ message: 'No adjustment needed. Current quantity matches actual quantity.' });
    }

    const todayStr = getLocalDateString();
    const isExpired = batch.expiration_date <= todayStr;
    const newStatus = newQty === 0 
      ? 'consumed' 
      : (isExpired ? 'expired' : (batch.status === 'consumed' ? 'active' : batch.status));

    db.prepare('UPDATE batches SET current_quantity = ?, status = ? WHERE id = ?').run(newQty, newStatus, batch_id);

    const lastTx = db.prepare('SELECT id FROM transactions ORDER BY id DESC LIMIT 1').get();
    const txCode = `TX-ADJ-${Date.now()}-${Math.floor(Math.random() * 10000)}-${lastTx ? lastTx.id + 1 : 1}`;

    db.prepare(`
      INSERT INTO transactions (
        transaction_code, transaction_type, medicine_id, batch_id,
        quantity, unit_price, total_amount, reference_no,
        is_override, override_reason, operator_name, notes
      ) VALUES (?, 'stock_adjustment', ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)
    `).run(
      txCode,
      batch.medicine_id,
      batch_id,
      Math.abs(diff),
      batch.unit_cost,
      Math.abs(diff) * batch.unit_cost,
      reason,
      operator_name,
      notes || `Stock adjusted from ${batch.current_quantity} to ${newQty} (difference: ${diff > 0 ? '+' : ''}${diff})`
    );

    logAudit(
      'STOCK_ADJUSTMENT',
      'BATCH',
      batch_id,
      {
        medicine: batch.brand_name,
        batch_number: batch.batch_number,
        previous_quantity: batch.current_quantity,
        new_quantity: newQty,
        difference: diff,
        reason,
        notes
      },
      operator_name
    );

    res.json({
      message: 'Stock adjustment saved successfully',
      batch_id,
      previous_quantity: batch.current_quantity,
      new_quantity: newQty,
      difference: diff
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
