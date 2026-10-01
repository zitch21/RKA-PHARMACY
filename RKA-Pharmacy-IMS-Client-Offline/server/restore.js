#!/usr/bin/env node
/**
 * R.K.A. Pharmacy (FEFO+ Engine)
 * Administrative CLI Database Recovery & Restore Utility
 *
 * Usage:
 *   node server/restore.js [path/to/backup.db]
 *
 * Features:
 *   - Verifies candidate SQLite file exists and passes PRAGMA integrity_check
 *   - Verifies required pharmacy schema tables (medicines, batches, transactions, settings)
 *   - Automatically creates a pre-restore safety snapshot before replacing data
 *   - Uses SQLite native backup API to swap data safely without locking or corruption
 *   - Immediately updates expired batch statuses and logs an audit trail entry
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { db, dbDir, safelyRestoreDatabase } = require('./db');

const backupDir = path.join(dbDir, 'backups');

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function runRecovery() {
  console.log('\n======================================================');
  console.log('  R.K.A. PHARMACY - ADMINISTRATIVE DATABASE RESTORE   ');
  console.log('======================================================\n');

  let candidatePath = process.argv[2];

  if (!candidatePath) {
    if (!fs.existsSync(backupDir)) {
      console.error('[ERROR] No backups directory found at:', backupDir);
      process.exit(1);
    }

    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.db'));
    if (files.length === 0) {
      console.error('[ERROR] No backup .db files found in:', backupDir);
      console.log('Provide a direct path: node server/restore.js <path/to/backup.db>');
      process.exit(1);
    }

    console.log('Available backups in server/data/backups/:');
    files.forEach((file, idx) => {
      const stats = fs.statSync(path.join(backupDir, file));
      const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
      const isPreRestore = file.startsWith('pharmacy_pre_restore_');
      const tag = isPreRestore ? '[SAFETY SNAPSHOT]' : '[DAILY BACKUP]';
      console.log(`  [${idx + 1}] ${file} (${sizeMb} MB) - ${stats.mtime.toLocaleString()} ${tag}`);
    });

    const choice = await prompt('\nEnter backup number to restore (or type direct file path, or "q" to cancel): ');
    if (!choice || choice.toLowerCase() === 'q') {
      console.log('Restoration cancelled by operator.');
      process.exit(0);
    }

    const num = parseInt(choice, 10);
    if (!isNaN(num) && num >= 1 && num <= files.length) {
      candidatePath = path.join(backupDir, files[num - 1]);
    } else if (fs.existsSync(choice)) {
      candidatePath = path.resolve(choice);
    } else {
      console.error('[ERROR] Invalid selection or file not found:', choice);
      process.exit(1);
    }
  } else {
    candidatePath = path.resolve(candidatePath);
    if (!fs.existsSync(candidatePath)) {
      console.error('[ERROR] Candidate backup file not found at:', candidatePath);
      process.exit(1);
    }
  }

  console.log('\nSelected Candidate Backup:');
  console.log('  File:', candidatePath);
  const candidateStats = fs.statSync(candidatePath);
  console.log('  Size:', (candidateStats.size / (1024 * 1024)).toFixed(2), 'MB');
  console.log('  Modified:', candidateStats.mtime.toLocaleString());

  const confirm = await prompt('\n[WARNING] This will replace the active database with this backup.\nType "RESTORE" to proceed: ');
  if (confirm !== 'RESTORE') {
    console.log('Confirmation mismatch. Restoration aborted.');
    process.exit(0);
  }

  console.log('\n[1/4] Verifying backup file integrity & schema...');
  console.log('[2/4] Generating pre-restore safety snapshot...');
  console.log('[3/4] Restoring database via native SQLite backup engine...');

  try {
    const result = await safelyRestoreDatabase({
      candidatePath,
      operatorName: 'CLI Emergency Administrator'
    });

    console.log('[4/4] Finalizing WAL checkpoint and table maintenance...');

    const medCount = db.prepare('SELECT COUNT(*) as c FROM medicines').get().c;
    const batchCount = db.prepare('SELECT COUNT(*) as c FROM batches').get().c;
    const txCount = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c;

    console.log('\n======================================================');
    console.log('  DATABASE RESTORE COMPLETED SUCCESSFULLY!            ');
    console.log('======================================================');
    console.log('  Restored From:        ', result.source_file);
    console.log('  Pre-Restore Snapshot: ', result.pre_restore_backup);
    console.log('  Active Medicines:     ', medCount);
    console.log('  Active/Total Batches: ', batchCount);
    console.log('  Transaction Records:  ', txCount);
    console.log('  Restored At:          ', result.timestamp);
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL ERROR] Database restoration failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runRecovery();
}

module.exports = { runRecovery };
