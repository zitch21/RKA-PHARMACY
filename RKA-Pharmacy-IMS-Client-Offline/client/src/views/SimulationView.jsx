import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  Copy,
  Check,
  TrendingDown,
  ShieldCheck,
  AlertOctagon,
  FileSpreadsheet,
  Award,
  Sparkles
} from 'lucide-react';

export default function SimulationView() {
  const [simulationDays, setSimulationDays] = useState(90);
  const [scenario, setScenario] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  const runSimulation = async (days = simulationDays, targetScenario = scenario) => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: parseInt(days),
          scenario: targetScenario
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
    runSimulation(90, 'standard');
  }, []);

  const handleLoadBenchmark = () => {
    setScenario('benchmark_divergence');
    setSimulationDays(60);
    runSimulation(60, 'benchmark_divergence');
  };

  const handleResetStandard = () => {
    setScenario('standard');
    setSimulationDays(90);
    runSimulation(90, 'standard');
  };

  const handleCopyTable = () => {
    if (!results) return;
    let tableText = `POLICY COMPARISON TABLE (Simulation Duration: ${results.simulation_days} Days)\n`;
    tableText += `Policy\tTotal Units Released\tTotal Units Expired\t% Expired Units\tStockout Events\n`;
    results.policy_comparison.forEach(p => {
      tableText += `${p.policy}\t${p.total_released_units}\t${p.total_expired_units}\t${p.expired_percentage}%\t${p.stockout_occurrences}\n`;
    });
    tableText += `\nREORDER MECHANISM COMPARISON:\n`;
    tableText += `Static Fixed Threshold Stockouts: ${results.reorder_comparison.fixed_threshold.stockout_occurrences}\n`;
    tableText += `Computed Reorder Level Stockouts: ${results.reorder_comparison.computed_threshold.stockout_occurrences}\n`;
    tableText += `Stockout Reduction: ${results.reorder_comparison.stockout_reduction_percentage}%\n`;

    navigator.clipboard.writeText(tableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-indigo-600" />
              <span>Comparative Policy Simulation Engine</span>
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Inventory Policy Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empirical evaluation comparing FIFO vs Standard FEFO vs Enhanced FEFO+ and Static vs Computed Reorder Levels
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {scenario === 'benchmark_divergence' ? (
            <button
              onClick={handleResetStandard}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition"
            >
              <span>← Reset to Standard Scenario</span>
            </button>
          ) : (
            <button
              onClick={handleLoadBenchmark}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg shadow-2xs transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Load Benchmark Multi-Batch Scenario</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 font-medium">Horizon:</span>
            <select
              value={simulationDays}
              onChange={(e) => {
                const d = e.target.value;
                setSimulationDays(d);
                runSimulation(d, scenario);
              }}
              className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="30">30 Days (Early Horizon)</option>
              <option value="60">60 Days (Divergence Horizon)</option>
              <option value="90">90 Days (Standard Horizon)</option>
              <option value="180">180 Days (Extended Horizon)</option>
            </select>
          </div>

          <button
            onClick={() => runSimulation(simulationDays, scenario)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Benchmark Divergence Scenario Banner */}
      {results?.benchmark_info && (
        <div className="p-5 bg-purple-950 text-purple-100 rounded-xl border border-purple-800 shadow-md space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-800/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
              <span className="font-bold text-sm text-white tracking-tight">
                {results.benchmark_info.title}
              </span>
              <span className="bg-purple-800/80 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-700">
                Horizon: {results.simulation_days} Days
              </span>
            </div>
            <span className="text-[11px] text-purple-300">
              Evaluates FIFO vs FEFO vs FEFO+ Under Non-Sequential Expiry Arrivals
            </span>
          </div>

          <p className="text-xs text-purple-200 leading-relaxed">
            {results.benchmark_info.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1 font-mono">
            <div className="p-3 bg-purple-900/60 rounded-lg border border-purple-700/60 font-sans">
              <div className="font-bold text-amber-300 text-xs mb-1">Batch A (Distant Expiry, Arrived First)</div>
              <div className="text-white text-xs">{results.benchmark_info.batch_a}</div>
              <p className="text-[11px] text-purple-300 mt-1 font-sans">
                <strong>FIFO Behavior:</strong> {results.benchmark_info.fifo_behavior}
              </p>
            </div>

            <div className="p-3 bg-purple-900/60 rounded-lg border border-purple-700/60 font-sans">
              <div className="font-bold text-emerald-300 text-xs mb-1">Batch B (Imminent Expiry, Arrived Later)</div>
              <div className="text-white text-xs">{results.benchmark_info.batch_b}</div>
              <p className="text-[11px] text-purple-300 mt-1 font-sans">
                <strong>FEFO / FEFO+ Behavior:</strong> {results.benchmark_info.fefo_behavior}
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-purple-900/40 rounded-lg border border-purple-800/70 text-[11px] text-purple-200 flex items-center gap-2 font-sans">
            <span className="font-bold text-amber-400">💡 Horizon Expansion Impact:</span>
            <span>{results.benchmark_info.horizon_note}</span>
          </div>
        </div>
      )}

      {/* Policy Simulation Methodology Box */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider">
          <Award className="w-4 h-4" />
          <span>Policy Simulation Methodology</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          This simulation compares inventory performance across three batch release policies: <strong>First-In-First-Out (FIFO)</strong>, <strong>Standard First-Expiry-First-Out (FEFO)</strong>, and the <strong>Enhanced First-Expiry-First-Out (FEFO+)</strong> mechanism. It evaluates total expired units, percentage of product waste, and zero-stock occurrences across simulated operational periods.
        </p>
      </div>

      {results && (
        <>
          {/* Batch Release Policy Comparison */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Comparative Analysis of Batch Release Policies on Expiry Waste and Stockouts
                </h3>
                <p className="text-xs text-slate-500">
                  Simulation over {results.simulation_days} operational days with identical incoming clinic shipments
                </p>
              </div>

              <button
                onClick={handleCopyTable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Analysis Table'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Release Policy</th>
                    <th className="py-3 px-4 text-center">Total Units Released</th>
                    <th className="py-3 px-4 text-center">Total Units Expired Without Release</th>
                    <th className="py-3 px-4 text-center">Percentage of Expired Units</th>
                    <th className="py-3 px-4 text-center">Zero-Stock Occurrences</th>
                    <th className="py-3 px-4 text-center">Relative Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.policy_comparison.map((p) => {
                    const isFefoPlus = p.policy === 'FEFO+';
                    const isFifo = p.policy === 'FIFO';

                    return (
                      <tr
                        key={p.policy}
                        className={`transition ${isFefoPlus ? 'bg-emerald-50/60 font-medium' : 'hover:bg-slate-50'}`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                            <span>{p.policy}</span>
                            {isFefoPlus && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                                Proposed System
                              </span>
                            )}
                            {isFifo && (
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded uppercase">
                                Conventional
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-normal">
                            {p.policy === 'FIFO' && 'Oldest received batch released first without expiry consideration'}
                            {p.policy === 'FEFO' && 'Earliest expiration batch released without consumption velocity risk check'}
                            {p.policy === 'FEFO+' && 'Earliest expiry prioritized + negative margin risk batches accelerated'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-800 text-sm">
                          {p.total_released_units} units
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block font-extrabold text-sm px-2.5 py-1 rounded ${
                            isFefoPlus
                              ? 'bg-emerald-100 text-emerald-800'
                              : isFifo
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.total_expired_units} units
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-sm">
                          <span className={isFefoPlus ? 'text-emerald-700' : isFifo ? 'text-red-700' : 'text-amber-700'}>
                            {p.expired_percentage}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          {p.stockout_occurrences} events
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isFefoPlus && (
                            <span className="text-emerald-700 font-bold text-xs bg-emerald-100/70 border border-emerald-300 px-2 py-1 rounded">
                              ★ Lowest Expiration Waste
                            </span>
                          )}
                          {p.policy === 'FEFO' && (
                            <span className="text-slate-600 text-xs">Standard Baseline</span>
                          )}
                          {isFifo && (
                            <span className="text-red-700 text-xs bg-red-50 px-2 py-1 rounded">
                              Highest Product Waste
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Waste Comparison Bars */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Expired Units Comparison Across Simulated Policies
            </h4>

            <div className="space-y-3">
              {results.policy_comparison.map(p => {
                const maxUnits = Math.max(...results.policy_comparison.map(x => x.total_expired_units), 1);
                const widthPct = Math.max(5, (p.total_expired_units / maxUnits) * 100);

                return (
                  <div key={p.policy}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{p.policy} Policy</span>
                      <span>{p.total_expired_units} Units Expired ({p.expired_percentage}% of total released)</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.policy === 'FEFO+' ? 'bg-emerald-500' : p.policy === 'FEFO' ? 'bg-amber-400' : 'bg-red-500'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-medium">
              Key Finding: <strong>{results.summary_findings.best_policy_for_waste}</strong> achieved superior performance, saving {results.summary_findings.waste_reduction_vs_fifo} compared to traditional FIFO, and {results.summary_findings.waste_reduction_vs_fefo} compared to standard FEFO.
            </div>
          </div>

          {/* Reorder Threshold Performance (Fixed Static vs Computed Dynamic) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Comparison of Fixed Reorder Threshold vs Computed Dynamic Reorder Level in Preventing Stockouts
              </h3>
              <p className="text-xs text-slate-500">
                Evaluation of fixed threshold vs dynamic consumption-based model [ADQS × (Lead Time + Buffer Days)]
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs uppercase text-slate-500 font-bold block mb-1">
                  1. Fixed Reorder Threshold
                </span>
                <div className="text-2xl font-bold text-red-700">
                  {results.reorder_comparison.fixed_threshold.stockout_occurrences} Stockout Events
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  {results.reorder_comparison.fixed_threshold.description}
                </p>
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-xs uppercase text-emerald-700 font-bold block mb-1">
                  2. Computed Dynamic Reorder Level
                </span>
                <div className="text-2xl font-bold text-emerald-800">
                  {results.reorder_comparison.computed_threshold.stockout_occurrences} Stockout Events
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  {results.reorder_comparison.computed_threshold.description}
                </p>
                <div className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded inline-block">
                  ✓ {results.reorder_comparison.stockout_reduction_percentage}% Stockout Reduction
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
