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
  Sparkles
} from 'lucide-react';
import BarcodeModal from '../components/BarcodeModal';
import HelperText from '../components/HelperText';
import { useLanguage } from '../context/LanguageContext';

export default function StockInView({ medicines, batches = [], onRefresh, onOpenAddMedicine, uiMode = 'clean' }) {
  const { t } = useLanguage();
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

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stock-In Entry Form */}
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
                      d.setMonth(d.getMonth() + pill.months);
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
