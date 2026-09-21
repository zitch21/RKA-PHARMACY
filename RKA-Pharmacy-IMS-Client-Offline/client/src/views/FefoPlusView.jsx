import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Check,
  RefreshCw,
  Info,
  AlertCircle,
  Filter
} from 'lucide-react';

export default function FefoPlusView({ fefoData, onRefresh, _onNavigate }) {
  const [applyingId, setApplyingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [showOnlyDiscrepant, setShowOnlyDiscrepant] = useState(false);

  const atRiskBatches = fefoData?.at_risk_batches || [];
  const medicineAnalysis = fefoData?.medicine_analysis || [];
  const recordedDays = fefoData?.history_days_recorded || 0;
  const requiredDays = fefoData?.history_days_required || 30;
  const hasEnoughData = fefoData?.has_enough_data;

  const handleApplySuggestedThreshold = async (medicineId, suggestedValue) => {
    setApplyingId(medicineId);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/fefo-plus/apply-suggested-threshold/${medicineId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggested_value: suggestedValue })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update threshold');

      setActionSuccess(data.message);
      onRefresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>Enhanced First-Expiry-First-Out (FEFO+) Intelligence</span>
            </h2>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Automated Risk Detection
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consumption-based expiry risk analysis and dynamic suggested reorder thresholds for R.K.A Pharmacy
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalculate Metrics</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 font-bold text-xs">✕</button>
        </div>
      )}

      {/* Methodology & Mathematical Formulation Card */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-xl shadow-md border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>FEFO+ Mathematical Formulation & Principles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] uppercase text-slate-400 font-sans block mb-1">1. Shelf Life Countdown</span>
            <div className="text-white font-bold">Days to Expiry =</div>
            <div className="text-emerald-400">Expiration Date − Current Date</div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] uppercase text-slate-400 font-sans block mb-1">2. Consumption Velocity</span>
            <div className="text-white font-bold">Days to Consume =</div>
            <div className="text-amber-300">Current Stock ÷ ADQS</div>
            <span className="text-[10px] text-slate-400 font-sans mt-1 block">ADQS: Avg Daily Quantity Sold</span>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] uppercase text-slate-400 font-sans block mb-1">3. Waste Risk Indicator</span>
            <div className="text-white font-bold">Expiry Risk Margin =</div>
            <div className="text-purple-300">Days to Expiry − Days to Consume</div>
            <span className="text-[10px] text-rose-400 font-sans mt-1 block">&lt; 0 indicates stock cannot sell before expiry!</span>
          </div>
        </div>

        {/* 30-Day Data Requirement Status */}
        <div className="p-3 bg-indigo-950/70 border border-indigo-800/70 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Sales History Span: </span>
              <span className="text-indigo-200">
                {recordedDays} days recorded in system ledger (Minimum required: {requiredDays} days).
              </span>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
            hasEnoughData ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            {hasEnoughData ? 'Full FEFO+ Active' : 'Baseline Mode'}
          </span>
        </div>
      </div>

      {/* Section 1: Batches with Negative Expiry Risk Margin (High Waste Risk) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span>Batches Not Likely to be Sold Before Expiration (Risk Margin &lt; 0)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Batches where remaining stock exceeds expected sales volume within the remaining shelf life.
            </p>
          </div>
          <span className="text-xs bg-rose-50 text-rose-800 border border-rose-200 font-bold px-2.5 py-1 rounded-full">
            {atRiskBatches.length} At-Risk Batches
          </span>
        </div>

        {atRiskBatches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Medicine & Form</th>
                  <th className="py-3 px-3">Batch Number</th>
                  <th className="py-3 px-3">Current Stock</th>
                  <th className="py-3 px-3">Daily Sales (ADQS)</th>
                  <th className="py-3 px-3">Days to Expiry</th>
                  <th className="py-3 px-3">Days to Consume</th>
                  <th className="py-3 px-3 text-right">Risk Margin (ERM)</th>
                  <th className="py-3 px-4 text-center">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atRiskBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-rose-50/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {b.brand_name}
                      <span className="text-[11px] text-slate-500 block font-normal">
                        {b.generic_name} • {b.dosage_strength}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">{b.batch_number}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {b.current_quantity} {b.unit_of_measure}s
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {b.adqs} / day
                    </td>
                    <td className="py-3 px-3 font-semibold text-rose-600">
                      {b.days_to_expiry} days ({b.expiration_date})
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {b.days_to_consume} days
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 text-sm">
                      {b.expiry_risk_margin} days
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                          Accelerate Release / Pause Orders
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          Unsold: ~{Math.max(1, Math.round(Math.abs(b.expiry_risk_margin) * b.adqs))} units at risk
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            ✓ No batches with negative Expiry Risk Margin detected.
          </div>
        )}
      </div>

      {/* Section 2: Reorder Level Suggestion & Dynamic Threshold Planner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Suggested Reorder Level Planner</span>
            </h3>
            <p className="text-xs text-slate-500">
              Formula: <span className="font-mono text-emerald-800 font-semibold">Suggested = ADQS × (Lead Time + Buffer Days)</span>. Compares owner's current threshold with computed requirement.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowOnlyDiscrepant(!showOnlyDiscrepant)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                showOnlyDiscrepant
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{showOnlyDiscrepant ? 'Filter: Discrepant Only' : 'Show: All Items'}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${showOnlyDiscrepant ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-800'}`}>
                {medicineAnalysis.filter(ma => ma.suggested_reorder_level !== ma.current_threshold).length}
              </span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Medicine</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">Avg Daily Sold</th>
                <th className="py-3 px-3">Lead Time</th>
                <th className="py-3 px-3">Buffer Days</th>
                <th className="py-3 px-3 text-center">Owner Threshold</th>
                <th className="py-3 px-3 text-center">Suggested Reorder Level</th>
                <th className="py-3 px-4 text-right">Owner Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(showOnlyDiscrepant ? medicineAnalysis.filter(ma => ma.suggested_reorder_level !== ma.current_threshold) : medicineAnalysis).map((ma) => {
                const isSuggestedDifferent = ma.suggested_reorder_level !== ma.current_threshold;

                return (
                  <tr key={ma.medicine.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{ma.medicine.brand_name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {ma.medicine.generic_name} ({ma.medicine.dosage_strength})
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        ma.is_low_stock ? 'bg-amber-100 text-amber-800' : 'text-slate-800'
                      }`}>
                        {ma.total_stock} {ma.medicine.unit_of_measure}s
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {ma.adqs} / day
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {ma.lead_time_days} days
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {ma.buffer_days} days
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {ma.current_threshold} units
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        {ma.suggested_reorder_level} units
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isSuggestedDifferent ? (
                        <button
                          disabled={applyingId === ma.medicine.id}
                          onClick={() => handleApplySuggestedThreshold(ma.medicine.id, ma.suggested_reorder_level)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{applyingId === ma.medicine.id ? 'Applying...' : 'Accept Suggested'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs flex items-center justify-end gap-1">
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Aligned</span>
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
    </div>
  );
}
