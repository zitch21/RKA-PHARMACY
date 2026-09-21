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
  DollarSign
} from 'lucide-react';

export default function HelpGuideModal({ isOpen, onClose, onNavigate }) {
  const [guideVersion, setGuideVersion] = useState('v1'); // 'v1' (Counter Quick Guide) | 'v2' (Advanced System Guide)
  const [activeTopic, setActiveTopic] = useState('dispense');

  if (!isOpen) return null;

  // Version 1: Counter & Emergency Quick Guide
  const v1Topics = [
    { id: 'dispense', num: '1', title: 'Sell / Dispense', sub: '5 Easy Steps', icon: ShoppingCart, color: 'emerald' },
    { id: 'expired', num: '2', title: 'Expired Medicine', sub: 'Safety Block', icon: ShieldAlert, color: 'red' },
    { id: 'stockin', num: '3', title: 'Receive Deliveries', sub: 'Stock-In Intake', icon: ArrowDownToLine, color: 'blue' },
    { id: 'alerts', num: '4', title: 'Warning Colors', sub: 'Status Meanings', icon: AlertTriangle, color: 'amber' },
    { id: 'contacts', num: '5', title: 'Clinic Contacts', sub: 'Emergency Info', icon: Phone, color: 'purple' },
  ];

  // Version 2: Advanced System & Research Guide
  const v2Topics = [
    { id: 'fefo_intelligence', num: '1', title: 'FEFO+ Intelligence', sub: 'Risk Margin & Velocity', icon: TrendingUp, color: 'emerald' },
    { id: 'audit_trail', num: '2', title: 'Audit Trail', sub: 'Overrides & Ledger', icon: History, color: 'indigo' },
    { id: 'simulation', num: '3', title: 'Policy Simulation', sub: 'FIFO vs FEFO vs FEFO+', icon: FlaskConical, color: 'purple' },
    { id: 'settings_guide', num: '4', title: 'Settings Guide', sub: 'Tiers & Default Config', icon: Settings, color: 'blue' },
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
                <h2 className="text-lg font-bold tracking-tight">R.K.A Pharmacy IMS Help & User Manual</h2>
                <span className="bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">
                  {guideVersion === 'v1' ? 'Quick Counter V1' : 'Advanced System V2'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {guideVersion === 'v1'
                  ? 'Simple step-by-step operating instructions for emergency staff or counter handovers'
                  : 'Comprehensive reference for FEFO+ mathematical algorithms, audit compliance, and policy simulations'}
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
                Version 1 (Counter)
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
                Version 2 (Advanced)
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
          guideVersion === 'v1' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'
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
                      <span>How to Sell / Dispense Medicine to a Customer (5 Easy Steps)</span>
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1">
                      You do not need to memorize medical rules. The computer automatically picks the safest medicine box that expires first (FEFO rule). Prices are fixed from batch records and cannot be accidentally modified during checkout.
                    </p>
                  </div>

                  <ol className="space-y-3">
                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                      <div>
                        <strong className="text-xs text-slate-900">Open Dispensing:</strong>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Click the <strong>"Dispense (FEFO)"</strong> tab at the top, or press the <strong>F2 key</strong> on the keyboard.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                      <div>
                        <strong className="text-xs text-slate-900">Scan or Search the Item:</strong>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Aim the handheld barcode scanner at the product barcode, or select the medicine from the dropdown list.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                      <div>
                        <strong className="text-xs text-slate-900">System Auto-Selects the Safest Batch:</strong>
                        <p className="text-xs text-slate-600 mt-0.5">
                          The system pre-selects the earliest unexpired batch in <span className="font-bold text-emerald-700 bg-emerald-100 px-1 rounded">green</span> with its verified selling price locked.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                      <div>
                        <strong className="text-xs text-slate-900">Type Quantity & Add:</strong>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Enter the requested quantity and click <strong>"Add to Dispensing Slip"</strong>.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">5</span>
                      <div>
                        <strong className="text-xs text-slate-900">Complete & Hand to Patient:</strong>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Click <strong>"Complete Dispense & Print Receipt"</strong> to finalize the sale and print the slip.
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
                      <span>Go to Dispensing Screen Now</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Topic 2: Expired Items */}
              {activeTopic === 'expired' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <h3 className="font-bold text-sm text-red-900 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                      <span>CRITICAL SAFETY RULE: What To Do If an Item is Expired</span>
                    </h3>
                    <p className="text-xs text-red-800 mt-1">
                      Expired medicine is strictly blocked by the system to safeguard patient health.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">1. System Lockout:</h4>
                      <p className="text-slate-600">
                        Batches with 0 or negative days remaining are tagged <span className="font-bold text-red-700 bg-red-100 px-1 py-0.5 rounded">Blocked (Expired)</span> and cannot be added to the cart.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">2. Physical Action:</h4>
                      <p className="text-slate-600">
                        Remove the box from the retail shelf immediately and place it in the designated <strong>Quarantine / Disposal Bin</strong>.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">3. Safe Disposal Record:</h4>
                      <p className="text-slate-600">
                        In <strong>"Medicines & Batches"</strong>, click the trash icon next to the expired batch to log safe disposal with an audit note.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic 3: Stock-In */}
              {activeTopic === 'stockin' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                      <ArrowDownToLine className="w-5 h-5 text-blue-600 shrink-0" />
                      <span>How to Receive Deliveries (Stock-In Intake)</span>
                    </h3>
                    <p className="text-xs text-blue-800 mt-1">
                      Whenever new inventory arrives from suppliers (e.g. Unilab), record the batch number, expiration date, cost, and selling price.
                    </p>
                  </div>

                  <ol className="space-y-3 text-xs">
                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                      <div>
                        <strong className="text-slate-900">Select Medicine & Enter Batch:</strong>
                        <p className="text-slate-600 mt-0.5">Scan barcode or pick the medicine from catalog. Type the batch/lot number printed on the carton.</p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                      <div>
                        <strong className="text-slate-900">Pricing Source (New Feature):</strong>
                        <p className="text-slate-600 mt-0.5">
                          Use the <strong>"Pricing"</strong> dropdown to either copy the cost and selling price from a previous delivery, or enter custom pricing. Cost and price must be greater than ₱0.00.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                      <div>
                        <strong className="text-slate-900">Save & Print Barcode:</strong>
                        <p className="text-slate-600 mt-0.5">Click <strong>"Record Batch Stock-In"</strong>. If repacking, click <strong>"Print Label"</strong> to generate a Code128 shelf sticker.</p>
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {/* Topic 4: Alerts */}
              {activeTopic === 'alerts' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>Understanding Warning Colors & Countdown Badges</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="font-bold text-emerald-900">Safe Tier (&gt; 180 Days)</span>
                      <p className="text-slate-600 mt-1">Sufficient shelf life. Full stock safe for dispensing.</p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <span className="font-bold text-blue-900">Monitor Tier (91–180 Days)</span>
                      <p className="text-slate-600 mt-1">Moderate shelf life. Monitor sales velocity.</p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <span className="font-bold text-amber-900">Warning Tier (31–90 Days)</span>
                      <p className="text-slate-600 mt-1">Approaching expiration. Prioritize dispensing.</p>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                      <span className="font-bold text-rose-900">Critical Tier (1–30 Days)</span>
                      <p className="text-slate-600 mt-1">Urgent action required. Halt incoming orders.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic 5: Contacts */}
              {activeTopic === 'contacts' && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <h3 className="font-bold text-sm text-purple-900 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-purple-600 shrink-0" />
                      <span>Clinic Administration & Support Contacts</span>
                    </h3>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div><strong>Pharmacy:</strong> R.K.A Pharmacy</div>
                    <div><strong>Location:</strong> San Antonio, Agoo, La Union</div>
                    <div><strong>Proprietor:</strong> Lourdes Gincen L. Cesista</div>
                    <div><strong>Lead Researcher:</strong> Hadriane Jerwin G. Estepa</div>
                    <div><strong>Institution:</strong> DMMMSU South La Union Campus, College of Computer Science</div>
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
                      Traditional FEFO only considers the expiration date. FEFO+ combines remaining shelf life with actual clinical sales velocity to predict waste before it happens.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <h4 className="font-bold text-slate-900 mb-1">1. Expiry Risk Margin (ERM) Formula</h4>
                      <p className="text-slate-600 mb-2">
                        The Expiry Risk Margin determines whether current stock will sell out before expiration:
                      </p>
                      <div className="bg-white p-3 rounded-lg border border-slate-300 font-mono text-[11px] text-slate-800 space-y-1">
                        <div>Days to Expiry (DTE) = Batch Expiration Date - Current Date</div>
                        <div>Days to Consume (DTC) = Current Batch Stock / Average Daily Quantity Sold (ADQS)</div>
                        <div className="font-bold text-emerald-800 pt-1 border-t border-slate-200">
                          Expiry Risk Margin (ERM) = DTE - DTC
                        </div>
                      </div>
                      <div className="mt-2 text-slate-600">
                        • <strong>ERM &gt; 0 (Safe Margin):</strong> Medicine is expected to completely sell out before expiring.<br />
                        • <strong>ERM &lt; 0 (High Waste Risk):</strong> Sales speed is too slow; some units will expire on the shelf unless proactive action is taken.
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <h4 className="font-bold text-slate-900 mb-1">2. Dynamic Suggested Reorder Level</h4>
                      <p className="text-slate-600 mb-2">
                        Instead of arbitrary manual thresholds, the engine computes optimal restock points based on supplier delivery time and safety buffers:
                      </p>
                      <div className="bg-white p-3 rounded-lg border border-slate-300 font-mono text-[11px] text-purple-900 font-bold">
                        Suggested Reorder Level = ADQS × (Supplier Lead Time + Safety Buffer Days)
                      </div>
                      <p className="text-slate-500 mt-2">
                        The suggested level appears side-by-side with the owner's manual threshold in the FEFO+ tab with a 1-click synchronization button.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic V2-2: Audit Trail */}
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
                        Selling prices can no longer be edited during counter checkout. Price revisions are strictly managed via <strong>"Medicines & Batches"</strong>, where every cost and selling price adjustment is logged with old values, new values, and operator reason.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">Audit Ledger CSV Export:</h4>
                      <p className="text-slate-600">
                        In the <strong>"Audit Trail"</strong> view, click <strong>"Export CSV Report"</strong> to generate a timestamped audit spreadsheet for clinic accounting or FDA inspection.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic V2-3: Policy Simulation */}
              {activeTopic === 'simulation' && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <h3 className="font-bold text-sm text-purple-900 flex items-center gap-2">
                      <FlaskConical className="w-5 h-5 text-purple-600 shrink-0" />
                      <span>Policy Simulation Engine (FIFO vs FEFO vs FEFO+)</span>
                    </h3>
                    <p className="text-xs text-purple-800 mt-1">
                      Scientific comparative evaluation engine demonstrating research efficacy across three inventory dispatch policies.
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

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <h4 className="font-bold text-slate-900 mb-1">Key Evaluation Metrics:</h4>
                      <p className="text-slate-600">
                        • <strong>Expired Spoilage Rate (%):</strong> Percentage of purchased stock lost to expiration.<br />
                        • <strong>Stockout Incidents:</strong> Number of times customers requested medicine when stock was 0.<br />
                        • <strong>Capital Loss (₱):</strong> Exact financial loss in Philippine Pesos from disposed expired stock.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic V2-4: Settings Guide */}
              {activeTopic === 'settings_guide' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-600 shrink-0" />
                      <span>System Configuration, Parameters & Default Settings</span>
                    </h3>
                    <p className="text-xs text-blue-800 mt-1">
                      Guide to all configurable countdown tiers, algorithm parameters, clinic identity, and factory restoration.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">Default Configuration Parameters:</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px] text-slate-700">
                        <div>Safe Threshold: &gt; 180 days</div>
                        <div>Monitor Threshold: 91–180 days</div>
                        <div>Warning Threshold: 31–90 days</div>
                        <div>Critical Threshold: 1–30 days</div>
                        <div>Safety Buffer: 3 days</div>
                        <div>Sales History: 30 days</div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">"Default Settings" Button:</h4>
                      <p className="text-slate-600">
                        Located in the Settings view. Restores all expiration risk thresholds and algorithm buffers to their verified research defaults. If settings are already default, the system displays a notice: <em>"Already in default settings"</em>.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">Clinic Profile Settings:</h4>
                      <p className="text-slate-600">
                        Allows setting the Pharmacy Name (R.K.A Pharmacy), Clinic Location (San Antonio, Agoo, La Union), and Sole Proprietor (Lourdes Gincen L. Cesista). These automatically format all thermal receipts and printable barcode tags.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>R.K.A Pharmacy IMS • Educational & Operational Documentation</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
