const path = require('path');
const fs = require('fs');
const serverDbPath = fs.existsSync(path.join(__dirname, 'server', 'db.js'))
  ? path.join(__dirname, 'server', 'db')
  : path.join(__dirname, '..', 'server', 'db');
const { db, getLocalDateString } = require(serverDbPath);

console.log('=== SYSTEM & DATABASE HEALTH AUDIT ===\n');

// 1. SQLite Pragma Checks
console.log('1. SQLite Integrity & Foreign Keys:');
const integrity = db.pragma('integrity_check');
console.log('  integrity_check:', integrity);

const fk = db.pragma('foreign_key_check');
console.log('  foreign_key_check:', fk.length === 0 ? 'CLEAN (0 violations)' : fk);

// 2. Batches & Stock Levels
console.log('\n2. Batches & Stock Levels:');
const todayStr = getLocalDateString();
const batchCounts = db.prepare(`
  SELECT 
    COUNT(*) as total_batches,
    SUM(CASE WHEN status = 'active' AND current_quantity > 0 THEN current_quantity ELSE 0 END) as total_active_units,
    SUM(CASE WHEN current_quantity < 0 THEN 1 ELSE 0 END) as negative_quantity_batches,
    SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as marked_expired_batches
  FROM batches
`).get();
console.log('  Batch Summary:', batchCounts);

// Check if any active batch has expiration_date <= todayStr but status is still 'active'
const overdueActiveBatches = db.prepare(`
  SELECT id, batch_number, expiration_date, status, current_quantity
  FROM batches
  WHERE status = 'active' AND expiration_date <= ?
`).all(todayStr);
console.log('  Overdue batches still marked active:', overdueActiveBatches.length === 0 ? 'CLEAN (0)' : overdueActiveBatches);

// 3. Batch Expiry Date Formatting Validity
console.log('\n3. Batch Expiration Date Formatting:');
const badDates = db.prepare(`
  SELECT id, batch_number, expiration_date
  FROM batches
  WHERE expiration_date IS NULL
     OR expiration_date NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
`).all();
console.log('  Malformed expiration dates:', badDates.length === 0 ? 'CLEAN (0)' : badDates);

// 4. Purchase Orders State & Data Consistency
console.log('\n4. Purchase Orders Consistency:');
const pos = db.prepare('SELECT id, po_number, status, total_amount FROM purchase_orders').all();
console.log(`  Total Purchase Orders in DB: ${pos.length}`);
console.log('  POs found:', pos);

const orphanedItems = db.prepare(`
  SELECT poi.id, poi.po_id
  FROM purchase_order_items poi
  LEFT JOIN purchase_orders po ON poi.po_id = po.id
  WHERE po.id IS NULL
`).all();
console.log('  Orphaned PO items:', orphanedItems.length === 0 ? 'CLEAN (0)' : orphanedItems);

const poMathMismatches = db.prepare(`
  SELECT po.id, po.po_number, po.total_amount,
         COALESCE(SUM(poi.total_cost), 0) AS calculated_items_total
  FROM purchase_orders po
  LEFT JOIN purchase_order_items poi ON po.id = poi.po_id
  GROUP BY po.id
  HAVING ROUND(po.total_amount, 2) != ROUND(COALESCE(SUM(poi.total_cost), 0), 2)
`).all();
console.log('  PO total_amount vs items sum mismatches:', poMathMismatches.length === 0 ? 'CLEAN (0)' : poMathMismatches);

// 5. Transaction Records Consistency
console.log('\n5. Transaction History Consistency:');
const txStats = db.prepare(`
  SELECT 
    transaction_type,
    COUNT(*) as count,
    SUM(quantity) as total_quantity
  FROM transactions
  GROUP BY transaction_type
`).all();
console.log('  Transactions summary:', txStats);

const orphanedTx = db.prepare(`
  SELECT t.id, t.reference_no, t.batch_id
  FROM transactions t
  LEFT JOIN batches b ON t.batch_id = b.id
  WHERE b.id IS NULL
`).all();
console.log('  Transactions referencing non-existent batch:', orphanedTx.length === 0 ? 'CLEAN (0)' : orphanedTx);

// 6. Audit Trail Check
console.log('\n6. Audit Trail Status:');
const auditCount = db.prepare('SELECT count(*) as count FROM audit_logs').get();
const latestAudit = db.prepare('SELECT action, operator, timestamp FROM audit_logs ORDER BY id DESC LIMIT 5').all();
console.log(`  Total audit entries: ${auditCount.count}`);
console.log('  Latest 5 audit actions:', latestAudit);

// 7. System Settings Check
console.log('\n7. System Settings Check:');
const allSettings = db.prepare('SELECT key, value FROM settings').all();
console.log('  Configured Settings:', allSettings);
