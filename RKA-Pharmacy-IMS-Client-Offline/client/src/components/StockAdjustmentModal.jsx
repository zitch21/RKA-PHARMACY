import React, { useState, useEffect } from 'react';
import { Sliders, X, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function StockAdjustmentModal({ isOpen, onClose, batch, onAdjustmentComplete }) {
  const { t } = useLanguage();
  const [actualQty, setActualQty] = useState(batch?.current_quantity || 0);
  const [reason, setReason] = useState('Physical inventory recount discrepancy');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (batch) {
      setActualQty(batch.current_quantity || 0);
      setError(null);
    }
  }, [batch, isOpen]);

  if (!isOpen || !batch) return null;

  const current = batch.current_quantity;
  const difference = parseInt(actualQty || 0, 10) - current;

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
          actual_quantity: parseInt(actualQty, 10),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#181d26] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
        <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                {t('adj_modal_title', 'Physical Stock Count Adjustment')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('adj_modal_subtitle', 'Reconcile physical inventory with audit logs')}
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
            <div className="font-bold text-sm text-slate-900 dark:text-white">{batch.brand_name}</div>
            <div className="text-slate-500 dark:text-slate-400 tabular-nums text-[11px]">
              {t('edit_batch_batch', 'Batch')}: <span className="font-bold text-slate-800 dark:text-slate-200">{batch.batch_number}</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 tabular-nums text-[11px]">
              {t('adj_sys_stock', 'System Recorded Stock')}: <span className="font-bold text-teal-700 dark:text-teal-400">{current} units</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {t('adj_actual_count', 'Actual Physical Count *')}
            </label>
            <input
              type="number"
              min="0"
              required
              value={actualQty}
              onChange={(e) => setActualQty(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold tabular-nums bg-white dark:bg-[#1e2430] text-slate-900 dark:text-slate-100"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">{t('adj_discrepancy', 'Discrepancy:')}</span>
              <span className={`tabular-nums font-bold text-xs px-2 py-0.5 rounded border ${
                difference > 0
                  ? 'text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60'
                  : difference < 0
                  ? 'text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
                  : 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}>
                {difference > 0 ? `+${difference} (${t('adj_surplus', 'Surplus')})` : difference < 0 ? `${difference} (${t('adj_deficit', 'Deficit')})` : `0 (${t('adj_matches', 'Matches system')})`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {t('adj_reason_label', 'Adjustment Reason *')}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white dark:bg-[#1e2430] text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="Physical inventory recount discrepancy">{t('adj_reason_recount', 'Physical inventory recount discrepancy')}</option>
              <option value="Unrecorded clinic sample dispensing">{t('adj_reason_sample', 'Unrecorded clinic sample dispensing')}</option>
              <option value="Damage / broken glass bottle">{t('adj_reason_damage', 'Damage / broken glass bottle')}</option>
              <option value="Supplier packaging count correction">{t('adj_reason_packaging', 'Supplier packaging count correction')}</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {t('adj_notes_label', 'Audit Notes')}
            </label>
            <textarea
              rows="2"
              placeholder={t('adj_notes_placeholder', 'e.g. Recounted during weekly inventory inspection...')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white dark:bg-[#1e2430] text-slate-900 dark:text-slate-100"
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-[0.98] rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? t('saving', 'Saving...') : t('adj_apply_btn', 'Apply Stock Adjustment')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
