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
  CheckCircle2
} from 'lucide-react';
import HelperText from '../components/HelperText';

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
  const summary = alerts?.summary || {};
  const atRiskBatches = fefoData?.at_risk_batches || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>R.K.A Pharmacy Operations Dashboard</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Live FEFO+ Active
            </span>
          </h1>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-1">
            Clinic Inventory Monitoring • Expiry Countdown Tracking • Dynamic Reorder Forecasting
          </HelperText>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition text-xs font-semibold"
            title="Refresh inventory metrics"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">Refresh</span>
          </button>
          <button
            onClick={() => onNavigate('stock-out')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            <span>Dispense (FEFO)</span>
          </button>
          <button
            onClick={() => onNavigate('stock-in')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Receive Stock-In</span>
          </button>
        </div>
      </div>

      {/* Persistent Critical and Reorder Alerts Banner */}
      {((alerts?.critical && alerts.critical.length > 0) || (alerts?.low_stock && alerts.low_stock.length > 0)) && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
              <h3 className="font-extrabold text-sm text-rose-950 uppercase tracking-wider flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Persistent Alerts: Critical Expiry & Reorder Thresholds</span>
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-800 bg-rose-200/80 px-2.5 py-0.5 rounded-full">
              {(alerts.critical?.length || 0) + (alerts.low_stock?.length || 0)} Attention Items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Critical Expiry Batches */}
            {alerts.critical && alerts.critical.length > 0 && (
              <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs text-rose-900 border-b border-rose-100 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-600" />
                    <span>Critical Batches (1 to 30 Days Remaining)</span>
                  </span>
                  <span className="text-[10px] bg-rose-100 px-1.5 py-0.5 rounded text-rose-800 font-bold">{alerts.critical.length}</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {alerts.critical.map(b => (
                    <div key={b.id} className="flex items-center justify-between text-xs p-2 bg-rose-50/50 rounded-lg border border-rose-100">
                      <div>
                        <span className="font-bold text-slate-900">{b.brand_name}</span>
                        <span className="text-[11px] text-slate-500 ml-1">({b.batch_number} • {b.current_quantity} pcs)</span>
                        <span className="text-[10px] text-rose-700 font-bold block">{b.days_to_expiry}d left (Exp: {b.expiration_date})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {b.is_acknowledged ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            ✓ Ack ({b.acknowledged_by ? b.acknowledged_by.split(' ')[0] : 'Admin'})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAcknowledgeAlert && onAcknowledgeAlert(b.alert_key, 'CRITICAL_EXPIRY', b.id)}
                            className="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-1 rounded shadow-xs transition flex items-center gap-1"
                            title="Acknowledge alert and log in immutable audit trail"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Acknowledge</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low Stock Reorder Alerts */}
            {alerts.low_stock && alerts.low_stock.length > 0 && (
              <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs text-amber-900 border-b border-amber-100 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Medicines at/below Reorder Threshold</span>
                  </span>
                  <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded text-amber-800 font-bold">{alerts.low_stock.length}</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {alerts.low_stock.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-xs p-2 bg-amber-50/50 rounded-lg border border-amber-100">
                      <div>
                        <span className="font-bold text-slate-900">{m.brand_name}</span>
                        <span className="text-[10px] text-amber-800 font-bold block">Stock: {m.total_stock} (Threshold: {m.reorder_threshold})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m.is_acknowledged ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            ✓ Ack ({m.acknowledged_by ? m.acknowledged_by.split(' ')[0] : 'Admin'})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAcknowledgeAlert && onAcknowledgeAlert(m.alert_key, 'LOW_STOCK', m.id)}
                            className="text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-2 py-1 rounded shadow-xs transition flex items-center gap-1"
                            title="Acknowledge alert and log in immutable audit trail"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Acknowledge</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode Switch: Clean & Simple vs Maximalist Mode */}
      {uiMode === 'clean' ? (
        <div className="space-y-6">
          {/* 3 High-Contrast Clean Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Safe Stock Card */}
            <div
              onClick={() => onNavigate('stock-out')}
              className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-xs hover:border-emerald-400 transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Ready to Dispense
                </span>
                <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </span>
              </div>
              <div className="my-3">
                <span className="text-3xl font-extrabold text-slate-900">
                  {(summary.safe_count || 0) + (summary.monitor_count || 0)}
                </span>
                <span className="text-xs text-slate-500 font-medium ml-2">Active Safe Batches</span>
              </div>
              <div className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>All unexpired & safe for patient release</span>
              </div>
            </div>

            {/* Low Stock Items Card */}
            <div
              onClick={() => onNavigate('purchase-orders')}
              className={`p-5 rounded-2xl border-2 shadow-xs transition cursor-pointer flex flex-col justify-between ${
                (summary.low_stock_count || 0) > 0
                  ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Needs Reordering
                </span>
                <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                </span>
              </div>
              <div className="my-3">
                <span className="text-3xl font-extrabold text-amber-950">
                  {summary.low_stock_count || 0}
                </span>
                <span className="text-xs text-amber-800 font-medium ml-2">Low Stock Medicines</span>
              </div>
              <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                {(summary.low_stock_count || 0) > 0 ? (
                  <span>Click to review purchase orders & replenishment →</span>
                ) : (
                  <span className="text-emerald-700">✓ All items currently above threshold</span>
                )}
              </div>
            </div>

            {/* Expired Stock Card */}
            <div
              onClick={() => onNavigate('stock-out')}
              className={`p-5 rounded-2xl border-2 shadow-xs transition cursor-pointer flex flex-col justify-between ${
                (summary.expired_count || 0) > 0
                  ? 'bg-red-50/70 border-red-300 hover:border-red-400'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-red-900">
                  Expired Stock
                </span>
                <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                  <AlertOctagon className="w-5 h-5" />
                </span>
              </div>
              <div className="my-3">
                <span className="text-3xl font-extrabold text-red-950">
                  {summary.expired_count || 0}
                </span>
                <span className="text-xs text-red-800 font-medium ml-2">Blocked Batches</span>
              </div>
              <div className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                {(summary.expired_count || 0) > 0 ? (
                  <span>Strictly locked from release (Quarantine)</span>
                ) : (
                  <span className="text-emerald-700">✓ Zero expired batches on shelf</span>
                )}
              </div>
            </div>
          </div>

          {/* Two High-Yield Action Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => onNavigate('stock-out')}
              className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <ArrowUpFromLine className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-extrabold tracking-tight">1. Sell / Dispense Medicine</h3>
                <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                  Scan barcode or select medicine. FEFO automatically assigns the safest batch.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold">
                <span>Press F2 or Click Here</span>
                <span className="flex items-center gap-1">Start Dispensing →</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('stock-in')}
              className="p-6 bg-gradient-to-br from-slate-800 to-indigo-950 text-white rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <ArrowDownToLine className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-extrabold tracking-tight">2. Receive Delivery (Stock-In)</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Scan box barcode, enter quantity, expiry, and pricing to update inventory.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold">
                <span>Fast Intake</span>
                <span className="flex items-center gap-1">Record Stock-In →</span>
              </div>
            </div>
          </div>

          {/* Minimalist Switch Footer Helper */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Operating in <strong>Clean & Simple Mode</strong> (distraction-free daily counter layout).
            </span>
            <button
              onClick={() => onToggleUiMode && onToggleUiMode('maximalist')}
              className="font-bold text-indigo-700 hover:underline text-left sm:text-right"
            >
              Switch to Maximalist Mode (View Formulas & Full Matrices) →
            </button>
          </div>
        </div>
      ) : (
        /* Maximalist / Full Clinical Mode */
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Medicines */}
            <div
              onClick={() => onNavigate('inventory')}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">Medicines (SKUs)</span>
                <Boxes className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{medicines?.length || 0}</div>
              <span className="text-[10px] text-slate-400 font-medium">Active clinic catalog</span>
            </div>

            {/* Total Active Batches */}
            <div
              onClick={() => onNavigate('inventory')}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">Active Batches</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{batches?.filter(b => b.status === 'active')?.length || 0}</div>
              <span className="text-[10px] text-emerald-600 font-medium">Batch-level tracked</span>
            </div>

            {/* Low Stock Items */}
            <div
              onClick={() => onNavigate('inventory', { filter: 'low_stock' })}
              className={`p-4 rounded-xl border shadow-xs transition cursor-pointer ${
                (summary.low_stock_count || 0) > 0 ? 'bg-amber-50/50 border-amber-300' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-amber-900">Low Stock Alert</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-900">{summary.low_stock_count || 0}</div>
              <span className="text-[10px] text-amber-700 font-medium">≤ Reorder Threshold</span>
            </div>

            {/* Critical Expiry (1-30d) */}
            <div
              onClick={() => onNavigate('inventory')}
              className={`p-4 rounded-xl border shadow-xs transition cursor-pointer ${
                (summary.critical_count || 0) > 0 ? 'bg-rose-50/50 border-rose-300' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-rose-900">Critical Expiry</span>
                <Clock className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-900">{summary.critical_count || 0}</div>
              <span className="text-[10px] text-rose-700 font-medium">1 - 30 days remaining</span>
            </div>

            {/* Expired Batches (Strict Block) */}
            <div
              onClick={() => onNavigate('inventory')}
              className={`p-4 rounded-xl border shadow-xs transition cursor-pointer ${
                (summary.expired_count || 0) > 0 ? 'bg-red-50/70 border-red-300' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-red-900">Expired Batches</span>
                <AlertOctagon className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-900">{summary.expired_count || 0}</div>
              <span className="text-[10px] text-red-700 font-bold uppercase">Blocked from release</span>
            </div>

            {/* FEFO+ Waste Risk Batches */}
            <div
              onClick={() => onNavigate('fefo-plus')}
              className={`p-4 rounded-xl border shadow-xs transition cursor-pointer ${
                atRiskBatches.length > 0 ? 'bg-purple-50/60 border-purple-300' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-purple-900">FEFO+ Risk Batches</span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-900">{atRiskBatches.length}</div>
              <span className="text-[10px] text-purple-700 font-medium">Negative Risk Margin</span>
            </div>
          </div>

          {/* Main Section: FEFO+ High Waste Risk Spotlight (Novelty of this Research) */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-6 shadow-md border border-indigo-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Enhanced FEFO+ Expiry Risk Margin Analysis
                  </span>
                </div>
                <h2 className="text-lg font-bold mt-1 text-white">
                  Batches Unlikely to be Consumed Before Expiration
                </h2>
                <p className="text-xs text-indigo-200/80 max-w-2xl">
                  Formula: <span className="font-mono text-amber-300">Expiry Risk Margin = Days to Expiry − Days to Consume</span>. Batches with a negative margin have stock levels higher than expected demand before expiry.
                </p>
              </div>

              <button
                onClick={() => onNavigate('fefo-plus')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition shrink-0"
              >
                <span>Full Consumption Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {atRiskBatches.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-indigo-800 text-indigo-200 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Medicine & Strength</th>
                      <th className="py-2.5 px-3">Batch Number</th>
                      <th className="py-2.5 px-3">Remaining Stock</th>
                      <th className="py-2.5 px-3">Avg Daily Demand</th>
                      <th className="py-2.5 px-3">Days to Expiry</th>
                      <th className="py-2.5 px-3">Days to Consume</th>
                      <th className="py-2.5 px-3 text-right">Expiry Risk Margin</th>
                      <th className="py-2.5 px-3 text-center">Action Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-900/60">
                    {atRiskBatches.map((b) => (
                      <tr key={b.id} className="hover:bg-indigo-900/40 transition">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {b.brand_name}
                          <span className="text-[11px] text-indigo-300 block font-normal">{b.generic_name}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-indigo-200">{b.batch_number}</td>
                        <td className="py-2.5 px-3 font-bold text-amber-300">{b.current_quantity} {b.unit_of_measure}s</td>
                        <td className="py-2.5 px-3 text-indigo-200">{b.adqs} / day</td>
                        <td className="py-2.5 px-3 text-rose-300 font-semibold">{b.days_to_expiry} days ({b.expiration_date})</td>
                        <td className="py-2.5 px-3 text-amber-200">{b.days_to_consume} days</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                          {b.expiry_risk_margin} days
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                            Prioritize Release / Halt Reorder
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 bg-indigo-900/30 rounded-lg text-center text-xs text-indigo-200">
                ✓ No high-waste-risk batches detected. All active batches are projected to be consumed before expiration based on current sales velocity.
              </div>
            )}
          </div>

          {/* Two Columns: Expiration Tiers (Table 1) & Low Stock Replenishment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expiration Classification Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Expiration Risk Classification
                  </h3>
                  <p className="text-xs text-slate-500">Configured countdown tiers for pharmacy supplies</p>
                </div>
                <button
                  onClick={() => onNavigate('inventory')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {/* Safe */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Safe (&gt; 180 Days)</div>
                      <div className="text-[11px] text-slate-500">Standard FEFO ordering</div>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-emerald-800">
                    {summary.safe_count || 0} batches
                  </span>
                </div>

                {/* Monitor */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Monitor (91 to 180 Days)</div>
                      <div className="text-[11px] text-slate-500">Included in monitoring report</div>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-blue-800">
                    {summary.monitor_count || 0} batches
                  </span>
                </div>

                {/* Warning */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Warning (31 to 90 Days)</div>
                      <div className="text-[11px] text-slate-500">Prioritized for release</div>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-amber-800">
                    {summary.warning_count || 0} batches
                  </span>
                </div>

                {/* Critical */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50/50 border border-rose-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Critical (1 to 30 Days)</div>
                      <div className="text-[11px] text-slate-500">Highest release priority</div>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-rose-800">
                    {summary.critical_count || 0} batches
                  </span>
                </div>

                {/* Expired */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50/80 border border-red-300">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                    <div>
                      <div className="font-semibold text-xs text-red-950">Expired (0 Days or Less)</div>
                      <div className="text-[11px] text-red-700 font-bold">Strictly blocked from release</div>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-red-800">
                    {summary.expired_count || 0} batches
                  </span>
                </div>
              </div>
            </div>

            {/* Low Stock Replenishment Action Panel */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Stock Replenishment & Reorder Thresholds
                    </h3>
                    <p className="text-xs text-slate-500">
                      Items requiring purchase order based on owner threshold and lead times
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('fefo-plus')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
                  >
                    <span>Reorder Planner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {alerts?.low_stock?.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {alerts.low_stock.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900">{m.brand_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {m.generic_name} • Form: {m.dosage_form}
                          </div>
                          <div className="text-[10px] text-slate-600 mt-1">
                            Lead time: <span className="font-medium">{m.supplier_lead_time_days} days</span> • Buffer: <span className="font-medium">{m.buffer_days} days</span>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1">
                          <div className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded inline-block">
                            Stock: {m.total_stock} / Threshold: {m.reorder_threshold}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {m.is_acknowledged ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                ✓ Ack ({m.acknowledged_by ? m.acknowledged_by.split(' ')[0] : 'Admin'})
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onAcknowledgeAlert && onAcknowledgeAlert(m.alert_key, 'LOW_STOCK', m.id)}
                                className="text-[10px] font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-300 px-2 py-0.5 rounded transition"
                                title="Acknowledge alert and log in audit trail"
                              >
                                Acknowledge
                              </button>
                            )}
                            <button
                              onClick={() => onNavigate('stock-in')}
                              className="text-[11px] text-emerald-700 font-semibold hover:underline"
                            >
                              Receive Stock-In →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
                    ✓ All inventory items are currently above their reorder thresholds.
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Formula: Daily Demand × (Lead Time + Buffer)</span>
                <span className="font-semibold text-emerald-700">R.K.A Clinic Pharmacy</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
