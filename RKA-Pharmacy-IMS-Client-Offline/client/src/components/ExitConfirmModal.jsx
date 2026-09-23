import React, { useState, useEffect } from 'react';
import { AlertTriangle, LogOut, X, CheckCircle2, HardDrive, Usb, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ExitConfirmModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [drives, setDrives] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState('');
  const [backingUp, setBackingUp] = useState(false);
  const [backupError, setBackupError] = useState(null);
  const [backupSuccess, setBackupSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBackupError(null);
      setBackupSuccess(false);
      setBackingUp(false);
      fetchDrives();
    }
  }, [isOpen]);

  const fetchDrives = async () => {
    setLoadingDrives(true);
    try {
      const res = await fetch('/api/backup/drives');
      const data = await res.json();
      const list = data.drives || [];
      setDrives(list);

      // Auto-select first removable USB drive if found, else first drive
      const usb = list.find(d => d.is_removable);
      if (usb) {
        setSelectedDrive(usb.device_id);
      } else if (list.length > 0) {
        setSelectedDrive(list[0].device_id);
      } else {
        setSelectedDrive('');
      }
    } catch (err) {
      console.error('Failed to enumerate storage drives:', err);
    } finally {
      setLoadingDrives(false);
    }
  };

  const handleExit = () => {
    // Attempt standard browser/window close
    window.close();
    // Fallback if browser security blocks window.close()
    setTimeout(() => {
      alert('You can now safely close this browser window or tab.');
      onClose();
    }, 300);
  };

  const handleBackupAndExit = async () => {
    if (!selectedDrive) {
      setBackupError('Please select a target backup drive.');
      return;
    }

    setBackingUp(true);
    setBackupError(null);

    try {
      const res = await fetch('/api/backup/export-removable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drive_letter: selectedDrive,
          operator_name: 'Lourdes Gincen L. Cesista'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to export backup to selected drive.');
      }

      setBackupSuccess(true);
      setTimeout(() => {
        handleExit();
      }, 1000);
    } catch (err) {
      setBackupError(err.message);
      setBackingUp(false);
    }
  };

  if (!isOpen) return null;

  const usbDrive = drives.find(d => d.is_removable);
  const targetDrive = drives.find(d => d.device_id === selectedDrive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">{t('exit_dialog_title', 'Exit Confirmation')}</span>
          </div>
          <button
            onClick={onClose}
            disabled={backingUp}
            className="text-slate-400 hover:text-white p-1 rounded transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Are you sure you want to exit R.K.A Pharmacy IMS?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('exit_dialog_desc', 'Closing the application will end the active counter session. Please ensure all pending transactions or receiving records are completed.')}
              </p>
            </div>
          </div>

          {backupError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{backupError}</span>
            </div>
          )}

          {backupSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">Database backup successful! Closing application...</span>
            </div>
          )}

          {/* Drive Detection Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                {usbDrive ? <Usb className="w-4 h-4 text-emerald-600" /> : <HardDrive className="w-4 h-4 text-slate-500" />}
                <span>
                  {usbDrive ? 'Removable USB Flash Drive Detected' : 'Storage Media Status'}
                </span>
              </span>
              {loadingDrives && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Scanning drives...
                </span>
              )}
            </div>

            {drives.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] text-slate-500 block">Select Backup Target:</label>
                <select
                  value={selectedDrive}
                  onChange={(e) => setSelectedDrive(e.target.value)}
                  disabled={backingUp}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {drives.map(d => (
                    <option key={d.device_id} value={d.device_id}>
                      {d.device_id} ({d.volume_name}) - {d.drive_type_label} [{d.free_gb} GB free]
                    </option>
                  ))}
                </select>
                {targetDrive && (
                  <p className="text-[11px] text-slate-500">
                    A WAL-checkpointed backup will be created inside <code className="font-mono bg-white px-1 py-0.5 rounded border">{targetDrive.device_id}\RKA_PHARMACY_BACKUPS\</code>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-[11px]">
                No removable USB flash drives detected. You can plug in a USB flash drive or exit directly.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={backingUp}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            >
              {t('exit_cancel_btn', 'Cancel (Stay in App)')}
            </button>

            <button
              type="button"
              onClick={handleExit}
              disabled={backingUp}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition disabled:opacity-50"
            >
              {t('exit_now_btn', 'Exit Without Backup')}
            </button>

            {selectedDrive && (
              <button
                type="button"
                onClick={handleBackupAndExit}
                disabled={backingUp || backupSuccess}
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {backingUp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Backing up to {selectedDrive}...</span>
                  </>
                ) : (
                  <>
                    <Usb className="w-3.5 h-3.5" />
                    <span>{t('exit_backup_btn', 'Backup to USB & Exit')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
