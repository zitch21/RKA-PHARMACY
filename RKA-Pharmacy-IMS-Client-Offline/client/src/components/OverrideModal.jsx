import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

export default function OverrideModal({
  isOpen,
  onClose,
  fefoBatch,
  selectedBatch,
  medicineName,
  onConfirmOverride
}) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen || !fefoBatch || !selectedBatch) return null;

  const quickReasons = [
    'Customer specifically requested newer batch/packaging',
    'Exterior box or packaging damaged on earliest expiring batch',
    'Prescribing physician requested specific batch/lot code',
    'Earliest batch quarantined for quality check'
  ];

  const handleConfirm = () => {
    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
      setError('A valid reason is required to override the FEFO release policy.');
      return;
    }
    setError(null);
    onConfirmOverride(finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-amber-300">
        <div className="flex items-center justify-between px-6 py-4 bg-amber-500 text-white">
          <div className="flex items-center gap-2 font-bold text-lg">
            <AlertTriangle className="w-6 h-6" />
            <span>FEFO Policy Override Confirmation</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-amber-600 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Important Audit Notice:</span> According to R.K.A Pharmacy standard operating procedures, all dispensing follows First-Expiry-First-Out (FEFO). Overriding will be permanently logged in the central transaction audit trail.
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs uppercase text-slate-500 font-semibold block mb-1">
                Recommended Batch (FEFO)
              </span>
              <div className="font-bold text-slate-900">{fefoBatch.batch_number}</div>
              <div className="text-xs text-emerald-700 font-semibold mt-1">
                Exp: {fefoBatch.expiration_date} ({fefoBatch.days_to_expiry} days left)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Avail: {fefoBatch.current_quantity}</div>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-300">
              <span className="text-xs uppercase text-amber-700 font-semibold block mb-1">
                Selected Non-FEFO Batch
              </span>
              <div className="font-bold text-slate-900">{selectedBatch.batch_number}</div>
              <div className="text-xs text-amber-800 font-semibold mt-1">
                Exp: {selectedBatch.expiration_date} ({selectedBatch.days_to_expiry} days left)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Avail: {selectedBatch.current_quantity}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-2">
              Select or Enter Override Reason *
            </label>
            <div className="space-y-1.5 mb-3">
              {quickReasons.map((qr, idx) => (
                <label
                  key={idx}
                  className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                    reason === qr ? 'border-amber-500 bg-amber-50/70 font-medium' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="quickReason"
                    checked={reason === qr}
                    onChange={() => {
                      setReason(qr);
                      setError(null);
                    }}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <span>{qr}</span>
                </label>
              ))}
              <label
                className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                  reason === 'Other' ? 'border-amber-500 bg-amber-50/70 font-medium' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="quickReason"
                  checked={reason === 'Other'}
                  onChange={() => {
                    setReason('Other');
                    setError(null);
                  }}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <span>Other Specific Reason</span>
              </label>
            </div>

            {reason === 'Other' && (
              <textarea
                rows="2"
                placeholder="Enter detailed clinical or operational justification..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            )}

            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition"
            >
              <ShieldAlert className="w-4 h-4" />
              Confirm Override & Release
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
