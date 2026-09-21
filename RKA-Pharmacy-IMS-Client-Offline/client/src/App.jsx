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
import HelpGuideModal from './components/HelpGuideModal';
import ExitConfirmModal from './components/ExitConfirmModal';
import LoginModal from './components/LoginModal';
import ErrorBoundary from './components/ErrorBoundary';

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

  // UI Mode: 'minimalist' (Clean) vs 'maximalist' (Full Clinical Telemetry)
  const [uiMode, setUiMode] = useState(() => {
    return localStorage.getItem('rka_ui_mode') || 'minimalist';
  });

  const handleToggleUiMode = (specificMode) => {
    setUiMode(prev => {
      const nextMode = specificMode || (prev === 'minimalist' ? 'maximalist' : 'minimalist');
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
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
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs font-semibold uppercase tracking-wider">Loading R.K.A Pharmacy Records...</span>
          </div>
        ) : (
          <ErrorBoundary key={activeTab} onNavigateHome={() => setActiveTab('dashboard')}>
            {activeTab === 'dashboard' && (
              <DashboardView
                medicines={medicines}
                batches={batches}
                alerts={alerts}
                fefoData={fefoData}
                onNavigate={setActiveTab}
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
                onNavigate={setActiveTab}
                uiMode={uiMode}
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

            {activeTab === 'stock-out' && (
              <StockOutView
                medicines={medicines}
                batches={batches}
                onRefresh={loadData}
                onNavigate={setActiveTab}
                uiMode={uiMode}
                onOpenHelp={() => setIsHelpOpen(true)}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'fefo-plus' && (
              <FefoPlusView
                fefoData={fefoData}
                onRefresh={loadData}
                onNavigate={setActiveTab}
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            <strong>R.K.A Pharmacy</strong> • San Antonio, Agoo, La Union • Owner: Lourdes Gincen L. Cesista
          </span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Mode: <strong>{uiMode === 'minimalist' ? 'Clean / Minimalist' : 'Maximalist (Full)'}</strong></span>
            <span>•</span>
            <button
              onClick={() => setIsHelpOpen(true)}
              className="text-emerald-700 hover:underline font-semibold"
            >
              Emergency Help Guide
            </button>
          </div>
        </div>
      </footer>

      {/* Add Medicine Modal */}
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
  );
}
