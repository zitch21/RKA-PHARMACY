import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { formatDatePH, getLocalDateISO } from '../utils/dateFormatter';
import { useLanguage } from '../context/LanguageContext';

export default function DispensaryCalendarModal({
  isOpen,
  onClose,
  batches = [],
  medicines = [],
  onNavigate,
}) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDateStr, setSelectedDateStr] = useState(getLocalDateISO(today));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Group active batches by expiration date
  const batchesByDate = useMemo(() => {
    const map = {};
    (batches || []).forEach(b => {
      if (b.status === 'active' && b.current_quantity > 0 && b.expiration_date) {
        if (!map[b.expiration_date]) map[b.expiration_date] = [];
        map[b.expiration_date].push(b);
      }
    });
    return map;
  }, [batches]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];

    // Empty cells before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateKey = `${currentYear}-${mStr}-${dStr}`;
      const expiringBatches = batchesByDate[dateKey] || [];
      const hasCritical = expiringBatches.some(b => b.days_to_expiry > 0 && b.days_to_expiry <= 30);
      const hasWarning = expiringBatches.some(b => b.days_to_expiry > 30 && b.days_to_expiry <= 90);
      const hasExpired = expiringBatches.some(b => b.days_to_expiry <= 0);

      days.push({
        dayNumber: d,
        dateKey,
        isToday: dateKey === getLocalDateISO(today),
        batches: expiringBatches,
        hasCritical,
        hasWarning,
        hasExpired,
      });
    }

    return days;
  }, [currentYear, currentMonth, batchesByDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const selectedDayBatches = batchesByDate[selectedDateStr] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-white/10 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{t('cal_modal_title', 'Dispensary Operational Calendar & Expiry Radar')}</span>
                <span className="text-[10px] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-700/40 px-2 py-0.5 rounded-full font-bold uppercase tabular-nums">
                  {t('cal_fefo_live', 'FEFO Live')}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('cal_modal_subtitle', 'Track batch expiration horizons, daily schedules, and dispensary off-take dates')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Grid Section (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                {currentMonth === today.getMonth() && currentYear === today.getFullYear() && (
                  <span className="text-[10px] bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700/50 font-bold px-2 py-0.5 rounded-full">
                    {t('cal_current_month', 'Current Month')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                  title={t('cal_prev_month', 'Previous month')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMonth(today.getMonth());
                    setCurrentYear(today.getFullYear());
                    setSelectedDateStr(today.toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  {t('cal_today_btn', 'Today')}
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                  title={t('cal_next_month', 'Next month')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider py-1">
              <div>{t('cal_day_sun', 'Sun')}</div>
              <div>{t('cal_day_mon', 'Mon')}</div>
              <div>{t('cal_day_tue', 'Tue')}</div>
              <div>{t('cal_day_wed', 'Wed')}</div>
              <div>{t('cal_day_thu', 'Thu')}</div>
              <div>{t('cal_day_fri', 'Fri')}</div>
              <div>{t('cal_day_sat', 'Sat')}</div>
            </div>

            {/* Day Cells Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="h-12 rounded-xl bg-slate-50/50 dark:bg-white/5" />;
                }

                const isSelected = cell.dateKey === selectedDateStr;
                const hasBatches = cell.batches.length > 0;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => setSelectedDateStr(cell.dateKey)}
                    className={`h-13 p-1.5 rounded-xl border transition flex flex-col justify-between items-center cursor-pointer text-xs relative ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-500 shadow-sm font-black'
                        : cell.isToday
                          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-700/60 font-bold'
                          : 'bg-white dark:bg-[#1c2331] hover:bg-slate-50 dark:hover:bg-[#222b3d] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-[11px] leading-none">{cell.dayNumber}</span>

                    {/* Expiry Indicators */}
                    {hasBatches && (
                      <div className="flex items-center gap-1">
                        {cell.hasCritical ? (
                          <span
                            className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"
                            title={`${cell.batches.length} critical batch(es) expiring`}
                          />
                        ) : cell.hasWarning ? (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-500"
                            title={`${cell.batches.length} warning batch(es) expiring`}
                          />
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full bg-teal-400"
                            title={`${cell.batches.length} safe batch(es) expiring`}
                          />
                        )}
                        <span className={`text-[9px] tabular-nums font-bold ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                          {cell.batches.length}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>{t('cal_legend_critical', 'Critical (1–30d)')}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{t('cal_legend_warning', 'Warning (31–90d)')}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <span>{t('cal_legend_safe', 'Safe (>90d)')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Date Details Panel (Right 5 Cols) */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-[#1e2430] rounded-2xl border border-slate-200/90 dark:border-white/10 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                    {t('cal_horizon_label', 'Selected Expiration Horizon')}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {formatDatePH(selectedDateStr, 'medium')}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums shadow-2xs">
                  {selectedDayBatches.length} Lot{selectedDayBatches.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Batches List for Selected Date */}
              <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
                {selectedDayBatches.length > 0 ? (
                  selectedDayBatches.map(b => {
                    const med = (medicines || []).find(m => m.id === b.medicine_id);
                    const isCritical = b.days_to_expiry > 0 && b.days_to_expiry <= 30;
                    return (
                      <div
                        key={b.id}
                        className={`p-3 bg-white dark:bg-[#161b22] rounded-xl border transition shadow-2xs ${
                          isCritical ? 'border-rose-200 dark:border-rose-800/60' : 'border-slate-200 dark:border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                              {med?.brand_name || 'Medicine'}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                              {med?.generic_name} • {med?.dosage_strength}
                            </span>
                            <span className="text-[10px] tabular-nums font-semibold text-slate-600 dark:text-slate-300 mt-1 block">
                              Lot: {b.batch_number} • Stock: <strong className="text-slate-900 dark:text-white">{b.current_quantity}</strong> {med?.unit_of_measure || 'units'}
                            </span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full tabular-nums shrink-0 border ${
                            isCritical
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                          }`}>
                            {b.days_to_expiry}d left
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                    <ShieldCheck className="w-8 h-8 text-teal-500 mx-auto opacity-70" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('cal_no_batches', 'No active batches expiring on this date.')}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{t('cal_shelf_clear', 'Inventory shelf life for this day is clear.')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('inventory', { filter: 'critical' });
                }}
                className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t('cal_view_all_critical', 'View All Critical Expiry in Inventory')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
