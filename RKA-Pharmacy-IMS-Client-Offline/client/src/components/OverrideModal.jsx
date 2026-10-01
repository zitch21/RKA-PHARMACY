import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function OverrideModal({
  isOpen,
  onClose,
  fefoBatch,
  selectedBatch,
  medicine,
  medicineName,
  onConfirm,
  onConfirmOverride,
  uiMode = 'clean',
}) {
  const { t } = useLanguage();
  const [reason, setReason] = useState(uiMode === 'clean' ? 'Customer requested newer batch' : '');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen || !fefoBatch || !selectedBatch) return null;

  const resolvedMedicineName = medicineName || medicine?.brand_name || (typeof medicine === 'string' ? medicine : '');
  const handleConfirmAction = onConfirmOverride || onConfirm;

  const cleanReasons = [
    { label: t('override_reason_damaged', 'Damaged box'), value: 'Damaged box' },
    { label: t('override_reason_customer_request', 'Customer requested newer batch'), value: 'Customer requested newer batch' },
    { label: t('override_reason_other', 'Other'), value: 'Other' },
  ];

  const maximalistReasons = [
    'Customer specifically requested newer batch/packaging',
    'Exterior box or packaging damaged on earliest expiring batch',
    'Prescribing physician requested specific batch/lot code',
    'Earliest batch quarantined for quality inspection',
    'Other'
  ];

  const handleConfirm = () => {
    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
      setError(uiMode === 'clean' ? t('override_err_select_reason_clean', 'Please select or provide a reason.') : t('override_err_select_reason_max', 'A valid justification is required to override the FEFO release policy.'));
      return;
    }
    setError(null);
    if (handleConfirmAction) {
      handleConfirmAction(finalReason);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#181d26] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                {uiMode === 'clean'
                  ? t('override_prompt_title', 'Why are you choosing a different batch?')
                  : (t('modal_override_title') || 'FEFO Policy Override Verification')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('override_safeguard_sub', 'Manual batch selection safeguard justification')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-full transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {uiMode === 'clean' ? (
            <div className="p-3.5 bg-slate-50 dark:bg-[#1e2430] border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
              {t('override_clean_intro', 'The counter system automatically picks the earliest batch to avoid expired stock. If you need to give a different batch to the customer, please choose the reason below:')}
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-950 dark:text-amber-200 leading-relaxed text-[11px]">
              <span className="font-bold">{t('mandatory_audit_notice', 'Mandatory Audit Notice:')}</span> {t('modal_override_notice') || 'Dispensing a batch out of FEFO sequence bypasses the earliest expiration safeguard and requires an immutable justification.'}
            </div>
          )}

          {resolvedMedicineName && (
            <div className="px-4 py-2.5 bg-zinc-50 dark:bg-[#1e2430] border border-zinc-200 dark:border-white/10 rounded-xl flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-slate-400 font-bold uppercase text-[11px]">{t('label_medicine', 'Medicine:')}</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{resolvedMedicineName}</span>
            </div>
          )}

          {/* Batch comparison cards */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-teal-50/60 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800/60">
              <span className="text-[10px] uppercase text-teal-800 dark:text-teal-300 font-bold block mb-1">
                {uiMode === 'clean' ? t('earliest_batch_rec', 'Earliest Batch (Recommended)') : (t('modal_override_rec_batch') || '1. FEFO-Recommended Batch')}
              </span>
              <div className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">{fefoBatch.batch_number}</div>
              <div className="text-xs text-teal-800 dark:text-teal-300 font-bold mt-1 tabular-nums">
                {t('stockin_col_expiry', 'Exp')}: {fefoBatch.expiration_date} ({fefoBatch.days_to_expiry}{t('days_left_short', 'd left')})
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-slate-400 mt-0.5 tabular-nums">{t('fefo_col_stock', 'Stock')}: {fefoBatch.current_quantity} {t('units', 'units')}</div>
            </div>

            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60">
              <span className="text-[10px] uppercase text-amber-800 dark:text-amber-300 font-bold block mb-1">
                {uiMode === 'clean' ? t('your_chosen_batch', 'Your Chosen Batch') : (t('modal_override_sel_batch') || '2. Manually Selected Batch')}
              </span>
              <div className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">{selectedBatch.batch_number}</div>
              <div className="text-xs text-amber-800 dark:text-amber-300 font-bold mt-1 tabular-nums">
                {t('stockin_col_expiry', 'Exp')}: {selectedBatch.expiration_date} ({selectedBatch.days_to_expiry}{t('days_left_short', 'd left')})
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-slate-400 mt-0.5 tabular-nums">{t('fefo_col_stock', 'Stock')}: {selectedBatch.current_quantity} {t('units', 'units')}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-2.5">
              {uiMode === 'clean' ? t('choose_reason_label', 'Choose reason:') : (t('modal_override_reason_label') || 'Select Mandatory Justification Reason:')}
            </label>
            <div className="space-y-2 mb-3">
              {(uiMode === 'clean' ? cleanReasons : maximalistReasons.map(r => ({ label: r, value: r }))).map((item, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition ${
                    reason === item.value
                      ? 'border-teal-600 dark:border-teal-500 bg-teal-50/80 dark:bg-teal-950/50 font-bold text-teal-950 dark:text-teal-200 ring-1 ring-teal-500'
                      : 'border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="overrideReasonOption"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={() => {
                      setReason(item.value);
                      setError(null);
                    }}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            {reason === 'Other' && (
              <textarea
                rows="2"
                placeholder={uiMode === 'clean' ? t('override_placeholder_clean', 'Please write brief reason...') : t('override_placeholder_max', 'Enter detailed clinical or customer justification...')}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border-2 border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white dark:bg-[#1e2430] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                autoFocus
              />
            )}

            {error && <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1.5">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              {uiMode === 'clean' ? t('btn_keep_earliest_batch', 'Keep Earliest Batch') : (t('btn_cancel') || 'Keep Earliest Batch')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="h-10 inline-flex items-center gap-2 px-5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-[0.98] rounded-xl shadow-xs transition cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{uiMode === 'clean' ? t('btn_use_this_batch', 'Use This Batch') : (t('modal_override_btn') || 'Confirm Override & Log')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
