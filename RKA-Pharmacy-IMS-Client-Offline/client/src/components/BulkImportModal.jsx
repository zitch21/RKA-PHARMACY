import React, { useState, useEffect } from 'react';
import { Upload, X, FileSpreadsheet, Sparkles, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PHILIPPINE_MEDICINE_PRESETS } from '../data/philippineMedicinePresets';

export default function BulkImportModal({ isOpen, onClose, onImportComplete }) {
  const { t } = useLanguage();
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target?.result || '');
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const sampleHeaders = 'brand_name,generic_name,dosage_strength,dosage_form,category,unit_of_measure,barcode,supplier_name,reorder_threshold\n';
    const sampleRows = [
      'Biogesic,Paracetamol,500mg,Tablet,Analgesic / Antipyretic,Tablet,4807788561688,United Laboratories (Unilab),100',
      'Neozep Forte,Phenylephrine HCl + Chlorphenamine Maleate + Paracetamol,10mg/2mg/500mg,Tablet,Antihistamine / Decongestant,Tablet,4807788559593,United Laboratories (Unilab),80',
      'Amoxil 500mg,Amoxicillin (as Trihydrate),500mg,Capsule,Antibacterial / Antibiotic,Capsule,,GlaxoSmithKline Philippines,60',
      'RiteMed Losartan 50mg,Losartan Potassium,50mg,Tablet,Cardiovascular / Antihypertensive,Tablet,,RiteMed Philippines Inc.,100'
    ].join('\n');
    const blob = new Blob([sampleHeaders + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rka_pharmacy_catalog_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCsvToObjects = (text) => {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s"-]/g, '_'));
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      // Split by comma ignoring commas inside quotes
      const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      if (row.length === 0 || !row[0]) continue;

      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] || '';
      });

      if (obj.brand_name && obj.generic_name) {
        items.push({
          brand_name: obj.brand_name,
          generic_name: obj.generic_name,
          dosage_strength: obj.dosage_strength || '500mg',
          dosage_form: obj.dosage_form || 'Tablet',
          category: obj.category || 'Medicine',
          unit_of_measure: obj.unit_of_measure || 'Piece',
          barcode: obj.barcode || '',
          supplier_name: obj.supplier_name || 'Generic Supplier',
          reorder_threshold: (!isNaN(parseInt(obj.reorder_threshold, 10)) && parseInt(obj.reorder_threshold, 10) >= 0) ? parseInt(obj.reorder_threshold, 10) : 20,
          description: obj.description || ''
        });
      }
    }
    return items;
  };

  const handleImportCsv = async () => {
    if (loading) return;
    setError(null);
    setSuccessResult(null);

    const items = parseCsvToObjects(csvText);
    if (items.length === 0) {
      setError(t('err_no_valid_csv_rows', 'No valid medicine rows detected. Ensure Brand Name and Generic Name columns are present.'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/medicines/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, operator_name: 'Lourdes Gincen L. Cesista' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import catalog');

      setSuccessResult(data);
      if (onImportComplete) onImportComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportPresets = async () => {
    if (loading) return;
    if (!window.confirm(`Import all ${PHILIPPINE_MEDICINE_PRESETS.length} standard Philippine pharmacy medications (Biogesic, Neozep, Amoxicillin, Losartan, etc.) into your catalog?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessResult(null);

    try {
      const res = await fetch('/api/medicines/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: PHILIPPINE_MEDICINE_PRESETS, operator_name: 'Lourdes Gincen L. Cesista' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import preset catalog');

      setSuccessResult(data);
      if (onImportComplete) onImportComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 overflow-y-auto select-none animate-in fade-in"
    >
      <div className="bg-white dark:bg-[#181d26] rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200/90 dark:border-white/10 my-8">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50/90 dark:bg-[#1e2430] border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                {t('bulk_import_title', 'Bulk Medicine Catalog Importer')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('bulk_import_sub', 'Import standard Philippine formularies or upload an Excel / CSV supplier invoice')}
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

        <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successResult && (
            <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-2xl text-teal-900 dark:text-teal-100 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-teal-700 dark:text-teal-300">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span>{t('import_complete', 'Import Process Complete!')}</span>
              </div>
              <p className="text-xs">{successResult.message}</p>
            </div>
          )}

          {/* Option A: 1-Click Standard Philippine Formularies */}
          <div className="p-4 bg-gradient-to-br from-teal-50/80 to-emerald-50/60 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200/90 dark:border-teal-800/60 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-extrabold text-teal-900 dark:text-teal-100 text-sm">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>{t('quick_seed_title', '1-Click Standard Philippine Medicine Catalog')}</span>
                </div>
                <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 leading-relaxed">
                  {t('quick_presets_box_desc', 'Instantly seeds 65+ essential Philippine pharmacy medicines (Biogesic, Neozep, Bioflu, Solmux, Alaxan, Ponstan, Amoxicillin, Augmentin, Losartan, Amlodipine, Metformin, Atorvastatin, Omeprazole, Ceelin, etc.) with standardized generic names, dosages, and categories.')}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleImportPresets}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loading ? t('importing', 'Importing...') : t('btn_load_25_presets', `Load All ${PHILIPPINE_MEDICINE_PRESETS.length} Standard Philippine Medicines`)}
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t('or_custom_csv', 'Or Import Custom CSV File')}
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
          </div>

          {/* Option B: Custom CSV Upload or Paste */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {t('paste_or_upload_csv', 'Paste CSV Content or Upload File')}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  {t('download_template', 'Download Sample Template')}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 rounded-xl transition cursor-pointer inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>{t('choose_csv_file', 'Choose .CSV File')}</span>
                <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={4}
              placeholder="brand_name,generic_name,dosage_strength,dosage_form,category,unit_of_measure,barcode,supplier_name,reorder_threshold&#10;Biogesic,Paracetamol,500mg,Tablet,Analgesic,Tablet,4800016642029,Unilab,100"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-[#1a202c] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/90 dark:bg-[#1e2430] border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition cursor-pointer"
          >
            {t('btn_close', 'Close')}
          </button>
          <button
            type="button"
            disabled={loading || !csvText.trim()}
            onClick={handleImportCsv}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            {loading ? t('importing', 'Importing...') : t('btn_import_csv', 'Import CSV Catalog')}
          </button>
        </div>
      </div>
    </div>
  );
}
