import React, { useState } from 'react';
import { X, PlusCircle, Sparkles } from 'lucide-react';

export default function AddMedicineModal({ isOpen, onClose, onMedicineAdded }) {
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
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register medicine');
      }

      onMedicineAdded(data);
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
            <span>Register New Medicine / Vitamin Profile</span>
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
                <option value="Ointment / Cream">Ointment / Cream</option>
                <option value="Vial / Ampoule">Vial / Ampoule</option>
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
                <option value="Piece">Piece</option>
                <option value="Blister Pack">Blister Pack</option>
                <option value="Box">Box</option>
                <option value="Tube">Tube</option>
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
                <option value="Other Medical Supply">Other Medical Supply</option>
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

          {/* Inventory Planning Parameters (Lead Time, Buffer, Threshold) */}
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
