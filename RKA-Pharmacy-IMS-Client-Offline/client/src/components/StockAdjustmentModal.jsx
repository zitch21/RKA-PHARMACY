import React, { useState } from 'react';
import { Sliders, X, Check } from 'lucide-react';

export default function StockAdjustmentModal({ isOpen, onClose, batch, onAdjustmentComplete }) {
  const [actualQty, setActualQty] = useState(batch?.current_quantity || 0);
  const [reason, setReason] = useState('Physical inventory recount discrepancy');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !batch) return null;

  const current = batch.current_quantity;
  const difference = parseInt(actualQty || 0) - current;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/transactions/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batch.id,
          actual_quantity: parseInt(actualQty),
          reason,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to adjust stock');
      }

      onAdjustmentComplete();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 text-white">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>Physical Stock Adjustment</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
            <div className="font-bold text-slate-900">{batch.brand_name}</div>
            <div className="text-xs text-slate-600">Batch: <span className="font-mono font-bold">{batch.batch_number}</span></div>
            <div className="text-xs text-slate-600">System Recorded Stock: <span className="font-bold text-indigo-700">{current} units</span></div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Actual Physical Count *
            </label>
            <input
              type="number"
              min="0"
              required
              value={actualQty}
              onChange={(e) => setActualQty(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="mt-1 text-xs">
              Discrepancy:{' '}
              <span className={`font-bold ${difference > 0 ? 'text-emerald-600' : difference < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                {difference > 0 ? `+${difference} (Surplus)` : difference < 0 ? `${difference} (Deficit)` : '0 (Matches system)'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Adjustment Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="Physical inventory recount discrepancy">Physical inventory recount discrepancy</option>
              <option value="Unrecorded clinic sample dispensing">Unrecorded clinic sample dispensing</option>
              <option value="Damage / broken glass bottle">Damage / broken glass bottle</option>
              <option value="Supplier packaging count correction">Supplier packaging count correction</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Audit Notes
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Recounted during weekly inventory inspection..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Saving...' : 'Apply Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
