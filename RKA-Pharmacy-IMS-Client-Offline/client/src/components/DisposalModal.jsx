import React, { useState } from 'react';
import { Trash2, X, AlertOctagon } from 'lucide-react';

export default function DisposalModal({ isOpen, onClose, batch, onDisposalComplete }) {
  const [quantity, setQuantity] = useState(batch?.current_quantity || 1);
  const [reason, setReason] = useState('Expired during clinic storage');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !batch) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/batches/${batch.id}/dispose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseInt(quantity),
          reason,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record disposal');
      }

      onDisposalComplete();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-red-200">
        <div className="flex items-center justify-between px-6 py-4 bg-red-600 text-white">
          <div className="flex items-center gap-2 font-bold text-lg">
            <AlertOctagon className="w-5 h-5" />
            <span>Record Batch Disposal</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-red-700 rounded-lg transition">
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
            <div className="font-bold text-slate-900">{batch.brand_name || 'Medicine Batch'}</div>
            <div className="text-xs text-slate-600">Batch Number: <span className="font-mono font-bold">{batch.batch_number}</span></div>
            <div className="text-xs text-slate-600">Expiration Date: <span className="font-semibold text-red-600">{batch.expiration_date}</span></div>
            <div className="text-xs text-slate-600">Available Stock: <span className="font-bold">{batch.current_quantity} units</span></div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Quantity to Dispose *
            </label>
            <input
              type="number"
              min="1"
              max={batch.current_quantity}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Disposal Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
            >
              <option value="Expired during clinic storage">Expired during clinic storage</option>
              <option value="Physical damage / broken seal / leakage">Physical damage / broken seal / leakage</option>
              <option value="Manufacturer / FDA safety recall">Manufacturer / FDA safety recall</option>
              <option value="Contamination or compromised temperature">Contamination or compromised temperature</option>
              <option value="Quarantine disposal">Quarantine disposal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Notes / Waste Log Reference
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Disposed via biomedical waste protocol..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
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
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? 'Disposing...' : 'Confirm Disposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
