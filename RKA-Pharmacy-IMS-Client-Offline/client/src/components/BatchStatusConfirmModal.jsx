import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function BatchStatusConfirmModal({
  isOpen,
  onClose,
  batch,
  medicine,
  quantity,
  onConfirm,
  uiMode = 'maximalist',
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

  if (uiMode === 'clean') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
        <div className="bg-white dark:bg-[#181d26] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
          {/* Header */}
          <div className="px-6 py-4.5 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isCritical
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                  {isCritical ? t('expiring_soon_warning', 'Expiring Soon Warning') : t('near_expiry_notice', 'Near-Expiry Notice')}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('fefo_safeguard_proto_conf', 'FEFO+ safeguard protocol confirmation')}
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

          {/* Content */}
          <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="bg-slate-50 dark:bg-[#1e2430] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{medicine.brand_name}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{medicine.generic_name} • {medicine.dosage_strength}</p>
              
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t('inv_batch_num', 'Batch / Lot #')}</span>
                  <span className="tabular-nums font-bold text-slate-800 dark:text-slate-200">{batch.batch_number}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t('inv_exp_date', 'Expiration')}</span>
                  <span className={`font-bold tabular-nums ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {batch.expiration_date} ({batch.days_to_expiry}{t('days_left_short', 'd left')})
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {t('batch_expiring_prompt_p1', 'This batch is expiring within')} <strong className={isCritical ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>{batch.days_to_expiry} {t('days_left', 'days left')}</strong>. {t('batch_expiring_prompt_p2', 'Are you sure you want to dispense this item to the patient?')}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={onConfirm}
                className={`w-full min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                  isCritical ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{t('btn_dispense_this_batch', 'Yes, Dispense This Batch')}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[40px] px-4 py-2 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {t('btn_cancel_keep_off_cart', 'Cancel & Keep Off Cart')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tierBg = isCritical
    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'
    : isWarning
    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
    : 'bg-slate-50 dark:bg-[#1e2430] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200';

  const tierBadge = isCritical
    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
    : isWarning
    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#181d26] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-sm">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              isCritical
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                {t('modal_batch_confirm_title') || 'FEFO+ Expiry Release Confirmation'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('patient_safety_verification_proto', 'Patient safety verification protocol')}
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

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {/* Advisory Notice */}
          <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${tierBg}`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs">{t('modal_batch_confirm_fefo_alert') || 'FEFO+ Expiry Alert Protocol'}</p>
              <p className="mt-0.5 leading-relaxed text-[11px] opacity-90">
                {t('modal_batch_confirm_desc') || 'Dispensing a batch classified as At-Risk requires explicit confirmation before releasing.'}
              </p>
            </div>
          </div>

          {/* Medicine & Batch Summary */}
          <div className="bg-slate-50 dark:bg-[#1e2430] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider tabular-nums">{t('inv_col_medicine') || 'Medicine'}</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{medicine.brand_name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">{medicine.generic_name} • {medicine.dosage_strength}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tabular-nums uppercase border ${tierBadge}`}>
                {batch.expiry_tier || 'At-Risk'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-white/10 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase tabular-nums">{t('inv_batch_num') || 'Batch / Lot #'}</span>
                <span className="tabular-nums font-bold text-slate-800 dark:text-slate-200">{batch.batch_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase tabular-nums">{t('inv_exp_date') || 'Expiration Date'}</span>
                <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">{batch.expiration_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase tabular-nums">{t('days_to_expiry_label', 'Days to Expiry')}</span>
                <span className={`font-bold tabular-nums ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {batch.days_to_expiry} {t('days_remaining', 'days remaining')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase tabular-nums">{t('dispense_qty_to_dispense') || 'Qty to Dispense'}</span>
                <span className="font-bold tabular-nums text-teal-700 dark:text-teal-400">{quantity} {medicine.unit_of_measure || t('units', 'units')}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal text-center">
            {t('batch_confirm_footer_notice', 'Confirming this release adds the batch to the active dispensing slip and records the transaction in the immutable audit ledger.')}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/60 dark:bg-[#1e2430]/60 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            {t('btn_cancel') || 'Cancel'}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition active:scale-[0.98] cursor-pointer ${
              isCritical
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t('modal_batch_confirm_btn') || 'Confirm & Add to Slip'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
