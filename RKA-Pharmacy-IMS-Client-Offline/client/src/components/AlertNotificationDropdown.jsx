import React from 'react';
import { AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AlertNotificationDropdown({ alerts, isOpen, onClose, onNavigate, onAcknowledgeAlert }) {
  const { t } = useLanguage();
  if (!isOpen || !alerts) return null;

  const { summary, expired, critical, warning, low_stock, out_of_stock } = alerts;

  return (
    <div className="absolute right-0 top-full mt-2.5 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#161b22] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-white/10 overflow-hidden animate-in fade-in">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <span>{t('modal_alert_title') || 'Active Clinical Alerts'}</span>
        </div>
        <span className="text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/40 font-bold tabular-nums px-2 py-0.5 rounded-full">
          {summary.total_alerts} {t('total_suffix', 'Total')}
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100 dark:divide-white/5 text-xs">
        {/* Expired Items */}
        {expired && expired.length > 0 && (
          <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20">
            <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider text-[10px] mb-2 tabular-nums">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>{t('tier_expired') || 'Expired Batches'} ({expired.length})</span>
            </div>
            <div className="space-y-1.5">
              {expired.map(b => (
                <div key={b.id} className="flex justify-between items-center bg-white dark:bg-[#1c2331] p-2 rounded-lg border border-rose-200 dark:border-rose-900/40">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-white">{b.brand_name}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-slate-400 tabular-nums">{t('col_med_batch', 'Lot')} {b.batch_number} • {b.current_quantity} {t('units', 'units')}</div>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 rounded tabular-nums">
                    {t('badge_expired', 'Expired')} {b.expiration_date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Expiry (1 - 30 days) */}
        {critical && critical.length > 0 && (
          <div className="p-3 bg-rose-50/30 dark:bg-rose-950/20">
            <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider text-[10px] mb-2 tabular-nums">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{t('tier_critical') || 'Critical Expiry (1–30d)'} ({critical.length})</span>
            </div>
            <div className="space-y-1.5">
              {critical.map(b => (
                <div key={b.id} className="flex justify-between items-center bg-white dark:bg-[#1c2331] p-2 rounded-lg border border-rose-200 dark:border-rose-900/40">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-white">{b.brand_name}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-slate-400 tabular-nums">{t('col_med_batch', 'Lot')} {b.batch_number} • {b.current_quantity} {t('units', 'units')}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 rounded tabular-nums">
                      {b.days_to_expiry}{t('days_left_short', 'd left')}
                    </span>
                    {b.is_acknowledged ? (
                      <span className="text-[9px] font-bold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 px-1.5 py-0.5 rounded tabular-nums">
                        ✓ {t('btn_ack') || 'Ack'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcknowledgeAlert?.(b.alert_key, 'CRITICAL_EXPIRY', b.id);
                        }}
                        className="text-[9px] font-bold text-rose-700 dark:text-rose-300 hover:text-white bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-600 dark:hover:bg-rose-700 px-1.5 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                        title={t('title_ack_alert', 'Acknowledge alert and log to audit trail')}
                      >
                        <Check className="w-2.5 h-2.5" />
                        <span>{t('btn_ack') || 'Ack'}</span>
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
          <div className="p-3 bg-amber-50/30 dark:bg-amber-950/20">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[10px] mb-2 tabular-nums">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{t('tier_warning') || 'Warning Expiry (31–90d)'} ({warning.length})</span>
            </div>
            <div className="space-y-1.5">
              {warning.slice(0, 3).map(b => (
                <div key={b.id} className="flex justify-between items-center bg-white dark:bg-[#1c2331] p-2 rounded-lg border border-amber-200 dark:border-amber-900/40">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-white">{b.brand_name}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-slate-400 tabular-nums">{t('col_med_batch', 'Lot')} {b.batch_number} • {b.current_quantity} {t('units', 'units')}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded tabular-nums">
                      {b.days_to_expiry}{t('days_left_short', 'd left')}
                    </span>
                    {b.is_acknowledged ? (
                      <span className="text-[9px] font-bold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 px-1.5 py-0.5 rounded tabular-nums">
                        ✓ {t('btn_ack') || 'Ack'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcknowledgeAlert?.(b.alert_key, 'WARNING_EXPIRY', b.id);
                        }}
                        className="text-[9px] font-bold text-amber-800 dark:text-amber-300 hover:text-white bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-600 dark:hover:bg-amber-700 px-1.5 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                        title={t('title_ack_alert', 'Acknowledge alert and log to audit trail')}
                      >
                        <Check className="w-2.5 h-2.5" />
                        <span>{t('btn_ack') || 'Ack'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {warning.length > 3 && (
                <div className="text-[10px] text-amber-800 dark:text-amber-300 italic text-center tabular-nums">
                  + {warning.length - 3} {t('more_warning_batches', 'more warning batches...')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Out of Stock (0 units) */}
        {out_of_stock && out_of_stock.length > 0 && (
          <div className="p-3 bg-rose-100/50 dark:bg-rose-950/30">
            <div className="flex items-center gap-1.5 font-bold text-rose-950 dark:text-rose-300 uppercase tracking-wider text-[10px] mb-2 tabular-nums">
              <span className="w-2 h-2 rounded-full bg-rose-700 dark:bg-rose-500" />
              <span>{t('badge_out_of_stock') || 'Out of Stock'} ({out_of_stock.length})</span>
            </div>
            <div className="space-y-1.5">
              {out_of_stock.map(m => (
                <div key={m.id} className="flex justify-between items-center bg-white dark:bg-[#1c2331] p-2 rounded-lg border border-rose-300 dark:border-rose-900/50">
                  <div>
                    <div className="font-bold text-rose-950 dark:text-white">{m.brand_name} ({m.dosage_strength})</div>
                    <div className="text-[10px] text-zinc-500 dark:text-slate-400 tabular-nums">{t('edit_med_threshold', 'Threshold')}: {m.reorder_threshold} {m.unit_of_measure}</div>
                  </div>
                  <span className="text-[10px] font-extrabold text-white bg-rose-700 dark:bg-rose-600 px-2 py-0.5 rounded uppercase tabular-nums">
                    0 {t('fefo_col_stock', 'Stock')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Items */}
        {low_stock && low_stock.length > 0 && (
          <div className="p-3 bg-amber-50/20 dark:bg-amber-950/20">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider text-[10px] mb-2 tabular-nums">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{t('badge_low_stock') || 'Low Stock Alerts'} ({low_stock.length})</span>
            </div>
            <div className="space-y-1.5">
              {low_stock.map(m => (
                <div key={m.id} className="flex justify-between items-center bg-white dark:bg-[#1c2331] p-2 rounded-lg border border-amber-200 dark:border-amber-900/40">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-white">{m.brand_name} ({m.dosage_strength})</div>
                    <div className="text-[10px] text-zinc-400 dark:text-slate-400 tabular-nums">{t('edit_med_threshold', 'Threshold')}: {m.reorder_threshold} {m.unit_of_measure}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded tabular-nums">
                      {t('fefo_col_stock', 'Stock')}: {m.total_stock}
                    </span>
                    {m.is_acknowledged ? (
                      <span className="text-[9px] font-bold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 px-1.5 py-0.5 rounded tabular-nums">
                        ✓ {t('btn_ack') || 'Ack'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcknowledgeAlert?.(m.alert_key, 'LOW_STOCK', m.id);
                        }}
                        className="text-[9px] font-bold text-amber-900 dark:text-amber-300 hover:text-white bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-600 dark:hover:bg-amber-700 px-1.5 py-0.5 rounded transition flex items-center gap-0.5 cursor-pointer"
                        title={t('title_ack_alert', 'Acknowledge alert and log to audit trail')}
                      >
                        <Check className="w-2.5 h-2.5" />
                        <span>{t('btn_ack') || 'Ack'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.total_alerts === 0 && (
          <div className="p-6 text-center text-zinc-400">
            <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2 font-bold">
              ✓
            </div>
            {t('all_stocks_safe_msg', 'All medicine stocks are within safe thresholds and expiry limits.')}
          </div>
        )}
      </div>

      <div className="p-2.5 bg-slate-50/90 dark:bg-[#1e2430] border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
        <button
          onClick={() => {
            onNavigate('fefo-plus');
            onClose();
          }}
          className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-200 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/30 transition cursor-pointer"
        >
          <span>{t('nav_fefo_risk') || 'FEFO+ Risk Analysis'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={onClose}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
        >
          {t('btn_close_dialog') || 'Close'}
        </button>
      </div>
    </div>
  );
}
