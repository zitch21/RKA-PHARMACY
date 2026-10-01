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
  Lock,
  Zap,
  ScanLine,
  ClipboardList,
  Receipt,
  User,
  NotebookPen,
  X,
  Tag,
  DollarSign,
  RefreshCw,
  Package,
} from 'lucide-react';
import OverrideModal from '../components/OverrideModal';
import BatchStatusConfirmModal from '../components/BatchStatusConfirmModal';
import HelperText from '../components/HelperText';
import { useLanguage } from '../context/LanguageContext';
import { playScanSuccess, playScanError, playWarningBeep } from '../utils/audioTelemetry';
import { formatDatePH, getLocalDateISO } from '../utils/dateFormatter';

/* ── Expiry-tier badge token ─────────────────────── */
function ExpiryBadge({ tier, daysLeft }) {
  if (tier === 'Safe')     return <span className="badge-safe    text-[9px] font-bold px-1.5 py-px rounded tabular-nums">{daysLeft}d</span>;
  if (tier === 'Monitor')  return <span className="bg-slate-800 text-slate-300 border border-slate-600 text-[9px] font-bold px-1.5 py-px rounded tabular-nums">{daysLeft}d</span>;
  if (tier === 'Warning')  return <span className="badge-low     text-[9px] font-bold px-1.5 py-px rounded tabular-nums">{daysLeft}d</span>;
  if (tier === 'Critical') return <span className="badge-risk    text-[9px] font-bold px-1.5 py-px rounded tabular-nums">{daysLeft}d</span>;
  return <span className="bg-rose-950 text-rose-300 border border-rose-700 text-[9px] font-bold px-1.5 py-px rounded tabular-nums">EXP</span>;
}

export default function StockOutView({
  medicines,
  batches,
  onRefresh,
  onNavigate: _onNavigate,
  uiMode = 'clean',
  onOpenHelp,
  currentUser,
  initialMedicineId,
  activeSubTab = 'pos-counter',
  onSubTabChange,
}) {
  const { t } = useLanguage();
  const [dispenseMode, setDispenseMode] = useState('single'); // 'single' | 'prescription'

  /* Today Sales Sub-Tab State */
  const [todaySales, setTodaySales] = useState([]);
  const [todaySalesSearch, setTodaySalesSearch] = useState('');
  const [todaySalesLoading, setTodaySalesLoading] = useState(false);

  /* Price Inquiry Sub-Tab State */
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquirySelectedMed, setInquirySelectedMed] = useState(null);

  const fetchTodaySales = async () => {
    setTodaySalesLoading(true);
    try {
      const res = await fetch('/api/transactions?type=stock_out&limit=150');
      if (res.ok) {
        const data = await res.json();
        const todayStr = getLocalDateISO();
        const filtered = (data.transactions || []).filter(tx => 
          tx.created_at && tx.created_at.startsWith(todayStr)
        );
        setTodaySales(filtered);
      }
    } catch (err) {
      console.error('Failed to load today sales:', err);
    } finally {
      setTodaySalesLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'today-sales') {
      fetchTodaySales();
    }
  }, [activeSubTab]);

  /* Prescription / multi-item state */
  const [rxDoctor,  setRxDoctor]  = useState('');
  const [rxPatient, setRxPatient] = useState('');
  const [rxRef,     setRxRef]     = useState('');
  const [rxNotes,   setRxNotes]   = useState('');
  const [rxLines,   setRxLines]   = useState([
    { id: 1, medicine_id: '', quantity: '1', instructions: '' }
  ]);
  const [splitNotice, setSplitNotice] = useState(null);

  /* Single-item state */
  const [barcodeInput,    setBarcodeInput]    = useState('');
  const [medSearchTerm,   setMedSearchTerm]   = useState('');
  const [selectedMedId,   setSelectedMedId]   = useState('');
  const [cart,            setCart]            = useState([]);
  const [patientOrRef,    setPatientOrRef]    = useState('');
  const [dispenseNotes,   setDispenseNotes]   = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantityInput,   setQuantityInput]   = useState(1);

  /* Modal state */
  const [overrideModalOpen,        setOverrideModalOpen]        = useState(false);
  const [pendingOverrideItem,      setPendingOverrideItem]      = useState(null);
  const [statusConfirmModalOpen,   setStatusConfirmModalOpen]   = useState(false);
  const [pendingStatusConfirmItem, setPendingStatusConfirmItem] = useState(null);

  /* Status & receipt */
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    if (initialMedicineId) {
      setSelectedMedId(String(initialMedicineId));
    }
  }, [initialMedicineId]);

  useEffect(() => { barcodeInputRef.current?.focus(); }, []);

  // Persistent auto-focus on barcode scanner input after closing modals, cart updates, or receipts
  useEffect(() => {
    if (!overrideModalOpen && !statusConfirmModalOpen && !lastReceipt) {
      const timer = setTimeout(() => barcodeInputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [overrideModalOpen, statusConfirmModalOpen, lastReceipt, cart.length]);

  useEffect(() => {
    const handleWindowFocus = () => {
      if (!overrideModalOpen && !statusConfirmModalOpen && !lastReceipt) {
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [overrideModalOpen, statusConfirmModalOpen, lastReceipt]);

  /* ── F2 focus on barcode bar ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const medList   = medicines || [];
  const batchList = batches   || [];

  const selectedMed = medList.find(m => m.id === parseInt(selectedMedId));
  const medBatches  = batchList
    .filter(b => b.medicine_id === parseInt(selectedMedId) && b.status === 'active' && b.current_quantity > 0)
    .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));

  const fefoBatch           = medBatches.find(b => b.days_to_expiry > 0);
  const currentSelectedBatch = medBatches.find(b => b.id === parseInt(selectedBatchId));
  const unexpiredBatches    = medBatches.filter(b => b.days_to_expiry > 0);
  const totalUnexpiredStock = unexpiredBatches.reduce((acc, b) => acc + b.current_quantity, 0);

  /* ── Barcode processing ── */
  const processScannedBarcode = (query) => {
    if (!query) {
      playScanError();
      return;
    }
    const match = medList.find(
      m => m.barcode?.toLowerCase() === query.toLowerCase() ||
           m.code?.toLowerCase()    === query.toLowerCase()
    );
    if (match) {
      const activeUnexp = batchList.filter(
        b => b.medicine_id === match.id && b.status === 'active' && b.current_quantity > 0 && b.days_to_expiry > 0
      );

      if (activeUnexp.length === 0) {
        playScanError();
        setError(`Stock Depleted: No unexpired inventory available for ${match.brand_name}.`);
        return;
      }

      const earliest = activeUnexp.sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date))[0];
      if (earliest && (earliest.expiry_tier === 'Critical' || (earliest.days_to_expiry > 0 && earliest.days_to_expiry <= 30))) {
        playWarningBeep();
      } else {
        playScanSuccess();
      }

      if (dispenseMode === 'prescription') {
        const existingIdx = rxLines.findIndex(l => parseInt(l.medicine_id) === match.id);
        if (existingIdx >= 0) {
          setRxLines(prev => prev.map((l, i) => i === existingIdx
            ? { ...l, quantity: ((parseInt(l.quantity, 10) || 0) + 1).toString() } : l));
        } else {
          const emptyIdx = rxLines.findIndex(l => !l.medicine_id);
          if (emptyIdx >= 0) {
            setRxLines(prev => prev.map((l, i) => i === emptyIdx
              ? { ...l, medicine_id: match.id.toString(), quantity: '1' } : l));
          } else {
            setRxLines(prev => [...prev, { id: Date.now() + Math.random(), medicine_id: match.id.toString(), quantity: '1', instructions: '' }]);
          }
        }
      } else {
        handleSelectMedicine(match);
      }
      setBarcodeInput('');
      setError(null);
    } else {
      playScanError();
      setError(`No registered medicine found for barcode "${query}".`);
    }
  };

  const handleBarcodeSubmit = (e) => {
    e?.preventDefault();
    if (!barcodeInput.trim()) {
      playScanError();
      return;
    }
    processScannedBarcode(barcodeInput.trim());
  };

  /* Global scanner buffer */
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();
    const handler = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const now = Date.now();
      if (now - lastKeyTime > 120) buffer = '';
      lastKeyTime = now;
      if (e.key === 'Enter') {
        if (buffer.length >= 2) { e.preventDefault(); processScannedBarcode(buffer.trim()); buffer = ''; }
      } else if (e.key?.length === 1) {
        buffer += e.key;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [medList]);

  /* ── Medicine select ── */
  const handleSelectMedicine = (med) => {
    setSelectedMedId(med.id);
    const active = batchList
      .filter(b => b.medicine_id === med.id && b.status === 'active' && b.current_quantity > 0)
      .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
    const early = active.find(b => b.days_to_expiry > 0);
    setSelectedBatchId(early?.id || active[0]?.id || '');
    setQuantityInput(1);
    setError(null);

    if (early && (early.expiry_tier === 'Critical' || (early.days_to_expiry > 0 && early.days_to_expiry <= 30))) {
      playWarningBeep();
    }
  };

  const resetSingleSelection = () => {
    setSelectedMedId('');
    setSelectedBatchId('');
    setQuantityInput(1);
    setError(null);
    barcodeInputRef.current?.focus();
  };

  /* ── Add to cart ── */
  const handleAddToCart = () => {
    if (!selectedMed || !currentSelectedBatch) {
      setError('Please select a medicine and active batch.');
      return;
    }
    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty <= 0) { setError('Please enter a valid quantity greater than zero.'); return; }

    if (currentSelectedBatch.days_to_expiry <= 0) {
      setError(`STRICT BLOCK: Batch ${currentSelectedBatch.batch_number} is EXPIRED (${currentSelectedBatch.expiration_date}). Patient release is forbidden.`);
      return;
    }

    const isOverride = fefoBatch && currentSelectedBatch.id !== fefoBatch.id;
    if (isOverride) {
      if (qty > currentSelectedBatch.current_quantity) {
        setError(`Cannot dispense ${qty} items. Only ${currentSelectedBatch.current_quantity} remaining in batch ${currentSelectedBatch.batch_number}.`);
        return;
      }
      setPendingOverrideItem({ medicine: selectedMed, selectedBatch: currentSelectedBatch, fefoBatch, quantity: qty });
      setOverrideModalOpen(true);
      return;
    }

    /* FEFO Auto-Split */
    if (qty > currentSelectedBatch.current_quantity) {
      const unexp = medBatches.filter(b => b.days_to_expiry > 0);
      const totalAvail = unexp.reduce((sum, b) => sum + b.current_quantity, 0);
      const inCartTotal = cart.filter(c => c.medicine_id === selectedMed.id).reduce((sum, c) => sum + c.quantity, 0);
      if (qty + inCartTotal > totalAvail) {
        setError(`Cannot dispense ${qty} units. Total unexpired stock is ${totalAvail} units (${inCartTotal} already in cart).`);
        return;
      }
      let rem = qty;
      const allocs = [];
      for (const b of unexp) {
        if (rem <= 0) break;
        const inCart = cart.find(c => c.batch_id === b.id)?.quantity || 0;
        const avail  = b.current_quantity - inCart;
        if (avail <= 0) continue;
        const take = Math.min(avail, rem);
        if (take > 0) { allocs.push({ batch: b, qty: take }); rem -= take; }
      }
      if (rem > 0) { setError(`Cannot fulfill ${qty} units from remaining batch quantities.`); return; }
      for (const a of allocs) {
        addItemToCartInternal({ medicine: selectedMed, batch: a.batch, quantity: a.qty, unitPrice: a.batch.selling_price, isOverride: false, overrideReason: null, statusConfirmed: false, expiryStatus: a.batch.expiry_tier });
      }
      setSplitNotice(`FEFO Auto-Split: Dispensed ${qty} units of ${selectedMed.brand_name} across ${allocs.length} batches (${allocs.map(a => `${a.batch.batch_number}: ${a.qty}`).join(' + ')}).`);
      resetSingleSelection();
      return;
    }

    if (currentSelectedBatch.expiry_tier === 'Warning' || currentSelectedBatch.expiry_tier === 'Critical') {
      setPendingStatusConfirmItem({ medicine: selectedMed, selectedBatch: currentSelectedBatch, quantity: qty, unitPrice: currentSelectedBatch.selling_price });
      setStatusConfirmModalOpen(true);
      return;
    }

    addItemToCartInternal({ medicine: selectedMed, batch: currentSelectedBatch, quantity: qty, unitPrice: currentSelectedBatch.selling_price, isOverride: false, overrideReason: null, statusConfirmed: false, expiryStatus: currentSelectedBatch.expiry_tier });
    resetSingleSelection();
  };

  const addItemToCartInternal = ({ medicine, batch, quantity, unitPrice, isOverride, overrideReason, statusConfirmed, expiryStatus }) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.batch_id === batch.id);
      if (idx >= 0) {
        const existing = prev[idx];
        const newQty = existing.quantity + quantity;
        if (newQty > batch.current_quantity) { setError(`Cannot add ${quantity} more. Exceeds batch total stock (${batch.current_quantity}).`); return prev; }
        const updated = [...prev];
        updated[idx] = { ...existing, quantity: newQty, subtotal: newQty * unitPrice, is_override: isOverride || existing.is_override, override_reason: overrideReason || existing.override_reason, status_confirmed: statusConfirmed || existing.status_confirmed };
        return updated;
      }
      return [...prev, {
        id: Date.now() + Math.random(),
        medicine_id: medicine.id,
        batch_id: batch.id,
        brand_name: medicine.brand_name,
        generic_name: medicine.generic_name,
        dosage_strength: medicine.dosage_strength,
        batch_number: batch.batch_number,
        expiration_date: batch.expiration_date,
        days_to_expiry: batch.days_to_expiry,
        expiry_tier: batch.expiry_tier,
        unit_price: unitPrice,
        quantity,
        subtotal: quantity * unitPrice,
        is_override: isOverride,
        override_reason: overrideReason,
        status_confirmed: statusConfirmed,
        expiry_status: expiryStatus,
      }];
    });
  };

  const handleConfirmOverride = (reason) => {
    if (!pendingOverrideItem) return;
    addItemToCartInternal({ medicine: pendingOverrideItem.medicine, batch: pendingOverrideItem.selectedBatch, quantity: pendingOverrideItem.quantity, unitPrice: pendingOverrideItem.selectedBatch.selling_price, isOverride: true, overrideReason: reason, statusConfirmed: false, expiryStatus: pendingOverrideItem.selectedBatch.expiry_tier });
    setOverrideModalOpen(false);
    setPendingOverrideItem(null);
    resetSingleSelection();
  };

  /* ── Prescription handlers ── */
  const handleAddRxLine = () => setRxLines(prev => [...prev, { id: Date.now() + Math.random(), medicine_id: '', quantity: '1', instructions: '' }]);
  const handleRemoveRxLine = (id) => {
    if (rxLines.length <= 1) { setRxLines([{ id: Date.now(), medicine_id: '', quantity: '1', instructions: '' }]); }
    else { setRxLines(prev => prev.filter(l => l.id !== id)); }
  };
  const handleRxLineChange = (id, field, value) => setRxLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));

  const handleAllocatePrescriptionToCart = () => {
    setError(null); setSplitNotice(null);
    const filled = rxLines.filter(l => l.medicine_id);
    if (filled.length === 0) { setError('Please add at least one medicine item to the prescription.'); return; }
    const allocs = [];
    const splits = [];
    for (const line of filled) {
      const med = medList.find(m => m.id === parseInt(line.medicine_id, 10));
      if (!med) continue;
      const qty = parseInt(line.quantity, 10);
      if (isNaN(qty) || qty <= 0) { setError(`Please enter a valid quantity for ${med.brand_name}.`); return; }
      const active = batchList.filter(b => b.medicine_id === med.id && b.status === 'active' && b.current_quantity > 0 && b.days_to_expiry > 0).sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
      const totalAvail  = active.reduce((acc, b) => acc + b.current_quantity, 0);
      const inCartTotal = cart.filter(c => c.medicine_id === med.id).reduce((sum, c) => sum + c.quantity, 0);
      if (qty + inCartTotal > totalAvail) { setError(`Insufficient unexpired stock for ${med.brand_name}. Requested: ${qty}, in cart: ${inCartTotal}, available: ${totalAvail}.`); return; }
      let rem = qty;
      const lineAllocs = [];
      for (const b of active) {
        if (rem <= 0) break;
        const inCart = cart.find(c => c.batch_id === b.id)?.quantity || 0;
        const avail  = b.current_quantity - inCart;
        if (avail <= 0) continue;
        const take = Math.min(avail, rem);
        if (take > 0) { lineAllocs.push({ batch: b, qty: take }); rem -= take; }
      }
      if (rem > 0) { setError(`Could not fulfill ${qty} units for ${med.brand_name} from available batches.`); return; }
      if (lineAllocs.length > 1) splits.push(`${med.brand_name} (${lineAllocs.map(a => `${a.batch.batch_number}: ${a.qty}`).join(' + ')})`);
      for (const a of lineAllocs) allocs.push({ medicine: med, batch: a.batch, quantity: a.qty, unitPrice: a.batch.selling_price, isOverride: false, overrideReason: null, statusConfirmed: false, expiryStatus: a.batch.expiry_tier });
    }
    for (const item of allocs) addItemToCartInternal(item);
    if (rxPatient || rxRef) setPatientOrRef([rxPatient, rxRef ? `(${rxRef})` : ''].filter(Boolean).join(' '));
    if (rxDoctor || rxNotes) setDispenseNotes([rxDoctor ? `Attending: ${rxDoctor}` : '', rxNotes].filter(Boolean).join(' | '));
    setSplitNotice(splits.length > 0 ? `FEFO multi-batch splits: ${splits.join('; ')}` : `Added ${filled.length} prescription medication(s) to dispensing slip.`);
    setRxLines([{ id: Date.now(), medicine_id: '', quantity: '1', instructions: '' }]);
    setRxPatient(''); setRxDoctor(''); setRxRef(''); setRxNotes('');
  };

  const handleRemoveFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
  const totalCartAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  /* ── Checkout ── */
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/transactions/stock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            medicine_id: item.medicine_id,
            batch_id: item.batch_id,
            quantity: item.quantity,
            custom_price: item.unit_price,
            override_reason: item.override_reason,
            status_confirmed: item.status_confirmed || false,
            expiry_status: item.expiry_status || null,
          })),
          reference_no: patientOrRef || undefined,
          notes: dispenseNotes || 'Clinic outpatient dispense',
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete dispensing');
      setLastReceipt({ receipt_no: data.receipt_no, date: formatDatePH(new Date(), 'full'), items: [...cart], total: totalCartAmount, notes: dispenseNotes, reference: patientOrRef });
      setCart([]); setPatientOrRef(''); setDispenseNotes('');
      onRefresh();
      try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } }); } catch {}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReprintTodayTx = (tx) => {
    const qty = Math.abs(Number(tx.quantity || 1));
    const price = Number(tx.selling_price || tx.unit_price || 0);
    const subtotal = Math.abs(Number(tx.total_amount || 0)) || (qty * price);
    setLastReceipt({
      receipt_no: tx.reference_no || `RCPT-${tx.id}`,
      date: formatDatePH(tx.created_at, 'full'),
      items: [{
        brand_name: tx.brand_name || 'Dispensed Item',
        quantity: qty,
        unit_price: price,
        batch_number: tx.batch_number || 'N/A',
        expiration_date: tx.expiration_date || 'N/A',
        subtotal,
      }],
      total: subtotal,
      notes: tx.notes || 'Outpatient sales record',
      reference: tx.reference_no || '',
    });
  };

  /* ── Filtered medicine list ── */
  const filteredMeds = medList.filter(m =>
    !medSearchTerm ||
    m.brand_name.toLowerCase().includes(medSearchTerm.toLowerCase()) ||
    m.generic_name.toLowerCase().includes(medSearchTerm.toLowerCase()) ||
    m.code?.toLowerCase().includes(medSearchTerm.toLowerCase())
  );

  return (
    <div className={uiMode === 'clean' ? 'space-y-4 pb-8' : 'space-y-5 pb-12'}>

      {/* ══ Page Header ══ */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowUpFromLine className="w-4 h-4 text-teal-600" />
            {t('dispense_title', 'Dispense (FEFO Allocator — POS Terminal)')}
          </h2>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-0.5">
            {t('dispense_subtitle', 'Automatic earliest-expiration batch deduction with audit-verified user override')}
          </HelperText>
        </div>
        <div className="flex items-center gap-2">
          {onOpenHelp && (
            <button onClick={onOpenHelp} type="button" className="text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer">
              <HelpCircle className="w-3.5 h-3.5 text-teal-700" />
              {t('btn_how_to_use', 'How to Dispense')}
            </button>
          )}
          <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            {t('badge_fefo_active', 'FEFO Engine Active')}
          </span>
        </div>
      </div>

      {/* ══ GLOBAL BARCODE SCAN BAR ══ */}
      <div className={uiMode === 'clean' ? 'bg-white dark:bg-[#161b22] border-2 border-teal-500 rounded-2xl p-4 shadow-sm' : 'bg-slate-900 dark:bg-[#161b22] border border-slate-800 dark:border-white/10 rounded-2xl shadow-sm'}>
        <div className={uiMode === 'clean' ? 'pb-2 mb-2 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between' : 'px-4 py-2 border-b border-slate-800 dark:border-white/10 flex items-center gap-2'}>
          <div className="flex items-center gap-2">
            <ScanLine className={`w-4 h-4 ${uiMode === 'clean' ? 'text-teal-600' : 'text-teal-400'}`} />
            <span className={`font-bold ${uiMode === 'clean' ? 'text-xs uppercase tracking-wider text-slate-800 dark:text-white' : 'text-[10px] uppercase tracking-widest text-teal-400 tabular-nums'}`}>
              {uiMode === 'clean' ? t('barcode_scanner_rapid', 'Barcode Scanner / Rapid Medicine Finder') : t('global_barcode_input', 'Global Barcode Input')}
            </span>
          </div>
          <kbd className={`px-2 py-0.5 rounded text-[10px] tabular-nums font-bold ${
            uiMode === 'clean' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700/40' : 'bg-slate-800 border border-slate-700 text-slate-300'
          }`}>
            {t('f2_to_focus', 'F2 to focus')}
          </kbd>
        </div>
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-3">
          <Barcode className={`w-6 h-6 shrink-0 ${uiMode === 'clean' ? 'text-teal-600' : 'text-zinc-500'}`} />
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder={uiMode === 'clean' ? t('ready_scanner_placeholder', "Ready for USB scanner or manual entry... (Press F2 to focus)") : t('ready_scanner_placeholder', "Ready for USB scanner or manual entry… (F2)")}
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            className={`flex-1 rounded-xl focus:outline-none transition tabular-nums ${
              uiMode === 'clean'
                ? 'h-13 px-4 text-base font-bold bg-slate-50 dark:bg-[#1a202c] focus:bg-white dark:focus:bg-[#1e2430] text-slate-900 dark:text-white border-2 border-slate-300 dark:border-white/10 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 placeholder:text-slate-400 dark:placeholder:text-slate-500'
                : 'px-3 py-2 text-xs bg-zinc-900 text-zinc-100 border border-zinc-700 focus:ring-2 focus:ring-teal-500 placeholder:text-zinc-600'
            }`}
            autoFocus
          />
          <button
            type="submit"
            className={`font-bold text-white rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center shrink-0 active:scale-95 ${
              uiMode === 'clean' ? 'h-13 px-6 text-sm bg-teal-600 hover:bg-teal-700' : 'px-4 py-2 text-xs bg-teal-600 hover:bg-teal-500'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-1.5" />
            {t('scan_btn', 'Scan')}
          </button>
        </form>
      </div>

      {/* Split / Error notices */}
      {splitNotice && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />{splitNotice}</div>
          <button type="button" onClick={() => setSplitNotice(null)} className="text-teal-400 hover:text-teal-700 font-bold"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-700 font-bold"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ══ SUB-TAB: TODAY'S SALES ══ */}
      {activeSubTab === 'today-sales' && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('todays_transactions', "Today's Transactions")}</p>
                <p className="text-2xl font-black text-slate-800 tabular-nums">{todaySales.length}</p>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('gross_sales_today', "Gross Sales Today")}</p>
                <p className="text-2xl font-black text-teal-700 tabular-nums">
                  ₱{todaySales.reduce((acc, tx) => acc + (Math.abs(Number(tx.total_amount || 0)) || (Math.abs(Number(tx.quantity || 1)) * Number(tx.selling_price || tx.unit_price || 0))), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('total_units_dispensed', "Total Units Dispensed")}</p>
                <p className="text-2xl font-black text-slate-800 tabular-nums">
                  {todaySales.reduce((acc, tx) => acc + Math.abs(Number(tx.quantity || 0)), 0)}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Package className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search bar & Refresh */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('search_tx_placeholder', "Search transaction, drug, batch, or ref...")}
                value={todaySalesSearch}
                onChange={(e) => setTodaySalesSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={fetchTodaySales}
                disabled={todaySalesLoading}
                className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${todaySalesLoading ? 'animate-spin' : ''}`} />
                {t('btn_refresh_ledger', 'Refresh Ledger')}
              </button>
              <button
                type="button"
                onClick={() => onSubTabChange?.('pos-counter')}
                className="px-3 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('btn_new_dispense', 'New Dispense')}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 border-b border-zinc-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">{t('col_time', 'Time')}</th>
                    <th className="px-4 py-3">{t('col_receipt_ref', 'Receipt / Ref')}</th>
                    <th className="px-4 py-3">{t('col_med_batch', 'Medicine & Batch')}</th>
                    <th className="px-4 py-3 text-right">{t('col_qty', 'Qty')}</th>
                    <th className="px-4 py-3 text-right">{t('inv_selling_price', 'Price')}</th>
                    <th className="px-4 py-3 text-right">{t('stockin_subtotal', 'Total')}</th>
                    <th className="px-4 py-3 text-center">{t('col_action', 'Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {todaySales
                    .filter(tx => {
                      if (!todaySalesSearch) return true;
                      const q = todaySalesSearch.toLowerCase();
                      return (
                        (tx.reference_no && tx.reference_no.toLowerCase().includes(q)) ||
                        (tx.brand_name && tx.brand_name.toLowerCase().includes(q)) ||
                        (tx.batch_number && tx.batch_number.toLowerCase().includes(q)) ||
                        (tx.notes && tx.notes.toLowerCase().includes(q))
                      );
                    })
                    .map((tx) => {
                      const qty = Math.abs(Number(tx.quantity || 1));
                      const price = Number(tx.selling_price || tx.unit_price || 0);
                      const subtotal = Math.abs(Number(tx.total_amount || 0)) || (qty * price);
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap tabular-nums">
                            {formatDatePH(tx.created_at, 'time')}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                            {tx.reference_no || `TX-${tx.id}`}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900">{tx.brand_name || 'Item'}</span>
                            {tx.batch_number && (
                              <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                Lot: {tx.batch_number}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums">
                            {qty}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                            ₱{price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-slate-900 tabular-nums">
                            ₱{subtotal.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleReprintTodayTx(tx)}
                              className="px-2.5 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3 h-3" />
                              {t('stockout_reprint', 'Reprint')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {todaySales.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">{t('no_tx_today', 'No transactions recorded today yet.')}</p>
                        <p className="text-[11px] mt-0.5">{t('stockout_no_tx_desc', 'Dispensed transactions made today will appear here for audit and instant receipt reprinting.')}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ SUB-TAB: RAPID PRICE INQUIRY ══ */}
      {activeSubTab === 'price-inquiry' && (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t('inquiry_title', 'Instant Price & Inventory Inquiry Scanner')}
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('inquiry_placeholder', 'Scan barcode or type brand, generic name, dosage, or SKU...')}
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                autoFocus
                className="w-full pl-11 pr-4 py-3 text-sm font-semibold bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left list of matching medicines */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-zinc-200 text-xs font-bold text-slate-600">
                {t('med_catalog_title', 'Medicines Catalog')}
              </div>
              <div className="max-h-120 overflow-y-auto divide-y divide-zinc-100">
                {medList
                  .filter(m =>
                    !inquirySearch ||
                    m.brand_name.toLowerCase().includes(inquirySearch.toLowerCase()) ||
                    m.generic_name.toLowerCase().includes(inquirySearch.toLowerCase()) ||
                    m.code?.toLowerCase().includes(inquirySearch.toLowerCase())
                  )
                  .map(m => {
                    const activeB = batchList.filter(b => b.medicine_id === m.id && b.status === 'active' && b.current_quantity > 0);
                    const stock = activeB.reduce((s, b) => s + b.current_quantity, 0);
                    const isSelected = inquirySelectedMed?.id === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setInquirySelectedMed(m)}
                        className={`p-3 cursor-pointer transition flex items-center justify-between ${
                          isSelected ? 'bg-teal-50 border-l-4 border-teal-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs text-slate-900">{m.brand_name}</p>
                          <p className="text-[10px] text-slate-500">{m.generic_name} {m.dosage_strength ? `· ${m.dosage_strength}` : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-teal-700 tabular-nums">₱{(m.latest_selling_price || m.selling_price || 0).toFixed(2)}</p>
                          <p className="text-[10px] text-slate-400 tabular-nums">{stock} {t('in_stock_pill', 'in stock')}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Card: Full detail of chosen medicine */}
            <div className="lg:col-span-7 space-y-4">
              {inquirySelectedMed ? (() => {
                const activeB = batchList
                  .filter(b => b.medicine_id === inquirySelectedMed.id && b.status === 'active' && b.current_quantity > 0)
                  .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
                const stock = activeB.reduce((s, b) => s + b.current_quantity, 0);
                const earliestB = activeB[0];
                return (
                  <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-6 space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{inquirySelectedMed.category || 'General Medicine'}</span>
                        <h3 className="text-xl font-extrabold text-slate-900">{inquirySelectedMed.brand_name}</h3>
                        <p className="text-xs text-slate-600 font-medium">{inquirySelectedMed.generic_name} {inquirySelectedMed.dosage_strength ? `· ${inquirySelectedMed.dosage_strength}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('retail_selling_price', 'Retail Selling Price')}</span>
                        <div className="text-3xl font-black text-teal-600 tabular-nums">
                          ₱{(inquirySelectedMed.latest_selling_price || inquirySelectedMed.selling_price || earliestB?.selling_price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-y border-zinc-100 py-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{t('total_in_stock', 'Total In-Stock')}</span>
                        <p className="text-lg font-black text-slate-800 tabular-nums">{stock} {inquirySelectedMed.unit_of_measure || 'units'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{t('active_batches', 'Active Batches')}</span>
                        <p className="text-lg font-black text-slate-800 tabular-nums">{activeB.length} lots</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{t('earliest_expiry', 'Earliest Expiry')}</span>
                        <div className="text-xs font-bold text-slate-800 mt-1">
                          {earliestB ? (
                            <span className="flex items-center gap-1.5">
                              {formatDatePH(earliestB.expiration_date, 'compact')}
                              <ExpiryBadge tier={earliestB.expiry_tier} daysLeft={earliestB.days_to_expiry} />
                            </span>
                          ) : t('none_label', 'None')}
                        </div>
                      </div>
                    </div>

                    {/* Batch breakdown */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('fefo_allocation_order', 'FEFO Batch Allocation Order')}</h4>
                      <div className="space-y-1.5">
                        {activeB.map((b, idx) => (
                          <div key={b.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-mono font-bold text-slate-900">{b.batch_number}</span>
                                <span className="text-slate-400 text-[10px] ml-2">Exp: {formatDatePH(b.expiration_date, 'compact')}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <ExpiryBadge tier={b.expiry_tier} daysLeft={b.days_to_expiry} />
                              <span className="font-bold text-slate-800 tabular-nums">{b.current_quantity} units</span>
                            </div>
                          </div>
                        ))}
                        {activeB.length === 0 && (
                          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                            {t('zero_stock_warning', 'Zero stock available in active batches. Restock required.')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectMedicine(inquirySelectedMed);
                          onSubTabChange?.('pos-counter');
                        }}
                        disabled={stock <= 0}
                        className="flex-1 py-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {t('load_into_dispense', 'Load into Dispense Terminal')}
                      </button>
                    </div>
                  </div>
                );
              })() : (
                <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-12 text-center text-slate-400">
                  <Tag className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="font-bold text-slate-600 text-sm">{t('select_med_live_price', 'Select a medicine to view live retail pricing')}</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {t('select_med_live_price_desc', 'Type a name in the search bar or pick from the list on the left to inspect unit price, available batch stock, and FEFO expiry timeline.')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ SPLIT-PANE TERMINAL LAYOUT ══ */}
      {(activeSubTab === 'pos-counter' || (!activeSubTab || (activeSubTab !== 'today-sales' && activeSubTab !== 'price-inquiry'))) && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── LEFT PANE: Medicine selector & batch details ── */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          {/* Mode Toggle Tabs */}
          <div className="flex items-center gap-0 border-b border-zinc-200">
            <button
              type="button"
              onClick={() => setDispenseMode('single')}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                dispenseMode === 'single'
                  ? 'border-teal-500 text-teal-700 bg-teal-50/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <Barcode className="w-3.5 h-3.5" />
              {t('single_item_scanner', 'Single Item & Scanner')}
            </button>
            <button
              type="button"
              onClick={() => setDispenseMode('prescription')}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                dispenseMode === 'prescription'
                  ? 'border-teal-500 text-teal-700 bg-teal-50/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              {t('prescription_multi_med', 'Prescription / Multi-Medicine')}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                dispenseMode === 'prescription'
                  ? 'bg-teal-600 text-white'
                  : 'bg-zinc-200 text-zinc-600'
              }`}>
                {rxLines.filter(l => l.medicine_id).length}
              </span>
            </button>
          </div>

          <div className="p-4 space-y-4">
            {dispenseMode === 'single' ? (
              <>
                {/* Medicine Search + Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {t('medicine_catalog_filter', 'Medicine Catalog Filter')}
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder={t('filter_med_placeholder', 'Type brand, generic, or code to filter…')}
                      value={medSearchTerm}
                      onChange={(e) => setMedSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-zinc-50 focus:bg-white"
                    />
                    {medSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setMedSearchTerm('')}
                        className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700"
                      ><X className="w-3 h-3" /></button>
                    )}
                  </div>
                  <select
                    value={selectedMedId}
                    onChange={(e) => { const id = e.target.value; setSelectedMedId(id); const m = medList.find(x => x.id === parseInt(id)); if (m) handleSelectMedicine(m); }}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-800"
                  >
                    <option value="">{t('choose_med_dispense', '— Choose medicine to dispense —')} ({filteredMeds.length})</option>
                    {filteredMeds.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.brand_name} · {m.generic_name} ({m.dosage_strength} {m.dosage_form}) · Stock: {m.total_stock}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Details — auto-populated */}
                {selectedMed && (
                  <div className="space-y-3 animate-in fade-in">
                    {/* Clear visual confirmation of FEFO Auto-Selected Batch */}
                    {fefoBatch && (
                      <div className="p-3.5 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-emerald-950 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <ShieldCheck className="w-5 h-5" />
                          </span>
                          <div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                              {t('earliest_batch_auto_selected', 'Earliest Batch Auto-Selected')}
                            </span>
                            <span className="text-sm font-black text-slate-900 tabular-nums">
                              Lot {fefoBatch.batch_number} • Exp. {formatDatePH(fefoBatch.expiration_date, 'medium')} ({fefoBatch.days_to_expiry}d left)
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-black text-xs tabular-nums shrink-0">
                          {fefoBatch.current_quantity} in stock
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        {t('available_batches_fefo', 'Available Batches — FEFO Sorted')}
                      </label>
                      <HelperText uiMode={uiMode} as="span" className="text-[10px] text-teal-700 font-semibold">
                        {t('earliest_expiring_auto_rec', 'Earliest expiring auto-recommended')}
                      </HelperText>
                    </div>

                    {medBatches.length > 0 ? (
                      <div className="space-y-1.5 max-h-52 overflow-y-auto">
                        {medBatches.map(b => {
                          const isFefo    = fefoBatch?.id === b.id;
                          const isSelected = parseInt(selectedBatchId) === b.id;
                          const isExpired  = b.days_to_expiry <= 0;
                          return (
                            <div
                              key={b.id}
                              onClick={() => {
                                if (isExpired) {
                                  playScanError();
                                  return;
                                }
                                if (uiMode === 'clean' && fefoBatch && b.id !== fefoBatch.id) {
                                  // Simplified override flow: prompt user with plain choices
                                  setPendingOverrideItem({
                                    medicine: selectedMed,
                                    selectedBatch: b,
                                    fefoBatch,
                                    quantity: parseInt(quantityInput, 10) || 1
                                  });
                                  setOverrideModalOpen(true);
                                } else {
                                  setSelectedBatchId(b.id);
                                  if (b.expiry_tier === 'Critical' || (b.days_to_expiry > 0 && b.days_to_expiry <= 30)) {
                                    playWarningBeep();
                                  }
                                }
                              }}
                              className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                                isExpired
                                  ? 'bg-rose-50/50 border-rose-200 opacity-60 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-teal-50/80 border-teal-500 ring-1 ring-teal-400/30'
                                    : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/70'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="batchSelection"
                                  disabled={isExpired}
                                  checked={isSelected}
                                  onChange={() => setSelectedBatchId(b.id)}
                                  className="text-teal-600 focus:ring-teal-500"
                                  onClick={e => e.stopPropagation()}
                                />
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="tabular-nums font-bold text-xs text-slate-900">{b.batch_number}</span>
                                    {isFefo && (
                                      <span className="badge-active text-[9px] font-bold px-1.5 py-px rounded inline-flex items-center gap-0.5">
                                        <ShieldCheck className="w-2.5 h-2.5" /> FEFO ✓
                                      </span>
                                    )}
                                    {isExpired && (
                                      <span className="badge-risk text-[9px] font-bold px-1.5 py-px rounded">{t('badge_expired_blocked', 'EXPIRED — BLOCKED')}</span>
                                    )}
                                    {!isExpired && !isFefo && (
                                      <ExpiryBadge tier={b.expiry_tier} daysLeft={b.days_to_expiry} />
                                    )}
                                  </div>
                                  <div className="text-[10px] text-zinc-400 mt-0.5 tabular-nums">
                                    Exp: <span className="font-semibold text-zinc-600">{formatDatePH(b.expiration_date, 'compact')}</span> · {b.days_to_expiry}d left
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-bold text-slate-900 tabular-nums">{b.current_quantity} {selectedMed.unit_of_measure}s</div>
                                <div className="text-[10px] text-teal-700 font-semibold tabular-nums">₱{Number(b.selling_price || 0).toFixed(2)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                        {t('no_active_stock_available', 'No active stock available for this medicine.')}
                      </div>
                    )}

                    {/* Quantity + Price entry */}
                    {currentSelectedBatch && (
                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                        {/* ══ PRE-DISPENSE VISUAL WARNING ON CRITICAL (1-30d) / AT-RISK BATCHES ══ */}
                        {(() => {
                          const isCritical = currentSelectedBatch.expiry_tier === 'Critical' || (currentSelectedBatch.days_to_expiry > 0 && currentSelectedBatch.days_to_expiry <= 30);
                          const isWarning = !isCritical && (currentSelectedBatch.expiry_tier === 'Warning' || (currentSelectedBatch.days_to_expiry > 30 && currentSelectedBatch.days_to_expiry <= 90));
                          const isAtRisk = currentSelectedBatch.expiry_risk_margin !== undefined && currentSelectedBatch.expiry_risk_margin !== null && currentSelectedBatch.expiry_risk_margin < 0;

                          if (!isCritical && !isWarning && !isAtRisk) return null;

                          return (
                            <div className={`p-3.5 rounded-xl border space-y-2 transition ${
                              isCritical
                                ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                                : 'bg-amber-50/90 border-amber-300 text-amber-950'
                            }`}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <ShieldAlert className={`w-4 h-4 shrink-0 ${isCritical ? 'text-rose-600 animate-pulse' : 'text-amber-600'}`} />
                                  <span className="font-bold text-xs uppercase tracking-wide">
                                    {isCritical
                                      ? 'Pre-Dispense Alert: Critical Expiry Batch Auto-Selected'
                                      : isAtRisk
                                        ? 'Pre-Dispense Warning: Negative Risk Margin Batch'
                                        : 'Pre-Dispense Caution: Warning Tier Batch'}
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tabular-nums uppercase border shrink-0 ${
                                  isCritical
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}>
                                  {currentSelectedBatch.days_to_expiry}d Remaining
                                </span>
                              </div>

                              <p className="text-[11px] leading-relaxed text-zinc-700">
                                {isCritical
                                  ? `Batch ${currentSelectedBatch.batch_number} expires on ${currentSelectedBatch.expiration_date} (${currentSelectedBatch.days_to_expiry} days remaining). Pharmacist verification required before patient handover.`
                                  : `Batch ${currentSelectedBatch.batch_number} expires on ${currentSelectedBatch.expiration_date}. Near-term consumption counseling recommended.`}
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-200/80 text-[10px]">
                                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCritical ? 'bg-rose-600' : 'bg-amber-600'}`} />
                                  <span>{t('dispense_step_verify_pkg', '1. Verify physical packaging & blister seals')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCritical ? 'bg-rose-600' : 'bg-amber-600'}`} />
                                  <span>{t('dispense_step_advise_patient', '2. Advise patient on complete near-term dosage')}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* FEFO Auto-split callout */}
                        {currentSelectedBatch.id === fefoBatch?.id && parseInt(quantityInput, 10) > currentSelectedBatch.current_quantity && (
                          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span><strong>{t('fefo_autosplit_enabled_prefix', 'FEFO Auto-Split Enabled:')}</strong> {t('fefo_autosplit_desc', { requested: quantityInput, batch: currentSelectedBatch.batch_number, remaining: currentSelectedBatch.current_quantity }, `Requested ${quantityInput} units exceeds batch ${currentSelectedBatch.batch_number} (${currentSelectedBatch.current_quantity} remaining). Remainder will be allocated across next unexpired batches.`)}</span>
                          </div>
                        )}

                        {/* Override warning */}
                        {fefoBatch && currentSelectedBatch.id !== fefoBatch.id && (
                          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span><strong>{t('notice_label', 'Notice:')}</strong> {t('fefo_override_notice_desc', { batch: currentSelectedBatch.batch_number, earliest: fefoBatch.batch_number }, `Selected batch ${currentSelectedBatch.batch_number} is NOT the FEFO-recommended earliest batch (${fefoBatch.batch_number}). An override justification will be required.`)}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                              {t('qty_to_dispense', 'Quantity to Dispense')} {currentSelectedBatch.id === fefoBatch?.id && `(Max: ${totalUnexpiredStock})`}
                            </label>
                            {/* Stepper with - and + */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setQuantityInput(prev => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                                className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-2xl font-black border border-slate-300 flex items-center justify-center transition cursor-pointer select-none"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={currentSelectedBatch.id === fefoBatch?.id ? totalUnexpiredStock : currentSelectedBatch.current_quantity}
                                value={quantityInput}
                                onChange={(e) => setQuantityInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddToCart(); } }}
                                className="h-12 flex-1 px-3 text-center text-xl sm:text-2xl font-black border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white tabular-nums text-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const maxAllowed = currentSelectedBatch.id === fefoBatch?.id ? totalUnexpiredStock : currentSelectedBatch.current_quantity;
                                  setQuantityInput(prev => Math.min(maxAllowed, (parseInt(prev, 10) || 0) + 1));
                                }}
                                className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-2xl font-black border border-slate-300 flex items-center justify-center transition cursor-pointer select-none"
                              >
                                +
                              </button>
                            </div>
                            {/* Quick +5, +10, Max buttons */}
                            <div className="flex items-center gap-2 mt-2.5">
                              {[5, 10].map(n => {
                                const maxAllowed = currentSelectedBatch.id === fefoBatch?.id ? totalUnexpiredStock : currentSelectedBatch.current_quantity;
                                return (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setQuantityInput(prev => Math.min(maxAllowed, (parseInt(prev, 10) || 0) + n))}
                                    className="h-11 flex-1 text-xs font-black bg-white border border-slate-300 text-slate-800 rounded-xl hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 transition cursor-pointer active:scale-95 shadow-2xs"
                                  >
                                    +{n}
                                  </button>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => {
                                  const maxAllowed = currentSelectedBatch.id === fefoBatch?.id ? totalUnexpiredStock : currentSelectedBatch.current_quantity;
                                  setQuantityInput(maxAllowed);
                                }}
                                className="h-11 flex-1 text-xs font-black bg-teal-50 border border-teal-300 text-teal-800 rounded-xl hover:bg-teal-100 transition cursor-pointer active:scale-95 shadow-2xs"
                              >
                                Max ({currentSelectedBatch.id === fefoBatch?.id ? totalUnexpiredStock : currentSelectedBatch.current_quantity})
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col justify-between">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                                <span>{t('unit_price_label', 'Unit Price (₱)')}</span>
                                <span className="text-[10px] text-zinc-500 font-normal bg-zinc-200 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> {t('locked_tag', 'Locked')}
                                </span>
                              </label>
                              <div className="h-12 w-full px-4 border-2 border-slate-200 rounded-xl bg-slate-100 font-black text-xl text-slate-900 flex items-center justify-between tabular-nums">
                                <span>₱{Number(currentSelectedBatch.selling_price || 0).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="mt-3 p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
                              <span className="text-xs font-bold text-teal-900 uppercase">{t('subtotal_label', 'Subtotal')}</span>
                              <span className="text-xl font-black tabular-nums text-teal-950 tabular-nums">
                                ₱{((parseInt(quantityInput, 10) || 0) * Number(currentSelectedBatch.selling_price || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddToCart}
                          className="w-full h-12 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          {t('dispense_add_to_cart', 'Add to Dispensing Slip')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* ── Prescription / Multi-Medicine Mode ── */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-teal-600" />
                      {t('rx_multi_med_dispense', 'Prescription & Multi-Medicine Dispense')}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{t('rx_multi_med_desc', 'System auto-allocates across unexpired batches in FEFO order.')}</p>
                  </div>
                  <button type="button" onClick={handleAddRxLine}
                    className="px-2.5 py-1 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-1 transition shadow-xs cursor-pointer">
                    <Plus className="w-3 h-3" /> {t('btn_add_line', 'Add Line')}
                  </button>
                </div>

                {/* Rx Header */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                  {[
                    { label: t('patient_name_label', 'Patient Name'), ph: 'e.g. Maria Santos', value: rxPatient, setter: setRxPatient },
                    { label: t('prescribing_doctor_label', 'Prescribing Doctor'), ph: 'e.g. Dr. Roberto Cruz', value: rxDoctor, setter: setRxDoctor },
                    { label: t('prescription_rx_num', 'Prescription / Rx #'), ph: 'e.g. Rx-2026-0812', value: rxRef, setter: setRxRef, mono: true },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">{f.label}</label>
                      <input type="text" placeholder={f.ph} value={f.value}
                        onChange={e => f.setter(e.target.value)}
                        className={`w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-1 focus:ring-teal-500 bg-white ${f.mono ? 'tabular-nums' : ''}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Rx Lines */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {rxLines.map((line, idx) => {
                    const selMed     = medList.find(m => m.id === parseInt(line.medicine_id, 10));
                    const activeBatches = selMed ? batchList.filter(b => b.medicine_id === selMed.id && b.status === 'active' && b.current_quantity > 0 && b.days_to_expiry > 0) : [];
                    const totalAvail = activeBatches.reduce((s, b) => s + b.current_quantity, 0);
                    const estPrice   = activeBatches[0]?.selling_price || 0;
                    const lineQty    = parseInt(line.quantity, 10) || 0;
                    return (
                      <div key={line.id} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2 hover:bg-zinc-100/60 transition">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 tabular-nums shrink-0">#{idx + 1}</span>
                          <select value={line.medicine_id}
                            onChange={e => handleRxLineChange(line.id, 'medicine_id', e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-1 focus:ring-teal-500 bg-white font-medium"
                          >
                            <option value="">{t('choose_med_dispense', '— Choose Medicine —')}</option>
                            {medList.map(m => <option key={m.id} value={m.id}>{m.brand_name} · {m.generic_name} ({m.dosage_strength} {m.dosage_form}) · Stock: {m.total_stock}</option>)}
                          </select>
                          <button type="button" onClick={() => handleRemoveRxLine(line.id)}
                            disabled={rxLines.length <= 1}
                            className="p-1 text-zinc-400 hover:text-rose-600 disabled:opacity-30 transition cursor-pointer"
                          ><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        {selMed && (
                          <div className="grid grid-cols-12 gap-2 items-center text-xs">
                            <div className="col-span-3">
                              <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">{t('col_qty', 'Qty')}</label>
                              <input type="number" min="1" max={totalAvail} value={line.quantity}
                                onChange={e => handleRxLineChange(line.id, 'quantity', e.target.value)}
                                className="w-full px-2 py-1 text-xs font-bold border border-zinc-300 rounded bg-white text-right focus:ring-1 focus:ring-teal-500 tabular-nums"
                              />
                            </div>
                            <div className="col-span-5">
                              <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">{t('instructions_label', 'Instructions')}</label>
                              <input type="text" placeholder={t('ph_dosage_instructions', 'e.g. 1 tab 3× daily')} value={line.instructions || ''}
                                onChange={e => handleRxLineChange(line.id, 'instructions', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-zinc-300 rounded bg-white focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                            <div className="col-span-4 text-right">
                              <div className={`text-[9px] tabular-nums ${totalAvail < lineQty ? 'text-rose-600 font-bold' : 'text-teal-700'}`}>
                                Stock: {totalAvail} ({activeBatches.length} lot{activeBatches.length !== 1 ? 's' : ''})
                              </div>
                              <div className="font-bold text-slate-800 text-xs mt-0.5 tabular-nums">Est. ₱{(lineQty * estPrice).toFixed(2)}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-zinc-200 flex items-center justify-between gap-2">
                  <button type="button" onClick={handleAddRxLine}
                    className="text-xs font-semibold text-zinc-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> {t('add_another_med', 'Add Another Medicine')}
                  </button>
                  <div className="text-xs text-zinc-500">
                    {rxLines.filter(l => l.medicine_id).length} item(s) pending
                  </div>
                </div>

                <button type="button" onClick={handleAllocatePrescriptionToCart}
                  className="w-full py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer">
                  <ShoppingCart className="w-4 h-4" />
                  {t('auto_allocate_prescription', 'Auto-Allocate & Add Prescription to Dispensing Slip')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANE: Dispensing Slip / Cart ── */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col">
          {/* Cart Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
              <Receipt className="w-4 h-4 text-teal-600" />
              {t('dispensing_slip_cart', 'Dispensing Slip')}
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button type="button" onClick={() => setCart([])}
                  className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer">
                  <Trash2 className="w-3 h-3" /> {t('btn_clear', 'Clear')}
                </button>
              )}
              <span className="text-xs bg-zinc-100 text-zinc-600 font-bold tabular-nums px-2 py-0.5 rounded-full">
                {cart.length} item{cart.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Line Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length > 0 ? (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex justify-between items-start gap-2 hover:bg-zinc-100/50 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{item.brand_name}</span>
                        <ExpiryBadge tier={item.expiry_tier} daysLeft={item.days_to_expiry} />
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{item.generic_name} ({item.dosage_strength})</div>
                      <div className="text-[10px] mt-1 flex items-center gap-2 flex-wrap">
                        <span className="tabular-nums text-zinc-500">{t('cart_fefo_lot', 'FEFO Lot:')} <strong className="text-slate-700">{item.batch_number}</strong></span>
                        <span className="tabular-nums text-zinc-500">{t('cart_exp', 'Exp:')} <strong className="text-slate-700">{formatDatePH(item.expiration_date, 'compact')}</strong></span>
                        <span className="tabular-nums text-zinc-500">{t('cart_qty', 'Qty:')} <strong className="text-slate-700 tabular-nums">{item.quantity}</strong></span>
                        <span className="tabular-nums text-zinc-500">@ <span className="tabular-nums">₱{item.unit_price.toFixed(2)}</span></span>
                      </div>
                      {item.is_override && (
                        <div className="mt-1 text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded inline-block font-semibold">
                          {t('badge_override_prefix', 'Override:')} {item.override_reason}
                        </div>
                      )}
                      {item.status_confirmed && (
                        <div className="mt-1 text-[9px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded inline-block font-semibold">
                          {t('badge_confirmed_prefix', 'Confirmed:')} {item.expiry_status || 'Warning/Critical'} {t('badge_release_suffix', 'Release')}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs text-slate-900 tabular-nums">₱{item.subtotal.toFixed(2)}</div>
                      <button onClick={() => handleRemoveFromCart(item.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded transition mt-1 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                <ShoppingCart className="w-6 h-6 mb-2 text-zinc-300" />
                {t('dispense_empty_cart', 'No items yet. Scan a barcode or select from catalog.')}
              </div>
            )}
          </div>

          {/* Patient & Notes */}
          <div className="px-4 pb-4 space-y-2.5 border-t border-zinc-100 pt-3">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                <User className="w-3 h-3" />
                {t('dispense_patient_ref', 'Patient Name / Reference (Rx Number)')}
              </label>
              <input
                type="text"
                placeholder={t('ph_patient_ref_example', 'e.g. Maria Santos / Rx-1049')}
                value={patientOrRef}
                onChange={(e) => setPatientOrRef(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                <NotebookPen className="w-3 h-3" />
                {t('dispensing_notes_label', 'Dispensing Notes')}
              </label>
              <input
                type="text"
                placeholder={t('ph_dispense_notes', 'e.g. Clinic treatment room, 3-day dose')}
                value={dispenseNotes}
                onChange={(e) => setDispenseNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Summary Bar + CTA */}
          <div className="px-4 pb-4 pt-3 border-t border-zinc-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-zinc-500">{t('dispense_total_payable', 'Total Payable:')}</span>
              <span className="text-xl font-extrabold text-slate-900 tabular-nums">₱{totalCartAmount.toFixed(2)}</span>
            </div>
            <button
              type="button"
              disabled={loading || cart.length === 0}
              onClick={handleCheckout}
              className="w-full py-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              {loading ? t('loading', 'Loading…') : t('complete_dispense_print', 'Complete Dispense & Print Receipt')}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ══ Printable Receipt Modal ══ */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
            <div className="p-4 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex justify-between items-center no-print">
              <span className="font-bold text-xs flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="w-6 h-6 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>{t('dispense_completed_receipt', 'Dispense Completed')} — {lastReceipt.receipt_no}</span>
              </span>
              <button onClick={() => setLastReceipt(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Receipt Paper */}
            <div className="p-6 tabular-nums text-xs text-slate-800 printable-area bg-white">
              <div className="text-center pb-3 border-b border-dashed border-zinc-300 mb-3">
                <h4 className="font-extrabold text-sm uppercase">{t('app_title', 'R.K.A PHARMACY')}</h4>
                <p className="text-[10px] text-zinc-500">San Antonio, Agoo, La Union</p>
                <p className="text-[9px] text-zinc-400">{t('ims_app_subtag', 'FEFO-Tracked Clinic Pharmacy IMS')}</p>
              </div>
              <div className="space-y-1 text-[10px] border-b border-dashed border-zinc-300 pb-3 mb-3">
                <div className="flex justify-between"><span className="text-zinc-400">{t('receipt_num_label', 'Receipt #:')}</span><span className="font-bold">{lastReceipt.receipt_no}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">{t('date_label', 'Date:')}</span><span>{lastReceipt.date}</span></div>
                {lastReceipt.reference && <div className="flex justify-between"><span className="text-zinc-400">{t('ref_patient_label', 'Ref / Patient:')}</span><span className="font-bold">{lastReceipt.reference}</span></div>}
                {currentUser && <div className="flex justify-between"><span className="text-zinc-400">{t('dispenser_label', 'Dispenser:')}</span><span>{currentUser.full_name || 'Lourdes Gincen L. Cesista'}</span></div>}
              </div>
              <div className="space-y-2 border-b border-dashed border-zinc-300 pb-3 mb-3">
                {lastReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">{item.brand_name}</div>
                      <div className="text-[9px] text-zinc-400">{item.quantity}× @ ₱{item.unit_price.toFixed(2)} · Lot: {item.batch_number} · Exp: {formatDatePH(item.expiration_date, 'compact')}</div>
                    </div>
                    <span className="font-bold tabular-nums">₱{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-sm font-black pt-1 mb-4 tabular-nums">
                <span>{t('total_label', 'TOTAL:')}</span>
                <span>₱{lastReceipt.total.toFixed(2)}</span>
              </div>
              <div className="text-center text-[9px] text-zinc-400 space-y-0.5">
                <p>{t('receipt_thank_you', 'Thank you for choosing R.K.A Pharmacy!')}</p>
                <p>{t('receipt_fefo_notice', 'FEFO-Tracked for Patient Safety & Quality')}</p>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50/90 dark:bg-[#1e2430] border-t border-slate-100 dark:border-white/10 flex gap-2 no-print">
              <button type="button" onClick={() => window.print()}
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
                <Printer className="w-3.5 h-3.5" /> {t('print_receipt_btn', 'Print Receipt')}
              </button>
              <button type="button" onClick={() => setLastReceipt(null)}
                className="px-4 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#21262d] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer">
                {t('btn_done', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      <OverrideModal
        isOpen={overrideModalOpen}
        onClose={() => { setOverrideModalOpen(false); setPendingOverrideItem(null); }}
        onConfirm={handleConfirmOverride}
        fefoBatch={pendingOverrideItem?.fefoBatch}
        selectedBatch={pendingOverrideItem?.selectedBatch}
        medicine={pendingOverrideItem?.medicine}
        currentUser={currentUser}
        uiMode={uiMode}
      />

      {/* Near-Expiry Status Confirmation Modal */}
      <BatchStatusConfirmModal
        isOpen={statusConfirmModalOpen}
        onClose={() => { setStatusConfirmModalOpen(false); setPendingStatusConfirmItem(null); }}
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
            expiryStatus: pendingStatusConfirmItem.selectedBatch.expiry_tier,
          });
          setStatusConfirmModalOpen(false);
          setPendingStatusConfirmItem(null);
        }}
        batch={pendingStatusConfirmItem?.selectedBatch}
        medicine={pendingStatusConfirmItem?.medicine}
        quantity={pendingStatusConfirmItem?.quantity}
        currentUser={currentUser}
        uiMode={uiMode}
      />
    </div>
  );
}
