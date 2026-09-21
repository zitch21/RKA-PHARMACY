import React from 'react';
import { AlertCircle, AlertTriangle, Clock, X, ArrowRight, Check } from 'lucide-react';

export default function AlertNotificationDropdown({ alerts, isOpen, onClose, onNavigate, onAcknowledgeAlert }) {
  if (!isOpen || !alerts) return null;

  const { summary, expired, critical, warning, low_stock, out_of_stock } = alerts;

  return (
    <div className="absolute right-0 top-12 z-50 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Active Stock & Expiry Alerts</span>
        </div>
        <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
          {summary.total_alerts} Total
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
        {/* Expired Items */}
        {expired && expired.length > 0 && (
          <div className="p-3 bg-red-50/50">
            <div className="flex items-center gap-1.5 font-bold text-red-800 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>Expired Batches ({expired.length}) - Dispensing Blocked</span>
            </div>
            <div className="space-y-1.5">
              {expired.map(b => (
                <div key={b.id} className="flex justify-between items-center bg-white p-2 rounded border border-red-200">
                  <div>
                    <div className="font-semibold text-slate-800">{b.brand_name}</div>
                    <div className="text-[10px] text-slate-500">Batch {b.batch_number} • {b.current_quantity} units</div>
                  </div>
                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                    Expired {b.expiration_date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Expiry (1 - 30 days) */}
        {critical && critical.length > 0 && (
          <div className="p-3 bg-rose-50/40">
            <div className="flex items-center gap-1.5 font-bold text-rose-800 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Critical Expiry 1-30 Days ({critical.length})</span>
            </div>
            <div className="space-y-1.5">
              {critical.map(b => (
                <div key={b.id} className="flex justify-between items-center bg-white p-2 rounded border border-rose-200">
                  <div>
                    <div className="font-semibold text-slate-800">{b.brand_name}</div>
                    <div className="text-[10px] text-slate-500">Batch {b.batch_number} • {b.current_quantity} units</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      {b.days_to_expiry}d left
                    </span>
                    {b.is_acknowledged ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        ✓ Ack
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcknowledgeAlert && onAcknowledgeAlert(b.alert_key, 'CRITICAL_EXPIRY', b.id);
                        }}
                        className="text-[9px] font-bold text-rose-700 hover:text-white bg-rose-100 hover:bg-rose-600 px-1.5 py-0.5 rounded transition flex items-center gap-0.5"
                        title="Acknowledge alert and log to audit trail"
                      >
                        <Check className="w-2.5 h-2.5" />
                        <span>Ack</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Expiry (31 - 90 days) */}
        {warning && warning.length > 0 && (
          <div className="p-3 bg-amber-50/30">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Warning Expiry 31-90 Days ({warning.length})</span>
            </div>
            <div className="space-y-1.5">
              {warning.slice(0, 3).map(b => (
                <div key={b.id} className="flex justify-between items-center bg-white p-2 rounded border border-amber-200">
                  <div>
                    <div className="font-semibold text-slate-800">{b.brand_name}</div>
                    <div className="text-[10px] text-slate-500">Batch {b.batch_number} • {b.current_quantity} units</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      {b.days_to_expiry}d left
                    </span>
                    {b.is_acknowledged ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        ✓ Ack
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcknowledgeAlert && onAcknowledgeAlert(b.alert_key, 'WARNING_EXPIRY', b.id);
                        }}
                        className="text-[9px] font-bold text-amber-800 hover:text-white bg-amber-100 hover:bg-amber-600 px-1.5 py-0.5 rounded transition flex items-center gap-0.5"
                        title="Acknowledge alert and log to audit trail"
                      >
                        <Check className="w-2.5 h-2.5" />
                        <span>Ack</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {warning.length > 3 && (
                <div className="text-[10px] text-amber-700 italic text-center">
                  + {warning.length - 3} more warning batches...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Out of Stock (0 units) */}
        {out_of_stock && out_of_stock.length > 0 && (
          <div className="p-3 bg-red-100/60">
            <div className="flex items-center gap-1.5 font-bold text-red-900 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-red-700"></span>
              <span>Completely Out of Stock ({out_of_stock.length})</span>
            </div>
            <div className="space-y-1.5">
              {out_of_stock.map(m => (
                <div key={m.id} className="flex justify-between items-center bg-white p-2 rounded border border-red-300">
                  <div>
                    <div className="font-bold text-red-950">{m.brand_name} ({m.dosage_strength})</div>
                    <div className="text-[10px] text-red-700">Threshold: {m.reorder_threshold} {m.unit_of_measure}s</div>
                  </div>
                  <span className="text-[10px] font-extrabold text-white bg-red-700 px-2 py-0.5 rounded uppercase">
                    0 Stock
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Items */}
        {low_stock && low_stock.length > 0 && (
          <div className="p-3 bg-blue-50/30">
            <div className="flex items-center gap-1.5 font-bold text-blue-800 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Low Stock Alerts ({low_stock.length})</span>
            </div>
            <div className="space-y-1.5">
              {low_stock.map(m => (
                <div key={m.id} className="flex justify-between items-center bg-white p-2 rounded border border-blue-200">
                  <div>
                    <div className="font-semibold text-slate-800">{m.brand_name} ({m.dosage_strength})</div>
                    <div className="text-[10px] text-slate-500">Threshold: {m.reorder_threshold} {m.unit_of_measure}s</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      Stock: {m.total_stock}
                    </span>
                    {m.is_acknowledged ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        ✓ Ack
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcknowledgeAlert && onAcknowledgeAlert(m.alert_key, 'LOW_STOCK', m.id);
                        }}
                        className="text-[9px] font-bold text-blue-800 hover:text-white bg-blue-100 hover:bg-blue-600 px-1.5 py-0.5 rounded transition flex items-center gap-0.5"
                        title="Acknowledge alert and log to audit trail"
                      >
                        <Check className="w-2.5 h-2.5" />
                        <span>Ack</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.total_alerts === 0 && (
          <div className="p-6 text-center text-slate-400">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              ✓
            </div>
            All medicine stocks are within safe thresholds and expiry limits.
          </div>
        )}
      </div>

      <div className="p-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <button
          onClick={() => {
            onNavigate('fefo-plus');
            onClose();
          }}
          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2 py-1"
        >
          <span>View FEFO+ Risk Analysis</span>
          <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={onClose}
          className="text-[11px] text-slate-500 hover:text-slate-700 px-2 py-1"
        >
          Close
        </button>
      </div>
    </div>
  );
}
