import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowDownToLine,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Layers,
  PackageCheck,
  ScanLine,
  Zap,
  TrendingUp,
  X,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  FileText,
  DollarSign,
  Building,
  RefreshCw,
} from 'lucide-react';
import BarcodeModal from '../components/BarcodeModal';
import HelperText from '../components/HelperText';
import { useLanguage } from '../context/LanguageContext';
import { playScanSuccess, playScanError } from '../utils/audioTelemetry';
import { formatDatePH, getLocalDateISO } from '../utils/dateFormatter';

/* ── Helpers ─────────────────────────────────────── */
const SUPPLIERS = [
  'United Laboratories (Unilab)',
  'Zuellig Pharma',
  'Medix Distribution',
  'Pharmalink Inc.',
  'MedPro Pharma',
  'GlobalRx Distributors',
  'DirectRx Supply',
];

function dateOffsetISO(months) {
  const d = new Date();
  const orig = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== orig) d.setDate(0);
  return getLocalDateISO(d);
}

function expiryPreview(expDate) {
  if (!expDate) return null;
  const days = Math.ceil((new Date(expDate) - new Date()) / 86400000);
  let tier = 'Safe (>180 days)';
  let cls  = 'bg-teal-50 border-teal-300 text-teal-900';
  if (days <= 0)   { tier = 'Expired — Invalid for stock-in'; cls = 'bg-rose-50 border-rose-300 text-rose-900'; }
  else if (days <= 30)  { tier = 'Critical (1–30 days)';  cls = 'bg-rose-50 border-rose-300 text-rose-900'; }
  else if (days <= 90)  { tier = 'Warning (31–90 days)';  cls = 'bg-amber-50 border-amber-300 text-amber-900'; }
  else if (days <= 180) { tier = 'Monitor (91–180 days)'; cls = 'bg-slate-50 border-slate-300 text-slate-800'; }
  return { days, tier, cls };
}

function margin(cost, price) {
  const c = parseFloat(cost); const p = parseFloat(price);
  if (!c || !p || c <= 0) return null;
  return { pct: (((p - c) / c) * 100).toFixed(1), gross: (p - c).toFixed(2) };
}

function FormLabel({ children, required }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
      {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

const inputCls = 'w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white';
const inputMonoCls = `${inputCls} tabular-nums`;

export default function StockInView({
  medicines,
  batches = [],
  onRefresh,
  onOpenAddMedicine,
  uiMode = 'clean',
  activeSubTab = 'batch-intake',
  onSubTabChange,
  initialMedicineId,
  onNavigate: _onNavigate,
}) {
  const { t } = useLanguage();
  const [entryMode, setEntryMode] = useState('single');
  const [cleanStep, setCleanStep] = useState(1);

  /* Sub-tab states */
  const [deliverySearch, setDeliverySearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [inspectingInvoice, setInspectingInvoice] = useState(null);

  /* ── Single-item state ── */
  const [barcodeInput,   setBarcodeInput]   = useState('');
  const [medSearch,      setMedSearch]      = useState('');
  const [selectedMedId,  setSelectedMedId]  = useState('');
  const [batchNumber,    setBatchNumber]    = useState('');
  const [mfgDate,        setMfgDate]        = useState(getLocalDateISO());
  const [expDate,        setExpDate]        = useState('');
  const [quantity,       setQuantity]       = useState('');
  const [unitCost,       setUnitCost]       = useState('');
  const [sellingPrice,   setSellingPrice]   = useState('');
  const [supplierName,   setSupplierName]   = useState('United Laboratories (Unilab)');
  const [referenceNo,    setReferenceNo]    = useState('');
  const [storageLocation,setStorageLocation]= useState('Dispensary Cabinet A');
  const [notes,          setNotes]          = useState('');
  const [pricingSource,  setPricingSource]  = useState('custom');

  useEffect(() => {
    if (initialMedicineId) {
      setSelectedMedId(String(initialMedicineId));
      const m = (medicines || []).find(med => med.id === parseInt(initialMedicineId, 10));
      if (m) {
        handleSelectMedicine(m);
        if (uiMode === 'clean') {
          setCleanStep(2);
        }
      }
    }
  }, [initialMedicineId, medicines]);

  const resetCleanForm = () => {
    setSuccessData(null);
    setSelectedMedId('');
    setBatchNumber('');
    setExpDate('');
    setQuantity('');
    setUnitCost('');
    setSellingPrice('');
    setNotes('');
    setReferenceNo('');
    setCleanStep(1);
  };

  /* ── Multi-item state ── */
  const [multiSupplier,    setMultiSupplier]    = useState('United Laboratories (Unilab)');
  const [multiReferenceNo, setMultiReferenceNo] = useState('');
  const [multiNotes,       setMultiNotes]       = useState('');
  const [multiRows,        setMultiRows]        = useState([{
    id: 1, medicine_id: '', batch_number: '',
    manufacturing_date: getLocalDateISO(),
    expiration_date: '', quantity: '', unit_cost: '', selling_price: '',
    storage_location: 'Dispensary Cabinet A',
  }]);
  const [multiSuccessBatches, setMultiSuccessBatches] = useState(null);

  const [loading,        setLoading]       = useState(false);
  const [error,          setError]         = useState(null);
  const [successData,    setSuccessData]   = useState(null);
  const [barcodeMedicine,setBarcodeMedicine]= useState(null);

  const barcodeRef = useRef(null);
  useEffect(() => { barcodeRef.current?.focus(); }, []);

  // Persistent auto-focus on barcode input when returning to tab or after intake submission
  useEffect(() => {
    const handleWindowFocus = () => {
      barcodeRef.current?.focus();
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  useEffect(() => {
    if (!successData) {
      const timer = setTimeout(() => barcodeRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [successData]);

  const medList    = medicines || [];
  const selectedMed = medList.find(m => m.id === parseInt(selectedMedId));

  /* Fuzzy-filtered medicine list for search dropdown */
  const filteredMeds = medList.filter(m =>
    !medSearch ||
    m.brand_name.toLowerCase().includes(medSearch.toLowerCase()) ||
    m.generic_name.toLowerCase().includes(medSearch.toLowerCase()) ||
    m.code?.toLowerCase().includes(medSearch.toLowerCase()) ||
    m.barcode?.toLowerCase().includes(medSearch.toLowerCase())
  );

  /* ── Helpers ── */
  const genBatchNum = (med) => {
    if (!med) return '';
    return `${(med.code || 'MED').replace('MED-', 'LOT-')}-${Math.floor(100 + Math.random() * 900)}`;
  };

  const getPriceDefaults = (medId) => {
    const prior = (batches || []).filter(b => b.medicine_id === parseInt(medId, 10));
    if (prior.length > 0) {
      const last = prior[prior.length - 1];
      return { unit_cost: Number(last.unit_cost || 0).toString(), selling_price: Number(last.selling_price || 0).toString() };
    }
    const med = medList.find(m => m.id === parseInt(medId, 10));
    const cost  = med?.latest_unit_cost || 10;
    const price = med?.latest_selling_price || (cost * 1.35).toFixed(2);
    return { unit_cost: Number(cost).toString(), selling_price: Number(price).toString() };
  };

  const handleSelectMedicine = (med) => {
    setSelectedMedId(med.id);
    setSupplierName(med.supplier_name || 'United Laboratories (Unilab)');
    setBatchNumber(genBatchNum(med));
    const prior = (batches || []).filter(b => b.medicine_id === med.id);
    if (prior.length > 0) {
      const last = prior[prior.length - 1];
      setPricingSource(last.id.toString());
      setUnitCost(Number(last.unit_cost || 0).toString());
      setSellingPrice(Number(last.selling_price || 0).toString());
    } else {
      setPricingSource('custom'); setUnitCost(''); setSellingPrice('');
    }
  };

  const handlePricingSource = (val) => {
    setPricingSource(val);
    if (val !== 'custom') {
      const b = (batches || []).find(item => item.id === parseInt(val));
      if (b) { setUnitCost(Number(b.unit_cost || 0).toString()); setSellingPrice(Number(b.selling_price || 0).toString()); }
    }
  };

  /* Barcode processing */
  const processBarcode = (query) => {
    if (!query) {
      playScanError();
      return;
    }
    const match = medList.find(m =>
      m.barcode?.toLowerCase() === query.toLowerCase() ||
      m.code?.toLowerCase() === query.toLowerCase()
    );
    if (match) {
      playScanSuccess();
      if (entryMode === 'multi') {
        const emptyIdx = multiRows.findIndex(r => !r.medicine_id);
        if (emptyIdx >= 0) handleMultiRowChange(multiRows[emptyIdx].id, 'medicine_id', match.id.toString());
        else handleAddMultiRow(match);
      } else {
        handleSelectMedicine(match);
        if (uiMode === 'clean') {
          setCleanStep(2);
        }
      }
      setBarcodeInput(''); setError(null);
    } else {
      playScanError();
      setError(`No registered medicine matches barcode "${query}". Register it first.`);
    }
  };

  /* Global scanner buffer */
  useEffect(() => {
    let buf = ''; let last = Date.now();
    const handler = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const now = Date.now();
      if (now - last > 120) buf = '';
      last = now;
      if (e.key === 'Enter') { if (buf.length >= 2) { e.preventDefault(); processBarcode(buf.trim()); buf = ''; } }
      else if (e.key?.length === 1) buf += e.key;
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [medList]);

  /* Expiry preview */
  const preview = expiryPreview(expDate);
  const marginInfo = margin(unitCost, sellingPrice);

  /* ── Multi-row helpers ── */
  const handleAddMultiRow = (prefill = null) => {
    const today = getLocalDateISO();
    const base = { id: Date.now() + Math.random(), medicine_id: '', batch_number: '', manufacturing_date: today, expiration_date: '', quantity: '', unit_cost: '', selling_price: '', storage_location: 'Dispensary Cabinet A' };
    if (prefill) {
      const p = getPriceDefaults(prefill.id);
      setMultiRows(prev => [...prev, { ...base, medicine_id: prefill.id.toString(), batch_number: genBatchNum(prefill), quantity: '50', unit_cost: p.unit_cost, selling_price: p.selling_price }]);
    } else {
      setMultiRows(prev => [...prev, base]);
    }
  };

  const handleRemoveMultiRow = (id) => {
    if (multiRows.length <= 1) setMultiRows([{ id: Date.now(), medicine_id: '', batch_number: '', manufacturing_date: getLocalDateISO(), expiration_date: '', quantity: '', unit_cost: '', selling_price: '', storage_location: 'Dispensary Cabinet A' }]);
    else setMultiRows(prev => prev.filter(r => r.id !== id));
  };

  const handleMultiRowChange = (id, field, value) => {
    setMultiRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      if (field === 'medicine_id') {
        const med = medList.find(m => m.id === parseInt(value, 10));
        if (med) { updated.batch_number = genBatchNum(med); const p = getPriceDefaults(med.id); updated.unit_cost = p.unit_cost; updated.selling_price = p.selling_price; }
      }
      if (field === 'batch_number') updated.batch_number = value.toUpperCase();
      return updated;
    }));
  };

  const dateJump = (id, months) => {
    handleMultiRowChange(id, 'expiration_date', dateOffsetISO(months));
  };

  /* ── Submit single ── */
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedMedId || !batchNumber || !expDate || !quantity) { setError('Please fill in all mandatory fields (Medicine, Batch Number, Expiration Date, Quantity).'); return; }
    if (parseInt(quantity) <= 0) { setError('Quantity must be greater than zero.'); return; }
    const costNum = parseFloat(unitCost);
    if (isNaN(costNum) || costNum <= 0) { setError('Unit Cost (₱) is required and must be greater than zero.'); return; }
    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum <= 0) { setError('Selling Price (₱) is required and must be greater than zero.'); return; }
    if (mfgDate && new Date(expDate) <= new Date(mfgDate)) { setError('Expiration date must be after the manufacturing date.'); return; }
    if (preview && preview.days <= 0) { setError('Cannot stock-in a batch that is already expired.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine_id: parseInt(selectedMedId),
          batch_number: batchNumber.trim().toUpperCase(),
          manufacturing_date: mfgDate,
          expiration_date: expDate,
          quantity: parseInt(quantity),
          unit_cost: costNum,
          selling_price: priceNum,
          supplier_name: supplierName || selectedMed?.supplier_name,
          reference_no: referenceNo || `INV-${Date.now().toString().slice(-5)}`,
          supplier_dr_number: referenceNo.trim() || undefined,
          storage_location: storageLocation,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save batch intake');
      setSuccessData({ medicine: selectedMed, batch_number: batchNumber, quantity: parseInt(quantity), expDate });
      setBatchNumber(''); setExpDate(''); setQuantity(''); setPricingSource('custom'); setUnitCost(''); setSellingPrice(''); setReferenceNo(''); setNotes('');
      onRefresh();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ── Submit bulk ── */
  const handleSubmitMulti = async (e) => {
    e.preventDefault();
    setError(null); setSuccessData(null); setMultiSuccessBatches(null);
    const filled = multiRows.filter(r => r.medicine_id);
    if (filled.length === 0) { setError('Please add at least one medicine item with valid batch and expiration details.'); return; }
    const todayStr = getLocalDateISO();
    const items = [];
    for (let i = 0; i < filled.length; i++) {
      const r = filled[i];
      const med = medList.find(m => m.id === parseInt(r.medicine_id, 10));
      const name = med?.brand_name || `Row #${i + 1}`;
      if (!r.batch_number?.trim()) { setError(`Please enter a Batch / Lot Number for ${name}.`); return; }
      if (!r.expiration_date) { setError(`Please enter an Expiration Date for ${name}.`); return; }
      if (r.expiration_date <= todayStr) { setError(`Expiration date for ${name} (${r.batch_number}) must be in the future.`); return; }
      const qty = parseInt(r.quantity, 10);
      if (isNaN(qty) || qty <= 0) { setError(`Please enter a valid quantity for ${name}.`); return; }
      const cost = parseFloat(r.unit_cost);
      if (isNaN(cost) || cost <= 0) { setError(`Please enter a valid Unit Cost for ${name}.`); return; }
      const price = parseFloat(r.selling_price);
      if (isNaN(price) || price <= 0) { setError(`Please enter a valid Selling Price for ${name}.`); return; }
      items.push({ medicine_id: parseInt(r.medicine_id, 10), batch_number: r.batch_number.trim().toUpperCase(), manufacturing_date: r.manufacturing_date || todayStr, expiration_date: r.expiration_date, quantity: qty, unit_cost: cost, selling_price: price, supplier_name: multiSupplier, supplier_dr_number: multiReferenceNo.trim() || undefined, storage_location: r.storage_location || 'Dispensary Cabinet A' });
    }
    setLoading(true);
    try {
      const res = await fetch('/api/batches/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_name: multiSupplier, reference_no: multiReferenceNo || `INV-${Date.now().toString().slice(-6)}`, supplier_dr_number: multiReferenceNo.trim() || undefined, notes: multiNotes || `Multi-item intake (${items.length} lines)`, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process bulk stock-in');
      setMultiSuccessBatches(data.batches || items);
      setMultiRows([{ id: Date.now(), medicine_id: '', batch_number: '', manufacturing_date: todayStr, expiration_date: '', quantity: '', unit_cost: '', selling_price: '', storage_location: 'Dispensary Cabinet A' }]);
      setMultiReferenceNo(''); setMultiNotes('');
      onRefresh();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ══ SUB-TAB: RECENT DELIVERIES ══ */
  if (activeSubTab === 'recent-intake') {
    const filteredDeliveries = (batches || []).filter(b => {
      if (!deliverySearch) return true;
      const q = deliverySearch.toLowerCase();
      return (
        (b.batch_number && b.batch_number.toLowerCase().includes(q)) ||
        (b.brand_name && b.brand_name.toLowerCase().includes(q)) ||
        (b.generic_name && b.generic_name.toLowerCase().includes(q)) ||
        (b.supplier_name && b.supplier_name.toLowerCase().includes(q)) ||
        (b.supplier_dr_number && b.supplier_dr_number.toLowerCase().includes(q))
      );
    });

    const totalBatchUnits = (batches || []).reduce((acc, b) => acc + (b.initial_quantity || b.current_quantity || 0), 0);
    const totalInventoryValue = (batches || []).reduce((acc, b) => acc + ((b.initial_quantity || b.current_quantity || 0) * (b.unit_cost || 0)), 0);

    return (
      <div className="space-y-4 pb-12">
        {/* Header */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-teal-600" />
              Recent Deliveries & Batch Receipts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive log of all received medicine batches with lot tracking, supplier metadata, and barcode generation
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSubTabChange?.('batch-intake')}
            className="px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('stockin_receive_new', 'Receive New Delivery')}
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('stockin_batches_logged', 'Batches Logged')}</p>
              <p className="text-2xl font-black text-slate-800 tabular-nums">{(batches || []).length}</p>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('stockin_total_units_received', 'Total Units Received')}</p>
              <p className="text-2xl font-black text-teal-700 tabular-nums">{totalBatchUnits.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('stockin_acq_cost_total', 'Acquisition Cost Total')}</p>
              <p className="text-2xl font-black text-slate-800 tabular-nums">
                ₱{totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('stockin_search_placeholder', 'Search by lot number, medicine, supplier, or DR/SI...')}
              value={deliverySearch}
              onChange={(e) => setDeliverySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('btn_refresh', 'Refresh')}
          </button>
        </div>

        {/* Deliveries Table */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b border-zinc-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">{t('stockin_col_date', 'Date')}</th>
                  <th className="px-4 py-3">{t('stockin_col_dr_ref', 'DR / Ref')}</th>
                  <th className="px-4 py-3">{t('stockin_col_med_lot', 'Medicine & Lot')}</th>
                  <th className="px-4 py-3">{t('stockin_col_expiry', 'Expiry')}</th>
                  <th className="px-4 py-3 text-right">{t('stockin_col_units', 'Units')}</th>
                  <th className="px-4 py-3 text-right">{t('stockin_col_cost', 'Cost (₱)')}</th>
                  <th className="px-4 py-3 text-right">{t('stockin_col_batch_value', 'Batch Value')}</th>
                  <th className="px-4 py-3">{t('stockin_col_supplier', 'Supplier')}</th>
                  <th className="px-4 py-3 text-center">{t('stockin_col_barcode', 'Barcode')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredDeliveries.map((b) => {
                  const med = (medicines || []).find(m => m.id === b.medicine_id);
                  const exp = expiryPreview(b.expiration_date);
                  const batchQty = b.initial_quantity || b.current_quantity || 0;
                  const batchValue = batchQty * (b.unit_cost || 0);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap tabular-nums">
                        {formatDatePH(b.received_date || b.created_at, 'compact')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {b.supplier_dr_number || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{b.brand_name || med?.brand_name || 'Item'}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                          <span>Lot: {b.batch_number}</span>
                          {med?.dosage_strength && <span>• {med.dosage_strength}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{formatDatePH(b.expiration_date, 'compact')}</span>
                        {exp && (
                          <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded border ${exp.cls}`}>
                            {exp.days}d
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                        {batchQty}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        ₱{Number(b.unit_cost || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                        ₱{batchValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {b.supplier_name || 'Direct Supply'}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setBarcodeMedicine(med || { brand_name: b.brand_name, code: b.batch_number, barcode: b.batch_number, dosage_strength: '', unit_of_measure: 'pcs' })}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Tag className="w-3 h-3 text-slate-500" />
                          {t('stockin_label_btn', 'Label')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredDeliveries.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      <PackageCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">{t('stockin_no_deliveries', 'No delivery batches match your search.')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Barcode Print Modal */}
        {barcodeMedicine && (
          <BarcodeModal medicine={barcodeMedicine} isOpen={Boolean(barcodeMedicine)} onClose={() => setBarcodeMedicine(null)} />
        )}
      </div>
    );
  }

  /* ══ SUB-TAB: SUPPLIER INVOICES ══ */
  if (activeSubTab === 'supplier-invoices') {
    // Group batches by supplier_dr_number or supplier + date
    const invoiceGroups = {};
    (batches || []).forEach(b => {
      const invKey = b.supplier_dr_number ? `DR:${b.supplier_dr_number}` : `DATE:${(b.received_date || b.created_at || '').slice(0, 10)}:${b.supplier_name || 'Standard'}`;
      if (!invoiceGroups[invKey]) {
        invoiceGroups[invKey] = {
          key: invKey,
          drNumber: b.supplier_dr_number || 'Internal Intake',
          supplier: b.supplier_name || 'DirectRx Supply',
          date: b.received_date || b.created_at || new Date().toISOString(),
          batches: [],
          totalCost: 0,
          totalQty: 0,
        };
      }
      invoiceGroups[invKey].batches.push(b);
      const qty = b.initial_quantity || b.current_quantity || 0;
      invoiceGroups[invKey].totalQty += qty;
      invoiceGroups[invKey].totalCost += (qty * (b.unit_cost || 0));
    });

    const invoicesList = Object.values(invoiceGroups).sort((a, b) => new Date(b.date) - new Date(a.date));
    const filteredInvoices = invoicesList.filter(inv => {
      if (!invoiceSearch) return true;
      const q = invoiceSearch.toLowerCase();
      return (
        inv.drNumber.toLowerCase().includes(q) ||
        inv.supplier.toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-4 pb-12">
        {/* Header */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              {t('stockin_invoices_title', 'Supplier Invoices & Delivery Receipts (DR)')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('stockin_invoices_subtitle', 'Aggregated delivery records grouped by Delivery Receipt / Invoice number with cost audits')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSubTabChange?.('batch-intake')}
            className="px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('stockin_record_invoice_delivery', 'Record Invoice Delivery')}
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('stockin_search_dr_placeholder', 'Search DR number or supplier name...')}
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Invoice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.map(inv => (
            <div key={inv.key} className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 flex flex-col justify-between hover:border-teal-400 transition">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('stockin_dr_label', 'Delivery Receipt')}</span>
                    <h3 className="text-base font-extrabold text-slate-900">{inv.drNumber}</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-[10px] font-bold">
                    {inv.batches.length} {inv.batches.length === 1 ? t('stockin_batch_single', 'batch') : t('stockin_batch_plural', 'batches')}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 mb-4 border-t border-zinc-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{inv.supplier}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDatePH(inv.date, 'full')}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('stockin_units_received', 'Units Received')}</span>
                    <span className="text-sm font-bold text-slate-800 tabular-nums">{inv.totalQty.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('stockin_invoice_amount', 'Invoice Amount')}</span>
                    <span className="text-base font-black text-teal-700 tabular-nums">₱{inv.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setInspectingInvoice(inv)}
                  className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-center cursor-pointer"
                >
                  {t('stockin_view_breakdown', 'View Breakdown')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSupplierName(inv.supplier);
                    setReferenceNo(inv.drNumber !== 'Internal Intake' ? inv.drNumber : '');
                    onSubTabChange?.('batch-intake');
                  }}
                  className="px-3 py-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer"
                  title={t('title_stock_in_another', 'Stock in another batch under this DR')}
                >
                  {t('stockin_add_item', '+ Add Item')}
                </button>
              </div>
            </div>
          ))}
          {filteredInvoices.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-zinc-200 p-12 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">{t('stockin_no_invoices', 'No supplier invoices found.')}</p>
            </div>
          )}
        </div>

        {/* Invoice Breakdown Modal */}
        {inspectingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200/90 dark:border-white/10">
              <div className="p-4 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{t('stockin_invoice_breakdown_title', 'Invoice Breakdown')} — {inspectingInvoice.drNumber}</span>
                </div>
                <button onClick={() => setInspectingInvoice(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-[#1e2430] p-3 rounded-xl text-xs">
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">{t('stockin_col_supplier', 'Supplier')}</span><span className="font-bold text-slate-800 dark:text-slate-200">{inspectingInvoice.supplier}</span></div>
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">{t('stockin_col_date', 'Date')}</span><span className="font-bold text-slate-800 dark:text-slate-200">{formatDatePH(inspectingInvoice.date, 'compact')}</span></div>
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">{t('stockin_lines', 'Lines')}</span><span className="font-bold text-slate-800 dark:text-slate-200">{inspectingInvoice.batches.length}</span></div>
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">{t('stockin_total_cost', 'Total Cost')}</span><span className="font-black text-teal-700 dark:text-teal-400">₱{inspectingInvoice.totalCost.toFixed(2)}</span></div>
                </div>

                <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-[#1e2430] text-[10px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="px-3 py-2.5">{t('stockin_col_med_lot', 'Medicine')}</th>
                        <th className="px-3 py-2.5">{t('stockin_lot_no', 'Lot Number')}</th>
                        <th className="px-3 py-2.5">{t('stockin_col_expiry', 'Expiry')}</th>
                        <th className="px-3 py-2.5 text-right">{t('stockin_col_units', 'Units')}</th>
                        <th className="px-3 py-2.5 text-right">{t('stockin_col_cost', 'Unit Cost')}</th>
                        <th className="px-3 py-2.5 text-right">{t('stockin_subtotal', 'Subtotal')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {inspectingInvoice.batches.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{b.brand_name || 'Item'}</td>
                          <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">{b.batch_number}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{formatDatePH(b.expiration_date, 'compact')}</td>
                          <td className="px-3 py-2 text-right font-bold tabular-nums">{b.initial_quantity || b.current_quantity}</td>
                          <td className="px-3 py-2 text-right tabular-nums">₱{Number(b.unit_cost || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-black text-slate-900 dark:text-white tabular-nums">
                            ₱{((b.initial_quantity || b.current_quantity || 0) * (b.unit_cost || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-3.5 bg-slate-50/90 dark:bg-[#1e2430] border-t border-slate-100 dark:border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectingInvoice(null)}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  {t('btn_done', 'Done')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (uiMode === 'clean') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        {/* ══ Clean Header ══ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
                <ArrowDownToLine className="w-6 h-6" />
              </span>
              {t('stock_in_batch_receiving', 'Receive Delivery (Stock-In)')}
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {t('stockin_clean_subtitle', 'Step-by-step guided intake to record incoming medicine batches, expiry, and prices')}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddMedicine}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-teal-800 text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>{t('btn_new_medicine_profile', 'New Medicine Profile')}</span>
          </button>
        </div>

        {/* ══ Alerts ══ */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ══ Success Screen (Clean Mode) ══ */}
        {successData ? (
          <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">{t('stockin_recorded_success', 'Delivery Recorded Successfully!')}</h2>
              <p className="text-base text-slate-600 mt-2">
                {t('stockin_success_intake', 'Added')} <strong className="text-teal-700 font-extrabold">{successData.quantity} {t('stockin_units_to_inv', 'units to inventory.')}</strong> of <strong className="text-slate-900">{successData.medicine?.brand_name}</strong>.
              </p>
              <div className="inline-flex items-center gap-3 mt-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs tabular-nums text-slate-700">
                <span>{t('stockin_batch_tag', 'Batch:')} <strong className="text-slate-900">{successData.batch_number}</strong></span>
                <span>•</span>
                <span>{t('stockin_expires_tag', 'Expires:')} <strong className="text-slate-900">{successData.expDate}</strong></span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={resetCleanForm}
                className="w-full min-h-[48px] px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('stockin_another_item', 'Stock In Another Item')}</span>
              </button>
              <button
                type="button"
                onClick={() => setBarcodeMedicine(successData.medicine)}
                className="w-full min-h-[48px] px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Tag className="w-4 h-4 text-slate-500" />
                <span>{t('stockin_print_label', 'Print Barcode Label')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ══ Step-by-Step Guided Form (Clean Mode) ══ */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Progress Indicator */}
            <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50/60 p-2 gap-2 text-center text-xs">
              {[
                { num: 1, title: t('clean_step_medicine', 'Medicine') },
                { num: 2, title: t('clean_step_lot_exp', 'Lot & Expiry') },
                { num: 3, title: t('clean_step_qty_price', 'Quantity & Price') },
                { num: 4, title: t('clean_step_confirm', 'Confirm') }
              ].map(s => {
                const isActive = cleanStep === s.num;
                const isPast = cleanStep > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    disabled={!isPast && !isActive}
                    onClick={() => isPast && setCleanStep(s.num)}
                    className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl transition cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-[#1a202c] font-extrabold text-teal-800 dark:text-teal-300 shadow-xs border border-teal-200 dark:border-teal-700/50'
                        : isPast
                        ? 'text-teal-700 dark:text-teal-400 font-semibold hover:bg-white/60 dark:hover:bg-white/5'
                        : 'text-slate-400 font-normal cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive ? 'bg-teal-600 text-white' : isPast ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                    }`}>
                      {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </span>
                    <span className="hidden sm:inline text-xs font-medium">{s.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-6 md:p-8">
              {/* STEP 1: SELECT MEDICINE */}
              {cleanStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{t('step1_title', 'Step 1: Choose Medicine')}</h3>
                    <p className="text-sm text-slate-500 mt-1">{t('step1_desc', 'Scan the product barcode with your scanner, or search the medicine catalog.')}</p>
                  </div>

                  {/* Barcode scanner box */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                      <ScanLine className="w-4 h-4" />
                      <span>{t('scan_product_barcode', 'Scan Product Barcode')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Barcode className="w-5 h-5 text-slate-400 shrink-0" />
                      <input
                        ref={barcodeRef}
                        type="text"
                        placeholder={t('ready_barcode_scanner', 'Ready for barcode scanner...')}
                        value={barcodeInput}
                        onChange={e => setBarcodeInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            processBarcode(barcodeInput.trim());
                          }
                        }}
                        className="flex-1 min-h-[48px] px-4 text-base bg-slate-800 text-white rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-slate-500 tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => processBarcode(barcodeInput.trim())}
                        className="min-h-[48px] px-5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-xl transition cursor-pointer shrink-0"
                      >
                        {t('btn_scan', 'Scan')}
                      </button>
                    </div>
                  </div>

                  {/* Catalog Search */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">{t('or_search_med_catalog', 'Or Search Medicine Catalog')}</label>
                    <div className="relative">
                      <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder={t('search_med_placeholder', 'Type brand name, generic name, or item code...')}
                        value={medSearch}
                        onChange={e => setMedSearch(e.target.value)}
                        className="w-full min-h-[48px] pl-11 pr-4 text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white"
                      />
                    </div>

                    {/* Medicine List */}
                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1 pt-1">
                      {filteredMeds.slice(0, 10).map(m => {
                        const isSelected = selectedMedId === m.id.toString();
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleSelectMedicine(m)}
                            className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500'
                                : 'bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50/70'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-base text-slate-900">{m.brand_name}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 tabular-nums text-slate-600">{m.code}</span>
                              </div>
                              <div className="text-sm text-slate-600 mt-0.5 font-medium">
                                {m.generic_name} • {m.dosage_strength} {m.dosage_form}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {t('current_stock_label', 'Current Stock:')} <strong className="text-teal-800">{m.total_stock} {m.unit_of_measure}s</strong>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectMedicine(m);
                                setCleanStep(2);
                              }}
                              className={`min-h-[44px] px-5 rounded-xl font-bold text-sm transition cursor-pointer shrink-0 ${
                                isSelected
                                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                                  : 'bg-slate-100 text-slate-800 hover:bg-teal-100 hover:text-teal-900'
                              }`}
                            >
                              {isSelected ? t('btn_selected', 'Selected') : t('btn_select', 'Select')}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Continue button if selected */}
                  {selectedMed && (
                    <div className="pt-4 border-t border-slate-200 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCleanStep(2)}
                        className="min-h-[48px] px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                      >
                        <span>{t('btn_continue_lot_exp', 'Continue to Lot & Expiry')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: LOT & EXPIRY */}
              {cleanStep === 2 && selectedMed && (
                <div className="space-y-6">
                  {/* Active Medicine Banner */}
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-teal-700 font-bold uppercase tracking-wider">{t('receiving_medicine_label', 'Receiving Medicine:')}</span>
                      <h3 className="text-xl font-extrabold text-slate-900">{selectedMed.brand_name}</h3>
                      <p className="text-xs text-slate-600">{selectedMed.generic_name} • {selectedMed.dosage_strength}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCleanStep(1)}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                    >
                      {t('change_medicine_btn', 'Change Medicine')}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{t('step2_title', 'Step 2: Lot Number & Expiry Date')}</h3>
                    <p className="text-sm text-slate-500 mt-1">{t('step2_desc', "Enter the manufacturer's batch or lot code and set the expiration date.")}</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        {t('batch_lot_number', 'Batch / Lot Number')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t('ph_lot_format', 'LOT-XXX')}
                        value={batchNumber}
                        onChange={e => setBatchNumber(e.target.value.toUpperCase())}
                        className="w-full min-h-[48px] px-4 text-base tabular-nums uppercase border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold text-slate-700">
                          {t('stockin_exp_date', 'Expiration Date')} <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-xs text-slate-500 font-medium">{t('quick_presets_label', 'Quick Preset Buttons:')}</span>
                      </div>

                      {/* Expiry Quick Buttons */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {[
                          { label: t('preset_6m', '+6 Months'), months: 6 },
                          { label: t('preset_1y', '+1 Year'), months: 12 },
                          { label: t('preset_2y', '+2 Years'), months: 24 }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setExpDate(dateOffsetISO(preset.months))}
                            className="min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-teal-100 hover:border-teal-300 border border-slate-200 text-slate-800 rounded-xl font-bold text-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>

                      <input
                        type="date"
                        required
                        value={expDate}
                        onChange={e => setExpDate(e.target.value)}
                        className="w-full min-h-[48px] px-4 text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium"
                      />

                      {/* Shelf-Life Visual Chip */}
                      {expDate && preview && (
                        <div className={`mt-3 p-3.5 rounded-xl border flex items-center justify-between ${preview.cls}`}>
                          <div className="flex items-center gap-2 font-medium text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{t('expires_in_days', 'Expires in')} <strong className="font-bold">{preview.days} {t('days_unit', 'days')}</strong> ({expDate})</span>
                          </div>
                          <span className="px-3 py-1 bg-white font-bold rounded-lg text-xs shadow-xs">
                            {preview.days > 180 ? t('shelf_life_good', 'Good Shelf-Life') : preview.days > 90 ? t('shelf_life_monitor', 'Monitor') : preview.days > 30 ? t('shelf_life_sell_first', 'Sell First') : t('shelf_life_expiring_soon', 'Expiring Soon')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setCleanStep(1)}
                      className="min-h-[44px] px-5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{t('btn_back', 'Back')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={!batchNumber.trim() || !expDate}
                      onClick={() => setCleanStep(3)}
                      className="min-h-[48px] px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>{t('btn_continue_qty_price', 'Continue to Quantity & Price')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: QUANTITY & PRICE */}
              {cleanStep === 3 && selectedMed && (
                <div className="space-y-6">
                  {/* Active Medicine Banner */}
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-teal-700 font-bold uppercase tracking-wider">{t('clean_step_lot_exp', 'Medicine & Lot')}:</span>
                      <h3 className="text-lg font-extrabold text-slate-900">{selectedMed.brand_name}</h3>
                      <p className="text-xs text-slate-600">{t('lot_label', 'Lot')}: <strong className="tabular-nums text-slate-800">{batchNumber}</strong> · {t('exp_label', 'Exp')}: <strong className="text-slate-800">{expDate}</strong></p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{t('step3_title', 'Step 3: Quantity & Pricing')}</h3>
                    <p className="text-sm text-slate-500 mt-1">{t('step3_desc', 'Specify how many units were received and the purchase/retail prices.')}</p>
                  </div>

                  <div className="space-y-5">
                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        {t('qty_received_label', 'Quantity Received')} <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder={t('ph_qty_example', 'e.g. 50')}
                          value={quantity}
                          onChange={e => setQuantity(e.target.value)}
                          className="flex-1 min-h-[48px] px-4 text-xl font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white tabular-nums"
                        />
                        <span className="text-sm font-bold text-slate-600 shrink-0 px-2">{selectedMed.unit_of_measure}s</span>
                      </div>

                      {/* Quick quantity buttons */}
                      <div className="flex gap-2">
                        {[10, 20, 50, 100].map(addQty => (
                          <button
                            key={addQty}
                            type="button"
                            onClick={() => setQuantity((prev) => (parseInt(prev || 0, 10) + addQty).toString())}
                            className="min-h-[44px] px-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            +{addQty}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setQuantity('')}
                          className="min-h-[44px] px-3 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                        >
                          {t('btn_clear', 'Clear')}
                        </button>
                      </div>
                    </div>

                    {/* Pricing grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                          {t('unit_cost_label', 'Unit Cost (₱)')} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-slate-400 font-bold">₱</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder="0.00"
                            value={unitCost}
                            onChange={e => setUnitCost(e.target.value)}
                            className="w-full min-h-[48px] pl-8 pr-4 text-base font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white tabular-nums"
                          />
                        </div>
                        <span className="text-xs text-slate-500 mt-1 block">{t('unit_cost_desc', 'Purchase cost from supplier')}</span>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                          {t('stockin_selling_price', 'Selling Price (₱)')} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-slate-400 font-bold">₱</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder="0.00"
                            value={sellingPrice}
                            onChange={e => setSellingPrice(e.target.value)}
                            className="w-full min-h-[48px] pl-8 pr-4 text-base font-bold text-teal-800 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white tabular-nums"
                          />
                        </div>
                        <span className="text-xs text-slate-500 mt-1 block">{t('selling_price_desc', 'Retail price for customers')}</span>
                      </div>
                    </div>

                    {marginInfo && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
                        <span className="font-medium">{t('gross_profit_margin', 'Gross Profit Margin:')}</span>
                        <strong className="tabular-nums text-base">₱{marginInfo.gross} / unit ({marginInfo.pct}%)</strong>
                      </div>
                    )}

                    {/* Optional Supplier */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        {t('stockin_supplier', 'Supplier / Distributor')}
                      </label>
                      <select
                        value={supplierName}
                        onChange={e => setSupplierName(e.target.value)}
                        className="w-full min-h-[44px] px-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setCleanStep(2)}
                      className="min-h-[44px] px-5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{t('btn_back', 'Back')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={!quantity || !unitCost || !sellingPrice || parseFloat(quantity) <= 0 || parseFloat(unitCost) <= 0 || parseFloat(sellingPrice) <= 0}
                      onClick={() => setCleanStep(4)}
                      className="min-h-[48px] px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>{t('btn_continue_review', 'Continue to Review')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & CONFIRM */}
              {cleanStep === 4 && selectedMed && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{t('step4_title', 'Step 4: Review Delivery & Confirm')}</h3>
                    <p className="text-sm text-slate-500 mt-1">{t('step4_desc', 'Verify delivery details below before saving into inventory.')}</p>
                  </div>

                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div>
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">{t('clean_step_medicine', 'Medicine')}</span>
                      <h4 className="text-2xl font-extrabold text-slate-900">{selectedMed.brand_name}</h4>
                      <p className="text-sm text-slate-600 font-medium">{selectedMed.generic_name} • {selectedMed.dosage_strength} {selectedMed.dosage_form}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{t('batch_lot_number', 'Lot / Batch #')}</span>
                        <span className="text-base tabular-nums font-bold text-slate-800">{batchNumber}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{t('stockin_exp_date', 'Expiration Date')}</span>
                        <span className="text-base font-bold text-slate-800">{expDate}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{t('qty_received_label', 'Quantity Received')}</span>
                        <span className="text-xl font-extrabold text-teal-800 tabular-nums">{quantity} {selectedMed.unit_of_measure}s</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{t('unit_cost_label', 'Unit Cost')}</span>
                        <span className="text-base font-bold text-slate-800 tabular-nums">₱{parseFloat(unitCost).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{t('stockin_selling_price', 'Selling Price')}</span>
                        <span className="text-base font-bold text-teal-700 tabular-nums">₱{parseFloat(sellingPrice).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{t('stockin_col_batch_value', 'Total Batch Value')}</span>
                        <span className="text-base font-extrabold text-slate-900 tabular-nums">₱{(parseFloat(quantity) * parseFloat(unitCost)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setCleanStep(3)}
                      className="w-full sm:w-auto min-h-[48px] px-6 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{t('btn_back_edit', 'Back to Edit')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSubmit}
                      className="w-full sm:flex-1 min-h-[52px] px-8 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-base rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{loading ? t('saving_intake_record', 'Saving Intake Record…') : t('btn_confirm_save_inv', 'Confirm & Save into Inventory')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Barcode Print Modal */}
        {barcodeMedicine && (
          <BarcodeModal medicine={barcodeMedicine} isOpen={Boolean(barcodeMedicine)} onClose={() => setBarcodeMedicine(null)} />
        )}
      </div>
    );
  }

  return (
    <div className={uiMode === 'clean' ? 'max-w-4xl mx-auto space-y-4 pb-8' : 'max-w-4xl mx-auto space-y-5 pb-12'}>

      {/* ══ Page Header ══ */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-teal-600" />
            {t('stock_in_batch_receiving', 'Stock-In / Batch Receiving')}
          </h2>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-0.5">
            {t('stockin_subtitle', 'Scan or select medicine to register incoming batches with expiration and pricing')}
          </HelperText>
        </div>
        <button
          onClick={onOpenAddMedicine}
          className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t('btn_add_medicine', 'New Medicine Profile?')}
        </button>
      </div>

      {/* ══ Global Barcode Intake Bar ══ */}
      <div className="bg-slate-900 dark:bg-[#161b22] border border-slate-800 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-800 dark:border-white/10 flex items-center gap-2">
          <ScanLine className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 tabular-nums">{t('global_barcode_intake', 'Global Barcode Intake')}</span>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (!barcodeInput.trim()) { playScanError(); return; } processBarcode(barcodeInput.trim()); }} className="flex items-center gap-2 p-3">
          <Barcode className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={barcodeRef}
            type="text"
            placeholder={t('ready_scanner_placeholder', 'Ready for USB scanner or manual entry… (press Enter)')}
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-800/80 dark:bg-[#21262d] text-white border border-slate-700 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-500 tabular-nums"
            autoFocus
          />
          <button type="submit" className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition shadow-xs cursor-pointer">
            <Zap className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />{t('btn_scan', 'Scan')}
          </button>
        </form>
      </div>

      {/* ══ Notices ══ */}
      {successData && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span><strong>{t('stockin_success', 'Stock-In Recorded!')} </strong> {t('stockin_success_intake', 'Received')} {successData.quantity}× <strong>{successData.medicine.brand_name}</strong> — {t('stockin_batch_tag', 'Batch:')} {successData.batch_number} · {t('stockin_expires_tag', 'Exp:')} {successData.expDate}</span>
          </div>
          <button onClick={() => setBarcodeMedicine(successData.medicine)}
            className="text-xs bg-white text-teal-800 border border-teal-300 px-3 py-1 rounded-lg font-semibold hover:bg-teal-50 flex items-center gap-1 shrink-0 cursor-pointer">
            <Tag className="w-3 h-3" /> {t('stockin_print_label', 'Print Label')}
          </button>
        </div>
      )}
      {multiSuccessBatches && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span><strong>{t('stockin_bulk_success', 'Bulk Stock-In Completed!')} </strong> Recorded {multiSuccessBatches.length} item(s) into inventory with atomic batch records.</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-700 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ══ Mode Toggle ══ */}
      <div className="flex items-center gap-0 bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        {[
          { key: 'single', label: t('single_batch_intake', 'Single Batch Intake'), icon: Plus },
          { key: 'multi',  label: t('multi_item_stockin', 'Multi-Item Stock-In'), icon: Layers, count: multiRows.filter(r => r.medicine_id).length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button key={key} type="button" onClick={() => setEntryMode(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              entryMode === key
                ? 'border-teal-500 text-teal-700 bg-teal-50/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
            }`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count !== undefined && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full tabular-nums font-bold ${entryMode === key ? 'bg-teal-600 text-white' : 'bg-zinc-200 text-zinc-600'}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {entryMode === 'single' ? (
        /* ══════════════════════════════════════
           SINGLE BATCH INTAKE FORM
        ══════════════════════════════════════ */
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 shadow-xs divide-y divide-zinc-100">

          {/* Section: Medicine Profile Selector */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('step_num_med_profile', '1 — Medicine Profile')}</span>
            </div>

            {/* Fuzzy search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t('filter_med_placeholder', 'Type brand, generic, or barcode to filter…')}
                value={medSearch}
                onChange={e => setMedSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-zinc-50 focus:bg-white"
              />
            </div>
            <select
              value={selectedMedId}
              onChange={e => { const id = e.target.value; setSelectedMedId(id); const m = medicines.find(x => x.id === parseInt(id)); if (m) handleSelectMedicine(m); }}
              required
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-800"
            >
              <option value="">{t('choose_med_catalog', '— Choose registered medicine from catalog —')} ({filteredMeds.length} matches)</option>
              {filteredMeds.map(m => (
                <option key={m.id} value={m.id}>
                  {m.brand_name} · {m.generic_name} ({m.dosage_strength} {m.dosage_form}) · Code: {m.code}
                </option>
              ))}
            </select>

            {selectedMed && (
              <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900">{selectedMed.brand_name}</span>
                  <span className="text-zinc-500 ml-1">({selectedMed.generic_name})</span>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    {t('current_stock_label', 'Current Stock:')} <span className="font-bold text-teal-800">{selectedMed.total_stock} {selectedMed.unit_of_measure}s</span> · {t('reorder_threshold_label', 'Reorder Threshold:')} {selectedMed.reorder_threshold}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 tabular-nums text-[10px] bg-white px-2 py-1 rounded border border-teal-200 text-teal-800">
                  <Barcode className="w-3 h-3" />
                  {selectedMed.barcode}
                </div>
              </div>
            )}
          </div>

          {/* Section: Batch & Expiration */}
          <div className="p-5 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('step_num_batch_details', '2 — Batch / Lot Details')}</span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FormLabel required>{t('batch_lot_number', 'Batch / Lot Number')}</FormLabel>
                <input
                  type="text"
                  required
                  placeholder={t('ph_lot_format', 'LOT-XXX')}
                  value={batchNumber}
                  onChange={e => setBatchNumber(e.target.value.toUpperCase())}
                  className={inputMonoCls}
                />
              </div>
              <div>
                <FormLabel>{t('stockin_mfg_date', 'Manufacturing Date')}</FormLabel>
                <input type="date" value={mfgDate} onChange={e => setMfgDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <FormLabel required>{t('stockin_exp_date', 'Expiration Date')}</FormLabel>
                  {/* Rapid preset chips */}
                  <div className="flex items-center gap-1">
                    {[{ l: '+6 Mos', m: 6 }, { l: '+1 Yr', m: 12 }, { l: '+2 Yrs', m: 24 }, { l: '+3 Yrs', m: 36 }].map(p => (
                      <button key={p.l} type="button" onClick={() => setExpDate(dateOffsetISO(p.m))}
                        className="px-1.5 py-0.5 text-[9px] font-bold bg-zinc-100 hover:bg-teal-100 hover:text-teal-800 hover:border-teal-300 border border-zinc-200 text-zinc-600 rounded transition cursor-pointer">
                        {p.l}
                      </button>
                    ))}
                  </div>
                </div>
                <input type="date" required value={expDate} onChange={e => setExpDate(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Expiry tier preview */}
            {expDate && preview && (
              <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${preview.cls}`}>
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('expiry_preview_label', 'Expiry Preview:')} <strong className="tabular-nums">{t('expiry_preview_days_from_today', { days: preview.days }, `${preview.days} days from today`)}</strong></span>
                </div>
                <span className="font-bold uppercase tracking-widest text-[9px] bg-white/80 px-2 py-0.5 rounded shadow-xs">
                  {preview.tier}
                </span>
              </div>
            )}
          </div>

          {/* Section: Pricing & Quantity */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('step_num_pricing_qty', '3 — Pricing & Quantity')}</span>
              {selectedMed && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500">{t('adopt_from_batch', 'Adopt from batch:')}</span>
                  <select value={pricingSource} onChange={e => handlePricingSource(e.target.value)}
                    className="px-2 py-1 text-[10px] border border-zinc-200 rounded bg-white font-medium cursor-pointer">
                    <option value="custom">{t('manual_custom', 'Manual / Custom')}</option>
                    {(batches || []).filter(b => b.medicine_id === selectedMed.id).map(b => (
                      <option key={b.id} value={b.id}>Batch {b.batch_number} (₱{b.unit_cost}/₱{b.selling_price})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
              <div>
                <FormLabel required>{t('qty_received_label', 'Quantity Received')}</FormLabel>
                <div className="flex items-center gap-1">
                  <input type="number" min="1" required placeholder={t('ph_qty_100_example', 'e.g. 100')} value={quantity} onChange={e => setQuantity(e.target.value)}
                    className={`${inputCls} font-bold tabular-nums text-right`} />
                  {selectedMed && <span className="text-[10px] text-zinc-400 shrink-0">{selectedMed.unit_of_measure}s</span>}
                </div>
              </div>
              <div>
                <FormLabel required>{t('unit_cost_label', 'Unit Cost (₱)')}</FormLabel>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-400 text-[11px]">₱</span>
                  <input type="number" step="0.01" min="0.01" required placeholder="0.00" value={unitCost} onChange={e => setUnitCost(e.target.value)}
                    className={`${inputCls} pl-6 tabular-nums text-right`} />
                </div>
              </div>
              <div>
                <FormLabel required>{t('stockin_selling_price', 'Selling Price (₱)')}</FormLabel>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-400 text-[11px]">₱</span>
                  <input type="number" step="0.01" min="0.01" required placeholder="0.00" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)}
                    className={`${inputCls} pl-6 font-bold tabular-nums text-right text-teal-800`} />
                </div>
                {/* Margin calc */}
                {marginInfo && (
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-teal-700 tabular-nums">
                    <TrendingUp className="w-2.5 h-2.5" />
                    Margin: {marginInfo.pct}% · Gross: ₱{marginInfo.gross} / unit
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Supplier & Storage */}
          <div className="p-5 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('step_num_supplier_storage', '4 — Supplier & Storage')}</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormLabel>{t('stockin_supplier', 'Supplier / Distributor')}</FormLabel>
                <select value={supplierName} onChange={e => setSupplierName(e.target.value)}
                  className={`${inputCls} cursor-pointer`}>
                  {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value={supplierName && !SUPPLIERS.includes(supplierName) ? supplierName : '__other'}>{supplierName && !SUPPLIERS.includes(supplierName) ? supplierName : t('other_type_below', 'Other (type below)')}</option>
                </select>
                {supplierName && !SUPPLIERS.includes(supplierName) && (
                  <input type="text" placeholder={t('ph_supplier_name', 'Enter supplier name')} value={supplierName} onChange={e => setSupplierName(e.target.value)} className={`${inputCls} mt-1.5`} />
                )}
              </div>
              <div>
                <FormLabel>{t('stockin_ref_no', 'Delivery Invoice / DR Reference')}</FormLabel>
                <input type="text" placeholder={t('ph_supplier_invoice', 'e.g. INV-89241')} value={referenceNo} onChange={e => setReferenceNo(e.target.value)} className={inputMonoCls} />
              </div>
              <div>
                <FormLabel>{t('storage_location_label', 'Storage Bin / Location')}</FormLabel>
                <input type="text" placeholder={t('ph_storage_location', 'e.g. Dispensary Cabinet A, Cold Storage')} value={storageLocation} onChange={e => setStorageLocation(e.target.value)} className={inputCls} />
              </div>
              <div>
                <FormLabel>{t('stockin_notes', 'Receiving Notes / QC Inspection')}</FormLabel>
                <input type="text" placeholder={t('ph_packaging_condition', 'e.g. Box intact, seal unbroken')} value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="p-5">
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer">
              <ArrowDownToLine className="w-4 h-4" />
              {loading ? 'Saving Intake Record…' : t('stockin_submit_btn', 'Confirm & Register Batch')}
            </button>
          </div>
        </form>
      ) : (
        /* ══════════════════════════════════════
           MULTI-ITEM STOCK-IN QUEUE
        ══════════════════════════════════════ */
        <form onSubmit={handleSubmitMulti} className="bg-white rounded-xl border border-zinc-200 shadow-xs divide-y divide-zinc-100">

          {/* Delivery header */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-600" /> {t('multi_item_batch_intake', 'Multi-Item Batch Intake')}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">{t('multi_item_batch_desc', 'Record multiple deliveries in one session with individual lot numbers, expiries, and costs.')}</p>
              </div>
              <button type="button" onClick={() => handleAddMultiRow()}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> {t('btn_add_line', 'Add Line')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
              <div>
                <FormLabel>{t('stockin_supplier', 'Supplier / Distributor')}</FormLabel>
                <select value={multiSupplier} onChange={e => setMultiSupplier(e.target.value)} className={`${inputCls} cursor-pointer`}>
                  {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <FormLabel>{t('stockin_ref_no', 'Delivery Invoice / DR Reference')}</FormLabel>
                <input type="text" placeholder={t('ph_supplier_invoice', 'e.g. INV-89241')} value={multiReferenceNo} onChange={e => setMultiReferenceNo(e.target.value)} className={inputMonoCls} />
              </div>
              <div>
                <FormLabel>{t('stockin_notes', 'Receiving Notes')}</FormLabel>
                <input type="text" placeholder={t('ph_packaging_intact', 'e.g. All packaging intact')} value={multiNotes} onChange={e => setMultiNotes(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="p-2.5 w-8 text-center">#</th>
                  <th className="p-2.5 min-w-[200px]">{t('col_med_catalog_item', 'Medicine Catalog Item')} *</th>
                  <th className="p-2.5 min-w-[130px]">{t('stockin_batch_num', 'Batch / Lot #')} *</th>
                  <th className="p-2.5 min-w-[160px]">{t('stockin_exp_date', 'Expiry Date')} *</th>
                  <th className="p-2.5 min-w-[75px] text-right">{t('stockin_col_units', 'Qty')} *</th>
                  <th className="p-2.5 min-w-[90px] text-right">{t('stockin_col_cost', 'Cost (₱)')} *</th>
                  <th className="p-2.5 min-w-[90px] text-right">{t('stockin_selling_price', 'Price (₱)')} *</th>
                  <th className="p-2.5 min-w-[80px] text-right">{t('stockin_subtotal', 'Subtotal')}</th>
                  <th className="p-2.5 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {multiRows.map((row, idx) => {
                  const rowQty  = parseFloat(row.quantity) || 0;
                  const rowCost = parseFloat(row.unit_cost) || 0;
                  const rowPrev = expiryPreview(row.expiration_date);
                  return (
                    <tr key={row.id} className="hover:bg-zinc-50/60 transition">
                      <td className="p-2 text-center text-zinc-400 tabular-nums text-[10px]">{idx + 1}</td>
                      <td className="p-2">
                        <select value={row.medicine_id} onChange={e => handleMultiRowChange(row.id, 'medicine_id', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-1 focus:ring-teal-500 bg-white cursor-pointer" required>
                          <option value="">{t('choose_med_dispense', '— Choose Medicine —')}</option>
                          {medList.map(m => <option key={m.id} value={m.id}>{m.brand_name} ({m.generic_name} {m.dosage_strength})</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <input type="text" placeholder={t('ph_lot_format', 'LOT-XXX')} value={row.batch_number}
                          onChange={e => handleMultiRowChange(row.id, 'batch_number', e.target.value.toUpperCase())}
                          className="w-full px-2 py-1.5 text-xs tabular-nums uppercase border border-zinc-200 rounded-lg focus:ring-1 focus:ring-teal-500" required />
                      </td>
                      <td className="p-2">
                        <input type="date" value={row.expiration_date}
                          onChange={e => handleMultiRowChange(row.id, 'expiration_date', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-1 focus:ring-teal-500 mb-1" required />
                        <div className="flex gap-1 flex-wrap">
                          {[{l:'+6M',m:6},{l:'+1Y',m:12},{l:'+2Y',m:24},{l:'+3Y',m:36}].map(p => (
                            <button key={p.l} type="button" onClick={() => dateJump(row.id, p.m)}
                              className="px-1.5 py-px text-[9px] font-bold bg-zinc-100 hover:bg-teal-100 hover:text-teal-800 border border-zinc-200 text-zinc-600 rounded transition cursor-pointer">
                              {p.l}
                            </button>
                          ))}
                        </div>
                        {rowPrev && (
                          <div className={`text-[9px] tabular-nums mt-0.5 ${rowPrev.days <= 30 ? 'text-rose-600 font-bold' : rowPrev.days <= 90 ? 'text-amber-600' : 'text-teal-600'}`}>
                            {rowPrev.days}d · {rowPrev.tier}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <input type="number" min="1" placeholder={t('col_qty', 'Qty')} value={row.quantity}
                          onChange={e => handleMultiRowChange(row.id, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-bold border border-zinc-200 rounded-lg focus:ring-1 focus:ring-teal-500 text-right tabular-nums" required />
                      </td>
                      <td className="p-2">
                        <div className="relative">
                          <span className="absolute left-1.5 top-1.5 text-zinc-400 text-[10px]">₱</span>
                          <input type="number" step="0.01" min="0.01" placeholder="0.00" value={row.unit_cost}
                            onChange={e => handleMultiRowChange(row.id, 'unit_cost', e.target.value)}
                            className="w-full pl-5 pr-2 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-1 focus:ring-teal-500 text-right tabular-nums" required />
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="relative">
                          <span className="absolute left-1.5 top-1.5 text-zinc-400 text-[10px]">₱</span>
                          <input type="number" step="0.01" min="0.01" placeholder="0.00" value={row.selling_price}
                            onChange={e => handleMultiRowChange(row.id, 'selling_price', e.target.value)}
                            className="w-full pl-5 pr-2 py-1.5 text-xs font-bold text-teal-800 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-teal-500 text-right tabular-nums" required />
                        </div>
                      </td>
                      <td className="p-2 text-right tabular-nums font-semibold text-slate-800 text-xs tabular-nums whitespace-nowrap">
                        ₱{(rowQty * rowCost).toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <button type="button" onClick={() => handleRemoveMultiRow(row.id)}
                          disabled={multiRows.length <= 1}
                          className="p-1 text-zinc-400 hover:text-rose-600 disabled:opacity-30 transition cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary & Submit */}
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button type="button" onClick={() => handleAddMultiRow()}
                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-zinc-200 transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> {t('btn_add_another_item', 'Add Another Item')}
              </button>

              <div className="flex items-center gap-5 text-xs bg-zinc-50 px-4 py-2.5 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-zinc-400 uppercase text-[9px] font-bold block tracking-wider">{t('items_label', 'Items')}</span>
                  <span className="font-bold text-slate-800 tabular-nums">{multiRows.filter(r => r.medicine_id).length}</span>
                </div>
                <div>
                  <span className="text-zinc-400 uppercase text-[9px] font-bold block tracking-wider">{t('total_qty_label', 'Total Qty')}</span>
                  <span className="font-bold text-slate-800 tabular-nums">{multiRows.reduce((s, r) => s + (parseInt(r.quantity, 10) || 0), 0)}</span>
                </div>
                <div>
                  <span className="text-zinc-400 uppercase text-[9px] font-bold block tracking-wider">{t('total_cost_label', 'Total Cost')}</span>
                  <span className="font-bold text-teal-700 tabular-nums">₱{multiRows.reduce((s, r) => s + ((parseInt(r.quantity, 10) || 0) * (parseFloat(r.unit_cost) || 0)), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer">
              <PackageCheck className="w-4 h-4" />
              {loading ? t('loading', 'Loading…') : `${t('btn_confirm_multi_stockin', 'Confirm & Stock-In All Items')} (${multiRows.filter(r => r.medicine_id).length})`}
            </button>
          </div>
        </form>
      )}

      {/* Barcode Print Modal */}
      {barcodeMedicine && (
        <BarcodeModal medicine={barcodeMedicine} isOpen={Boolean(barcodeMedicine)} onClose={() => setBarcodeMedicine(null)} />
      )}
    </div>
  );
}
