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
  HelpCircle,
  Layers,
  FileText,
  Plus,
  Sparkles
} from 'lucide-react';
import OverrideModal from '../components/OverrideModal';
import BatchStatusConfirmModal from '../components/BatchStatusConfirmModal';
import HelperText from '../components/HelperText';
import { useLanguage } from '../context/LanguageContext';

export default function StockOutView({
  medicines,
  batches,
  onRefresh,
  _onNavigate,
  uiMode = 'clean',
  onOpenHelp,
  currentUser
}) {
  const { t } = useLanguage();
  const [dispenseMode, setDispenseMode] = useState('single'); // 'single' | 'prescription'

  // Prescription / Multi-Item State
  const [rxDoctor, setRxDoctor] = useState('');
  const [rxPatient, setRxPatient] = useState('');
  const [rxRef, setRxRef] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxLines, setRxLines] = useState([
    { id: 1, medicine_id: '', quantity: '1', instructions: '' }
  ]);
  const [splitNotice, setSplitNotice] = useState(null);

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
  const unexpiredBatches = medBatches.filter(b => b.days_to_expiry > 0);
  const totalUnexpiredStock = unexpiredBatches.reduce((acc, b) => acc + b.current_quantity, 0);

  // Process barcode lookup
  const processScannedBarcode = (query) => {
    if (!query) return;
    const match = medList.find(
      m => m.barcode?.toLowerCase() === query.toLowerCase() || m.code?.toLowerCase() === query.toLowerCase()
    );

    if (match) {
      if (dispenseMode === 'prescription') {
        const existingIdx = rxLines.findIndex(l => parseInt(l.medicine_id) === match.id);
        if (existingIdx >= 0) {
          setRxLines(prev => prev.map((l, idx) => idx === existingIdx ? { ...l, quantity: ((parseInt(l.quantity, 10) || 0) + 1).toString() } : l));
        } else {
          const emptyIdx = rxLines.findIndex(l => !l.medicine_id);
          if (emptyIdx >= 0) {
            setRxLines(prev => prev.map((l, idx) => idx === emptyIdx ? { ...l, medicine_id: match.id.toString(), quantity: '1' } : l));
          } else {
            setRxLines(prev => [...prev, { id: Date.now() + Math.random(), medicine_id: match.id.toString(), quantity: '1', instructions: '' }]);
          }
        }
        setBarcodeInput('');
        setError(null);
      } else {
        handleSelectMedicine(match);
        setBarcodeInput('');
        setError(null);
      }
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

  const resetSingleSelection = () => {
    setSelectedMedId('');
    setSelectedBatchId('');
    setQuantityInput(1);
    setError(null);
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  // Add Item to Dispensing Cart
  const handleAddToCart = () => {
    if (!selectedMed || !currentSelectedBatch) {
      setError('Please select a medicine and active batch.');
      return;
    }

    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity greater than zero.');
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
      if (qty > currentSelectedBatch.current_quantity) {
        setError(`Cannot dispense ${qty} items. Only ${currentSelectedBatch.current_quantity} remaining in batch ${currentSelectedBatch.batch_number}.`);
        return;
      }
      setPendingOverrideItem({
        medicine: selectedMed,
        selectedBatch: currentSelectedBatch,
        fefoBatch: fefoBatch,
        quantity: qty
      });
      setOverrideModalOpen(true);
      return;
    }

    // FEFO Recommended Batch workflow: Auto-split across sequential unexpired batches if requested qty > current batch
    if (qty > currentSelectedBatch.current_quantity) {
      const unexp = medBatches.filter(b => b.days_to_expiry > 0);
      const totalAvail = unexp.reduce((sum, b) => sum + b.current_quantity, 0);

      const inCartTotal = cart
        .filter(c => c.medicine_id === selectedMed.id)
        .reduce((sum, c) => sum + c.quantity, 0);

      if (qty + inCartTotal > totalAvail) {
        setError(`Cannot dispense ${qty} units. Total unexpired stock is ${totalAvail} units (${inCartTotal} already in cart).`);
        return;
      }

      // Compute multi-batch allocations
      let remainingNeeded = qty;
      const allocations = [];
      for (const b of unexp) {
        if (remainingNeeded <= 0) break;
        const inCartForThis = cart.find(c => c.batch_id === b.id)?.quantity || 0;
        const availableInBatch = b.current_quantity - inCartForThis;
        if (availableInBatch <= 0) continue;

        const take = Math.min(availableInBatch, remainingNeeded);
        if (take > 0) {
          allocations.push({ batch: b, qty: take });
          remainingNeeded -= take;
        }
      }

      if (remainingNeeded > 0) {
        setError(`Cannot fulfill ${qty} units from remaining batch quantities.`);
        return;
      }

      for (const alloc of allocations) {
        addItemToCartInternal({
          medicine: selectedMed,
          batch: alloc.batch,
          quantity: alloc.qty,
          unitPrice: alloc.batch.selling_price,
          isOverride: false,
          overrideReason: null,
          statusConfirmed: false,
          expiryStatus: alloc.batch.expiry_tier
        });
      }

      setSplitNotice(
        `FEFO Auto-Split: Dispensed ${qty} units of ${selectedMed.brand_name} across ${allocations.length} batches (${allocations.map(a => `${a.batch.batch_number}: ${a.qty} units`).join(' + ')}).`
      );
      resetSingleSelection();
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
    resetSingleSelection();
  };

  const addItemToCartInternal = ({ medicine, batch, quantity, unitPrice, isOverride, overrideReason, statusConfirmed, expiryStatus }) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(i => i.batch_id === batch.id);

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const newQty = existing.quantity + quantity;
        if (newQty > batch.current_quantity) {
          setError(`Cannot add ${quantity} more. Exceeds batch total stock (${batch.current_quantity}).`);
          return prev;
        }
        const updatedCart = [...prev];
        updatedCart[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: newQty * unitPrice,
          is_override: isOverride || existing.is_override,
          override_reason: overrideReason || existing.override_reason,
          status_confirmed: statusConfirmed || existing.status_confirmed
        };
        return updatedCart;
      } else {
        return [
          ...prev,
          {
            id: Date.now() + Math.random(),
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
        ];
      }
    });
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
    resetSingleSelection();
  };

  // Prescription / Multi-Medicine Handlers
  const handleAddRxLine = () => {
    setRxLines(prev => [
      ...prev,
      { id: Date.now() + Math.random(), medicine_id: '', quantity: '1', instructions: '' }
    ]);
  };

  const handleRemoveRxLine = (id) => {
    if (rxLines.length <= 1) {
      setRxLines([{ id: Date.now(), medicine_id: '', quantity: '1', instructions: '' }]);
    } else {
      setRxLines(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleRxLineChange = (id, field, value) => {
    setRxLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleAllocatePrescriptionToCart = () => {
    setError(null);
    setSplitNotice(null);

    const filledLines = rxLines.filter(l => l.medicine_id);
    if (filledLines.length === 0) {
      setError('Please add at least one medicine item to the prescription.');
      return;
    }

    const batchAllocationsToAdd = [];
    const splitSummary = [];

    for (const line of filledLines) {
      const med = medList.find(m => m.id === parseInt(line.medicine_id, 10));
      if (!med) continue;

      const qty = parseInt(line.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        setError(`Please enter a valid quantity greater than zero for ${med.brand_name}.`);
        return;
      }

      const medActiveBatches = batchList
        .filter(b => b.medicine_id === med.id && b.status === 'active' && b.current_quantity > 0 && b.days_to_expiry > 0)
        .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));

      const totalAvail = medActiveBatches.reduce((acc, b) => acc + b.current_quantity, 0);

      const inCartTotal = cart
        .filter(c => c.medicine_id === med.id)
        .reduce((sum, c) => sum + c.quantity, 0);

      if (qty + inCartTotal > totalAvail) {
        setError(
          `Insufficient unexpired stock for ${med.brand_name} (${med.generic_name}). Requested: ${qty}, already in cart: ${inCartTotal}, available stock: ${totalAvail}.`
        );
        return;
      }

      let remaining = qty;
      const lineAllocations = [];
      for (const b of medActiveBatches) {
        if (remaining <= 0) break;
        const inCartForThisBatch = cart.find(c => c.batch_id === b.id)?.quantity || 0;
        const availableInBatch = b.current_quantity - inCartForThisBatch;
        if (availableInBatch <= 0) continue;

        const take = Math.min(availableInBatch, remaining);
        if (take > 0) {
          lineAllocations.push({ batch: b, qty: take });
          remaining -= take;
        }
      }

      if (remaining > 0) {
        setError(`Could not fulfill requested ${qty} units for ${med.brand_name} from available unexpired batches.`);
        return;
      }

      if (lineAllocations.length > 1) {
        splitSummary.push(`${med.brand_name} (${lineAllocations.map(a => `${a.batch.batch_number}: ${a.qty}`).join(' + ')})`);
      }

      for (const alloc of lineAllocations) {
        batchAllocationsToAdd.push({
          medicine: med,
          batch: alloc.batch,
          quantity: alloc.qty,
          unitPrice: alloc.batch.selling_price,
          isOverride: false,
          overrideReason: null,
          statusConfirmed: false,
          expiryStatus: alloc.batch.expiry_tier
        });
      }
    }

    // Add all allocations into the cart
    for (const item of batchAllocationsToAdd) {
      addItemToCartInternal(item);
    }

    if (rxPatient || rxRef) {
      setPatientOrRef([rxPatient, rxRef ? `(${rxRef})` : ''].filter(Boolean).join(' '));
    }
    if (rxDoctor || rxNotes) {
      setDispenseNotes([rxDoctor ? `Attending: ${rxDoctor}` : '', rxNotes].filter(Boolean).join(' | '));
    }

    if (splitSummary.length > 0) {
      setSplitNotice(`FEFO multi-batch splits applied: ${splitSummary.join('; ')}`);
    } else {
      setSplitNotice(`Added ${filledLines.length} prescription medication(s) to dispensing slip.`);
    }

    // Reset prescription form to empty line
    setRxLines([{ id: Date.now(), medicine_id: '', quantity: '1', instructions: '' }]);
    setRxPatient('');
    setRxDoctor('');
    setRxRef('');
    setRxNotes('');
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
    <div className={uiMode === 'clean' ? 'space-y-4 pb-8' : 'space-y-6 pb-12'}>
      {/* Header */}
      <div className={`bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        uiMode === 'clean' ? 'p-3.5' : 'p-4'
      }`}>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5 text-emerald-600" />
            <span>{t('dispense_title', 'Stock-Out & Dispensing (FEFO Prioritized)')}</span>
          </h2>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500">
            {t('dispense_subtitle', 'Automatic earliest-expiration batch deduction with audit-verified user override')}
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
              <span>{t('btn_how_to_use', 'How to Dispense')}</span>
            </button>
          )}
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{t('badge_fefo_active', 'FEFO Engine Active')}</span>
          </span>
        </div>
      </div>

      {/* Barcode Quick Scanner Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-xl shadow-md border border-indigo-900">
        <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 shrink-0">
            <Barcode className="w-5 h-5" />
            <span>{t('stockin_scan_label', 'Scan Medicine Barcode:')}</span>
          </div>
          <div className="relative flex-1 w-full">
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder={t('stockin_scan_placeholder', 'Aim handheld scanner at barcode or type & press Enter...')}
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

      {/* Split Notice Banner */}
      {splitNotice && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{splitNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSplitNotice(null)}
            className="text-indigo-400 hover:text-indigo-700 text-xs font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

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
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDispenseMode('single')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  dispenseMode === 'single'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>Single Item & Scanner</span>
              </button>
              <button
                type="button"
                onClick={() => setDispenseMode('prescription')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  dispenseMode === 'prescription'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Prescription / Multi-Medicine</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                  dispenseMode === 'prescription' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
                }`}>
                  {rxLines.filter(l => l.medicine_id).length}
                </span>
              </button>
            </div>
            <HelperText uiMode={uiMode} as="span" className="text-xs font-normal text-slate-400">
              {dispenseMode === 'single' ? 'Step 1 of 2' : 'Multi-Item FEFO'}
            </HelperText>
          </div>

          {dispenseMode === 'single' ? (
          <div>

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
                  {/* FEFO Auto-Split Callout */}
                  {currentSelectedBatch.id === fefoBatch?.id && parseInt(quantityInput, 10) > currentSelectedBatch.current_quantity && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <strong>FEFO Auto-Split Enabled:</strong> Requested {quantityInput} units exceeds batch {currentSelectedBatch.batch_number} ({currentSelectedBatch.current_quantity} remaining). The remaining {(parseInt(quantityInput, 10) || 0) - currentSelectedBatch.current_quantity} units will be automatically allocated across sequential unexpired batches.
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                        Quantity to Dispense * {currentSelectedBatch.id === fefoBatch?.id && `(Max: ${totalUnexpiredStock})`}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={currentSelectedBatch.id === fefoBatch?.id ? totalUnexpiredStock : currentSelectedBatch.current_quantity}
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
                            onClick={() => setQuantityInput(prev => Math.min(currentSelectedBatch.id === fefoBatch?.id ? totalUnexpiredStock : currentSelectedBatch.current_quantity, (parseInt(prev, 10) || 0) + amount))}
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
                          Max Batch ({currentSelectedBatch.current_quantity})
                        </button>
                        {currentSelectedBatch.id === fefoBatch?.id && totalUnexpiredStock > currentSelectedBatch.current_quantity && (
                          <button
                            type="button"
                            onClick={() => setQuantityInput(totalUnexpiredStock)}
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 rounded hover:bg-emerald-100 transition"
                          >
                            Max All ({totalUnexpiredStock})
                          </button>
                        )}
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
          ) : (
          /* Prescription & Multi-Medicine Dispense Form */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Prescription & Multi-Medicine Dispense</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Add multiple medications for a prescription order. System auto-allocates across unexpired batches in FEFO order.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddRxLine}
                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 self-start sm:self-auto transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            {/* Prescription Header Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maria Santos"
                  value={rxPatient}
                  onChange={(e) => setRxPatient(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Prescribing Doctor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Roberto Cruz"
                  value={rxDoctor}
                  onChange={(e) => setRxDoctor(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Prescription / Rx #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rx-2026-0812"
                  value={rxRef}
                  onChange={(e) => setRxRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Multi-Item Prescription Lines */}
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {rxLines.map((line, idx) => {
                const selectedM = medList.find(m => m.id === parseInt(line.medicine_id, 10));
                const unexp = selectedM ? batchList.filter(b => b.medicine_id === selectedM.id && b.status === 'active' && b.current_quantity > 0 && b.days_to_expiry > 0) : [];
                const totalAvail = unexp.reduce((sum, b) => sum + b.current_quantity, 0);
                const estPrice = unexp[0]?.selling_price || selectedM?.latest_selling_price || 0;
                const lineQty = parseInt(line.quantity, 10) || 0;
                const estSubtotal = lineQty * estPrice;

                return (
                  <div key={line.id} className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-lg border border-slate-200 transition space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-400 font-mono">#{idx + 1}</span>
                      <div className="flex-1">
                        <select
                          value={line.medicine_id}
                          onChange={(e) => handleRxLineChange(line.id, 'medicine_id', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                        >
                          <option value="">-- Choose Medicine from Catalog --</option>
                          {medList.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.brand_name} - {m.generic_name} ({m.dosage_strength} {m.dosage_form}) • Stock: {m.total_stock}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRxLine(line.id)}
                        disabled={rxLines.length <= 1}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 transition"
                        title="Remove medicine line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {selectedM && (
                      <div className="grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-4 sm:col-span-3">
                          <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Dispense Qty</label>
                          <input
                            type="number"
                            min="1"
                            max={totalAvail}
                            value={line.quantity}
                            onChange={(e) => handleRxLineChange(line.id, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white text-right focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="col-span-8 sm:col-span-5">
                          <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Dosage / Instructions</label>
                          <input
                            type="text"
                            placeholder="e.g. 1 tab 3x daily"
                            value={line.instructions || ''}
                            onChange={(e) => handleRxLineChange(line.id, 'instructions', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-4 text-right">
                          <div className="text-[10px] text-slate-500">
                            Stock: <strong className={totalAvail < lineQty ? 'text-red-600' : 'text-emerald-700'}>{totalAvail}</strong> units ({unexp.length} batch{unexp.length !== 1 ? 'es' : ''})
                          </div>
                          <div className="font-bold text-slate-800 text-xs mt-0.5">
                            Est. ₱{estSubtotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Prescription Bottom Actions */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleAddRxLine}
                className="text-xs font-semibold text-slate-700 hover:text-emerald-700 flex items-center gap-1 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Medicine</span>
              </button>
              <div className="text-xs text-slate-600 font-medium">
                Total: <span className="font-bold text-slate-900">{rxLines.filter(l => l.medicine_id).length} item(s)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAllocatePrescriptionToCart}
              className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Auto-Allocate & Add Prescription to Dispensing Slip</span>
            </button>
          </div>
          )}
        </div>

        {/* Right Column: Dispensing Slip / Cart (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>{t('dispensing_slip_cart', 'Dispensing Slip / Cart')}</span>
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
                    <span>{t('dispense_clear_cart', 'Clear Cart')}</span>
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
                {t('dispense_empty_cart', 'No items added yet. Scan a barcode or select from catalog on the left.')}
              </div>
            )}

            {/* Patient & Reference input */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  {t('dispense_patient_ref', 'Patient Name or Rx Reference (Optional)')}
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
              <span className="text-xs font-semibold text-slate-600">{t('dispense_total_payable', 'Total Payable:')}</span>
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
                  ? 'Processing Dispense...'
                  : t('complete_dispense_print', 'Complete Dispense & Print Receipt')}
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
