import React, { useState, useEffect } from 'react';
import { AlertTriangle, LogOut, X, CheckCircle2, HardDrive, Usb, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ExitConfirmModal({ isOpen, onClose, currentUser }) {
  const { t } = useLanguage();
  const [drives, setDrives] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState('');
  const [backingUp, setBackingUp] = useState(false);
  const [backupError, setBackupError] = useState(null);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBackupError(null);
      setBackupSuccess(false);
      setBackingUp(false);
      setIsClosed(false);
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
    try {
      fetch('/api/backup/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista'
        }),
        keepalive: true
      }).catch(() => {});
    } catch {
      // Ignore network errors on shutdown
    }
    window.close();
    setTimeout(() => {
      setIsClosed(true);
    }, 200);
  };

  const handleBackupAndExit = async () => {
    if (!selectedDrive) {
      setBackupError(t('exit_err_select_drive', 'Please select a target backup drive.'));
      return;
    }

    setBackingUp(true);
    setBackupError(null);

    try {
      const token = sessionStorage.getItem('rka_auth_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/backup/export-removable', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          drive_letter: selectedDrive,
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#181d26] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
        <div className="px-6 py-4.5 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                {t('exit_dialog_title', 'Exit Workstation Confirmation')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('exit_modal_subtitle', 'Safe session termination and automated database backup')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={backingUp}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isClosed ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t('exit_modal_closed_title', 'Workstation Safely Closed')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t('exit_modal_closed_desc', 'Database checkpoints saved. You can now safely close this browser window or tab.')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              {t('btn_close_dialog', 'Close Dialog')}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4" />
                </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {t('exit_modal_close_query', 'Close active pharmacy workstation session?')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {t('exit_dialog_desc', 'Closing the application will end the active counter session. Please ensure all pending transactions or receiving records are completed.')}
              </p>
            </div>
          </div>

          {backupError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{backupError}</span>
            </div>
          )}

          {backupSuccess && (
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800/60 rounded-xl text-teal-900 dark:text-teal-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-bold">{t('exit_backup_success_closing', 'Database backup successful! Closing application...')}</span>
            </div>
          )}

          {/* Drive Detection Banner */}
          <div className="p-4 bg-slate-50 dark:bg-[#1e2430] border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                {usbDrive ? <Usb className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> : <HardDrive className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                <span>
                  {usbDrive ? t('exit_drive_usb_detected', 'Removable USB Flash Drive Detected') : t('exit_drive_status', 'Storage Media Status')}
                </span>
              </span>
              {loadingDrives && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400 tabular-nums">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('exit_scanning_drives', 'Scanning drives...')}
                </span>
              )}
            </div>

            {drives.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block tabular-nums">{t('exit_target_drive', 'Target Backup Drive:')}</label>
                <select
                  value={selectedDrive}
                  onChange={(e) => setSelectedDrive(e.target.value)}
                  disabled={backingUp}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#181d26] font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
                >
                  {drives.map(d => (
                    <option key={d.device_id} value={d.device_id}>
                      {d.device_id} ({d.volume_name}) - {d.drive_type_label} [{d.free_gb} GB free]
                    </option>
                  ))}
                </select>
                {targetDrive && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                    {t('exit_wal_backup_path', 'WAL backup path:')} <code className="bg-white dark:bg-[#181d26] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">{targetDrive.device_id}\RKA_PHARMACY_BACKUPS\</code>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                {t('exit_no_usb_detected', 'No removable USB flash drives detected. You can plug in a flash drive or exit directly.')}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={backingUp}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              {t('exit_cancel_btn', 'Cancel (Stay in App)')}
            </button>

            <button
              type="button"
              onClick={handleExit}
              disabled={backingUp}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              {t('exit_now_btn', 'Exit Without Backup')}
            </button>

            {selectedDrive && (
              <button
                type="button"
                onClick={handleBackupAndExit}
                disabled={backingUp || backupSuccess}
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-[0.98] rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {backingUp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('exit_backing_up_to', 'Backing up to {drive}...').replace('{drive}', selectedDrive)}</span>
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
        )}
      </div>
    </div>
  );
}
