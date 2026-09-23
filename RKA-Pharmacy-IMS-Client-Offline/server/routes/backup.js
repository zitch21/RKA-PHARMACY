const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { db, logAudit, getLocalDateString, createDatabaseBackup } = require('../db');

const dbDir = path.join(__dirname, '../data');
const backupDir = path.join(dbDir, 'backups');

// Download database backup file directly to client (Save to USB via browser)
router.get('/download', (req, res) => {
  try {
    // Flush WAL to ensure complete snapshot
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (e) {
      // fallback
    }

    createDatabaseBackup();
    const today = getLocalDateString();
    const backupFile = path.join(backupDir, `pharmacy_backup_${today}.db`);

    logAudit(
      'DATABASE_BACKUP_EXPORT',
      'BACKUP',
      today,
      { type: 'DIRECT_DOWNLOAD_USB', filename: `pharmacy_backup_${today}.db` },
      req.query.operator || 'Lourdes Gincen L. Cesista'
    );

    if (!fs.existsSync(backupFile)) {
      const sourceDb = path.join(dbDir, 'pharmacy_inventory.db');
      return res.download(sourceDb, `pharmacy_backup_${today}.db`);
    }

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
router.post('/export-removable', (req, res) => {
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

    createDatabaseBackup();
    const today = getLocalDateString();
    const sourceBackup = path.join(backupDir, `pharmacy_backup_${today}.db`);
    const fallbackDb = path.join(dbDir, 'pharmacy_inventory.db');
    const sourceFile = fs.existsSync(sourceBackup) ? sourceBackup : fallbackDb;

    const targetDir = path.join(driveRoot, 'RKA_PHARMACY_BACKUPS');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const destFile = path.join(targetDir, `pharmacy_backup_${today}.db`);
    fs.copyFileSync(sourceFile, destFile);

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

module.exports = router;
