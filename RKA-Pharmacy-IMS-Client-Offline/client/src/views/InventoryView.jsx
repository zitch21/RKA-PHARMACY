import React, { useState } from 'react';
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
  RotateCcw
} from 'lucide-react';
import BarcodeModal from '../components/BarcodeModal';
import DisposalModal from '../components/DisposalModal';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import EditMedicineModal from '../components/EditMedicineModal';
import EditBatchModal from '../components/EditBatchModal';

export default function InventoryView({
  medicines,
  batches,
  onRefresh,
  onOpenAddMedicine,
  _onNavigate
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [expandedMedId, setExpandedMedId] = useState(null);

  const [barcodeMedicine, setBarcodeMedicine] = useState(null);
  const [disposalBatch, setDisposalBatch] = useState(null);
  const [adjustmentBatch, setAdjustmentBatch] = useState(null);
  const [editMedicine, setEditMedicine] = useState(null);
  const [editPriceBatch, setEditPriceBatch] = useState(null);

  // Categories list
  const categories = ['All', 'Analgesic / Antipyretic', 'Antibiotic', 'Vitamins & Supplements', 'Antihistamine', 'Respiratory', 'Cardiovascular', 'Antidiabetic'];

  const filteredMedicines = medicines.filter(m => {
    const matchesSearch = 
      m.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.barcode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === 'low_stock') matchesStatus = m.is_low_stock;
    if (selectedStatus === 'out_of_stock') matchesStatus = m.is_out_of_stock;
    if (selectedStatus === 'critical') matchesStatus = m.expiry_tier === 'Critical';
    if (selectedStatus === 'warning') matchesStatus = m.expiry_tier === 'Warning';
    if (selectedStatus === 'expired') matchesStatus = m.expiry_tier === 'Expired';

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Expired':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Expired</span>;
      case 'Critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Critical (1-30d)</span>;
      case 'Warning':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Warning (31-90d)</span>;
      case 'Monitor':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">Monitor (91-180d)</span>;
      case 'Safe':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Safe (&gt;180d)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] text-slate-400">No stock</span>;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Medicine & Vitamin Catalog</h2>
          <p className="text-xs text-slate-500">
            Batch-level records, barcodes, lead times, and expiration monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddMedicine}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine Profile</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by brand, generic, barcode, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
            >
              <option value="All">All Stock & Expiry States</option>
              <option value="low_stock">Low Stock (≤ Threshold)</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="critical">Critical Expiry (1-30 days)</option>
              <option value="warning">Warning Expiry (31-90 days)</option>
              <option value="expired">Expired Batches</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & 1-Click Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <strong>{filteredMedicines.length}</strong> of <strong>{medicines.length}</strong> medicines
            {(searchTerm || selectedCategory !== 'All' || selectedStatus !== 'All') && (
              <span className="text-emerald-700 font-semibold ml-2">(Filtered)</span>
            )}
          </div>
          {(searchTerm || selectedCategory !== 'All' || selectedStatus !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedStatus('All');
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Medicine Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Item & Generic</th>
                <th className="py-3 px-3">Form / Category</th>
                <th className="py-3 px-3">Barcode</th>
                <th className="py-3 px-3 text-center">Total Stock</th>
                <th className="py-3 px-3 text-center">Threshold</th>
                <th className="py-3 px-3">Earliest Expiry</th>
                <th className="py-3 px-3 text-center">Expiry Tier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.map((m) => {
                const isExpanded = expandedMedId === m.id;
                const medBatches = batches.filter(b => b.medicine_id === m.id);

                return (
                  <React.Fragment key={m.id}>
                    <tr className={`hover:bg-slate-50/80 transition ${isExpanded ? 'bg-slate-50/60' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{m.brand_name}</div>
                        <div className="text-slate-500 text-[11px] font-medium">
                          {m.generic_name} ({m.dosage_strength})
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Code: {m.code}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{m.dosage_form}</span>
                        <div className="text-[10px] text-slate-500">{m.category}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200">
                            {m.barcode}
                          </span>
                          <button
                            onClick={() => setBarcodeMedicine(m)}
                            className="text-emerald-700 hover:text-emerald-800 p-1 hover:bg-emerald-50 rounded"
                            title="Generate & Print Barcode Label"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block font-bold text-sm px-2 py-0.5 rounded ${
                          m.total_stock === 0
                            ? 'bg-red-100 text-red-800'
                            : m.is_low_stock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {m.total_stock} {m.unit_of_measure}s
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {m.active_batches_count} active batch{m.active_batches_count !== 1 ? 'es' : ''}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-semibold text-slate-700">
                        {m.reorder_threshold}
                      </td>

                      <td className="py-3 px-3">
                        {m.earliest_expiration_date ? (
                          <div>
                            <div className="font-semibold text-slate-800">{m.earliest_expiration_date}</div>
                            <div className="text-[10px] text-slate-500">
                              {m.days_to_earliest_expiry} days remaining
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No batches</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {getTierBadge(m.expiry_tier)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditMedicine(m)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Medicine Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setExpandedMedId(isExpanded ? null : m.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>{isExpanded ? 'Hide Batches' : 'Batches'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Collapsible Batch Details Subtable */}
                    {isExpanded && (
                      <tr className="bg-slate-100/70 border-y border-slate-200">
                        <td colSpan="8" className="p-4">
                          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-emerald-600" />
                                <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                                  Batches for {m.brand_name} ({m.generic_name})
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                Release Priority: First-Expiry-First-Out (FEFO)
                              </span>
                            </div>

                            {medBatches.length > 0 ? (
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                                    <th className="py-1.5 px-2">Batch #</th>
                                    <th className="py-1.5 px-2">Mfg Date</th>
                                    <th className="py-1.5 px-2">Exp Date</th>
                                    <th className="py-1.5 px-2">Days Left</th>
                                    <th className="py-1.5 px-2 text-center">Remaining</th>
                                    <th className="py-1.5 px-2">Unit Cost</th>
                                    <th className="py-1.5 px-2">Price</th>
                                    <th className="py-1.5 px-2">Status</th>
                                    <th className="py-1.5 px-2 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {medBatches.map((b, idx) => (
                                    <tr key={b.id} className="hover:bg-slate-50">
                                      <td className="py-2 px-2 font-mono font-bold text-slate-800">
                                        {b.batch_number}
                                        {idx === 0 && b.current_quantity > 0 && b.days_to_expiry > 0 && (
                                          <span className="ml-1.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                            FEFO Candidate
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-2 text-slate-500">{b.manufacturing_date}</td>
                                      <td className="py-2 px-2 font-semibold text-slate-800">{b.expiration_date}</td>
                                      <td className="py-2 px-2">
                                        <span className={`font-bold ${
                                          b.days_to_expiry <= 0 ? 'text-red-700' :
                                          b.days_to_expiry <= 30 ? 'text-rose-600' :
                                          b.days_to_expiry <= 90 ? 'text-amber-600' : 'text-slate-600'
                                        }`}>
                                          {b.days_to_expiry <= 0 ? 'EXPIRED' : `${b.days_to_expiry}d`}
                                        </span>
                                      </td>
                                      <td className="py-2 px-2 text-center font-bold text-slate-900">
                                        {b.current_quantity} / {b.initial_quantity}
                                      </td>
                                      <td className="py-2 px-2 text-slate-600">₱{b.unit_cost?.toFixed(2)}</td>
                                      <td className="py-2 px-2 text-slate-900 font-semibold">₱{b.selling_price?.toFixed(2)}</td>
                                      <td className="py-2 px-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                          b.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                          b.status === 'expired' ? 'bg-red-100 text-red-800' :
                                          b.status === 'disposed' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                          {b.status}
                                        </span>
                                      </td>
                                      <td className="py-2 px-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            onClick={() => setEditPriceBatch({ ...b, brand_name: m.brand_name })}
                                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                                            title="Edit Batch Cost & Selling Price"
                                          >
                                            <DollarSign className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => setAdjustmentBatch({ ...b, brand_name: m.brand_name })}
                                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                            title="Physical count adjustment"
                                          >
                                            <Sliders className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => setDisposalBatch({ ...b, brand_name: m.brand_name })}
                                            className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                                            title="Record safe disposal (Expired/Damaged)"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No batches recorded for this medicine yet.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredMedicines.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 text-xs">
                    <p>No medicines match the selected filter criteria.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('All');
                        setSelectedStatus('All');
                      }}
                      className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-block"
                    >
                      Reset Filter Criteria
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Sticker Modal */}
      <BarcodeModal
        medicine={barcodeMedicine}
        isOpen={Boolean(barcodeMedicine)}
        onClose={() => setBarcodeMedicine(null)}
      />

      {/* Edit Medicine Profile Modal */}
      <EditMedicineModal
        medicine={editMedicine}
        isOpen={Boolean(editMedicine)}
        onClose={() => setEditMedicine(null)}
        onMedicineUpdated={onRefresh}
      />

      {/* Disposal Modal */}
      <DisposalModal
        batch={disposalBatch}
        isOpen={Boolean(disposalBatch)}
        onClose={() => setDisposalBatch(null)}
        onDisposalComplete={onRefresh}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        batch={adjustmentBatch}
        isOpen={Boolean(adjustmentBatch)}
        onClose={() => setAdjustmentBatch(null)}
        onAdjustmentComplete={onRefresh}
      />

      {/* Edit Batch Cost & Selling Price Modal */}
      <EditBatchModal
        batch={editPriceBatch}
        isOpen={Boolean(editPriceBatch)}
        onClose={() => setEditPriceBatch(null)}
        onBatchUpdated={onRefresh}
      />
    </div>
  );
}
