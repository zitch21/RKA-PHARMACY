import React, { useState, useEffect } from 'react';
import { X, Edit3, Check } from 'lucide-react';

export default function EditMedicineModal({ isOpen, onClose, medicine, onMedicineUpdated }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Edit3 className="w-5 h-5 text-emerald-600" />
            <span>Edit Medicine Profile: {medicine.brand_name}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                name="brand_name"
                required
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
                value={formData.generic_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Dosage Strength
              </label>
              <input
                type="text"
                name="dosage_strength"
                required
                value={formData.dosage_strength}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Form
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
                <option value="Ointment / Cream">Ointment / Cream</option>
                <option value="Vial / Ampoule">Vial / Ampoule</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Unit of Measure
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
                <option value="Piece">Piece</option>
                <option value="Blister Pack">Blister Pack</option>
                <option value="Box">Box</option>
                <option value="Tube">Tube</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Supplier
              </label>
              <input
                type="text"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
            <div>
              <label className="block text-xs font-semibold uppercase text-emerald-900 mb-1">
                Threshold
              </label>
              <input
                type="number"
                name="reorder_threshold"
                min="0"
                required
                value={formData.reorder_threshold}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-emerald-300 rounded bg-white focus:outline-none"
              />
              <span className="text-[10px] text-emerald-700">Low stock alert</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-emerald-900 mb-1">
                Lead Time (Days)
              </label>
              <input
                type="number"
                name="supplier_lead_time_days"
                min="1"
                required
                value={formData.supplier_lead_time_days}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-emerald-300 rounded bg-white focus:outline-none"
              />
              <span className="text-[10px] text-emerald-700">Order arrival</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-emerald-900 mb-1">
                Buffer (Days)
              </label>
              <input
                type="number"
                name="buffer_days"
                min="0"
                required
                value={formData.buffer_days}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-emerald-300 rounded bg-white focus:outline-none"
              />
              <span className="text-[10px] text-emerald-700">Safety margin</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Barcode
            </label>
            <input
              type="text"
              name="barcode"
              required
              value={formData.barcode}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
