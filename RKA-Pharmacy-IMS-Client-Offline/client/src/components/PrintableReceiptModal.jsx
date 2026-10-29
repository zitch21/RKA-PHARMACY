import React from 'react';
import { CheckCircle2, X, Printer } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatDatePH } from '../utils/dateFormatter';

/**
 * PrintableReceiptModal
 * Renders an 80mm thermal-formatted receipt slip with print CSS immunity.
 */
export default function PrintableReceiptModal({ receipt, onClose, currentUser }) {
  const { t } = useLanguage();

  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
        <div className="p-4 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex justify-between items-center no-print">
          <span className="font-bold text-xs flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="w-6 h-6 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>{t('dispense_completed_receipt', 'Dispense Completed')} — {receipt.receipt_no}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Paper (Printable Area) */}
        <div className="p-6 tabular-nums text-xs text-slate-800 printable-area bg-white">
          <div className="text-center pb-3 border-b border-dashed border-zinc-300 mb-3">
            <h4 className="font-extrabold text-sm uppercase">{t('app_title', 'R.K.A PHARMACY')}</h4>
            <p className="text-[10px] text-zinc-500">San Antonio, Agoo, La Union</p>
            <p className="text-[9px] text-zinc-400">{t('ims_app_subtag', 'FEFO-Tracked Clinic Pharmacy IMS')}</p>
          </div>

          <div className="space-y-1 text-[10px] border-b border-dashed border-zinc-300 pb-3 mb-3">
            <div className="flex justify-between">
              <span className="text-zinc-400">{t('receipt_num_label', 'Receipt #:')}</span>
              <span className="font-bold">{receipt.receipt_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">{t('date_label', 'Date:')}</span>
              <span>{receipt.date}</span>
            </div>
            {receipt.reference && (
              <div className="flex justify-between">
                <span className="text-zinc-400">{t('ref_patient_label', 'Ref / Patient:')}</span>
                <span className="font-bold">{receipt.reference}</span>
              </div>
            )}
            {currentUser && (
              <div className="flex justify-between">
                <span className="text-zinc-400">{t('dispenser_label', 'Dispenser:')}</span>
                <span>{currentUser.full_name || 'Lourdes Gincen L. Cesista'}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 border-b border-dashed border-zinc-300 pb-3 mb-3">
            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div>
                  <div className="font-bold">{item.brand_name}</div>
                  <div className="text-[9px] text-zinc-400">
                    {item.quantity}× @ ₱{item.unit_price.toFixed(2)} · Lot: {item.batch_number} · Exp: {formatDatePH(item.expiration_date, 'compact')}
                  </div>
                </div>
                <span className="font-bold tabular-nums">₱{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-sm font-black pt-1 mb-2 tabular-nums">
            <span>{t('total_label', 'TOTAL:')}</span>
            <span>₱{receipt.total.toFixed(2)}</span>
          </div>

          {receipt.cashTendered !== undefined && (
            <div className="space-y-1 text-[11px] pb-2 mb-3 border-b border-dashed border-zinc-200 tabular-nums">
              <div className="flex justify-between text-zinc-600">
                <span>{t('cash_tendered_label', 'Cash Tendered:')}</span>
                <span>₱{Number(receipt.cashTendered).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-800">
                <span>{t('change_label', 'Change / Sukli:')}</span>
                <span>₱{Number(receipt.change).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="text-center text-[9px] text-zinc-400 space-y-0.5">
            <p>{t('receipt_thank_you', 'Thank you for choosing R.K.A Pharmacy!')}</p>
            <p>{t('receipt_fefo_notice', 'FEFO-Tracked for Patient Safety & Quality')}</p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50/90 dark:bg-[#1e2430] border-t border-slate-100 dark:border-white/10 flex gap-2 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> {t('print_receipt_btn', 'Print Receipt')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#21262d] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {t('btn_done', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
}
