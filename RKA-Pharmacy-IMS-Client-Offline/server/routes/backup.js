const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { db, logAudit, getLocalDateString, createDatabaseBackup, safelyRestoreDatabase, verifyPassword } = require('../db');

const dbDir = path.join(__dirname, '../data');
const backupDir = path.join(dbDir, 'backups');

// GET list of available local backups
router.get('/list', (req, res) => {
  try {
    if (!fs.existsSync(backupDir)) {
      return res.json({ backups: [] });
    }
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.db'));
    const backups = files.map(file => {
      const fullPath = path.join(backupDir, file);
      const stat = fs.statSync(fullPath);
      return {
        filename: file,
        size_bytes: stat.size,
        size_mb: (stat.size / (1024 * 1024)).toFixed(2),
        created_at: stat.mtime.toISOString(),
        is_pre_restore: file.startsWith('pharmacy_pre_restore_')
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ backups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download database backup file directly to client (Save to USB via browser)
router.get('/download', async (req, res) => {
  try {
    // Flush WAL to ensure complete snapshot
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (e) {
      // fallback
    }

    const today = getLocalDateString();
    const backupFile = await createDatabaseBackup();

    logAudit(
      'DATABASE_BACKUP_EXPORT',
      'BACKUP',
      today,
      { type: 'DIRECT_DOWNLOAD_USB', filename: `pharmacy_backup_${today}.db` },
      req.query.operator || 'Lourdes Gincen L. Cesista'
    );

    res.download(backupFile, `pharmacy_backup_${today}.db`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List system storage drives (identifying connected USB flash drives)
router.get('/drives', (req, res) => {
  try {
    const drives = [];
    if (process.platform === 'win32') {
      const cmd = `powershell -NoProfile -Command "Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID, VolumeName, DriveType, Size, FreeSpace | ConvertTo-Json -Compress"`;
      const output = execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim();

      if (output) {
        let parsed = JSON.parse(output);
        if (!Array.isArray(parsed)) parsed = [parsed];

        for (const d of parsed) {
          const driveTypeMap = {
            2: 'Removable (USB Flash Drive)',
            3: 'Local Fixed Disk',
            4: 'Network Drive',
            5: 'CD/DVD Disc'
          };
          drives.push({
            device_id: d.DeviceID,
            volume_name: d.VolumeName || 'Storage Drive',
            drive_type: d.DriveType,
            drive_type_label: driveTypeMap[d.DriveType] || 'Other Storage',
            is_removable: d.DriveType === 2,
            size_gb: d.Size ? (d.Size / (1024 * 1024 * 1024)).toFixed(1) : 'Unknown',
            free_gb: d.FreeSpace ? (d.FreeSpace / (1024 * 1024 * 1024)).toFixed(1) : 'Unknown'
          });
        }
      }
    }
    res.json({ drives });
  } catch (err) {
    // If PowerShell drive enumeration fails, return empty list safely
    res.json({ drives: [], warning: 'Drive enumeration unavailable' });
  }
});

// Directly copy backup to detected removable USB drive
router.post('/export-removable', async (req, res) => {
  try {
    const { drive_letter, operator_name = 'Lourdes Gincen L. Cesista' } = req.body || {};

    if (!drive_letter) {
      return res.status(400).json({ error: 'Drive letter is required.' });
    }

    const cleanLetter = drive_letter.replace(/[\/\\]/g, '').toUpperCase().slice(0, 2);
    const driveRoot = `${cleanLetter}\\`;

    if (!fs.existsSync(driveRoot)) {
      return res.status(404).json({ error: `Removable drive ${driveRoot} is not accessible or was disconnected.` });
    }

    // Flush WAL and create snapshot
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (e) {}

    const today = getLocalDateString();
    const backupFile = await createDatabaseBackup();

    const targetDir = path.join(driveRoot, 'RKA_PHARMACY_BACKUPS');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const destFile = path.join(targetDir, `pharmacy_backup_${today}.db`);
    fs.copyFileSync(backupFile, destFile);

    const stats = fs.statSync(destFile);

    logAudit(
      'DATABASE_BACKUP_REMOVABLE',
      'BACKUP',
      today,
      {
        target_path: destFile,
        size_bytes: stats.size,
        drive_letter: cleanLetter
      },
      operator_name
    );

    res.json({
      message: `Database backup successfully saved to USB drive at ${destFile}`,
      destination: destFile,
      size_bytes: stats.size,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST safely restore database from backup with password verification
router.post('/restore', async (req, res) => {
  try {
    const { password, backup_filename, backup_path, operator_name = 'Lourdes Gincen L. Cesista' } = req.body || {};

    if (!password) {
      return res.status(400).json({ error: 'Administrator password is required to authorize database restoration.' });
    }

    // Verify password against users table
    const adminUser = db.prepare("SELECT * FROM users WHERE username = 'admin'").get() ||
                      db.prepare('SELECT * FROM users LIMIT 1').get();

    if (!adminUser || !verifyPassword(password, adminUser.password_hash)) {
      return res.status(401).json({ error: 'Invalid administrator password. Restoration authorization failed.' });
    }

    let candidatePath = null;
    if (backup_filename) {
      const safeFilename = path.basename(backup_filename);
      candidatePath = path.join(backupDir, safeFilename);
    } else if (backup_path) {
      candidatePath = path.resolve(backup_path);
    } else {
      return res.status(400).json({ error: 'Please specify a backup filename or candidate file path to restore.' });
    }

    if (!fs.existsSync(candidatePath)) {
      return res.status(404).json({ error: `Backup file not found: ${candidatePath}` });
    }

    const result = await safelyRestoreDatabase({
      candidatePath,
      operatorName: operator_name
    });

    res.json({
      message: `Database successfully restored from ${result.source_file}. A pre-restore safety snapshot was saved to ${result.pre_restore_backup}.`,
      details: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST terminate workstation process cleanly after checkpointing database
router.post('/exit', (req, res) => {
  try {
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (e) {}

    const { operator_name = 'Lourdes Gincen L. Cesista' } = req.body || {};
    try {
      logAudit(
        'WORKSTATION_EXIT',
        'SYSTEM',
        getLocalDateString(),
        { action: 'Clean workstation shutdown requested' },
        operator_name
      );
    } catch (e) {}

    res.json({ success: true, message: 'Workstation process terminating cleanly.' });

    setTimeout(() => {
      try {
        db.close();
      } catch (e) {}
      process.exit(0);
    }, 300);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
