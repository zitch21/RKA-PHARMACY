import React, { useState } from 'react';
import { X, PlusCircle, Sparkles, Layers, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getLocalDateISO } from '../utils/dateFormatter';

const inputCls = "w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white dark:bg-[#1e2430] text-slate-800 dark:text-slate-100 placeholder:text-slate-400";
const inputMonoCls = `${inputCls} tabular-nums`;

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

    if (formData.has_initial_batch) {
      if (!formData.batch_number.trim()) {
        setError(t('err_add_med_batch', 'Please provide an initial batch / lot number.'));
        return;
      }
      if (!formData.expiration_date) {
        setError(t('err_add_med_expiry', 'Please select an expiration date for the initial batch.'));
        return;
      }
      const initialQty = parseInt(formData.initial_quantity, 10);
      if (isNaN(initialQty) || initialQty <= 0) {
        setError(t('err_add_med_qty', 'Initial batch quantity must be greater than zero.'));
        return;
      }
      const cost = parseFloat(formData.unit_cost);
      if (isNaN(cost) || cost <= 0) {
        setError(t('err_add_med_cost', 'Unit Cost is required and must be greater than zero for the initial batch.'));
        return;
      }
      const price = parseFloat(formData.selling_price);
      if (isNaN(price) || price <= 0) {
        setError(t('err_add_med_price', 'Selling Price is required and must be greater than zero for the initial batch.'));
        return;
      }
    }

    try {
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

      if (formData.has_initial_batch && formData.batch_number && formData.expiration_date && formData.initial_quantity) {
        const batchRes = await fetch('/api/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medicine_id: medData.id,
            batch_number: formData.batch_number.toUpperCase(),
            expiration_date: formData.expiration_date,
            manufacturing_date: getLocalDateISO(),
            quantity: parseInt(formData.initial_quantity, 10),
            unit_cost: parseFloat(formData.unit_cost),
            selling_price: parseFloat(formData.selling_price),
            supplier_name: formData.supplier_name
          })
        });

        if (!batchRes.ok) {
          const batchErr = await batchRes.json();
          throw new Error(batchErr.error || 'Failed to register initial batch');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 overflow-y-auto select-none">
      <div className="bg-white dark:bg-[#181d26] rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200/90 dark:border-white/10 animate-in fade-in my-8">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                {t('modal_add_med_title', 'Register New Medicine / Vitamin Profile')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('modal_add_med_sub', 'Create SKU master record, dosage formulation, and initial intake lot')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_brand_name', 'Brand Name')} *
              </label>
              <input
                type="text"
                name="brand_name"
                required
                placeholder={t('ph_example_brands', 'e.g. Biogesic, Amoxil, Ceelin')}
                value={formData.brand_name}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_generic_name', 'Generic Name')} *
              </label>
              <input
                type="text"
                name="generic_name"
                required
                placeholder={t('ph_example_generics', 'e.g. Paracetamol, Amoxicillin')}
                value={formData.generic_name}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_dosage_strength', 'Dosage Strength')} *
              </label>
              <input
                type="text"
                name="dosage_strength"
                required
                placeholder={t('ph_example_dosage_strength', 'e.g. 500mg, 10mg/5mL')}
                value={formData.dosage_strength}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_dosage_form', 'Dosage Form')} *
              </label>
              <select
                name="dosage_form"
                value={formData.dosage_form}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="Tablet">{t('dosage_form_tablet', 'Tablet')}</option>
                <option value="Capsule">{t('dosage_form_capsule', 'Capsule')}</option>
                <option value="Syrup">{t('dosage_form_syrup', 'Syrup')}</option>
                <option value="Suspension">{t('dosage_form_suspension', 'Suspension')}</option>
                <option value="Drops">{t('dosage_form_drops', 'Drops')}</option>
                <option value="Injection">{t('dosage_form_injection', 'Injection')}</option>
                <option value="Ointment">{t('dosage_form_ointment', 'Ointment')}</option>
                <option value="Cream">{t('dosage_form_cream', 'Cream')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_uom', 'Unit of Measure')} *
              </label>
              <select
                name="unit_of_measure"
                value={formData.unit_of_measure}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="Tablet">{t('dosage_form_tablet', 'Tablet')}</option>
                <option value="Capsule">{t('dosage_form_capsule', 'Capsule')}</option>
                <option value="Bottle">{t('pkg_unit_bottle', 'Bottle')}</option>
                <option value="Vial">{t('pkg_unit_vial', 'Vial')}</option>
                <option value="Ampule">{t('pkg_unit_ampule', 'Ampule')}</option>
                <option value="Tube">{t('pkg_unit_tube', 'Tube')}</option>
                <option value="Sachet">{t('pkg_unit_sachet', 'Sachet')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_category', 'Category')}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="Analgesic / Antipyretic">{t('cat_analgesic', 'Analgesic / Antipyretic')}</option>
                <option value="Antibiotic">{t('cat_antibiotic', 'Antibiotic')}</option>
                <option value="Vitamins & Supplements">{t('cat_vitamins', 'Vitamins & Supplements')}</option>
                <option value="Antihistamine">{t('cat_antihistamine', 'Antihistamine')}</option>
                <option value="Respiratory">{t('cat_respiratory', 'Respiratory')}</option>
                <option value="Cardiovascular">{t('cat_cardiovascular', 'Cardiovascular')}</option>
                <option value="Antidiabetic">{t('cat_antidiabetic', 'Antidiabetic')}</option>
                <option value="Gastrointestinal">{t('cat_gastrointestinal', 'Gastrointestinal')}</option>
                <option value="Topical / Dermatological">{t('cat_topical', 'Topical / Dermatological')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_supplier', 'Primary Supplier / Distributor')}
              </label>
              <input
                type="text"
                name="supplier_name"
                placeholder={t('ph_unilab_example', 'e.g. United Laboratories (Unilab)')}
                value={formData.supplier_name}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
          </div>

          {/* Barcode & Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('col_sku', 'Item SKU Code (Optional)')}
              </label>
              <input
                type="text"
                name="code"
                placeholder={t('ph_sku_autogen', 'Auto-generated if blank (e.g. MED-011)')}
                value={formData.code}
                onChange={handleChange}
                className={inputMonoCls}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {t('edit_med_barcode', 'Barcode')}
                </label>
                <button
                  type="button"
                  onClick={handleGenerateInternalBarcode}
                  className="text-[10px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  {t('add_med_generate_barcode', 'Generate Internal Barcode')}
                </button>
              </div>
              <input
                type="text"
                name="barcode"
                placeholder={t('ph_scan_barcode_generate', 'Scan manufacturer barcode or generate')}
                value={formData.barcode}
                onChange={handleChange}
                className={inputMonoCls}
              />
            </div>
          </div>

          {/* Inventory Planning Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-teal-50/50 p-3 rounded-xl border border-teal-200">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-900 mb-1">
                {t('edit_med_threshold', 'Reorder Threshold')}
              </label>
              <input
                type="number"
                name="reorder_threshold"
                min="0"
                required
                value={formData.reorder_threshold}
                onChange={handleChange}
                className={inputMonoCls}
              />
              <span className="text-[9px] text-teal-700 mt-0.5 block tabular-nums">{t('edit_med_low_stock_alert', 'Triggers Low Stock Alert')}</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-900 mb-1">
                {t('edit_med_lead_time', 'Lead Time (Days)')}
              </label>
              <input
                type="number"
                name="supplier_lead_time_days"
                min="1"
                required
                value={formData.supplier_lead_time_days}
                onChange={handleChange}
                className={inputMonoCls}
              />
              <span className="text-[9px] text-teal-700 mt-0.5 block tabular-nums">{t('edit_med_arrival_span', 'Order arrival span')}</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-900 mb-1">
                {t('edit_med_buffer', 'Safety Buffer Days')}
              </label>
              <input
                type="number"
                name="buffer_days"
                min="0"
                required
                value={formData.buffer_days}
                onChange={handleChange}
                className={inputMonoCls}
              />
              <span className="text-[9px] text-teal-700 mt-0.5 block tabular-nums">{t('edit_med_safety_margin', 'Extra safety margin')}</span>
            </div>
          </div>

          {/* Optional Initial Batch Intake */}
          <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="has_initial_batch"
                  checked={formData.has_initial_batch}
                  onChange={handleChange}
                  className="rounded text-teal-600 focus:ring-teal-500 border-zinc-300 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t('add_med_initial_batch_heading', 'Record Initial Stock-In Batch (Optional)')}</span>
                </span>
              </label>
              <span className="text-[10px] text-zinc-400 tabular-nums">{t('add_med_initial_batch_desc', 'Instant stock registration')}</span>
            </div>

            {formData.has_initial_batch && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-200 animate-in fade-in">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    {t('stockin_col_batch', 'Batch / Lot Number')} *
                  </label>
                  <input
                    type="text"
                    name="batch_number"
                    required={formData.has_initial_batch}
                    placeholder={t('ph_lot_init', 'e.g. LOT-2026-INIT')}
                    value={formData.batch_number}
                    onChange={(e) => setFormData(p => ({ ...p, batch_number: e.target.value.toUpperCase() }))}
                    className={inputMonoCls}
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {t('stockin_col_expiry', 'Expiration Date')} *
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
                          className="px-1.5 py-0.5 text-[9px] font-bold bg-white hover:bg-teal-100 hover:text-teal-900 border border-zinc-200 text-zinc-600 rounded transition cursor-pointer tabular-nums"
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
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    {t('stockin_col_qty', 'Initial Quantity')} *
                  </label>
                  <input
                    type="number"
                    name="initial_quantity"
                    min="1"
                    required={formData.has_initial_batch}
                    placeholder={t('ph_qty_100_example', 'e.g. 100')}
                    value={formData.initial_quantity}
                    onChange={handleChange}
                    className={inputMonoCls}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    {t('stockin_col_cost', 'Unit Cost (₱)')} *
                  </label>
                  <input
                    type="number"
                    name="unit_cost"
                    step="0.01"
                    min="0.01"
                    required={formData.has_initial_batch}
                    placeholder={t('ph_cost_example', 'e.g. 4.50')}
                    value={formData.unit_cost}
                    onChange={handleChange}
                    className={inputMonoCls}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    {t('stockin_col_retail', 'Selling Price (₱)')} *
                  </label>
                  <input
                    type="number"
                    name="selling_price"
                    step="0.01"
                    min="0.01"
                    required={formData.has_initial_batch}
                    placeholder={t('ph_price_example', 'e.g. 7.50')}
                    value={formData.selling_price}
                    onChange={handleChange}
                    className={`${inputMonoCls} font-bold text-teal-800`}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              {t('notes_label', 'Description / Clinical Notes')}
            </label>
            <textarea
              name="description"
              rows="2"
              placeholder={t('ph_clinical_indications', 'Clinical indications or special storage guidelines...')}
              value={formData.description}
              onChange={handleChange}
              className={inputCls}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              {t('btn_cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-[0.98] rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? t('add_med_submitting', 'Registering...') : t('add_med_submit_btn', 'Register Medicine Profile')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
