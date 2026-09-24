import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AddMedicineModal from './components/AddMedicineModal';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import StockInView from './views/StockInView';
import StockOutView from './views/StockOutView';
import FefoPlusView from './views/FefoPlusView';
import AuditTrailView from './views/AuditTrailView';
import SimulationView from './views/SimulationView';
import SettingsView from './views/SettingsView';
import PurchaseOrdersView from './views/PurchaseOrdersView';
import HelpGuideModal from './components/HelpGuideModal';
import ExitConfirmModal from './components/ExitConfirmModal';
import LoginModal from './components/LoginModal';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [fefoData, setFefoData] = useState(null);
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inventoryFilter, setInventoryFilter] = useState('All');

  // Authenticated Operator Session (Scrypt Security)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('rka_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (user) => {
    setCurrentUser(user);
    sessionStorage.setItem('rka_user', JSON.stringify(user));
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
        // Refresh alert states and badges across the UI
        loadData();
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  // Navigation with optional parameters (e.g. { filter: 'low_stock' })
  const handleNavigate = (tab, params) => {
    if (params?.filter) {
      setInventoryFilter(params.filter);
    }
    setActiveTab(tab);
  };

  // UI Mode: 'clean' (Clean & Simple Counter Mode) vs 'maximalist' (Full Advanced Mode)
  // Persisted in localStorage under 'rka_ui_mode'
  const [uiMode, setUiMode] = useState(() => {
    const saved = localStorage.getItem('rka_ui_mode');
    if (saved === 'maximalist') return 'maximalist';
    return 'clean';
  });

  const handleToggleUiMode = (specificMode) => {
    setUiMode(prev => {
      let nextMode;
      if (specificMode) {
        nextMode = specificMode === 'maximalist' ? 'maximalist' : 'clean';
      } else {
        nextMode = prev === 'clean' ? 'maximalist' : 'clean';
      }
      localStorage.setItem('rka_ui_mode', nextMode);
      return nextMode;
    });
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

  useEffect(() => {
    loadData();

    // Accidental window close protection
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to close R.K.A Pharmacy IMS? Make sure your current actions are saved.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Hotkey listener: F2 switches to dispensing / quick scan
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('stock-out');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleQuickBarcodeScan = () => {
    setActiveTab('stock-out');
  };

  return (
    <LanguageProvider>
      <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-600 selection:text-white">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          alerts={alerts}
          onQuickBarcodeScan={handleQuickBarcodeScan}
          uiMode={uiMode}
          onToggleUiMode={handleToggleUiMode}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenExit={() => setIsExitModalOpen(true)}
          isSystemLoaded={!loading}
          currentUser={currentUser}
          onLogout={handleLogout}
          onAcknowledgeAlert={handleAcknowledgeAlert}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
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
              {activeTab === 'dashboard' && (
                <DashboardView
                  medicines={medicines}
                  batches={batches}
                  alerts={alerts}
                  fefoData={fefoData}
                  onNavigate={handleNavigate}
                  onRefresh={loadData}
                  onOpenAddMedicine={() => setIsAddMedOpen(true)}
                  uiMode={uiMode}
                  onToggleUiMode={handleToggleUiMode}
                  onOpenHelp={() => setIsHelpOpen(true)}
                  onAcknowledgeAlert={handleAcknowledgeAlert}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryView
                  medicines={medicines}
                  batches={batches}
                  onRefresh={loadData}
                  onOpenAddMedicine={() => setIsAddMedOpen(true)}
                  onNavigate={handleNavigate}
                  uiMode={uiMode}
                  initialFilter={inventoryFilter}
                />
              )}

              {activeTab === 'stock-in' && (
                <StockInView
                  medicines={medicines}
                  batches={batches}
                  onRefresh={loadData}
                  onOpenAddMedicine={() => setIsAddMedOpen(true)}
                  uiMode={uiMode}
                />
              )}

              {activeTab === 'purchase-orders' && (
                <PurchaseOrdersView
                  medicines={medicines}
                  currentUser={currentUser}
                  onRefreshInventory={loadData}
                  uiMode={uiMode}
                />
              )}

              {activeTab === 'stock-out' && (
                <StockOutView
                  medicines={medicines}
                  batches={batches}
                  onRefresh={loadData}
                  onOpenAddMedicine={() => setIsAddMedOpen(true)}
                  onOpenHelp={() => setIsHelpOpen(true)}
                  uiMode={uiMode}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'fefo-plus' && (
                <FefoPlusView
                  fefoData={fefoData}
                  onRefresh={loadData}
                  onNavigate={handleNavigate}
                  uiMode={uiMode}
                />
              )}

              {activeTab === 'audit' && (
                <AuditTrailView uiMode={uiMode} />
              )}

              {activeTab === 'simulation' && (
                <SimulationView uiMode={uiMode} />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  onRefresh={loadData}
                  uiMode={uiMode}
                  onToggleUiMode={handleToggleUiMode}
                  onOpenHelp={() => setIsHelpOpen(true)}
                  currentUser={currentUser}
                />
              )}
            </ErrorBoundary>
          )}
        </main>

        {/* Global Modals */}
        <AddMedicineModal
          isOpen={isAddMedOpen}
          onClose={() => setIsAddMedOpen(false)}
          onMedicineAdded={loadData}
        />

        {/* Emergency Quick Help Guide Modal */}
        <HelpGuideModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setIsHelpOpen(false);
          }}
        />

        {/* Exit Confirmation Modal */}
        <ExitConfirmModal
          isOpen={isExitModalOpen}
          onClose={() => setIsExitModalOpen(false)}
        />

        {/* Scrypt Authentication / Station Lock Modal */}
        {!currentUser && (
          <LoginModal onLogin={handleLogin} />
        )}
      </div>
    </LanguageProvider>
  );
}
