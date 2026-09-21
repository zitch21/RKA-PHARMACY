import React from 'react';
import { AlertTriangle, LogOut, X, CheckCircle2 } from 'lucide-react';

export default function ExitConfirmModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleExit = () => {
    // Attempt standard browser/window close
    window.close();
    // Fallback if browser security blocks window.close()
    setTimeout(() => {
      alert('You can now safely close this browser window or tab.');
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Exit Confirmation</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Are you sure you want to exit?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Closing the application will end the active counter session. Please ensure all pending transactions or receiving records are completed.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Database integrity is safeguarded (SQLite WAL active).</span>
            </div>
            <p className="text-slate-500 pl-5">
              All saved batches, sales logs, and audit trails remain securely stored locally.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel (Stay in App)
            </button>
            <button
              type="button"
              onClick={handleExit}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-sm flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Yes, Exit Application</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
