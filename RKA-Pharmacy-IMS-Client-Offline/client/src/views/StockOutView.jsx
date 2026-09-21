import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUpFromLine,
  Barcode,
  Search,
  ShoppingCart,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Printer,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Clock,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import OverrideModal from '../components/OverrideModal';
import BatchStatusConfirmModal from '../components/BatchStatusConfirmModal';

export default function StockOutView({
  medicines,
  batches,
  onRefresh,
  onNavigate,
  uiMode = 'minimalist',
  onOpenHelp,
  currentUser
}) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedMedId, setSelectedMedId] = useState('');
  const [cart, setCart] = useState([]);
  const [patientOrRef, setPatientOrRef] = useState('');
  const [dispenseNotes, setDispenseNotes] = useState('');

  // Active item details for current selection
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantityInput, setQuantityInput] = useState(1);

  // Override modal state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [pendingOverrideItem, setPendingOverrideItem] = useState(null);

  // Status confirmation modal state (Warning, Critical, At-Risk)
  const [statusConfirmModalOpen, setStatusConfirmModalOpen] = useState(false);
  const [pendingStatusConfirmItem, setPendingStatusConfirmItem] = useState(null);

  // Status & Receipt
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const medList = medicines || [];
  const batchList = batches || [];
  const selectedMed = medList.find(m => m.id === parseInt(selectedMedId));
  const medBatches = batchList.filter(
    b => b.medicine_id === parseInt(selectedMedId) && b.status === 'active' && b.current_quantity > 0
  ).sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));

  // FEFO batch candidate is the earliest unexpired batch
  const fefoBatch = medBatches.find(b => b.days_to_expiry > 0);
  const currentSelectedBatch = medBatches.find(b => b.id === parseInt(selectedBatchId));

  // Process barcode lookup
  const processScannedBarcode = (query) => {
    if (!query) return;
    const match = medList.find(
      m => m.barcode?.toLowerCase() === query.toLowerCase() || m.code?.toLowerCase() === query.toLowerCase()
    );

    if (match) {
      handleSelectMedicine(match);
      setBarcodeInput('');
      setError(null);
    } else {
      setError(`No registered medicine found for barcode "${query}".`);
    }
  };

  // Handle barcode scanner input from form submit
  const handleBarcodeSubmit = (e) => {
    e?.preventDefault();
    processScannedBarcode(barcodeInput.trim());
  };

  // Global scanner buffer: captures barcode scans even when input is unfocused
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e) => {
      const targetTag = e.target?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 120) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 2) {
          e.preventDefault();
          processScannedBarcode(buffer.trim());
          buffer = '';
        }
      } else if (e.key && e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [medList]);

  const handleSelectMedicine = (med) => {
    setSelectedMedId(med.id);
    setQuantityInput(1);

    // Find active batches
    const avail = batchList.filter(
      b => b.medicine_id === med.id && b.status === 'active' && b.current_quantity > 0
    ).sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));

    const earliestUnexpired = avail.find(b => b.days_to_expiry > 0);
    if (earliestUnexpired) {
      setSelectedBatchId(earliestUnexpired.id);
    } else {
      setSelectedBatchId('');
    }
  };

  // Add item to dispensing slip / cart
  const handleAddToCart = () => {
    if (!selectedMed || !selectedBatchId) {
      setError('Please select a medicine and an active batch.');
      return;
    }

    const batch = medBatches.find(b => b.id === parseInt(selectedBatchId));
    if (!batch) {
      setError('Selected batch not found.');
      return;
    }

    // Safety check: Block expired batch
    if (batch.days_to_expiry <= 0) {
      setError(`CRITICAL SAFETY BLOCK: Batch ${batch.batch_number} expired on ${batch.expiration_date} and CANNOT be released!`);
      return;
    }

    const qty = parseInt(quantityInput);
    const alreadyInCart = cart.filter(item => item.batch_id === batch.id).reduce((sum, i) => sum + i.quantity, 0);
    const availableLeft = batch.current_quantity - alreadyInCart;

    if (qty <= 0 || qty > availableLeft) {
      setError(
        alreadyInCart > 0
          ? `Cannot add ${qty} units. Only ${availableLeft} remaining units available for batch ${batch.batch_number} (${alreadyInCart} already in cart).`
          : `Quantity must be between 1 and available stock (${batch.current_quantity} units).`
      );
      return;
    }

    // Check if user is overriding FEFO
    const isFefoCandidate = fefoBatch && fefoBatch.id === batch.id;
    if (!isFefoCandidate) {
      // Prompt for override justification
      setPendingOverrideItem({
        medicine: selectedMed,
        selectedBatch: batch,
        fefoBatch: fefoBatch,
        quantity: qty,
        unitPrice: batch.selling_price
      });
      setOverrideModalOpen(true);
      return;
    }

    // Manuscript Figure 2 Protocol: If earliest expiring batch is Warning, Critical, or At-risk, require user confirmation
    const isAtRiskOrWarning = batch.expiry_tier === 'Critical' || batch.expiry_tier === 'Warning' || batch.is_at_waste_risk || batch.days_to_expiry <= 90;
    if (isAtRiskOrWarning) {
      setPendingStatusConfirmItem({
        medicine: selectedMed,
        batch,
        quantity: qty
      });
      setStatusConfirmModalOpen(true);
      return;
    }

    // Standard FEFO release
    addItemToCartInternal({
      medicine: selectedMed,
      batch,
      quantity: qty,
      unitPrice: batch.selling_price,
      isOverride: false,
      overrideReason: null,
      statusConfirmed: false,
      expiryStatus: batch.expiry_tier
    });
  };

  const handleConfirmStatusRelease = () => {
    if (!pendingStatusConfirmItem) return;
    addItemToCartInternal({
      medicine: pendingStatusConfirmItem.medicine,
      batch: pendingStatusConfirmItem.batch,
      quantity: pendingStatusConfirmItem.quantity,
      unitPrice: pendingStatusConfirmItem.batch.selling_price,
      isOverride: false,
      overrideReason: null,
      statusConfirmed: true,
      expiryStatus: pendingStatusConfirmItem.batch.expiry_tier
    });
    setStatusConfirmModalOpen(false);
    setPendingStatusConfirmItem(null);
  };

  const addItemToCartInternal = (itemData) => {
    setCart(prev => [
      ...prev,
      {
        id: Date.now(),
        medicine_id: itemData.medicine.id,
        brand_name: itemData.medicine.brand_name,
        generic_name: itemData.medicine.generic_name,
        dosage_strength: itemData.medicine.dosage_strength,
        unit_of_measure: itemData.medicine.unit_of_measure,
        batch_id: itemData.batch.id,
        batch_number: itemData.batch.batch_number,
        expiration_date: itemData.batch.expiration_date,
        days_to_expiry: itemData.batch.days_to_expiry,
        quantity: itemData.quantity,
        unit_price: itemData.batch.selling_price,
        subtotal: itemData.quantity * itemData.batch.selling_price,
        is_override: itemData.isOverride,
        override_reason: itemData.overrideReason,
        status_confirmed: itemData.statusConfirmed || false,
        expiry_status: itemData.expiryStatus || null
      }
    ]);

    // Reset selection inputs
    setSelectedMedId('');
    setSelectedBatchId('');
    setQuantityInput(1);
    setError(null);
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  const handleConfirmOverride = (reason) => {
    if (!pendingOverrideItem) return;
    addItemToCartInternal({
      medicine: pendingOverrideItem.medicine,
      batch: pendingOverrideItem.selectedBatch,
      quantity: pendingOverrideItem.quantity,
      unitPrice: pendingOverrideItem.selectedBatch.selling_price,
      isOverride: true,
      overrideReason: reason,
      statusConfirmed: false,
      expiryStatus: pendingOverrideItem.selectedBatch.expiry_tier
    });
    setOverrideModalOpen(false);
    setPendingOverrideItem(null);
  };

  const handleRemoveFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Complete Checkout / Dispense
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const itemsPayload = cart.map(item => ({
        medicine_id: item.medicine_id,
        batch_id: item.batch_id,
        quantity: item.quantity,
        custom_price: item.unit_price,
        override_reason: item.override_reason,
        status_confirmed: item.status_confirmed || false,
        expiry_status: item.expiry_status || null
      }));

      const res = await fetch('/api/transactions/stock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsPayload,
          reference_no: patientOrRef || undefined,
          notes: dispenseNotes || 'Clinic outpatient dispense',
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete dispensing');
      }

      // Success
      setLastReceipt({
        receipt_no: data.receipt_no,
        date: new Date().toLocaleString(),
        items: [...cart],
        total: totalCartAmount,
        notes: dispenseNotes,
        reference: patientOrRef
      });

      setCart([]);
      setPatientOrRef('');
      setDispenseNotes('');
      onRefresh();

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch (e) {}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5 text-emerald-600" />
            <span>Stock-Out & Dispensing (FEFO Prioritized)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Automatic earliest-expiration batch deduction with audit-verified user override
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              type="button"
              className="text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs"
              title="View 5-step dispensing instructions"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>How to Dispense</span>
            </button>
          )}
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>FEFO Engine Active</span>
          </span>
        </div>
      </div>

      {/* Barcode Quick Scanner Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-xl shadow-md border border-indigo-900">
        <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 shrink-0">
            <Barcode className="w-5 h-5" />
            <span>Scan Medicine Barcode:</span>
          </div>
          <div className="relative flex-1 w-full">
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Aim handheld scanner at barcode or type & press Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800/90 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none placeholder:text-slate-400 font-mono"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-xs"
          >
            Scan / Enter
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Grid: Dispense Form & Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Medicine & Batch Selection (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>1. Select Medicine & Batch</span>
            <span className="text-xs font-normal text-slate-400">Step 1 of 2</span>
          </h3>

          {/* Medicine Select */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Medicine Catalog
            </label>
            <select
              value={selectedMedId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedMedId(id);
                const m = medicines.find(med => med.id === parseInt(id));
                if (m) handleSelectMedicine(m);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-800"
            >
              <option value="">-- Choose medicine to dispense --</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brand_name} - {m.generic_name} ({m.dosage_strength} {m.dosage_form}) • Stock: {m.total_stock}
                </option>
              ))}
            </select>
          </div>

          {selectedMed && (
            <div className="space-y-4 animate-in fade-in">
              {/* Batches Table with FEFO preselection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase text-slate-700">
                    Available Batches (FEFO Sorted)
                  </label>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Earliest expiring batch automatically recommended
                  </span>
                </div>

                {medBatches.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {medBatches.map((b) => {
                      const isFefo = fefoBatch && fefoBatch.id === b.id;
                      const isSelected = parseInt(selectedBatchId) === b.id;
                      const isExpired = b.days_to_expiry <= 0;

                      return (
                        <div
                          key={b.id}
                          onClick={() => {
                            if (!isExpired) {
                              setSelectedBatchId(b.id);
                              setCustomPrice(b.selling_price);
                            }
                          }}
                          className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                            isExpired
                              ? 'bg-red-50/50 border-red-200 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="batchSelection"
                              disabled={isExpired}
                              checked={isSelected}
                              onChange={() => {
                                setSelectedBatchId(b.id);
                                setCustomPrice(b.selling_price);
                              }}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-slate-900">{b.batch_number}</span>
                                {isFefo && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    FEFO Recommended
                                  </span>
                                )}
                                {isExpired && (
                                  <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                                    <AlertOctagon className="w-3 h-3" />
                                    Blocked (Expired)
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Exp: <span className="font-semibold text-slate-700">{b.expiration_date}</span> ({b.days_to_expiry} days left)
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-900">
                              {b.current_quantity} {selectedMed.unit_of_measure}s left
                            </div>
                            <div className="text-[11px] text-emerald-700 font-semibold">
                              ₱{b.selling_price?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                    No active stock available for this medicine.
                  </div>
                )}
              </div>

              {/* Quantity and Price Entry */}
              {currentSelectedBatch && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                        Quantity to Dispense *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={currentSelectedBatch.current_quantity}
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-bold"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Max available: {currentSelectedBatch.current_quantity}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-700 mb-1 flex items-center justify-between">
                        <span>Unit Price (₱)</span>
                        <span className="text-[10px] text-slate-500 font-semibold bg-slate-200/80 px-1.5 py-0.5 rounded">
                          🔒 Fixed / Locked
                        </span>
                      </label>
                      <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 font-bold text-slate-900 flex items-center justify-between">
                        <span>₱{Number(currentSelectedBatch.selling_price || 0).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 font-normal">Batch Record</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Subtotal: ₱{((parseInt(quantityInput) || 0) * (Number(currentSelectedBatch.selling_price) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Override Warning Callout */}
                  {fefoBatch && currentSelectedBatch.id !== fefoBatch.id && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <strong>Notice:</strong> You selected Batch {currentSelectedBatch.batch_number} instead of earliest batch {fefoBatch.batch_number}. Adding this will require entering an override justification.
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Dispensing Slip</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Dispensing Slip / Cart (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>Dispensing Slip / Cart</span>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                {cart.length} Item{cart.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Slip Items List */}
            {cart.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-start gap-2"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{item.brand_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.generic_name} ({item.dosage_strength})
                      </div>
                      <div className="text-[10px] text-slate-600 mt-1 flex items-center gap-2">
                        <span>Batch: <strong className="font-mono">{item.batch_number}</strong></span>
                        <span>Qty: <strong>{item.quantity}</strong></span>
                        <span>@ ₱{item.unit_price.toFixed(2)}</span>
                      </div>
                      {item.is_override && (
                        <div className="mt-1 text-[10px] text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded inline-block font-semibold">
                          Override: {item.override_reason}
                        </div>
                      )}
                      {item.status_confirmed && (
                        <div className="mt-1 text-[10px] text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded inline-block font-semibold">
                          Confirmed: {item.expiry_status || 'Warning/Critical'} Release
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs text-slate-900">
                        ₱{item.subtotal.toFixed(2)}
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition mt-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg mb-4">
                No items added yet. Scan a barcode or select from catalog on the left.
              </div>
            )}

            {/* Patient & Reference input */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  Patient Name or Rx Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maria Santos / Rx-1049"
                  value={patientOrRef}
                  onChange={(e) => setPatientOrRef(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  Dispensing Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clinic treatment room, 3-day dose"
                  value={dispenseNotes}
                  onChange={(e) => setDispenseNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cart Footer Total & Checkout */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-slate-600">Total Payable:</span>
              <span className="text-xl font-extrabold text-slate-900">₱{totalCartAmount.toFixed(2)}</span>
            </div>

            <button
              type="button"
              disabled={loading || cart.length === 0}
              onClick={handleCheckout}
              className="w-full py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              {loading ? 'Recording Transactions...' : 'Complete Dispense & Print Receipt'}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Preview Modal */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Dispense Completed
              </span>
              <button
                onClick={() => setLastReceipt(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div className="p-6 font-mono text-xs text-slate-800 printable-area bg-white">
              <div className="text-center border-b border-slate-300 pb-3 mb-3">
                <div className="font-bold text-sm">R.K.A PHARMACY</div>
                <div className="text-[10px] text-slate-500">San Antonio, Agoo, La Union</div>
                <div className="text-[10px] text-slate-500">Owner: Lourdes Gincen L. Cesista</div>
                <div className="text-[10px] text-slate-500 mt-1">Receipt: {lastReceipt.receipt_no}</div>
                <div className="text-[10px] text-slate-500">{lastReceipt.date}</div>
              </div>

              {lastReceipt.reference && (
                <div className="text-[10px] mb-2 pb-2 border-b border-slate-200">
                  Patient/Ref: {lastReceipt.reference}
                </div>
              )}

              <div className="space-y-1.5 mb-3 border-b border-slate-300 pb-3">
                {lastReceipt.items.map((it, i) => (
                  <div key={i} className="flex justify-between items-start text-[11px]">
                    <div>
                      <div className="font-bold">{it.brand_name}</div>
                      <div className="text-[9px] text-slate-500">{it.batch_number} • {it.quantity} x ₱{it.unit_price.toFixed(2)}</div>
                    </div>
                    <div className="font-bold">₱{it.subtotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center font-bold text-sm mb-4">
                <span>TOTAL:</span>
                <span>₱{lastReceipt.total.toFixed(2)}</span>
              </div>

              <div className="text-center text-[9px] text-slate-400 border-t border-slate-200 pt-2">
                Thank you for choosing R.K.A Pharmacy!
                <br />
                Supplies managed via FEFO+ Inventory System
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 no-print">
              <button
                onClick={() => setLastReceipt(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
              >
                Done
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      <OverrideModal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        fefoBatch={pendingOverrideItem?.fefoBatch}
        selectedBatch={pendingOverrideItem?.selectedBatch}
        medicineName={pendingOverrideItem?.medicine?.brand_name}
        onConfirmOverride={handleConfirmOverride}
      />

      {/* Batch Expiry Status Confirmation Modal */}
      <BatchStatusConfirmModal
        isOpen={statusConfirmModalOpen}
        onClose={() => {
          setStatusConfirmModalOpen(false);
          setPendingStatusConfirmItem(null);
        }}
        batch={pendingStatusConfirmItem?.batch}
        medicine={pendingStatusConfirmItem?.medicine}
        quantity={pendingStatusConfirmItem?.quantity}
        onConfirm={handleConfirmStatusRelease}
      />
    </div>
  );
}
