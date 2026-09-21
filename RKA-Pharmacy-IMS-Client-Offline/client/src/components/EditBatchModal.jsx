import React, { useState, useEffect } from 'react';
import { X, DollarSign, Save, AlertCircle } from 'lucide-react';

export default function EditBatchModal({ batch, isOpen, onClose, onBatchUpdated }) {
  const [unitCost, setUnitCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (batch) {
      setUnitCost(Number(batch.unit_cost || 0).toString());
      setSellingPrice(Number(batch.selling_price || 0).toString());
      setReason('');
      setError(null);
    }
  }, [batch, isOpen]);

  if (!isOpen || !batch) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cost = parseFloat(unitCost);
    const price = parseFloat(sellingPrice);

    if (isNaN(cost) || cost <= 0) {
      setError('Unit Cost must be a positive number greater than 0.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError('Selling Price must be a positive number greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/batches/${batch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_cost: cost,
          selling_price: price,
          reason: reason || 'Batch price update via Medicines & Batches management'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update batch pricing.');
      }

      onBatchUpdated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Edit Batch Cost & Selling Price</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="font-bold text-sm text-slate-900">{batch.brand_name}</div>
            <div className="text-slate-500 font-mono text-[11px]">
              Batch: <span className="font-bold text-slate-700">{batch.batch_number}</span> • Exp: {batch.expiration_date}
            </div>
            <div className="text-[11px] text-slate-500">
              Remaining Stock: <span className="font-bold text-emerald-800">{batch.current_quantity} units</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Unit Cost (₱) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Acquisition cost
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Selling Price (₱) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-700"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Patient retail price
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Reason for Price Modification (Audit Trail)
            </label>
            <input
              type="text"
              placeholder="e.g. Supplier price change, clerical correction"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              This adjustment will be permanently recorded in the immutable audit ledger.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Update Pricing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
