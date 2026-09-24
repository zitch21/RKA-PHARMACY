const express = require('express');
const router = express.Router();
const { db, logAudit, getLocalDateString, calculateDaysToExpiry, getSettingsMap } = require('../db');

// Generate unique PO number: PO-YYYYMMDD-XXXX
function generatePoNumber() {
  const dateStr = getLocalDateString().replace(/-/g, '');
  const countRow = db.prepare(`
    SELECT COUNT(*) as count FROM purchase_orders 
    WHERE po_number LIKE ?
  `).get(`PO-${dateStr}-%`);
  const seq = (countRow ? countRow.count : 0) + 1;
  return `PO-${dateStr}-${String(seq).padStart(4, '0')}`;
}

// GET all purchase orders with items and medicine details
router.get('/', (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    let query = `SELECT * FROM purchase_orders WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const orders = db.prepare(query).all(...params);

    // Prepare statement once outside mapping loop for high-throughput efficiency
    const getItemsStmt = db.prepare(`
      SELECT 
        poi.*,
        m.code as medicine_code,
        m.barcode as medicine_barcode,
        m.brand_name,
        m.generic_name,
        m.dosage_strength,
        m.dosage_form,
        m.unit_of_measure,
        m.supplier_name as medicine_supplier
      FROM purchase_order_items poi
      JOIN medicines m ON poi.medicine_id = m.id
      WHERE poi.po_id = ?
      ORDER BY poi.id ASC
    `);

    // Attach items to each purchase order
    const enrichedOrders = orders.map(po => {
      const items = getItemsStmt.all(po.id);

      return {
        ...po,
        total_cost: po.total_amount,
        operator_name: po.created_by,
        items
      };
    });

    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM purchase_orders WHERE 1=1
      ${status && status !== 'all' ? 'AND status = ?' : ''}
    `).get(...(status && status !== 'all' ? [status] : [])).count;

    res.json({
      orders: enrichedOrders,
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET replenishment recommendations for creating POs
router.get('/recommendations', (req, res) => {
  try {
    const todayStr = getLocalDateString();
    const settings = getSettingsMap();
    const rawWindow = parseInt(settings.forecasting_window_days || settings.history_days_fefo_plus || '30', 10);
    const validWindows = [10, 20, 30];
    const N = validWindows.includes(rawWindow) ? rawWindow : 30;

    // Check history span
    const historyStats = db.prepare(`
      SELECT MIN(DATE(created_at)) as oldest_tx FROM transactions WHERE transaction_type = 'stock_out'
    `).get();

    let totalHistorySpanDays = 0;
    if (historyStats && historyStats.oldest_tx) {
      totalHistorySpanDays = Math.max(1, Math.abs(calculateDaysToExpiry(historyStats.oldest_tx, new Date())));
    }
    const isColdStart = totalHistorySpanDays < N;

    // Fetch all medicines with current unexpired stock
    const medicines = db.prepare(`
      SELECT 
        m.*,
        COALESCE(SUM(CASE WHEN b.status = 'active' AND b.current_quantity > 0 AND b.expiration_date > ? THEN b.current_quantity ELSE 0 END), 0) as total_stock
      FROM medicines m
      LEFT JOIN batches b ON m.id = b.medicine_id
      GROUP BY m.id
      ORDER BY m.brand_name ASC
    `).all(todayStr);

    const recommendations = [];

    // Prepare statements outside loop for optimal query plan reuse
    const salesQueryStmt = !isColdStart ? db.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as total_sold
      FROM transactions
      WHERE medicine_id = ? AND transaction_type = 'stock_out'
        AND created_at >= DATE('now', '-' || ? || ' days')
    `) : null;

    const latestBatchStmt = db.prepare(`
      SELECT unit_cost, selling_price FROM batches WHERE medicine_id = ? ORDER BY id DESC LIMIT 1
    `);

    for (const med of medicines) {
      const leadTime = med.supplier_lead_time_days || 5;
      const bufferDays = med.buffer_days || parseInt(settings.default_buffer_days || '3', 10) || 3;

      let effectiveThreshold = med.reorder_threshold;
      let adqs = 0;
      let suggestedPurchaseQty = 0;
      let needsReorder = false;

      if (!isColdStart && salesQueryStmt) {
        // Calculate moving average over N days
        const salesQuery = salesQueryStmt.get(med.id, N);

        const totalSold = salesQuery ? salesQuery.total_sold : 0;
        adqs = parseFloat((totalSold / N).toFixed(2));
        effectiveThreshold = adqs > 0 
          ? Math.ceil(adqs * (leadTime + bufferDays))
          : (med.reorder_threshold || 20);

        needsReorder = med.total_stock <= effectiveThreshold;
        if (needsReorder) {
          suggestedPurchaseQty = Math.max(1, Math.ceil((effectiveThreshold * 2) - med.total_stock));
        }
      } else {
        // Cold-Start: use manual threshold
        needsReorder = med.total_stock <= med.reorder_threshold;
        if (needsReorder) {
          suggestedPurchaseQty = Math.max(1, (med.reorder_threshold * 2) - med.total_stock);
        }
      }

      // Check if medicine has a recent unit cost for estimate
      const latestBatch = latestBatchStmt.get(med.id);

      const estimatedCost = latestBatch ? latestBatch.unit_cost : 10.0;

      if (needsReorder) {
        recommendations.push({
          medicine_id: med.id,
          code: med.code,
          barcode: med.barcode,
          brand_name: med.brand_name,
          generic_name: med.generic_name,
          dosage_strength: med.dosage_strength,
          dosage_form: med.dosage_form,
          unit_of_measure: med.unit_of_measure,
          supplier_name: med.supplier_name || 'Generic Supplier',
          total_stock: med.total_stock,
          reorder_threshold: effectiveThreshold,
          manual_threshold: med.reorder_threshold,
          adqs: isColdStart ? null : adqs,
          is_cold_start: isColdStart,
          suggested_quantity: suggestedPurchaseQty,
          estimated_unit_cost: estimatedCost,
          estimated_total_cost: parseFloat((suggestedPurchaseQty * estimatedCost).toFixed(2))
        });
      }
    }

    res.json({
      is_cold_start: isColdStart,
      forecasting_window_days: N,
      recommendations_count: recommendations.length,
      recommendations
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single PO by ID with items
router.get('/:id', (req, res) => {
  try {
    const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    const items = db.prepare(`
      SELECT 
        poi.*,
        m.code as medicine_code,
        m.barcode as medicine_barcode,
        m.brand_name,
        m.generic_name,
        m.dosage_strength,
        m.dosage_form,
        m.unit_of_measure
      FROM purchase_order_items poi
      JOIN medicines m ON poi.medicine_id = m.id
      WHERE poi.po_id = ?
      ORDER BY poi.id ASC
    `).all(po.id);

    res.json({
      ...po,
      total_cost: po.total_amount,
      operator_name: po.created_by,
      items
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create internal purchase order (Status: Draft)
router.post('/', (req, res) => {
  try {
    const {
      supplier_name,
      items,
      notes,
      operator_name = 'Lourdes Gincen L. Cesista'
    } = req.body || {};

    if (!supplier_name || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Supplier name and at least one order line item are required.' });
    }

    const todayStr = getLocalDateString();
    const poNumber = generatePoNumber();

    const createPoTx = db.transaction((orderItems) => {
      let totalAmount = 0;
      for (const item of orderItems) {
        const qty = parseInt(item.quantity_ordered);
        const cost = parseFloat(item.unit_cost);
        if (isNaN(qty) || qty <= 0 || isNaN(cost) || cost <= 0) {
          throw new Error('All order items must have positive quantity and unit cost.');
        }
        totalAmount += qty * cost;
      }

      const insertPo = db.prepare(`
        INSERT INTO purchase_orders (
          po_number, supplier_name, status, order_date, total_amount, notes, created_by
        ) VALUES (?, ?, 'draft', ?, ?, ?, ?)
      `);
      const poResult = insertPo.run(
        poNumber,
        supplier_name.trim(),
        todayStr,
        totalAmount,
        notes || '',
        operator_name
      );
      const poId = poResult.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO purchase_order_items (
          po_id, medicine_id, quantity_ordered, quantity_received, unit_cost, total_cost, status, notes
        ) VALUES (?, ?, ?, 0, ?, ?, 'pending', ?)
      `);

      for (const item of orderItems) {
        const qty = parseInt(item.quantity_ordered);
        const cost = parseFloat(item.unit_cost);
        insertItem.run(poId, item.medicine_id, qty, cost, qty * cost, item.notes || '');
      }

      logAudit(
        'CREATE_PURCHASE_ORDER',
        'PURCHASE_ORDER',
        poId,
        {
          po_number: poNumber,
          supplier_name,
          items_count: orderItems.length,
          total_amount: totalAmount,
          status: 'draft'
        },
        operator_name
      );

      return { id: poId, po_number: poNumber, total_amount: totalAmount };
    });

    const result = createPoTx(items);
    res.status(201).json({
      message: `Purchase Order ${result.po_number} created with status 'Draft'.`,
      po: result
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH place purchase order (Draft -> Placed)
router.patch('/:id/place', (req, res) => {
  try {
    const poId = req.params.id;
    const { operator_name = 'Lourdes Gincen L. Cesista', notes } = req.body || {};

    const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(poId);
    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    if (po.status !== 'draft') {
      return res.status(400).json({ error: `Cannot place order with status '${po.status}'. Only 'draft' orders can be placed.` });
    }

    const todayStr = getLocalDateString();
    db.prepare(`
      UPDATE purchase_orders 
      SET status = 'placed', placed_date = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(todayStr, notes || po.notes, poId);

    logAudit(
      'PLACE_PURCHASE_ORDER',
      'PURCHASE_ORDER',
      poId,
      {
        po_number: po.po_number,
        supplier: po.supplier_name,
        placed_date: todayStr,
        previous_status: 'draft',
        new_status: 'placed'
      },
      operator_name
    );

    res.json({
      message: `Purchase Order ${po.po_number} placed with supplier on ${todayStr}.`,
      status: 'placed',
      placed_date: todayStr
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST receive delivery against a placed purchase order (Placed -> Received / Partially_Received)
// Converts received quantities into physical batch stock-in records automatically!
router.post('/:id/receive', (req, res) => {
  try {
    const poId = req.params.id;
    const {
      deliveries, // array of { item_id, quantity_received, batch_number, manufacturing_date, expiration_date, unit_cost, selling_price }
      received_items,
      operator_name = 'Lourdes Gincen L. Cesista',
      delivery_notes
    } = req.body || {};

    const itemsToReceive = (deliveries && Array.isArray(deliveries) && deliveries.length > 0)
      ? deliveries
      : (received_items && Array.isArray(received_items) && received_items.length > 0)
        ? received_items
        : null;

    if (!itemsToReceive || itemsToReceive.length === 0) {
      return res.status(400).json({ error: 'Please specify received delivery items with batch and expiry details.' });
    }

    const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(poId);
    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    if (po.status !== 'placed' && po.status !== 'partially_received') {
      return res.status(400).json({
        error: `Cannot receive delivery for order with status '${po.status}'. Order must be 'placed' or 'partially_received'.`
      });
    }

    const todayStr = getLocalDateString();

    const receiveTx = db.transaction((deliveryList) => {
      const createdBatches = [];

      for (const del of deliveryList) {
        const { batch_number, manufacturing_date, expiration_date, unit_cost, selling_price } = del;
        const targetItemId = del.item_id ?? del.po_item_id ?? del.id;
        const rawQty = del.quantity_received !== undefined ? del.quantity_received : del.quantity_to_receive;
        const qtyReceived = parseInt(rawQty);

        if (isNaN(qtyReceived) || qtyReceived <= 0) continue; // skip zero/unreceived lines

        if (!batch_number || !expiration_date) {
          throw new Error('Batch number and expiration date are required for all received items.');
        }

        if (expiration_date <= todayStr) {
          throw new Error(`Cannot receive expired batch (${batch_number} expires on ${expiration_date}). Expiration date must be in the future.`);
        }

        let item = null;
        if (targetItemId) {
          item = db.prepare('SELECT * FROM purchase_order_items WHERE id = ? AND po_id = ?').get(targetItemId, poId);
        }
        if (!item && del.medicine_id) {
          item = db.prepare('SELECT * FROM purchase_order_items WHERE medicine_id = ? AND po_id = ?').get(del.medicine_id, poId);
        }
        if (!item) {
          throw new Error(`Order line item with ID ${targetItemId || del.medicine_id} not found in this Purchase Order.`);
        }

        const med = db.prepare('SELECT * FROM medicines WHERE id = ?').get(item.medicine_id);
        const cost = parseFloat(unit_cost) || item.unit_cost;
        const price = parseFloat(selling_price) || (cost * 1.4); // fallback 40% markup if unset

        // 1. Insert into batches
        const insertBatch = db.prepare(`
          INSERT INTO batches (
            medicine_id, batch_number, manufacturing_date, expiration_date,
            initial_quantity, current_quantity, unit_cost, selling_price,
            supplier_name, status, received_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        `);

        const bRes = insertBatch.run(
          med.id,
          batch_number.trim(),
          manufacturing_date || todayStr,
          expiration_date,
          qtyReceived,
          qtyReceived,
          cost,
          price,
          po.supplier_name,
          todayStr
        );
        const newBatchId = bRes.lastInsertRowid;

        // 2. Insert stock_in transaction linked to PO
        const lastTx = db.prepare('SELECT id FROM transactions ORDER BY id DESC LIMIT 1').get();
        const txCode = `TX-POIN-${Date.now()}-${Math.floor(Math.random() * 10000)}-${lastTx ? lastTx.id + 1 : 1}`;

        db.prepare(`
          INSERT INTO transactions (
            transaction_code, transaction_type, medicine_id, batch_id,
            quantity, unit_price, total_amount, reference_no,
            is_override, override_reason, operator_name, notes
          ) VALUES (?, 'stock_in', ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)
        `).run(
          txCode,
          med.id,
          newBatchId,
          qtyReceived,
          cost,
          qtyReceived * cost,
          po.po_number,
          operator_name,
          `Stock-in from Purchase Order ${po.po_number}: Batch ${batch_number}`
        );

        // 3. Update purchase_order_items received quantity
        const newTotalReceived = item.quantity_received + qtyReceived;
        const newItemStatus = newTotalReceived >= item.quantity_ordered ? 'received' : 'partial';

        db.prepare(`
          UPDATE purchase_order_items
          SET quantity_received = ?, status = ?
          WHERE id = ?
        `).run(newTotalReceived, newItemStatus, item.id);

        createdBatches.push({
          batch_id: newBatchId,
          medicine: med.brand_name,
          batch_number,
          quantity_received: qtyReceived,
          expiration_date
        });
      }

      // Check overall PO status
      const allItems = db.prepare('SELECT * FROM purchase_order_items WHERE po_id = ?').all(poId);
      const isFullyReceived = allItems.every(i => i.quantity_received >= i.quantity_ordered || i.status === 'cancelled');
      const newPoStatus = isFullyReceived ? 'received' : 'partially_received';

      db.prepare(`
        UPDATE purchase_orders
        SET status = ?, received_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newPoStatus, todayStr, poId);

      logAudit(
        'RECEIVE_PURCHASE_ORDER_DELIVERY',
        'PURCHASE_ORDER',
        poId,
        {
          po_number: po.po_number,
          received_batches: createdBatches,
          new_status: newPoStatus,
          is_fully_received: isFullyReceived,
          delivery_notes: delivery_notes || ''
        },
        operator_name
      );

      return { new_status: newPoStatus, created_batches: createdBatches };
    });

    const result = receiveTx(itemsToReceive);
    res.status(200).json({
      message: `Delivery successfully processed. Received stock converted to active inventory batches for ${po.po_number}.`,
      po_status: result.new_status,
      new_status: result.new_status,
      created_batches: result.created_batches
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH cancel outstanding balance on a purchase order (with mandatory justification reason)
router.patch('/:id/cancel-outstanding', (req, res) => {
  try {
    const poId = req.params.id;
    const { cancellation_reason, operator_name = 'Lourdes Gincen L. Cesista' } = req.body || {};

    if (!cancellation_reason || cancellation_reason.trim() === '') {
      return res.status(400).json({ error: 'A mandatory reason is required to cancel outstanding purchase order balances.' });
    }

    const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(poId);
    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    if (po.status !== 'placed' && po.status !== 'partially_received') {
      return res.status(400).json({ error: `Cannot cancel outstanding lines for order with status '${po.status}'.` });
    }

    const cancelTx = db.transaction(() => {
      // Mark unfulfilled items as cancelled
      db.prepare(`
        UPDATE purchase_order_items
        SET status = 'cancelled'
        WHERE po_id = ? AND quantity_received < quantity_ordered
      `).run(poId);

      // Determine final status
      const hasAnyReceived = db.prepare(`
        SELECT COUNT(*) as count FROM purchase_order_items 
        WHERE po_id = ? AND quantity_received > 0
      `).get(poId).count > 0;

      const finalStatus = hasAnyReceived ? 'received' : 'cancelled';

      db.prepare(`
        UPDATE purchase_orders
        SET status = ?, cancellation_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(finalStatus, cancellation_reason.trim(), poId);

      logAudit(
        'CANCEL_PURCHASE_ORDER_OUTSTANDING',
        'PURCHASE_ORDER',
        poId,
        {
          po_number: po.po_number,
          previous_status: po.status,
          final_status: finalStatus,
          cancellation_reason: cancellation_reason.trim()
        },
        operator_name
      );

      return { final_status: finalStatus };
    });

    const result = cancelTx();
    res.json({
      message: `Outstanding balance on ${po.po_number} closed with reason: "${cancellation_reason.trim()}".`,
      status: result.final_status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE draft purchase order
router.delete('/:id', (req, res) => {
  try {
    const poId = req.params.id;
    const operator = req.query.operator || 'Lourdes Gincen L. Cesista';

    const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(poId);
    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    if (po.status !== 'draft') {
      return res.status(400).json({
        error: `Cannot delete order ${po.po_number} with status '${po.status}'. Only 'draft' orders may be removed.`
      });
    }

    db.prepare('DELETE FROM purchase_orders WHERE id = ?').run(poId);

    logAudit(
      'DELETE_PURCHASE_ORDER_DRAFT',
      'PURCHASE_ORDER',
      poId,
      { po_number: po.po_number, deleted_order: po },
      operator
    );

    res.json({ message: `Draft purchase order ${po.po_number} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
