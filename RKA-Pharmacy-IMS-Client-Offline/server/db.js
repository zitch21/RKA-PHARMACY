const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { AsyncLocalStorage } = require('async_hooks');

const dbContext = new AsyncLocalStorage();

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const prodDbPath = path.join(dbDir, 'pharmacy_inventory.db');
const demoDbPath = path.join(dbDir, 'pharmacy_demo.db');

const prodDb = new Database(prodDbPath);
prodDb.pragma('foreign_keys = ON');
prodDb.pragma('journal_mode = WAL');

let demoDb = null;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === verifyHash;
}

function initSchema(targetDb = prodDb) {
  targetDb.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      barcode TEXT UNIQUE NOT NULL,
      brand_name TEXT NOT NULL,
      generic_name TEXT NOT NULL,
      dosage_strength TEXT NOT NULL,
      dosage_form TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_of_measure TEXT NOT NULL,
      reorder_threshold INTEGER NOT NULL DEFAULT 20,
      supplier_lead_time_days INTEGER NOT NULL DEFAULT 5,
      buffer_days INTEGER NOT NULL DEFAULT 3,
      supplier_name TEXT DEFAULT 'United Laboratories (Unilab)',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
      batch_number TEXT NOT NULL,
      manufacturing_date DATE NOT NULL,
      expiration_date DATE NOT NULL,
      initial_quantity INTEGER NOT NULL,
      current_quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL,
      selling_price REAL NOT NULL,
      supplier_name TEXT,
      supplier_dr_number TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'consumed', 'expired', 'quarantined', 'disposed')),
      received_date DATE NOT NULL DEFAULT (DATE('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_code TEXT UNIQUE NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('stock_in', 'stock_out', 'stock_adjustment', 'disposal')),
      medicine_id INTEGER NOT NULL REFERENCES medicines(id),
      batch_id INTEGER REFERENCES batches(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      reference_no TEXT,
      is_override INTEGER DEFAULT 0 CHECK(is_override IN (0, 1)),
      override_reason TEXT,
      operator_name TEXT NOT NULL DEFAULT 'Lourdes Gincen L. Cesista',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      operator TEXT NOT NULL DEFAULT 'Lourdes Gincen L. Cesista',
      details TEXT
    );

    CREATE TABLE IF NOT EXISTS usability_evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluator_name TEXT NOT NULL,
      evaluator_role TEXT NOT NULL,
      q1 INTEGER NOT NULL,
      q2 INTEGER NOT NULL,
      q3 INTEGER NOT NULL,
      q4 INTEGER NOT NULL,
      q5 INTEGER NOT NULL,
      q6 INTEGER NOT NULL,
      q7 INTEGER NOT NULL,
      q8 INTEGER NOT NULL,
      q9 INTEGER NOT NULL,
      q10 INTEGER NOT NULL,
      sus_score REAL NOT NULL,
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Owner / Clinic Administrator',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS alert_acknowledgments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_key TEXT UNIQUE NOT NULL,
      alert_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      acknowledged_by TEXT NOT NULL DEFAULT 'Lourdes Gincen L. Cesista',
      acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_number TEXT UNIQUE NOT NULL,
      supplier_name TEXT NOT NULL,
      supplier_dr_number TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'placed', 'partially_received', 'received', 'cancelled')),
      order_date DATE DEFAULT (DATE('now')),
      placed_date DATE,
      received_date DATE,
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      cancellation_reason TEXT,
      created_by TEXT NOT NULL DEFAULT 'Lourdes Gincen L. Cesista',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      medicine_id INTEGER NOT NULL REFERENCES medicines(id),
      quantity_ordered INTEGER NOT NULL,
      quantity_received INTEGER NOT NULL DEFAULT 0,
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'partial', 'received', 'cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_batches_med_status ON batches(medicine_id, status);
    CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiration_date);
    CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);
    CREATE INDEX IF NOT EXISTS idx_medicines_code ON medicines(code);
    CREATE INDEX IF NOT EXISTS idx_transactions_med ON transactions(medicine_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_alert_ack_key ON alert_acknowledgments(alert_key);
    CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
    CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(po_id);
    CREATE INDEX IF NOT EXISTS idx_po_items_med ON purchase_order_items(medicine_id);
    CREATE INDEX IF NOT EXISTS idx_batches_med_id ON batches(medicine_id, id);
    CREATE INDEX IF NOT EXISTS idx_po_items_med_id ON purchase_order_items(medicine_id, id);
  `);

  // Schema migrations for incremental upgrades
  try {
    targetDb.exec(`ALTER TABLE purchase_orders ADD COLUMN supplier_dr_number TEXT;`);
  } catch (e) {
    // Column already exists
  }

  try {
    targetDb.exec(`ALTER TABLE batches ADD COLUMN supplier_dr_number TEXT;`);
  } catch (e) {
    // Column already exists
  }

  try {
    targetDb.exec(`CREATE INDEX IF NOT EXISTS idx_batches_dr ON batches(supplier_dr_number);`);
  } catch (e) {
    // Index fallback
  }

  // Run SQLite Query Optimizer
  try {
    targetDb.pragma('optimize');
  } catch (e) {
    // optimize pragma fallback
  }

  // Seed default clinic administrator account if empty
  const userCheck = targetDb.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!userCheck || userCheck.count === 0) {
    const defaultHash = hashPassword('rka2026');
    targetDb.prepare(`
      INSERT INTO users (username, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', defaultHash, 'Lourdes Gincen L. Cesista', 'Owner / Clinic Administrator');
  }

  // Default settings
  const insertSetting = targetDb.prepare(`
    INSERT OR IGNORE INTO settings (key, value, description)
    VALUES (?, ?, ?)
  `);

  const defaultSettings = [
    ['pharmacy_name', 'R.K.A Pharmacy', 'Official Pharmacy Name'],
    ['pharmacy_address', 'San Antonio, Agoo, La Union', 'Location and Branch Address'],
    ['pharmacy_owner', 'Lourdes Gincen L. Cesista', 'Sole Proprietor / Clinic Administrator'],
    ['safe_threshold_days', '180', 'Days threshold for Safe classification (> 180 days)'],
    ['monitor_threshold_days', '91', 'Days threshold for Monitor classification (91 to 180 days)'],
    ['warning_threshold_days', '31', 'Days threshold for Warning classification (31 to 90 days)'],
    ['critical_threshold_days', '1', 'Days threshold for Critical classification (1 to 30 days)'],
    ['default_buffer_days', '3', 'Default buffer days for suggested reorder calculation'],
    ['history_days_fefo_plus', '30', 'Days of sales history required for full FEFO+ consumption calculation'],
    ['forecasting_window_days', '30', 'Rolling observation window N days for demand forecasting (10, 20, or 30 days)'],
    ['po_drafting_mode', 'manual', 'Purchase Order drafting mode: manual (review before draft) or instant_auto (save direct to draft PO)']
  ];

  for (const [key, value, desc] of defaultSettings) {
    insertSetting.run(key, value, desc);
  }
}

// Initialize schema on production database
initSchema(prodDb);

function initDemoDb() {
  if (demoDb) return demoDb;
  demoDb = new Database(demoDbPath);
  demoDb.pragma('foreign_keys = ON');
  demoDb.pragma('journal_mode = WAL');
  initSchema(demoDb);

  // Check if demo database needs initial demo population
  const count = demoDb.prepare('SELECT COUNT(*) as count FROM medicines').get().count;
  if (count === 0) {
    try {
      const { seedDatabase } = require('./seed');
      seedDatabase(demoDb);
    } catch (err) {
      console.error('Failed to seed demo database:', err);
    }
  }
  return demoDb;
}

function resetDemoDb() {
  if (demoDb) {
    try { demoDb.close(); } catch (e) {}
    demoDb = null;
  }
  const filesToDelete = [demoDbPath, `${demoDbPath}-wal`, `${demoDbPath}-shm`];
  for (const f of filesToDelete) {
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch (e) {}
    }
  }
  return initDemoDb();
}

function getActiveDb() {
  const store = dbContext.getStore();
  if (store && store.isDemo) {
    return initDemoDb();
  }
  return prodDb;
}

// Transparent dynamic database proxy routing queries to active db (Production vs Demo Sandbox)
const db = new Proxy({}, {
  get(target, prop) {
    const active = getActiveDb();
    const val = active[prop];
    return typeof val === 'function' ? val.bind(active) : val;
  }
});

async function performSystemReset({ operator_name = 'Lourdes Gincen L. Cesista' } = {}) {
  // 1. Create automatic pre-reset safety snapshot backup
  const backupDir = path.join(dbDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `pharmacy_pre_reset_${timestamp}.db`;
  const backupPath = path.join(backupDir, backupFilename);

  try {
    prodDb.pragma('wal_checkpoint(TRUNCATE)');
  } catch (e) {}

  await prodDb.backup(backupPath);

  // 2. Perform complete transactional wipe on production database
  const wipeTransaction = prodDb.transaction(() => {
    prodDb.exec(`
      DELETE FROM transactions;
      DELETE FROM purchase_order_items;
      DELETE FROM purchase_orders;
      DELETE FROM alert_acknowledgments;
      DELETE FROM batches;
      DELETE FROM medicines;
      DELETE FROM usability_evaluations;
      DELETE FROM audit_logs;
      DELETE FROM sqlite_sequence WHERE name IN (
        'transactions', 'purchase_orders', 'purchase_order_items', 
        'batches', 'medicines', 'alert_acknowledgments', 
        'audit_logs', 'usability_evaluations'
      );
    `);

    // Persist system_wiped flag in settings to prevent auto-seeding on reboot
    prodDb.prepare(`
      INSERT OR REPLACE INTO settings (key, value, description)
      VALUES ('system_wiped', 'true', 'System reset state flag to prevent auto-reseed on restart')
    `).run();

    // Insert sole audit log entry
    prodDb.prepare(`
      INSERT INTO audit_logs (action, entity_type, entity_id, operator, details)
      VALUES ('SYSTEM_RESET', 'SYSTEM', 'DATABASE', ?, 'Factory reset completed. All operational, inventory, and audit records wiped clean.')
    `).run(operator_name);
  });

  wipeTransaction();

  try {
    prodDb.pragma('wal_checkpoint(TRUNCATE)');
    prodDb.pragma('optimize');
  } catch (e) {}

  return {
    success: true,
    backup_file: backupFilename,
    backup_path: backupPath,
    backupFilename,
    message: 'System wiped successfully. 0 records remaining. Clean production state active.'
  };
}

function getLocalDateString(d = new Date()) {
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return new Date().toISOString().slice(0, 10);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateDaysToExpiry(expiryDateStr, currentDate = new Date()) {
  if (!expiryDateStr) return null;
  const parts = String(expiryDateStr).split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null;
  // Normalize date boundaries: anchor expiration to 00:00:00.000 of expiry calendar day
  // and reference date to 00:00:00.000 to prevent daytime hour shifts or timezone offsets from causing off-by-one errors.
  const expDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  const curDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0);
  return Math.round((expDate - curDate) / (1000 * 60 * 60 * 24));
}

function isBatchExpired(expiryDateStr, currentDate = new Date()) {
  if (!expiryDateStr) return false;
  const days = calculateDaysToExpiry(expiryDateStr, currentDate);
  return days !== null && days <= 0;
}

function getSettingsMap() {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const map = {};
    for (const r of rows) map[r.key] = r.value;
    return map;
  } catch {
    return {};
  }
}

function getExpiryTier(days, settings = null) {
  if (days === null || days === undefined) return 'None';
  if (days <= 0) return 'Expired';
  const s = settings || getSettingsMap();
  const warnThreshold = parseInt(s.warning_threshold_days || '31', 10);
  const monThreshold = parseInt(s.monitor_threshold_days || '91', 10);
  const safeThreshold = parseInt(s.safe_threshold_days || '180', 10);

  if (days < warnThreshold) return 'Critical';
  if (days < monThreshold) return 'Warning';
  if (days <= safeThreshold) return 'Monitor';
  return 'Safe';
}

function updateExpiredBatchesStatus() {
  try {
    const todayStr = getLocalDateString();
    const result = db.prepare(`
      UPDATE batches 
      SET status = 'expired'
      WHERE expiration_date <= ? AND status = 'active'
    `).run(todayStr);
    if (result.changes > 0) {
      console.log(`[FEFO+ Maintenance] Updated ${result.changes} batch(es) to 'expired' status.`);
    }
  } catch (err) {
    console.error('Failed to update expired batches status:', err);
  }
}

/**
 * Creates an automated local backup of the SQLite database
 * Rotates backups to preserve the latest 30 days
 */
async function createDatabaseBackup() {
  try {
    const backupDir = path.join(dbDir, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const today = getLocalDateString();
    const backupFile = path.join(backupDir, `pharmacy_backup_${today}.db`);

    // Use better-sqlite3 native backup API to safely snapshot without locking
    await db.backup(backupFile);

    // Clean up backups older than 30 days
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('pharmacy_backup_') && f.endsWith('.db'));
    if (files.length > 30) {
      files.sort();
      while (files.length > 30) {
        const oldFile = files.shift();
        try { fs.unlinkSync(path.join(backupDir, oldFile)); } catch (err) {}
      }
    }
    return backupFile;
  } catch (err) {
    console.error('Database backup error:', err);
    throw err;
  }
}

/**
 * Safely restores the active database from a candidate backup file.
 * 1. Verifies candidate SQLite file exists and passes PRAGMA integrity_check
 * 2. Checks schema presence (medicines, batches, transactions, settings)
 * 3. Creates an automated pre-restore safety snapshot in data/backups/
 * 4. Applies candidate backup to active database using native SQLite backup API
 * 5. Checkpoints active WAL journal and logs audit entry
 */
async function safelyRestoreDatabase({ candidatePath, operatorName = 'Lourdes Gincen L. Cesista' }) {
  if (!candidatePath || !fs.existsSync(candidatePath)) {
    throw new Error(`Backup file not found at path: ${candidatePath}`);
  }

  // 1. Verify candidate database integrity and schema
  let candidateDb = null;
  try {
    candidateDb = new Database(candidatePath, { readonly: true, fileMustExist: true });
    const integrity = candidateDb.pragma('integrity_check');
    if (!integrity || integrity.length === 0 || integrity[0].integrity_check !== 'ok') {
      throw new Error(`Candidate backup failed SQLite integrity check: ${JSON.stringify(integrity)}`);
    }

    const tables = candidateDb.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name IN ('medicines', 'batches', 'transactions', 'settings')
    `).all();
    if (tables.length < 4) {
      throw new Error('Candidate backup is invalid: missing required pharmacy schema tables (medicines, batches, transactions, settings).');
    }
  } finally {
    if (candidateDb) {
      try { candidateDb.close(); } catch (e) {}
    }
  }

  // 2. Create pre-restore safety snapshot of the active database
  const backupDir = path.join(dbDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const preRestoreFile = path.join(backupDir, `pharmacy_pre_restore_${Date.now()}_${getLocalDateString()}.db`);
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
  } catch (e) {}

  await db.backup(preRestoreFile);

  // 3. Restore candidate database into active database using SQLite native backup API
  const restoreConn = new Database(candidatePath, { readonly: true });
  try {
    await restoreConn.backup(dbPath);
  } finally {
    try { restoreConn.close(); } catch (e) {}
  }

  // 4. Checkpoint active database and optimize
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.pragma('optimize');
  } catch (e) {}

  // 5. Update expired batches status immediately following restoration
  updateExpiredBatchesStatus();

  // 6. Record audit log
  logAudit(
    'DATABASE_RESTORE',
    'SYSTEM',
    'DATABASE',
    {
      source_file: path.basename(candidatePath),
      source_full_path: candidatePath,
      pre_restore_backup: path.basename(preRestoreFile),
      restored_at: new Date().toISOString()
    },
    operatorName
  );

  return {
    success: true,
    source_file: path.basename(candidatePath),
    pre_restore_backup: path.basename(preRestoreFile),
    timestamp: new Date().toISOString()
  };
}

// Run initial backup and schedule daily backup every 24 hours
createDatabaseBackup().catch(() => {});
const backupInterval = setInterval(() => { createDatabaseBackup().catch(() => {}); }, 24 * 60 * 60 * 1000);
if (backupInterval.unref) backupInterval.unref();

// Run initial status update
updateExpiredBatchesStatus();

function logAudit(action, entityType, entityId, details, operator = 'Lourdes Gincen L. Cesista') {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (action, entity_type, entity_id, operator, details)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      action,
      entityType,
      String(entityId || ''),
      operator,
      typeof details === 'object' ? JSON.stringify(details) : String(details || '')
    );
  } catch (err) {
    console.error('Failed to log audit trail:', err);
  }
}

const dbPath = prodDbPath;

module.exports = {
  db,
  dbPath,
  prodDbPath,
  demoDbPath,
  dbDir,
  prodDb,
  initDemoDb,
  resetDemoDb,
  performSystemReset,
  dbContext,
  logAudit,
  createDatabaseBackup,
  safelyRestoreDatabase,
  getLocalDateString,
  calculateDaysToExpiry,
  isBatchExpired,
  getSettingsMap,
  getExpiryTier,
  updateExpiredBatchesStatus,
  hashPassword,
  verifyPassword
};
