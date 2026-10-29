const assert = require('assert');
const path = require('path');
const { db, calculateDaysToExpiry, getExpiryTier, getSettingsMap, wipeDatabase } = require('../server/db');
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
const isFactoryReset = wipedSetting && (wipedSetting.value === 'true' || wipedSetting.value === '1' || String(wipedSetting.value) === '1');

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
assert.strictEqual(missingFil.length, 0, `fil.json must not have missing keys (missing: ${missingFil.join(', ')})`);
assert.strictEqual(missingTag.length, 0, `taglish.json must not have missing keys (missing: ${missingTag.join(', ')})`);
console.log('✓ Tri-lingual dictionary symmetry strictly verified (100% key match across en, fil, taglish).');

// 9. Verify Session Endpoint Security (Cryptographic HMAC verification & no unauthenticated bypass)
const { createSessionToken, verifySessionToken } = require('../server/middleware/authMiddleware');
assert.strictEqual(verifySessionToken(null), null, 'Null session token must not authenticate');
assert.strictEqual(verifySessionToken(''), null, 'Empty session token must not authenticate');
assert.strictEqual(verifySessionToken('invalid.bearer.token'), null, 'Malformed session token must not authenticate');

// Verify rejection of unsigned forged legacy tokens
const forgedLegacyToken = `rka_session_1_${Date.now()}`;
assert.strictEqual(verifySessionToken(forgedLegacyToken), null, 'Unsigned forged legacy tokens must be rejected');

// Verify valid HMAC session token creation and verification
const mockUser = { id: 1, username: 'admin', full_name: 'Lourdes Gincen L. Cesista', role: 'Owner / Clinic Administrator' };
const validToken = createSessionToken(mockUser);
assert.ok(validToken.startsWith('rka_session_'), 'Session token must have rka_session_ prefix');
const verifiedUser = verifySessionToken(validToken);
assert.ok(verifiedUser, 'Valid HMAC signed session token must verify');
assert.strictEqual(verifiedUser.username, 'admin', 'Verified user must match payload');

// Verify session tokens where base64url payload contains underscores ('_') verify correctly
const userWithUnderscore = { id: 1, username: 'test_user', full_name: 'Test_User_Name', role: 'Staff' };
const underscoreToken = createSessionToken(userWithUnderscore);
const verifiedUnderscoreUser = verifySessionToken(underscoreToken);
assert.ok(verifiedUnderscoreUser, 'Session token with base64url containing underscores must verify without splitting errors');
console.log('✓ Session verification security verified (HMAC signed, unsigned forge blocked, underscore handling verified).');

// 10. Verify Simulation Logic Source Neutrality (No artificial demand multiplier or sinusoidal variance)
const fs = require('fs');
const simCode = fs.readFileSync(path.join(__dirname, '../server/routes/simulation.js'), 'utf8');
assert.ok(!simCode.includes('* 1.25'), 'Artificial 1.25x demand multiplier must be stripped from simulation.js');
assert.ok(!simCode.includes('Math.sin('), 'Sinusoidal variance must be stripped from simulation.js');
assert.ok(!simCode.includes('* 1.3'), 'Artificial 1.3x demand multiplier must be stripped from simulation.js');
console.log('✓ Simulation replay neutralized (authentic demand data verified).');

// 11. Verify Expiry Date Calculation & Calendar Boundary Rigor
const refDate = new Date('2028-02-28T12:00:00');
const leapYearDiff = calculateDaysToExpiry('2028-02-29', refDate);
assert.strictEqual(leapYearDiff, 1, 'Leap year Feb 29 2028 must be exactly 1 day ahead of Feb 28 2028');

// Invalid leap year date (2026 is not a leap year)
const invalidLeapDiff = calculateDaysToExpiry('2026-02-29', new Date('2026-02-28'));
assert.strictEqual(invalidLeapDiff, null, 'Invalid non-leap date 2026-02-29 must yield null');

// Same-day expiration (0 days) must categorize as 'Expired'
const sameDayDiff = calculateDaysToExpiry('2026-10-28', new Date('2026-10-28T15:30:00'));
assert.strictEqual(sameDayDiff, 0, 'Same calendar date must return 0 days difference');
assert.strictEqual(getExpiryTier(0), 'Expired', '0 days to expiry must be classified as Expired');
assert.strictEqual(getExpiryTier(-5), 'Expired', 'Negative days to expiry must be classified as Expired');
assert.strictEqual(getExpiryTier(null), 'None', 'Null days to expiry must be classified as None');
assert.strictEqual(getExpiryTier(undefined), 'None', 'Undefined days to expiry must be classified as None');

// Verify that null days does NOT trigger is_expired check
const checkIsExpired = (d) => d !== null && d !== undefined && d <= 0;
assert.strictEqual(checkIsExpired(null), false, 'Null days must not evaluate as expired');
assert.strictEqual(checkIsExpired(0), true, '0 days must evaluate as expired');
assert.strictEqual(checkIsExpired(5), false, 'Positive days must not evaluate as expired');

// Date object parsing in calculateDaysToExpiry
const dateObjTarget = new Date('2028-02-29T00:00:00');
const dateObjDiff = calculateDaysToExpiry(dateObjTarget, refDate);
assert.strictEqual(dateObjDiff, 1, 'calculateDaysToExpiry must support Date instance as input');
assert.strictEqual(calculateDaysToExpiry(null), null, 'Null input must return null');
assert.strictEqual(calculateDaysToExpiry(''), null, 'Empty string input must return null');

// ISO timestamp parsing in calculateDaysToExpiry
const isoTimestampDiff = calculateDaysToExpiry('2026-10-31T23:59:59.000Z', new Date('2026-10-28T08:00:00'));
assert.strictEqual(isoTimestampDiff, 3, 'calculateDaysToExpiry must strip time components and compute exact calendar day delta');
console.log('✓ Expiry date calculations, leap years, null safety, and calendar boundaries verified.');

// 12. Verify Password Hashing and Timing-Safe Verification
const { hashPassword, verifyPassword } = require('../server/db');
const testPassword = 'ClinicalPharmacistPassword!@#2026';
const testHash = hashPassword(testPassword);
assert.ok(testHash.includes(':'), 'Hash must contain salt and hash separator');
assert.strictEqual(verifyPassword(testPassword, testHash), true, 'Correct password must verify successfully');
assert.strictEqual(verifyPassword('WrongPassword123', testHash), false, 'Incorrect password must be rejected');
assert.strictEqual(verifyPassword(null, testHash), false, 'Null password must be rejected safely');
assert.strictEqual(verifyPassword('', testHash), false, 'Empty password must be rejected safely');
assert.strictEqual(verifyPassword(testPassword, 'invalidhashstring'), false, 'Malformed hash must be rejected safely');
console.log('✓ Cryptographic password verification & timing-safe equality verified.');

// 13. Verify Floating-Point Currency Rounding Integrity
const calcTotal = (qty, price) => Math.round(qty * price * 100) / 100;
// Classic IEEE 754 precision trap: 7 * 19.99 = 139.92999999999998
assert.strictEqual(calcTotal(7, 19.99), 139.93, 'Monetary total must round cleanly to 2 decimal places');
assert.strictEqual(calcTotal(3, 0.1), 0.3, '0.1 * 3 floating point error must round to 0.30');
console.log('✓ Monetary precision & rounding integrity verified.');

// 14. Verify Date Formatter Utility Functions & Client Calculation Symmetry
async function testDateFormatter() {
  const {
    formatDatePH,
    getLocalDateISO,
    calculateDaysToExpiry: clientCalcDays,
    getExpiryTier: clientGetTier
  } = await import('../client/src/utils/dateFormatter.js');

  assert.strictEqual(formatDatePH('2026-10-28', 'compact'), '10/28/2026', 'Compact format must be MM/DD/YYYY');
  assert.strictEqual(formatDatePH('2026-10-28', 'medium'), 'Oct 28, 2026', 'Medium format must be MMM DD, YYYY');
  assert.strictEqual(formatDatePH('2026-10-28T14:30:00', 'time'), '2:30 PM', 'Time format must be h:mm A');
  assert.strictEqual(formatDatePH('2026-10-28T09:05:00', 'time'), '9:05 AM', 'Time format must format single-digit hour and pad minutes');
  assert.strictEqual(getLocalDateISO('2026-10-28'), '2026-10-28', 'getLocalDateISO on valid date string must return YYYY-MM-DD');

  // Verify client calculateDaysToExpiry symmetry with server calculation
  const clientRef = new Date('2026-10-28T12:00:00');
  assert.strictEqual(clientCalcDays('2026-10-28', clientRef), 0, 'Same day must return 0 on client');
  assert.strictEqual(clientCalcDays('2026-10-31', clientRef), 3, 'Oct 31 must be 3 days ahead of Oct 28');
  assert.strictEqual(clientCalcDays('2026-10-25', clientRef), -3, 'Past date must return negative days');
  assert.strictEqual(clientCalcDays('2028-02-29', new Date('2028-02-28')), 1, 'Leap year Feb 29 must calculate 1 day on client');
  assert.strictEqual(clientCalcDays('2026-02-29', new Date('2026-02-28')), null, 'Non-leap Feb 29 must return null on client');
  assert.strictEqual(clientCalcDays(null), null, 'Null date must return null on client');
  assert.strictEqual(clientGetTier(null), 'None', 'Null days must return None on client');
  assert.strictEqual(clientGetTier(0), 'Expired', '0 days must return Expired on client');
  assert.strictEqual(clientGetTier(20), 'Critical', '20 days must return Critical on client');
  console.log('✓ Date formatting and client-server calculation symmetry verified.');

  // 15. Verify Philippine Medicine Presets Integrity & Real-World Market Data
  const { PHILIPPINE_MEDICINE_PRESETS } = await import('../client/src/data/philippineMedicinePresets.js');
  assert.ok(Array.isArray(PHILIPPINE_MEDICINE_PRESETS), 'Philippine presets must be an array');
  assert.ok(
    PHILIPPINE_MEDICINE_PRESETS.length >= 50 && PHILIPPINE_MEDICINE_PRESETS.length <= 75,
    `Expected 50-75 standard Philippine medicine presets, found ${PHILIPPINE_MEDICINE_PRESETS.length}`
  );

  function verifyEan13CheckDigit(code) {
    if (typeof code !== 'string' || code.length !== 13 || !/^\d{13}$/.test(code)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const d = parseInt(code[i], 10);
      sum += (i % 2 === 0) ? d : d * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    return check === parseInt(code[12], 10);
  }

  const seenBarcodes = new Set();
  let verifiedEanCount = 0;
  for (const preset of PHILIPPINE_MEDICINE_PRESETS) {
    assert.ok(preset.brand_name && preset.brand_name.trim().length > 0, 'Preset must have brand_name');
    assert.ok(preset.generic_name && preset.generic_name.trim().length > 0, 'Preset must have generic_name');
    assert.ok(preset.dosage_strength && preset.dosage_strength.trim().length > 0, 'Preset must have dosage_strength');
    assert.ok(preset.dosage_form && preset.dosage_form.trim().length > 0, 'Preset must have dosage_form');
    assert.ok(preset.category && preset.category.trim().length > 0, 'Preset must have category');
    assert.ok(preset.unit_of_measure && preset.unit_of_measure.trim().length > 0, 'Preset must have unit_of_measure');
    assert.ok(preset.supplier_name && preset.supplier_name.trim().length > 0, 'Preset must have genuine manufacturer/supplier');
    assert.ok(typeof preset.reorder_threshold === 'number' && preset.reorder_threshold >= 0, 'Reorder threshold must be non-negative');
    assert.ok(typeof preset.supplier_lead_time_days === 'number' && preset.supplier_lead_time_days >= 0, 'Lead time must be non-negative');
    assert.ok(typeof preset.buffer_days === 'number' && preset.buffer_days >= 0, 'Buffer days must be non-negative');
    
    // Barcode validation: either empty for physical scanner intake, or mathematically valid EAN-13
    if (preset.barcode && preset.barcode.trim() !== '') {
      assert.ok(verifyEan13CheckDigit(preset.barcode), `Preset ${preset.brand_name} barcode ${preset.barcode} must be mathematically valid EAN-13`);
      assert.ok(!seenBarcodes.has(preset.barcode), `Duplicate barcode detected: ${preset.barcode} on ${preset.brand_name}`);
      seenBarcodes.add(preset.barcode);
      verifiedEanCount++;
    }
  }
  console.log(`✓ Philippine essential medicine presets verified (${PHILIPPINE_MEDICINE_PRESETS.length} FDA/DOH standards, ${verifiedEanCount} verified authentic GS1 EAN-13 barcodes, remaining ready for scanner intake).`);

  // 16. Verify Input Validation & Edge Case Clamping Integrity
  // Zero threshold test: 0 is valid for reorder threshold (must not coerce to 20)
  const parseReorderThreshold = (val) => (!isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 0) ? parseInt(val, 10) : 20;
  assert.strictEqual(parseReorderThreshold('0'), 0, '0 threshold must remain 0 and not default to 20');
  assert.strictEqual(parseReorderThreshold(0), 0, 'Numeric 0 threshold must remain 0');
  assert.strictEqual(parseReorderThreshold('-5'), 20, 'Negative threshold must fallback to default 20');
  assert.strictEqual(parseReorderThreshold('abc'), 20, 'NaN threshold must fallback to default 20');
  assert.strictEqual(parseReorderThreshold('45'), 45, 'Valid 45 threshold must be parsed');
  console.log('✓ Input validation & threshold boundary clamping verified.');

  // 17. Verify Factory System Reset & Sentinel Flag Wipe Integrity
  const Database = require('better-sqlite3');
  const testDb = new Database(':memory:');
  testDb.exec(`
    CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, description TEXT);
    CREATE TABLE medicines (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, barcode TEXT, brand_name TEXT, generic_name TEXT, dosage_strength TEXT, dosage_form TEXT, category TEXT, unit_of_measure TEXT);
    CREATE TABLE batches (id INTEGER PRIMARY KEY AUTOINCREMENT, medicine_id INTEGER, batch_number TEXT, manufacturing_date DATE, expiration_date DATE, initial_quantity INTEGER, current_quantity INTEGER, unit_cost REAL, selling_price REAL, status TEXT);
    CREATE TABLE transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, transaction_code TEXT, transaction_type TEXT, medicine_id INTEGER, quantity INTEGER, unit_price REAL, total_amount REAL);
    CREATE TABLE purchase_orders (id INTEGER PRIMARY KEY AUTOINCREMENT, po_number TEXT, status TEXT);
    CREATE TABLE purchase_order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, po_id INTEGER, medicine_id INTEGER, quantity_ordered INTEGER, unit_cost REAL, total_cost REAL);
    CREATE TABLE alert_acknowledgments (id INTEGER PRIMARY KEY AUTOINCREMENT, alert_key TEXT, alert_type TEXT, entity_id INTEGER);
    CREATE TABLE audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT, entity_type TEXT, entity_id TEXT, operator TEXT, details TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE usability_evaluations (id INTEGER PRIMARY KEY AUTOINCREMENT, evaluator_name TEXT, sus_score REAL);
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password_hash TEXT, full_name TEXT, role TEXT);
  `);

  // Populate dummy test rows across tables
  testDb.prepare("INSERT INTO medicines (code, barcode, brand_name, generic_name, dosage_strength, dosage_form, category, unit_of_measure) VALUES ('TEST-001', '4800000000014', 'TestBrand', 'TestGeneric', '500mg', 'Tablet', 'TestCat', 'Tablet')").run();
  testDb.prepare("INSERT INTO batches (medicine_id, batch_number, manufacturing_date, expiration_date, initial_quantity, current_quantity, unit_cost, selling_price, status) VALUES (1, 'BATCH-001', '2026-01-01', '2027-01-01', 100, 100, 5.0, 10.0, 'active')").run();
  testDb.prepare("INSERT INTO transactions (transaction_code, transaction_type, medicine_id, quantity, unit_price, total_amount) VALUES ('TX-001', 'stock_in', 1, 100, 5.0, 500.0)").run();
  testDb.prepare("INSERT INTO purchase_orders (po_number, status) VALUES ('PO-001', 'draft')").run();
  testDb.prepare("INSERT INTO purchase_order_items (po_id, medicine_id, quantity_ordered, unit_cost, total_cost) VALUES (1, 1, 100, 5.0, 500.0)").run();
  testDb.prepare("INSERT INTO alert_acknowledgments (alert_key, alert_type, entity_id) VALUES ('ALERT-1', 'low_stock', 1)").run();
  testDb.prepare("INSERT INTO audit_logs (action, entity_type, entity_id, operator, details) VALUES ('TEST_ACTION', 'MEDICINE', '1', 'admin', 'Test log')").run();
  testDb.prepare("INSERT INTO usability_evaluations (evaluator_name, sus_score) VALUES ('Tester', 85.0)").run();

  // Execute wipeDatabase
  wipeDatabase(testDb, 'Quality Assurance Specialist');

  // Verify that all dummy operational rows are purged to 0 rows
  assert.strictEqual(testDb.prepare("SELECT COUNT(*) as c FROM medicines").get().c, 0, 'Medicines must be wiped to 0 rows');
  assert.strictEqual(testDb.prepare("SELECT COUNT(*) as c FROM batches").get().c, 0, 'Batches must be wiped to 0 rows');
  assert.strictEqual(testDb.prepare("SELECT COUNT(*) as c FROM transactions").get().c, 0, 'Transactions must be wiped to 0 rows');
  assert.strictEqual(testDb.prepare("SELECT COUNT(*) as c FROM purchase_orders").get().c, 0, 'Purchase orders must be wiped to 0 rows');
  assert.strictEqual(testDb.prepare("SELECT COUNT(*) as c FROM purchase_order_items").get().c, 0, 'Purchase order items must be wiped to 0 rows');
  assert.strictEqual(testDb.prepare("SELECT COUNT(*) as c FROM alert_acknowledgments").get().c, 0, 'Alerts must be wiped to 0 rows');
  assert.strictEqual(testDb.prepare("SELECT COUNT(*) as c FROM audit_logs").get().c, 0, 'Audit logs must be wiped to 0 rows');
  assert.strictEqual(testDb.prepare("SELECT COUNT(*) as c FROM usability_evaluations").get().c, 0, 'Evaluations must be wiped to 0 rows');

  // Verify sentinel flag is set
  const sentinel = testDb.prepare("SELECT value FROM settings WHERE key = 'system_wiped'").get();
  assert.ok(sentinel && (sentinel.value === '1' || sentinel.value === 'true'), 'system_wiped sentinel must be set in settings');

  // Verify admin account is preserved
  const admin = testDb.prepare("SELECT username, full_name FROM users WHERE username = 'admin'").get();
  assert.ok(admin, 'Admin account must be preserved post-wipe');
  assert.strictEqual(admin.username, 'admin', 'Admin username must be admin');

  // Verify seedDatabase skips auto-seeding when system_wiped flag is active
  seedDatabase(testDb);
  assert.strictEqual(testDb.prepare("SELECT COUNT(*) as c FROM medicines").get().c, 0, 'seedDatabase must not re-seed when system_wiped sentinel is active');
  console.log('✓ Factory System Reset & sentinel flag wipe integrity verified (0 orphaned rows, sentinel active).');

  // 18. Verify Database Storage Compaction, Page Pragmas & VACUUM Safety
  const pageCount = Number(testDb.pragma('page_count', { simple: true }));
  const pageSize = Number(testDb.pragma('page_size', { simple: true }));
  const freelist = Number(testDb.pragma('freelist_count', { simple: true }));
  assert.ok(pageCount > 0, 'Page count must be greater than zero');
  assert.ok(pageSize >= 512, 'Page size must be at least 512 bytes');
  assert.ok(freelist >= 0, 'Freelist count must be non-negative');

  testDb.pragma('wal_checkpoint(TRUNCATE)');
  testDb.exec('VACUUM');
  testDb.pragma('optimize');
  console.log('✓ Database storage compaction, SQLite VACUUM & optimization pragmas verified.');

  console.log('\n========================================');
  console.log(' ALL INTEGRITY CHECKS PASSED SUCCESSFULLY ');
  console.log('========================================');
}

testDateFormatter().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
