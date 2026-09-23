import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  ShoppingCart,
  Barcode,
  AlertTriangle,
  Phone,
  BookOpen,
  Sparkles,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  TrendingUp,
  History,
  FlaskConical,
  Settings,
  ShieldCheck,
  RotateCcw,
  Sliders,
  DollarSign,
  FileText,
  PackageCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HelpGuideModal({ isOpen, onClose, onNavigate }) {
  const { t } = useLanguage();
  const [guideVersion, setGuideVersion] = useState('v1'); // 'v1' (Counter Quick Guide) | 'v2' (Advanced System Guide)
  const [activeTopic, setActiveTopic] = useState('dispense');

  if (!isOpen) return null;

  // Version 1: Counter & Emergency Quick Guide
  const v1Topics = [
    { id: 'dispense', num: '1', title: 'Sell / Dispense', sub: 'FEFO Queue & Multi-Batch', icon: ShoppingCart, color: 'emerald' },
    { id: 'purchase_orders', num: '2', title: 'Purchase Orders', sub: 'Create, Place & Receive', icon: FileText, color: 'blue' },
    { id: 'stockin', num: '3', title: 'Stock-In Intake', sub: 'Batch & Expiry Intake', icon: ArrowDownToLine, color: 'teal' },
    { id: 'expired', num: '4', title: 'Expired Medicine', sub: 'Strict Safety Lockout', icon: ShieldAlert, color: 'red' },
    { id: 'alerts', num: '5', title: 'Warning Colors', sub: 'Status Meanings', icon: AlertTriangle, color: 'amber' },
    { id: 'contacts', num: '6', title: 'Clinic Contacts', sub: 'Emergency & System Info', icon: Phone, color: 'purple' },
  ];

  // Version 2: Advanced System & Management Guide
  const v2Topics = [
    { id: 'fefo_intelligence', num: '1', title: 'FEFO+ Intelligence', sub: 'Risk Margin & Waste Prediction', icon: TrendingUp, color: 'emerald' },
    { id: 'po_lifecycle', num: '2', title: 'PO Procurement', sub: 'Replenishment & Receipts', icon: FileText, color: 'blue' },
    { id: 'audit_trail', num: '3', title: 'Audit Trail', sub: 'Overrides & Ledger', icon: History, color: 'indigo' },
    { id: 'simulation', num: '4', title: 'Policy Simulation', sub: 'FIFO vs FEFO vs FEFO+', icon: FlaskConical, color: 'purple' },
    { id: 'settings_guide', num: '5', title: 'Settings & Baseline', sub: 'Window N & Default Config', icon: Settings, color: 'slate' },
  ];

  const currentTopics = guideVersion === 'v1' ? v1Topics : v2Topics;

  const handleVersionChange = (ver) => {
    setGuideVersion(ver);
    if (ver === 'v1') {
      setActiveTopic('dispense');
    } else {
      setActiveTopic('fefo_intelligence');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">{t('modal_help_title')}</h2>
                <span className="bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">
                  {guideVersion === 'v1' ? (t('modal_help_counter_guide') || 'Quick Counter Guide') : (t('modal_help_advanced_guide') || 'Advanced Operations')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {guideVersion === 'v1'
                  ? 'Simple step-by-step operating instructions for dispensary counter workflows and emergency handovers'
                  : 'Comprehensive operational manual for FEFO+ inventory analytics, procurement lifecycles, and audit compliance'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Guide Version Switcher */}
            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleVersionChange('v1')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  guideVersion === 'v1'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('modal_help_counter_guide') || 'Quick Counter'}
              </button>
              <button
                type="button"
                onClick={() => handleVersionChange('v2')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  guideVersion === 'v2'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('modal_help_advanced_guide') || 'Advanced Operations'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Topic Selector Tabs */}
        <div className={`grid gap-2 p-3 bg-slate-100 border-b border-slate-200 ${
          guideVersion === 'v1' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
        }`}>
          {currentTopics.map((t) => {
            const Icon = t.icon;
            const isSelected = activeTopic === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTopic(t.id)}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {t.num}
                  </span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div className="font-bold text-xs leading-tight">{t.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{t.sub}</div>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-800 flex-1">
          {/* ======================= VERSION 1 TOPICS ======================= */}
          {guideVersion === 'v1' && (
            <>
              {/* Topic 1: Dispense */}
              {activeTopic === 'dispense' && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>How to Sell / Dispense Medicine (FEFO Rule & Multi-Batch Auto-Split)</span>
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1">
                      The system automatically selects the earliest unexpired batch (FEFO rule). If a customer orders more units than what is available in the earliest batch, the system automatically splits the order across the next earliest batches so you do not have to calculate split lots manually.
                    </p>
                  </div>

                  <ol className="space-y-3">
                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                      <div>
                        <strong className="text-xs text-slate-900">Open Dispense View:</strong>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Click the <strong>"Dispense"</strong> tab at the top or press the <strong>F2 key</strong>.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                      <div>
                        <strong className="text-xs text-slate-900">Scan Barcode or Search Medicine:</strong>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Scan the product barcode with the handheld scanner, or select the medicine from the dropdown list.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                      <div>
                        <strong className="text-xs text-slate-900">Automated Batch Queue & Multi-Batch Split:</strong>
                        <p className="text-xs text-slate-600 mt-0.5">
                          The earliest batch is highlighted. Enter the requested quantity. If the quantity exceeds the first lot, the system fills from the first lot and takes the remainder from the next batch automatically.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                      <div>
                        <strong className="text-xs text-slate-900">Add to Cart & Complete Sale:</strong>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Click <strong>"Add to Dispensing Slip"</strong>. When ready, click <strong>"Complete Dispense & Print Receipt"</strong> to finalize the transaction and update stock immediately.
                        </p>
                      </div>
                    </li>
                  </ol>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onNavigate('stock-out');
                        onClose();
                      }}
                      className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <ArrowUpFromLine className="w-4 h-4" />
                      <span>Go to Dispense View</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Topic 2: Purchase Orders */}
              {activeTopic === 'purchase_orders' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      <span>How to Manage Purchase Orders & Supplier Deliveries</span>
                    </h3>
                    <p className="text-xs text-blue-800 mt-1">
                      Create, track, and receive official purchase orders directly into active inventory batches.
                    </p>
                  </div>

                  <ol className="space-y-3 text-xs">
                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                      <div>
                        <strong className="text-slate-900">Review Replenishment Recommendations:</strong>
                        <p className="text-slate-600 mt-0.5">
                          Open <strong>"Purchase Orders"</strong> to view items that have fallen below their reorder points. Click <strong>"Create PO from All Suggestions"</strong> to generate a ready-to-order draft order.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                      <div>
                        <strong className="text-slate-900">Place Order with Supplier:</strong>
                        <p className="text-slate-600 mt-0.5">
                          Once confirmed, click <strong>"Place Order with Supplier"</strong>. Click <strong>"Print PO Slip"</strong> to generate an official printed procurement voucher.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                      <div>
                        <strong className="text-slate-900">Receive Delivery into Active Batches:</strong>
                        <p className="text-slate-600 mt-0.5">
                          When physical cartons arrive from the distributor, click <strong>"Receive Delivery"</strong>. Enter the batch number, expiration date, and selling price. The system automatically creates active batches and logs a stock-in audit entry.
                        </p>
                      </div>
                    </li>
                  </ol>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onNavigate('purchase-orders');
                        onClose();
                      }}
                      className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Go to Purchase Orders</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Topic 3: Stock-In */}
              {activeTopic === 'stockin' && (
                <div className="space-y-4">
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <h3 className="font-bold text-sm text-teal-900 flex items-center gap-2">
                      <ArrowDownToLine className="w-5 h-5 text-teal-600 shrink-0" />
                      <span>Direct Batch Stock-In Intake</span>
                    </h3>
                    <p className="text-xs text-teal-800 mt-1">
                      For direct supplier deliveries received outside of pre-planned purchase orders.
                    </p>
                  </div>

                  <ol className="space-y-3 text-xs">
                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                      <div>
                        <strong className="text-slate-900">Select Item & Batch Number:</strong>
                        <p className="text-slate-600 mt-0.5">Select the medicine from the list, enter the batch/lot number, manufacturing date, and expiration date.</p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                      <div>
                        <strong className="text-slate-900">Set Cost & Selling Price:</strong>
                        <p className="text-slate-600 mt-0.5">Enter the supplier wholesale unit cost and clinic retail selling price. Selling prices are locked at the counter.</p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                      <div>
                        <strong className="text-slate-900">Print Shelf Barcode:</strong>
                        <p className="text-slate-600 mt-0.5">Click <strong>"Record Batch Stock-In"</strong> and click <strong>"Print Label"</strong> if you need a Code 128 barcode sticker for repacked supplies.</p>
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {/* Topic 4: Expired Items */}
              {activeTopic === 'expired' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <h3 className="font-bold text-sm text-red-900 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                      <span>CRITICAL SAFETY: What To Do If an Item is Expired</span>
                    </h3>
                    <p className="text-xs text-red-800 mt-1">
                      Expired medicine is strictly blocked by the system to safeguard patient health.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">1. System Lockout:</h4>
                      <p className="text-slate-600">
                        Batches with 0 or negative days remaining are tagged <span className="font-bold text-red-700 bg-red-100 px-1 py-0.5 rounded">Blocked (Expired)</span> and cannot be selected or dispensed under any circumstance.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">2. Physical Quarantine:</h4>
                      <p className="text-slate-600">
                        Remove the box from the retail shelf immediately and place it in the designated <strong>Quarantine / Disposal Bin</strong>.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">3. Safe Disposal Record:</h4>
                      <p className="text-slate-600">
                        In <strong>"Inventory"</strong>, click the disposal icon next to the expired batch to log safe removal with a permanent audit note.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic 5: Alerts */}
              {activeTopic === 'alerts' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>Understanding Expiry Warning Colors & Countdown Tiers</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="font-bold text-emerald-900">Safe Tier (&gt; 180 Days)</span>
                      <p className="text-slate-600 mt-1">Sufficient shelf life. Full stock safe for standard dispensing.</p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <span className="font-bold text-blue-900">Monitor Tier (91–180 Days)</span>
                      <p className="text-slate-600 mt-1">Moderate shelf life. Monitor consumption velocity.</p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <span className="font-bold text-amber-900">Warning Tier (31–90 Days)</span>
                      <p className="text-slate-600 mt-1">Approaching expiration. Prioritize dispensing at counter.</p>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                      <span className="font-bold text-rose-900">Critical Tier (1–30 Days)</span>
                      <p className="text-slate-600 mt-1">Urgent action required. Pause restocks and accelerate clearance.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic 6: Contacts */}
              {activeTopic === 'contacts' && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <h3 className="font-bold text-sm text-purple-900 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-purple-600 shrink-0" />
                      <span>Clinic Administration & System Information</span>
                    </h3>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div><strong>Pharmacy Name:</strong> R.K.A Pharmacy</div>
                    <div><strong>Clinic Location:</strong> San Antonio, Agoo, La Union</div>
                    <div><strong>Sole Proprietor:</strong> Lourdes Gincen L. Cesista</div>
                    <div><strong>System Platform:</strong> R.K.A Pharmacy IMS (Offline-First Edition)</div>
                    <div><strong>Security:</strong> Scrypt Native Hashing & SQLite WAL Engine</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ======================= VERSION 2 TOPICS ======================= */}
          {guideVersion === 'v2' && (
            <>
              {/* Topic V2-1: FEFO+ Intelligence */}
              {activeTopic === 'fefo_intelligence' && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Enhanced First-Expiry-First-Out (FEFO+) Intelligence</span>
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1">
                      Traditional FEFO only considers the expiration date. FEFO+ combines remaining shelf life with actual consumption velocity to predict inventory waste before it occurs.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <h4 className="font-bold text-slate-900 mb-1">1. Expiry Risk Margin Formula</h4>
                      <p className="text-slate-600 mb-2">
                        The Expiry Risk Margin determines whether current stock will sell out before expiration:
                      </p>
                      <div className="bg-white p-3 rounded-lg border border-slate-300 font-mono text-[11px] text-slate-800 space-y-1">
                        <div>Days to Expiry = Batch Expiration Date − Current Date</div>
                        <div>Days to Depletion = Current Batch Stock ÷ Average Daily Demand</div>
                        <div className="font-bold text-emerald-800 pt-1 border-t border-slate-200">
                          Expiry Risk Margin = Days to Expiry − Days to Depletion
                        </div>
                      </div>
                      <div className="mt-2 text-slate-600">
                        • <strong>Margin &gt; 0 (Safe Margin):</strong> Stock is predicted to completely sell out before expiring.<br />
                        • <strong>Margin &lt; 0 (High Waste Risk):</strong> Sales speed is too slow; some units will expire unless prioritized.
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <h4 className="font-bold text-slate-900 mb-1">2. Predicted Expired Waste Volume</h4>
                      <p className="text-slate-600 mb-2">
                        For at-risk batches, the system computes the exact predicted number of spoiled units:
                      </p>
                      <div className="bg-white p-3 rounded-lg border border-slate-300 font-mono text-[11px] text-rose-900 font-bold">
                        Predicted Waste = Batch Stock − (Daily Demand × Days to Expiry)
                      </div>
                      <p className="text-slate-500 mt-2">
                        This metric enables proactive counter clearance or wholesale returns before financial loss occurs.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <h4 className="font-bold text-slate-900 mb-1">3. Dynamic Suggested Reorder Level</h4>
                      <p className="text-slate-600 mb-2">
                        The engine computes optimal restock points based on supplier delivery lead times and safety buffers:
                      </p>
                      <div className="bg-white p-3 rounded-lg border border-slate-300 font-mono text-[11px] text-purple-900 font-bold">
                        Suggested Reorder Level = Daily Demand × (Supplier Lead Time + Safety Buffer Days)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic V2-2: PO Lifecycle */}
              {activeTopic === 'po_lifecycle' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      <span>Purchase Order Lifecycle & Procurement Architecture</span>
                    </h3>
                    <p className="text-xs text-blue-800 mt-1">
                      Complete end-to-end purchasing workflow from replenishment recommendation to delivery intake into active inventory batches.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">1. Status Progression:</h4>
                      <p className="text-slate-600">
                        • <strong>Draft:</strong> Order created and editable. Can be reviewed, modified, or deleted.<br />
                        • <strong>Placed:</strong> Order sent to distributor. Cannot be deleted without cancellation.<br />
                        • <strong>Partially Received:</strong> Some items received into batches; outstanding balance remains.<br />
                        • <strong>Received:</strong> All ordered units delivered and converted to active inventory batches.<br />
                        • <strong>Cancelled:</strong> Outstanding balance closed with a mandatory audit reason.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">2. Automatic Batch Intake:</h4>
                      <p className="text-slate-600">
                        Receiving deliveries on a purchase order automatically creates physical records in <code>batches</code> and generates <code>stock_in</code> transaction records linked directly to the purchase order reference number.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">3. Printable Vouchers:</h4>
                      <p className="text-slate-600">
                        Click <strong>"Print PO Slip"</strong> on any purchase order to generate a clean, official procurement voucher complete with item specifications, quantities, costs, and signature spaces.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic V2-3: Audit Trail */}
              {activeTopic === 'audit_trail' && (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <h3 className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-600 shrink-0" />
                      <span>Immutable Audit Trail & Compliance Governance</span>
                    </h3>
                    <p className="text-xs text-indigo-800 mt-1">
                      Full accountability and non-repudiation for single-operator clinics. Every stock movement, price modification, and override is permanently logged.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">Mandatory Override Protocol:</h4>
                      <p className="text-slate-600">
                        If an operator chooses to dispense a batch other than the earliest expiring one, the system forces entering a clinical justification. The event is recorded as an <code>OVERRIDE</code> action in the audit ledger with operator name, batch IDs, and justification text.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">Batch Pricing Revisions:</h4>
                      <p className="text-slate-600">
                        Selling prices can no longer be edited during counter checkout. Price revisions are strictly managed via <strong>"Inventory"</strong>, where every cost and selling price adjustment is logged with old values, new values, and operator reason.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">Audit Ledger CSV Export:</h4>
                      <p className="text-slate-600">
                        In the <strong>"Audit Trail"</strong> view, click <strong>"Export CSV Report"</strong> to generate a timestamped audit spreadsheet for clinic accounting or regulatory review.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic V2-4: Policy Simulation */}
              {activeTopic === 'simulation' && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <h3 className="font-bold text-sm text-purple-900 flex items-center gap-2">
                      <FlaskConical className="w-5 h-5 text-purple-600 shrink-0" />
                      <span>Policy Simulation Engine (FIFO vs FEFO vs FEFO+)</span>
                    </h3>
                    <p className="text-xs text-purple-800 mt-1">
                      Comparative evaluation engine demonstrating operational efficacy across three inventory dispatch policies.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="font-bold text-slate-800">1. FIFO (First-In, First-Out)</span>
                        <p className="text-slate-600 mt-1">Dispenses by delivery date. Frequently results in severe spoilage if newer shipments have shorter expiration dates.</p>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <span className="font-bold text-blue-900">2. Standard FEFO</span>
                        <p className="text-slate-600 mt-1">Strictly releases earliest expiring batch. Reduces expired stock but remains blind to sales velocity.</p>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <span className="font-bold text-emerald-900">3. Enhanced FEFO+</span>
                        <p className="text-slate-600 mt-1">Integrates dynamic risk margins and velocity-adjusted reordering, achieving the lowest spoilage and zero preventable stockouts.</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">Key Evaluation Metrics:</h4>
                      <p className="text-slate-600">
                        • <strong>Expired Spoilage Rate (%):</strong> Percentage of purchased stock lost to expiration.<br />
                        • <strong>Stockout Incidents:</strong> Number of times customers requested medicine when stock was 0.<br />
                        • <strong>Capital Loss (₱):</strong> Financial loss in Philippine Pesos from disposed expired stock.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic V2-5: Settings Guide */}
              {activeTopic === 'settings_guide' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-slate-700 shrink-0" />
                      <span>System Configuration, Observation Window N, & Cold-Start Rule</span>
                    </h3>
                    <p className="text-xs text-slate-700 mt-1">
                      Guide to configurable observation baselines, countdown tiers, clinic identity, and database backups.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">Forecasting Baseline Window Selector:</h4>
                      <p className="text-slate-600">
                        Operators can configure the moving average observation window between <strong>10 Days</strong>, <strong>20 Days</strong>, or <strong>30 Days (Default)</strong> directly in the Settings view.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">Cold-Start Suppression Rule:</h4>
                      <p className="text-slate-600">
                        If elapsed operational history is less than the configured window N, automated predictive forecasting is gracefully suppressed. The system operates under standard FEFO dispatching and manual owner reorder thresholds until sufficient history is recorded.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">Default Configuration Parameters:</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px] text-slate-700">
                        <div>Safe Threshold: &gt; 180 days</div>
                        <div>Monitor Threshold: 91–180 days</div>
                        <div>Warning Threshold: 31–90 days</div>
                        <div>Critical Threshold: 1–30 days</div>
                        <div>Safety Buffer: 3 days</div>
                        <div>Baseline Window: 30 days (default)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>R.K.A Pharmacy IMS • Operational & Staff Documentation</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
          >
            {t('btn_cancel') || 'Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
}
