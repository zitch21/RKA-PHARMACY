import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer, X, Tag } from 'lucide-react';

export default function BarcodeModal({ medicine, isOpen, onClose }) {
  const barcodeCanvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && medicine && barcodeCanvasRef.current) {
      try {
        JsBarcode(barcodeCanvasRef.current, medicine.barcode, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          font: 'monospace'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 no-print">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Tag className="w-5 h-5 text-emerald-600" />
            <span>Print Barcode Label</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Barcode Label Card */}
        <div className="p-6 text-center">
          <div className="printable-area border-2 border-dashed border-slate-300 rounded-lg p-5 bg-white text-slate-800 max-w-xs mx-auto shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
              R.K.A PHARMACY • CLINIC INVENTORY
            </div>
            <div className="font-bold text-lg text-slate-900 leading-tight">
              {medicine.brand_name}
            </div>
            <div className="text-sm text-slate-600 font-medium">
              {medicine.generic_name} ({medicine.dosage_strength})
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Form: {medicine.dosage_form} | UOM: {medicine.unit_of_measure}
            </div>

            <div className="my-3 flex justify-center">
              <canvas ref={barcodeCanvasRef} className="max-w-full h-auto" />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
              <span>Code: {medicine.code}</span>
              <span>San Antonio, Agoo</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4 no-print">
            Use this label for repacked items or medicines without a manufacturer barcode. Stick onto the shelf or container bin for fast barcode scanning.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/70 rounded-lg transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
