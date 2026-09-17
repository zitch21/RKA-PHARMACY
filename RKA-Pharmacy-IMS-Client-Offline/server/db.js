const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'pharmacy_inventory.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for reliability
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initSchema() {
  db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_batches_med_status ON batches(medicine_id, status);
    CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiration_date);
    CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);
    CREATE INDEX IF NOT EXISTS idx_medicines_code ON medicines(code);
    CREATE INDEX IF NOT EXISTS idx_transactions_med ON transactions(medicine_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
  `);

  // Run SQLite Query Optimizer
  try {
    db.pragma('optimize');
  } catch (e) {
    // optimize pragma fallback
  }

  // Default settings
  const insertSetting = db.prepare(`
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
    ['history_days_fefo_plus', '30', 'Days of sales history required for full FEFO+ consumption calculation']
  ];

  for (const [key, value, desc] of defaultSettings) {
    insertSetting.run(key, value, desc);
  }
}

initSchema();

/**
 * Creates an automated local backup of the SQLite database
 * Rotates backups to preserve the latest 30 days
 */
function createDatabaseBackup() {
  try {
    const backupDir = path.join(dbDir, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const today = new Date().toISOString().slice(0, 10);
    const backupFile = path.join(backupDir, `pharmacy_backup_${today}.db`);

    // Use better-sqlite3 native backup API to safely snapshot without locking
    db.backup(backupFile)
      .then(() => {
        // Clean up backups older than 30 days
        const files = fs.readdirSync(backupDir);
        if (files.length > 30) {
          files.sort();
          while (files.length > 30) {
            const oldFile = files.shift();
            try { fs.unlinkSync(path.join(backupDir, oldFile)); } catch (err) {}
          }
        }
      })
      .catch((err) => console.error('Automated backup error:', err));
  } catch (err) {
    console.error('Backup directory error:', err);
  }
}

// Run initial backup
createDatabaseBackup();

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

module.exports = {
  db,
  logAudit,
  createDatabaseBackup
};
