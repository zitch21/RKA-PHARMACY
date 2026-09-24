import React from 'react';
import {
  Boxes,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  Check,
  Activity,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import HelperText from '../components/HelperText';
import { useLanguage } from '../context/LanguageContext';

export default function DashboardView({
  medicines,
  batches,
  alerts,
  fefoData,
  onNavigate,
  onRefresh,
  _onOpenAddMedicine,
  uiMode = 'clean',
  onToggleUiMode,
  _onOpenHelp,
  onAcknowledgeAlert
}) {
  const { t } = useLanguage();
  const summary = alerts?.summary || {};
  const atRiskBatches = fefoData?.at_risk_batches || [];
  const activeBatchesCount = batches?.filter(b => b.status === 'active')?.length || 0;

  return (
    <div className={uiMode === 'clean' ? 'space-y-4 pb-8' : 'space-y-6 pb-12'}>
      {/* Top Asymmetric Command Hub */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('app_title', 'R.K.A PHARMACY')} {t('nav_dashboard', 'Dashboard')}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {t('live_fefo_active', 'Live FEFO+ Active')}
            </span>
          </div>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-1">
            {t('app_subtitle', 'Clinic Pharmacy Inventory Management System With Demand-Based Replenishment And Expiry-Risk-Aware FEFO')}
          </HelperText>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition text-xs font-semibold active:scale-[0.98] cursor-pointer"
            title="Refresh inventory metrics"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">{t('btn_refresh', 'Refresh')}</span>
          </button>
          <button
            onClick={() => onNavigate('stock-in')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-slate-600" />
            <span>{t('stock_in_batch_receiving', 'Receive Stock-In')}</span>
          </button>
          <button
            onClick={() => onNavigate('stock-out')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition active:scale-[0.98] cursor-pointer"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5 text-white" />
            <span>{t('nav_dispense', 'Dispense')} (FEFO)</span>
            <kbd className="hidden sm:inline bg-emerald-700/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-100 border border-emerald-500/40">
              F2
            </kbd>
          </button>
        </div>
      </div>

      {/* High-Priority Triage Alert Matrix */}
      {((alerts?.critical && alerts.critical.length > 0) || (alerts?.low_stock && alerts.low_stock.length > 0)) && (
        <div className="bg-white rounded-2xl border border-rose-200/90 shadow-xs overflow-hidden">
          <div className="bg-rose-50/80 px-5 py-3 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
              <span className="font-bold text-xs uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                {t('persistent_alerts_title', 'Persistent Alerts: Critical Expiry & Reorder Thresholds')}
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
              {(alerts.critical?.length || 0) + (alerts.low_stock?.length || 0)} {t('attention_items', 'Attention Items')}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* Critical Expiry Batches */}
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-rose-700">
                  <Clock className="w-3.5 h-3.5" />
                  {t('critical_batches_title', 'Critical Batches (1 to 30 Days Remaining)')}
                </span>
                <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200/60 font-bold">
                  {alerts.critical?.length || 0}
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {alerts.critical && alerts.critical.length > 0 ? (
                  alerts.critical.map(b => (
                    <div key={b.id} className="flex items-center justify-between text-xs p-2.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 tracking-tight">{b.brand_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {b.batch_number} • {b.current_quantity} pcs
                        </div>
                        <div className="text-[10px] font-mono font-semibold text-rose-600">
                          {b.days_to_expiry}d left (Exp: {b.expiration_date})
                        </div>
                      </div>
                      <div>
                        {b.is_acknowledged ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                            <Check className="w-3 h-3 text-emerald-600" />
                            {t('btn_ack', 'Ack')} ({b.acknowledged_by ? b.acknowledged_by.split(' ')[0] : 'Admin'})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAcknowledgeAlert && onAcknowledgeAlert(b.alert_key, 'CRITICAL_EXPIRY', b.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded-lg shadow-2xs transition active:scale-[0.98] cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t('btn_acknowledge', 'Acknowledge')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 py-3 text-center">
                    No critical expiry batches requiring immediate triage.
                  </div>
                )}
              </div>
            </div>

            {/* Low Stock Items */}
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t('low_stock_threshold_title', 'Medicines at/below Reorder Threshold')}
                </span>
                <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200/60 font-bold">
                  {alerts.low_stock?.length || 0}
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {alerts.low_stock && alerts.low_stock.length > 0 ? (
                  alerts.low_stock.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-xs p-2.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 tracking-tight">{m.brand_name}</div>
                        <div className="text-[11px] font-mono text-amber-800 font-medium">
                          Stock: {m.total_stock} <span className="text-slate-400">/</span> Threshold: {m.reorder_threshold}
                        </div>
                      </div>
                      <div>
                        {m.is_acknowledged ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                            <Check className="w-3 h-3 text-emerald-600" />
                            {t('btn_ack', 'Ack')} ({m.acknowledged_by ? m.acknowledged_by.split(' ')[0] : 'Admin'})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAcknowledgeAlert && onAcknowledgeAlert(m.alert_key, 'LOW_STOCK', m.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-2.5 py-1 rounded-lg shadow-2xs transition active:scale-[0.98] cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t('btn_acknowledge', 'Acknowledge')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 py-3 text-center">
                    All medicines are above replenishment threshold.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Render: Clean & Simple Bento Hub vs Maximalist Clinical Console */}
      {uiMode === 'clean' ? (
        <div className="space-y-4">
          {/* Asymmetric Bento Command Hub (65% / 35%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Primary Left Wing: Patient-Safe Inventory & Fast Dispensing (Cols 1-8: ~67%) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200/60">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{t('ready_to_dispense', 'Ready to Dispense')}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">FEFO Engine Verified</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 my-2">
                  <span className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight font-mono">
                    {(summary.safe_count || 0) + (summary.monitor_count || 0)}
                  </span>
                  <div>
                    <span className="text-base font-bold text-slate-800 block">
                      {t('active_safe_batches', 'Active Safe Batches')}
                    </span>
                    <span className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {t('all_unexpired_safe', 'All unexpired & safe for patient release')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-telemetry strip with hairline dividers (Anti-Card Overuse) */}
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Safe Horizon (&gt;180d)</span>
                  <span className="text-xl font-bold font-mono text-slate-800">{summary.safe_count || 0}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Monitoring (91-180d)</span>
                  <span className="text-xl font-bold font-mono text-slate-800">{summary.monitor_count || 0}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <button
                    onClick={() => onNavigate('stock-out')}
                    className="w-full h-full min-h-[40px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                  >
                    <ArrowUpFromLine className="w-3.5 h-3.5" />
                    <span>Open Dispenser</span>
                    <kbd className="bg-emerald-700/80 px-1 py-0.5 rounded text-[10px] font-mono text-emerald-100">F2</kbd>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Wing: Triage Action Stack (Cols 9-12: ~33%) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Needs Reordering Trigger */}
              <div
                onClick={() => onNavigate('purchase-orders')}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between flex-1 active:scale-[0.98] ${
                  (summary.low_stock_count || 0) > 0
                    ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400 shadow-2xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    {t('needs_reordering', 'Needs Reordering')}
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-amber-950">
                    {summary.low_stock_count || 0}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-amber-800 font-medium">
                    {(summary.low_stock_count || 0) > 0 ? (
                      <span className="flex items-center gap-1 font-semibold">
                        <span>Review purchase orders & replenishment</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {t('all_above_threshold', 'All items currently above threshold')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expired Stock Quarantine Trigger */}
              <div
                onClick={() => onNavigate('stock-out')}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between flex-1 active:scale-[0.98] ${
                  (summary.expired_count || 0) > 0
                    ? 'bg-rose-50/60 border-rose-300 hover:border-rose-400 shadow-2xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    {t('expired_stock', 'Expired Stock')}
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-rose-950">
                    {summary.expired_count || 0}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-rose-800 font-medium">
                    {(summary.expired_count || 0) > 0 ? (
                      <span className="font-semibold text-rose-700">
                        {t('strictly_locked_quarantine', 'Strictly locked from release (Quarantine)')}
                      </span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {t('zero_expired_shelf', 'Zero expired batches on shelf')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Switcher Footer */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 shadow-2xs">
            <span>
              {t('clean_mode_active_note', 'Operating in Clean & Simple Mode (distraction-free daily counter layout).')}
            </span>
            <button
              onClick={() => onToggleUiMode && onToggleUiMode('maximalist')}
              className="font-bold text-slate-700 hover:text-emerald-700 inline-flex items-center gap-1 transition active:scale-[0.98] cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('btn_switch_maximalist', 'Switch to Maximalist Mode (View Formulas & Full Matrices) →')}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Maximalist / Full Clinical Console Mode */
        <>
          {/* Unified Telemetry Strip (Hardened anti-card architecture) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100">
              {/* SKUs */}
              <div
                onClick={() => onNavigate('inventory')}
                className="p-4 hover:bg-slate-50/80 transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {t('kpi_medicines', 'Medicines (SKUs)')}
                  </span>
                  <Boxes className="w-3.5 h-3.5" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {medicines?.length || 0}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">{t('kpi_active_catalog', 'Active catalog')}</span>
              </div>

              {/* Active Batches */}
              <div
                onClick={() => onNavigate('inventory')}
                className="p-4 hover:bg-slate-50/80 transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {t('kpi_active_batches', 'Active Batches')}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {activeBatchesCount}
                </div>
                <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">{t('kpi_batch_tracked', 'Batch tracked')}</span>
              </div>

              {/* Low Stock */}
              <div
                onClick={() => onNavigate('inventory', { filter: 'low_stock' })}
                className={`p-4 transition cursor-pointer active:scale-[0.99] ${
                  (summary.low_stock_count || 0) > 0 ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                    {t('kpi_low_stock_alert', 'Low Stock')}
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-amber-900 tracking-tight">
                  {summary.low_stock_count || 0}
                </div>
                <span className="text-[10px] text-amber-700 block mt-0.5">{t('kpi_reorder_threshold', '≤ Threshold')}</span>
              </div>

              {/* Critical Expiry */}
              <div
                onClick={() => onNavigate('inventory')}
                className={`p-4 transition cursor-pointer active:scale-[0.99] ${
                  (summary.critical_count || 0) > 0 ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-800">
                    {t('kpi_critical_expiry', 'Critical Expiry')}
                  </span>
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-rose-900 tracking-tight">
                  {summary.critical_count || 0}
                </div>
                <span className="text-[10px] text-rose-700 block mt-0.5">{t('kpi_critical_days', '1-30d left')}</span>
              </div>

              {/* Expired Batches */}
              <div
                onClick={() => onNavigate('inventory')}
                className={`p-4 transition cursor-pointer active:scale-[0.99] ${
                  (summary.expired_count || 0) > 0 ? 'bg-rose-100/40 hover:bg-rose-100/70' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-900">
                    {t('kpi_expired_batches', 'Expired Batches')}
                  </span>
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-rose-950 tracking-tight">
                  {summary.expired_count || 0}
                </div>
                <span className="text-[10px] font-mono text-rose-700 font-semibold block mt-0.5">Blocked Release</span>
              </div>

              {/* FEFO+ Waste Risk Batches */}
              <div
                onClick={() => onNavigate('fefo-plus')}
                className={`p-4 transition cursor-pointer active:scale-[0.99] ${
                  atRiskBatches.length > 0 ? 'bg-slate-100/70 hover:bg-slate-200/50' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                    {t('kpi_fefo_risk_batches', 'FEFO+ Risk')}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {atRiskBatches.length}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">{t('kpi_negative_risk_margin', 'Negative Margin')}</span>
              </div>
            </div>
          </div>

          {/* Asymmetric Workflow Terminals (60% / 40%) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Terminal 1: Dispense (FEFO Allocation) */}
            <div
              onClick={() => onNavigate('stock-out')}
              className="md:col-span-7 p-6 bg-slate-900 text-white rounded-2xl shadow-sm hover:shadow-md border border-slate-800 transition cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    Automated Allocation
                  </span>
                  <kbd className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300 border border-slate-700">
                    Hotkey: F2
                  </kbd>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-white">
                  {t('onboarding_dispense_title', '1. Sell / Dispense Medicine')}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-[55ch]">
                  {t('onboarding_dispense_desc', 'Scan barcode or select medicine. FEFO automatically assigns the safest batch.')}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-400">
                <span>{t('btn_press_f2', 'Press F2 or Click Here')}</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>{t('btn_start_dispensing', 'Start Dispensing →')}</span>
                </span>
              </div>
            </div>

            {/* Terminal 2: Stock-In Intake */}
            <div
              onClick={() => onNavigate('stock-in')}
              className="md:col-span-5 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] hover:border-slate-300 transition cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    <ArrowDownToLine className="w-3 h-3 text-slate-600" />
                    Receiving Dock
                  </span>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
                  {t('onboarding_stockin_title', '2. Receive Delivery (Stock-In)')}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {t('onboarding_stockin_desc', 'Scan box barcode, enter quantity, expiry, and pricing to update inventory.')}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{t('btn_fast_intake', 'Fast Intake')}</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-emerald-700">
                  <span>{t('btn_record_stock_in', 'Record Stock-In →')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Calibrated FEFO+ High Waste Risk Console (NO LILA/PURPLE GRADIENT!) */}
          <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    {t('enhanced_fefo_analysis', 'Enhanced FEFO+ Expiry Risk Margin Analysis')}
                  </span>
                </div>
                <h2 className="text-lg font-bold mt-1 text-slate-100">
                  {t('batches_unlikely_consumed', 'Batches Unlikely to be Consumed Before Expiration')}
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl mt-1">
                  {t('fefo_formula_desc', 'Formula: Expiry Risk Margin = Days to Expiry − Days to Consume. Batches with a negative margin have stock levels higher than expected demand before expiry.')}
                </p>
              </div>

              <button
                onClick={() => onNavigate('fefo-plus')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shrink-0 active:scale-[0.98] cursor-pointer"
              >
                <span>{t('full_consumption_report', 'Full Consumption Report')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {atRiskBatches.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[10px] uppercase tracking-wider font-mono">
                      <th className="py-3 px-3.5">{t('inv_col_medicine', 'Medicine & Strength')}</th>
                      <th className="py-3 px-3">{t('inv_batch_num', 'Batch Number')}</th>
                      <th className="py-3 px-3">{t('inv_col_total_stock', 'Remaining Stock')}</th>
                      <th className="py-3 px-3">Avg Demand</th>
                      <th className="py-3 px-3">Days to Expiry</th>
                      <th className="py-3 px-3">{t('days_to_depletion', 'Days to Depletion')}</th>
                      <th className="py-3 px-3 text-right">{t('expiry_risk_margin', 'Expiry Risk Margin')}</th>
                      <th className="py-3 px-3.5 text-center">Action Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {atRiskBatches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-900/60 transition">
                        <td className="py-3 px-3.5 font-semibold text-slate-100">
                          {b.brand_name}
                          <span className="text-[11px] text-slate-400 block font-normal">{b.generic_name}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">{b.batch_number}</td>
                        <td className="py-3 px-3 font-bold font-mono text-amber-300">{b.current_quantity} {b.unit_of_measure}s</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{b.adqs} / day</td>
                        <td className="py-3 px-3 font-mono text-rose-300 font-semibold">{b.days_to_expiry} days ({b.expiration_date})</td>
                        <td className="py-3 px-3 font-mono text-amber-200">{b.days_to_consume} days</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                          {b.expiry_risk_margin} days
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="inline-block bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            {t('prioritize_release_halt', 'Prioritize Release / Halt Reorder')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 bg-slate-900/60 rounded-xl text-center text-xs text-slate-400 border border-slate-800">
                <span className="text-emerald-400 font-semibold inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  {t('no_high_waste_risk', 'No high-waste-risk batches detected. All active batches are projected to be consumed before expiration based on current sales velocity.')}
                </span>
              </div>
            )}
          </div>

          {/* Asymmetric Two-Column Bottom Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Expiration Risk Classification (Cols 1-5: ~42%) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {t('expiration_risk_classification', 'Expiration Risk Classification')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{t('countdown_tiers_desc', 'Configured countdown tiers for pharmacy supplies')}</p>
                  </div>
                  <button
                    onClick={() => onNavigate('inventory')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 active:scale-[0.98] cursor-pointer"
                  >
                    <span>{t('btn_view_all', 'View All')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Safe */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 transition">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">{t('tier_safe', 'Safe (> 180 Days)')}</div>
                        <div className="text-[11px] text-slate-500">Standard FEFO ordering</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {summary.safe_count || 0} batches
                    </span>
                  </div>

                  {/* Monitor */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 transition">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">{t('tier_monitor', 'Monitor (91 to 180 Days)')}</div>
                        <div className="text-[11px] text-slate-500">Included in monitoring report</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {summary.monitor_count || 0} batches
                    </span>
                  </div>

                  {/* Warning */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-200/70 transition">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <div>
                        <div className="font-semibold text-xs text-amber-950">{t('tier_warning', 'Warning (31 to 90 Days)')}</div>
                        <div className="text-[11px] text-amber-800">Prioritized for release</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm text-amber-900">
                      {summary.warning_count || 0} batches
                    </span>
                  </div>

                  {/* Critical */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 hover:bg-rose-50 border border-rose-200/70 transition">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                      <div>
                        <div className="font-semibold text-xs text-rose-950">{t('tier_critical', 'Critical (1 to 30 Days)')}</div>
                        <div className="text-[11px] text-rose-800">Highest release priority</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm text-rose-900">
                      {summary.critical_count || 0} batches
                    </span>
                  </div>

                  {/* Expired */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-100/60 border border-rose-300 transition">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-700"></span>
                      <div>
                        <div className="font-semibold text-xs text-rose-950">{t('tier_expired', 'Expired (0 Days or Less)')}</div>
                        <div className="text-[11px] text-rose-700 font-bold">{t('strictly_locked_quarantine', 'Strictly blocked from release')}</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm text-rose-950">
                      {summary.expired_count || 0} batches
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>R.K.A Clinic Inventory</span>
                <span className="font-mono text-[11px] text-slate-500">FEFO Risk Protocol v2.4</span>
              </div>
            </div>

            {/* Stock Replenishment & Reorder Thresholds (Cols 6-12: ~58%) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {t('stock_replenishment_panel', 'Stock Replenishment & Reorder Thresholds')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('stock_replenishment_desc', 'Items requiring purchase order based on owner threshold and lead times')}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('purchase-orders')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 active:scale-[0.98] cursor-pointer"
                  >
                    <span>{t('reorder_planner', 'Reorder Planner')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {alerts?.low_stock?.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {alerts.low_stock.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between hover:bg-slate-100/70 transition"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900">{m.brand_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {m.generic_name} • Form: {m.dosage_form}
                          </div>
                          <div className="text-[10px] text-slate-600 mt-1 font-mono">
                            {t('lead_time_label', 'Lead time')}: <span className="font-semibold">{m.supplier_lead_time_days}d</span> • {t('buffer_label', 'Buffer')}: <span className="font-semibold">{m.buffer_days}d</span>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5">
                          <div className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md inline-block">
                            Stock: {m.total_stock} / Threshold: {m.reorder_threshold}
                          </div>
                          <div className="flex items-center gap-2">
                            {m.is_acknowledged ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                {t('btn_ack', 'Ack')} ({m.acknowledged_by ? m.acknowledged_by.split(' ')[0] : 'Admin'})
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onAcknowledgeAlert && onAcknowledgeAlert(m.alert_key, 'LOW_STOCK', m.id)}
                                className="text-[10px] font-bold text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-300 px-2 py-0.5 rounded-lg transition active:scale-[0.98] cursor-pointer"
                                title="Acknowledge alert and log in audit trail"
                              >
                                {t('btn_acknowledge', 'Acknowledge')}
                              </button>
                            )}
                            <button
                              onClick={() => onNavigate('stock-in')}
                              className="text-[11px] text-emerald-700 font-semibold hover:underline active:scale-[0.98] cursor-pointer"
                            >
                              {t('stock_in_batch_receiving', 'Receive Stock-In')} →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {t('all_above_threshold', 'All inventory items are currently above their reorder thresholds.')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px] font-mono">{t('reorder_formula_desc', 'Formula: Daily Demand × (Lead Time + Buffer)')}</span>
                <span className="font-semibold text-emerald-700">R.K.A Clinic Pharmacy</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
