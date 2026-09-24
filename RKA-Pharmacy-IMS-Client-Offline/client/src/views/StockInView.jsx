import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowDownToLine,
  Barcode,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Tag,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Layers,
  ListPlus,
  PackageCheck
} from 'lucide-react';
import BarcodeModal from '../components/BarcodeModal';
import HelperText from '../components/HelperText';
import { useLanguage } from '../context/LanguageContext';

export default function StockInView({ medicines, batches = [], onRefresh, onOpenAddMedicine, uiMode = 'clean' }) {
  const { t } = useLanguage();
  const [entryMode, setEntryMode] = useState('single'); // 'single' | 'multi'

  // Single-item state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedMedId, setSelectedMedId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDate, setExpDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricingSource, setPricingSource] = useState('custom');
  const [unitCost, setUnitCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  // Multi-item intake state
  const [multiSupplier, setMultiSupplier] = useState('United Laboratories (Unilab)');
  const [multiReferenceNo, setMultiReferenceNo] = useState('');
  const [multiNotes, setMultiNotes] = useState('');
  const [multiRows, setMultiRows] = useState([
    {
      id: 1,
      medicine_id: '',
      batch_number: '',
      manufacturing_date: new Date().toISOString().split('T')[0],
      expiration_date: '',
      quantity: '',
      unit_cost: '',
      selling_price: ''
    }
  ]);
  const [multiSuccessBatches, setMultiSuccessBatches] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [barcodeMedicine, setBarcodeMedicine] = useState(null);

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Selected medicine object
  const medList = medicines || [];
  const selectedMed = medList.find(m => m.id === parseInt(selectedMedId));

  const generateBatchNumberForMed = (med) => {
    if (!med) return '';
    const randomBatchSuffix = Math.floor(100 + Math.random() * 900);
    return `${(med.code || 'MED').replace('MED-', 'LOT-')}-${randomBatchSuffix}`;
  };

  const getMedPriceDefaults = (medId) => {
    const priorBatches = (batches || []).filter(b => b.medicine_id === parseInt(medId, 10));
    if (priorBatches.length > 0) {
      const latest = priorBatches[priorBatches.length - 1];
      return {
        unit_cost: Number(latest.unit_cost || 0).toString(),
        selling_price: Number(latest.selling_price || 0).toString()
      };
    }
    const med = (medicines || []).find(m => m.id === parseInt(medId, 10));
    const cost = med?.latest_unit_cost || 10;
    const price = med?.latest_selling_price || (cost * 1.35).toFixed(2);
    return {
      unit_cost: Number(cost).toString(),
      selling_price: Number(price).toString()
    };
  };

  const handleAddMultiRow = (prefillMed = null) => {
    const newId = Date.now() + Math.random();
    const today = new Date().toISOString().split('T')[0];
    if (prefillMed) {
      const prices = getMedPriceDefaults(prefillMed.id);
      setMultiRows(prev => [
        ...prev,
        {
          id: newId,
          medicine_id: prefillMed.id.toString(),
          batch_number: generateBatchNumberForMed(prefillMed),
          manufacturing_date: today,
          expiration_date: '',
          quantity: '50',
          unit_cost: prices.unit_cost,
          selling_price: prices.selling_price
        }
      ]);
    } else {
      setMultiRows(prev => [
        ...prev,
        {
          id: newId,
          medicine_id: '',
          batch_number: '',
          manufacturing_date: today,
          expiration_date: '',
          quantity: '',
          unit_cost: '',
          selling_price: ''
        }
      ]);
    }
  };

  const handleRemoveMultiRow = (id) => {
    if (multiRows.length <= 1) {
      setMultiRows([{
        id: Date.now(),
        medicine_id: '',
        batch_number: '',
        manufacturing_date: new Date().toISOString().split('T')[0],
        expiration_date: '',
        quantity: '',
        unit_cost: '',
        selling_price: ''
      }]);
    } else {
      setMultiRows(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleMultiRowChange = (id, field, value) => {
    setMultiRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      if (field === 'medicine_id') {
        const med = (medicines || []).find(m => m.id === parseInt(value, 10));
        if (med) {
          updated.batch_number = generateBatchNumberForMed(med);
          const prices = getMedPriceDefaults(med.id);
          updated.unit_cost = prices.unit_cost;
          updated.selling_price = prices.selling_price;
        }
      }
      return updated;
    }));
  };

  const handleDateJumpMultiRow = (id, months) => {
    const d = new Date();
    const originalDay = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== originalDay) {
      d.setDate(0);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    handleMultiRowChange(id, 'expiration_date', `${yyyy}-${mm}-${dd}`);
  };

  const processScannedBarcode = (query) => {
    if (!query) return;
    const match = medList.find(
      m => m.barcode?.toLowerCase() === query.toLowerCase() || m.code?.toLowerCase() === query.toLowerCase()
    );

    if (match) {
      if (entryMode === 'multi') {
        const emptyIdx = multiRows.findIndex(r => !r.medicine_id);
        if (emptyIdx >= 0) {
          handleMultiRowChange(multiRows[emptyIdx].id, 'medicine_id', match.id.toString());
        } else {
          handleAddMultiRow(match);
        }
        setBarcodeInput('');
        setError(null);
      } else {
        handleSelectMedicine(match);
        setBarcodeInput('');
        setError(null);
      }
    } else {
      setError(`No registered medicine matches barcode "${query}". You can register it first.`);
    }
  };

  // Handle barcode scanner input (enter key or manual submit)
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
    setSupplierName(med.supplier_name || 'United Laboratories (Unilab)');
    // Default mock batch format
    const randomBatchSuffix = Math.floor(100 + Math.random() * 900);
    setBatchNumber(`${med.code.replace('MED-', 'LOT-')}-${randomBatchSuffix}`);

    // Check if previous batches exist for this medicine
    const priorBatches = (batches || []).filter(b => b.medicine_id === med.id);
    if (priorBatches.length > 0) {
      const latestBatch = priorBatches[priorBatches.length - 1];
      setPricingSource(latestBatch.id.toString());
      setUnitCost(Number(latestBatch.unit_cost || 0).toString());
      setSellingPrice(Number(latestBatch.selling_price || 0).toString());
    } else {
      setPricingSource('custom');
      setUnitCost('');
      setSellingPrice('');
    }
  };

  const handlePricingSourceChange = (val) => {
    setPricingSource(val);
    if (val !== 'custom') {
      const b = (batches || []).find(item => item.id === parseInt(val));
      if (b) {
        setUnitCost(Number(b.unit_cost || 0).toString());
        setSellingPrice(Number(b.selling_price || 0).toString());
      }
    }
  };

  // Preview expiry days & classification
  let daysToExpiryPreview = null;
  let expiryTierPreview = null;
  if (expDate) {
    const today = new Date();
    const exp = new Date(expDate);
    daysToExpiryPreview = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (daysToExpiryPreview <= 0) expiryTierPreview = 'Expired (Invalid for stock-in)';
    else if (daysToExpiryPreview <= 30) expiryTierPreview = 'Critical (1-30 days)';
    else if (daysToExpiryPreview <= 90) expiryTierPreview = 'Warning (31-90 days)';
    else if (daysToExpiryPreview <= 180) expiryTierPreview = 'Monitor (91-180 days)';
    else expiryTierPreview = 'Safe (>180 days)';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMedId || !batchNumber || !expDate || !quantity) {
      setError('Please fill in all mandatory fields (Medicine, Batch Number, Expiration Date, Quantity).');
      return;
    }

    if (parseInt(quantity) <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    const costNum = parseFloat(unitCost);
    if (isNaN(costNum) || costNum <= 0) {
      setError('Unit Cost (₱) is required and must be greater than zero. Please enter a valid cost or select a previous batch.');
      return;
    }

    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Selling Price (₱) is required and must be greater than zero. Please enter a valid price or select a previous batch.');
      return;
    }

    if (mfgDate && new Date(expDate) <= new Date(mfgDate)) {
      setError('Expiration date must be later than the manufacturing date.');
      return;
    }

    if (daysToExpiryPreview <= 0) {
      setError('Cannot stock-in a batch that is already expired.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine_id: parseInt(selectedMedId),
          batch_number: batchNumber.trim(),
          manufacturing_date: mfgDate,
          expiration_date: expDate,
          quantity: parseInt(quantity),
          unit_cost: costNum,
          selling_price: priceNum,
          supplier_name: supplierName || selectedMed?.supplier_name,
          reference_no: referenceNo || `INV-${Date.now().toString().slice(-5)}`,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save batch intake');
      }

      setSuccessData({
        medicine: selectedMed,
        batch_number: batchNumber,
        quantity: parseInt(quantity),
        expDate
      });

      // Reset fields
      setBatchNumber('');
      setExpDate('');
      setQuantity('');
      setPricingSource('custom');
      setUnitCost('');
      setSellingPrice('');
      setReferenceNo('');
      setNotes('');

      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMultiStockIn = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessData(null);
    setMultiSuccessBatches(null);

    const filledRows = multiRows.filter(r => r.medicine_id);
    if (filledRows.length === 0) {
      setError('Please add at least one medicine item with valid batch and expiration details.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const payloadItems = [];

    for (let i = 0; i < filledRows.length; i++) {
      const r = filledRows[i];
      const med = (medicines || []).find(m => m.id === parseInt(r.medicine_id, 10));
      const medName = med ? med.brand_name : `Row #${i + 1}`;

      if (!r.batch_number || !r.batch_number.trim()) {
        setError(`Please enter a valid Batch / Lot Number for ${medName}.`);
        return;
      }
      if (!r.expiration_date) {
        setError(`Please enter an Expiration Date for ${medName}.`);
        return;
      }
      if (r.expiration_date <= todayStr) {
        setError(`Expiration date for ${medName} (${r.batch_number}) must be in the future.`);
        return;
      }
      const qty = parseInt(r.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        setError(`Please enter a quantity greater than zero for ${medName}.`);
        return;
      }
      const cost = parseFloat(r.unit_cost);
      if (isNaN(cost) || cost <= 0) {
        setError(`Please enter a valid Unit Cost greater than zero for ${medName}.`);
        return;
      }
      const price = parseFloat(r.selling_price);
      if (isNaN(price) || price <= 0) {
        setError(`Please enter a valid Selling Price greater than zero for ${medName}.`);
        return;
      }

      payloadItems.push({
        medicine_id: parseInt(r.medicine_id, 10),
        batch_number: r.batch_number.trim(),
        manufacturing_date: r.manufacturing_date || todayStr,
        expiration_date: r.expiration_date,
        quantity: qty,
        unit_cost: cost,
        selling_price: price,
        supplier_name: multiSupplier
      });
    }

    setLoading(true);
    try {
      const res = await fetch('/api/batches/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_name: multiSupplier,
          reference_no: multiReferenceNo || `INV-${Date.now().toString().slice(-6)}`,
          notes: multiNotes || `Multi-item intake (${payloadItems.length} lines)`,
          items: payloadItems
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process bulk stock-in');

      setMultiSuccessBatches(data.batches || payloadItems);
      setMultiRows([{
        id: Date.now(),
        medicine_id: '',
        batch_number: '',
        manufacturing_date: todayStr,
        expiration_date: '',
        quantity: '',
        unit_cost: '',
        selling_price: ''
      }]);
      setMultiReferenceNo('');
      setMultiNotes('');
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={uiMode === 'clean' ? 'max-w-4xl mx-auto space-y-4 pb-8' : 'max-w-4xl mx-auto space-y-6 pb-12'}>
      {/* Header */}
      <div className={`bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        uiMode === 'clean' ? 'p-4' : 'p-5'
      }`}>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
            <span>{t('stock_in_batch_receiving', 'Stock-In / Batch Receiving')}</span>
          </h2>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500">
            {t('stockin_subtitle', 'Scan barcode or select medicine to register incoming batches with expiration dates')}
          </HelperText>
        </div>

        <button
          onClick={onOpenAddMedicine}
          className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('btn_add_medicine', 'New Medicine Profile?')}</span>
        </button>
      </div>

      {/* Barcode Quick Scan Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-sm border border-slate-700">
        <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 shrink-0">
            <Barcode className="w-5 h-5" />
            <span>{t('stockin_scan_label', 'Barcode Scanner Input:')}</span>
          </div>
          <div className="relative flex-1 w-full">
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder={t('stockin_scan_placeholder', 'Scan barcode with handheld reader or type barcode and press Enter...')}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none placeholder:text-slate-400 font-mono"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
          >
            {uiMode === 'clean' ? 'Find' : 'Find Item'}
          </button>
        </form>
      </div>

      {/* Success Banner */}
      {successData && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">{t('stockin_success', 'Stock-In Recorded!')} </span>
              Successfully received {successData.quantity} units of{' '}
              <strong>{successData.medicine.brand_name}</strong> (Batch: {successData.batch_number}, Exp: {successData.expDate}).
            </div>
          </div>
          <button
            onClick={() => setBarcodeMedicine(successData.medicine)}
            className="text-xs bg-white text-emerald-800 border border-emerald-300 px-3 py-1 rounded-lg font-semibold hover:bg-emerald-100 transition flex items-center gap-1 shrink-0"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{t('btn_print_labels', 'Print Label')}</span>
          </button>
        </div>
      )}

      {/* Multi-Item Success Banner */}
      {multiSuccessBatches && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">{t('stockin_bulk_success', 'Bulk Stock-In Completed!')} </span>
              Successfully recorded {multiSuccessBatches.length} item(s) into inventory with atomic batch records.
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEntryMode('single')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              entryMode === 'single'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Single Batch Intake</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('multi')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              entryMode === 'multi'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Item Stock-In</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
              entryMode === 'multi' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {multiRows.filter(r => r.medicine_id).length}
            </span>
          </button>
        </div>
      </div>

      {entryMode === 'single' ? (
      /* Stock-In Entry Form */
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        {/* Medicine Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            {t('stockin_select_med', 'Select Medicine / Vitamin *')}
          </label>
          <select
            value={selectedMedId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedMedId(id);
              const m = medicines.find(med => med.id === parseInt(id));
              if (m) handleSelectMedicine(m);
            }}
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-800"
          >
            <option value="">-- Choose registered medicine from catalog --</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.brand_name} - {m.generic_name} ({m.dosage_strength} {m.dosage_form}) • Code: {m.code}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Medicine Context Preview */}
        {selectedMed && (
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-slate-900">{selectedMed.brand_name}</span>
              <span className="text-slate-600 ml-1">({selectedMed.generic_name})</span>
              <div className="text-[11px] text-slate-500">
                {t('inv_col_total_stock', 'Current Total Stock')}: <span className="font-bold text-emerald-800">{selectedMed.total_stock} {selectedMed.unit_of_measure}s</span> | {t('inv_col_reorder_threshold', 'Reorder Threshold')}: {selectedMed.reorder_threshold}
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] bg-white px-2 py-1 rounded border border-emerald-200 text-emerald-800">
              <Barcode className="w-3.5 h-3.5" />
              <span>{selectedMed.barcode}</span>
            </div>
          </div>
        )}

        {/* Batch & Expiration Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              {t('stockin_batch_num', 'Batch / Lot Number *')}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. LOT-2026-09"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              {t('stockin_mfg_date', 'Manufacturing Date')}
            </label>
            <input
              type="date"
              value={mfgDate}
              onChange={(e) => setMfgDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase text-slate-700">
                {t('stockin_exp_date', 'Expiration Date *')}
              </label>
              <div className="flex items-center gap-1">
                {[
                  { key: 'pill_plus_6m', defaultLabel: '+6 Mos', months: 6 },
                  { key: 'pill_plus_1y', defaultLabel: '+1 Yr', months: 12 },
                  { key: 'pill_plus_2y', defaultLabel: '+2 Yrs', months: 24 },
                  { key: 'pill_plus_3y', defaultLabel: '+3 Yrs', months: 36 }
                ].map(pill => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const originalDay = d.getDate();
                      d.setMonth(d.getMonth() + pill.months);
                      if (d.getDate() !== originalDay) {
                        d.setDate(0); // Clamp to last day of target month if month has fewer days
                      }
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      setExpDate(`${yyyy}-${mm}-${dd}`);
                    }}
                    className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-600 rounded transition"
                  >
                    {t(pill.key, pill.defaultLabel)}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="date"
              required
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            />
          </div>
        </div>

        {/* Expiration Tier Preview Badge */}
        {expDate && (
          <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
            daysToExpiryPreview <= 0 ? 'bg-red-50 border-red-300 text-red-900' :
            daysToExpiryPreview <= 30 ? 'bg-rose-50 border-rose-300 text-rose-900' :
            daysToExpiryPreview <= 90 ? 'bg-amber-50 border-amber-300 text-amber-900' :
            'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4" />
              <span>Expiry Preview: <strong>{daysToExpiryPreview} days</strong> remaining from today</span>
            </div>
            <span className="font-bold uppercase tracking-wider text-[11px] bg-white px-2 py-0.5 rounded shadow-2xs">
              Tier: {expiryTierPreview}
            </span>
          </div>
        )}

        {/* Quantity & Pricing Section */}
        <div className="space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
            <div>
              <span className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                Batch Pricing & Quantity
              </span>
              <HelperText uiMode={uiMode} as="span" className="text-[11px] text-slate-500 block">
                Cost and selling price are mandatory and must be greater than ₱0.00 before saving.
              </HelperText>
            </div>

            {selectedMed && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-600">Pricing:</label>
                <select
                  value={pricingSource}
                  onChange={(e) => handlePricingSourceChange(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                >
                  <option value="custom">Manual Custom Pricing</option>
                  {(batches || [])
                    .filter(b => b.medicine_id === selectedMed.id)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        Adopt Batch {b.batch_number} (Cost: ₱{b.unit_cost} / Price: ₱{b.selling_price})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Quantity Received *
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Unit Cost (₱) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 5.50"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                {t('stockin_selling_price', 'Selling Price (₱) *')}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 8.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-bold text-emerald-800"
              />
            </div>
          </div>
        </div>

        {/* Supplier & Invoice References */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              {t('stockin_supplier', 'Supplier / Distributor')}
            </label>
            <input
              type="text"
              placeholder="e.g. United Laboratories, Zuellig Pharma"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              {t('stockin_ref_no', 'Delivery Invoice / DR Reference')}
            </label>
            <input
              type="text"
              placeholder="e.g. INV-89241"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            />
          </div>
        </div>

        {/* Receiving Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            {t('stockin_notes', 'Receiving Notes / Quality Inspection')}
          </label>
          <input
            type="text"
            placeholder="e.g. Box intact, seal unbroken, stored in air-conditioned dispensary cabinet"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2"
        >
          <ArrowDownToLine className="w-5 h-5" />
          <span>
            {loading
              ? 'Saving Intake Record...'
              : t('stockin_submit_btn', 'Confirm & Register Batch')}
          </span>
        </button>
      </form>
      ) : (
      /* Multi-Item Stock-In Form */
      <form onSubmit={handleSubmitMultiStockIn} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Multi-Item Batch Intake</span>
            </h3>
            <p className="text-xs text-slate-500">
              Record multiple medicine deliveries in a single intake session with individual batch lots, expiries, and costs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleAddMultiRow()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medicine Line</span>
          </button>
        </div>

        {/* Delivery & Reference Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Supplier / Distributor
            </label>
            <input
              type="text"
              placeholder="e.g. United Laboratories, Zuellig Pharma"
              value={multiSupplier}
              onChange={(e) => setMultiSupplier(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Delivery Invoice / DR Reference
            </label>
            <input
              type="text"
              placeholder="e.g. DR-99420"
              value={multiReferenceNo}
              onChange={(e) => setMultiReferenceNo(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Receiving Notes / Inspection
            </label>
            <input
              type="text"
              placeholder="e.g. All packaging intact and sealed"
              value={multiNotes}
              onChange={(e) => setMultiNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>

        {/* Multi-Item Lines Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-2.5 w-8 text-center">#</th>
                <th className="p-2.5 min-w-[200px]">Medicine Catalog Item *</th>
                <th className="p-2.5 min-w-[140px]">Batch / Lot # *</th>
                <th className="p-2.5 min-w-[160px]">Expiry Date *</th>
                <th className="p-2.5 min-w-[80px]">Qty *</th>
                <th className="p-2.5 min-w-[95px]">Cost (₱) *</th>
                <th className="p-2.5 min-w-[95px]">Price (₱) *</th>
                <th className="p-2.5 min-w-[85px] text-right">Subtotal</th>
                <th className="p-2.5 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {multiRows.map((row, idx) => {
                const rowQty = parseFloat(row.quantity) || 0;
                const rowCost = parseFloat(row.unit_cost) || 0;
                const subtotal = rowQty * rowCost;

                return (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="p-2">
                      <select
                        value={row.medicine_id}
                        onChange={(e) => handleMultiRowChange(row.id, 'medicine_id', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 bg-white"
                        required
                      >
                        <option value="">-- Choose Medicine --</option>
                        {(medicines || []).map(m => (
                          <option key={m.id} value={m.id}>
                            {m.brand_name} ({m.generic_name} {m.dosage_strength})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="e.g. LOT-409"
                        value={row.batch_number}
                        onChange={(e) => handleMultiRowChange(row.id, 'batch_number', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono uppercase border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <input
                          type="date"
                          value={row.expiration_date}
                          onChange={(e) => handleMultiRowChange(row.id, 'expiration_date', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                        <div className="flex gap-1 text-[9px]">
                          <button
                            type="button"
                            onClick={() => handleDateJumpMultiRow(row.id, 6)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                          >
                            +6M
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDateJumpMultiRow(row.id, 12)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                          >
                            +1Y
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDateJumpMultiRow(row.id, 24)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                          >
                            +2Y
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={row.quantity}
                        onChange={(e) => handleMultiRowChange(row.id, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 text-right"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <div className="relative">
                        <span className="absolute left-1.5 top-1.5 text-slate-400 text-[11px]">₱</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={row.unit_cost}
                          onChange={(e) => handleMultiRowChange(row.id, 'unit_cost', e.target.value)}
                          className="w-full pl-5 pr-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 text-right"
                          required
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="relative">
                        <span className="absolute left-1.5 top-1.5 text-slate-400 text-[11px]">₱</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={row.selling_price}
                          onChange={(e) => handleMultiRowChange(row.id, 'selling_price', e.target.value)}
                          className="w-full pl-5 pr-2 py-1.5 text-xs font-bold text-emerald-800 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 text-right"
                          required
                        />
                      </div>
                    </td>
                    <td className="p-2 text-right font-mono font-semibold text-slate-800 text-xs">
                      ₱{subtotal.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveMultiRow(row.id)}
                        disabled={multiRows.length <= 1}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 transition"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions and Totals Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddMultiRow()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-300 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Item</span>
            </button>
          </div>

          <div className="flex items-center gap-6 text-xs bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 uppercase text-[10px] block font-semibold">Total Items</span>
              <span className="font-bold text-slate-800 text-sm">
                {multiRows.filter(r => r.medicine_id).length} line(s)
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block font-semibold">Total Quantity</span>
              <span className="font-bold text-slate-800 text-sm">
                {multiRows.reduce((sum, r) => sum + (parseInt(r.quantity, 10) || 0), 0)} units
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block font-semibold">Total Cost</span>
              <span className="font-bold text-emerald-700 text-sm">
                ₱{multiRows.reduce((sum, r) => sum + ((parseInt(r.quantity, 10) || 0) * (parseFloat(r.unit_cost) || 0)), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Bulk Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2"
        >
          <PackageCheck className="w-5 h-5" />
          <span>
            {loading ? 'Processing Bulk Stock-In...' : `Confirm & Stock-In All Items (${multiRows.filter(r => r.medicine_id).length})`}
          </span>
        </button>
      </form>
      )}

      {/* Barcode Print Modal */}
      {barcodeMedicine && (
        <BarcodeModal
          medicine={barcodeMedicine}
          onClose={() => setBarcodeMedicine(null)}
        />
      )}
    </div>
  );
}
