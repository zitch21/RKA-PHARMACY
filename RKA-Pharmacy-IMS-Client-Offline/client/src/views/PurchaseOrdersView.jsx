import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Send,
  PackageCheck,
  XCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Printer,
  Trash2,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import HelperText from '../components/HelperText';

export default function PurchaseOrdersView({ medicines, currentUser, onRefreshInventory, uiMode = 'clean' }) {
  const [orders, setOrders] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recomMeta, setRecomMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedPoId, setExpandedPoId] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [printPo, setPrintPo] = useState(null);

  const [activePoForAction, setActivePoForAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // New PO Form
  const [newPoSupplier, setNewPoSupplier] = useState('United Laboratories (Unilab)');
  const [newPoNotes, setNewPoNotes] = useState('');
  const [newPoItems, setNewPoItems] = useState([
    { medicine_id: '', quantity_ordered: 50, unit_cost: 10 }
  ]);

  // Delivery Receiving Form (keyed by item_id)
  const [deliveryItems, setDeliveryItems] = useState({});
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Cancel Outstanding Form
  const [cancellationReason, setCancellationReason] = useState('');

  const fetchOrdersAndRecommendations = async () => {
    setLoading(true);
    try {
      const [ordersRes, recomRes] = await Promise.all([
        fetch(`/api/purchase-orders?status=${statusFilter}`),
        fetch('/api/purchase-orders/recommendations')
      ]);

      const [ordersData, recomData] = await Promise.all([
        ordersRes.json(),
        recomRes.json()
      ]);

      setOrders(ordersData.orders || []);
      setRecommendations(recomData.recommendations || []);
      setRecomMeta(recomData || null);
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
      setActionError('Failed to load purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndRecommendations();
  }, [statusFilter]);

  // Create PO from Scratch or Recommendations
  const handleOpenCreateModal = (prefillItems = null, supplier = null) => {
    if (prefillItems && prefillItems.length > 0) {
      setNewPoSupplier(supplier || prefillItems[0].supplier_name || 'United Laboratories (Unilab)');
      setNewPoItems(
        prefillItems.map(item => ({
          medicine_id: item.medicine_id,
          quantity_ordered: item.suggested_quantity || 50,
          unit_cost: item.estimated_unit_cost || 10
        }))
      );
      setNewPoNotes('Generated from clinic replenishment recommendations.');
    } else {
      setNewPoSupplier('United Laboratories (Unilab)');
      const defaultMedId = medicines && medicines.length > 0 ? medicines[0].id : '';
      setNewPoItems([{ medicine_id: defaultMedId, quantity_ordered: 50, unit_cost: 10 }]);
      setNewPoNotes('');
    }
    setActionError(null);
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    const defaultMedId = medicines && medicines.length > 0 ? medicines[0].id : '';
    setNewPoItems(prev => [...prev, { medicine_id: defaultMedId, quantity_ordered: 50, unit_cost: 10 }]);
  };

  const handleRemoveItemRow = (index) => {
    setNewPoItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setNewPoItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmitCreatePo = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    try {
      const payload = {
        supplier_name: newPoSupplier,
        notes: newPoNotes,
        operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista',
        items: newPoItems.map(i => ({
          medicine_id: parseInt(i.medicine_id),
          quantity_ordered: parseInt(i.quantity_ordered),
          unit_cost: parseFloat(i.unit_cost)
        }))
      };

      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Purchase Order');

      setActionSuccess(data.message);
      setIsCreateModalOpen(false);
      fetchOrdersAndRecommendations();
      if (onRefreshInventory) onRefreshInventory();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Place Order with Supplier
  const handlePlaceOrder = async (po) => {
    if (!window.confirm(`Mark Purchase Order ${po.po_number} as PLACED with ${po.supplier_name}?`)) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}/place`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place Purchase Order');

      setActionSuccess(data.message);
      fetchOrdersAndRecommendations();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Receive Delivery Modal
  const handleOpenReceiveModal = (po) => {
    setActivePoForAction(po);
    const initialDelivery = {};
    const today = new Date().toISOString().split('T')[0];

    // Default future expiration date (+1.5 years)
    const futureExp = new Date();
    futureExp.setMonth(futureExp.getMonth() + 18);
    const defaultExp = futureExp.toISOString().split('T')[0];

    po.items.forEach(item => {
      const remainingQty = Math.max(0, item.quantity_ordered - item.quantity_received);
      const randomLot = Math.floor(100 + Math.random() * 900);
      initialDelivery[item.id] = {
        item_id: item.id,
        quantity_to_receive: remainingQty,
        batch_number: `LOT-${Date.now().toString().slice(-4)}-${randomLot}`,
        expiration_date: defaultExp,
        manufacturing_date: today,
        unit_cost: item.unit_cost,
        selling_price: (item.unit_cost * 1.35).toFixed(2),
        quality_inspection_passed: true
      };
    });

    setDeliveryItems(initialDelivery);
    setDeliveryNotes(`Delivery receipt against PO ${po.po_number}`);
    setActionError(null);
    setIsReceiveModalOpen(true);
  };

  const handleDeliveryItemChange = (itemId, field, value) => {
    setDeliveryItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const handleSubmitReceiveDelivery = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    try {
      const receivedItemsPayload = Object.values(deliveryItems)
        .filter(i => parseInt(i.quantity_to_receive) > 0)
        .map(i => ({
          item_id: i.item_id,
          quantity_to_receive: parseInt(i.quantity_to_receive),
          batch_number: i.batch_number.trim(),
          expiration_date: i.expiration_date,
          manufacturing_date: i.manufacturing_date,
          unit_cost: parseFloat(i.unit_cost),
          selling_price: parseFloat(i.selling_price),
          quality_inspection_passed: Boolean(i.quality_inspection_passed)
        }));

      if (receivedItemsPayload.length === 0) {
        throw new Error('Please enter quantity greater than zero for at least one item being received.');
      }

      // Check dates
      for (const item of receivedItemsPayload) {
        if (!item.batch_number || !item.expiration_date) {
          throw new Error('All receiving rows must have a valid Batch / Lot Number and Expiration Date.');
        }
        if (new Date(item.expiration_date) <= new Date()) {
          throw new Error(`Batch ${item.batch_number} has an expiration date in the past. Cannot receive expired inventory.`);
        }
      }

      const res = await fetch(`/api/purchase-orders/${activePoForAction.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_notes: deliveryNotes,
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista',
          received_items: receivedItemsPayload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record delivery');

      setActionSuccess(data.message);
      setIsReceiveModalOpen(false);
      fetchOrdersAndRecommendations();
      if (onRefreshInventory) onRefreshInventory();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Cancel Outstanding Modal
  const handleOpenCancelModal = (po) => {
    setActivePoForAction(po);
    setCancellationReason('');
    setActionError(null);
    setIsCancelModalOpen(true);
  };

  const handleSubmitCancelOutstanding = async (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) {
      setActionError('A mandatory justification reason is required.');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/purchase-orders/${activePoForAction.id}/cancel-outstanding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellation_reason: cancellationReason.trim(),
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel outstanding lines');

      setActionSuccess(data.message);
      setIsCancelModalOpen(false);
      fetchOrdersAndRecommendations();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Draft PO
  const handleDeleteDraftPo = async (po) => {
    if (!window.confirm(`Delete draft purchase order ${po.po_number}?`)) return;

    try {
      const res = await fetch(`/api/purchase-orders/${po.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete draft');

      setActionSuccess(data.message);
      fetchOrdersAndRecommendations();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Helper for Status Badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300">Draft</span>;
      case 'placed':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">Placed with Supplier</span>;
      case 'partially_received':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">Partially Received</span>;
      case 'received':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Received (In Stock)</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const draftCount = orders.filter(o => o.status === 'draft').length;
  const placedCount = orders.filter(o => o.status === 'placed' || o.status === 'partially_received').length;
  const receivedCount = orders.filter(o => o.status === 'received').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Purchase Order (PO) Procurement Ledger</span>
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Clinic Procurement Standard
            </span>
          </div>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-1">
            Internal procurement tracking ledger for R.K.A Pharmacy (Draft → Placed → Delivery Receipt into Batches)
          </HelperText>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{uiMode === 'clean' ? 'Create PO' : 'Create Purchase Order'}</span>
          </button>
          <button
            onClick={fetchOrdersAndRecommendations}
            className="p-2 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 font-bold text-xs">✕</button>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Total POs Recorded</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{orders.length}</span>
        </div>
        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-2xs">
          <span className="text-amber-800 text-xs font-semibold uppercase tracking-wider block">Placed (Pending Delivery)</span>
          <span className="text-2xl font-black text-amber-950 mt-1 block">{placedCount}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider block">Draft Orders</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{draftCount}</span>
        </div>
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-emerald-800 text-xs font-semibold uppercase tracking-wider block">Fully Received</span>
          <span className="text-2xl font-black text-emerald-950 mt-1 block">{receivedCount}</span>
        </div>
      </div>

      {/* Replenishment Recommendation Banner */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-slate-900 text-sm">
                Replenishment Recommendations Available ({recommendations.length} Items Below Reorder Point)
              </h3>
            </div>
            <HelperText uiMode={uiMode} className="text-xs text-slate-600">
              {recomMeta?.is_cold_start
                ? 'Baseline Mode: Recommendations calculated based on manual thresholds.'
                : `FEFO+ Dynamic Engine: Recommendations calculated based on ${recomMeta?.forecasting_window_days}-day moving average sales velocity and lead times.`}
            </HelperText>
          </div>

          <button
            onClick={() => handleOpenCreateModal(recommendations)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{uiMode === 'clean' ? 'Generate PO' : 'Generate PO for Low Stock Items'}</span>
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {['all', 'draft', 'placed', 'partially_received', 'received', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
              statusFilter === f
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Purchase Orders Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading purchase order records...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">No Purchase Orders Recorded</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create an internal clinic purchase order to track incoming batches and streamline delivery receiving.
          </p>
          <button
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{uiMode === 'clean' ? 'Create PO' : 'Create Purchase Order'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(po => {
            const isExpanded = expandedPoId === po.id;
            const items = po.items || [];
            const totalItemsCount = items.reduce((s, i) => s + i.quantity_ordered, 0);
            const totalReceivedCount = items.reduce((s, i) => s + (i.quantity_received || 0), 0);

            return (
              <div
                key={po.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition"
              >
                {/* PO Header Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">{po.po_number}</span>
                        {getStatusBadge(po.status)}
                        <span className="text-xs font-semibold text-slate-600">• {po.supplier_name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>Created: {new Date(po.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Total: <strong>₱{Number(po.total_cost || 0).toFixed(2)}</strong></span>
                        <span>•</span>
                        <span>Items: {totalReceivedCount} / {totalItemsCount} units received</span>
                        {po.operator_name && (
                          <>
                            <span>•</span>
                            <span>By: {po.operator_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions according to status */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    {/* Print PO Slip */}
                    <button
                      onClick={() => setPrintPo(po)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                      title="Print Purchase Order Slip"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {po.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handlePlaceOrder(po)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-1 shadow-2xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Place Order</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDraftPo(po)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                          title="Delete Draft PO"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {(po.status === 'placed' || po.status === 'partially_received') && (
                      <>
                        <button
                          onClick={() => handleOpenReceiveModal(po)}
                          disabled={actionLoading}
                          className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>Receive Delivery</span>
                        </button>
                        <button
                          onClick={() => handleOpenCancelModal(po)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-lg transition flex items-center gap-1"
                          title="Cancel Remaining Unfulfilled Lines"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel Outstanding</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Details: Line Items */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200 p-4 space-y-3 animate-in fade-in">
                    {po.notes && (
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        <strong>Order Notes:</strong> {po.notes}
                      </p>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                            <th className="py-2 px-3">Item / Medicine</th>
                            <th className="py-2 px-3 text-right">Ordered</th>
                            <th className="py-2 px-3 text-right">Received</th>
                            <th className="py-2 px-3 text-right">Unit Cost</th>
                            <th className="py-2 px-3 text-right">Line Total</th>
                            <th className="py-2 px-3">Line Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {items.map(item => (
                            <tr key={item.id}>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-900">{item.brand_name}</span>
                                <span className="text-[11px] text-slate-500 block">{item.generic_name} ({item.dosage_strength})</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{item.quantity_ordered}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{item.quantity_received}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600">₱{Number(item.unit_cost).toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₱{Number(item.total_cost).toFixed(2)}</td>
                              <td className="py-2.5 px-3">
                                {item.is_cancelled ? (
                                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">Cancelled</span>
                                ) : item.quantity_received >= item.quantity_ordered ? (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Fully Received</span>
                                ) : item.quantity_received > 0 ? (
                                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Partial</span>
                                ) : (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">Pending</span>
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

      {/* CREATE PURCHASE ORDER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Create Internal Purchase Order (PO)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Generate draft purchase order for supplier quotation and batch receiving.
                </p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitCreatePo} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Supplier / Distributor Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPoSupplier}
                  onChange={(e) => setNewPoSupplier(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase text-slate-700">
                    Order Line Items ({newPoItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                  {newPoItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="flex-1">
                        <select
                          value={item.medicine_id}
                          onChange={(e) => handleItemChange(idx, 'medicine_id', e.target.value)}
                          required
                          className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white"
                        >
                          <option value="">-- Choose Medicine --</option>
                          {medicines.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.brand_name} - {m.generic_name} ({m.dosage_strength})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantity_ordered}
                          onChange={(e) => handleItemChange(idx, 'quantity_ordered', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-right font-semibold"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          placeholder="Cost (₱)"
                          value={item.unit_cost}
                          onChange={(e) => handleItemChange(idx, 'unit_cost', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-right font-mono"
                        />
                      </div>

                      {newPoItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded"
                          title="Remove item row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Procurement Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rush delivery, 30 days payment term"
                  value={newPoNotes}
                  onChange={(e) => setNewPoNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                >
                  {actionLoading ? 'Creating...' : 'Save Draft Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE DELIVERY MODAL */}
      {isReceiveModalOpen && activePoForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-600" />
                  <span>Receive Order Delivery ({activePoForAction.po_number})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Assign supplier Lot / Batch numbers and verify expiration dates into active stock.
                </p>
              </div>
              <button onClick={() => setIsReceiveModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitReceiveDelivery} className="p-5 space-y-4">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {activePoForAction.items.map(item => {
                  const delState = deliveryItems[item.id] || {};
                  const remaining = Math.max(0, item.quantity_ordered - item.quantity_received);

                  return (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-slate-900">{item.brand_name}</span>
                          <span className="text-[11px] text-slate-500 ml-1">({item.generic_name})</span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-semibold">
                          Ordered: {item.quantity_ordered} | Remaining: <strong className="text-emerald-700">{remaining}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Qty to Receive *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={delState.quantity_to_receive || ''}
                            onChange={(e) => handleDeliveryItemChange(item.id, 'quantity_to_receive', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Batch / Lot # *
                          </label>
                          <input
                            type="text"
                            required
                            value={delState.batch_number || ''}
                            onChange={(e) => handleDeliveryItemChange(item.id, 'batch_number', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Expiration Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={delState.expiration_date || ''}
                            onChange={(e) => handleDeliveryItemChange(item.id, 'expiration_date', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Selling Price (₱) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={delState.selling_price || ''}
                            onChange={(e) => handleDeliveryItemChange(item.id, 'selling_price', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-bold text-emerald-800"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Delivery Receipt Notes / Reference
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                >
                  {actionLoading ? 'Recording Delivery...' : 'Confirm Delivery Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL OUTSTANDING MODAL */}
      {isCancelModalOpen && activePoForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm">Cancel Outstanding Lines ({activePoForAction.po_number})</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will cancel remaining unfulfilled items on this purchase order. This action requires an audit justification and cannot be undone.
            </p>

            <form onSubmit={handleSubmitCancelOutstanding} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Cancellation Justification *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Supplier out of stock; manufacturer phased out packaging size..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT PO SLIP MODAL */}
      {printPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                Purchase Order Document ({printPo.po_number})
              </span>
              <button onClick={() => setPrintPo(null)} className="text-slate-400 hover:text-white text-xs font-semibold">✕</button>
            </div>

            <div className="p-6 font-mono text-xs text-slate-800 printable-area bg-white space-y-4">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h4 className="font-extrabold text-sm uppercase">R.K.A PHARMACY</h4>
                <p className="text-[11px] text-slate-500">San Antonio, Agoo, La Union</p>
                <p className="text-[10px] text-slate-400">Clinic Purchase Order (PO)</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div>
                  <span className="text-slate-500 block">PO Number:</span>
                  <span className="font-bold text-slate-900">{printPo.po_number}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date:</span>
                  <span>{new Date(printPo.created_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Supplier:</span>
                  <span className="font-bold">{printPo.supplier_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status:</span>
                  <span className="uppercase font-bold">{printPo.status}</span>
                </div>
              </div>

              <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase">
                  <span className="col-span-6">Medicine</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-2 text-right">Cost</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>
                {printPo.items?.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px]">
                    <span className="col-span-6 font-bold">{item.brand_name}</span>
                    <span className="col-span-2 text-right">{item.quantity_ordered}</span>
                    <span className="col-span-2 text-right">₱{Number(item.unit_cost).toFixed(2)}</span>
                    <span className="col-span-2 text-right font-bold">₱{Number(item.total_cost).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm font-black pt-1">
                <span>TOTAL ESTIMATED COST:</span>
                <span>₱{Number(printPo.total_cost || 0).toFixed(2)}</span>
              </div>

              {printPo.notes && (
                <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded">
                  Notes: {printPo.notes}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintPo(null)}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
