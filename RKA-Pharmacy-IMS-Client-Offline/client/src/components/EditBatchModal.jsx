import React, { useState, useEffect } from 'react';
import { X, DollarSign, Save, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function EditBatchModal({ batch, isOpen, onClose, onBatchUpdated }) {
  const { t } = useLanguage();
  const [unitCost, setUnitCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [supplierDrNumber, setSupplierDrNumber] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (batch) {
      setUnitCost(Number(batch.unit_cost || 0).toString());
      setSellingPrice(Number(batch.selling_price || 0).toString());
      setSupplierDrNumber(batch.supplier_dr_number || '');
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
          supplier_dr_number: supplierDrNumber.trim() || null,
          reason: reason || 'Batch price & details update via Medicines & Batches management'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#181d26] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
        <div className="px-6 py-4.5 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                {t('edit_batch_title', 'Edit Batch Cost & Selling Price')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('edit_batch_subtitle', 'Modify lot acquisition cost, retail price, and DR tracking')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 dark:bg-[#1e2430] border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-1">
            <div className="font-bold text-sm text-slate-900 dark:text-white">{batch.brand_name}</div>
            <div className="text-slate-500 dark:text-slate-400 tabular-nums text-[11px]">
              {t('edit_batch_batch', 'Batch')}: <span className="font-bold text-slate-800 dark:text-slate-200">{batch.batch_number}</span> • {t('edit_batch_exp', 'Exp')}: {batch.expiration_date}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {t('edit_batch_remaining', 'Remaining Stock')}: <span className="font-bold text-teal-700 dark:text-teal-400">{batch.current_quantity} units</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                {t('edit_batch_unit_cost', 'Unit Cost (₱)')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold tabular-nums bg-white dark:bg-[#1e2430] text-slate-900 dark:text-slate-100"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block">
                {t('edit_batch_acq_cost', 'Acquisition cost')}
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                {t('edit_batch_selling_price', 'Selling Price (₱)')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold tabular-nums text-teal-700 dark:text-teal-400 bg-white dark:bg-[#1e2430]"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block">
                {t('edit_batch_retail_price', 'Patient retail price')}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {t('edit_batch_dr_label', 'Supplier DR / Sales Invoice Number')}
            </label>
            <input
              type="text"
              placeholder={t('edit_batch_dr_placeholder', 'e.g. DR-2026-9042 or SI-88124')}
              value={supplierDrNumber}
              onChange={(e) => setSupplierDrNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none tabular-nums uppercase bg-white dark:bg-[#1e2430] text-slate-900 dark:text-slate-100"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {t('edit_batch_dr_help', 'Official supplier Delivery Receipt (DR) or Sales Invoice (SI) tracking reference.')}
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {t('edit_batch_reason_label', 'Reason for Price Modification (Audit Trail)')}
            </label>
            <input
              type="text"
              placeholder={t('edit_batch_reason_placeholder', 'e.g. Supplier price adjustment, clerical correction')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white dark:bg-[#1e2430] text-slate-900 dark:text-slate-100"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {t('edit_batch_reason_help', 'This adjustment will be permanently recorded in the immutable audit ledger.')}
            </span>
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
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-[0.98] rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? t('saving', 'Saving...') : t('edit_batch_save_btn', 'Update Pricing')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
