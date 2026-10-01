import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Send,
  PackageCheck,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Printer,
  Trash2,
  Sparkles,
  ShoppingBag,
  X,
} from 'lucide-react';
import HelperText from '../components/HelperText';
import { useLanguage } from '../context/LanguageContext';
import { broadcastInventoryUpdate } from '../utils/syncChannel';
import { formatDatePH, getLocalDateISO } from '../utils/dateFormatter';

/* ── Status badges ───────────────────────────── */
function StatusBadge({ status }) {
  const { t } = useLanguage();
  const map = {
    draft:              'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700',
    placed:             'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60',
    partially_received: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800/60',
    received:           'bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
    cancelled:          'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800/60',
  };
  const labels = {
    draft:              t('po_status_draft', 'Draft'),
    placed:             t('po_status_placed', 'Placed / Sent'),
    partially_received: t('po_status_partially_received', 'Partially Received'),
    received:           t('po_status_received', 'Received ✓'),
    cancelled:          t('po_status_cancelled', 'Cancelled'),
  };
  const cls = map[status] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded border tabular-nums ${cls}`}>
      {labels[status] || status}
    </span>
  );
}

function MetricCard({ label, value, sub, accentCls, borderCls, bgCls }) {
  return (
    <div className={`${bgCls} ${borderCls} rounded-xl border shadow-xs p-4`}>
      <span className={`text-[10px] font-bold uppercase tracking-widest block ${accentCls}`}>{label}</span>
      <span className={`text-2xl font-black block mt-1 tabular-nums ${accentCls.replace('text-', 'text-').replace('-700', '-950').replace('-800', '-950')}`}>{value}</span>
      {sub && <span className="text-[10px] text-zinc-500 dark:text-slate-400 block mt-0.5">{sub}</span>}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white';
const SUPPLIERS = ['United Laboratories (Unilab)', 'Zuellig Pharma', 'Medix Distribution', 'Pharmalink Inc.', 'MedPro Pharma', 'GlobalRx Distributors'];

export default function PurchaseOrdersView({
  medicines,
  currentUser,
  onRefreshInventory,
  uiMode = 'clean',
  activeSubTab = 'po-active',
  onSubTabChange
}) {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recomMeta, setRecomMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!activeSubTab) return;
    if (activeSubTab === 'po-drafts') {
      setStatusFilter('draft');
    } else if (activeSubTab === 'po-history') {
      setStatusFilter('received');
    } else if (activeSubTab === 'po-active') {
      setStatusFilter('all');
    }
  }, [activeSubTab]);

  const handleTabClick = (key) => {
    setStatusFilter(key);
    if (onSubTabChange) {
      if (key === 'draft') onSubTabChange('po-drafts');
      else if (key === 'received' || key === 'cancelled') onSubTabChange('po-history');
      else onSubTabChange('po-active');
    }
  };
  const [expandedPoId, setExpandedPoId] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [printPo, setPrintPo] = useState(null);

  const [activePoForAction, setActivePoForAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [newPoSupplier, setNewPoSupplier] = useState('United Laboratories (Unilab)');
  const [newPoNotes, setNewPoNotes] = useState('');
  const [newPoItems, setNewPoItems] = useState([{ medicine_id: '', quantity_ordered: 50, unit_cost: 10 }]);

  const [deliveryItems, setDeliveryItems] = useState({});
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [supplierDrNumber, setSupplierDrNumber] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  const fetchOrdersAndRecommendations = async () => {
    setLoading(true);
    try {
      const [ordersRes, recomRes] = await Promise.all([
        fetch(`/api/purchase-orders?status=${statusFilter}`),
        fetch('/api/purchase-orders/recommendations')
      ]);
      const [ordersData, recomData] = await Promise.all([ordersRes.json(), recomRes.json()]);
      setOrders(ordersData.orders || []);
      setRecommendations(recomData.recommendations || []);
      setRecomMeta(recomData || null);
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
      setActionError('Failed to load purchase orders.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrdersAndRecommendations(); }, [statusFilter]);

  const handleOpenCreateModal = (prefillItems = null, supplier = null) => {
    if (prefillItems && prefillItems.length > 0) {
      setNewPoSupplier(supplier || prefillItems[0].supplier_name || 'United Laboratories (Unilab)');
      setNewPoItems(prefillItems.map(item => ({ medicine_id: item.medicine_id, quantity_ordered: item.suggested_quantity || 50, unit_cost: item.estimated_unit_cost || 10 })));
      setNewPoNotes('Generated from clinic replenishment recommendations.');
    } else {
      setNewPoSupplier('United Laboratories (Unilab)');
      setNewPoItems([{ medicine_id: medicines && medicines.length > 0 ? medicines[0].id : '', quantity_ordered: 50, unit_cost: 10 }]);
      setNewPoNotes('');
    }
    setActionError(null);
    setIsCreateModalOpen(true);
  };

  const handleBulkDraftRecommendations = async (items) => {
    if (!items || items.length === 0) return;
    const supplierGroups = {};
    for (const item of items) {
      const supp = item.supplier_name || 'Generic Distributor';
      if (!supplierGroups[supp]) supplierGroups[supp] = [];
      supplierGroups[supp].push({ medicine_id: item.medicine_id, quantity_ordered: parseInt(item.suggested_quantity || 50, 10), unit_cost: parseFloat(item.estimated_unit_cost || 10) });
    }
    const uniqueSuppliers = Object.keys(supplierGroups);
    if (uniqueSuppliers.length <= 1) { handleOpenCreateModal(items, uniqueSuppliers[0]); return; }
    if (!window.confirm(`Replenishment recommendations involve ${uniqueSuppliers.length} different distributors (${uniqueSuppliers.join(', ')}). Automatically generate separated draft Purchase Orders for each distributor?`)) return;
    setActionLoading(true); setActionError(null);
    try {
      const created = [];
      for (const [suppName, suppItems] of Object.entries(supplierGroups)) {
        const res = await fetch('/api/purchase-orders', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplier_name: suppName, items: suppItems, notes: 'Consolidated replenishment PO generated via Dynamic Replenishment Planner', operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create PO');
        created.push(data.po.po_number);
      }
      setActionSuccess(`Created ${created.length} draft Purchase Order(s) grouped by supplier: ${created.join(', ')}.`);
      fetchOrdersAndRecommendations();
      if (onRefreshInventory) onRefreshInventory();
    } catch (err) { setActionError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleAddItemRow = () => setNewPoItems(prev => [...prev, { medicine_id: medicines && medicines.length > 0 ? medicines[0].id : '', quantity_ordered: 50, unit_cost: 10 }]);
  const handleRemoveItemRow = (index) => setNewPoItems(prev => prev.filter((_, i) => i !== index));
  const handleItemChange = (index, field, value) => {
    setNewPoItems(prev => {
      const copy = [...prev];
      if (field === 'medicine_id') {
        const sel = (medicines || []).find(m => m.id === parseInt(value, 10));
        copy[index] = { ...copy[index], medicine_id: value, unit_cost: sel?.latest_unit_cost || copy[index]?.unit_cost || 10 };
      } else { copy[index] = { ...copy[index], [field]: value }; }
      return copy;
    });
  };

  const handleSubmitCreatePo = async (e) => {
    e.preventDefault(); setActionLoading(true); setActionError(null);
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_name: newPoSupplier, notes: newPoNotes, operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista', items: newPoItems.map(i => ({ medicine_id: parseInt(i.medicine_id), quantity_ordered: parseInt(i.quantity_ordered), unit_cost: parseFloat(i.unit_cost) })) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Purchase Order');
      setActionSuccess(data.message); setIsCreateModalOpen(false);
      fetchOrdersAndRecommendations();
      if (onRefreshInventory) onRefreshInventory();
    } catch (err) { setActionError(err.message); }
    finally { setActionLoading(false); }
  };

  const handlePlaceOrder = async (po) => {
    if (!window.confirm(`Mark Purchase Order ${po.po_number} as PLACED with ${po.supplier_name}?`)) return;
    setActionLoading(true); setActionError(null);
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}/place`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place Purchase Order');
      setActionSuccess(data.message); fetchOrdersAndRecommendations();
    } catch (err) { setActionError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleOpenReceiveModal = (po) => {
    setActivePoForAction(po);
    const today = getLocalDateISO();
    const futureExp = new Date(); futureExp.setMonth(futureExp.getMonth() + 18);
    const defaultExp = getLocalDateISO(futureExp);
    const initialDelivery = {};
    po.items.forEach(item => {
      const remaining = Math.max(0, item.quantity_ordered - item.quantity_received);
      initialDelivery[item.id] = { item_id: item.id, quantity_to_receive: remaining, batch_number: `LOT-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`, expiration_date: defaultExp, manufacturing_date: today, unit_cost: item.unit_cost, selling_price: (item.unit_cost * 1.35).toFixed(2), quality_inspection_passed: true };
    });
    setDeliveryItems(initialDelivery);
    setDeliveryNotes(`Delivery receipt against PO ${po.po_number}`);
    setSupplierDrNumber(po.supplier_dr_number || '');
    setActionError(null); setIsReceiveModalOpen(true);
  };

  const handleDeliveryItemChange = (itemId, field, value) =>
    setDeliveryItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));

  const handleSubmitReceiveDelivery = async (e) => {
    e.preventDefault(); setActionLoading(true); setActionError(null);
    try {
      const todayStr = getLocalDateISO();
      const receivedItemsPayload = Object.values(deliveryItems).filter(i => parseInt(i.quantity_to_receive) > 0).map(i => ({ item_id: i.item_id, quantity_to_receive: parseInt(i.quantity_to_receive), quantity_received: parseInt(i.quantity_to_receive), batch_number: (i.batch_number || '').trim(), expiration_date: i.expiration_date, manufacturing_date: i.manufacturing_date || todayStr, unit_cost: parseFloat(i.unit_cost) || 0, selling_price: parseFloat(i.selling_price) || 0, quality_inspection_passed: Boolean(i.quality_inspection_passed), supplier_dr_number: supplierDrNumber.trim() || undefined }));
      if (receivedItemsPayload.length === 0) throw new Error('Please enter quantity greater than zero for at least one item being received.');
      for (const item of receivedItemsPayload) {
        if (!item.batch_number || !item.expiration_date) throw new Error('All receiving rows must have a valid Batch / Lot Number and Expiration Date.');
        if (item.expiration_date <= todayStr) throw new Error(`Batch ${item.batch_number} has an expiration date in the past or today. Cannot receive expired inventory.`);
      }
      const res = await fetch(`/api/purchase-orders/${activePoForAction.id}/receive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delivery_notes: deliveryNotes, supplier_dr_number: supplierDrNumber.trim() || undefined, operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista', deliveries: receivedItemsPayload, received_items: receivedItemsPayload }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record delivery');
      setActionSuccess(data.message); setIsReceiveModalOpen(false);
      fetchOrdersAndRecommendations();
      if (onRefreshInventory) onRefreshInventory();
      broadcastInventoryUpdate('PO_DELIVERY_RECEIVED', { poId: activePoForAction.id, drNumber: supplierDrNumber.trim() });
    } catch (err) { setActionError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleOpenCancelModal = (po) => { setActivePoForAction(po); setCancellationReason(''); setActionError(null); setIsCancelModalOpen(true); };

  const handleSubmitCancelOutstanding = async (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) { setActionError('A mandatory justification reason is required.'); return; }
    setActionLoading(true); setActionError(null);
    try {
      const res = await fetch(`/api/purchase-orders/${activePoForAction.id}/cancel-outstanding`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cancellation_reason: cancellationReason.trim(), operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel outstanding lines');
      setActionSuccess(data.message); setIsCancelModalOpen(false); fetchOrdersAndRecommendations();
    } catch (err) { setActionError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleDeleteDraftPo = async (po) => {
    if (!window.confirm(`Delete draft purchase order ${po.po_number}?`)) return;
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete draft');
      setActionSuccess(data.message); fetchOrdersAndRecommendations();
    } catch (err) { setActionError(err.message); }
  };

  const draftCount    = orders.filter(o => o.status === 'draft').length;
  const placedCount   = orders.filter(o => o.status === 'placed' || o.status === 'partially_received').length;
  const receivedCount = orders.filter(o => o.status === 'received').length;
  const totalAmount   = orders.reduce((s, o) => s + Number(o.total_amount ?? o.total_cost ?? 0), 0);

  const filterTabs = [
    { key: 'all',      label: t('po_filter_all', 'All Orders'),           count: orders.length },
    { key: 'draft',    label: t('po_filter_draft', 'Draft Orders'),       count: draftCount },
    { key: 'placed',   label: t('po_filter_sent', 'Placed / Sent'),       count: placedCount },
    { key: 'received', label: t('po_filter_received', 'Received / Delivered'), count: receivedCount },
    { key: 'cancelled',label: t('po_filter_cancelled', 'Cancelled'),      count: null },
  ];

  return (
    <div className={uiMode === 'clean' ? 'space-y-4 pb-8' : 'space-y-5 pb-12'}>

      {/* ══ Page Header ══ */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3.5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            {t('purchase_orders_title', 'Purchase Orders & Procurement')}
          </h2>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-0.5">
            {t('po_subtitle', 'Manage replenishment orders, supplier purchase slips, and stock intake')}
          </HelperText>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            {t('btn_create_po', '+ Create Purchase Order')}
          </button>
          <button onClick={fetchOrdersAndRecommendations}
            className="p-2 text-zinc-500 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition cursor-pointer" title={t('btn_refresh', 'Refresh')}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ══ Notices ══ */}
      {actionSuccess && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" /><span>{actionSuccess}</span></div>
          <button onClick={() => setActionSuccess(null)} className="text-teal-500 hover:text-teal-800 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /><span>{actionError}</span></div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-700 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ══ Metrics Strip ══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label={t('total_pos_metric', 'Total POs')} value={orders.length} sub={`₱${totalAmount.toFixed(2)} total`} accentCls="text-zinc-600" bgCls="bg-white" borderCls="border-zinc-200" />
        <MetricCard label={t('po_filter_sent', 'Placed / Sent')} value={placedCount} sub="Awaiting delivery" accentCls="text-amber-700" bgCls="bg-amber-50/60" borderCls="border-amber-200" />
        <MetricCard label={t('po_filter_draft', 'Draft Orders')} value={draftCount} sub="Pending placement" accentCls="text-zinc-600" bgCls="bg-zinc-50" borderCls="border-zinc-200" />
        <MetricCard label={t('po_filter_received', 'Received / Delivered')} value={receivedCount} sub="In inventory" accentCls="text-teal-700" bgCls="bg-teal-50/60" borderCls="border-teal-200" />
      </div>

      {/* ══ Replenishment Recommendation Banner ══ */}
      {recommendations.length > 0 && (
        <div className="bg-white border border-teal-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{t('po_recom_title', 'Dynamic Replenishment Recommendations')} <span className="text-teal-700">({recommendations.length} Items)</span></h3>
              <HelperText uiMode={uiMode} className="text-xs text-slate-500">
                {t('po_recom_subtitle', 'Based on daily demand velocity and supplier lead times')}
                {recomMeta?.window_days ? ` (${recomMeta.window_days}-day rolling sales window)` : ''}
              </HelperText>
            </div>
          </div>
          <button onClick={() => handleBulkDraftRecommendations(recommendations)} disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer disabled:opacity-50">
            <ShoppingBag className="w-4 h-4" />
            {t('btn_accept_all_draft_po', 'Accept All Suggested / Bulk Draft PO')}
          </button>
        </div>
      )}

      {/* ══ Filter Tabs ══ */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-zinc-200">
        {filterTabs.map(tab => (
          <button key={tab.key} onClick={() => handleTabClick(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              statusFilter === tab.key
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 hover:border-zinc-300'
            }`}>
            {tab.label}
            {tab.count !== null && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full tabular-nums font-bold ${statusFilter === tab.key ? 'bg-teal-600 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ Purchase Orders Ledger ══ */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 text-xs">{t('loading_po', 'Loading purchase order records…')}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-zinc-200 shadow-xs space-y-3">
          <FileText className="w-10 h-10 text-zinc-200 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">{t('no_po_recorded', 'No Purchase Orders Recorded')}</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">{t('no_po_desc', 'Create an internal pharmacy purchase order to track incoming batches and streamline delivery receiving.')}</p>
          <button onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /><span>{t('btn_create_po', '+ Create Purchase Order')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(po => {
            const isExpanded = expandedPoId === po.id;
            const items = po.items || [];
            const totalItemsQty    = items.reduce((s, i) => s + i.quantity_ordered, 0);
            const totalReceivedQty = items.reduce((s, i) => s + (i.quantity_received || 0), 0);

            return (
              <div key={po.id} className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
                {/* PO Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <button onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                      className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition cursor-pointer shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular-nums font-bold text-sm text-slate-900">{po.po_number}</span>
                        <StatusBadge status={po.status} />
                        {po.supplier_dr_number && (
                          <span className="px-2 py-0.5 text-[9px] font-bold tabular-nums uppercase bg-teal-50 text-teal-800 border border-teal-200 rounded">
                            DR/SI: {po.supplier_dr_number}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-zinc-500">• {po.supplier_name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {formatDatePH(po.created_at, 'compact')}
                        </span>
                        <span>•</span>
                        <span>{t('total_label', 'Total:')} <strong className="text-slate-700 tabular-nums">₱{Number(po.total_amount ?? po.total_cost ?? 0).toFixed(2)}</strong></span>
                        <span>•</span>
                        <span className="tabular-nums">{totalReceivedQty} / {totalItemsQty} {t('units_received', 'units received')}</span>
                        {(po.operator_name || po.created_by) && (
                          <><span>•</span><span>{t('by_operator', 'By:')} {po.operator_name || po.created_by}</span></>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status-based actions */}
                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button onClick={() => setPrintPo(po)}
                      className="p-1.5 text-zinc-500 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition cursor-pointer" title={t('title_print_po', 'Print Purchase Order Slip')}>
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {po.status === 'draft' && (
                      <>
                        <button onClick={() => handlePlaceOrder(po)} disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50">
                          <Send className="w-3.5 h-3.5" /><span>{t('btn_place_order', 'Place Order')}</span>
                        </button>
                        <button onClick={() => handleDeleteDraftPo(po)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer" title={t('title_delete_draft_po', 'Delete Draft PO')}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {(po.status === 'placed' || po.status === 'partially_received') && (
                      <>
                        <button onClick={() => handleOpenReceiveModal(po)} disabled={actionLoading}
                          className="px-3.5 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50">
                          <PackageCheck className="w-3.5 h-3.5" /><span>{t('btn_receive_delivery', 'Receive Delivery')}</span>
                        </button>
                        <button onClick={() => handleOpenCancelModal(po)}
                          className="px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition flex items-center gap-1 cursor-pointer">
                          <XCircle className="w-3.5 h-3.5" /><span>{t('cancel_outstanding', 'Cancel Outstanding')}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expandable Line Items Drawer */}
                {isExpanded && (
                  <div className="bg-zinc-50/60 border-t border-zinc-200 p-4 space-y-3">
                    {po.notes && (
                      <p className="text-xs text-zinc-500 bg-white px-3 py-2 rounded-lg border border-zinc-200">
                        <strong className="text-slate-700">{t('order_notes', 'Order Notes:')}</strong> {po.notes}
                      </p>
                    )}
                    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 uppercase text-[9px] tracking-widest font-bold">
                            <th className="py-2 px-3">{t('col_item_med', 'Item / Medicine')}</th>
                            <th className="py-2 px-3 text-right">{t('col_ordered', 'Ordered')}</th>
                            <th className="py-2 px-3 text-right">{t('col_received', 'Received')}</th>
                            <th className="py-2 px-3 text-right">{t('inv_unit_cost', 'Unit Cost')}</th>
                            <th className="py-2 px-3 text-right">{t('col_line_total', 'Line Total')}</th>
                            <th className="py-2 px-3">{t('inv_status', 'Status')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {items.map(item => (
                            <tr key={item.id} className="hover:bg-zinc-50 transition">
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-900">{item.brand_name}</span>
                                <span className="text-[10px] text-zinc-400 block">{item.generic_name} ({item.dosage_strength})</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold tabular-nums text-slate-800">{item.quantity_ordered}</td>
                              <td className="py-2.5 px-3 text-right font-bold tabular-nums text-teal-700">{item.quantity_received}</td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-zinc-500">₱{Number(item.unit_cost).toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right tabular-nums font-bold tabular-nums text-slate-900">₱{Number(item.total_cost).toFixed(2)}</td>
                              <td className="py-2.5 px-3">
                                {item.is_cancelled ? (
                                  <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded font-bold uppercase">{t('po_status_cancelled', 'Cancelled')}</span>
                                ) : item.quantity_received >= item.quantity_ordered ? (
                                  <span className="text-[9px] bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded font-bold uppercase">{t('po_status_fully_received', 'Fully Received')}</span>
                                ) : item.quantity_received > 0 ? (
                                  <span className="text-[9px] bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded font-bold uppercase">{t('po_status_partial', 'Partial')}</span>
                                ) : (
                                  <span className="text-[9px] bg-zinc-100 text-zinc-600 border border-zinc-200 px-1.5 py-0.5 rounded font-semibold uppercase">{t('po_status_pending', 'Pending')}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ CREATE PO MODAL ══ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/90 dark:border-white/10">
            <div className="bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 text-slate-900 dark:text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('po_create_internal_title', 'Create Internal Purchase Order (PO)')}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('po_create_internal_desc', 'Generate draft purchase order for supplier quotation and batch receiving.')}</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmitCreatePo} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t('po_supplier_name_label', 'Supplier / Distributor Name *')}</label>
                <select value={newPoSupplier} onChange={e => setNewPoSupplier(e.target.value)} required className={`${inputCls} cursor-pointer`}>
                  {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('po_col_items', 'Order Line Items')} ({newPoItems.length})</label>
                  <button type="button" onClick={handleAddItemRow} className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /><span>{t('po_add_item_btn', 'Add Item')}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg text-[9px] font-bold uppercase tracking-widest text-zinc-500 border border-zinc-200">
                  <div className="flex-1">{t('po_col_catalog_item', 'Medicine Catalog Item')}</div>
                  <div className="w-28 text-center">{t('po_col_ordered', 'Order Qty')}</div>
                  <div className="w-32 text-center">{t('fefo_est_unit_cost', 'Unit Cost (₱)')}</div>
                  {newPoItems.length > 1 && <div className="w-7" />}
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                  {newPoItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                      <div className="flex-1">
                        <select value={item.medicine_id} onChange={e => handleItemChange(idx, 'medicine_id', e.target.value)} required
                          className="w-full px-2 py-1.5 border border-zinc-200 rounded-lg bg-white text-xs text-slate-800 focus:ring-1 focus:ring-teal-500 cursor-pointer">
                          <option value="">{t('po_choose_med_prompt', '— Choose Medicine —')}</option>
                          {(medicines || []).map(m => <option key={m.id} value={m.id}>{m.brand_name} - {m.generic_name} ({m.dosage_strength})</option>)}
                        </select>
                      </div>
                      <div className="w-28">
                        <div className="flex items-center rounded-lg border border-zinc-200 bg-white overflow-hidden focus-within:ring-1 focus-within:ring-teal-500">
                          <span className="px-2 py-1.5 bg-zinc-100 text-zinc-500 font-bold text-[10px] border-r border-zinc-200 select-none">{t('col_qty', 'Qty')}</span>
                          <input type="number" min="1" required value={item.quantity_ordered} onChange={e => handleItemChange(idx, 'quantity_ordered', e.target.value)}
                            className="w-full px-2 py-1.5 border-0 bg-transparent text-right font-bold tabular-nums focus:outline-none" />
                        </div>
                      </div>
                      <div className="w-32">
                        <div className="flex items-center rounded-lg border border-zinc-200 bg-white overflow-hidden focus-within:ring-1 focus-within:ring-teal-500">
                          <span className="px-2 py-1.5 bg-zinc-100 text-teal-700 font-bold text-xs border-r border-zinc-200 select-none">₱</span>
                          <input type="number" step="0.01" min="0.01" required value={item.unit_cost} onChange={e => handleItemChange(idx, 'unit_cost', e.target.value)}
                            className="w-full px-2 py-1.5 border-0 bg-transparent text-right tabular-nums focus:outline-none" />
                        </div>
                      </div>
                      {newPoItems.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItemRow(idx)} className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t('po_label_order_notes', 'Procurement Notes (Optional)')}</label>
                <input type="text" placeholder={t('ph_po_notes', 'e.g. Rush delivery, 30 days payment term')} value={newPoNotes} onChange={e => setNewPoNotes(e.target.value)} className={inputCls} />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer">{t('btn_cancel', 'Cancel')}</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer">
                  {actionLoading ? (t('loading') || 'Creating…') : (t('btn_create_po', 'Save Draft Purchase Order'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ RECEIVE DELIVERY MODAL ══ */}
      {isReceiveModalOpen && activePoForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/90 dark:border-white/10">
            <div className="bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 text-slate-900 dark:text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Receive Order Delivery ({activePoForAction.po_number})</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('po_batch_assign_desc', 'Assign supplier Lot / Batch numbers and verify expiration dates into active stock.')}</p>
                </div>
              </div>
              <button onClick={() => setIsReceiveModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmitReceiveDelivery} className="p-5 space-y-4">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {activePoForAction.items.map(item => {
                  const delState = deliveryItems[item.id] || {};
                  const remaining = Math.max(0, item.quantity_ordered - item.quantity_received);
                  return (
                    <div key={item.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div><span className="font-bold text-xs text-slate-900">{item.brand_name}</span><span className="text-[10px] text-zinc-400 ml-1">({item.generic_name})</span></div>
                        <span className="text-[10px] text-zinc-500 font-semibold">Ordered: {item.quantity_ordered} | Remaining: <strong className="text-teal-700">{remaining}</strong></span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {[['Qty to Receive *', 'quantity_to_receive', 'number'], ['Batch / Lot # *', 'batch_number', 'text'], ['Expiration Date *', 'expiration_date', 'date'], ['Selling Price (₱) *', 'selling_price', 'number']].map(([label, field, type]) => (
                          <div key={field}>
                            <label className="block text-[9px] font-bold uppercase text-zinc-400 mb-0.5 tracking-widest">{label}</label>
                            <input type={type} step={field === 'selling_price' ? '0.01' : undefined} min={field === 'quantity_to_receive' ? 0 : field === 'selling_price' ? '0.01' : undefined} max={field === 'quantity_to_receive' ? remaining : undefined}
                              required={field !== 'manufacturing_date'} value={delState[field] || ''}
                              onChange={e => handleDeliveryItemChange(item.id, field, e.target.value)}
                              className={`w-full px-2 py-1.5 border border-zinc-200 rounded-lg bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs ${field === 'batch_number' ? 'tabular-nums' : ''} ${field === 'selling_price' ? 'font-bold text-teal-800' : ''}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                    {t('po_dr_si_label', 'Supplier DR / Sales Invoice # (FDA / COA Required)')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('ph_dr_si_example', 'e.g. DR-2026-98124 or SI-88410')}
                    value={supplierDrNumber}
                    onChange={e => setSupplierDrNumber(e.target.value)}
                    className={`${inputCls} tabular-nums`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                    {t('po_delivery_notes_label', 'Delivery Notes / Cold-Chain Reference')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('ph_po_delivery_notes', 'e.g. Delivered direct, sealed insulated box')}
                    value={deliveryNotes}
                    onChange={e => setDeliveryNotes(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsReceiveModalOpen(false)} className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer">{t('btn_cancel', 'Cancel')}</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer">
                  {actionLoading ? (t('loading') || 'Recording Delivery…') : (t('po_btn_receive_delivery', 'Confirm Delivery Intake'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ CANCEL OUTSTANDING MODAL ══ */}
      {isCancelModalOpen && activePoForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-zinc-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm">Cancel Outstanding Lines ({activePoForAction.po_number})</h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">{t('po_cancel_warning', 'This will cancel remaining unfulfilled items on this purchase order. This action requires an audit justification and cannot be undone.')}</p>
            <form onSubmit={handleSubmitCancelOutstanding} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t('po_cancel_justification_label', 'Cancellation Justification *')}</label>
                <textarea required rows="3" placeholder={t('ph_po_cancel_reason', 'e.g. Supplier out of stock; manufacturer phased out packaging size...')} value={cancellationReason} onChange={e => setCancellationReason(e.target.value)}
                  className="w-full p-2.5 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsCancelModalOpen(false)} className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer">{t('btn_cancel', 'Cancel')}</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer">
                  {actionLoading ? (t('loading') || 'Processing…') : (t('po_btn_cancel_outstanding', 'Confirm Cancel'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ PRINT PO SLIP MODAL ══ */}
      {printPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
            <div className="p-4 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex justify-between items-center no-print">
              <span className="font-bold text-xs flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="w-6 h-6 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span>Purchase Order Document ({printPo.po_number})</span>
              </span>
              <button onClick={() => setPrintPo(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 tabular-nums text-xs text-slate-800 printable-area bg-white space-y-4">
              <div className="text-center pb-3 border-b border-dashed border-zinc-300">
                <h4 className="font-extrabold text-sm uppercase">{t('app_title', 'R.K.A PHARMACY')}</h4>
                <p className="text-[10px] text-zinc-500">San Antonio, Agoo, La Union</p>
                <p className="text-[9px] text-zinc-400">{t('po_slip_title', 'Pharmacy Purchase Order (PO)')}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-dashed border-zinc-300 pb-3">
                <div><span className="text-zinc-400 block">{t('po_col_id', 'PO Number')}:</span><span className="font-bold text-slate-900">{printPo.po_number}</span></div>
                <div><span className="text-zinc-400 block">{t('po_col_date', 'Date')}:</span><span>{formatDatePH(printPo.created_at, 'medium')}</span></div>
                <div><span className="text-zinc-400 block">{t('col_supplier', 'Supplier')}:</span><span className="font-bold">{printPo.supplier_name}</span></div>
                <div><span className="text-zinc-400 block">{t('po_col_status', 'Status')}:</span><span className="uppercase font-bold">{printPo.status}</span></div>
              </div>
              <div className="space-y-2 border-b border-dashed border-zinc-300 pb-3">
                <div className="grid grid-cols-12 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                  <span className="col-span-6">{t('col_item_med', 'Medicine')}</span><span className="col-span-2 text-right">{t('col_qty', 'Qty')}</span><span className="col-span-2 text-right">{t('fefo_col_cost', 'Cost')}</span><span className="col-span-2 text-right">{t('col_line_total', 'Total')}</span>
                </div>
                {printPo.items?.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px]">
                    <span className="col-span-6 font-bold">{item.brand_name}</span>
                    <span className="col-span-2 text-right tabular-nums">{item.quantity_ordered}</span>
                    <span className="col-span-2 text-right tabular-nums">₱{Number(item.unit_cost).toFixed(2)}</span>
                    <span className="col-span-2 text-right font-bold tabular-nums">₱{Number(item.total_cost).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-sm font-black pt-1">
                <span>{t('po_total_est_cost', 'TOTAL ESTIMATED COST:')}</span>
                <span className="tabular-nums">₱{Number(printPo.total_amount ?? printPo.total_cost ?? 0).toFixed(2)}</span>
              </div>
              {printPo.notes && <div className="text-[9px] text-zinc-400 bg-zinc-50 p-2 rounded">{t('order_notes', 'Notes:')} {printPo.notes}</div>}
            </div>

            <div className="p-3.5 bg-slate-50/90 dark:bg-[#1e2430] border-t border-slate-100 dark:border-white/10 flex gap-2 no-print">
              <button type="button" onClick={() => window.print()}
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
                <Printer className="w-4 h-4" /><span>{t('po_print_doc_btn', 'Print Document')}</span>
              </button>
              <button type="button" onClick={() => setPrintPo(null)}
                className="px-4 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#21262d] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer">
                {t('btn_done', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
