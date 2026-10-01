const assert = require('assert');
const path = require('path');
const { db, calculateDaysToExpiry, getExpiryTier, getSettingsMap } = require('../server/db');
const { seedDatabase } = require('../server/seed');

console.log('--- R.K.A Pharmacy IMS: Verifying Database and Logic Integrity ---');

// 1. Verify Database Initialization & Seed
seedDatabase();
assert.ok(db, 'Database connection must be active');

// 2. Verify Table Existence
const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().map(t => t.name);
const expectedTables = ['medicines', 'batches', 'transactions', 'audit_logs', 'settings', 'purchase_orders'];
for (const t of expectedTables) {
  assert.ok(tables.includes(t), `Table ${t} must exist in the database`);
}
console.log('✓ All core database tables exist.');

// 2b. Verify Query Performance Indexes
const indexes = db.prepare(`SELECT name FROM sqlite_master WHERE type='index'`).all().map(i => i.name);
assert.ok(indexes.includes('idx_batches_med_id'), 'Index idx_batches_med_id must exist');
assert.ok(indexes.includes('idx_po_items_med_id'), 'Index idx_po_items_med_id must exist');
console.log('✓ Performance query indexes verified (idx_batches_med_id, idx_po_items_med_id).');

// 3. Verify Medicine Catalog & Columns (or verify clean wiped state if factory reset)
const wipedSetting = db.prepare("SELECT value FROM settings WHERE key = 'system_wiped'").get();
const isFactoryReset = wipedSetting && wipedSetting.value === 'true';

const med = db.prepare(`SELECT * FROM medicines LIMIT 1`).get();
if (isFactoryReset && !med) {
  console.log('✓ System is in a verified clean Factory Reset state (0 medicines, 0 batches).');
} else {
  assert.ok(med, 'There must be at least one medicine in catalog when populated');
  assert.ok(med.brand_name, 'Medicine must have brand_name');
  assert.ok(med.generic_name, 'Medicine must have generic_name');
  assert.ok(med.dosage_strength, 'Medicine must have dosage_strength');
  assert.ok(med.unit_of_measure, 'Medicine must have unit_of_measure');
  console.log(`✓ Medicine catalog structure verified (sample: ${med.brand_name} - ${med.generic_name} ${med.dosage_strength}).`);
}

// 4. Verify Batch Data & FEFO Sequence Sorting
const batches = db.prepare(`
  SELECT id, medicine_id, batch_number, expiration_date, current_quantity, selling_price, status 
  FROM batches 
  WHERE status = 'active' AND current_quantity > 0
  ORDER BY expiration_date ASC
`).all();

if (isFactoryReset && batches.length === 0) {
  console.log('✓ Verified 0 active batches in clean factory reset state.');
} else {
  assert.ok(batches.length > 0, 'Active batches must exist when populated');
  for (let i = 0; i < batches.length - 1; i++) {
    const currentExp = new Date(batches[i].expiration_date);
    const nextExp = new Date(batches[i + 1].expiration_date);
    assert.ok(currentExp <= nextExp, 'Batches must be strictly sorted by expiration date ascending (FEFO order)');
  }
  console.log(`✓ FEFO ordering verified across ${batches.length} active batches.`);
}

// 5. Verify Expiry Tier and Days Calculation Logic
for (const b of batches.slice(0, 5)) {
  const days = calculateDaysToExpiry(b.expiration_date);
  assert.strictEqual(typeof days, 'number', 'Days difference must be numeric');
  const tier = getExpiryTier(days);
  assert.ok(['Expired', 'Critical', 'Warning', 'Monitor', 'Safe'].includes(tier), 'Tier must be valid');
}
console.log('✓ Expiry tier calculation and day difference verified.');

// 6. Verify Audit Logs Table Schema
const auditLogCols = db.prepare(`PRAGMA table_info(audit_logs)`).all().map(c => c.name);
assert.ok(auditLogCols.includes('operator'), 'audit_logs table must have operator column');
assert.ok(auditLogCols.includes('action'), 'audit_logs table must have action column');
assert.ok(auditLogCols.includes('timestamp'), 'audit_logs table must have timestamp column');
console.log('✓ Audit trail columns verified (operator, action, timestamp).');

// 7. Verify Settings Schema & Defaults
const settingsMap = getSettingsMap();
assert.ok(settingsMap, 'Settings map must exist');
assert.ok(settingsMap.pharmacy_name, 'Pharmacy name must exist in settings');
console.log(`✓ Settings store verified (${settingsMap.pharmacy_name}).`);

// 8. Verify Locale Dictionaries Integrity and Symmetry
const enLocale = require('../client/src/i18n/locales/en.json');
const filLocale = require('../client/src/i18n/locales/fil.json');
const taglishLocale = require('../client/src/i18n/locales/taglish.json');

const enKeys = Object.keys(enLocale);
const filKeys = Object.keys(filLocale);
const taglishKeys = Object.keys(taglishLocale);

assert.ok(enKeys.length > 1000, `en.json must contain master dictionary keys (found ${enKeys.length})`);
assert.strictEqual(enKeys.length, filKeys.length, `fil.json count (${filKeys.length}) must match en.json (${enKeys.length})`);
assert.strictEqual(enKeys.length, taglishKeys.length, `taglish.json count (${taglishKeys.length}) must match en.json (${enKeys.length})`);

const missingFil = enKeys.filter(k => typeof filLocale[k] !== 'string');
const missingTag = enKeys.filter(k => typeof taglishLocale[k] !== 'string');

assert.strictEqual(missingFil.length, 0, `Missing Filipino keys: ${missingFil.slice(0, 5).join(', ')}`);
assert.strictEqual(missingTag.length, 0, `Missing Taglish keys: ${missingTag.slice(0, 5).join(', ')}`);
console.log(`✓ Modular locale dictionaries verified (en: ${enKeys.length}, fil: ${filKeys.length}, taglish: ${taglishKeys.length} keys, 100% symmetric).`);

console.log('\n========================================');
console.log(' ALL INTEGRITY CHECKS PASSED SUCCESSFULLY ');
console.log('========================================');
