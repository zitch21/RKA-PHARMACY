import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  Copy,
  Check,
  ShieldCheck,
  Award,
  Sparkles,
  Loader2,
  Database,
  Calendar,
  Layers,
  Boxes,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import HelperText from '../components/HelperText';
import { getIsDemoMode, setIsDemoMode } from '../utils/apiInterceptor';

/* ── Methodology banner card ────────────────────── */
function PolicyBannerCard({ icon: Icon, title, description, accentCls, bgCls, borderCls }) {
  return (
    <div className={`p-3.5 rounded-xl border ${bgCls} ${borderCls} space-y-1.5`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 shrink-0 ${accentCls}`} />
        <span className={`text-xs font-extrabold uppercase tracking-widest ${accentCls}`}>{title}</span>
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed">{description}</p>
    </div>
  );
}

export default function SimulationView({
  uiMode = 'clean',
  activeSubTab = 'stress-test',
  _onSubTabChange,
}) {
  const { t } = useLanguage();
  const [isDemo, setIsDemo] = useState(getIsDemoMode());
  const [simulationDays, setSimulationDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  const runSimulation = async (days = simulationDays) => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: parseInt(days)
        })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation(90);
  }, []);

  useEffect(() => {
    const handleDemoChange = (e) => {
      const active = e.detail?.isDemo ?? getIsDemoMode();
      setIsDemo(active);
      runSimulation(simulationDays);
    };
    window.addEventListener('rka_demo_mode_changed', handleDemoChange);
    return () => window.removeEventListener('rka_demo_mode_changed', handleDemoChange);
  }, [simulationDays]);

  const handleCopyTable = () => {
    if (!results || !results.policy_comparison) return;
    let txt = `POLICY COMPARISON TABLE (${results.data_source || 'Simulation'} - Duration: ${results.simulation_days} Days)\n`;
    txt += `Policy\tUnits Released\tUnits Expired\t% Expired\tStockout Events\n`;
    results.policy_comparison.forEach(p => {
      txt += `${p.policy}\t${p.total_released_units}\t${p.total_expired_units}\t${p.expired_percentage}%\t${p.stockout_occurrences}\n`;
    });
    txt += `\nREORDER MECHANISM COMPARISON:\n`;
    txt += `Fixed Threshold: ${results.reorder_comparison?.fixed_threshold?.stockout_occurrences || 0} Stockouts\n`;
    txt += `Computed Dynamic Threshold: ${results.reorder_comparison?.computed_threshold?.stockout_occurrences || 0} Stockouts\n`;
    txt += `Stockout Reduction: ${results.reorder_comparison?.stockout_reduction_percentage || 0}%\n`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className={uiMode === 'clean' ? 'space-y-4 pb-8' : 'space-y-5 pb-12'}>

      {/* ══ Page Header + Controls ══ */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-teal-600" />
              {t('sim_title') || 'Empirical Operations Policy Replay'}
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest tabular-nums ${
              isDemo
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-teal-100 text-teal-900 border-teal-200'
            }`}>
              {isDemo ? (t('sim_demo_active_tag') || 'Demo Mode Active') : (t('sim_prod_active_tag') || 'Production Operations')}
            </span>
          </div>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-0.5">
            {t('sim_subtitle') || 'Evaluate FIFO vs FEFO vs FEFO+ batch release policies using clinic transactions and active inventory batches'}
          </HelperText>
        </div>

        {/* Control Bar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] text-zinc-500 font-semibold shrink-0">
              {t('sim_horizon_label') || 'Evaluation Horizon:'}
            </span>
            <select
              value={simulationDays}
              onChange={(e) => {
                const d = e.target.value;
                setSimulationDays(d);
                runSimulation(d);
              }}
              className="text-xs border-0 bg-transparent font-bold text-slate-800 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="30">{t('sim_horizon_30') || '30 Days (Early)'}</option>
              <option value="60">{t('sim_horizon_60') || '60 Days (Divergence)'}</option>
              <option value="90">{t('sim_horizon_90') || '90 Days (Standard Horizon)'}</option>
              <option value="180">{t('sim_horizon_180') || '180 Days (Extended)'}</option>
            </select>
          </div>

          <button
            onClick={() => runSimulation(simulationDays)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('sim_evaluating_btn') || 'Evaluating…'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t('sim_replay_btn') || 'Replay Operations'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ══ Empty Database State Notice (When 0 real transactions exist) ══ */}
      {results?.is_empty && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-6 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isDemo ? (t('sim_demo_empty_title') || 'Demo Database Empty') : (t('sim_prod_empty_title') || 'No Counter Dispensing Records Yet (Clean Production System)')}
            </h3>
            <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1 leading-relaxed">
              {isDemo
                ? (t('sim_demo_empty_desc') || 'The demo database currently has no dispensing logs. You can reset demo data in Settings to restore initial demonstration scenarios.')
                : (t('sim_prod_empty_desc') || 'The production database has no dispensing transactions logged yet. When actual physical clinic operations start and batches are dispensed at the counter (F2), genuine operational transaction logs will automatically accumulate here for empirical policy comparison.')}
            </p>
          </div>
          {!isDemo && (
            <button
              onClick={() => {
                setIsDemoMode(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('sim_switch_demo_btn') || 'Switch to Demo Mode to Explore Simulation →'}</span>
            </button>
          )}
        </div>
      )}

      {/* ══ Operations Telemetry Strip ══ */}
      {results && !results.is_empty && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white rounded-xl border border-zinc-200 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>{t('sim_telemetry_historical_logs') || 'Historical Replay Logs'}</span>
              <Database className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-xl font-black tabular-nums text-slate-900">
              {results.historical_transactions_count || 0} <span className="text-xs font-sans font-medium text-slate-500">{t('sim_telemetry_records') || 'records'}</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
              {results.date_range ? `${results.date_range.start_date} to ${results.date_range.end_date}` : (t('sim_source_prod') || 'SQLite stock_out logs')}
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-zinc-200 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>{t('sim_telemetry_batches') || 'Inventory Batches'}</span>
              <Layers className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-xl font-black tabular-nums text-slate-900">
              {results.total_inventory_batches || 0} <span className="text-xs font-sans font-medium text-slate-500">{t('sim_telemetry_batches') || 'batches'}</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">{t('sim_telemetry_batches_desc') || 'Clinical stock lots evaluated'}</div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-zinc-200 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>{t('sim_telemetry_skus') || 'Catalog SKUs'}</span>
              <Boxes className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-xl font-black tabular-nums text-slate-900">
              {results.total_catalog_medicines || 0} <span className="text-xs font-sans font-medium text-slate-500">{t('sim_telemetry_medicines') || 'medicines'}</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">{t('sim_telemetry_skus_desc') || 'Empirical sales velocity mapped'}</div>
          </div>

          <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200 shadow-xs">
            <div className="flex items-center justify-between text-teal-700 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>{t('sim_telemetry_eval_window') || 'Evaluation Window'}</span>
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-xl font-black tabular-nums text-teal-950">
              {results.simulation_days} <span className="text-xs font-sans font-medium text-teal-800">{t('sim_telemetry_days') || 'Days'}</span>
            </div>
            <div className="text-[10px] text-teal-700 font-medium mt-0.5">{t('sim_telemetry_window_desc') || 'Replay + forward projection'}</div>
          </div>
        </div>
      )}

      {/* ══ Methodology Banner ══ */}
      <div className="bg-slate-900 dark:bg-[#161b22] border border-slate-800 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-2.5 border-b border-slate-800 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              {t('sim_eval_methodology_title') || 'Empirical Inventory Policy Evaluation'}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            {t('sim_source_label') || 'Source:'} {results?.data_source || (isDemo ? (t('sim_source_demo') || 'Demo Clinic Sandbox Database') : (t('sim_source_prod') || 'Production SQLite Database'))}
          </span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <PolicyBannerCard
            icon={Database}
            title={t('sim_fifo_title') || 'FIFO (Traditional)'}
            description={t('sim_fifo_desc') || 'First-In-First-Out: Oldest stock lot released first based purely on arrival order, ignoring expiration dates. Highest product waste.'}
            accentCls="text-rose-400"
            bgCls="bg-zinc-900"
            borderCls="border-zinc-700/50"
          />
          <PolicyBannerCard
            icon={ShieldCheck}
            title={t('sim_fefo_title') || 'FEFO (Standard)'}
            description={t('sim_fefo_desc') || 'First-Expiry-First-Out: Earliest expiration batch released without consumption velocity risk check. Reduces waste vs FIFO.'}
            accentCls="text-amber-400"
            bgCls="bg-zinc-900"
            borderCls="border-zinc-700/50"
          />
          <PolicyBannerCard
            icon={Sparkles}
            title={t('sim_fefoplus_title') || 'FEFO+ (Proposed Predictive)'}
            description={t('sim_fefoplus_desc') || 'Enhanced FEFO: Earliest expiry prioritized + negative risk-margin batches automatically accelerated for release. Minimum waste.'}
            accentCls="text-teal-400"
            bgCls="bg-zinc-900"
            borderCls="border-teal-700/40"
          />
        </div>
      </div>

      {results && !results.is_empty && (
        <>
          {/* ══ Prominent Demand Forecasting Card when activeSubTab === 'demand-forecast' ══ */}
          {activeSubTab === 'demand-forecast' && (
            <div className="bg-white rounded-xl border-2 border-teal-500 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-teal-600" />
                    <span>{t('sim_demand_model_title') || 'Dynamic Replenishment & Demand Forecasting Model'}</span>
                  </h3>
                  <HelperText uiMode={uiMode} className="text-xs text-slate-500">
                    {t('sim_demand_model_desc') || 'Comparative evaluation of fixed reorder thresholds against consumption-weighted dynamic replenishment: Reorder Point = [ADQS × (Supplier Lead Time + Buffer Days)]'}
                  </HelperText>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 self-start sm:self-auto">
                  {t('sim_stockout_reduction_badge', { pct: results.reorder_comparison?.stockout_reduction_percentage || 0 }) || `${results.reorder_comparison?.stockout_reduction_percentage || 0}% Stockout Reduction`}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                  <span className="text-[10px] uppercase text-zinc-500 font-bold block tracking-widest">
                    {results.reorder_comparison?.fixed_threshold?.method || t('sim_fixed_threshold_label') || '1. Fixed Static Threshold'}
                  </span>
                  <div className="text-3xl font-black text-rose-700 tabular-nums">
                    {t('sim_stockout_events', { count: results.reorder_comparison?.fixed_threshold?.stockout_occurrences || 0 }) || `${results.reorder_comparison?.fixed_threshold?.stockout_occurrences || 0} Stockout Events`}
                  </div>
                  <p className="text-xs text-slate-500">{results.reorder_comparison?.fixed_threshold?.description}</p>
                </div>
                <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 space-y-2">
                  <span className="text-[10px] uppercase text-teal-700 font-bold block tracking-widest">
                    {results.reorder_comparison?.computed_threshold?.method || t('sim_dynamic_level_label') || '2. Computed Dynamic Level'}
                  </span>
                  <div className="text-3xl font-black text-teal-800 tabular-nums">
                    {t('sim_stockout_events', { count: results.reorder_comparison?.computed_threshold?.stockout_occurrences || 0 }) || `${results.reorder_comparison?.computed_threshold?.stockout_occurrences || 0} Stockout Events`}
                  </div>
                  <p className="text-xs text-slate-600">{results.reorder_comparison?.computed_threshold?.description}</p>
                  <div className="pt-1">
                    <span className="text-xs font-bold text-teal-700 bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {t('sim_stockout_reduction_achieved', { pct: results.reorder_comparison?.stockout_reduction_percentage || 0 }) || `${results.reorder_comparison?.stockout_reduction_percentage || 0}% Stockout Reduction Achieved`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ Policy Comparison Matrix ══ */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {t('sim_policy_table_title') || 'Batch Release Policy Comparison Matrix'}
                </h3>
                <HelperText uiMode={uiMode} className="text-xs text-slate-500">
                  {`Empirical transaction replay across ${results.historical_transactions_count} dispensing records over ${results.simulation_days} operational days`}
                </HelperText>
              </div>

              <button
                onClick={handleCopyTable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg transition cursor-pointer shrink-0">
                {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (t('sim_copied_toast') || 'Copied to Clipboard!') : (t('sim_copy_btn') || 'Copy Analysis Table')}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                    <th className="py-2.5 px-4">{t('sim_col_policy') || 'Inventory Policy'}</th>
                    <th className="py-2.5 px-4 text-center">{t('sim_col_released') || 'Units Released'}</th>
                    <th className="py-2.5 px-4 text-center">{t('sim_col_expired') || 'Units Expired'}</th>
                    <th className="py-2.5 px-4 text-center">{t('sim_col_spoilage') || 'Spoilage Rate (%)'}</th>
                    <th className="py-2.5 px-4 text-center">{t('sim_col_stockouts') || 'Stockout Events'}</th>
                    <th className="py-2.5 px-4 text-center">{t('relative_performance_spoilage') || 'Relative Performance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {results.policy_comparison.map((p) => {
                    const isFefoPlus = p.policy === 'FEFO+';
                    const isFifo    = p.policy === 'FIFO';
                    return (
                      <tr key={p.policy} className={`transition ${isFefoPlus ? 'bg-teal-50/40 font-medium' : 'hover:bg-zinc-50'}`}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                            <span>{p.policy}</span>
                            {isFefoPlus && <span className="bg-teal-100 text-teal-800 text-[9px] font-extrabold px-2 py-0.5 rounded border border-teal-200 uppercase tracking-widest">{t('sim_proposed_tag') || 'Proposed System'}</span>}
                            {isFifo && <span className="bg-zinc-100 text-zinc-600 text-[9px] font-semibold px-2 py-0.5 rounded uppercase">{t('sim_conventional_tag') || 'Conventional'}</span>}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-normal">
                            {p.policy === 'FIFO'  && (t('sim_fifo_row_desc') || 'Oldest received batch released first without expiry consideration')}
                            {p.policy === 'FEFO'  && (t('sim_fefo_row_desc') || 'Earliest expiration batch released without consumption velocity risk check')}
                            {p.policy === 'FEFO+' && (t('sim_fefoplus_row_desc') || 'Earliest expiry prioritized + negative margin risk batches accelerated')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900 tabular-nums text-sm">
                          {p.total_released_units}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold tabular-nums text-sm">
                          <span className={p.total_expired_units > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                            {p.total_expired_units}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold tabular-nums text-sm">
                          <span className={isFefoPlus ? 'text-teal-700' : isFifo ? 'text-rose-700' : 'text-amber-700'}>
                            {p.expired_percentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700 tabular-nums">{p.stockout_occurrences}</td>
                        <td className="py-3.5 px-4 text-center">
                          {isFefoPlus && <span className="text-teal-700 font-bold text-xs bg-teal-50 border border-teal-200 px-2 py-1 rounded">{t('sim_lowest_waste_badge') || '★ Lowest Expiration Waste'}</span>}
                          {p.policy === 'FEFO' && <span className="text-zinc-500 text-xs">{t('sim_standard_baseline') || 'Standard Baseline'}</span>}
                          {isFifo && <span className="text-rose-700 text-xs bg-rose-50 border border-rose-200 px-2 py-1 rounded">{t('sim_highest_waste_badge') || 'Highest Product Waste'}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══ Visual Waste Comparison Bars ══ */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-600">
              {t('sim_expired_units_heading', { days: results.simulation_days, source: results.data_source }) || `Expired Units Comparison — ${results.simulation_days}-Day Evaluation (${results.data_source})`}
            </h4>
            <div className="space-y-3">
              {results.policy_comparison.map(p => {
                const maxUnits = Math.max(...results.policy_comparison.map(x => x.total_expired_units), 1);
                const widthPct = Math.max(4, (p.total_expired_units / maxUnits) * 100);
                return (
                  <div key={p.policy}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{t('sim_policy_label', { policy: p.policy }) || `${p.policy} Policy`}</span>
                      <span className="tabular-nums">{t('sim_units_expired_summary', { units: p.total_expired_units, pct: p.expired_percentage }) || `${p.total_expired_units} Units Expired (${p.expired_percentage}% spoilage rate)`}</span>
                    </div>
                    <div className="w-full h-4 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                      <div className={`h-full rounded-full transition-all duration-700 ${
                        p.policy === 'FEFO+' ? 'bg-teal-500' : p.policy === 'FEFO' ? 'bg-amber-400' : 'bg-rose-500'
                      }`} style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 font-medium">
              {t('sim_key_finding_label') || 'Key Empirical Finding:'} <strong>{results.summary_findings?.best_policy_for_waste || 'FEFO+'}</strong> {t('sim_finding_text', { fifo: results.summary_findings?.waste_reduction_vs_fifo || '0 units', fefo: results.summary_findings?.waste_reduction_vs_fefo || '0 units' }) || `achieved superior performance, saving ${results.summary_findings?.waste_reduction_vs_fifo || '0 units'} compared to FIFO, and ${results.summary_findings?.waste_reduction_vs_fefo || '0 units'} compared to standard FEFO.`}
            </div>
          </div>

          {/* ══ Reorder Threshold Comparison ══ */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{t('sim_reorder_comparison_title') || 'Reorder Mechanism Performance'}</h3>
              <HelperText uiMode={uiMode} className="text-xs text-slate-500">
                Evaluation of static fixed reorder threshold vs dynamic consumption-based model [ADQS × (Lead Time + Buffer Days)]
              </HelperText>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-[10px] uppercase text-zinc-500 font-bold block mb-1 tracking-widest">
                  1. {results.reorder_comparison?.fixed_threshold?.method || t('sim_fixed_threshold_label') || 'Fixed Static Threshold'}
                </span>
                <div className="text-2xl font-black text-rose-700 tabular-nums">
                  {t('sim_stockout_events', { count: results.reorder_comparison?.fixed_threshold?.stockout_occurrences || 0 }) || `${results.reorder_comparison?.fixed_threshold?.stockout_occurrences || 0} Stockout Events`}
                </div>
                <p className="text-xs text-slate-500 mt-2">{results.reorder_comparison?.fixed_threshold?.description}</p>
              </div>
              <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200">
                <span className="text-[10px] uppercase text-teal-700 font-bold block mb-1 tracking-widest">
                  2. {results.reorder_comparison?.computed_threshold?.method || t('sim_dynamic_level_label') || 'Computed Dynamic Level'}
                </span>
                <div className="text-2xl font-black text-teal-800 tabular-nums">
                  {t('sim_stockout_events', { count: results.reorder_comparison?.computed_threshold?.stockout_occurrences || 0 }) || `${results.reorder_comparison?.computed_threshold?.stockout_occurrences || 0} Stockout Events`}
                </div>
                <p className="text-xs text-slate-600 mt-2">{results.reorder_comparison?.computed_threshold?.description}</p>
                <div className="mt-3 text-xs font-bold text-teal-700 bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {t('sim_stockout_reduction_achieved', { pct: results.reorder_comparison?.stockout_reduction_percentage || 0 }) || `${results.reorder_comparison?.stockout_reduction_percentage || 0}% Stockout Reduction Achieved`}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading overlay */}
      {loading && !results && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-12 text-center">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-500 font-medium">{t('sim_running_msg', { days: simulationDays }) || `Running policy simulation across ${simulationDays} operational days…`}</p>
        </div>
      )}
    </div>
  );
}
