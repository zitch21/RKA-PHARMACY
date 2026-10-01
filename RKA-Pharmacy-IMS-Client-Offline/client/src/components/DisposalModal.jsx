import React, { useState, useEffect } from 'react';
import { Trash2, X, AlertOctagon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function DisposalModal({ isOpen, onClose, batch, onDisposalComplete, currentUser }) {
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(batch?.current_quantity || 1);
  const [reason, setReason] = useState('Expired during clinic storage');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (batch) {
      setQuantity(batch.current_quantity || 1);
      setError(null);
    }
  }, [batch, isOpen]);

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
          notes,
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#181d26] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
        <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                {t('disposal_modal_title', 'Record Batch Disposal & Quarantine')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('disposal_modal_subtitle', 'Permanent removal of compromised stock')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-full transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-slate-50 dark:bg-[#1e2430] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-1">
            <div className="font-bold text-sm text-slate-900 dark:text-white">{batch.brand_name || 'Medicine Batch'}</div>
            <div className="text-slate-500 dark:text-slate-400 tabular-nums text-[11px]">
              {t('edit_batch_batch', 'Batch')}: <span className="font-bold text-slate-800 dark:text-slate-200">{batch.batch_number}</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 tabular-nums text-[11px]">
              {t('inv_exp_date', 'Expiration Date')}: <span className="font-bold text-rose-600 dark:text-rose-400">{batch.expiration_date}</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 tabular-nums text-[11px]">
              {t('disposal_available_stock', 'Available Stock')}: <span className="font-bold text-slate-800 dark:text-slate-200">{batch.current_quantity} units</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {t('disposal_qty_label', 'Quantity to Dispose *')}
            </label>
            <input
              type="number"
              min="1"
              max={batch.current_quantity}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-bold tabular-nums bg-white dark:bg-[#1e2430] text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {t('disposal_reason_label', 'Disposal Reason *')}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white dark:bg-[#1e2430] text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="Expired during clinic storage">{t('disposal_reason_expired', 'Expired during clinic storage')}</option>
              <option value="Physical damage / broken seal / leakage">{t('disposal_reason_damage', 'Physical damage / broken seal / leakage')}</option>
              <option value="Manufacturer / FDA safety recall">{t('disposal_reason_recall', 'Manufacturer / FDA safety recall')}</option>
              <option value="Contamination or compromised temperature">{t('disposal_reason_temp', 'Contamination or compromised temperature')}</option>
              <option value="Quarantine disposal">{t('disposal_reason_quarantine', 'Quarantine disposal')}</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {t('disposal_notes_label', 'Notes / Waste Log Reference')}
            </label>
            <textarea
              rows="2"
              placeholder={t('disposal_notes_placeholder', 'e.g. Disposed via biomedical waste protocol...')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white dark:bg-[#1e2430] text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              {t('btn_cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{loading ? t('disposal_disposing', 'Disposing...') : t('disposal_confirm_btn', 'Confirm Disposal')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
