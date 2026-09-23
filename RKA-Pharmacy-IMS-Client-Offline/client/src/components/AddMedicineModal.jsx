import React, { useState } from 'react';
import { X, PlusCircle, Sparkles, Layers } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AddMedicineModal({ isOpen, onClose, onMedicineAdded }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    code: '',
    barcode: '',
    brand_name: '',
    generic_name: '',
    dosage_strength: '',
    dosage_form: 'Tablet',
    category: 'Analgesic / Antipyretic',
    unit_of_measure: 'Tablet',
    reorder_threshold: 30,
    supplier_lead_time_days: 5,
    buffer_days: 3,
    supplier_name: 'United Laboratories (Unilab)',
    description: '',
    // Optional Initial Batch
    has_initial_batch: false,
    batch_number: '',
    expiration_date: '',
    initial_quantity: '',
    unit_cost: '',
    selling_price: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFastFillExpiry = (months) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setFormData(prev => ({
      ...prev,
      expiration_date: `${yyyy}-${mm}-${dd}`
    }));
  };

  const handleGenerateInternalBarcode = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = formData.code ? formData.code : 'MED';
    setFormData(prev => ({
      ...prev,
      barcode: `RKA-${prefix}-${randomSuffix}-INT`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create Medicine Profile
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          barcode: formData.barcode,
          brand_name: formData.brand_name,
          generic_name: formData.generic_name,
          dosage_strength: formData.dosage_strength,
          dosage_form: formData.dosage_form,
          category: formData.category,
          unit_of_measure: formData.unit_of_measure,
          reorder_threshold: formData.reorder_threshold,
          supplier_lead_time_days: formData.supplier_lead_time_days,
          buffer_days: formData.buffer_days,
          supplier_name: formData.supplier_name,
          description: formData.description
        })
      });

      const medData = await res.json();
      if (!res.ok) {
        throw new Error(medData.error || 'Failed to register medicine profile');
      }

      // 2. If Initial Batch is toggled and filled, create initial batch
      if (formData.has_initial_batch && formData.batch_number && formData.expiration_date && formData.initial_quantity) {
        const batchRes = await fetch('/api/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medicine_id: medData.id,
            batch_number: formData.batch_number,
            expiration_date: formData.expiration_date,
            manufacturing_date: new Date().toISOString().split('T')[0],
            quantity: parseInt(formData.initial_quantity, 10),
            unit_cost: parseFloat(formData.unit_cost) || 0,
            selling_price: parseFloat(formData.selling_price) || 0,
            supplier_name: formData.supplier_name
          })
        });

        if (!batchRes.ok) {
          const batchErr = await batchRes.json();
          console.warn('Medicine created, but initial batch failed:', batchErr.error);
        }
      }

      onMedicineAdded(medData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <span>{t('modal_add_med_title', 'Register New Medicine / Vitamin Profile')}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                name="brand_name"
                required
                placeholder="e.g. Biogesic, Amoxil, Ceelin"
                value={formData.brand_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Generic Name *
              </label>
              <input
                type="text"
                name="generic_name"
                required
                placeholder="e.g. Paracetamol, Amoxicillin"
                value={formData.generic_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Dosage Strength *
              </label>
              <input
                type="text"
                name="dosage_strength"
                required
                placeholder="e.g. 500mg, 10mg/5mL"
                value={formData.dosage_strength}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Dosage Form *
              </label>
              <select
                name="dosage_form"
                value={formData.dosage_form}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Suspension">Suspension</option>
                <option value="Drops">Drops</option>
                <option value="Injection">Injection</option>
                <option value="Ointment">Ointment</option>
                <option value="Cream">Cream</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Unit of Measure *
              </label>
              <select
                name="unit_of_measure"
                value={formData.unit_of_measure}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Bottle">Bottle</option>
                <option value="Vial">Vial</option>
                <option value="Ampule">Ampule</option>
                <option value="Tube">Tube</option>
                <option value="Sachet">Sachet</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="Analgesic / Antipyretic">Analgesic / Antipyretic</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Vitamins & Supplements">Vitamins & Supplements</option>
                <option value="Antihistamine">Antihistamine</option>
                <option value="Respiratory">Respiratory</option>
                <option value="Cardiovascular">Cardiovascular</option>
                <option value="Antidiabetic">Antidiabetic</option>
                <option value="Gastrointestinal">Gastrointestinal</option>
                <option value="Topical / Dermatological">Topical / Dermatological</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Primary Supplier
              </label>
              <input
                type="text"
                name="supplier_name"
                placeholder="e.g. Unilab, Pfizer, Ritemed"
                value={formData.supplier_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Barcode & Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Item Code (Optional)
              </label>
              <input
                type="text"
                name="code"
                placeholder="Auto-generated if blank (e.g. MED-011)"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase text-slate-600">
                  Barcode (Manufacturer or Internal)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateInternalBarcode}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-generate Internal
                </button>
              </div>
              <input
                type="text"
                name="barcode"
                placeholder="Scan manufacturer barcode or generate"
                value={formData.barcode}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Inventory Planning Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
            <div>
              <label className="block text-xs font-semibold uppercase text-emerald-800 mb-1">
                Reorder Threshold (Units)
              </label>
              <input
                type="number"
                name="reorder_threshold"
                min="0"
                required
                value={formData.reorder_threshold}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-emerald-700">Triggers Low Stock Alert</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-emerald-800 mb-1">
                Supplier Lead Time (Days)
              </label>
              <input
                type="number"
                name="supplier_lead_time_days"
                min="1"
                required
                value={formData.supplier_lead_time_days}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-emerald-700">Order to delivery span</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-emerald-800 mb-1">
                Safety Buffer Days
              </label>
              <input
                type="number"
                name="buffer_days"
                min="0"
                required
                value={formData.buffer_days}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-emerald-700">Extra safety margin</span>
            </div>
          </div>

          {/* Optional Initial Batch Intake Section with Fast-Fill Pill Buttons */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="has_initial_batch"
                  checked={formData.has_initial_batch}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Record Initial Stock-In Batch (Optional)</span>
                </span>
              </label>
              <span className="text-[10px] text-slate-500">
                Instantly populate stock & expiry
              </span>
            </div>

            {formData.has_initial_batch && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                    Batch / Lot Number *
                  </label>
                  <input
                    type="text"
                    name="batch_number"
                    required={formData.has_initial_batch}
                    placeholder="e.g. LOT-2026-INIT"
                    value={formData.batch_number}
                    onChange={handleChange}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold uppercase text-slate-600">
                      Expiration Date *
                    </label>
                    <div className="flex items-center gap-1">
                      {[
                        { label: '+6 Mos', months: 6 },
                        { label: '+1 Yr', months: 12 },
                        { label: '+2 Yrs', months: 24 },
                        { label: '+3 Yrs', months: 36 }
                      ].map(pill => (
                        <button
                          key={pill.label}
                          type="button"
                          onClick={() => handleFastFillExpiry(pill.months)}
                          className="px-1.5 py-0.5 text-[10px] font-bold bg-white hover:bg-emerald-100 hover:text-emerald-800 border border-slate-200 text-slate-700 rounded transition"
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="date"
                    name="expiration_date"
                    required={formData.has_initial_batch}
                    value={formData.expiration_date}
                    onChange={handleChange}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                    Initial Quantity *
                  </label>
                  <input
                    type="number"
                    name="initial_quantity"
                    min="1"
                    required={formData.has_initial_batch}
                    placeholder="e.g. 100"
                    value={formData.initial_quantity}
                    onChange={handleChange}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                    Unit Cost (₱)
                  </label>
                  <input
                    type="number"
                    name="unit_cost"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 4.50"
                    value={formData.unit_cost}
                    onChange={handleChange}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                    Selling Price (₱)
                  </label>
                  <input
                    type="number"
                    name="selling_price"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 7.50"
                    value={formData.selling_price}
                    onChange={handleChange}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-emerald-800"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Description / Notes
            </label>
            <textarea
              name="description"
              rows="2"
              placeholder="Clinical indications or special storage guidelines..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
