import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  Layers,
  Trash2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Tag,
  Edit3,
  DollarSign,
  RotateCcw,
  AlertTriangle,
  Copy,
  Check,
  Barcode,
  MapPin,
  X,
  ArrowUpFromLine,
  ArrowDownToLine,
  LayoutGrid,
  List,
} from 'lucide-react';
import BarcodeModal from '../components/BarcodeModal';
import DisposalModal from '../components/DisposalModal';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import EditMedicineModal from '../components/EditMedicineModal';
import EditBatchModal from '../components/EditBatchModal';
import { useLanguage } from '../context/LanguageContext';
import HelperText from '../components/HelperText';
import { formatDatePH } from '../utils/dateFormatter';

/* ── Design-system helpers ─────────────────────────── */
function TierPill({ tier }) {
  const { t } = useLanguage();
  const map = {
    Expired:  'bg-rose-950/80 text-rose-300 border-rose-700/50',
    Critical: 'bg-rose-900/60 text-rose-300 border-rose-600/40',
    Warning:  'bg-amber-900/60 text-amber-300 border-amber-600/40',
    Monitor:  'bg-slate-800/70 text-slate-300 border-slate-600/40',
    Safe:     'bg-teal-900/50 text-teal-300 border-teal-600/40',
  };
  const labelMap = {
    Expired: t('tier_expired_label', 'Expired'),
    Critical: t('tier_critical_label', 'Critical'),
    Warning: t('tier_warning_label', 'Warning'),
    Monitor: t('tier_monitor_label', 'Monitor'),
    Safe: t('tier_safe_label', 'Safe'),
  };
  const cls = map[tier] || 'bg-zinc-200 text-zinc-500 border-zinc-300';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border tabular-nums ${cls}`}>
      {labelMap[tier] || tier || t('no_stock', 'No stock')}
    </span>
  );
}

function CopyBarcode({ code }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="p-0.5 text-zinc-400 hover:text-teal-600 transition cursor-pointer"
      title={t('tip_copy_barcode', 'Copy barcode')}
    >
      {copied ? <Check className="w-3 h-3 text-teal-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* Status-token for stock level */
function StockBadge({ total, unit, isLow, isOut }) {
  if (isOut)  return <span className="font-bold tabular-nums text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs">{total} {unit}s</span>;
  if (isLow)  return <span className="font-bold tabular-nums text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs">{total} {unit}s</span>;
  return <span className="font-bold tabular-nums text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-xs">{total} {unit}s</span>;
}

/* Batch status badge inside drawer */
function BatchStatusBadge({ status }) {
  const { t } = useLanguage();
  if (status === 'active')   return <span className="text-[9px] font-bold bg-teal-100 text-teal-800 border border-teal-300 px-1.5 py-px rounded uppercase">{t('status_active', 'active')}</span>;
  if (status === 'expired')  return <span className="text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-px rounded uppercase">{t('status_expired', 'expired')}</span>;
  if (status === 'disposed') return <span className="text-[9px] font-bold bg-zinc-200 text-zinc-700 border border-zinc-300 px-1.5 py-px rounded uppercase">{t('status_disposed', 'disposed')}</span>;
  return <span className="text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-px rounded uppercase">{status}</span>;
}

/* Color-coded shelf-life chip */
function ShelfLifeChip({ days, expDate }) {
  const { t } = useLanguage();
  if (!expDate) {
    return <span className="text-slate-400 text-xs italic">{t('no_batches', 'No batches')}</span>;
  }
  if (days <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
        {t('status_expired', 'Expired')} ({formatDatePH(expDate, 'compact')})
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        {t('shelf_expiring_soon', 'Expiring Soon')} ({days}{t('days_left_short', 'd left')})
      </span>
    );
  }
  if (days <= 90) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        {t('shelf_sell_first', 'Sell First')} ({days}{t('days_left_short', 'd left')})
      </span>
    );
  }
  if (days <= 180) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        {t('tier_monitor_label', 'Monitor')} ({days}{t('days_left_short', 'd left')})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      {t('tier_safe_label', 'Good')} ({days}{t('days_left_short', 'd left')})
    </span>
  );
}

export default function InventoryView({
  medicines,
  batches,
  currentUser,
  onRefresh,
  onOpenAddMedicine,
  onNavigate,
  initialFilter,
  initialSearch,
  uiMode = 'clean',
  activeSubTab,
  onSubTabChange,
}) {
  const { t } = useLanguage();
  const searchRef = useRef(null);

  const [searchTerm,       setSearchTerm]       = useState(initialSearch || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus,   setSelectedStatus]   = useState(initialFilter || 'All');
  const [expandedMedId,    setExpandedMedId]    = useState(null);
  const [viewMode,         setViewMode]         = useState(() => {
    try {
      return localStorage.getItem('rka_inventory_view_mode') || 'cards';
    } catch (_) {
      return 'cards';
    }
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('rka_inventory_view_mode', mode);
    } catch (_) {}
  };

  const [barcodeMedicine, setBarcodeMedicine] = useState(null);
  const [disposalBatch,   setDisposalBatch]   = useState(null);
  const [adjustmentBatch, setAdjustmentBatch] = useState(null);
  const [editMedicine,    setEditMedicine]    = useState(null);
  const [editPriceBatch,  setEditPriceBatch]  = useState(null);

  // Sync subnav pills with inventory status filter
  useEffect(() => {
    if (!activeSubTab) return;
    if (activeSubTab === 'all-sku') setSelectedStatus('All');
    else if (activeSubTab === 'low-stock') setSelectedStatus('low_stock');
    else if (activeSubTab === 'critical') setSelectedStatus('critical');
    else if (activeSubTab === 'quarantine') setSelectedStatus('expired');
  }, [activeSubTab]);

  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    if (onSubTabChange) {
      if (newStatus === 'All') onSubTabChange('all-sku');
      else if (newStatus === 'low_stock') onSubTabChange('low-stock');
      else if (newStatus === 'critical') onSubTabChange('critical');
      else if (newStatus === 'expired') onSubTabChange('quarantine');
    }
  };

  useEffect(() => {
    if (initialFilter) setSelectedStatus(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    if (initialSearch !== undefined && initialSearch !== null) {
      setSearchTerm(initialSearch);
      if (initialSearch && medicines?.length > 0) {
        const q = initialSearch.toLowerCase();
        const match = medicines.find(m => 
          m.brand_name?.toLowerCase().includes(q) ||
          m.generic_name?.toLowerCase().includes(q) ||
          m.barcode === initialSearch ||
          m.code?.toLowerCase().includes(q)
        );
        if (match) setExpandedMedId(match.id);
      }
    }
  }, [initialSearch, medicines]);

  /* Focus search on "/" */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const categories = [
    'All',
    'Analgesic / Antipyretic',
    'Antibiotic',
    'Vitamins & Supplements',
    'Antihistamine',
    'Respiratory',
    'Cardiovascular',
    'Antidiabetic',
  ];

  const lowStockCount = medicines.filter(m => m.is_low_stock || m.total_stock <= (m.reorder_threshold || 0)).length;

  const filtered = medicines.filter(m => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      m.brand_name.toLowerCase().includes(q) ||
      m.generic_name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      m.barcode.toLowerCase().includes(q);
    const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
    let matchStatus = true;
    if (selectedStatus === 'low_stock')    matchStatus = m.is_low_stock || m.total_stock <= (m.reorder_threshold || 0);
    if (selectedStatus === 'out_of_stock') matchStatus = m.is_out_of_stock || m.total_stock <= 0;
    if (selectedStatus === 'critical')     matchStatus = m.expiry_tier === 'Critical';
    if (selectedStatus === 'warning')      matchStatus = m.expiry_tier === 'Warning';
    if (selectedStatus === 'expired')      matchStatus = m.expiry_tier === 'Expired';
    return matchSearch && matchCat && matchStatus;
  });

  const hasFilter = searchTerm || selectedCategory !== 'All' || selectedStatus !== 'All';
  const clearFilter = () => { setSearchTerm(''); setSelectedCategory('All'); handleStatusChange('All'); };

  // Pre-group and sort batches by medicine_id once (O(B)) instead of inside every card/row render (O(M * B))
  const batchesByMedId = useMemo(() => {
    const map = {};
    for (let i = 0; i < (batches || []).length; i++) {
      const b = batches[i];
      if (!map[b.medicine_id]) map[b.medicine_id] = [];
      map[b.medicine_id].push(b);
    }
    for (const key in map) {
      map[key].sort((a, b) => (a.expiration_date > b.expiration_date ? 1 : a.expiration_date < b.expiration_date ? -1 : 0));
    }
    return map;
  }, [batches]);

  return (
    <div className={uiMode === 'clean' ? 'space-y-3 pb-8' : 'space-y-4 pb-12'}>

      {/* ══ Page Header ══ */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white rounded-2xl border border-zinc-200 shadow-xs ${uiMode === 'clean' ? 'p-6' : 'px-5 py-3.5'}`}>
        <div>
          <h2 className={`${uiMode === 'clean' ? 'text-2xl font-extrabold' : 'text-base font-extrabold'} text-slate-900 tracking-tight`}>
            {t('inv_catalog_title', 'Medicine & Vitamin Catalog')}
          </h2>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-0.5">
            {t('inv_catalog_subtitle', 'Batch-level records, barcodes, lead times, and expiration monitoring')}
          </HelperText>
        </div>
        <button
          onClick={onOpenAddMedicine}
          className={`flex items-center justify-center gap-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition cursor-pointer shrink-0 ${
            uiMode === 'clean' ? 'min-h-[48px] px-5 text-sm' : 'px-3.5 py-1.5 text-xs'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{t('btn_add_medicine', '+ Add Medicine Profile')}</span>
        </button>
      </div>

      {/* ══ Fast Filter Toolbar ══ */}
      <div className={`bg-white rounded-2xl border border-zinc-200 shadow-xs ${uiMode === 'clean' ? 'p-5 space-y-4' : 'p-4 space-y-3'}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Full-text search */}
          <div className="relative flex-1">
            <Search className={`text-zinc-400 absolute left-3.5 ${uiMode === 'clean' ? 'w-4 h-4 top-3.5' : 'w-3.5 h-3.5 top-2.5'}`} />
            <input
              ref={searchRef}
              type="text"
              placeholder={`${t('inv_search_placeholder', 'Search by brand, generic, barcode, or code...')} (/)`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-9 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-zinc-50 focus:bg-white ${
                uiMode === 'clean' ? 'min-h-[48px] text-sm' : 'py-2 text-xs'
              }`}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className={`absolute right-3 text-zinc-400 hover:text-zinc-700 cursor-pointer ${uiMode === 'clean' ? 'top-3.5' : 'top-2.5'}`}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Low Stock toggle pill */}
          <button
            type="button"
            onClick={() => handleStatusChange(selectedStatus === 'low_stock' ? 'All' : 'low_stock')}
            className={`shrink-0 font-bold rounded-xl border transition flex items-center justify-center gap-2 cursor-pointer ${
              uiMode === 'clean' ? 'min-h-[48px] px-4 text-sm' : 'px-3 py-2 text-xs'
            } ${
              selectedStatus === 'low_stock'
                ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{t('btn_low_stock_only', 'Low Stock Only')}</span>
            <span className={`px-2 py-0.5 rounded tabular-nums text-xs ${selectedStatus === 'low_stock' ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-900'}`}>
              {lowStockCount}
            </span>
          </button>

          {/* Category selector */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className={`shrink-0 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-700 cursor-pointer ${
              uiMode === 'clean' ? 'min-h-[48px] px-3 text-sm' : 'px-2.5 py-2 text-xs'
            }`}
          >
            <option value="All">{t('inv_filter_all', 'All Categories')}</option>
            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Stock/expiry state filter */}
          <select
            value={selectedStatus}
            onChange={e => handleStatusChange(e.target.value)}
            className={`shrink-0 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-700 cursor-pointer ${
              uiMode === 'clean' ? 'min-h-[48px] px-3 text-sm' : 'px-2.5 py-2 text-xs'
            }`}
          >
            <option value="All">{t('btn_all_items', 'All Stock & Expiry States')}</option>
            <option value="low_stock">{t('badge_low_stock', 'Low Stock (≤ Threshold)')}</option>
            <option value="out_of_stock">{t('badge_out_of_stock', 'Out of Stock')}</option>
            <option value="critical">{t('tier_critical', 'Critical (1–30d)')}</option>
            <option value="warning">{t('tier_warning', 'Warning (31–90d)')}</option>
            <option value="expired">{t('tier_expired', 'Expired (Blocked)')}</option>
          </select>
        </div>

        {/* Filter summary and View Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span>
              {t('inv_showing_medicines', { count: filtered.length, total: medicines.length }, `Showing ${filtered.length} of ${medicines.length} medicines`)}
              {hasFilter && <span className="text-teal-700 font-semibold ml-1">{t('filter_active_label', '(filtered)')}</span>}
            </span>
            {hasFilter && (
              <button type="button" onClick={clearFilter}
                className="inline-flex items-center gap-1.5 font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg transition cursor-pointer px-2.5 py-1 text-xs">
                <RotateCcw className="w-3.5 h-3.5" />
                {t('btn_clear_filter', 'Clear Filter')}
              </button>
            )}
          </div>

          {/* View mode segmented toggle (Cards vs Table) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200" role="group" aria-label="View Mode">
            <button
              type="button"
              onClick={() => handleViewModeChange('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-teal-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title={t('view_mode_cards_tip', 'Detailed card view')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t('view_mode_cards', 'Cards')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-teal-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title={t('view_mode_table_tip', 'Compact table view')}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t('view_mode_table', 'Table')}</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'cards' ? (
        /* ══════════════════════════════════════
           CLEAN & SIMPLE CARD LIST VIEW
        ══════════════════════════════════════ */
        <div className="space-y-4">
          {filtered.map(m => {
            const isExpanded = expandedMedId === m.id;
            const medBatches = batchesByMedId[m.id] || [];
            const isOut = m.is_out_of_stock || m.total_stock <= 0;
            const isLow = !isOut && (m.is_low_stock || m.total_stock <= (m.reorder_threshold || 0));

            // At-risk calculation (batches expiring in <= 90 days with remaining quantity)
            const atRiskBatches = medBatches.filter(b => b.current_quantity > 0 && b.days_to_expiry > 0 && b.days_to_expiry <= 90);
            const atRiskQty = atRiskBatches.reduce((sum, b) => sum + b.current_quantity, 0);

            return (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition overflow-hidden">
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{m.brand_name}</h3>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 tabular-nums text-slate-600 border border-slate-200">{m.code}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium border border-teal-200">{m.category}</span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium mt-1">
                        {m.generic_name} • {m.dosage_strength} {m.dosage_form}
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs text-slate-400 block font-medium">{t('retail_price', 'Retail Price')}</span>
                      <span className="text-2xl font-extrabold text-teal-800 tabular-nums">
                        ₱{Number(m.latest_selling_price || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Status badges & telemetry pills */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {/* Stock level chip */}
                    {isOut ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        {t('out_of_stock_pill', 'Out of Stock')} (0 {m.unit_of_measure}s)
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        {t('low_stock_pill', 'Low Stock - Order Soon')} ({m.total_stock} {m.unit_of_measure}s left)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {m.total_stock} {m.unit_of_measure}s {t('in_stock_pill', 'in stock')}
                      </span>
                    )}

                    {/* Shelf Life Chip */}
                    <ShelfLifeChip days={m.days_to_earliest_expiry} expDate={m.earliest_expiration_date} uiMode="clean" />

                    {/* At-risk stock badge */}
                    {atRiskQty > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        ⚠️ {atRiskQty} {m.unit_of_measure || 'units'} {t('at_risk_expiring', 'at risk of expiring')}
                      </span>
                    )}

                    {/* Barcode badge with copy */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs tabular-nums text-slate-700">
                      <Barcode className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.barcode}</span>
                      <CopyBarcode code={m.barcode} />
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 font-medium">
                      {medBatches.length} {t('batches_on_record', 'batches on record')}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate('stock-out', { medicineId: m.id })}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title={t('title_dispense_med', 'Dispense this medicine')}
                      >
                        <ArrowUpFromLine className="w-4 h-4" />
                        <span>{t('btn_dispense', 'Dispense')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate('stock-in', { medicineId: m.id })}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                        title={t('title_stock_in_med', 'Receive delivery for this medicine')}
                      >
                        <ArrowDownToLine className="w-4 h-4 text-slate-500" />
                        <span>{t('btn_stock_in', 'Stock In')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBarcodeMedicine(m)}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Tag className="w-4 h-4 text-slate-500" />
                        <span>{t('btn_barcode', 'Barcode')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMedicine(m)}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-slate-500" />
                        <span>{t('btn_edit', 'Edit')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedMedId(isExpanded ? null : m.id)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isExpanded
                            ? 'bg-teal-700 text-white'
                            : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        <span>{isExpanded ? t('btn_hide_batches', 'Hide Batches') : t('btn_view_batches', 'View Batches')}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Batches Card in Clean Mode */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-teal-600" />
                        {t('batches_on_shelf', 'Batches on Shelf for')} {m.brand_name}
                      </h4>
                      <span className="text-xs text-slate-500">{t('sorted_by_fefo', 'Sorted by FEFO (Earliest Expiry First)')}</span>
                    </div>

                    {medBatches.length > 0 ? (
                      <div className="space-y-2.5">
                        {medBatches.map((b, idx) => {
                          const isFirst = idx === 0 && b.current_quantity > 0 && b.days_to_expiry > 0;
                          return (
                            <div key={b.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="tabular-nums font-bold text-base text-slate-900">{b.batch_number}</span>
                                  {isFirst && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
                                      {t('fefo_auto_selected', 'FEFO Auto-Selected ✓')}
                                    </span>
                                  )}
                                  <BatchStatusBadge status={b.status} />
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                                  <span>{t('label_expires', 'Expires:')} <strong className="text-slate-800 tabular-nums">{formatDatePH(b.expiration_date, 'compact')}</strong> ({b.days_to_expiry > 0 ? `${b.days_to_expiry} ${t('days_left', 'days left')}` : t('status_expired', 'Expired')})</span>
                                  <span>•</span>
                                  <span>{t('label_stock', 'Stock:')} <strong className="text-teal-800 font-bold tabular-nums">{b.current_quantity}</strong> / {b.initial_quantity}</span>
                                  <span>•</span>
                                  <span>{t('label_price', 'Price:')} <strong className="text-slate-800 tabular-nums">₱{Number(b.selling_price || 0).toFixed(2)}</strong></span>
                                  {b.supplier_dr_number && (
                                    <>
                                      <span>•</span>
                                      <span className="tabular-nums text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded text-[11px] border border-teal-200">
                                        {t('label_dr_si', 'DR/SI:')} {b.supplier_dr_number}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end md:self-auto">
                                <button
                                  type="button"
                                  onClick={() => setEditPriceBatch({ ...b, brand_name: m.brand_name })}
                                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer"
                                  title={t('tip_edit_price', 'Edit price')}
                                >
                                  <DollarSign className="w-4 h-4 text-slate-500" />
                                  <span>{t('btn_price', 'Price')}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAdjustmentBatch({ ...b, brand_name: m.brand_name })}
                                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer"
                                  title={t('tip_stock_adj', 'Stock adjustment')}
                                >
                                  <Sliders className="w-4 h-4 text-slate-500" />
                                  <span>{t('btn_adjust', 'Adjust')}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDisposalBatch({ ...b, brand_name: m.brand_name })}
                                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                                  title={t('tip_dispose_batch', 'Dispose batch')}
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600" />
                                  <span>{t('btn_dispose', 'Dispose')}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">{t('no_batches_med', 'No batches recorded for this medicine yet.')}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-600">{t('no_meds_filter', 'No medicines match your filter or search criteria.')}</p>
              <button
                onClick={clearFilter}
                className="min-h-[44px] px-4 py-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition cursor-pointer"
              >
                {t('btn_reset_filter', 'Reset Filter Criteria')}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ══════════════════════════════════════
           HIGH-DENSITY CLINICAL DATA GRID
        ══════════════════════════════════════ */
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <th className="py-2.5 px-4">{t('inv_col_medicine', 'Medicine Name & Form')}</th>
                  <th className="py-2.5 px-3">{t('inv_col_category', 'Category')}</th>
                  <th className="py-2.5 px-3">{t('inv_col_barcode', 'Barcode')}</th>
                  <th className="py-2.5 px-3 text-center">{t('inv_col_total_stock', 'Total Stock')}</th>
                  <th className="py-2.5 px-3 text-right">{t('retail_price', 'Retail Price')}</th>
                  <th className="py-2.5 px-3 text-center">{t('inv_col_reorder_threshold', 'Reorder')}</th>
                  <th className="py-2.5 px-3">{t('inv_col_earliest_exp', 'Earliest Expiry')}</th>
                  <th className="py-2.5 px-3 text-center">{t('inv_col_expiry_status', 'Status')}</th>
                  <th className="py-2.5 px-4 text-right">{t('inv_col_actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map(m => {
                  const isExpanded = expandedMedId === m.id;
                  const medBatches = batchesByMedId[m.id] || [];
                  const isOut = m.is_out_of_stock || m.total_stock <= 0;
                  const isLow = !isOut && (m.is_low_stock || m.total_stock <= (m.reorder_threshold || 0));

                  return (
                    <React.Fragment key={m.id}>
                      <tr className={`hover:bg-zinc-50/80 transition ${isExpanded ? 'bg-zinc-50/60' : ''}`}>
                        {/* Medicine Name & Form */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-[13px] leading-tight">{m.brand_name}</div>
                          <div className="text-zinc-500 text-[11px] mt-0.5">{m.generic_name} · {m.dosage_strength}</div>
                          <div className="text-[10px] text-zinc-400 tabular-nums mt-0.5">{m.code}</div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-700 text-[11px]">{m.dosage_form}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{m.category}</div>
                        </td>

                        {/* Barcode */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <Barcode className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span className="tabular-nums text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-slate-700 border border-zinc-200 select-all">
                              {m.barcode}
                            </span>
                            <CopyBarcode code={m.barcode} />
                            <button
                              onClick={() => setBarcodeMedicine(m)}
                              className="p-0.5 text-zinc-400 hover:text-teal-600 transition cursor-pointer"
                              title={t('tip_generate_barcode', 'Generate barcode label')}
                            >
                              <Tag className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Total Stock */}
                        <td className="py-3 px-3 text-center">
                          <StockBadge total={m.total_stock} unit={m.unit_of_measure} isLow={isLow} isOut={isOut} />
                          <div className="text-[10px] text-zinc-400 mt-1 tabular-nums">
                            {m.active_batches_count} {t('active_lots', 'active lots')}
                          </div>
                        </td>

                        {/* Retail Price */}
                        <td className="py-3 px-3 text-right font-extrabold text-teal-800 tabular-nums text-xs">
                          ₱{Number(m.latest_selling_price || 0).toFixed(2)}
                        </td>

                        {/* Reorder Threshold */}
                        <td className="py-3 px-3 text-center">
                          <span className={`font-bold tabular-nums text-sm ${isLow ? 'text-amber-700' : 'text-slate-700'}`}>
                            {m.reorder_threshold}
                          </span>
                          {isLow && <AlertTriangle className="w-3 h-3 text-amber-500 inline ml-1" />}
                        </td>

                        {/* Earliest Expiry */}
                        <td className="py-3 px-3">
                          {m.earliest_expiration_date ? (
                            <>
                              <div className="font-semibold text-slate-800 tabular-nums text-[11px]">{formatDatePH(m.earliest_expiration_date, 'compact')}</div>
                              <div className={`text-[10px] mt-0.5 tabular-nums ${
                                m.days_to_earliest_expiry <= 0   ? 'text-rose-700 font-bold' :
                                m.days_to_earliest_expiry <= 30  ? 'text-rose-600 font-semibold' :
                                m.days_to_earliest_expiry <= 90  ? 'text-amber-600' : 'text-zinc-400'
                              }`}>
                                {m.days_to_earliest_expiry <= 0
                                  ? t('status_expired', 'Expired')
                                  : `${m.days_to_earliest_expiry} ${t('days_remaining', 'days remaining')}`}
                              </div>
                            </>
                          ) : (
                            <span className="text-zinc-400 italic text-[10px]">{t('no_batches', 'No batches')}</span>
                          )}
                        </td>

                        {/* Expiry Status Pill */}
                        <td className="py-3 px-3 text-center">
                          <TierPill tier={m.expiry_tier} />
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onNavigate && onNavigate('stock-out', { medicineId: m.id })}
                              className="p-1.5 text-zinc-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                              title={t('tip_dispense_pos', 'Dispense Medicine (POS)')}
                            >
                              <ArrowUpFromLine className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onNavigate && onNavigate('stock-in', { medicineId: m.id })}
                              className="p-1.5 text-zinc-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                              title={t('tip_stock_in_delivery', 'Stock In / Receive Delivery')}
                            >
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditMedicine(m)}
                              className="p-1.5 text-zinc-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                              title={t('tip_edit_medicine', 'Edit Medicine Profile')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setExpandedMedId(isExpanded ? null : m.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-1 rounded-lg transition cursor-pointer"
                            >
                              <Layers className="w-3 h-3" />
                              {isExpanded ? t('hide_batches', 'Hide') : t('inv_active_batches', 'Batches')}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expandable Batch Drawer ── */}
                      {isExpanded && (
                        <tr className="bg-zinc-50 border-y border-zinc-200">
                          <td colSpan="9" className="px-4 py-3">
                            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
                              {/* Drawer header */}
                              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                                  <span className="font-bold text-[11px] text-slate-800 uppercase tracking-wider">
                                    {t('batches_on_shelf', 'Active Batches')} — {m.brand_name}
                                  </span>
                                  <span className="text-[9px] tabular-nums bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-px rounded tabular-nums">
                                    {medBatches.length} lot{medBatches.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <span className="text-[9px] text-zinc-400 tabular-nums uppercase tracking-wider">
                                  {t('release_priority_fefo', 'Release Priority: FEFO — First Expiry, First Out')}
                                </span>
                              </div>

                              {medBatches.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="border-b border-zinc-100 text-zinc-400 text-[10px] uppercase font-bold tracking-widest bg-zinc-50/50">
                                        <th className="py-2 px-3">{t('inv_batch_num', 'Lot #')}</th>
                                        <th className="py-2 px-3">{t('inv_mfg_date', 'Mfg Date')}</th>
                                        <th className="py-2 px-3">{t('inv_exp_date', 'Expiry Date')}</th>
                                        <th className="py-2 px-3">{t('col_days_left', 'Days Left')}</th>
                                        <th className="py-2 px-3 text-center">{t('col_qty_used_rcvd', 'Qty (Used / Rcvd)')}</th>
                                        <th className="py-2 px-3">{t('inv_unit_cost', 'Unit Cost (₱)')}</th>
                                        <th className="py-2 px-3">{t('inv_selling_price', 'Unit Price (₱)')}</th>
                                        <th className="py-2 px-3">{t('col_storage_bin', 'Storage Bin')}</th>
                                        <th className="py-2 px-3 text-center">{t('inv_status', 'Status')}</th>
                                        <th className="py-2 px-3 text-right">{t('inv_col_actions', 'Actions')}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                      {medBatches.map((b, idx) => {
                                        const isFirst = idx === 0 && b.current_quantity > 0 && b.days_to_expiry > 0;
                                        const daysCls =
                                          b.days_to_expiry <= 0   ? 'text-rose-700 font-bold' :
                                          b.days_to_expiry <= 30  ? 'text-rose-600 font-semibold' :
                                          b.days_to_expiry <= 90  ? 'text-amber-600 font-medium' : 'text-zinc-500';
                                        return (
                                          <tr key={b.id} className="hover:bg-zinc-50 transition">
                                            <td className="py-2 px-3 tabular-nums font-bold text-slate-800">
                                              {b.batch_number}
                                              {isFirst && (
                                                <span className="ml-1.5 text-[9px] bg-teal-100 text-teal-800 border border-teal-300 font-bold px-1.5 py-px rounded">{t('fefo_auto_selected', 'FEFO ✓')}</span>
                                              )}
                                              {b.supplier_dr_number && (
                                                <span className="ml-1.5 text-[9px] bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-px rounded tabular-nums font-medium">
                                                  DR:{b.supplier_dr_number}
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-2 px-3 text-zinc-400 tabular-nums text-[10px]">{formatDatePH(b.manufacturing_date, 'compact') || '—'}</td>
                                            <td className="py-2 px-3 font-semibold text-slate-800 tabular-nums text-[10px]">{formatDatePH(b.expiration_date, 'compact')}</td>
                                            <td className={`py-2 px-3 tabular-nums text-[11px] ${daysCls}`}>
                                              {b.days_to_expiry <= 0 ? t('status_expired', 'Expired') : `${b.days_to_expiry}${t('days_left_short', 'd')}`}
                                            </td>
                                            <td className="py-2 px-3 text-center font-bold tabular-nums text-slate-900">
                                              {b.current_quantity}
                                              <span className="text-zinc-400 font-normal"> / {b.initial_quantity}</span>
                                            </td>
                                            <td className="py-2 px-3 text-zinc-500 tabular-nums">₱{Number(b.unit_cost || 0).toFixed(2)}</td>
                                            <td className="py-2 px-3 font-semibold text-teal-800 tabular-nums">₱{Number(b.selling_price || 0).toFixed(2)}</td>
                                            <td className="py-2 px-3 text-zinc-400 text-[10px]">
                                              <span className="inline-flex items-center gap-1">
                                                <MapPin className="w-2.5 h-2.5" />
                                                {b.storage_location || 'Dispensary'}
                                              </span>
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                              <BatchStatusBadge status={b.status} />
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                              <div className="flex items-center justify-end gap-1">
                                                <button
                                                  onClick={() => setEditPriceBatch({ ...b, brand_name: m.brand_name })}
                                                  className="p-1 text-zinc-400 hover:text-teal-700 hover:bg-teal-50 rounded transition cursor-pointer"
                                                  title={t('tip_edit_price', 'Edit price')}
                                                ><DollarSign className="w-3.5 h-3.5" /></button>
                                                <button
                                                  onClick={() => setAdjustmentBatch({ ...b, brand_name: m.brand_name })}
                                                  className="p-1 text-zinc-400 hover:text-slate-700 hover:bg-zinc-100 rounded transition cursor-pointer"
                                                  title={t('tip_stock_adj', 'Stock adjustment')}
                                                ><Sliders className="w-3.5 h-3.5" /></button>
                                                <button
                                                  onClick={() => setDisposalBatch({ ...b, brand_name: m.brand_name })}
                                                  className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                                  title={t('tip_safe_disposal', 'Safe disposal')}
                                                ><Trash2 className="w-3.5 h-3.5" /></button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-xs text-zinc-400 italic p-4">{t('no_batches_med', 'No batches recorded for this medicine yet.')}</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-10 text-center text-zinc-400 text-xs">
                      <p>{t('no_meds_filter', 'No medicines match the selected filter criteria.')}</p>
                      <button onClick={clearFilter}
                        className="mt-2 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer">
                        {t('btn_reset_filter', 'Reset Filter Criteria')}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ Modals ══ */}
      <BarcodeModal medicine={barcodeMedicine} isOpen={Boolean(barcodeMedicine)} onClose={() => setBarcodeMedicine(null)} />
      <EditMedicineModal medicine={editMedicine} isOpen={Boolean(editMedicine)} onClose={() => setEditMedicine(null)} onMedicineUpdated={onRefresh} />
      <DisposalModal batch={disposalBatch} isOpen={Boolean(disposalBatch)} onClose={() => setDisposalBatch(null)} onDisposalComplete={onRefresh} currentUser={currentUser} />
      <StockAdjustmentModal batch={adjustmentBatch} isOpen={Boolean(adjustmentBatch)} onClose={() => setAdjustmentBatch(null)} onAdjustmentComplete={onRefresh} />
      <EditBatchModal batch={editPriceBatch} isOpen={Boolean(editPriceBatch)} onClose={() => setEditPriceBatch(null)} onBatchUpdated={onRefresh} />
    </div>
  );
}
