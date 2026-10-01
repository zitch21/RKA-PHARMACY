import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
  Building,
  RotateCcw,
  HardDrive,
  Download,
  Key,
  Lock,
  FolderSync,
  RefreshCw,
  BookOpen,
  Usb,
  ArchiveRestore,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  Sparkles,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import HelperText from '../components/HelperText';
import { broadcastInventoryUpdate } from '../utils/syncChannel';
import { getIsDemoMode, setIsDemoMode } from '../utils/apiInterceptor';

const DEFAULT_CONFIG = {
  safe_threshold_days: '180',
  monitor_threshold_days: '91',
  warning_threshold_days: '31',
  critical_threshold_days: '1',
  default_buffer_days: '3',
  history_days_fefo_plus: '30',
  forecasting_window_days: '30',
  po_drafting_mode: 'manual'
};

const inputCls = "w-full px-3 py-2 text-xs border border-zinc-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white dark:bg-[#1a202c] text-slate-800 dark:text-slate-100";
const inputMonoCls = `${inputCls} tabular-nums`;

export default function SettingsView({
  onRefresh,
  uiMode = 'clean',
  onOpenHelp,
  currentUser,
  activeSubTab = 'general-pref',
  _onSubTabChange,
}) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    pharmacy_name: 'R.K.A Pharmacy',
    pharmacy_address: 'San Antonio, Agoo, La Union',
    pharmacy_owner: 'Lourdes Gincen L. Cesista',
    safe_threshold_days: '180',
    monitor_threshold_days: '91',
    warning_threshold_days: '31',
    critical_threshold_days: '1',
    default_buffer_days: '3',
    history_days_fefo_plus: '30',
    forecasting_window_days: '30',
    po_drafting_mode: 'manual'
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [defaultNotice, setDefaultNotice] = useState(null);
  const [error, setError] = useState(null);

  // Backup & Storage States
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState('');
  const [drivesLoading, setDrivesLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState(null);
  const [backupError, setBackupError] = useState(null);

  // Guided Database Restore States
  const [backupList, setBackupList] = useState([]);
  const [selectedBackupFile, setSelectedBackupFile] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState(null);
  const [restoreError, setRestoreError] = useState(null);
  const [backupsLoading, setBackupsLoading] = useState(false);

  // Password Management States
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Interactive Demonstration Environment States
  const [isDemo, setIsDemo] = useState(getIsDemoMode());
  const [demoResetLoading, setDemoResetLoading] = useState(false);
  const [demoMessage, setDemoMessage] = useState(null);

  useEffect(() => {
    const handleDemoChange = (e) => {
      setIsDemo(e.detail?.isDemo ?? getIsDemoMode());
    };
    window.addEventListener('rka_demo_mode_changed', handleDemoChange);
    return () => window.removeEventListener('rka_demo_mode_changed', handleDemoChange);
  }, []);

  const handleToggleDemoMode = () => {
    const next = !isDemo;
    setIsDemoMode(next);
    setIsDemo(next);
    setDemoMessage(next ? 'Switched to Demo Mode (Isolated Sandbox).' : 'Returned to Live Production Mode.');
    setTimeout(() => setDemoMessage(null), 4000);
    if (onRefresh) onRefresh();
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset the Demo Sandbox database back to fresh demo clinic records? (Production data is untouched).')) return;
    setDemoResetLoading(true);
    setDemoMessage(null);
    try {
      const res = await fetch('/api/settings/demo-reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset demo data');
      setDemoMessage('Demo sandbox has been reset with pristine initial records.');
      setTimeout(() => setDemoMessage(null), 4000);
      if (onRefresh) onRefresh();
      broadcastInventoryUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setDemoResetLoading(false);
    }
  };

  // Factory System Reset States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [systemResetLoading, setSystemResetLoading] = useState(false);
  const [systemResetMessage, setSystemResetMessage] = useState(null);
  const [systemResetError, setSystemResetError] = useState(null);

  const handleExecuteSystemReset = async (e) => {
    e.preventDefault();
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      setSystemResetError('Please type RESET in capital letters to confirm.');
      return;
    }
    setSystemResetLoading(true);
    setSystemResetError(null);
    try {
      const res = await fetch('/api/settings/system-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'System reset failed');
      setShowResetModal(false);
      setResetConfirmText('');
      setSystemResetMessage(`Factory reset complete! Pre-wipe backup saved as ${data.backup_file || 'backup snapshot'}. All transactional and inventory data has been cleared. The system is clean for fresh clinic entries.`);
      if (onRefresh) onRefresh();
      broadcastInventoryUpdate();
    } catch (err) {
      setSystemResetError(err.message);
    } finally {
      setSystemResetLoading(false);
    }
  };

  const fetchDrives = () => {
    setDrivesLoading(true);
    fetch('/api/backup/drives')
      .then(res => res.json())
      .then(data => {
        if (data && data.drives) {
          setDrives(data.drives);
          const removable = data.drives.find(d => d.is_removable);
          if (removable) setSelectedDrive(removable.device_id);
          else if (data.drives.length > 0) setSelectedDrive(data.drives[0].device_id);
        }
      })
      .catch(err => console.error('Failed to load storage drives:', err))
      .finally(() => setDrivesLoading(false));
  };

  const fetchBackupList = () => {
    setBackupsLoading(true);
    fetch('/api/backup/list')
      .then(res => res.json())
      .then(data => {
        if (data && data.backups) {
          setBackupList(data.backups);
          if (data.backups.length > 0) {
            setSelectedBackupFile(prev => prev || data.backups[0].filename);
          }
        }
      })
      .catch(err => console.error('Failed to load backup list:', err))
      .finally(() => setBackupsLoading(false));
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBackupFile) {
      setRestoreError('Please select a backup file to restore.');
      return;
    }
    if (!restorePassword) {
      setRestoreError('Administrator password is required to authorize database restoration.');
      return;
    }

    if (!window.confirm(`RESTORE CONFIRMATION:\nAre you sure you want to restore the database from ${selectedBackupFile}?\n\nA pre-restore safety snapshot of the active database will be saved automatically.`)) {
      return;
    }

    setRestoreLoading(true);
    setRestoreError(null);
    setRestoreMessage(null);

    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: restorePassword,
          backup_filename: selectedBackupFile,
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Database restoration failed');
      }

      setRestoreMessage(data.message);
      setRestorePassword('');
      fetchBackupList();
      if (onRefresh) onRefresh();
      broadcastInventoryUpdate('DATABASE_RESTORED', { source: selectedBackupFile });
    } catch (err) {
      setRestoreError(err.message);
    } finally {
      setRestoreLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error('Failed to load settings:', err));

    fetchDrives();
    fetchBackupList();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDefaults = async () => {
    setError(null);
    setSaved(false);

    const isAlreadyDefault =
      String(settings.safe_threshold_days) === DEFAULT_CONFIG.safe_threshold_days &&
      String(settings.monitor_threshold_days) === DEFAULT_CONFIG.monitor_threshold_days &&
      String(settings.warning_threshold_days) === DEFAULT_CONFIG.warning_threshold_days &&
      String(settings.critical_threshold_days) === DEFAULT_CONFIG.critical_threshold_days &&
      String(settings.default_buffer_days) === DEFAULT_CONFIG.default_buffer_days &&
      String(settings.forecasting_window_days || settings.history_days_fefo_plus) === DEFAULT_CONFIG.forecasting_window_days;

    if (isAlreadyDefault) {
      setDefaultNotice(t('set_already_default_notice') || 'Already in default clinical settings');
      setTimeout(() => setDefaultNotice(null), 3500);
      return;
    }

    const newSettings = {
      ...settings,
      ...DEFAULT_CONFIG
    };

    setSettings(newSettings);
    setLoading(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore default settings');

      setDefaultNotice(t('set_restored_defaults_notice') || 'Successfully restored default threshold and algorithm parameters.');
      setTimeout(() => setDefaultNotice(null), 4000);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = `/api/backup/download?operator=${encodeURIComponent(currentUser?.full_name || 'Lourdes Gincen L. Cesista')}`;
  };

  const handleExportToRemovable = async () => {
    if (!selectedDrive) {
      setBackupError('Please select a storage drive first.');
      return;
    }
    setBackupLoading(true);
    setBackupError(null);
    setBackupMessage(null);
    try {
      const res = await fetch('/api/backup/export-removable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drive_letter: selectedDrive,
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to export backup to removable storage.');
      setBackupMessage(data.message);
      setTimeout(() => setBackupMessage(null), 6000);
    } catch (err) {
      setBackupError(err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser?.username || 'admin',
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password.');
      setPasswordMessage(data.message);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMessage(null), 5000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto pb-12 ${uiMode === 'clean' ? 'p-2 sm:p-4 space-y-4' : 'p-4 sm:p-6 space-y-5'}`}>
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-4 h-4 text-teal-600" />
            <span>{t('set_title') || 'Workstation Configuration & Clinic Settings'}</span>
          </h2>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-0.5">
            {t('set_subtitle') || 'Threshold limits, FEFO+ algorithm parameters, automated PO mode, and secure database backups'}
          </HelperText>
        </div>

        <button
          type="button"
          onClick={handleRestoreDefaults}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg transition disabled:opacity-50 shadow-xs self-start sm:self-auto cursor-pointer"
          title={t('title_restore_defaults', 'Restore default countdown tiers and FEFO+ parameters')}
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
          <span>{t('set_reset_btn') || 'Reset to Clinical Defaults'}</span>
        </button>
      </div>

      {defaultNotice && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
          defaultNotice.includes('Already')
            ? 'bg-amber-50 border border-amber-300 text-amber-900 font-bold'
            : 'bg-teal-50 border border-teal-200 text-teal-900 font-semibold'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
          <span>{defaultNotice}</span>
        </div>
      )}

      {saved && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{t('toast_settings_saved') || 'Settings saved and applied successfully across all inventory modules.'}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Emergency Operating Guide Banner */}
      <div className="bg-slate-900 dark:bg-[#161b22] text-zinc-100 p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>{t('modal_help_title') || 'Need Help or Emergency Operating Guide?'}</span>
              <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {t('btn_how_to_use') || 'Staff Manual'}
              </span>
            </h3>
            <HelperText uiMode={uiMode} className="text-xs text-slate-400 mt-0.5">
              Clear 5-step instructions for non-technical staff or emergency counter handovers.
            </HelperText>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenHelp}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shrink-0 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{t('btn_how_to_use') || 'Open Guide'}</span>
        </button>
      </div>

      {/* Interactive Demonstration Environment (Demo Mode) */}
      {(activeSubTab === 'general-pref' || (!activeSubTab || (activeSubTab !== 'branch-profile' && activeSubTab !== 'security-keys'))) && (
      <div className={`p-5 rounded-xl border shadow-xs space-y-3.5 transition ${
        isDemo ? 'bg-amber-50/50 border-amber-300' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${isDemo ? 'text-amber-600' : 'text-teal-600'}`} />
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>{t('set_demo_heading') || 'Interactive Demonstration Environment (Demo Mode)'}</span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border tabular-nums ${
                  isDemo
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  {isDemo ? (t('set_demo_active_tag') || 'Sandbox Active') : (t('set_prod_active_tag') || 'Production Active')}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {t('set_demo_desc') || 'Practice clinic operations, run simulations, and train staff on an isolated SQLite database without touching production records.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleToggleDemoMode}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-xs transition cursor-pointer ${
                isDemo
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDemo ? (t('set_switch_prod_btn') || 'Exit Demo Mode') : (t('set_switch_demo_btn') || 'Switch to Demo Mode')}</span>
            </button>

            {isDemo && (
              <button
                type="button"
                onClick={handleResetDemoData}
                disabled={demoResetLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                title={t('title_reset_demo', 'Reset the demo sandbox back to fresh baseline records')}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${demoResetLoading ? 'animate-spin' : ''}`} />
                <span>{demoResetLoading ? (t('set_resetting_demo_btn') || 'Resetting...') : (t('set_reset_demo_data_btn') || 'Reset Demo Data')}</span>
              </button>
            )}
          </div>
        </div>

        {demoMessage && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-xs text-teal-900">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{demoMessage}</span>
          </div>
        )}

        <div className="text-xs text-slate-600 leading-relaxed bg-zinc-50/70 p-3 rounded-lg border border-zinc-200/80">
          <p>
            {t('set_demo_isolation_guarantee') || 'Isolation Guarantee: When Demo Mode is active, all API requests carry an isolated session context. Every dispensed medicine, added batch, or transaction modification is recorded strictly in server/data/pharmacy_demo.db. Your live production pharmacy inventory remains 100% unaltered.'}
          </p>
        </div>
      </div>
      )}

      {(activeSubTab === 'general-pref' || activeSubTab === 'branch-profile' || (!activeSubTab || activeSubTab !== 'security-keys')) && (
      <form onSubmit={handleSave} className="space-y-4">
        {/* Section 1: Expiration Risk Tiers */}
        {(activeSubTab === 'general-pref' || (!activeSubTab || (activeSubTab !== 'branch-profile' && activeSubTab !== 'security-keys'))) && (
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Clock className="w-4 h-4 text-teal-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t('set_shelf_life_heading') || 'Expiration Risk Classification Tiers'}
              </h3>
              <p className="text-xs text-zinc-500">
                {t('set_shelf_life_desc') || 'Configurable countdown threshold days for batch classification and release prioritization.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-900 mb-1">
                {t('set_safe_horizon') || 'Safe Tier (> Days)'}
              </label>
              <input
                type="number"
                name="safe_threshold_days"
                required
                value={settings.safe_threshold_days}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-teal-300 rounded-lg bg-white font-bold tabular-nums text-slate-900 focus:outline-none"
              />
              <span className="text-[9px] text-teal-700 mt-1 block tabular-nums">{t('set_default_safe') || 'Default: > 180 days'}</span>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                {t('set_monitor_horizon') || 'Monitor Tier (Start Days)'}
              </label>
              <input
                type="number"
                name="monitor_threshold_days"
                required
                value={settings.monitor_threshold_days}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white font-bold tabular-nums text-slate-900 focus:outline-none"
              />
              <span className="text-[9px] text-zinc-500 mt-1 block tabular-nums">{t('set_default_monitor') || 'Default: 91 to 180 days'}</span>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1">
                {t('set_warning_horizon') || 'Warning Tier (Start Days)'}
              </label>
              <input
                type="number"
                name="warning_threshold_days"
                required
                value={settings.warning_threshold_days}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-white font-bold tabular-nums text-slate-900 focus:outline-none"
              />
              <span className="text-[9px] text-amber-700 mt-1 block tabular-nums">{t('set_default_warning') || 'Default: 31 to 90 days'}</span>
            </div>

            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-900 mb-1">
                {t('set_critical_horizon') || 'Critical Tier (Start Days)'}
              </label>
              <input
                type="number"
                name="critical_threshold_days"
                required
                value={settings.critical_threshold_days}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-rose-300 rounded-lg bg-white font-bold tabular-nums text-slate-900 focus:outline-none"
              />
              <span className="text-[9px] text-rose-700 mt-1 block tabular-nums">{t('set_default_critical') || 'Default: 1 to 30 days'}</span>
            </div>
          </div>
        </div>
        )}

        {/* Section 2: FEFO+ Algorithm & PO Drafting Automation Mode */}
        {(activeSubTab === 'general-pref' || (!activeSubTab || (activeSubTab !== 'branch-profile' && activeSubTab !== 'security-keys'))) && (
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Sliders className="w-4 h-4 text-teal-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t('set_reorder_engine_heading') || 'FEFO+ Algorithm & Dynamic Reorder Engine Parameters'}
              </h3>
              <p className="text-xs text-zinc-500">
                {t('set_reorder_engine_formula') || 'Formula: Suggested Reorder Level = Daily Demand × (Supplier Lead Time + Buffer Days)'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('set_buffer_days') || 'Default Safety Buffer (Days)'}
              </label>
              <input
                type="number"
                name="default_buffer_days"
                min="0"
                required
                value={settings.default_buffer_days}
                onChange={handleChange}
                className={inputMonoCls}
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                {t('set_buffer_days_desc') || 'Number of extra sales days maintained as safety stock buffer'}
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('set_velocity_window') || 'Forecasting Baseline Window (N Operational Days)'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 30].map((days) => {
                  const currentVal = parseInt(settings.forecasting_window_days || settings.history_days_fefo_plus || '30', 10);
                  const isSelected = currentVal === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        forecasting_window_days: String(days),
                        history_days_fefo_plus: String(days)
                      }))}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 text-teal-900 ring-1 ring-teal-400'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="tabular-nums">{days} {t('sim_telemetry_days') || 'Days'}</span>
                      <span className="text-[9px] font-normal text-zinc-400">
                        {days === 30 ? (t('fefo_default_tag') || '(Default)') : `${days}d`}
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                {t('set_velocity_window_desc') || 'Moving average window (N). When history < N, automated forecasting falls back to manual thresholds (Cold-Start Rule).'}
              </span>
            </div>

            {/* PO Drafting Automation Mode */}
            <div className="md:col-span-2 pt-3 border-t border-zinc-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center justify-between">
                <span>{t('set_auto_draft_mode') || 'Purchase Order Drafting Mode'}</span>
                <span className="text-[10px] text-zinc-400 font-normal">{t('set_auto_draft_mode_desc') || 'Controls how suggested reorders generate Purchase Orders'}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setSettings(prev => ({ ...prev, po_drafting_mode: 'manual' }))}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    (settings.po_drafting_mode || 'manual') === 'manual'
                      ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-400'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="po_drafting_mode"
                    value="manual"
                    checked={(settings.po_drafting_mode || 'manual') === 'manual'}
                    onChange={handleChange}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">{t('set_po_manual_title') || 'Manual Confirmation (Recommended)'}</div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {t('set_po_manual_desc') || 'Prompts with an itemized review dialog to verify order quantities and unit costs before generating the draft PO.'}
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setSettings(prev => ({ ...prev, po_drafting_mode: 'instant_auto' }))}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    settings.po_drafting_mode === 'instant_auto'
                      ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-400'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="po_drafting_mode"
                    value="instant_auto"
                    checked={settings.po_drafting_mode === 'instant_auto'}
                    onChange={handleChange}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">{t('set_po_auto_title') || 'Instant Auto-Draft Mode'}</div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {t('set_po_auto_desc') || 'Clicking Accept instantly persists the consolidated draft to the Purchase Orders ledger and displays a confirmation toast.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Section 3: Pharmacy Profile */}
        {(activeSubTab === 'branch-profile' || (!activeSubTab || (activeSubTab !== 'general-pref' && activeSubTab !== 'security-keys'))) && (
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Building className="w-4 h-4 text-teal-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{t('set_tab_profile') || 'Clinic Pharmacy Profile'}</h3>
              <HelperText uiMode={uiMode} className="text-xs text-zinc-500">{t('set_profile_helper', 'Appears on receipts, printable barcode labels, and procurement slips')}</HelperText>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('set_pharmacy_name') || 'Pharmacy Name'}
              </label>
              <input
                type="text"
                name="pharmacy_name"
                value={settings.pharmacy_name}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('set_address') || 'Clinic Branch Address'}
              </label>
              <input
                type="text"
                name="pharmacy_address"
                value={settings.pharmacy_address}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('set_owner') || 'Pharmacist / Sole Proprietor'}
              </label>
              <input
                type="text"
                name="pharmacy_owner"
                value={settings.pharmacy_owner}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
          </div>
        </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{loading ? (t('saving_status') || 'Saving Settings...') : (t('set_save_btn') || 'Save Configuration')}</span>
          </button>
        </div>
      </form>
      )}

      {/* Security & Backup Sections */}
      {(activeSubTab === 'security-keys' || (!activeSubTab || (activeSubTab !== 'general-pref' && activeSubTab !== 'branch-profile'))) && (
      <>
      {/* Section 4: End-of-Day Database Backup & Removable Storage */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-teal-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{t('set_backup_storage_heading') || 'End-of-Day Database Backup & Removable Storage'}</h3>
              <p className="text-xs text-zinc-500">
                {t('set_backup_storage_desc') || 'Secure point-in-time inventory backups to removable USB drives or browser download'}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[9px] font-bold tabular-nums uppercase bg-teal-50 text-teal-800 border border-teal-200 rounded">
            {t('set_wal_safe_tag') || 'WAL CHECKPOINT SAFE'}
          </span>
        </div>

        {backupMessage && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-xs text-teal-900">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{backupMessage}</span>
          </div>
        )}

        {backupError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{backupError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-zinc-500" />
                {t('set_browser_snapshot_title') || 'Browser Snapshot Download'}
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                {t('set_browser_snapshot_desc') || 'Downloads a point-in-time, WAL-checkpointed SQLite database file (.db) directly via browser.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('set_download_sql_btn') || 'Download Database Snapshot'}</span>
            </button>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Usb className="w-3.5 h-3.5 text-teal-600" />
                {t('set_usb_backup_title') || 'Removable USB Drive Export'}
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                {t('set_usb_backup_desc') || 'Writes backup directly to a designated flash drive folder ([Drive]:\\RKA_PHARMACY_BACKUPS\\).'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={selectedDrive}
                  onChange={(e) => setSelectedDrive(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
                >
                  {drives.length === 0 ? (
                    <option value="">{t('set_no_drives_detected') || 'No storage drives detected'}</option>
                  ) : (
                    drives.map(d => (
                      <option key={d.device_id} value={d.device_id}>
                        {d.device_id} ({d.volume_name}) - {d.free_gb || d.free_space_gb} GB free {d.is_removable ? '★ [USB Flash]' : '[Local]'}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={fetchDrives}
                  disabled={drivesLoading}
                  className="p-1.5 text-zinc-600 hover:bg-zinc-200 border border-zinc-300 rounded-lg transition cursor-pointer"
                  title={t('title_rescan_drives', 'Rescan connected storage drives')}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${drivesLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleExportToRemovable}
                  disabled={backupLoading || !selectedDrive}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer shrink-0"
                >
                  <FolderSync className="w-3.5 h-3.5" />
                  <span>{backupLoading ? (t('set_exporting_btn') || 'Exporting...') : (t('set_usb_backup_btn') || 'Export to Drive')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Guided Database Restoration Panel */}
        <div className="pt-4 border-t border-zinc-100">
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-2.5">
              <div className="flex items-center gap-2">
                <ArchiveRestore className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {t('set_guided_restore_heading') || 'Safe Database Restoration from Verified Snapshot'}
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    {t('set_guided_restore_desc') || 'Point-in-time recovery with mandatory PRAGMA integrity check and automated pre-restore safety snapshot.'}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-bold tabular-nums uppercase bg-rose-50 text-rose-700 border border-rose-200 rounded self-start sm:self-auto">
                {t('set_admin_restricted_tag') || 'ADMIN RESTRICTED'}
              </span>
            </div>

            {restoreMessage && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-xs text-teal-900">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{restoreMessage}</span>
              </div>
            )}

            {restoreError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}

            <form onSubmit={handleRestoreSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {t('set_select_backup_available', { count: backupList.length }) || `Select Backup File (${backupList.length} Available)`}
                    </label>
                    <button
                      type="button"
                      onClick={fetchBackupList}
                      disabled={backupsLoading}
                      className="text-[10px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${backupsLoading ? 'animate-spin' : ''}`} />
                      <span>{t('set_rescan_backups') || 'Rescan Backups'}</span>
                    </button>
                  </div>
                  <select
                    value={selectedBackupFile}
                    onChange={(e) => setSelectedBackupFile(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none tabular-nums cursor-pointer"
                  >
                    {backupList.length === 0 ? (
                      <option value="">{t('set_no_backups_found') || 'No backup snapshots found in data/backups/'}</option>
                    ) : (
                      backupList.map(b => (
                        <option key={b.filename} value={b.filename}>
                          {b.filename} ({b.size_mb} MB) {b.is_pre_restore ? '★ [Safety Snapshot]' : '[Daily Backup]'}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    {t('set_operator_password_label') || 'Administrator Password Authorization *'}
                  </label>
                  <input
                    type="password"
                    required
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                    placeholder={t('set_restore_password_placeholder') || 'Enter clinic admin password...'}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  {t('set_restore_safety_guarantee') || 'Safety Protection Guarantee: The restore engine validates the backup candidate with SQLite PRAGMA integrity_check, confirms schema presence, and automatically creates a pre-restore safety snapshot before replacing active data.'}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={restoreLoading || backupList.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer"
                >
                  <ArchiveRestore className="w-3.5 h-3.5" />
                  <span>{restoreLoading ? (t('set_restoring_db_btn') || 'Verifying & Restoring…') : (t('set_restore_db_btn') || 'Verify & Restore Database')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Section 5: Station Security & Operator Password Management */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{t('set_security_heading') || 'Station Security & Password Management'}</h3>
              <p className="text-xs text-zinc-500">
                {t('set_security_desc') || 'Scrypt-hashed password storage for authorized pharmacy personnel'}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] tabular-nums font-bold bg-zinc-100 text-zinc-800 border border-zinc-200 rounded">
            {t('audit_col_operator') || 'Operator'}: {currentUser?.full_name || 'Administrator'}
          </span>
        </div>

        {passwordMessage && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-xs text-teal-900">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{passwordMessage}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChangeSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              {t('set_curr_pass') || 'Current Password'}
            </label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              {t('set_new_pass') || 'New Password'}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder={t('ph_min_chars', '•••••••• (min 6 chars)')}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              {t('set_confirm_pass') || 'Confirm New Password'}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="••••••••"
                className={inputCls}
              />
              <button
                type="submit"
                disabled={passwordLoading}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{passwordLoading ? (t('set_updating_pass_btn') || 'Updating...') : (t('set_update_pass_btn') || 'Update')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Section 6: Factory Data Wipe & System Reset */}
      <div className="bg-rose-50/40 p-5 rounded-xl border border-rose-300 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200 pb-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>{t('set_factory_wipe_heading') || 'Factory Data Wipe & System Reset'}</span>
                <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                  {t('set_danger_zone_tag') || 'Danger Zone'}
                </span>
              </h3>
              <p className="text-xs text-rose-700/80">
                {t('set_factory_wipe_desc') || 'Permanently wipe all inventory, batches, transactions, purchase orders, and logs for a clean clinic launch.'}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[9px] font-bold tabular-nums uppercase bg-rose-100 text-rose-800 border border-rose-300 rounded self-start sm:self-auto">
            {t('set_pre_wipe_tag') || 'PRE-WIPE AUTO-BACKUP INCLUDED'}
          </span>
        </div>

        {systemResetMessage && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-xs text-teal-900">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{systemResetMessage}</span>
          </div>
        )}

        {systemResetError && (
          <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl flex items-center gap-2 text-xs text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{systemResetError}</span>
          </div>
        )}

        <div className="p-4 bg-white border border-rose-200 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800">
                {t('set_wipe_info_title') || 'What does System Reset do?'}
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                <li>{t('set_wipe_info_1') || 'Creates an automatic, timestamped SQLite backup in server/data/backups/ before any data is deleted.'}</li>
                <li>{t('set_wipe_info_2') || 'Completely clears all inventory medicines, batch records, stock-in/dispensing transactions, purchase orders, alert acknowledgments, evaluations, and audit logs.'}</li>
                <li>{t('set_wipe_info_3') || 'Resets table ID autoincrement sequences back to 1.'}</li>
                <li>{t('set_wipe_info_4') || 'Retains your administrator user account credentials and default clinic configuration settings.'}</li>
                <li>{t('set_wipe_info_5') || 'Sets the auto-seed prevention flag so rebooting the workstation will not repopulate mock data.'}</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => {
                setResetConfirmText('');
                setSystemResetError(null);
                setShowResetModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('set_initiate_wipe_btn') || 'Initiate Factory System Reset & Wipe'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for System Reset */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-300 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{t('set_confirm_wipe_title') || 'Confirm Factory System Reset'}</h3>
                  <p className="text-[11px] text-rose-600 font-medium">{t('set_confirm_wipe_warning') || 'Irreversible Production Data Wipe'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                {t('set_confirm_wipe_desc') || 'You are about to permanently erase all medicines, batches, purchase orders, dispensing logs, and audit records from this workstation.'}
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] leading-relaxed">
                {t('set_confirm_wipe_safety') || 'Safety Note: A full database snapshot will be automatically saved to data/backups/ before wiping. Admin credentials and system settings will be preserved.'}
              </div>
              <p className="font-semibold text-slate-800 pt-1">
                {t('set_confirm_wipe_prompt') || 'To confirm, type RESET in capital letters below:'}
              </p>
            </div>

            <form onSubmit={handleExecuteSystemReset} className="space-y-3">
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder={t('ph_type_reset', 'Type RESET to confirm...')}
                autoFocus
                className="w-full px-3 py-2 text-xs border-2 border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono text-center font-bold tracking-widest uppercase bg-rose-50/30 text-rose-900"
              />

              {systemResetError && (
                <div className="text-xs text-rose-600 font-bold text-center">
                  {systemResetError}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={systemResetLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition cursor-pointer"
                >
                  {t('set_cancel_wipe_btn') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={systemResetLoading || resetConfirmText.trim().toUpperCase() !== 'RESET'}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{systemResetLoading ? (t('set_executing_wipe_btn') || 'Executing System Reset...') : (t('set_execute_wipe_btn') || 'Permanently Wipe & Reset Database')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
