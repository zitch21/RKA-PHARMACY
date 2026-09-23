import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
  Building,
  LayoutTemplate,
  RotateCcw,
  HardDrive,
  Download,
  Key,
  Lock,
  FolderSync,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import HelperText from '../components/HelperText';

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

export default function SettingsView({ onRefresh, uiMode = 'clean', onToggleUiMode, onOpenHelp, currentUser }) {
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

  // Password Management States
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

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
      setDefaultNotice('Already in default settings');
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

      setDefaultNotice('Successfully restored default threshold and algorithm parameters.');
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
    <div className={`max-w-4xl mx-auto pb-12 ${uiMode === 'clean' ? 'p-2 sm:p-4 space-y-4' : 'p-4 sm:p-6 space-y-6'}`}>
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <span>{t('set_title')}</span>
          </h2>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-0.5">
            {t('set_subtitle')}
          </HelperText>
        </div>

        <button
          type="button"
          onClick={handleRestoreDefaults}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition disabled:opacity-50 shadow-xs self-start sm:self-auto"
          title="Restore default countdown tiers and FEFO+ parameters"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>{t('set_reset_btn')}</span>
        </button>
      </div>

      {defaultNotice && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
          defaultNotice === 'Already in default settings'
            ? 'bg-amber-50 border border-amber-300 text-amber-900 font-bold'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{defaultNotice}</span>
        </div>
      )}

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t('toast_settings_saved') || 'Settings saved and applied successfully across all inventory modules.'}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Emergency Help Guide Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-xl shadow-md border border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>{t('modal_help_title') || 'Need Help or Emergency Operating Guide?'}</span>
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                {t('btn_how_to_use')}
              </span>
            </h3>
            <HelperText uiMode={uiMode} className="text-xs text-indigo-200 mt-0.5">
              Clear 5-step instructions for non-technical staff or emergency counter handovers.
            </HelperText>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenHelp}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition shrink-0 shadow-sm flex items-center justify-center gap-1.5"
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('btn_how_to_use')}</span>
        </button>
      </div>

      {/* Section 0: UI Display Mode (Minimalist vs Maximalist) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Interface Display Mode (Visual Clutter Control)
              </h3>
              <p className="text-xs text-slate-500">
                Switch between a simplified clean layout and the full analytical clinical view.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
              uiMode === 'clean' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
            }`}>
              Currently: {uiMode === 'clean' ? 'Clean & Simple' : 'Maximalist (Advanced)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Clean & Simple Option */}
          <div
            onClick={() => onToggleUiMode && onToggleUiMode('clean')}
            className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
              uiMode === 'clean'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>🌿 Clean & Simple Mode</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                    Recommended
                  </span>
                </span>
                {uiMode === 'clean' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Reduces visual noise and clutter.</strong> Focuses on the 5 daily counter tabs (Dashboard, Stock In, Purchase Orders, Dispense, Settings) while suppressing verbose helper texts. Highlights big, simple action buttons for high-throughput daily transactions.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-800">
                {uiMode === 'clean' ? '✓ Currently Active' : 'Click to Activate'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleUiMode && onToggleUiMode('clean');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  uiMode === 'clean'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {uiMode === 'clean' ? 'Selected' : 'Switch to Clean'}
              </button>
            </div>
          </div>

          {/* Maximalist Option */}
          <div
            onClick={() => onToggleUiMode && onToggleUiMode('maximalist')}
            className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
              uiMode === 'maximalist'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>⚡ Maximalist (Advanced) Mode</span>
                </span>
                {uiMode === 'maximalist' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Displays full operational telemetry and all 9 navigation tabs.</strong> Shows complete multi-tier countdowns, Expiry Risk Margins, Average Daily Demand, mathematical formulas, and comprehensive audit metadata.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-800">
                {uiMode === 'maximalist' ? '✓ Currently Active' : 'Click to Activate'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleUiMode && onToggleUiMode('maximalist');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  uiMode === 'maximalist'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {uiMode === 'maximalist' ? 'Selected' : 'Switch to Maximalist'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Expiration Risk Tiers */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Expiration Risk Classification Tiers
              </h3>
              <p className="text-xs text-slate-500">
                Configurable countdown days for monitoring and release prioritization.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
              <label className="block text-xs font-semibold uppercase text-emerald-900 mb-1">
                Safe Tier (&gt; Days)
              </label>
              <input
                type="number"
                name="safe_threshold_days"
                required
                value={settings.safe_threshold_days}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-emerald-300 rounded bg-white font-bold text-slate-900 focus:outline-none"
              />
              <span className="text-[10px] text-emerald-700 mt-1 block">Default: &gt; 180 days</span>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200">
              <label className="block text-xs font-semibold uppercase text-blue-900 mb-1">
                Monitor Tier (Start Days)
              </label>
              <input
                type="number"
                name="monitor_threshold_days"
                required
                value={settings.monitor_threshold_days}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-blue-300 rounded bg-white font-bold text-slate-900 focus:outline-none"
              />
              <span className="text-[10px] text-blue-700 mt-1 block">Default: 91 to 180 days</span>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
              <label className="block text-xs font-semibold uppercase text-amber-900 mb-1">
                Warning Tier (Start Days)
              </label>
              <input
                type="number"
                name="warning_threshold_days"
                required
                value={settings.warning_threshold_days}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-amber-300 rounded bg-white font-bold text-slate-900 focus:outline-none"
              />
              <span className="text-[10px] text-amber-700 mt-1 block">Default: 31 to 90 days</span>
            </div>

            <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200">
              <label className="block text-xs font-semibold uppercase text-rose-900 mb-1">
                Critical Tier (Start Days)
              </label>
              <input
                type="number"
                name="critical_threshold_days"
                required
                value={settings.critical_threshold_days}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-rose-300 rounded bg-white font-bold text-slate-900 focus:outline-none"
              />
              <span className="text-[10px] text-rose-700 mt-1 block">Default: 1 to 30 days</span>
            </div>
          </div>
        </div>

        {/* Section 2: FEFO+ & Reorder Calculation Parameters */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-purple-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                FEFO+ Algorithm & Suggested Reorder Engine Parameters
              </h3>
              <p className="text-xs text-slate-500">
                Formula: Suggested Reorder Level = Daily Demand × (Lead Time + Buffer Days)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Default Safety Buffer (Days)
              </label>
              <input
                type="number"
                name="default_buffer_days"
                min="0"
                required
                value={settings.default_buffer_days}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Number of extra sales days maintained as safety stock
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                Forecasting Baseline Window (N Operational Days)
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
                      className={`py-2 px-2 rounded-lg border text-xs font-bold transition flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{days} Days</span>
                      <span className="text-[10px] font-normal text-slate-500">
                        {days === 30 ? '(Default)' : `${days}d Window`}
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                Moving average observation window (N). When transaction history t &lt; N, automated forecasting is suppressed and falls back to manual reorder points (Cold-Start Rule).
              </span>
            </div>

            {/* PO Drafting Automation Mode */}
            <div className="md:col-span-2 pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5 flex items-center justify-between">
                <span>PO Drafting Automation Mode</span>
                <span className="text-[10px] text-slate-500 font-normal">Controls how Suggested Reorders create Purchase Orders</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setSettings(prev => ({ ...prev, po_drafting_mode: 'manual' }))}
                  className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 ${
                    (settings.po_drafting_mode || 'manual') === 'manual'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="po_drafting_mode"
                    value="manual"
                    checked={(settings.po_drafting_mode || 'manual') === 'manual'}
                    onChange={handleChange}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">Manual Confirmation (Default)</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Prompts the operator with an itemized review dialog before generating the consolidated draft Purchase Order.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setSettings(prev => ({ ...prev, po_drafting_mode: 'instant_auto' }))}
                  className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 ${
                    settings.po_drafting_mode === 'instant_auto'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="po_drafting_mode"
                    value="instant_auto"
                    checked={settings.po_drafting_mode === 'instant_auto'}
                    onChange={handleChange}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">Instant Auto-Draft Mode</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Clicking Accept instantly persists the consolidated draft to the Purchase Orders database and presents a confirmation toast.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Pharmacy Clinic Profile */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-slate-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{t('set_tab_profile') || 'Clinic Pharmacy Profile'}</h3>
              <HelperText uiMode={uiMode} className="text-xs text-slate-500">Appears on receipts, printable barcode tags, and audit reports</HelperText>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                {t('set_pharmacy_name')}
              </label>
              <input
                type="text"
                name="pharmacy_name"
                value={settings.pharmacy_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                {t('set_address')}
              </label>
              <input
                type="text"
                name="pharmacy_address"
                value={settings.pharmacy_address}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                {t('set_owner')}
              </label>
              <input
                type="text"
                name="pharmacy_owner"
                value={settings.pharmacy_owner}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Settings...' : t('set_save_btn')}</span>
          </button>
        </div>
      </form>

      {/* Section 4: End-of-Day Database Backup & Removable Storage */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">End-of-Day Database Backup & Removable Storage</h3>
              <p className="text-xs text-slate-500">
                Secure daily inventory backups to removable USB drives
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
            WAL Safe Checkpoint
          </span>
        </div>

        {backupMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{backupMessage}</span>
          </div>
        )}

        {backupError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{backupError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-slate-600" />
                Browser Snapshot Download
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Downloads a point-in-time, WAL-checkpointed SQLite database (.db) directly through your browser.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup Copy</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FolderSync className="w-3.5 h-3.5 text-blue-600" />
                Removable USB Drive Export
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Writes backup directly to a designated flash drive folder (<code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">[Drive]:\RKA_PHARMACY_BACKUPS\</code>).
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={selectedDrive}
                  onChange={(e) => setSelectedDrive(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {drives.length === 0 ? (
                    <option value="">No storage drives detected</option>
                  ) : (
                    drives.map(d => (
                      <option key={d.device_id} value={d.device_id}>
                        {d.device_id} ({d.volume_name}) - {d.free_space_gb} GB free {d.is_removable ? '★ [Removable USB]' : '[Local]'}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={fetchDrives}
                  disabled={drivesLoading}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-300 rounded-lg transition"
                  title="Rescan connected storage drives (USB flash drives)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${drivesLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleExportToRemovable}
                  disabled={backupLoading || !selectedDrive}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition"
                >
                  <FolderSync className="w-3.5 h-3.5" />
                  <span>{backupLoading ? 'Exporting...' : 'Export to Drive'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Station Security & Operator Password Management */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Station Security & Password Management</h3>
              <p className="text-xs text-slate-500">
                Scrypt-hashed password storage for authorized pharmacy personnel
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded">
            Operator: {currentUser?.full_name || 'Administrator'}
          </span>
        </div>

        {passwordMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordMessage}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChangeSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="•••••••• (min 6 chars)"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Confirm New Password
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={passwordLoading}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-xs transition"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{passwordLoading ? 'Updating...' : 'Update'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
