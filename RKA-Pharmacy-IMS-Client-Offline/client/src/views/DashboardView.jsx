import React, { useState, useEffect, useRef } from 'react';
import {
  Boxes,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  CheckCircle2,
  Check,
  Activity,
  Pill,
  PackageCheck,
  HardDrive,
  CalendarCheck,
  Plus,
} from 'lucide-react';
import HelperText from '../components/HelperText';
import { useLanguage } from '../context/LanguageContext';
import { formatDatePH, getLocalDateISO } from '../utils/dateFormatter';



function AckBadge({ item, alertType, onAcknowledge }) {
  const { t } = useLanguage();
  if (item.is_acknowledged) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md shrink-0">
        <Check className="w-3 h-3" />
        {t('btn_ack', 'Ack')} ({item.acknowledged_by?.split(' ')[0] || 'Admin'})
      </span>
    );
  }
  const operatorFirst = 'Lourdes';
  return (
    <button
      type="button"
      onClick={() => onAcknowledge && onAcknowledge(item.alert_key, alertType, item.id)}
      className={`inline-flex items-center gap-1 text-[10px] font-bold text-white px-2.5 py-1 rounded-md shadow-xs transition active:scale-[0.97] cursor-pointer shrink-0 ${
        alertType === 'CRITICAL_EXPIRY'
          ? 'bg-rose-600 hover:bg-rose-700'
          : 'bg-amber-600 hover:bg-amber-700'
      }`}
    >
      <CheckCircle2 className="w-3 h-3" />
      {t('btn_ack', 'Ack')} ({operatorFirst})
    </button>
  );
}

export default function DashboardView({
  medicines,
  batches,
  alerts,
  _fefoData,
  onNavigate,
  onRefresh,
  onOpenAddMedicine,
  uiMode = 'clean',
  _onOpenHelp,
  onAcknowledgeAlert,
}) {
  const { t } = useLanguage();
  const alertsSectionRef = useRef(null);

  const hasCritical  = alerts?.critical?.length  > 0;
  const hasLowStock  = alerts?.low_stock?.length > 0;
  const hasAnyAlerts = hasCritical || hasLowStock;

  // Track items dispensed today for Clean mode snapshot
  const [dispensedTodayCount, setDispensedTodayCount] = useState(0);
  const [eodBackupLoading, setEodBackupLoading] = useState(false);
  const [eodBackupSuccess, setEodBackupSuccess] = useState(false);

  const batchesEnteringCriticalTomorrow = (batches || []).filter(b => 
    b.status === 'active' && b.current_quantity > 0 && b.days_to_expiry === 31
  ).length;

  const handleEodBackup = () => {
    setEodBackupLoading(true);
    try {
      window.location.href = '/api/backup/download';
      setEodBackupSuccess(true);
      setTimeout(() => setEodBackupSuccess(false), 6000);
    } catch (err) {
      console.error('Failed to trigger EOD backup:', err);
    } finally {
      setTimeout(() => setEodBackupLoading(false), 1000);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchTodayDispensed = async () => {
      try {
        const res = await fetch('/api/transactions?type=stock_out&limit=100');
        if (res.ok) {
          const data = await res.json();
          const todayStr = getLocalDateISO();
          const todayTx = (data.transactions || []).filter(tx => 
            tx.created_at && tx.created_at.startsWith(todayStr)
          );
          const totalUnits = todayTx.reduce((sum, tx) => sum + Math.abs(Number(tx.quantity || 0)), 0);
          if (isMounted) {
            setDispensedTodayCount(totalUnits);
          }
        }
      } catch (err) {
        console.error('Failed to load today dispensed count:', err);
      }
    };
    fetchTodayDispensed();
    return () => { isMounted = false; };
  }, [batches, medicines]);

  return (
    <div className={uiMode === 'clean' ? 'space-y-5 pb-8' : 'space-y-5 pb-12'}>

      {/* ══ Page Header ══ */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-teal-600" />
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              {t('nav_dashboard', 'Dispensary Overview & Dashboard')}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-teal-50 text-teal-700 border border-teal-200/70 tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              FEFO+ Active
            </span>
          </div>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-0.5">
            {t('dashboard_subtitle', 'Dispensary overview, stock alerts, and expiration risk monitoring')}
          </HelperText>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-zinc-200 transition text-xs font-semibold active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">{t('btn_refresh', 'Refresh')}</span>
          </button>
          {onOpenAddMedicine && (
            <button
              onClick={onOpenAddMedicine}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">{t('btn_add_medicine', '+ Add Medicine')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
          {/* 1. ACTION REQUIRED DRAWER (PINNED TO TOP) */}
          <div ref={alertsSectionRef} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
              hasAnyAlerts ? 'bg-amber-50/80 border-amber-200/60' : 'bg-emerald-50/70 border-emerald-200/60'
            }`}>
              <div className="flex items-center gap-2.5">
                {hasAnyAlerts ? (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                  </span>
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                )}
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {hasAnyAlerts ? t('action_required_title', 'Action Required: Immediate Counter Attention') : t('all_clear_title', 'All Clear — No Immediate Attention Required')}
                </h2>
              </div>
              <span className={`text-xs font-bold tabular-nums px-2.5 py-1 rounded-full border ${
                hasAnyAlerts
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}>
                {hasAnyAlerts ? `${(alerts?.critical?.length || 0) + (alerts?.low_stock?.length || 0)} ${t('items_pending', 'Items Pending')}` : t('all_clear_status', 'All Good')}
              </span>
            </div>

            <div className="p-5">
              {hasAnyAlerts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Critical Batches (1-30 days) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-800 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-rose-600" />
                        {t('critical_batches_header', 'Critical Batches (1–30 Days Remaining)')}
                      </span>
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded tabular-nums">
                        {alerts?.critical?.length || 0}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {hasCritical ? (
                        alerts.critical.map((b) => (
                          <div
                            key={b.id}
                            className="p-3.5 bg-rose-50/50 hover:bg-rose-50 rounded-xl border border-rose-200 transition flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-extrabold text-slate-900 text-sm truncate">{b.brand_name}</div>
                              <div className="text-xs text-slate-600 mt-0.5 tabular-nums">
                                {t('lot_label', 'Lot')}: <span className="font-bold">{b.batch_number}</span> • {t('stock_label', 'Stock')}: <span className="font-bold text-slate-900">{b.current_quantity}</span> {b.unit_of_measure || t('units', 'units')}
                              </div>
                              <div className="text-xs font-bold text-rose-700 mt-1 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{b.days_to_expiry} {t('days_left', 'days left')} ({t('exp_label', 'Exp')}: {b.expiration_date})</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onNavigate('stock-out')}
                                className="h-11 px-3.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <ArrowUpFromLine className="w-3.5 h-3.5" />
                                {t('dispense_first', 'Dispense First')}
                              </button>
                              <AckBadge item={b} alertType="CRITICAL_EXPIRY" onAcknowledge={onAcknowledgeAlert} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-400 italic">{t('no_critical_expiring_30', 'No batches expiring in the next 30 days.')}</div>
                      )}
                    </div>
                  </div>

                  {/* Medicines Out or Low on Stock */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        {t('low_stock_depleted_header', 'Low Stock or Depleted Medicines')}
                      </span>
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded tabular-nums">
                        {alerts?.low_stock?.length || 0}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {hasLowStock ? (
                        alerts.low_stock.map((m) => (
                          <div
                            key={m.id}
                            className="p-3.5 bg-amber-50/50 hover:bg-amber-50 rounded-xl border border-amber-200 transition flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-extrabold text-slate-900 text-sm truncate">{m.brand_name}</div>
                              <div className="text-xs text-slate-600 mt-0.5">{m.generic_name} ({m.dosage_strength})</div>
                              <div className="text-xs font-bold text-amber-800 mt-1">
                                {t('stock_label', 'Stock')}: <span className="tabular-nums text-sm font-black">{m.total_stock}</span> / {t('reorder_at_label', 'Reorder at')}: {m.reorder_threshold}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onNavigate('stock-in')}
                                className="h-11 px-3.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                                {t('order_stock_in', 'Order / Stock-In')}
                              </button>
                              <AckBadge item={m} alertType="LOW_STOCK" onAcknowledge={onAcknowledgeAlert} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-400 italic">{t('all_medicines_sufficient', 'All medicines have sufficient stock on shelf.')}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-3 flex items-center gap-3 text-slate-700">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-base text-slate-900">{t('zero_critical_title', 'Zero Critical Expirations & Good Stock Levels')}</div>
                    <div className="text-sm text-slate-500">{t('zero_critical_desc', 'Every active medicine lot is within a safe shelf-life horizon and inventory is well-stocked.')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. BIG ACTION BUTTONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Primary Dispense / Sell Medicine (F2) */}
            <div
              onClick={() => onNavigate('stock-out')}
              className="group relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white rounded-2xl p-6 shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black tracking-wider uppercase backdrop-blur-xs">
                    <Activity className="w-4 h-4 text-emerald-300" />
                    {t('counter_pos_terminal', 'Counter POS Terminal')}
                  </span>
                  <kbd className="bg-black/30 border border-white/30 text-white px-2.5 py-1 rounded-lg text-xs tabular-nums font-black shadow-xs">
                    F2
                  </kbd>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <ArrowUpFromLine className="w-6 h-6 text-teal-300" />
                  {t('dispense_sell_medicine', 'Dispense / Sell Medicine')}
                </h3>
                <p className="text-sm text-teal-100/90 mt-2 leading-relaxed">
                  {t('dispense_card_desc', 'Scan box barcode or search catalog. FEFO automatically assigns the earliest-expiring safe batch.')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-sm font-bold text-teal-200">
                <span className="tabular-nums text-xs opacity-80">{t('click_press_f2', 'Click or press F2 anytime')}</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-white font-black">
                  {t('start_dispensing_cta', 'Start Dispensing')} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Receive Delivery / Stock-In */}
            <div
              onClick={() => onNavigate('stock-in')}
              className="group bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-teal-500 rounded-2xl p-6 shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold tracking-wider uppercase border border-slate-200">
                    <ArrowDownToLine className="w-4 h-4 text-slate-600" />
                    {t('delivery_receiving_badge', 'Delivery Receiving')}
                  </span>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                  <ArrowDownToLine className="w-6 h-6 text-teal-600" />
                  {t('receive_delivery_stockin', 'Receive Delivery / Stock-In')}
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {t('stockin_card_desc', 'Guided step-by-step form to record incoming medicine batches, expiration dates, and wholesale costs.')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-slate-600">
                <span className="text-xs text-slate-400">{t('add_new_batches', 'Add new batches')}</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-teal-700 font-black">
                  {t('open_delivery_form', 'Open Delivery Form')} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>

          {/* 3. TODAY'S QUICK SNAPSHOT */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('today_quick_snapshot', "Today's Quick Snapshot")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Items Dispensed Today */}
              <div
                onClick={() => onNavigate('stock-out')}
                className="p-4 bg-teal-50/60 rounded-xl border border-teal-200/70 hover:border-teal-300 transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800">{t('items_dispensed_today', 'Items Dispensed Today')}</span>
                  <PackageCheck className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-3xl font-black tabular-nums text-teal-950 my-2">
                  {dispensedTodayCount} <span className="text-base font-medium font-sans text-teal-700">{t('units', 'units')}</span>
                </div>
                <div className="text-xs text-teal-700 font-medium">{t('recorded_sales_today', 'Recorded across completed patient sales today')}</div>
              </div>

              {/* Total Active Medicines */}
              <div
                onClick={() => onNavigate('inventory')}
                className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{t('active_medicines', 'Active Medicines')}</span>
                  <Boxes className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-3xl font-black tabular-nums text-slate-900 my-2">
                  {medicines?.length || 0} <span className="text-base font-medium font-sans text-slate-500">{t('items', 'items')}</span>
                </div>
                <div className="text-xs text-slate-500 font-medium">{t('distinct_medicines_desc', 'Distinct medicine profiles registered in catalog')}</div>
              </div>

              {/* Pending Alerts */}
              <div
                onClick={() => onNavigate('inventory', { filter: hasCritical ? 'critical' : 'low_stock' })}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  hasAnyAlerts
                    ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300 text-rose-900'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">{t('pending_alerts', 'Pending Alerts')}</span>
                  <AlertTriangle className={`w-4 h-4 ${hasAnyAlerts ? 'text-rose-600' : 'text-emerald-600'}`} />
                </div>
                <div className={`text-3xl font-black tabular-nums my-2 ${hasAnyAlerts ? 'text-rose-950' : 'text-emerald-950'}`}>
                  {(alerts?.critical?.length || 0) + (alerts?.low_stock?.length || 0)} <span className="text-base font-medium font-sans">{t('alerts_count_suffix', 'alerts')}</span>
                </div>
                <div className="text-xs font-medium">
                  {hasAnyAlerts ? t('alerts_pending_desc', 'Critical expiry batches or low-stock items') : t('alerts_healthy_desc', 'All stock levels and expiries healthy')}
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* ══ End-of-Day (EOD) Reconciliation & Daily Close-Out Card ══ */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">
                  {t('eod_reconciliation_title', 'End-of-Day (EOD) Reconciliation & Close-Out')}
                </h3>
                <span className="text-[10px] tabular-nums px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold border border-slate-600">
                  {formatDatePH(new Date(), 'medium')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {t('eod_reconciliation_subtitle', 'Daily transaction summary, next-day critical batch warnings, and instant backup')}
              </p>
            </div>
          </div>
          <button
            onClick={handleEodBackup}
            disabled={eodBackupLoading}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition active:scale-[0.98] cursor-pointer shadow-sm ${
              eodBackupSuccess
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-teal-500 text-slate-950 hover:bg-teal-400'
            }`}
          >
            {eodBackupLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{t('eod_generating_backup', 'Generating Backup...')}</span>
              </>
            ) : eodBackupSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('eod_backup_downloaded', 'Database Backup Saved!')}</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5" />
                <span>{t('eod_backup_cta', '1-Click Close-Out Backup')}</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
          {/* Metric 1: Units Dispensed Today */}
          <div className="flex items-center gap-3.5 p-2 sm:px-4">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t('eod_units_dispensed_today', 'Units Dispensed Today')}
              </div>
              <div className="text-2xl font-black tabular-nums text-slate-900 mt-0.5">
                {dispensedTodayCount} <span className="text-xs font-semibold text-slate-500 font-sans">{t('units', 'units')}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {t('eod_units_sub', 'FEFO stock-out sales logged today')}
              </div>
            </div>
          </div>

          {/* Metric 2: Batches Entering Critical Tomorrow */}
          <div className="flex items-center gap-3.5 p-2 sm:px-4">
            <div className={`p-2.5 rounded-xl border ${
              batchesEnteringCriticalTomorrow > 0
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t('eod_critical_tomorrow', 'Entering Critical Tomorrow')}
              </div>
              <div className={`text-2xl font-black tabular-nums mt-0.5 ${
                batchesEnteringCriticalTomorrow > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}>
                {batchesEnteringCriticalTomorrow} <span className="text-xs font-semibold text-slate-500 font-sans">{t('batches', 'batches')}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {batchesEnteringCriticalTomorrow > 0 
                  ? t('eod_crit_warning', 'Reaching 30-day threshold tomorrow')
                  : t('eod_crit_none', 'No batches transitioning tomorrow')}
              </div>
            </div>
          </div>

          {/* Metric 3: Safety Close-Out Status */}
          <div className="flex items-center gap-3.5 p-2 sm:px-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t('eod_safety_status', 'Closing Integrity & Audit')}
              </div>
              <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {t('eod_status_healthy', 'WAL Mode Active · Synced')}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {t('eod_safeguard_sub', 'Ready for daily close-out archive')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
