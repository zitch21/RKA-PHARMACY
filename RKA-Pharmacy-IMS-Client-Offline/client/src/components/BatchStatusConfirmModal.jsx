import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Clock, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function BatchStatusConfirmModal({
  isOpen,
  onClose,
  batch,
  medicine,
  quantity,
  onConfirm
}) {
  const { t } = useLanguage();
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !batch || !medicine) return null;

  const isCritical = batch.expiry_tier === 'Critical';
  const isWarning = batch.expiry_tier === 'Warning';
  const isAtRisk = batch.is_at_waste_risk || batch.expiry_risk_margin < 0;

  const tierBg = isCritical
    ? 'bg-rose-50 border-rose-200 text-rose-800'
    : isWarning
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-purple-50 border-purple-200 text-purple-800';

  const tierBadge = isCritical
    ? 'bg-rose-100 text-rose-800 border border-rose-300'
    : isWarning
    ? 'bg-amber-100 text-amber-800 border border-amber-300'
    : 'bg-purple-100 text-purple-800 border border-purple-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isCritical ? 'bg-rose-600 text-white' : isWarning ? 'bg-amber-600 text-white' : 'bg-purple-700 text-white'
        }`}>
          <div className="flex items-center gap-2.5 font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
            <span>{t('modal_batch_confirm_title')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          {/* Advisory Notice */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${tierBg}`}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs">{t('modal_batch_confirm_fefo_alert') || 'FEFO+ Expiry Alert Protocol'}</p>
              <p className="mt-0.5 leading-relaxed">
                {t('modal_batch_confirm_desc') || 'Dispensing a batch classified as At-Risk requires explicit confirmation before releasing.'}
              </p>
            </div>
          </div>

          {/* Medicine & Batch Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{t('inv_col_medicine')}</span>
                <p className="font-bold text-sm text-slate-900">{medicine.brand_name}</p>
                <p className="text-slate-500 text-[11px]">{medicine.generic_name} • {medicine.dosage_strength}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${tierBadge}`}>
                {batch.expiry_tier || 'At-Risk'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">{t('inv_batch_num')}</span>
                <span className="font-mono font-bold text-slate-800">{batch.batch_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">{t('inv_exp_date')}</span>
                <span className="font-bold text-slate-800">{batch.expiration_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Days to Expiry</span>
                <span className={`font-bold ${isCritical ? 'text-rose-600' : 'text-amber-600'}`}>
                  {batch.days_to_expiry} days remaining
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">{t('dispense_qty_to_dispense')}</span>
                <span className="font-bold text-emerald-700">{quantity} {medicine.unit_of_measure || 'units'}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-normal text-center">
            Confirming this release will add the batch to the current dispensing cart and log verification in the audit trail.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            {t('btn_cancel')}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition ${
              isCritical
                ? 'bg-rose-600 hover:bg-rose-700'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{t('modal_batch_confirm_btn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
