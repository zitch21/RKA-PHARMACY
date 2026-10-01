import React, { useState, useEffect } from 'react';
import { X, Edit3, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const inputCls = "w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white dark:bg-[#1e2430] text-slate-800 dark:text-slate-100 placeholder:text-slate-400";
const inputMonoCls = `${inputCls} tabular-nums`;

export default function EditMedicineModal({ isOpen, onClose, medicine, onMedicineUpdated }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    brand_name: '',
    generic_name: '',
    dosage_strength: '',
    dosage_form: 'Tablet',
    category: 'Analgesic / Antipyretic',
    unit_of_measure: 'Tablet',
    reorder_threshold: 30,
    supplier_lead_time_days: 5,
    buffer_days: 3,
    supplier_name: '',
    barcode: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (medicine) {
      setFormData({
        brand_name: medicine.brand_name || '',
        generic_name: medicine.generic_name || '',
        dosage_strength: medicine.dosage_strength || '',
        dosage_form: medicine.dosage_form || 'Tablet',
        category: medicine.category || 'Analgesic / Antipyretic',
        unit_of_measure: medicine.unit_of_measure || 'Tablet',
        reorder_threshold: medicine.reorder_threshold || 20,
        supplier_lead_time_days: medicine.supplier_lead_time_days || 5,
        buffer_days: medicine.buffer_days || 3,
        supplier_name: medicine.supplier_name || '',
        barcode: medicine.barcode || '',
        description: medicine.description || ''
      });
      setError(null);
    }
  }, [medicine]);

  if (!isOpen || !medicine) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/medicines/${medicine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reorder_threshold: parseInt(formData.reorder_threshold),
          supplier_lead_time_days: parseInt(formData.supplier_lead_time_days),
          buffer_days: parseInt(formData.buffer_days)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update medicine profile');

      onMedicineUpdated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 overflow-y-auto select-none animate-in fade-in">
      <div className="bg-white dark:bg-[#181d26] rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200/90 dark:border-white/10 my-8">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                {t('edit_med_title', 'Edit Medicine Profile')}: <span className="text-teal-600 dark:text-teal-400">{medicine.brand_name}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('edit_med_subtitle', 'Update catalog metadata, dosage, categories, and reorder levels')}
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
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-800 dark:text-rose-200 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_brand_name', 'Brand Name')} *
              </label>
              <input
                type="text"
                name="brand_name"
                required
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
                value={formData.generic_name}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_dosage_strength', 'Dosage Strength')}
              </label>
              <input
                type="text"
                name="dosage_strength"
                required
                value={formData.dosage_strength}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_dosage_form', 'Dosage Form')}
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
                <option value="Ointment / Cream">{t('dosage_form_ointment_cream', 'Ointment / Cream')}</option>
                <option value="Vial / Ampoule">{t('dosage_form_vial_ampoule', 'Vial / Ampoule')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_uom', 'Unit of Measure')}
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
                <option value="Piece">{t('pkg_unit_piece', 'Piece')}</option>
                <option value="Blister Pack">{t('pkg_unit_blister', 'Blister Pack')}</option>
                <option value="Box">{t('pkg_unit_box', 'Box')}</option>
                <option value="Tube">{t('pkg_unit_tube', 'Tube')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_category', 'Category')}
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                {t('edit_med_supplier', 'Supplier / Distributor')}
              </label>
              <input
                type="text"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-teal-50/50 p-3 rounded-xl border border-teal-200">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-900 mb-1">
                {t('edit_med_threshold', 'Threshold')}
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
              <span className="text-[9px] text-teal-700 mt-0.5 block tabular-nums">{t('edit_med_low_stock_alert', 'Low stock alert')}</span>
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
                {t('edit_med_buffer', 'Buffer (Days)')}
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
              <span className="text-[9px] text-teal-700 mt-0.5 block tabular-nums">{t('edit_med_safety_margin', 'Safety margin')}</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              {t('edit_med_barcode', 'Barcode')}
            </label>
            <input
              type="text"
              name="barcode"
              required
              value={formData.barcode}
              onChange={handleChange}
              className={inputMonoCls}
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
              <span>{loading ? t('edit_med_saving', 'Saving...') : t('edit_med_save_btn', 'Save Profile Changes')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
