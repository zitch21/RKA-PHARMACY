import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  CheckCircle,
  Check,
  RefreshCw,
  AlertCircle,
  Filter,
  ShoppingBag,
  ShieldAlert,
  ArrowRight,
  FileCheck2,
  X,
  Loader2,
  Trash2,
  FlaskConical,
  Tag,
  DollarSign,
  Percent,
  ShieldCheck,
  PackageCheck,
  Printer,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import HelperText from '../components/HelperText';

/* ── Design helpers ─────────────────────────────── */
function FormulaCard({ idx, title, formula, result, color }) {
  const colors = {
    teal:   { border: 'border-teal-700/50',   label: 'text-teal-400',   value: 'text-teal-200' },
    amber:  { border: 'border-amber-700/50',  label: 'text-amber-400',  value: 'text-amber-200' },
    rose:   { border: 'border-rose-700/50',   label: 'text-rose-400',   value: 'text-rose-200' },
    violet: { border: 'border-violet-700/50', label: 'text-violet-400', value: 'text-violet-200' },
  };
  const c = colors[color] || colors.teal;
  return (
    <div className={`p-3 bg-zinc-900 rounded-xl border ${c.border} space-y-1`}>
      <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">{idx}. {title}</span>
      <div className={`font-bold text-sm tabular-nums ${c.value}`}>{result}</div>
      <div className={`text-[10px] font-sans ${c.label} leading-snug`}>{formula}</div>
    </div>
  );
}

function WastePill({ qty, unit }) {
  if (!qty || qty <= 0) return <span className="text-zinc-500 text-[10px] italic">—</span>;
  return (
    <span className="inline-flex items-center gap-1 tabular-nums font-extrabold text-[11px] text-rose-200 bg-rose-950/70 border border-rose-700/60 px-2 py-0.5 rounded-full">
      {qty} {unit}s
    </span>
  );
}

function ShelfLifeChip({ days, expDate }) {
  const { t } = useLanguage();
  if (!expDate) return null;
  if (days <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
        {t('badge_expired', 'Expired')} ({expDate})
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        {t('shelf_life_expiring_soon', 'Expiring Soon')} ({days}{t('days_left_short', 'd left')})
      </span>
    );
  }
  if (days <= 90) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        {t('shelf_life_sell_first', 'Sell First')} ({days}{t('days_left_short', 'd left')})
      </span>
    );
  }
  if (days <= 180) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        {t('shelf_life_monitor', 'Monitor')} ({days}{t('days_left_short', 'd left')})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      {t('shelf_life_good', 'Good')} ({days}{t('days_left_short', 'd left')})
    </span>
  );
}

export default function FefoPlusView({
  fefoData,
  onRefresh,
  onNavigate,
  uiMode = 'clean',
  activeSubTab = 'fefo-matrix',
  onSubTabChange: _onSubTabChange,
}) {
  const { t } = useLanguage();
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [showOnlyDiscrepant, setShowOnlyDiscrepant] = useState(false);

  /* Clearance & Margin-Loss States */
  const [activeBatches, setActiveBatches] = useState([]);
  const [markdownBatch, setMarkdownBatch] = useState(null);
  const [markdownPrice, setMarkdownPrice] = useState('');
  const [markdownReason, setMarkdownReason] = useState('FEFO+ Clearance Promotion');
  const [markdownLoading, setMarkdownLoading] = useState(false);
  const [clearanceSearch, setClearanceSearch] = useState('');
  const [rtvManifestData, setRtvManifestData] = useState(null);

  const [selectedMedIds, setSelectedMedIds] = useState([]);
  const [poDraftingMode, setPoDraftingMode] = useState('manual');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState([]);
  const [modalNotes, setModalNotes] = useState('Consolidated replenishment PO generated via FEFO+ Dynamic Reorder Planner');
  const [updateThresholdsWithPo, setUpdateThresholdsWithPo] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [singlePoConfirm, setSinglePoConfirm] = useState({
    isOpen: false, item: null, quantity: 1, unitCost: 10.0,
    supplierName: '', syncThreshold: true, notes: '', loading: false
  });

  useEffect(() => {
    fetch('/api/batches?status=active')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setActiveBatches(data);
      })
      .catch(err => console.error('Failed to load active batches:', err));
  }, []);

  const handleApplyMarkdown = async (batch, newPrice, reasonText) => {
    setMarkdownLoading(true);
    setActionError(null);
    try {
      const p = parseFloat(newPrice);
      if (isNaN(p) || p <= 0) throw new Error('Please enter a valid promotional price greater than 0.');
      const res = await fetch(`/api/batches/${batch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_cost: batch.unit_cost,
          selling_price: p,
          supplier_dr_number: batch.supplier_dr_number || null,
          reason: reasonText || 'FEFO+ Clearance Promotion',
          operator_name: 'Lourdes Gincen L. Cesista',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update batch price');
      setActionSuccess(`Batch ${batch.batch_number} price successfully updated to ₱${p.toFixed(2)}.`);
      setMarkdownBatch(null);
      // Update local state
      setActiveBatches(prev => prev.map(b => b.id === batch.id ? { ...b, selling_price: p } : b));
      onRefresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setMarkdownLoading(false);
    }
  };

  const atRiskBatches   = fefoData?.at_risk_batches    || [];
  const medicineAnalysis = fefoData?.medicine_analysis  || [];
  const recordedDays    = fefoData?.history_days_recorded || 0;
  const requiredDays    = fefoData?.history_days_required || fefoData?.forecasting_window_days || 30;
  const isColdStart     = fefoData?.is_cold_start;
  const hasEnoughData   = !isColdStart;

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => { if (data?.po_drafting_mode) setPoDraftingMode(data.po_drafting_mode); })
      .catch(err => console.error('Failed to load PO drafting mode:', err));
  }, []);

  const displayedMedicines = showOnlyDiscrepant
    ? medicineAnalysis.filter(ma => ma.suggested_reorder_level !== null && ma.suggested_reorder_level !== ma.current_threshold)
    : medicineAnalysis;

  const handleToggleSelectAll = () => {
    if (selectedMedIds.length === displayedMedicines.length) setSelectedMedIds([]);
    else setSelectedMedIds(displayedMedicines.map(ma => ma.medicine.id));
  };

  const handleToggleRow = (id) =>
    setSelectedMedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);


  const handleBulkApplyThresholds = async (targetItems = null) => {
    setActionSuccess(null); setActionError(null); setBulkLoading(true);
    try {
      const itemsToUpdate = targetItems || (
        selectedMedIds.length > 0
          ? medicineAnalysis.filter(ma => selectedMedIds.includes(ma.medicine.id) && ma.suggested_reorder_level !== null)
          : medicineAnalysis.filter(ma => ma.suggested_reorder_level !== null && ma.suggested_reorder_level !== ma.current_threshold)
      );
      if (itemsToUpdate.length === 0) throw new Error('No medicines selected or no threshold discrepancies to apply.');
      const updates = itemsToUpdate.map(ma => ({ medicine_id: ma.medicine.id, suggested_value: ma.suggested_reorder_level }));
      const res = await fetch('/api/fefo-plus/bulk-apply-suggested', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, operator_name: 'Lourdes Gincen L. Cesista' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to bulk apply thresholds');
      setActionSuccess(`Successfully updated dynamic reorder thresholds for ${data.count} medicines.`);
      setSelectedMedIds([]); onRefresh();
    } catch (err) { setActionError(err.message); }
    finally { setBulkLoading(false); }
  };

  const resolveUnitCost = (ma) => {
    let cost = null;
    if (ma.latest_unit_cost !== undefined && ma.latest_unit_cost !== null && Number(ma.latest_unit_cost) > 0) cost = Number(ma.latest_unit_cost);
    else if (ma.medicine?.latest_unit_cost !== undefined && ma.medicine?.latest_unit_cost !== null && Number(ma.medicine.latest_unit_cost) > 0) cost = Number(ma.medicine.latest_unit_cost);
    else if (ma.batches && ma.batches.length > 0) { const vb = [...ma.batches].reverse().find(b => Number(b.unit_cost) > 0); if (vb) cost = Number(vb.unit_cost); }
    return cost && cost > 0 ? parseFloat(cost.toFixed(2)) : 10.0;
  };

  const resolveSuggestedQty = (ma) => {
    if (ma.suggested_purchase_quantity && Number(ma.suggested_purchase_quantity) > 0) return Number(ma.suggested_purchase_quantity);
    if (ma.suggested_reorder_level && Number(ma.suggested_reorder_level) > 0) {
      const deficit = Number(ma.suggested_reorder_level) - (Number(ma.total_stock) || 0);
      return deficit > 0 ? deficit : Number(ma.suggested_reorder_level);
    }
    if (ma.current_threshold && Number(ma.current_threshold) > 0) {
      const deficit = Number(ma.current_threshold) - (Number(ma.total_stock) || 0);
      return deficit > 0 ? deficit : Number(ma.current_threshold);
    }
    return 20;
  };

  const handleOpenSinglePoConfirm = (ma) => {
    setSinglePoConfirm({
      isOpen: true, item: ma, quantity: resolveSuggestedQty(ma), unitCost: resolveUnitCost(ma),
      supplierName: ma.medicine?.supplier_name || 'Generic Distributor',
      notes: `Replenishment PO for ${ma.medicine?.brand_name} from FEFO+ Dynamic Planner`,
      syncThreshold: true, loading: false
    });
  };

  const handleConfirmSinglePo = async () => {
    if (!singlePoConfirm.item) return;
    const ma = singlePoConfirm.item;
    const qty = Math.max(1, parseInt(singlePoConfirm.quantity, 10) || 1);
    const cost = Math.max(0.5, parseFloat(singlePoConfirm.unitCost) || 10.0);
    const supplier = (singlePoConfirm.supplierName || ma.medicine?.supplier_name || 'Generic Distributor').trim();
    setSinglePoConfirm(prev => ({ ...prev, loading: true }));
    setActionSuccess(null); setActionError(null);
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_name: supplier,
          items: [{ medicine_id: ma.medicine.id, quantity_ordered: qty, unit_cost: cost, notes: singlePoConfirm.notes || 'Replenishment from FEFO+ Dynamic Planner' }],
          notes: `Draft PO accepted from FEFO+ Dynamic Planner for ${ma.medicine.brand_name}`,
          operator_name: 'Lourdes Gincen L. Cesista'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Purchase Order');
      let thresholdNote = '';
      if (singlePoConfirm.syncThreshold && ma.suggested_reorder_level !== null) {
        try {
          await fetch(`/api/fefo-plus/apply-suggested-threshold/${ma.medicine.id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suggested_value: ma.suggested_reorder_level })
          });
          thresholdNote = ` & reorder threshold updated to ${ma.suggested_reorder_level} units`;
        } catch (tErr) { console.warn('Could not sync threshold:', tErr); }
      }
      setSinglePoConfirm({ isOpen: false, item: null, quantity: 1, unitCost: 10.0, supplierName: '', syncThreshold: true, notes: '', loading: false });
      setActionSuccess(`Draft Purchase Order ${data.po?.po_number || ''} created for ${ma.medicine.brand_name} (${qty} ${ma.medicine.unit_of_measure}s at ₱${cost.toFixed(2)})${thresholdNote}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' }); onRefresh();
    } catch (err) {
      setActionError(err.message);
      setSinglePoConfirm(prev => ({ ...prev, loading: false }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBulkDraftPoClick = () => {
    let targetList = [];
    if (selectedMedIds.length > 0) {
      targetList = medicineAnalysis.filter(ma => selectedMedIds.includes(ma.medicine.id));
    } else {
      const urgentItems = medicineAnalysis.filter(ma => (ma.suggested_purchase_quantity && ma.suggested_purchase_quantity > 0) || ma.is_low_stock || ma.is_dynamically_low);
      if (urgentItems.length > 0) targetList = urgentItems;
      else {
        const discrepant = medicineAnalysis.filter(ma => ma.suggested_reorder_level !== null && ma.suggested_reorder_level !== ma.current_threshold);
        targetList = discrepant.length > 0 ? discrepant : (displayedMedicines.length > 0 ? displayedMedicines : medicineAnalysis);
      }
    }
    if (targetList.length === 0) { setActionError('No medicines available in catalog to draft purchase orders.'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setModalItems(targetList.map(ma => ({
      medicine_id: ma.medicine.id, brand_name: ma.medicine.brand_name, generic_name: ma.medicine.generic_name,
      dosage_strength: ma.medicine.dosage_strength, unit_of_measure: ma.medicine.unit_of_measure,
      supplier_name: ma.medicine.supplier_name || 'Generic Distributor', current_stock: Number(ma.total_stock) || 0,
      suggested_reorder_level: ma.suggested_reorder_level, quantity_ordered: resolveSuggestedQty(ma),
      unit_cost: resolveUnitCost(ma), notes: `Suggested PO based on ${requiredDays}-day consumption velocity`
    })));
    setIsReviewModalOpen(true);
  };

  const executeDraftPoDirect = async (itemsToDraft) => {
    setBulkLoading(true); setActionSuccess(null); setActionError(null);
    try {
      if (!itemsToDraft || itemsToDraft.length === 0) throw new Error('No items specified for purchase order creation.');
      const supplierGroups = {};
      for (const item of itemsToDraft) {
        const supp = (item.supplier_name || 'United Laboratories (Unilab)').trim();
        if (!supplierGroups[supp]) supplierGroups[supp] = [];
        supplierGroups[supp].push({ medicine_id: item.medicine_id, quantity_ordered: Math.max(1, parseInt(item.quantity_ordered, 10) || 1), unit_cost: Math.max(0.5, parseFloat(item.unit_cost) || 10.0), notes: item.notes || 'Replenishment from FEFO+ Dynamic Planner' });
      }
      const createdOrders = [];
      for (const [suppName, groupItems] of Object.entries(supplierGroups)) {
        const res = await fetch('/api/purchase-orders', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplier_name: suppName, items: groupItems, notes: modalNotes || 'Generated via FEFO+ Dynamic Reorder Level Planner', operator_name: 'Lourdes Gincen L. Cesista' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create Purchase Order');
        createdOrders.push(data.po);
      }
      if (updateThresholdsWithPo) {
        const thresholdUpdates = itemsToDraft.filter(i => i.suggested_reorder_level !== null).map(i => ({ medicine_id: i.medicine_id, suggested_value: i.suggested_reorder_level }));
        if (thresholdUpdates.length > 0) await fetch('/api/fefo-plus/bulk-apply-suggested', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates: thresholdUpdates, operator_name: 'Lourdes Gincen L. Cesista' }) });
      }
      setIsReviewModalOpen(false); setSelectedMedIds([]);
      setActionSuccess(`Draft Purchase Order(s) created: ${createdOrders.map(o => o.po_number).join(', ')} for ${itemsToDraft.length} items.`);
      window.scrollTo({ top: 0, behavior: 'smooth' }); onRefresh();
    } catch (err) { setActionError(err.message); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    finally { setBulkLoading(false); }
  };

  const discrepantCount = medicineAnalysis.filter(ma => ma.suggested_reorder_level !== null && ma.suggested_reorder_level !== ma.current_threshold).length;

  return (
    <div className={uiMode === 'clean' ? 'space-y-4 pb-8' : 'space-y-5 pb-12'}>

      {/* ══ Page Header ══ */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              {t('fefoplus_title') || 'FEFO+ Risk Analysis & Dynamic Reorder Engine'}
            </h2>
            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-200 uppercase tracking-widest">
              {hasEnoughData ? 'PREDICTIVE FEFO+ ACTIVE' : 'COLD-START BASELINE'}
            </span>
          </div>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-0.5">
            {t('fefoplus_subtitle') || 'Batch-level waste risk computation, negative-margin detection, and dynamic reorder planning'}
          </HelperText>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onNavigate && (
            <button onClick={() => onNavigate('purchase-orders')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer">
              <ShoppingBag className="w-3.5 h-3.5" />
              {t('nav_purchase_orders') || 'Purchase Orders'}
            </button>
          )}
          <button onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg transition cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
            {t('btn_refresh') || 'Refresh'}
          </button>
        </div>
      </div>

      {/* ══ Notifications ══ */}
      {actionSuccess && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
            {onNavigate && actionSuccess.includes('Purchase Order') && (
              <button type="button" onClick={() => onNavigate('purchase-orders')}
                className="ml-2 font-bold text-teal-700 underline hover:text-teal-900 flex items-center gap-0.5 cursor-pointer">
                <span>{t('nav_purchase_orders') || 'View POs'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-teal-500 hover:text-teal-800 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /><span>{actionError}</span></div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-700 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ══ SUB-TAB: CLEARANCE DISCOUNTS ══ */}
      {activeSubTab === 'clearance' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Percent className="w-4 h-4 text-teal-600" />
                {t('fefo_clearance_title', 'FEFO+ Clearance Markdown & Fast-Mover Promotions')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('fefo_clearance_desc', 'Accelerate inventory velocity on short-dated stock by offering promotional discounts before reaching expiration')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                {t('audit_trail_synced', 'Audit Trail Synchronized')}
              </span>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('expiring_90d', 'Expiring in ≤ 90 Days')}</p>
                <p className="text-2xl font-black text-rose-600 tabular-nums">
                  {activeBatches.filter(b => b.days_to_expiry > 0 && b.days_to_expiry <= 90).length} lots
                </p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('units_clearance_watch', 'Units on Clearance Watch')}</p>
                <p className="text-2xl font-black text-slate-800 tabular-nums">
                  {activeBatches.filter(b => b.days_to_expiry > 0 && b.days_to_expiry <= 90).reduce((s, b) => s + b.current_quantity, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Tag className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('total_active_batches', 'Total Active Batches')}</p>
                <p className="text-2xl font-black text-teal-700 tabular-nums">
                  {activeBatches.length} lots
                </p>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('search_clearance_placeholder', 'Search medicine brand, generic, or lot number...')}
                value={clearanceSearch}
                onChange={(e) => setClearanceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Clearance Table */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 border-b border-zinc-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">{t('fefo_col_med_lot', 'Medicine & Lot')}</th>
                    <th className="px-4 py-3">{t('fefo_col_shelf_life', 'Shelf Life')}</th>
                    <th className="px-4 py-3 text-right">{t('fefo_col_stock', 'Stock')}</th>
                    <th className="px-4 py-3 text-right">{t('fefo_col_cost', 'Cost (₱)')}</th>
                    <th className="px-4 py-3 text-right">{t('fefo_col_current_price', 'Current Price')}</th>
                    <th className="px-4 py-3 text-right">{t('fefo_col_margin', 'Margin')}</th>
                    <th className="px-4 py-3 text-center">{t('fefo_col_fast_markdown', 'Fast Markdown Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {activeBatches
                    .filter(b => {
                      if (!clearanceSearch) return true;
                      const q = clearanceSearch.toLowerCase();
                      return (
                        (b.brand_name && b.brand_name.toLowerCase().includes(q)) ||
                        (b.generic_name && b.generic_name.toLowerCase().includes(q)) ||
                        (b.batch_number && b.batch_number.toLowerCase().includes(q))
                      );
                    })
                    .sort((a, b) => (a.days_to_expiry || 999) - (b.days_to_expiry || 999))
                    .map((b) => {
                      const cost = b.unit_cost || 0;
                      const price = b.selling_price || 0;
                      const marginPct = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : 0;
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{b.brand_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Lot: {b.batch_number} {b.dosage_strength ? `• ${b.dosage_strength}` : ''}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <ShelfLifeChip days={b.days_to_expiry} expDate={b.expiration_date} />
                          </td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-800">
                            {b.current_quantity}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                            ₱{cost.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-slate-900 tabular-nums">
                            ₱{price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              parseFloat(marginPct) > 25 ? 'bg-emerald-50 text-emerald-700' :
                              parseFloat(marginPct) > 10 ? 'bg-amber-50 text-amber-700' :
                              'bg-rose-50 text-rose-700'
                            }`}>
                              {marginPct}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={markdownLoading}
                                onClick={() => handleApplyMarkdown(b, (price * 0.9).toFixed(2), 'FEFO+ Clearance: 10% Fast-Mover Markdown')}
                                className="px-2 py-1 text-[10px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition cursor-pointer"
                                title={t('title_markdown_10', 'Apply -10% Promotional Markdown')}
                              >
                                -10%
                              </button>
                              <button
                                type="button"
                                disabled={markdownLoading}
                                onClick={() => handleApplyMarkdown(b, (price * 0.8).toFixed(2), 'FEFO+ Clearance: 20% Expiry Markdown')}
                                className="px-2 py-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition cursor-pointer"
                                title={t('title_markdown_20', 'Apply -20% Promotional Markdown')}
                              >
                                -20%
                              </button>
                              <button
                                type="button"
                                disabled={markdownLoading}
                                onClick={() => handleApplyMarkdown(b, (price * 0.7).toFixed(2), 'FEFO+ Clearance: 30% Critical Markdown')}
                                className="px-2 py-1 text-[10px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition cursor-pointer"
                                title={t('title_markdown_30', 'Apply -30% Critical Clearance Markdown')}
                              >
                                -30%
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMarkdownBatch(b);
                                  setMarkdownPrice(b.selling_price.toString());
                                  setMarkdownReason('FEFO+ Clearance Promotion');
                                }}
                                className="px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition cursor-pointer"
                              >
                                {t('fefo_btn_custom', 'Custom')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Markdown Modal */}
          {markdownBatch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
                <div className="p-4 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{t('fefo_clearance_adj_title', 'Clearance Price Adjustment')}</span>
                  </div>
                  <button onClick={() => setMarkdownBatch(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-[#1e2430] border border-slate-200 dark:border-white/10 rounded-xl">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{markdownBatch.brand_name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Lot: {markdownBatch.batch_number} • Cost: ₱{markdownBatch.unit_cost?.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {t('retail_selling_price', 'New Promotional Price')} (₱) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={markdownPrice}
                      onChange={(e) => setMarkdownPrice(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-bold border border-slate-200 dark:border-white/10 dark:bg-[#21262d] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {parseFloat(markdownPrice) < (markdownBatch.unit_cost || 0) && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{t('fefo_salvage_warning', 'Price is below acquisition cost (Salvage liquidation mode)')}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {t('fefo_mandatory_audit_label', 'Mandatory Audit Justification')}
                    </label>
                    <input
                      type="text"
                      value={markdownReason}
                      onChange={(e) => setMarkdownReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 dark:bg-[#21262d] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder={t('fefo_ph_markdown_reason', 'e.g. Expiry clearance promotion, 20% fast mover discount')}
                    />
                  </div>
                </div>
                <div className="p-4 bg-slate-50/90 dark:bg-[#1e2430] border-t border-slate-100 dark:border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMarkdownBatch(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl transition cursor-pointer"
                  >
                    {t('btn_cancel', 'Cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={markdownLoading || !markdownPrice}
                    onClick={() => handleApplyMarkdown(markdownBatch, markdownPrice, markdownReason)}
                    className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t('fefo_btn_save_update_price', 'Save & Update Price')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ SUB-TAB: MARGIN LOSS / RETURN TO VENDOR ══ */}
      {activeSubTab === 'margin-loss' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-rose-600" />
                {t('fefo_rtv_analysis_title', 'Margin Protection & Return to Vendor (RTV) Analysis')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('fefo_rtv_analysis_desc', 'Financial risk assessment tracking potential inventory write-offs versus supplier return credit eligibility')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRtvManifestData({
                batches: activeBatches.filter(b => b.days_to_expiry > 0 && b.days_to_expiry <= 90),
                generatedAt: new Date().toISOString(),
              })}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              {t('fefo_btn_gen_return_slip', 'Generate Supplier Return Slip')}
            </button>
          </div>

          {/* Loss Mitigation KPIs */}
          {(() => {
            const riskBatches = activeBatches.filter(b => b.days_to_expiry > 0 && b.days_to_expiry <= 90);
            const totalCostAtRisk = riskBatches.reduce((s, b) => s + (b.current_quantity * (b.unit_cost || 0)), 0);
            const totalRetailAtRisk = riskBatches.reduce((s, b) => s + (b.current_quantity * (b.selling_price || 0)), 0);
            const rtvEligible = riskBatches.filter(b => b.days_to_expiry > 30);
            const rtvClaimableValue = rtvEligible.reduce((s, b) => s + (b.current_quantity * (b.unit_cost || 0)), 0);

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('fefo_cap_at_risk', 'Capital at Expiry Risk')}</p>
                      <p className="text-2xl font-black text-rose-600 tabular-nums">
                        ₱{totalCostAtRisk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('fefo_gross_loss', 'Potential Gross Sales Loss')}</p>
                      <p className="text-2xl font-black text-slate-800 tabular-nums">
                        ₱{totalRetailAtRisk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('fefo_rtv_claimable', 'RTV Claimable Credit')}</p>
                      <p className="text-2xl font-black text-teal-700 tabular-nums">
                        ₱{rtvClaimableValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                      <PackageCheck className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Return Candidate Table */}
                <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-zinc-200 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{t('fefo_rtv_heading', 'Return to Vendor (RTV) Candidate Batches')}</span>
                    <span className="text-[11px] text-slate-500">{t('fefo_rtv_batches_eligible', { count: rtvEligible.length }, `${rtvEligible.length} batches eligible for vendor credit claim`)}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-700">
                      <thead className="bg-white border-b border-zinc-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">{t('col_supplier', 'Supplier')}</th>
                          <th className="px-4 py-3">{t('fefo_col_med_lot', 'Medicine & Lot')}</th>
                          <th className="px-4 py-3">{t('stockin_col_expiry', 'Expiry Date')}</th>
                          <th className="px-4 py-3 text-right">{t('stockin_col_units', 'Units')}</th>
                          <th className="px-4 py-3 text-right">{t('stockin_col_cost', 'Unit Cost')}</th>
                          <th className="px-4 py-3 text-right">{t('col_line_total', 'Credit Value')}</th>
                          <th className="px-4 py-3 text-center">{t('po_col_status', 'Status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {rtvEligible.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-900">{b.supplier_name || 'Standard Supplier'}</td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-900 block">{b.brand_name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">Lot: {b.batch_number}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-semibold text-slate-800">{b.expiration_date}</span>
                              <span className="ml-2 text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {b.days_to_expiry}d left
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold tabular-nums">{b.current_quantity}</td>
                            <td className="px-4 py-3 text-right tabular-nums">₱{(b.unit_cost || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-black text-slate-900 tabular-nums">
                              ₱{(b.current_quantity * (b.unit_cost || 0)).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-[10px] font-bold">
                                Return Eligible
                              </span>
                            </td>
                          </tr>
                        ))}
                        {rtvEligible.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                              No batches currently require Return to Vendor processing.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}

          {/* RTV Printable Modal */}
          {rtvManifestData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
                <div className="p-4 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex justify-between items-center no-print">
                  <span className="font-bold text-xs flex items-center gap-2 text-slate-900 dark:text-white">
                    <div className="w-6 h-6 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Printer className="w-3.5 h-3.5" />
                    </div>
                    <span>{t('fefo_rtv_manifest_title', 'Supplier Return to Vendor (RTV) Claim Manifest')}</span>
                  </span>
                  <button onClick={() => setRtvManifestData(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 text-xs text-slate-800 printable-area space-y-4">
                  <div className="text-center border-b border-dashed border-zinc-300 pb-3">
                    <h3 className="font-black text-base uppercase">{t('app_title', 'R.K.A PHARMACY')}</h3>
                    <p className="text-[10px] text-zinc-500">San Antonio, Agoo, La Union</p>
                    <p className="text-xs font-bold text-teal-800 mt-1 uppercase">{t('fefo_rtv_auth_sub', 'Supplier Return Authorization & Credit Request')}</p>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>{t('audit_col_timestamp', 'Generated')}: {new Date().toLocaleDateString()}</span>
                    <span>{t('audit_col_operator', 'Operator')}: Lourdes Gincen L. Cesista</span>
                  </div>
                  <div className="border border-zinc-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[10px]">
                      <thead className="bg-zinc-50 font-bold border-b border-zinc-200">
                        <tr>
                          <th className="p-2 text-left">{t('fefo_col_med_lot', 'Medicine & Lot')}</th>
                          <th className="p-2 text-left">{t('col_supplier', 'Supplier')}</th>
                          <th className="p-2 text-right">{t('col_qty', 'Qty')}</th>
                          <th className="p-2 text-right">{t('fefo_col_cost', 'Cost')}</th>
                          <th className="p-2 text-right">{t('col_line_total', 'Subtotal')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {rtvManifestData.batches.map(b => (
                          <tr key={b.id}>
                            <td className="p-2 font-bold">{b.brand_name} (Lot: {b.batch_number})</td>
                            <td className="p-2">{b.supplier_name || 'Generic'}</td>
                            <td className="p-2 text-right font-bold">{b.current_quantity}</td>
                            <td className="p-2 text-right">₱{(b.unit_cost || 0).toFixed(2)}</td>
                            <td className="p-2 text-right font-black">₱{(b.current_quantity * (b.unit_cost || 0)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black border-t border-dashed border-zinc-300 pt-3">
                    <span>{t('fefo_rtv_total_credit', 'TOTAL CREDIT CLAIM VALUE:')}</span>
                    <span>₱{rtvManifestData.batches.reduce((s, b) => s + (b.current_quantity * (b.unit_cost || 0)), 0).toFixed(2)}</span>
                  </div>
                  <div className="pt-6 grid grid-cols-2 gap-6 text-[10px] text-center">
                    <div className="border-t border-zinc-400 pt-1">{t('fefo_rtv_prepared_by', 'Pharmacist / Prepared By')}</div>
                    <div className="border-t border-zinc-400 pt-1">{t('fefo_rtv_received_by', 'Supplier Rep / Received By')}</div>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50/90 dark:bg-[#1e2430] border-t border-slate-100 dark:border-white/10 flex justify-end gap-2 no-print">
                  <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
                    {t('po_print_doc_btn', 'Print Document')}
                  </button>
                  <button type="button" onClick={() => setRtvManifestData(null)} className="px-4 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#21262d] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer">
                    {t('btn_done', 'Done')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ STANDARD FEFO+ MATRIX (DEFAULT) ══ */}
      {(activeSubTab === 'fefo-matrix' || (!activeSubTab || (activeSubTab !== 'clearance' && activeSubTab !== 'margin-loss'))) && (
      <>
      {/* ══ Cold-Start Notice ══ */}
      {isColdStart && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300/60 rounded-xl flex items-start gap-3 text-xs text-amber-950">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <span>{t('fefo_cold_start_active', 'Cold-Start Baseline Mode Active')}</span>
              <span className="bg-amber-200 text-amber-900 text-[9px] px-2 py-0.5 rounded-full tabular-nums">{recordedDays} / {requiredDays} Days</span>
            </div>
            <HelperText uiMode={uiMode} className="leading-relaxed text-amber-900">
              The system suppresses automated demand forecasting during the initial {requiredDays}-day operational baseline phase. Once {requiredDays} operational days of transactions are recorded, automated moving average demand forecasting, dynamic replenishment reorder levels, and predictive waste alerts will activate.
            </HelperText>
          </div>
        </div>
      )}

      {/* ══ FEFO+ Formula & Status Bar (Maximalist Only) ══ */}
      {uiMode !== 'clean' && (
        <div className="bg-slate-900 dark:bg-[#161b22] border border-slate-800 dark:border-white/10 rounded-2xl shadow-md overflow-hidden">
          <div className="px-5 py-2.5 border-b border-slate-800 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
                {t('fefoplus_formula_title') || 'FEFO+ Predictive Formula Engine'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-[9px] tabular-nums text-teal-300 uppercase tracking-widest">
                Sales History Span: {recordedDays} days recorded • {hasEnoughData ? 'PREDICTIVE FEFO+ ACTIVE' : 'COLD-START BASELINE'}
              </span>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FormulaCard idx={1} title={t('fefo_card_shelf_life_rem', 'Shelf Life Remaining')} result={t('col_days_left', 'Days to Expiry')} formula="Expiration Date − Current Date" color="teal" />
            <FormulaCard idx={2} title={t('fefo_card_consumption_vel', 'Consumption Velocity')} result={t('days_to_depletion') || 'Days to Depletion'} formula={`${t('fefo_col_stock', 'Batch Stock')} ÷ ${t('fefo_col_daily_demand', 'Daily Demand')} (${requiredDays}-day rolling avg)`} color="amber" />
            <FormulaCard idx={3} title={t('fefo_card_waste_risk_ind', 'Waste Risk Indicator')} result={t('expiry_risk_margin') || 'Expiry Risk Margin'} formula={`${t('col_days_left', 'Days to Expiry')} − ${t('days_to_depletion', 'Days to Depletion')}`} color="violet" />
            <FormulaCard idx={4} title={t('fefo_card_pred_expired', 'Predicted Expired Units')} result={t('estimated_waste_volume') || 'Est. Waste Volume'} formula={`${t('fefo_col_stock', 'Batch Stock')} − ${t('sim_demand_model_title', 'Expected Sales')}`} color="rose" />
          </div>
        </div>
      )}

      {/* ══ Section 1: At-Risk Batches Ledger ══ */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className={`font-extrabold text-slate-900 ${uiMode === 'clean' ? 'text-lg' : 'text-sm'} flex items-center gap-2`}>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              {uiMode === 'clean'
                ? t('will_expire_before_sold', 'Will Expire Before Sold Out')
                : (t('batches_unlikely_consumed') || 'At-Risk Batches — Negative Expiry Risk Margin')}
            </h3>
            <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-0.5">
              {uiMode === 'clean'
                ? 'These medicine batches are selling too slowly and will reach their expiration date before being completely sold.'
                : 'Batches where remaining stock exceeds expected sales volume within the remaining shelf life.'}
            </HelperText>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${atRiskBatches.length > 0 ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-teal-50 text-teal-800 border-teal-200'}`}>
            {atRiskBatches.length} At-Risk Batch{atRiskBatches.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {uiMode === 'clean' ? (
          /* Clean & Simple At-Risk Batch Cards */
          <div className="p-5 sm:p-6">
            {atRiskBatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {atRiskBatches.map((b) => (
                  <div key={b.id} className="bg-rose-50/40 border border-rose-200 rounded-2xl p-5 space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-lg text-slate-900">{b.brand_name}</h4>
                        <p className="text-xs text-slate-600 font-medium">{b.generic_name} • {b.dosage_strength}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 tabular-nums text-xs font-bold text-slate-800">
                        Lot: {b.batch_number}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <ShelfLifeChip days={b.days_to_expiry} expDate={b.expiration_date} />
                      <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700">
                        Remaining: {b.current_quantity} {b.unit_of_measure}s
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{t('fefo_projected_waste_risk', { qty: b.q_waste || b.current_quantity, unit: b.unit_of_measure || 'units' }, 'Projected Waste: {qty} {unit} at risk of expiring')}</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 font-medium">{t('fefo_prioritize_counter', 'Prioritize selling at counter')}</span>
                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate('stock-out')}
                          className="min-h-[44px] px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{t('fefo_dispense_now', 'Dispense Now')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                {isColdStart
                  ? '✓ Baseline period active: Expiry risk projections will activate as sales are recorded.'
                  : '✓ Great news! All medicine batches are projected to sell completely before their expiration date.'}
              </div>
            )}
          </div>
        ) : (
          /* Maximalist Table */
          atRiskBatches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                    <th className="py-2.5 px-4">{t('inv_col_medicine') || 'Medicine & Form'}</th>
                    <th className="py-2.5 px-3">{t('inv_batch_num') || 'Batch #'}</th>
                    <th className="py-2.5 px-3 text-center">{t('inv_col_total_stock') || 'Total Stock'}</th>
                    <th className="py-2.5 px-3 text-center">{t('fefo_col_daily_demand', 'Daily Demand')}</th>
                    <th className="py-2.5 px-3">{t('fefo_col_days_to_expiry', 'Days to Expiry')}</th>
                    <th className="py-2.5 px-3 text-center">{t('days_to_depletion') || 'Days to Depletion'}</th>
                    <th className="py-2.5 px-3 text-right">{t('expiry_risk_margin') || 'Risk Margin'}</th>
                    <th className="py-2.5 px-3 text-center">{t('estimated_waste_volume') || 'Est. Waste'}</th>
                    <th className="py-2.5 px-4 text-center">{t('fefo_col_action_guidance', 'Action Guidance')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {atRiskBatches.map((b) => {
                    const isNegative = parseFloat(b.expiry_risk_margin) < 0;
                    return (
                      <tr key={b.id} className="hover:bg-rose-50/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-[13px]">{b.brand_name}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{b.generic_name} · {b.dosage_strength}</div>
                        </td>
                        <td className="py-3 px-3 tabular-nums font-bold text-slate-800 text-[11px]">{b.batch_number}</td>
                        <td className="py-3 px-3 text-center font-bold tabular-nums text-slate-900">
                          {b.current_quantity} <span className="text-zinc-400 font-normal text-[10px]">{b.unit_of_measure}s</span>
                        </td>
                        <td className="py-3 px-3 text-center tabular-nums text-slate-600 text-[11px]">{b.adqs}/day</td>
                        <td className="py-3 px-3">
                          <div className="font-bold tabular-nums text-rose-600 text-[11px]">{b.days_to_expiry}d</div>
                          <div className="text-[9px] text-zinc-400 mt-0.5">{b.expiration_date}</div>
                        </td>
                        <td className="py-3 px-3 text-center tabular-nums text-slate-600 text-[11px]">{b.days_to_consume}d</td>
                        <td className="py-3 px-3 text-right">
                          <span className={`tabular-nums font-extrabold text-sm tabular-nums ${isNegative ? 'text-rose-700' : 'text-teal-700'}`}>
                            {b.expiry_risk_margin} days
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <WastePill qty={b.q_waste} unit={b.unit_of_measure} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-rose-800 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded">
                              {t('fefo_action_accelerate', 'Accelerate Release / Pause Orders')}
                            </span>
                            <span className="text-[9px] text-zinc-400">{t('fefo_prioritize_counter', 'Prioritize dispensing in counter')}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-zinc-400">
              {isColdStart
                ? '✓ Cold-Start baseline phase active: Risk margins will be computed once transaction history reaches N days.'
                : '✓ No batches with negative Expiry Risk Margin detected under current consumption velocity.'}
            </div>
          )
        )}
      </div>

      {/* ══ Section 2: Dynamic Reorder Planner ══ */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className={`font-extrabold text-slate-900 ${uiMode === 'clean' ? 'text-lg' : 'text-sm'} flex items-center gap-2`}>
              <TrendingUp className="w-4 h-4 text-teal-600" />
              {uiMode === 'clean'
                ? t('low_stock_order_soon', 'Low Stock - Order Soon')
                : `${t('dynamic_reorder_point') || 'Dynamic Reorder Point'} Planner`}
            </h3>
            <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-0.5">
              {uiMode === 'clean'
                ? 'Medicines that need replenishment orders or safety stock adjustments based on sales demand.'
                : `Compares manual owner threshold with dynamically computed reorder requirements from ${requiredDays}-day moving sales velocity.`}
            </HelperText>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button type="button" onClick={handleBulkDraftPoClick} disabled={bulkLoading}
              className={`inline-flex items-center gap-1.5 font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition disabled:opacity-50 cursor-pointer ${
                uiMode === 'clean' ? 'min-h-[44px] px-4 text-xs' : 'px-3 py-1.5 text-xs'
              }`}>
              <ShoppingBag className="w-3.5 h-3.5" />
              {selectedMedIds.length > 0 ? `Bulk Draft PO (${selectedMedIds.length})` : 'Bulk Draft PO'}
            </button>
            <button type="button" onClick={() => handleBulkApplyThresholds()} disabled={bulkLoading}
              className={`inline-flex items-center gap-1.5 font-bold rounded-xl bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-200 transition disabled:opacity-50 cursor-pointer ${
                uiMode === 'clean' ? 'min-h-[44px] px-4 text-xs' : 'px-3 py-1.5 text-xs'
              }`}>
              <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
              {selectedMedIds.length > 0 ? `${t('btn_apply') || 'Apply'} (${selectedMedIds.length})` : t('btn_apply') || 'Apply Thresholds'}
            </button>
            {uiMode !== 'clean' && (
              <span className="text-[10px] tabular-nums px-2 py-1 rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200">
                Policy: <strong className="text-zinc-800 uppercase">{poDraftingMode}</strong>
              </span>
            )}
            <button type="button" onClick={() => setShowOnlyDiscrepant(!showOnlyDiscrepant)}
              className={`inline-flex items-center gap-1.5 font-semibold rounded-xl border transition cursor-pointer ${
                uiMode === 'clean' ? 'min-h-[44px] px-3.5 text-xs' : 'px-3 py-1.5 text-xs'
              } ${
                showOnlyDiscrepant ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
              }`}>
              <Filter className="w-3.5 h-3.5" />
              {showOnlyDiscrepant ? 'Needs Update' : t('btn_all_items') || 'All Items'}
              <span className={`text-[9px] px-1.5 py-0.5 rounded tabular-nums font-bold ${showOnlyDiscrepant ? 'bg-white text-zinc-900' : 'bg-zinc-200 text-zinc-800'}`}>
                {discrepantCount}
              </span>
            </button>
          </div>
        </div>

        {uiMode === 'clean' ? (
          /* Clean & Simple Reorder Cards */
          <div className="p-5 sm:p-6 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedMedicines.map((ma) => {
                const isSuggestedDifferent = ma.suggested_reorder_level !== null && ma.suggested_reorder_level !== ma.current_threshold;
                const needsOrder = ma.is_low_stock || ma.suggested_purchase_quantity > 0;
                return (
                  <div key={ma.medicine.id} className={`bg-white border rounded-2xl p-5 space-y-3 shadow-xs transition ${needsOrder ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">{ma.medicine.brand_name}</h4>
                        <p className="text-xs text-slate-600 font-medium">{ma.medicine.generic_name} • {ma.medicine.dosage_strength}</p>
                      </div>
                      {needsOrder && (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-extrabold border border-amber-300 shrink-0">
                          Order Soon
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">{t('fefo_current_stock', 'Current Stock')}</span>
                        <strong className={`tabular-nums text-sm ${ma.is_low_stock ? 'text-amber-800' : 'text-slate-800'}`}>
                          {ma.total_stock} {ma.medicine.unit_of_measure}s
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">{t('fefo_safety_stock', 'Safety Stock')}</span>
                        <strong className="tabular-nums text-sm text-slate-800">
                          {ma.suggested_reorder_level !== null ? ma.suggested_reorder_level : ma.current_threshold}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">{t('fefo_suggested_order', 'Suggested Order')}</span>
                        <strong className="tabular-nums text-sm text-teal-800">
                          {ma.suggested_purchase_quantity > 0 ? `${ma.suggested_purchase_quantity} units` : '0'}
                        </strong>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      {isSuggestedDifferent && (
                        <button
                          type="button"
                          onClick={() => handleBulkApplyThresholds([ma])}
                          className="min-h-[44px] px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition cursor-pointer"
                        >
                          Update Safety Stock ({ma.suggested_reorder_level})
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={singlePoConfirm.loading}
                        onClick={() => handleOpenSinglePoConfirm(ma)}
                        className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ml-auto ${
                          needsOrder
                            ? 'text-white bg-teal-600 hover:bg-teal-700'
                            : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{t('fefo_create_order_btn', 'Create Order')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {displayedMedicines.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">{t('no_meds_filter', 'No medicines match the current filter.')}</div>
            )}
          </div>
        ) : (
          /* Maximalist Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <th className="py-2.5 px-3 text-center w-10">
                    <input type="checkbox"
                      checked={displayedMedicines.length > 0 && selectedMedIds.length === displayedMedicines.length}
                      onChange={handleToggleSelectAll}
                      className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                  </th>
                  <th className="py-2.5 px-4">{t('inv_col_medicine') || 'Medicine'}</th>
                  <th className="py-2.5 px-3 text-center">{t('inv_col_total_stock') || 'Total Stock'}</th>
                  <th className="py-2.5 px-3 text-center">{t('fefo_col_daily_demand', 'Daily Demand')}</th>
                  <th className="py-2.5 px-3 text-center">{t('lead_time_label') || 'Lead Time'} (d)</th>
                  <th className="py-2.5 px-3 text-center">{t('buffer_label') || 'Buffer'} (d)</th>
                  <th className="py-2.5 px-3 text-center">{t('inv_col_reorder_threshold') || 'Current Threshold'}</th>
                  <th className="py-2.5 px-3 text-center">{t('dynamic_reorder_point') || 'Dynamic ROP'}</th>
                  <th className="py-2.5 px-3 text-center">{t('fefo_col_suggested_po_qty', 'Suggested PO Qty')}</th>
                  <th className="py-2.5 px-4 text-right">{t('inv_col_actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {displayedMedicines.map((ma) => {
                  const isSuggestedDifferent = ma.suggested_reorder_level !== null && ma.suggested_reorder_level !== ma.current_threshold;
                  const isSelected = selectedMedIds.includes(ma.medicine.id);
                  return (
                    <tr key={ma.medicine.id} className={`transition ${isSelected ? 'bg-teal-50/40' : 'hover:bg-zinc-50'}`}>
                      <td className="py-3 px-3 text-center">
                        <input type="checkbox" checked={isSelected} onChange={() => handleToggleRow(ma.medicine.id)}
                          className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ma.medicine.brand_name}</div>
                        <div className="text-[10px] text-zinc-400">{ma.medicine.generic_name} ({ma.medicine.dosage_strength})</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold tabular-nums text-xs px-2 py-0.5 rounded ${ma.is_low_stock ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-800'}`}>
                          {ma.total_stock} {ma.medicine.unit_of_measure}s
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums text-slate-600 text-[11px]">
                        {ma.adqs !== null ? `${ma.adqs}/day` : <span className="text-zinc-400 italic text-[10px]">{t('badge_cold_start', 'Cold-Start')}</span>}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 tabular-nums text-[11px]">{ma.lead_time_days}d</td>
                      <td className="py-3 px-3 text-center text-slate-500 tabular-nums text-[11px]">{ma.buffer_days}d</td>
                      <td className="py-3 px-3 text-center font-bold tabular-nums text-slate-800 text-[12px]">{ma.current_threshold}</td>
                      <td className="py-3 px-3 text-center">
                        {ma.suggested_reorder_level !== null ? (
                          <span className={`font-bold tabular-nums text-[12px] px-2 py-0.5 rounded border ${isSuggestedDifferent ? 'text-teal-800 bg-teal-50 border-teal-200' : 'text-slate-600 bg-zinc-50 border-zinc-200'}`}>
                            {ma.suggested_reorder_level}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic text-[10px]">{t('fefo_manual_baseline', 'Manual Baseline')}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {ma.suggested_purchase_quantity > 0 ? (
                          <span className="text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded tabular-nums font-bold tabular-nums text-[11px]">
                            {ma.suggested_purchase_quantity} units
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[10px]">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isColdStart ? (
                          <span className="text-zinc-400 text-[10px] italic">{t('fefo_baseline_active', 'Baseline Active')}</span>
                        ) : (
                          <button
                            disabled={singlePoConfirm.loading}
                            onClick={() => handleOpenSinglePoConfirm(ma)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50 ${
                              isSuggestedDifferent || ma.suggested_purchase_quantity > 0
                                ? 'text-white bg-teal-600 hover:bg-teal-700'
                                : 'text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200'
                            }`}>
                            <Check className="w-3.5 h-3.5" />
                            {t('btn_accept_suggested') || 'Accept Suggested'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {displayedMedicines.length === 0 && (
                  <tr><td colSpan="10" className="py-8 text-center text-zinc-400 text-xs">{t('no_meds_filter', 'No medicines match the current filter.')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* ══ Single PO Confirmation Modal ══ */}
      {singlePoConfirm.isOpen && singlePoConfirm.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/90 dark:border-white/10 flex flex-col max-h-[90vh]">
            <div className="bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 text-slate-900 dark:text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('fefo_draft_po_title', 'Generate Draft Purchase Order')}</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Accept suggested replenishment for {singlePoConfirm.item.medicine?.brand_name}</span>
                </div>
              </div>
              <button onClick={() => setSinglePoConfirm({ isOpen: false, item: null, quantity: 1, unitCost: 10, supplierName: '', syncThreshold: true, notes: '', loading: false })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{singlePoConfirm.item.medicine?.brand_name}</h4>
                    <p className="text-xs text-zinc-500 font-medium">{singlePoConfirm.item.medicine?.generic_name} · {singlePoConfirm.item.medicine?.dosage_strength}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">{singlePoConfirm.item.medicine?.unit_of_measure}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-200 text-center text-xs">
                  {[[t('fefo_current_stock', 'On-Hand Stock'), singlePoConfirm.item.total_stock, 'text-slate-800'], [t('inv_col_reorder_threshold', 'Current Threshold'), singlePoConfirm.item.current_threshold, 'text-slate-800'], [t('dynamic_reorder_point', 'Suggested ROP'), singlePoConfirm.item.suggested_reorder_level !== null ? `${singlePoConfirm.item.suggested_reorder_level} units` : '—', 'text-teal-800']].map(([l, v, c]) => (
                    <div key={l} className="bg-white p-2 rounded-lg border border-zinc-200">
                      <span className="text-[9px] uppercase text-zinc-400 block font-bold tracking-widest">{l}</span>
                      <span className={`font-bold ${c}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('fefo_po_qty_label', 'Purchase Order Quantity')}</label>
                    <span className="text-[9px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold border border-teal-200">{t('fefo_prepopulated_velocity', 'Pre-populated from velocity')}</span>
                  </div>
                  <input type="number" min="1" value={singlePoConfirm.quantity}
                    onChange={(e) => setSinglePoConfirm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                    className="w-full px-3 py-2 text-sm font-bold border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white tabular-nums text-right" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('fefo_est_unit_cost', 'Estimated Unit Cost (₱)')}</label>
                    <div className="flex items-center rounded-lg border border-zinc-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                      <span className="px-2.5 py-2 bg-zinc-100 text-zinc-600 font-bold text-xs border-r border-zinc-200">₱</span>
                      <input type="number" step="0.01" min="0.5" value={singlePoConfirm.unitCost}
                        onChange={(e) => setSinglePoConfirm(prev => ({ ...prev, unitCost: Math.max(0.5, parseFloat(e.target.value) || 0.5) }))}
                        className="w-full px-2 py-2 text-xs font-bold tabular-nums focus:outline-none tabular-nums" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('fefo_distributor_supplier', 'Distributor / Supplier')}</label>
                    <input type="text" value={singlePoConfirm.supplierName}
                      onChange={(e) => setSinglePoConfirm(prev => ({ ...prev, supplierName: e.target.value }))}
                      className="w-full px-2.5 py-2 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white" />
                  </div>
                </div>
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs font-bold">
                  <span className="text-teal-900">{t('fefo_total_est_po', 'Total Estimated PO Amount:')}</span>
                  <span className="text-teal-800 tabular-nums text-sm">₱{((parseInt(singlePoConfirm.quantity, 10) || 0) * (parseFloat(singlePoConfirm.unitCost) || 0)).toFixed(2)}</span>
                </div>
                {singlePoConfirm.item.suggested_reorder_level !== null && (
                  <label className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer">
                    <input type="checkbox" checked={singlePoConfirm.syncThreshold} onChange={(e) => setSinglePoConfirm(prev => ({ ...prev, syncThreshold: e.target.checked }))}
                      className="rounded text-teal-600 focus:ring-teal-500 border-zinc-300 cursor-pointer" />
                    <span className="text-xs text-slate-800 font-medium">{t('fefo_sync_threshold_label', { units: singlePoConfirm.item.suggested_reorder_level }, `Also synchronize dynamic reorder threshold to ${singlePoConfirm.item.suggested_reorder_level} units`)}</span>
                  </label>
                )}
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 tracking-widest mb-1">{t('fefo_po_notes_label', 'PO Item Notes (Optional)')}</label>
                  <input type="text" value={singlePoConfirm.notes} onChange={(e) => setSinglePoConfirm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder={t('ph_po_notes', 'Notes for order slip...')} />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50/90 dark:bg-[#1e2430] border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setSinglePoConfirm({ isOpen: false, item: null, quantity: 1, unitCost: 10, supplierName: '', syncThreshold: true, notes: '', loading: false })}
                disabled={singlePoConfirm.loading}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl transition cursor-pointer">{t('btn_cancel') || 'Cancel'}</button>
              <button type="button" onClick={handleConfirmSinglePo} disabled={singlePoConfirm.loading}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                {singlePoConfirm.loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>{t('po_creating_draft', 'Creating Draft PO...')}</span></> : <><ShoppingBag className="w-3.5 h-3.5" /><span>{t('po_confirm_create_draft', 'Confirm & Create Draft PO')}</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Bulk Review Modal ══ */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200/90 dark:border-white/10 flex flex-col max-h-[90vh]">
            <div className="bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 text-slate-900 dark:text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('fefo_bulk_po_title', 'Review & Bulk Draft Purchase Order')}</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Drafting {modalItems.length} replenishment item(s) from FEFO+ consumption velocity</span>
                </div>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-950 flex items-center justify-between">
                <span><strong>{t('fefo_bulk_po_title', 'Bulk PO Review')}:</strong> {t('fefo_bulk_po_desc', 'Review quantities and unit costs before recording to purchase orders.')}</span>
                <span className="font-bold bg-white px-2 py-0.5 rounded border border-teal-300">{modalItems.length} Line Item(s)</span>
              </div>
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase text-[10px] tracking-widest border-b border-zinc-200">
                    <tr>
                      <th className="py-2.5 px-3">{t('po_col_item_medicine', 'Medicine')}</th>
                      <th className="py-2.5 px-2">{t('col_supplier', 'Supplier')}</th>
                      <th className="py-2.5 px-2 text-center">{t('fefo_current_stock', 'Stock')}</th>
                      <th className="py-2.5 px-2 text-center">{t('fefo_po_qty_label', 'PO Qty')}</th>
                      <th className="py-2.5 px-2 text-center">{t('fefo_est_unit_cost', 'Unit Cost (₱)')}</th>
                      <th className="py-2.5 px-3 text-right">{t('col_line_total', 'Line Total')}</th>
                      <th className="py-2.5 px-2 text-center w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {modalItems.map((item, idx) => (
                      <tr key={item.medicine_id} className="hover:bg-zinc-50">
                        <td className="py-2 px-3"><span className="font-bold text-slate-900 block">{item.brand_name}</span><span className="text-[9px] text-zinc-400">{item.generic_name}</span></td>
                        <td className="py-2 px-2 text-[10px] text-zinc-500">{item.supplier_name}</td>
                        <td className="py-2 px-2 text-center font-bold tabular-nums text-slate-800">{item.current_stock}</td>
                        <td className="py-2 px-2 text-center">
                          <input type="number" min="1" value={item.quantity_ordered}
                            onChange={(e) => { const val = Math.max(1, parseInt(e.target.value, 10) || 1); setModalItems(prev => { const copy = [...prev]; copy[idx] = { ...copy[idx], quantity_ordered: val }; return copy; }); }}
                            className="w-16 px-1.5 py-1 text-center font-bold text-xs border border-zinc-200 rounded focus:ring-1 focus:ring-teal-500 bg-white tabular-nums" />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="inline-flex items-center rounded border border-zinc-200 bg-white overflow-hidden focus-within:ring-1 focus-within:ring-teal-500">
                            <span className="px-1.5 py-1 bg-zinc-100 text-teal-800 font-bold text-[10px] border-r border-zinc-200">₱</span>
                            <input type="number" step="0.01" min="0.5" value={item.unit_cost}
                              onChange={(e) => { const val = parseFloat(e.target.value); setModalItems(prev => { const copy = [...prev]; copy[idx] = { ...copy[idx], unit_cost: isNaN(val) ? 0.5 : val }; return copy; }); }}
                              className="w-20 px-1.5 py-1 text-right tabular-nums font-bold text-xs focus:outline-none tabular-nums" />
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums font-bold tabular-nums text-slate-800">₱{((parseInt(item.quantity_ordered, 10) || 0) * (parseFloat(item.unit_cost) || 0)).toFixed(2)}</td>
                        <td className="py-2 px-2 text-center">
                          <button type="button" onClick={() => setModalItems(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                    {modalItems.length === 0 && (<tr><td colSpan="7" className="py-4 text-center text-zinc-400 italic text-xs">{t('po_no_items_remaining', 'No items remaining in this draft PO.')}</td></tr>)}
                  </tbody>
                </table>
              </div>
              <label className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer text-xs">
                <input type="checkbox" checked={updateThresholdsWithPo} onChange={(e) => setUpdateThresholdsWithPo(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500 border-zinc-300 cursor-pointer" />
                <span className="font-semibold text-slate-800">{t('fefo_apply_reorder_thresholds', 'Also apply dynamic reorder thresholds to medicine database records')}</span>
              </label>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t('fefo_po_notes_label', 'Purchase Order Notes (Optional)')}</label>
                <textarea rows="2" value={modalNotes} onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder={t('ph_po_bulk_notes', 'Notes for supplier or purchase tracking...')} />
              </div>
            </div>
            <div className="p-4 bg-slate-50/90 dark:bg-[#1e2430] border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                {t('fefo_total_est_val', 'Total Est. Value:')} ₱{modalItems.reduce((sum, i) => sum + ((parseInt(i.quantity_ordered, 10) || 0) * (parseFloat(i.unit_cost) || 0)), 0).toFixed(2)}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setIsReviewModalOpen(false)} disabled={bulkLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl transition cursor-pointer">{t('btn_cancel') || 'Cancel'}</button>
                <button type="button" onClick={() => executeDraftPoDirect(modalItems)} disabled={bulkLoading || modalItems.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                  {bulkLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>{t('po_creating_draft', 'Creating Draft PO...')}</span></> : <><ShoppingBag className="w-3.5 h-3.5" /><span>{t('btn_create_po') || 'Create Purchase Orders'}</span></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
