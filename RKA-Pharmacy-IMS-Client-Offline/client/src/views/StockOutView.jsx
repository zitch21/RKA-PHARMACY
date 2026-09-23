import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowUpFromLine,
  Barcode,
  Search,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  Printer,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  HelpCircle
} from 'lucide-react';
import OverrideModal from '../components/OverrideModal';
import BatchStatusConfirmModal from '../components/BatchStatusConfirmModal';
import HelperText from '../components/HelperText';

export default function StockOutView({
  medicines,
  batches,
  onRefresh,
  _onNavigate,
  uiMode = 'clean',
  onOpenHelp,
  currentUser
}) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [medSearchTerm, setMedSearchTerm] = useState('');
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

  // Handle medicine dropdown selection
  const handleSelectMedicine = (med) => {
    setSelectedMedId(med.id);
    const activeBatches = batchList.filter(
      b => b.medicine_id === med.id && b.status === 'active' && b.current_quantity > 0
    ).sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));

    // Pre-select earliest unexpired batch (FEFO)
    const early = activeBatches.find(b => b.days_to_expiry > 0);
    if (early) {
      setSelectedBatchId(early.id);
    } else if (activeBatches.length > 0) {
      setSelectedBatchId(activeBatches[0].id);
    } else {
      setSelectedBatchId('');
    }
    setQuantityInput(1);
    setError(null);
  };

  // Add Item to Dispensing Cart
  const handleAddToCart = () => {
    if (!selectedMed || !currentSelectedBatch) {
      setError('Please select a medicine and active batch.');
      return;
    }

    const qty = parseInt(quantityInput);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity greater than zero.');
      return;
    }

    if (qty > currentSelectedBatch.current_quantity) {
      setError(`Cannot dispense ${qty} items. Only ${currentSelectedBatch.current_quantity} remaining in batch ${currentSelectedBatch.batch_number}.`);
      return;
    }

    // Check if batch is strictly expired
    if (currentSelectedBatch.days_to_expiry <= 0) {
      setError(`STRICT BLOCK: Batch ${currentSelectedBatch.batch_number} is EXPIRED (${currentSelectedBatch.expiration_date}). Patient release is forbidden.`);
      return;
    }

    // Check if user is overriding FEFO
    const isOverride = fefoBatch && currentSelectedBatch.id !== fefoBatch.id;
    if (isOverride) {
      setPendingOverrideItem({
        medicine: selectedMed,
        selectedBatch: currentSelectedBatch,
        fefoBatch: fefoBatch,
        quantity: qty
      });
      setOverrideModalOpen(true);
      return;
    }

    // Check status confirmation for Warning (31-90d) or Critical (1-30d) tiers
    if (currentSelectedBatch.expiry_tier === 'Warning' || currentSelectedBatch.expiry_tier === 'Critical') {
      setPendingStatusConfirmItem({
        medicine: selectedMed,
        selectedBatch: currentSelectedBatch,
        quantity: qty,
        unitPrice: currentSelectedBatch.selling_price
      });
      setStatusConfirmModalOpen(true);
      return;
    }

    // Safe direct add
    addItemToCartInternal({
      medicine: selectedMed,
      batch: currentSelectedBatch,
      quantity: qty,
      unitPrice: currentSelectedBatch.selling_price,
      isOverride: false,
      overrideReason: null,
      statusConfirmed: false,
      expiryStatus: currentSelectedBatch.expiry_tier
    });
  };

  const addItemToCartInternal = ({ medicine, batch, quantity, unitPrice, isOverride, overrideReason, statusConfirmed, expiryStatus }) => {
    const existingIndex = cart.findIndex(i => i.batch_id === batch.id);

    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      const newQty = existing.quantity + quantity;
      if (newQty > batch.current_quantity) {
        setError(`Cannot add ${quantity} more. Exceeds batch total stock (${batch.current_quantity}).`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existing,
        quantity: newQty,
        subtotal: newQty * unitPrice,
        is_override: isOverride || existing.is_override,
        override_reason: overrideReason || existing.override_reason,
        status_confirmed: statusConfirmed || existing.status_confirmed
      };
      setCart(updatedCart);
    } else {
      setCart(prev => [
        ...prev,
        {
          id: Date.now(),
          medicine_id: medicine.id,
          batch_id: batch.id,
          brand_name: medicine.brand_name,
          generic_name: medicine.generic_name,
          dosage_strength: medicine.dosage_strength,
          batch_number: batch.batch_number,
          expiration_date: batch.expiration_date,
          days_to_expiry: batch.days_to_expiry,
          unit_price: unitPrice,
          quantity: quantity,
          subtotal: quantity * unitPrice,
          is_override: isOverride,
          override_reason: overrideReason,
          status_confirmed: statusConfirmed,
          expiry_status: expiryStatus
        }
      ]);
    }

    // Reset current selection form
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
      } catch {}
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
          <HelperText uiMode={uiMode} className="text-xs text-slate-500">
            Automatic earliest-expiration batch deduction with audit-verified user override
          </HelperText>
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
            {uiMode === 'clean' ? 'Scan' : 'Scan / Enter'}
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
            <HelperText uiMode={uiMode} as="span" className="text-xs font-normal text-slate-400">
              Step 1 of 2
            </HelperText>
          </h3>

          {/* Medicine Select with Search Filter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase text-slate-700">
                Medicine Catalog
              </label>
              {medSearchTerm && (
                <button
                  type="button"
                  onClick={() => setMedSearchTerm('')}
                  className="text-[10px] text-emerald-700 hover:underline font-semibold"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Type to filter medicine dropdown (brand, generic, code)..."
                value={medSearchTerm}
                onChange={(e) => setMedSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-1.5 bg-slate-50 focus:bg-white"
              />
            </div>
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
              <option value="">-- Choose medicine to dispense ({medicines.filter(m => !medSearchTerm || m.brand_name.toLowerCase().includes(medSearchTerm.toLowerCase()) || m.generic_name.toLowerCase().includes(medSearchTerm.toLowerCase()) || m.code.toLowerCase().includes(medSearchTerm.toLowerCase())).length} matches) --</option>
              {medicines
                .filter(m => !medSearchTerm || m.brand_name.toLowerCase().includes(medSearchTerm.toLowerCase()) || m.generic_name.toLowerCase().includes(medSearchTerm.toLowerCase()) || m.code.toLowerCase().includes(medSearchTerm.toLowerCase()))
                .map((m) => (
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
                  <HelperText uiMode={uiMode} as="span" className="text-[11px] text-emerald-700 font-medium">
                    Earliest expiring batch automatically recommended
                  </HelperText>
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddToCart();
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-bold"
                      />
                      {/* Quick Qty Buttons */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <span className="text-[10px] text-slate-400 font-medium mr-0.5">Quick:</span>
                        {[1, 5, 10].map(amount => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setQuantityInput(prev => Math.min(currentSelectedBatch.current_quantity, (parseInt(prev, 10) || 0) + amount))}
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-white border border-slate-200 text-slate-700 rounded hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition"
                          >
                            +{amount}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setQuantityInput(currentSelectedBatch.current_quantity)}
                          className="px-1.5 py-0.5 text-[10px] font-bold bg-white border border-slate-200 text-slate-700 rounded hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition"
                        >
                          Max ({currentSelectedBatch.current_quantity})
                        </button>
                      </div>
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
                        <HelperText uiMode={uiMode} as="span" className="text-[10px] text-slate-400 font-normal">
                          Batch Record
                        </HelperText>
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
                    <span>{uiMode === 'clean' ? 'Add to Cart' : 'Add to Dispensing Slip'}</span>
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
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1"
                    title="Clear all items in cart"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Cart</span>
                  </button>
                )}
                <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                  {cart.length} Item{cart.length !== 1 ? 's' : ''}
                </span>
              </div>
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
              <span>
                {loading
                  ? 'Recording Transactions...'
                  : uiMode === 'clean'
                  ? 'Complete Dispense'
                  : 'Complete Dispense & Print Receipt'}
              </span>
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
              <div className="text-center pb-3 border-b border-dashed border-slate-300 mb-3">
                <h4 className="font-extrabold text-sm uppercase">R.K.A PHARMACY</h4>
                <p className="text-[11px] text-slate-500">San Antonio, Agoo, La Union</p>
                <p className="text-[10px] text-slate-400">Clinic Pharmacy Supplies IMS</p>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt #:</span>
                  <span className="font-bold">{lastReceipt.receipt_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span>{lastReceipt.date}</span>
                </div>
                {lastReceipt.reference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ref / Patient:</span>
                    <span className="font-bold">{lastReceipt.reference}</span>
                  </div>
                )}
                {currentUser && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dispenser:</span>
                    <span>{currentUser.full_name || 'Lourdes Gincen L. Cesista'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 border-b border-dashed border-slate-300 pb-3 mb-3">
                {lastReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">{item.brand_name}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.quantity}x @ ₱{item.unit_price.toFixed(2)} (Lot: {item.batch_number})
                      </div>
                    </div>
                    <span className="font-bold">₱{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm font-black pt-1 mb-4">
                <span>TOTAL:</span>
                <span>₱{lastReceipt.total.toFixed(2)}</span>
              </div>

              <div className="text-center text-[10px] text-slate-500 space-y-1">
                <p>Thank you for choosing R.K.A Pharmacy!</p>
                <p>FEFO-Tracked for Safety & Quality</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setLastReceipt(null)}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      <OverrideModal
        isOpen={overrideModalOpen}
        onClose={() => {
          setOverrideModalOpen(false);
          setPendingOverrideItem(null);
        }}
        onConfirm={handleConfirmOverride}
        fefoBatch={pendingOverrideItem?.fefoBatch}
        selectedBatch={pendingOverrideItem?.selectedBatch}
        medicine={pendingOverrideItem?.medicine}
        currentUser={currentUser}
      />

      {/* Near Expiry / Status Confirmation Modal */}
      <BatchStatusConfirmModal
        isOpen={statusConfirmModalOpen}
        onClose={() => {
          setStatusConfirmModalOpen(false);
          setPendingStatusConfirmItem(null);
        }}
        onConfirm={() => {
          if (!pendingStatusConfirmItem) return;
          addItemToCartInternal({
            medicine: pendingStatusConfirmItem.medicine,
            batch: pendingStatusConfirmItem.selectedBatch,
            quantity: pendingStatusConfirmItem.quantity,
            unitPrice: pendingStatusConfirmItem.unitPrice,
            isOverride: false,
            overrideReason: null,
            statusConfirmed: true,
            expiryStatus: pendingStatusConfirmItem.selectedBatch.expiry_tier
          });
          setStatusConfirmModalOpen(false);
          setPendingStatusConfirmItem(null);
        }}
        batch={pendingStatusConfirmItem?.selectedBatch}
        medicine={pendingStatusConfirmItem?.medicine}
        quantity={pendingStatusConfirmItem?.quantity}
        currentUser={currentUser}
      />
    </div>
  );
}
