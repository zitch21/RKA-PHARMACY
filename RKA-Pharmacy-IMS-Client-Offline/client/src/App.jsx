import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import AddMedicineModal from './components/AddMedicineModal';
import StockOutView from './views/StockOutView'; // Instant counter load for POS

// Asynchronous code-splitting for secondary views
const DashboardView = React.lazy(() => import('./views/DashboardView'));
const InventoryView = React.lazy(() => import('./views/InventoryView'));
const StockInView = React.lazy(() => import('./views/StockInView'));
const FefoPlusView = React.lazy(() => import('./views/FefoPlusView'));
const AuditTrailView = React.lazy(() => import('./views/AuditTrailView'));
const SimulationView = React.lazy(() => import('./views/SimulationView'));
const SettingsView = React.lazy(() => import('./views/SettingsView'));
const PurchaseOrdersView = React.lazy(() => import('./views/PurchaseOrdersView'));

import HelpGuideModal from './components/HelpGuideModal';
import ExitConfirmModal from './components/ExitConfirmModal';
import LoginModal from './components/LoginModal';
import GlobalSearchModal from './components/GlobalSearchModal';
import ErrorBoundary from './components/ErrorBoundary';
import DispensaryCalendarModal from './components/DispensaryCalendarModal';
import { useLanguage } from './context/LanguageContext';
import { getSyncChannel, broadcastInventoryUpdate } from './utils/syncChannel';
import { getIsDemoMode, setIsDemoMode } from './utils/apiInterceptor';

function ViewLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in">
      <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3 shadow-xs">
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading dispensary workspace...</p>
    </div>
  );
}

const DEFAULT_SUB_TABS = {
  dashboard: '',
  inventory: 'all-sku',
  'stock-in': 'batch-intake',
  'purchase-orders': 'po-active',
  'stock-out': 'pos-counter',
  'fefo-plus': 'fefo-matrix',
  audit: 'audit-log',
  simulation: 'stress-test',
  settings: 'general-pref',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  const [externalBarcode, setExternalBarcode] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [fefoData, setFefoData] = useState(null);
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [addMedBarcode, setAddMedBarcode] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleOpenAddMedicine = (barcode = '') => {
    setAddMedBarcode(typeof barcode === 'string' ? barcode : '');
    setIsAddMedOpen(true);
  };
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inventoryFilter, setInventoryFilter] = useState('All');
  const [inventorySearch, setInventorySearch] = useState('');
  const [dispenseMedId, setDispenseMedId] = useState(null);
  const [stockInMedId, setStockInMedId] = useState(null);
  const [isDemo, setIsDemo] = useState(getIsDemoMode());

  // Authenticated Operator Session (Scrypt Security)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('rka_user');
      const token = sessionStorage.getItem('rka_auth_token');
      return (saved && token) ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (user, token) => {
    setCurrentUser(user);
    sessionStorage.setItem('rka_user', JSON.stringify(user));
    if (token) {
      sessionStorage.setItem('rka_auth_token', token);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser?.username || 'admin' })
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUser(null);
    sessionStorage.removeItem('rka_user');
    sessionStorage.removeItem('rka_auth_token');
  };

  // Handle unauthorized response across views
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      sessionStorage.removeItem('rka_user');
      sessionStorage.removeItem('rka_auth_token');
    };
    window.addEventListener('rka_session_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('rka_session_unauthorized', handleUnauthorized);
  }, []);

  const handleAcknowledgeAlert = async (alertKey, alertType, entityId) => {
    try {
      const res = await fetch('/api/alerts/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_key: alertKey,
          alert_type: alertType,
          entity_id: entityId,
          operator_name: currentUser?.full_name || 'Lourdes Gincen L. Cesista'
        })
      });
      if (res.ok) {
        // Refresh alert states and badges across the UI and broadcast to other tabs
        handleRefreshAndBroadcast('ALERT_ACKNOWLEDGED', { alertKey, alertType, entityId });
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  // Navigation with optional parameters (e.g. { filter: 'low_stock', search: 'Paracetamol', medicineId: 1, subTab: 'all-sku' })
  const handleNavigate = (tab, params) => {
    if (params?.filter) {
      setInventoryFilter(params.filter);
    }
    if (params?.search !== undefined) {
      setInventorySearch(params.search);
    }
    if (params?.medicineId) {
      if (tab === 'stock-in') {
        setStockInMedId(params.medicineId);
      } else {
        setDispenseMedId(params.medicineId);
      }
    }

    let targetSubTab = params?.subTab;
    if (!targetSubTab && tab === 'inventory' && params?.filter) {
      if (params.filter === 'low_stock') targetSubTab = 'low-stock';
      else if (params.filter === 'critical') targetSubTab = 'critical';
      else if (params.filter === 'expired') targetSubTab = 'quarantine';
      else if (params.filter === 'All' || params.filter === 'all') targetSubTab = 'all-sku';
    }

    if (targetSubTab) {
      setActiveSubTab(targetSubTab);
    } else if (tab !== activeTab) {
      setActiveSubTab(DEFAULT_SUB_TABS[tab] || '');
    }
    setActiveTab(tab);
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setActiveSubTab(DEFAULT_SUB_TABS[newTab] || '');
  };

  const handleSubTabChange = (subTabId) => {
    setActiveSubTab(subTabId);
    if (activeTab === 'inventory') {
      if (subTabId === 'all-sku') setInventoryFilter('All');
      else if (subTabId === 'low-stock') setInventoryFilter('low_stock');
      else if (subTabId === 'critical') setInventoryFilter('critical');
      else if (subTabId === 'quarantine') setInventoryFilter('expired');
    }
  };

  // UI Mode: Standardized to 'clean' (Distraction-free, high-clarity counter mode)
  const [uiMode] = useState('clean');

  // Theme: 'light' vs 'dark' (R.K.A. Theme Engine)
  // Persisted in localStorage under 'rka_theme'
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('rka_theme');
      const initial = (saved === 'dark' || saved === 'light')
        ? saved
        : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      if (initial === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return initial;
    } catch {
      return 'light';
    }
  });

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    // Synchronous DOM class flip immediately on user click: 0ms visual latency
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('rka_theme', next);
    } catch {}
    setTheme(next);
  };

  // Load all central state
  const loadData = async () => {
    try {
      const [medsRes, batchesRes, alertsRes, fefoRes] = await Promise.all([
        fetch('/api/medicines'),
        fetch('/api/batches'),
        fetch('/api/alerts'),
        fetch('/api/fefo-plus/analysis')
      ]);

      const [meds, bts, alts, ff] = await Promise.all([
        medsRes.json(),
        batchesRes.json(),
        alertsRes.json(),
        fefoRes.json()
      ]);

      setMedicines(meds || []);
      setBatches(bts || []);
      setAlerts(alts || null);
      setFefoData(ff || null);
    } catch (err) {
      console.error('Error fetching inventory state:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh current tab and notify all other open workstation tabs via BroadcastChannel
  const handleRefreshAndBroadcast = (action = 'INVENTORY_MUTATION', payload = {}) => {
    loadData();
    broadcastInventoryUpdate(action, payload);
  };

  useEffect(() => {
    loadData();

    // Multi-tab synchronization listener: listen for mutations originating from other tabs
    const channel = getSyncChannel();
    let handleChannelMessage = null;
    if (channel) {
      handleChannelMessage = (event) => {
        if (event.data?.type === 'RKA_SYNC_EVENT') {
          // Re-fetch central state silently in this tab
          loadData();
        }
      };
      channel.addEventListener('message', handleChannelMessage);
    }

    // Demo mode change listener
    const handleDemoChange = (e) => {
      const active = e.detail?.isDemo ?? getIsDemoMode();
      setIsDemo(active);
      loadData();
    };
    window.addEventListener('rka_demo_mode_changed', handleDemoChange);

    // Accidental window close protection
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to close R.K.A Pharmacy IMS? Make sure your current actions are saved.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    let scanBuf = '';
    let lastScanKeyTime = Date.now();

    // Hotkey listener: F1 opens quick help guide, F2 switches to dispensing / quick scan, / or Ctrl+K opens omni search
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName?.toLowerCase();
      const inInput = tag === 'input' || tag === 'textarea' || tag === 'select';

      if (e.key === 'F1') {
        e.preventDefault();
        setIsHelpOpen(true);
        return;
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('stock-out');
        return;
      } else if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && !inInput) {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      // Omnipresent barcode scanner listener: captures hardware scanner keystrokes outside form inputs
      if (!inInput && activeTabRef.current !== 'stock-in' && activeTabRef.current !== 'stock-out') {
        const now = Date.now();
        if (now - lastScanKeyTime > 120) scanBuf = '';
        lastScanKeyTime = now;
        if (e.key === 'Enter') {
          if (scanBuf.length >= 2) {
            e.preventDefault();
            const scanned = scanBuf.trim();
            scanBuf = '';
            window.dispatchEvent(new CustomEvent('rka_barcode_scanned', { detail: { barcode: scanned } }));
            setExternalBarcode(scanned);
            setActiveTab('stock-out');
          }
        } else if (e.key?.length === 1) {
          scanBuf += e.key;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (channel && handleChannelMessage) {
        channel.removeEventListener('message', handleChannelMessage);
      }
      window.removeEventListener('rka_demo_mode_changed', handleDemoChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleQuickBarcodeScan = () => {
    setActiveTab('stock-out');
  };

  const { t } = useLanguage();

  return (
    <div className="h-screen max-h-screen overflow-hidden font-sans text-slate-800 antialiased selection:bg-[#dcf363] selection:text-slate-950 p-2 sm:p-3 md:p-4 lg:p-5 flex justify-center items-stretch">
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        activeSubTab={activeSubTab}
        onSubTabChange={handleSubTabChange}
        alerts={alerts}
        onQuickBarcodeScan={handleQuickBarcodeScan}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenExit={() => setIsExitModalOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        isSystemLoaded={!loading}
        currentUser={currentUser}
        onLogout={handleLogout}
        onAcknowledgeAlert={handleAcknowledgeAlert}
      >
        <main className="flex-1 w-full max-w-[1600px] mx-auto py-1">
        {isDemo && (
          <div className="sticky top-0 z-40 mb-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-amber-300">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-950 animate-pulse shrink-0" />
              <div className="text-xs">
                <span className="font-black uppercase tracking-wider text-slate-950">
                  {t('demo_sandbox_active', 'DEMO SANDBOX ACTIVE')}
                </span>
                <span className="text-amber-950/90 ml-2 hidden md:inline font-medium">
                  {t('demo_sandbox_desc', 'All operations are isolated in pharmacy_demo.db. Live production records remain 100% untouched.')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm(t('demo_reset_confirm', 'Reset demo database to fresh demonstration clinic records?'))) return;
                  try {
                    await fetch('/api/settings/demo-reset', { method: 'POST' });
                    loadData();
                    broadcastInventoryUpdate();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-2.5 py-1 text-[11px] font-bold bg-white/90 hover:bg-white text-slate-900 rounded-lg shadow-2xs transition cursor-pointer"
                title={t('title_reset_demo', 'Reset the demo sandbox back to fresh baseline records')}
              >
                {t('demo_reset_btn', 'Reset Demo Data')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDemoMode(false);
                  setIsDemo(false);
                  loadData();
                }}
                className="px-2.5 py-1 text-[11px] font-bold bg-slate-950 hover:bg-slate-900 text-white rounded-lg shadow-2xs transition cursor-pointer"
              >
                {t('demo_exit_btn', 'Exit Demo Mode')}
              </button>
            </div>
          </div>
        )}
          {loading ? (
            <div className="w-full space-y-4 animate-pulse" aria-busy="true" aria-label="Loading Pharmacy Records">
              <div className="h-20 bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-xs">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-slate-200 rounded-md"></div>
                  <div className="h-3 w-72 bg-slate-100 rounded-md"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-24 bg-slate-200 rounded-lg"></div>
                  <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
                  <div className="h-6 w-44 bg-slate-200 rounded-md"></div>
                  <div className="h-28 bg-slate-100 rounded-xl"></div>
                  <div className="h-16 bg-slate-50 rounded-xl"></div>
                </div>
                <div className="h-72 bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3 shadow-xs">
                  <div className="h-6 w-36 bg-slate-200 rounded-md"></div>
                  <div className="h-24 bg-slate-100 rounded-xl"></div>
                  <div className="h-24 bg-slate-100 rounded-xl"></div>
                </div>
              </div>
            </div>
          ) : (
            <ErrorBoundary key={activeTab} onNavigateHome={() => setActiveTab('dashboard')}>
              <React.Suspense fallback={<ViewLoadingFallback />}>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    medicines={medicines}
                    batches={batches}
                    alerts={alerts}
                    fefoData={fefoData}
                    onNavigate={handleNavigate}
                    onRefresh={() => handleRefreshAndBroadcast('DASHBOARD_REFRESH')}
                    onOpenAddMedicine={handleOpenAddMedicine}
                    uiMode={uiMode}
                    onOpenHelp={() => setIsHelpOpen(true)}
                    onAcknowledgeAlert={handleAcknowledgeAlert}
                  />
                )}

                {activeTab === 'inventory' && (
                  <InventoryView
                    medicines={medicines}
                    batches={batches}
                    currentUser={currentUser}
                    onRefresh={() => handleRefreshAndBroadcast('INVENTORY_MUTATION')}
                    onOpenAddMedicine={handleOpenAddMedicine}
                    onNavigate={handleNavigate}
                    uiMode={uiMode}
                    initialFilter={inventoryFilter}
                    initialSearch={inventorySearch}
                    activeSubTab={activeSubTab}
                    onSubTabChange={handleSubTabChange}
                  />
                )}

                {activeTab === 'stock-in' && (
                  <StockInView
                    medicines={medicines}
                    batches={batches}
                    onRefresh={() => handleRefreshAndBroadcast('STOCK_IN_COMPLETE')}
                    onOpenAddMedicine={handleOpenAddMedicine}
                    uiMode={uiMode}
                    activeSubTab={activeSubTab}
                    onSubTabChange={handleSubTabChange}
                    initialMedicineId={stockInMedId}
                    onNavigate={handleNavigate}
                  />
                )}

                {activeTab === 'purchase-orders' && (
                  <PurchaseOrdersView
                    medicines={medicines}
                    currentUser={currentUser}
                    onRefreshInventory={() => handleRefreshAndBroadcast('PO_MUTATION')}
                    uiMode={uiMode}
                    activeSubTab={activeSubTab}
                    onSubTabChange={handleSubTabChange}
                  />
                )}

                {activeTab === 'stock-out' && (
                  <StockOutView
                    medicines={medicines}
                    batches={batches}
                    onRefresh={() => handleRefreshAndBroadcast('STOCK_OUT_COMPLETE')}
                    onOpenAddMedicine={handleOpenAddMedicine}
                    externalBarcode={externalBarcode}
                    onClearExternalBarcode={() => setExternalBarcode(null)}
                    onOpenHelp={() => setIsHelpOpen(true)}
                    uiMode={uiMode}
                    currentUser={currentUser}
                    initialMedicineId={dispenseMedId}
                    activeSubTab={activeSubTab}
                    onSubTabChange={handleSubTabChange}
                    onNavigate={handleNavigate}
                  />
                )}

                {activeTab === 'fefo-plus' && (
                  <FefoPlusView
                    fefoData={fefoData}
                    onRefresh={() => handleRefreshAndBroadcast('FEFO_REORDER_MUTATION')}
                    onNavigate={handleNavigate}
                    uiMode={uiMode}
                    activeSubTab={activeSubTab}
                    onSubTabChange={handleSubTabChange}
                  />
                )}

                {activeTab === 'audit' && (
                  <AuditTrailView
                    uiMode={uiMode}
                    activeSubTab={activeSubTab}
                    onSubTabChange={handleSubTabChange}
                  />
                )}

                {activeTab === 'simulation' && (
                  <SimulationView
                    uiMode={uiMode}
                    activeSubTab={activeSubTab}
                    onSubTabChange={handleSubTabChange}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsView
                    onRefresh={() => handleRefreshAndBroadcast('SETTINGS_UPDATED')}
                    uiMode={uiMode}
                    onOpenHelp={() => setIsHelpOpen(true)}
                    currentUser={currentUser}
                    activeSubTab={activeSubTab}
                    onSubTabChange={handleSubTabChange}
                  />
                )}
              </React.Suspense>
            </ErrorBoundary>
          )}
        </main>
      </Navbar>

        {/* Global Modals */}
        {isSearchOpen && (
          <GlobalSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            medicines={medicines}
            batches={batches}
            onNavigate={handleNavigate}
            onOpenHelp={() => {
              setIsSearchOpen(false);
              setIsHelpOpen(true);
            }}
            onOpenAddMedicine={() => {
              setIsSearchOpen(false);
              setIsAddMedOpen(true);
            }}
            onOpenExit={() => {
              setIsSearchOpen(false);
              setIsExitModalOpen(true);
            }}
            onQuickBarcodeScan={() => {
              setIsSearchOpen(false);
              handleQuickBarcodeScan();
            }}
          />
        )}

        {isAddMedOpen && (
          <AddMedicineModal
            isOpen={isAddMedOpen}
            initialBarcode={addMedBarcode}
            onClose={() => {
              setIsAddMedOpen(false);
              setAddMedBarcode('');
            }}
            onMedicineAdded={() => handleRefreshAndBroadcast('MEDICINE_CREATED')}
          />
        )}

        {/* Emergency Quick Help Guide Modal */}
        {isHelpOpen && (
          <HelpGuideModal
            isOpen={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
            onNavigate={(tab) => {
              setActiveTab(tab);
              setIsHelpOpen(false);
            }}
          />
        )}

        {/* Exit Confirmation Modal */}
        {isExitModalOpen && (
          <ExitConfirmModal
            isOpen={isExitModalOpen}
            onClose={() => setIsExitModalOpen(false)}
            currentUser={currentUser}
          />
        )}

        {/* Dispensary Operational Calendar & Expiry Horizons Modal */}
        {isCalendarOpen && (
          <DispensaryCalendarModal
            isOpen={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
            batches={batches}
            medicines={medicines}
            onNavigate={handleNavigate}
          />
        )}

        {/* Scrypt Authentication / Station Lock Modal */}
        {!currentUser && (
          <LoginModal onLogin={handleLogin} />
        )}
      </div>
  );
}
