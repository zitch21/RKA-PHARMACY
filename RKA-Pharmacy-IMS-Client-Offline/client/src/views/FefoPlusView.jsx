import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Check,
  RefreshCw,
  Info,
  AlertCircle,
  Filter,
  ShoppingBag,
  ShieldAlert,
  ArrowRight,
  Layers,
  FileCheck2,
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import HelperText from '../components/HelperText';

export default function FefoPlusView({ fefoData, onRefresh, onNavigate, uiMode = 'clean' }) {
  const { t } = useLanguage();
  const [applyingId, setApplyingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [showOnlyDiscrepant, setShowOnlyDiscrepant] = useState(false);

  // Selection & Bulk Automation States
  const [selectedMedIds, setSelectedMedIds] = useState([]);
  const [poDraftingMode, setPoDraftingMode] = useState('manual');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState([]);
  const [modalNotes, setModalNotes] = useState('Consolidated replenishment PO generated via FEFO+ Dynamic Reorder Planner');
  const [updateThresholdsWithPo, setUpdateThresholdsWithPo] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Single PO Confirmation Prompt ("Accept Suggested")
  const [singlePoConfirm, setSinglePoConfirm] = useState({
    isOpen: false,
    item: null,
    quantity: 1,
    unitCost: 10.0,
    supplierName: '',
    syncThreshold: true,
    notes: '',
    loading: false
  });

  const atRiskBatches = fefoData?.at_risk_batches || [];
  const medicineAnalysis = fefoData?.medicine_analysis || [];
  const recordedDays = fefoData?.history_days_recorded || 0;
  const requiredDays = fefoData?.history_days_required || fefoData?.forecasting_window_days || 30;
  const isColdStart = fefoData?.is_cold_start;
  const hasEnoughData = !isColdStart;

  // Load PO drafting mode from settings
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.po_drafting_mode) {
          setPoDraftingMode(data.po_drafting_mode);
        }
      })
      .catch(err => console.error('Failed to load PO drafting mode:', err));
  }, []);

  const displayedMedicines = showOnlyDiscrepant
    ? medicineAnalysis.filter(ma => ma.suggested_reorder_level !== null && ma.suggested_reorder_level !== ma.current_threshold)
    : medicineAnalysis;

  // Select / Deselect All
  const handleToggleSelectAll = () => {
    if (selectedMedIds.length === displayedMedicines.length) {
      setSelectedMedIds([]);
    } else {
      setSelectedMedIds(displayedMedicines.map(ma => ma.medicine.id));
    }
  };

  const handleToggleRow = (id) => {
    setSelectedMedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Apply single suggested reorder threshold
  const handleApplySuggestedThreshold = async (medicineId, suggestedValue) => {
    setApplyingId(medicineId);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/fefo-plus/apply-suggested-threshold/${medicineId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggested_value: suggestedValue })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update threshold');

      setActionSuccess(data.message);
      onRefresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setApplyingId(null);
    }
  };

  // Bulk Apply Suggested Thresholds
  const handleBulkApplyThresholds = async (targetItems = null) => {
    setActionSuccess(null);
    setActionError(null);
    setBulkLoading(true);

    try {
      const itemsToUpdate = targetItems || (
        selectedMedIds.length > 0
          ? medicineAnalysis.filter(ma => selectedMedIds.includes(ma.medicine.id) && ma.suggested_reorder_level !== null)
          : medicineAnalysis.filter(ma => ma.suggested_reorder_level !== null && ma.suggested_reorder_level !== ma.current_threshold)
      );

      if (itemsToUpdate.length === 0) {
        throw new Error('No medicines selected or no threshold discrepancies to apply.');
      }

      const updates = itemsToUpdate.map(ma => ({
        medicine_id: ma.medicine.id,
        suggested_value: ma.suggested_reorder_level
      }));

      const res = await fetch('/api/fefo-plus/bulk-apply-suggested', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates,
          operator_name: 'Lourdes Gincen L. Cesista'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to bulk apply thresholds');

      setActionSuccess(`Successfully updated dynamic reorder thresholds for ${data.count} medicines.`);
      setSelectedMedIds([]);
      onRefresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Determine unit cost from previous batches or purchase records, with safe minimum fallback
  const resolveUnitCost = (ma) => {
    let cost = null;
    if (ma.latest_unit_cost !== undefined && ma.latest_unit_cost !== null && Number(ma.latest_unit_cost) > 0) {
      cost = Number(ma.latest_unit_cost);
    } else if (ma.medicine?.latest_unit_cost !== undefined && ma.medicine?.latest_unit_cost !== null && Number(ma.medicine.latest_unit_cost) > 0) {
      cost = Number(ma.medicine.latest_unit_cost);
    } else if (ma.batches && ma.batches.length > 0) {
      const validBatch = [...ma.batches].reverse().find(b => Number(b.unit_cost) > 0);
      if (validBatch) cost = Number(validBatch.unit_cost);
    }
    return cost && cost > 0 ? parseFloat(cost.toFixed(2)) : 10.0;
  };

  // Determine suggested replenishment purchase quantity
  const resolveSuggestedQty = (ma) => {
    if (ma.suggested_purchase_quantity && Number(ma.suggested_purchase_quantity) > 0) {
      return Number(ma.suggested_purchase_quantity);
    }
    if (ma.suggested_reorder_level && Number(ma.suggested_reorder_level) > 0) {
      const deficit = Number(ma.suggested_reorder_level) - (Number(ma.total_stock) || 0);
      if (deficit > 0) return deficit;
      return Number(ma.suggested_reorder_level);
    }
    if (ma.current_threshold && Number(ma.current_threshold) > 0) {
      const deficit = Number(ma.current_threshold) - (Number(ma.total_stock) || 0);
      if (deficit > 0) return deficit;
      return Number(ma.current_threshold);
    }
    return 20;
  };

  // Open confirmation prompt when clicking "Accept Suggested"
  const handleOpenSinglePoConfirm = (ma) => {
    const qty = resolveSuggestedQty(ma);
    const cost = resolveUnitCost(ma);
    const supp = ma.medicine?.supplier_name || 'Generic Distributor';
    const notes = `Replenishment PO for ${ma.medicine?.brand_name} from FEFO+ Dynamic Planner`;

    setSinglePoConfirm({
      isOpen: true,
      item: ma,
      quantity: qty,
      unitCost: cost,
      supplierName: supp,
      syncThreshold: true,
      notes,
      loading: false
    });
  };

  // Confirm and execute single draft PO creation
  const handleConfirmSinglePo = async () => {
    if (!singlePoConfirm.item) return;
    const ma = singlePoConfirm.item;
    const qty = Math.max(1, parseInt(singlePoConfirm.quantity, 10) || 1);
    const cost = Math.max(0.5, parseFloat(singlePoConfirm.unitCost) || 10.0);
    const supplier = (singlePoConfirm.supplierName || ma.medicine?.supplier_name || 'Generic Distributor').trim();

    setSinglePoConfirm(prev => ({ ...prev, loading: true }));
    setActionSuccess(null);
    setActionError(null);

    try {
      // 1. Create Draft Purchase Order
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_name: supplier,
          items: [
            {
              medicine_id: ma.medicine.id,
              quantity_ordered: qty,
              unit_cost: cost,
              notes: singlePoConfirm.notes || `Replenishment from FEFO+ Dynamic Planner`
            }
          ],
          notes: `Draft PO accepted from FEFO+ Dynamic Planner for ${ma.medicine.brand_name}`,
          operator_name: 'Lourdes Gincen L. Cesista'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Purchase Order');

      // 2. Synchronize threshold if checked
      let thresholdNote = '';
      if (singlePoConfirm.syncThreshold && ma.suggested_reorder_level !== null) {
        try {
          await fetch(`/api/fefo-plus/apply-suggested-threshold/${ma.medicine.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suggested_value: ma.suggested_reorder_level })
          });
          thresholdNote = ` & reorder threshold updated to ${ma.suggested_reorder_level} units`;
        } catch (tErr) {
          console.warn('Could not sync threshold:', tErr);
        }
      }

      setSinglePoConfirm({
        isOpen: false,
        item: null,
        quantity: 1,
        unitCost: 10.0,
        supplierName: '',
        syncThreshold: true,
        notes: '',
        loading: false
      });

      setActionSuccess(`Draft Purchase Order ${data.po?.po_number || ''} created for ${ma.medicine.brand_name} (${qty} ${ma.medicine.unit_of_measure}s at ₱${cost.toFixed(2)})${thresholdNote}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onRefresh();
    } catch (err) {
      setActionError(err.message);
      setSinglePoConfirm(prev => ({ ...prev, loading: false }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Trigger Bulk Draft PO button click
  const handleBulkDraftPoClick = () => {
    let targetList = [];

    // Case 1: Specific rows are checked with checkboxes
    if (selectedMedIds.length > 0) {
      targetList = medicineAnalysis.filter(ma => selectedMedIds.includes(ma.medicine.id));
    } else {
      // Case 2: No checkboxes checked.
      // Priority 2a: Items needing replenishment or having suggested PO qty > 0
      const urgentItems = medicineAnalysis.filter(
        ma => (ma.suggested_purchase_quantity && ma.suggested_purchase_quantity > 0) ||
              ma.is_low_stock ||
              ma.is_dynamically_low
      );

      if (urgentItems.length > 0) {
        targetList = urgentItems;
      } else {
        // Priority 2b: Items with discrepancy between suggested and current threshold
        const discrepantItems = medicineAnalysis.filter(
          ma => ma.suggested_reorder_level !== null && ma.suggested_reorder_level !== ma.current_threshold
        );

        if (discrepantItems.length > 0) {
          targetList = discrepantItems;
        } else {
          // Priority 2c: All displayed medicines in current filter
          targetList = displayedMedicines.length > 0 ? displayedMedicines : medicineAnalysis;
        }
      }
    }

    if (targetList.length === 0) {
      setActionError('No medicines available in catalog to draft purchase orders.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const candidates = targetList.map(ma => ({
      medicine_id: ma.medicine.id,
      brand_name: ma.medicine.brand_name,
      generic_name: ma.medicine.generic_name,
      dosage_strength: ma.medicine.dosage_strength,
      unit_of_measure: ma.medicine.unit_of_measure,
      supplier_name: ma.medicine.supplier_name || 'Generic Distributor',
      current_stock: Number(ma.total_stock) || 0,
      suggested_reorder_level: ma.suggested_reorder_level,
      quantity_ordered: resolveSuggestedQty(ma),
      unit_cost: resolveUnitCost(ma),
      notes: `Suggested PO based on ${requiredDays}-day consumption velocity`
    }));

    setModalItems(candidates);
    setIsReviewModalOpen(true);
  };

  // Direct / confirmed creation of draft Purchase Orders
  const executeDraftPoDirect = async (itemsToDraft) => {
    setBulkLoading(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      if (!itemsToDraft || itemsToDraft.length === 0) {
        throw new Error('No items specified for purchase order creation.');
      }

      // Group items by supplier for realistic supply chain separation
      const supplierGroups = {};
      for (const item of itemsToDraft) {
        const supp = (item.supplier_name || 'United Laboratories (Unilab)').trim();
        if (!supplierGroups[supp]) supplierGroups[supp] = [];
        supplierGroups[supp].push({
          medicine_id: item.medicine_id,
          quantity_ordered: Math.max(1, parseInt(item.quantity_ordered, 10) || 1),
          unit_cost: Math.max(0.5, parseFloat(item.unit_cost) || 10.0),
          notes: item.notes || `Replenishment from FEFO+ Dynamic Planner`
        });
      }

      const createdOrders = [];
      for (const [suppName, groupItems] of Object.entries(supplierGroups)) {
        const res = await fetch('/api/purchase-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplier_name: suppName,
            items: groupItems,
            notes: modalNotes || 'Generated via FEFO+ Dynamic Reorder Level Planner',
            operator_name: 'Lourdes Gincen L. Cesista'
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create Purchase Order');
        createdOrders.push(data.po);
      }

      // If requested, also bulk update thresholds
      if (updateThresholdsWithPo) {
        const thresholdUpdates = itemsToDraft
          .filter(i => i.suggested_reorder_level !== null)
          .map(i => ({
            medicine_id: i.medicine_id,
            suggested_value: i.suggested_reorder_level
          }));

        if (thresholdUpdates.length > 0) {
          await fetch('/api/fefo-plus/bulk-apply-suggested', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              updates: thresholdUpdates,
              operator_name: 'Lourdes Gincen L. Cesista'
            })
          });
        }
      }

      setIsReviewModalOpen(false);
      setSelectedMedIds([]);
      const poNums = createdOrders.map(o => o.po_number).join(', ');
      setActionSuccess(`Draft Purchase Order(s) created: ${poNums} for ${itemsToDraft.length} items.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onRefresh();
    } catch (err) {
      setActionError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className={`pb-12 ${uiMode === 'clean' ? 'p-2 sm:p-4 space-y-4' : 'p-4 sm:p-6 space-y-6'}`}>
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>{t('fefoplus_title')}</span>
            </h2>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {t('badge_fefo_active') || 'FEFO+ Active'}
            </span>
          </div>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-1">
            {t('fefoplus_subtitle')}
          </HelperText>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('purchase-orders')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('nav_purchase_orders')}</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('btn_refresh')}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
            {onNavigate && actionSuccess.includes('Purchase Order') && (
              <button
                type="button"
                onClick={() => onNavigate('purchase-orders')}
                className="ml-2 font-bold text-emerald-700 underline hover:text-emerald-900 flex items-center gap-0.5"
              >
                <span>{t('nav_purchase_orders')}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 font-bold text-xs">✕</button>
        </div>
      )}

      {/* Cold-Start Rule Notice */}
      {isColdStart && (
        <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <span>Cold-Start Baseline Mode Active</span>
              <span className="bg-amber-200/80 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-mono">
                {recordedDays} / {requiredDays} Days Recorded
              </span>
            </div>
            <HelperText uiMode={uiMode} className="leading-relaxed text-amber-900">
              The system suppresses automated demand forecasting during the initial {requiredDays}-day operational baseline phase. The pharmacy operates under <strong>standard FEFO dispatching</strong> and <strong>manual owner reorder thresholds</strong>. Once {requiredDays} operational days of sales transactions are recorded in the system, automated moving average demand forecasting, dynamic replenishment reorder levels, and predictive waste alerts will activate automatically.
            </HelperText>
          </div>
        </div>
      )}

      {/* Methodology & Process Overview Card (Shown in Maximalist Mode) */}
      {uiMode === 'maximalist' && (
        <div className="bg-slate-900 text-slate-200 p-6 rounded-xl shadow-md border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>{t('fefoplus_formula_title')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="text-[10px] uppercase text-slate-400 font-sans block mb-1">1. Shelf Life Remaining</span>
              <div className="text-white font-bold">Days to Expiry</div>
              <div className="text-emerald-400 font-sans">Expiration Date − Current Date</div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="text-[10px] uppercase text-slate-400 font-sans block mb-1">2. Consumption Velocity</span>
              <div className="text-white font-bold">{t('days_to_depletion')}</div>
              <div className="text-amber-300 font-sans">Batch Stock ÷ Daily Demand</div>
              <span className="text-[10px] text-slate-400 font-sans mt-1 block">Based on {requiredDays}-day sales average</span>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="text-[10px] uppercase text-slate-400 font-sans block mb-1">3. Waste Risk Indicator</span>
              <div className="text-white font-bold">{t('expiry_risk_margin')}</div>
              <div className="text-purple-300 font-sans">Days to Expiry − Days to Depletion</div>
              <span className="text-[10px] text-rose-400 font-sans mt-1 block">Negative margin indicates expiration risk</span>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="text-[10px] uppercase text-slate-400 font-sans block mb-1">4. Predicted Expired Units</span>
              <div className="text-white font-bold">{t('estimated_waste_volume')}</div>
              <div className="text-rose-400 font-sans">Batch Stock − Expected Sales</div>
              <span className="text-[10px] text-slate-400 font-sans mt-1 block">Expected unsold spoiled units</span>
            </div>
          </div>

          {/* Observation Window & Baseline Status */}
          <div className="p-3 bg-indigo-950/70 border border-indigo-800/70 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="font-bold text-white">Sales History Span: </span>
                <span className="text-indigo-200">
                  {recordedDays} days recorded in system ledger (Configured window: N = {requiredDays} operational days).
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
              hasEnoughData ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {hasEnoughData ? 'Predictive FEFO+ Active' : 'Cold-Start Baseline Mode'}
            </span>
          </div>
        </div>
      )}

      {/* Section 1: Batches with Negative Expiry Risk Margin (High Waste Risk) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span>{t('batches_unlikely_consumed')}</span>
            </h3>
            <HelperText uiMode={uiMode} className="text-xs text-slate-500">
              Batches where remaining stock exceeds expected sales volume within the remaining shelf life.
            </HelperText>
          </div>
          <span className="text-xs bg-rose-50 text-rose-800 border border-rose-200 font-bold px-2.5 py-1 rounded-full">
            {atRiskBatches.length} At-Risk Batches
          </span>
        </div>

        {atRiskBatches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">{t('inv_col_medicine')}</th>
                  <th className="py-3 px-3">{t('inv_batch_num')}</th>
                  <th className="py-3 px-3">{t('inv_col_total_stock')}</th>
                  <th className="py-3 px-3">Daily Demand (Avg)</th>
                  <th className="py-3 px-3">Days to Expiry</th>
                  <th className="py-3 px-3">{t('days_to_depletion')}</th>
                  <th className="py-3 px-3 text-right">{t('expiry_risk_margin')}</th>
                  <th className="py-3 px-3 text-center">{t('estimated_waste_volume')}</th>
                  <th className="py-3 px-4 text-center">Action Guidance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atRiskBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-rose-50/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {b.brand_name}
                      <span className="text-[11px] text-slate-500 block font-normal">
                        {b.generic_name} • {b.dosage_strength}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">{b.batch_number}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {b.current_quantity} {b.unit_of_measure}s
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {b.adqs} / day
                    </td>
                    <td className="py-3 px-3 font-semibold text-rose-600">
                      {b.days_to_expiry} days ({b.expiration_date})
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {b.days_to_consume} days
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 text-sm">
                      {b.expiry_risk_margin} days
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-extrabold text-xs text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                        {b.q_waste} {b.unit_of_measure}s
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                          Accelerate Release / Pause Orders
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          Prioritize dispensing in counter
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            {isColdStart
              ? '✓ Cold-Start baseline phase active: Risk margins will be computed once transaction history reaches N days.'
              : '✓ No batches with negative Expiry Risk Margin detected under current consumption velocity.'}
          </div>
        )}
      </div>

      {/* Section 2: Reorder Level Suggestion & Dynamic Threshold Planner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>{t('dynamic_reorder_point')} Planner</span>
            </h3>
            <HelperText uiMode={uiMode} className="text-xs text-slate-500">
              Compares owner's manual threshold with dynamically computed reorder requirements from {requiredDays}-day moving sales velocity.
            </HelperText>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Bulk PO Button */}
            <button
              type="button"
              onClick={handleBulkDraftPoClick}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition disabled:opacity-50 cursor-pointer"
              title="Bulk draft purchase orders for selected medicines or suggested replenishment items"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>
                {selectedMedIds.length > 0
                  ? `Bulk Draft PO (${selectedMedIds.length})`
                  : 'Bulk Draft PO'}
              </span>
            </button>

            {/* Bulk Apply Thresholds Button */}
            <button
              type="button"
              onClick={() => handleBulkApplyThresholds()}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200 transition disabled:opacity-50"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
              <span>
                {selectedMedIds.length > 0
                  ? `${t('btn_apply')} (${selectedMedIds.length})`
                  : t('btn_apply')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowOnlyDiscrepant(!showOnlyDiscrepant)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                showOnlyDiscrepant
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{showOnlyDiscrepant ? 'Discrepant Only' : t('btn_all_items')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${showOnlyDiscrepant ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-800'}`}>
                {medicineAnalysis.filter(ma => ma.suggested_reorder_level !== null && ma.suggested_reorder_level !== ma.current_threshold).length}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Planner Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={displayedMedicines.length > 0 && selectedMedIds.length === displayedMedicines.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">{t('inv_col_medicine')}</th>
                <th className="py-3 px-3">{t('inv_col_total_stock')}</th>
                <th className="py-3 px-3">Daily Demand (Avg)</th>
                <th className="py-3 px-3">{t('lead_time_label')} (Days)</th>
                <th className="py-3 px-3">{t('buffer_label')} (Days)</th>
                <th className="py-3 px-3 text-center">{t('inv_col_reorder_threshold')}</th>
                <th className="py-3 px-3 text-center">{t('dynamic_reorder_point')}</th>
                <th className="py-3 px-3 text-center">Suggested PO Qty</th>
                <th className="py-3 px-4 text-right">{t('inv_col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedMedicines.map((ma) => {
                const isSuggestedDifferent = ma.suggested_reorder_level !== null && ma.suggested_reorder_level !== ma.current_threshold;
                const isSelected = selectedMedIds.includes(ma.medicine.id);

                return (
                  <tr
                    key={ma.medicine.id}
                    className={`transition ${isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(ma.medicine.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{ma.medicine.brand_name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {ma.medicine.generic_name} ({ma.medicine.dosage_strength})
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        ma.is_low_stock ? 'bg-amber-100 text-amber-800' : 'text-slate-800'
                      }`}>
                        {ma.total_stock} {ma.medicine.unit_of_measure}s
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {ma.adqs !== null ? `${ma.adqs} / day` : <span className="text-slate-400 italic">Cold-Start</span>}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {ma.lead_time_days} days
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {ma.buffer_days} days
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {ma.current_threshold} units
                    </td>

                    <td className="py-3 px-3 text-center">
                      {ma.suggested_reorder_level !== null ? (
                        <span className="font-bold text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          {ma.suggested_reorder_level} units
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Manual Baseline</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {ma.suggested_purchase_quantity > 0 ? (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          {ma.suggested_purchase_quantity} units
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isColdStart ? (
                        <span className="text-slate-400 text-xs italic">
                          Baseline Active
                        </span>
                      ) : (
                        <button
                          disabled={applyingId === ma.medicine.id || singlePoConfirm.loading}
                          onClick={() => handleOpenSinglePoConfirm(ma)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer ${
                            isSuggestedDifferent || ma.suggested_purchase_quantity > 0
                              ? 'text-white bg-emerald-600 hover:bg-emerald-700'
                              : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                          }`}
                          title="Prompt confirmation and generate Draft Purchase Order pre-populated with suggested quantity"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('btn_accept_suggested')}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single PO Confirmation Modal ("Accept Suggested") */}
      {singlePoConfirm.isOpen && singlePoConfirm.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Generate Draft Purchase Order</h3>
                  <span className="text-[11px] text-slate-400">
                    Accept suggested replenishment for {singlePoConfirm.item.medicine?.brand_name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSinglePoConfirm({ isOpen: false, item: null, quantity: 1, unitCost: 10, supplierName: '', syncThreshold: true, notes: '', loading: false })}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Medicine Overview Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{singlePoConfirm.item.medicine?.brand_name}</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {singlePoConfirm.item.medicine?.generic_name} • {singlePoConfirm.item.medicine?.dosage_strength}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {singlePoConfirm.item.medicine?.unit_of_measure}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">On-Hand Stock</span>
                    <span className="font-bold text-slate-800">{singlePoConfirm.item.total_stock}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Current Limit</span>
                    <span className="font-bold text-slate-800">{singlePoConfirm.item.current_threshold}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Suggested Reorder</span>
                    <span className="font-bold text-emerald-700">
                      {singlePoConfirm.item.suggested_reorder_level !== null ? `${singlePoConfirm.item.suggested_reorder_level} units` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                {/* Quantity */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Purchase Order Quantity
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                      Pre-populated from velocity
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={singlePoConfirm.quantity}
                    onChange={(e) => setSinglePoConfirm(prev => ({
                      ...prev,
                      quantity: Math.max(1, parseInt(e.target.value, 10) || 1)
                    }))}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>

                {/* Unit Cost & Supplier Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Estimated Unit Cost (₱)
                    </label>
                    <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                      <span className="px-2.5 py-2 bg-slate-100 text-slate-700 font-bold text-xs border-r border-slate-200">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.5"
                        value={singlePoConfirm.unitCost}
                        onChange={(e) => setSinglePoConfirm(prev => ({
                          ...prev,
                          unitCost: Math.max(0.5, parseFloat(e.target.value) || 0.5)
                        }))}
                        className="w-full px-2 py-2 text-xs font-bold font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Distributor / Supplier
                    </label>
                    <input
                      type="text"
                      value={singlePoConfirm.supplierName}
                      onChange={(e) => setSinglePoConfirm(prev => ({ ...prev, supplierName: e.target.value }))}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Total Value Banner */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-900">Total Estimated PO Amount:</span>
                  <span className="text-emerald-800 font-mono text-sm">
                    ₱{((parseInt(singlePoConfirm.quantity, 10) || 0) * (parseFloat(singlePoConfirm.unitCost) || 0)).toFixed(2)}
                  </span>
                </div>

                {/* Dynamic threshold sync checkbox */}
                {singlePoConfirm.item.suggested_reorder_level !== null && (
                  <label className="flex items-center gap-2 p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={singlePoConfirm.syncThreshold}
                      onChange={(e) => setSinglePoConfirm(prev => ({ ...prev, syncThreshold: e.target.checked }))}
                      className="rounded text-purple-600 focus:ring-purple-500 border-purple-300 cursor-pointer"
                    />
                    <span className="text-xs text-purple-950 font-medium">
                      Also synchronize dynamic reorder threshold to <strong>{singlePoConfirm.item.suggested_reorder_level} units</strong>
                    </span>
                  </label>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    PO Item Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={singlePoConfirm.notes}
                    onChange={(e) => setSinglePoConfirm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Notes for order slip..."
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSinglePoConfirm({ isOpen: false, item: null, quantity: 1, unitCost: 10, supplierName: '', syncThreshold: true, notes: '', loading: false })}
                disabled={singlePoConfirm.loading}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                {t('btn_cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmSinglePo}
                disabled={singlePoConfirm.loading}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {singlePoConfirm.loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Draft PO...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Confirm & Create Draft PO</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal for Manual PO Drafting Mode */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Review & Bulk Draft Purchase Order</h3>
                  <span className="text-[11px] text-slate-400">
                    Drafting {modalItems.length} replenishment item(s) from FEFO+ consumption velocity
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
                <span>
                  <strong>Bulk PO Review:</strong> Review quantities and unit costs before recording to purchase orders.
                </span>
                <span className="font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {modalItems.length} Line Item(s)
                </span>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Medicine</th>
                      <th className="py-2.5 px-2">Supplier</th>
                      <th className="py-2.5 px-2 text-center">Stock</th>
                      <th className="py-2.5 px-2 text-center">Suggested PO Qty</th>
                      <th className="py-2.5 px-2 text-center">Unit Cost (₱)</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                      <th className="py-2.5 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {modalItems.map((item, idx) => (
                      <tr key={item.medicine_id} className="hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 block">{item.brand_name}</span>
                          <span className="text-[10px] text-slate-500">{item.generic_name}</span>
                        </td>
                        <td className="py-2 px-2 text-[11px] text-slate-600">{item.supplier_name}</td>
                        <td className="py-2 px-2 text-center font-bold text-slate-800">{item.current_stock}</td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity_ordered}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setModalItems(prev => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], quantity_ordered: val };
                                return copy;
                              });
                            }}
                            className="w-16 px-1.5 py-1 text-center font-bold text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 bg-white"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="inline-flex items-center rounded border border-slate-300 bg-white overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500 shadow-2xs">
                            <span className="px-1.5 py-1 bg-slate-100 text-emerald-800 font-bold text-[11px] border-r border-slate-200 select-none">₱</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.5"
                              value={item.unit_cost}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setModalItems(prev => {
                                  const copy = [...prev];
                                  copy[idx] = { ...copy[idx], unit_cost: isNaN(val) ? 0.5 : val };
                                  return copy;
                                });
                              }}
                              className="w-20 px-1.5 py-1 text-right font-mono font-bold text-xs focus:outline-none"
                              title="Editable Unit Cost pre-filled from item's previous batch or purchase record"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          ₱{((parseInt(item.quantity_ordered, 10) || 0) * (parseFloat(item.unit_cost) || 0)).toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setModalItems(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Remove from this draft PO"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {modalItems.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-4 text-center text-slate-400 italic">
                          No items remaining in this draft PO.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Threshold sync option */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateThresholdsWithPo}
                    onChange={(e) => setUpdateThresholdsWithPo(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 border-purple-300 cursor-pointer"
                  />
                  <span className="font-semibold text-purple-900">
                    Also apply dynamic reorder thresholds to medicine database records
                  </span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Purchase Order Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Notes for supplier or purchase tracking..."
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Total Est. Value: ₱{modalItems.reduce((sum, i) => sum + ((parseInt(i.quantity_ordered, 10) || 0) * (parseFloat(i.unit_cost) || 0)), 0).toFixed(2)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={bulkLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => executeDraftPoDirect(modalItems)}
                  disabled={bulkLoading || modalItems.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {bulkLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Draft PO...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{t('btn_create_po')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
