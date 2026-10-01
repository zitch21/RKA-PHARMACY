import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer, X, Tag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function BarcodeModal({ medicine, isOpen = true, onClose }) {
  const { t } = useLanguage();
  const barcodeCanvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && medicine && barcodeCanvasRef.current) {
      try {
        JsBarcode(barcodeCanvasRef.current, medicine.barcode, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 2,
          height: 55,
          displayValue: true,
          fontSize: 13,
          font: 'sans-serif'
        });
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
  }, [isOpen, medicine]);

  if (!isOpen || !medicine) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#181d26] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                {t('barcode_modal_title', 'Print Clinical Barcode Label')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('barcode_modal_subtitle', 'Standard Code 128 sticker for shelf bins & packages')}
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

        {/* Printable Barcode Label Card */}
        <div className="p-6 text-center">
          <div className="printable-area border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-5 bg-white text-slate-800 max-w-xs mx-auto shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-1 tabular-nums">
              {t('barcode_modal_clinic_header', 'R.K.A PHARMACY • CLINIC INVENTORY')}
            </div>
            <div className="font-extrabold text-base text-slate-900 leading-tight">
              {medicine.brand_name}
            </div>
            <div className="text-xs text-slate-600 font-medium mt-0.5">
              {medicine.generic_name} ({medicine.dosage_strength})
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
              {t('barcode_modal_form', 'Form')}: {medicine.dosage_form} | {t('barcode_modal_uom', 'UOM')}: {medicine.unit_of_measure}
            </div>

            <div className="my-3 flex justify-center">
              <canvas ref={barcodeCanvasRef} className="max-w-full h-auto" />
            </div>

            <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-200 pt-2 tabular-nums">
              <span>{t('barcode_modal_code', 'Code')}: {medicine.code || 'N/A'}</span>
              <span>San Antonio, Agoo</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-400 mt-4 no-print leading-relaxed">
            {t('barcode_modal_instructions', 'Attach this standard Code 128 barcode sticker onto the shelf bin or medicine carton for rapid F2 counter scanning.')}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50/60 dark:bg-[#1e2430]/60 border-t border-slate-100 dark:border-white/10 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            {t('btn_close', 'Close')}
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-[0.98] rounded-xl shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('barcode_modal_print_btn', 'Print Label')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
