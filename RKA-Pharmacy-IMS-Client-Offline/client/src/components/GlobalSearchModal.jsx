import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  ArrowRight,
  CornerDownLeft,
  Pill,
  Package,
  Barcode,
  ArrowUpFromLine,
  ArrowDownToLine,
  FileText,
  LayoutDashboard,
  TrendingUp,
  History,
  FlaskConical,
  Settings,
  HelpCircle,
  Plus,
  HardDrive,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function GlobalSearchModal({
  isOpen,
  onClose,
  medicines = [],
  batches = [],
  onNavigate,
  onOpenHelp,
  onOpenAddMedicine,
  onOpenExit,
  onQuickBarcodeScan,
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Focus input and reset query when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Command & Navigation Definitions
  const navigationCommands = useMemo(() => [
    {
      id: 'cmd-dispense',
      type: 'command',
      title: t('nav_dispense') || 'Dispense / POS',
      subtitle: 'Counter dispensary, prescription release & FEFO queue',
      icon: ArrowUpFromLine,
      badge: 'F2 Hotkey',
      category: 'Navigation',
      keywords: ['dispense', 'stock out', 'pos', 'sell', 'sale', 'counter', 'release', 'benta', 'checkout', 'receipt', 'magbenta'],
      action: () => {
        onNavigate('stock-out');
        onClose();
      }
    },
    {
      id: 'cmd-stockin',
      type: 'command',
      title: t('nav_stock_in') || 'Stock-In Intake',
      subtitle: 'Receive delivery, register batches with DR & expiry dates',
      icon: ArrowDownToLine,
      category: 'Navigation',
      keywords: ['stock in', 'stockin', 'intake', 'receive', 'delivery', 'pasok', 'dr', 'invoice', 'dumarating'],
      action: () => {
        onNavigate('stock-in');
        onClose();
      }
    },
    {
      id: 'cmd-po',
      type: 'command',
      title: t('nav_purchase_orders') || 'Purchase Orders (PO)',
      subtitle: 'Manage replenishment orders, supplier slips & intake',
      icon: FileText,
      category: 'Navigation',
      keywords: ['purchase orders', 'purchase order', 'po', 'order', 'procurement', 'replenishment', 'supplier', 'draft', 'kautusan'],
      action: () => {
        onNavigate('purchase-orders');
        onClose();
      }
    },
    {
      id: 'cmd-inventory',
      type: 'command',
      title: t('nav_inventory') || 'Inventory & Catalog',
      subtitle: 'Medicine records, batch details, barcodes & shelf tags',
      icon: Package,
      category: 'Navigation',
      keywords: ['inventory', 'catalog', 'medicines', 'drugs', 'items', 'list', 'imbentaryo', 'stock', 'gamot'],
      action: () => {
        onNavigate('inventory');
        onClose();
      }
    },
    {
      id: 'cmd-dashboard',
      type: 'command',
      title: t('nav_dashboard') || 'Dashboard',
      subtitle: 'Operational overview, stock alerts & expiry countdowns',
      icon: LayoutDashboard,
      category: 'Navigation',
      keywords: ['dashboard', 'home', 'overview', 'alerts', 'kpi', 'talaarawan'],
      action: () => {
        onNavigate('dashboard');
        onClose();
      }
    },
    {
      id: 'cmd-fefo',
      type: 'command',
      title: t('nav_fefo_risk') || 'FEFO+ Risk Analysis',
      subtitle: 'Daily demand velocity, risk margins & waste elimination',
      icon: TrendingUp,
      category: 'Navigation',
      keywords: ['fefo', 'risk', 'forecast', 'analytics', 'intelligence', 'waste', 'margin', 'peligro', 'paso'],
      action: () => {
        onNavigate('fefo-plus');
        onClose();
      }
    },
    {
      id: 'cmd-audit',
      type: 'command',
      title: t('nav_audit_trail') || 'Audit Trail & Ledger',
      subtitle: 'Tamper-evident transaction logs, overrides & disposals',
      icon: History,
      category: 'Navigation',
      keywords: ['audit', 'trail', 'ledger', 'history', 'logs', 'transactions', 'csv', 'talaan'],
      action: () => {
        onNavigate('audit');
        onClose();
      }
    },
    {
      id: 'cmd-simulation',
      type: 'command',
      title: t('nav_simulation') || 'Policy Simulation Engine',
      subtitle: 'Comparative empirical matrix: FIFO vs FEFO vs FEFO+',
      icon: FlaskConical,
      category: 'Navigation',
      keywords: ['simulation', 'policy', 'fifo', 'benchmark', 'matrix', 'simulasyon', 'pagtulad'],
      action: () => {
        onNavigate('simulation');
        onClose();
      }
    },
    {
      id: 'cmd-settings',
      type: 'command',
      title: t('nav_settings') || 'Settings & Configuration',
      subtitle: 'Pharmacy profile, expiry countdown thresholds & security',
      icon: Settings,
      category: 'Navigation',
      keywords: ['settings', 'configuration', 'thresholds', 'profile', 'admin', 'mga setting'],
      action: () => {
        onNavigate('settings');
        onClose();
      }
    },
    {
      id: 'cmd-help',
      type: 'command',
      title: t('btn_how_to_use') || 'How to Use Guide',
      subtitle: 'Interactive Basic Counter & Advance System manual',
      icon: HelpCircle,
      badge: 'F1 Hotkey',
      category: 'Actions',
      keywords: ['help', 'guide', 'manual', 'how to use', 'turo', 'gabay', 'f1', 'instructions'],
      action: () => {
        if (onOpenHelp) onOpenHelp();
        onClose();
      }
    },
    {
      id: 'cmd-add-med',
      type: 'command',
      title: t('btn_add_medicine') || 'Add Medicine Profile',
      subtitle: 'Register new drug, generic name, barcode & category',
      icon: Plus,
      category: 'Actions',
      keywords: ['add medicine', 'new medicine', 'create medicine', 'register medicine', 'magdagdag'],
      action: () => {
        if (onOpenAddMedicine) onOpenAddMedicine();
        onClose();
      }
    },
    {
      id: 'cmd-barcode-scan',
      type: 'command',
      title: 'Barcode Scanner (F2)',
      subtitle: 'Quick scanner ready for USB laser/CCD barcode reader',
      icon: Barcode,
      badge: 'F2',
      category: 'Actions',
      keywords: ['barcode', 'scan', 'scanner', 'f2', 'usb'],
      action: () => {
        if (onQuickBarcodeScan) onQuickBarcodeScan();
        onClose();
      }
    },
    {
      id: 'cmd-backup-exit',
      type: 'command',
      title: 'Backup & Exit Station',
      subtitle: 'Safely write SQLite WAL checkpoint to USB and close workstation',
      icon: HardDrive,
      category: 'Actions',
      keywords: ['backup', 'exit', 'close', 'usb', 'flash drive', 'umalis'],
      action: () => {
        if (onOpenExit) onOpenExit();
        onClose();
      }
    }
  ], [t, onNavigate, onClose, onOpenHelp, onOpenAddMedicine, onQuickBarcodeScan, onOpenExit]);

  // Compute filtered results
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    
    // When empty query: show default high-frequency commands
    if (!q) {
      return {
        commands: navigationCommands.slice(0, 6),
        medicines: [],
        batches: []
      };
    }

    // 1. Filter commands & tabs
    const matchedCommands = navigationCommands.filter(cmd => {
      const matchTitle = cmd.title.toLowerCase().includes(q);
      const matchSub = cmd.subtitle.toLowerCase().includes(q);
      const matchKeywords = cmd.keywords.some(k => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()));
      return matchTitle || matchSub || matchKeywords;
    });

    // 2. Filter medicines
    const matchedMeds = medicines.filter(m => {
      const name = (m.brand_name || m.medicine_name || '').toLowerCase();
      const generic = (m.generic_name || '').toLowerCase();
      const code = (m.code || '').toLowerCase();
      const barcode = (m.barcode || '').toLowerCase();
      const cat = (m.category || '').toLowerCase();
      return name.includes(q) || generic.includes(q) || code.includes(q) || barcode.includes(q) || cat.includes(q);
    }).slice(0, 8);

    // 3. Filter batches
    const matchedBatches = batches.filter(b => {
      const bNum = (b.batch_number || '').toLowerCase();
      const invNum = (b.supplier_dr_number || b.invoice_number || '').toLowerCase();
      const medName = (b.brand_name || b.medicine_name || '').toLowerCase();
      const genericName = (b.generic_name || '').toLowerCase();
      return bNum.includes(q) || invNum.includes(q) || medName.includes(q) || genericName.includes(q);
    }).slice(0, 6);

    return {
      commands: matchedCommands,
      medicines: matchedMeds,
      batches: matchedBatches
    };
  }, [query, navigationCommands, medicines, batches]);

  // Flattened items list for arrow key navigation
  const flatItems = useMemo(() => {
    const list = [];
    filteredResults.commands.forEach(cmd => list.push({ type: 'command', data: cmd }));
    filteredResults.medicines.forEach(med => list.push({ type: 'medicine', data: med }));
    filteredResults.batches.forEach(batch => list.push({ type: 'batch', data: batch }));
    return list;
  }, [filteredResults]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(Math.max(0, flatItems.length - 1));
    }
  }, [flatItems, selectedIndex]);

  // Execute item action
  const handleExecuteItem = (item) => {
    if (!item) return;

    if (item.type === 'command') {
      item.data.action();
    } else if (item.type === 'medicine') {
      // Navigate to Inventory with this medicine pre-searched
      onNavigate('inventory', { search: item.data.medicine_name });
      onClose();
    } else if (item.type === 'batch') {
      // Navigate to Inventory with this medicine/batch pre-searched
      onNavigate('inventory', { search: item.data.batch_number });
      onClose();
    }
  };

  // Keyboard controls
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (flatItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (flatItems.length || 1)) % (flatItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems.length > 0 && flatItems[selectedIndex]) {
        handleExecuteItem(flatItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  let currentIndexTracker = 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200/90 dark:border-white/10 flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="p-3.5 sm:p-4 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('search_global_placeholder', "Search medicines, batches, barcodes, or jump to tabs (e.g. 'dispense', 'po', 'paracetamol')...")}
            className="flex-1 bg-transparent text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-medium"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 transition cursor-pointer"
              title={t('title_clear_search', 'Clear search')}
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline text-[10px] tabular-nums bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg leading-none shadow-2xs font-semibold">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Body */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-zinc-100 flex-1">
          {flatItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">{t('search_no_results', 'No matching results found')}</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                No medicines, batch codes, or system actions matched "<span className="tabular-nums text-slate-700">{query}</span>". Try searching generic name, lot number, or tab name.
              </p>
            </div>
          ) : (
            <>
              {/* SECTION 1: Commands & Navigation Tabs */}
              {filteredResults.commands.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 tabular-nums flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-teal-500" />
                    <span>{t('search_nav_sys_commands', 'Navigation & System Commands')}</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {filteredResults.commands.map((cmd) => {
                      const itemIdx = currentIndexTracker++;
                      const isSelected = selectedIndex === itemIdx;
                      const Icon = cmd.icon;
                      return (
                        <div
                          key={cmd.id}
                          onClick={() => handleExecuteItem({ type: 'command', data: cmd })}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                            isSelected
                              ? 'bg-teal-50/80 dark:bg-teal-950/50 text-teal-950 dark:text-teal-200 border border-teal-200/80 dark:border-teal-700/50 shadow-xs'
                              : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-teal-600 text-white shadow-xs' : 'bg-zinc-100 dark:bg-[#1e2430] text-zinc-600 dark:text-slate-300'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs flex items-center gap-2">
                                <span>{cmd.title}</span>
                                {cmd.badge && (
                                  <span className="text-[9px] tabular-nums px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-slate-300 font-semibold">
                                    {cmd.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400 dark:text-slate-400 truncate mt-0.5">{cmd.subtitle}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-zinc-400 dark:text-slate-400">
                            {isSelected && (
                              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-0.5 tabular-nums mr-1">
                                Jump <CornerDownLeft className="w-3 h-3" />
                              </span>
                            )}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: Medicines & Products */}
              {filteredResults.medicines.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 tabular-nums flex items-center gap-1.5">
                    <Pill className="w-3 h-3 text-indigo-500" />
                    <span>{t('medicines_catalog_header', 'Medicines Catalog')} ({filteredResults.medicines.length})</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredResults.medicines.map((med) => {
                      const itemIdx = currentIndexTracker++;
                      const isSelected = selectedIndex === itemIdx;
                      const isLowStock = (med.total_stock || 0) <= (med.reorder_threshold || 10);
                      const isOutOfStock = (med.total_stock || 0) === 0;

                      return (
                        <div
                          key={`med-${med.id}`}
                          onClick={() => handleExecuteItem({ type: 'medicine', data: med })}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-700/50 shadow-xs'
                              : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50'
                            }`}>
                              <Pill className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs flex items-center gap-2">
                                <span className="truncate">{med.brand_name || med.medicine_name}</span>
                                {med.generic_name && (
                                  <span className="text-[10px] font-normal text-zinc-400 dark:text-slate-400 truncate">
                                    ({med.generic_name})
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{med.dosage_form || 'Unit'} • {med.category || 'General'}</span>
                                {med.barcode && (
                                  <span className="tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-slate-300 px-1 py-px rounded text-[9px] flex items-center gap-1">
                                    <Barcode className="w-2.5 h-2.5" />
                                    {med.barcode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`tabular-nums text-[11px] font-bold px-2 py-0.5 rounded ${
                              isOutOfStock
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                : isLowStock
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                                : 'bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                            }`}>
                              {med.total_stock || 0} {t('in_stock_pill', 'in stock')}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate('stock-out', { medicineId: med.id });
                                onClose();
                              }}
                              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition flex items-center gap-1 cursor-pointer"
                              title={t('search_tip_sell_med', 'Dispense this medicine now')}
                            >
                              <span>{t('search_btn_sell', 'Sell')}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 3: Batches & Lots */}
              {filteredResults.batches.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-400 tabular-nums flex items-center gap-1.5">
                    <Package className="w-3 h-3 text-amber-500" />
                    <span>{t('search_batches_expiry', 'Batches & Expiry Dates')} ({filteredResults.batches.length})</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredResults.batches.map((batch) => {
                      const itemIdx = currentIndexTracker++;
                      const isSelected = selectedIndex === itemIdx;
                      const daysLeft = batch.days_to_expiry;
                      const isExpired = daysLeft <= 0;
                      const isCritical = daysLeft > 0 && daysLeft <= 30;

                      return (
                        <div
                          key={`batch-${batch.id}`}
                          onClick={() => handleExecuteItem({ type: 'batch', data: batch })}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-amber-50/80 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 border border-amber-200/80 dark:border-amber-700/50 shadow-xs'
                              : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isExpired
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300'
                                : isCritical
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                                : 'bg-zinc-100 dark:bg-[#1e2430] text-zinc-600 dark:text-slate-300'
                            }`}>
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs flex items-center gap-2">
                                <span className="tabular-nums text-teal-800 dark:text-teal-400 font-extrabold">{batch.batch_number}</span>
                                <span className="text-zinc-600 dark:text-slate-300 font-semibold truncate">
                                  {batch.brand_name || batch.medicine_name}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-400 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>Exp: {batch.expiration_date}</span>
                                {(batch.supplier_dr_number || batch.invoice_number) && (
                                  <span>• DR #{batch.supplier_dr_number || batch.invoice_number}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-bold tabular-nums px-2 py-0.5 rounded ${
                              isExpired
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                                : isCritical
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                            }`}>
                              {isExpired ? t('badge_expired', 'EXPIRED') : `${daysLeft}${t('days_left_short', 'd left')}`} • {batch.current_quantity} {t('stockin_col_units', 'units')}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 dark:text-slate-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Hotkey Guide */}
        <div className="p-3 bg-slate-50/90 dark:bg-[#1e2430] border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="tabular-nums bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/10 px-1.5 py-0.5 rounded text-[9px] shadow-2xs font-semibold">↑</kbd>
              <kbd className="tabular-nums bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/10 px-1.5 py-0.5 rounded text-[9px] shadow-2xs font-semibold">↓</kbd>
              <span>{t('search_to_navigate', 'to navigate')}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="tabular-nums bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/10 px-1.5 py-0.5 rounded text-[9px] shadow-2xs font-semibold">↵</kbd>
              <span>{t('search_to_select', 'to select')}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="tabular-nums bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/10 px-1.5 py-0.5 rounded text-[9px] shadow-2xs font-semibold">ESC</kbd>
              <span>{t('search_to_close', 'to close')}</span>
            </span>
          </div>
          <span className="tabular-nums text-[10px] text-slate-400 dark:text-slate-500">
            {t('search_footer_omni', 'R.K.A OmniSearch • Medicines & System Routing')}
          </span>
        </div>
      </div>
    </div>
  );
}
