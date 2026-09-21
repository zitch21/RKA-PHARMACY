import React, { useState } from 'react';
import {
  Pill,
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  History,
  FlaskConical,
  Settings,
  Bell,
  Barcode,
  UserCheck,
  LayoutTemplate,
  HelpCircle,
  LogOut,
  Lock
} from 'lucide-react';
import AlertNotificationDropdown from './AlertNotificationDropdown';

export default function Navbar({
  activeTab,
  setActiveTab,
  alerts,
  onQuickBarcodeScan,
  uiMode = 'minimalist',
  onToggleUiMode,
  onOpenHelp,
  onOpenExit,
  isSystemLoaded = true,
  currentUser,
  onLogout,
  onAcknowledgeAlert
}) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Medicines & Batches', icon: Boxes },
    { id: 'stock-in', label: 'Stock-In (Intake)', icon: ArrowDownToLine },
    { id: 'stock-out', label: 'Dispense (FEFO)', icon: ArrowUpFromLine },
    { id: 'fefo-plus', label: 'FEFO+ Risk & Reorder', icon: TrendingUp },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'simulation', label: 'Policy Simulation', icon: FlaskConical },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const totalAlerts = alerts?.summary?.total_alerts || 0;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm no-print">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            R.K.A PHARMACY SYSTEM
          </span>
          <span className="hidden sm:inline text-slate-400">•</span>
          <span className="hidden sm:inline text-slate-400">San Antonio, Agoo, La Union</span>
          <span className="hidden md:inline text-slate-400">•</span>
          <span className="hidden md:inline text-slate-400">Clinic Inventory & Expiration Management</span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isSystemLoaded
              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
              : 'bg-amber-950/90 text-amber-300 border border-amber-500/50'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isSystemLoaded ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>{isSystemLoaded ? 'DB Online • FEFO+ Active' : 'Connecting DB...'}</span>
          </span>

          <div className="hidden sm:flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded">
            <UserCheck className="w-3 h-3 text-emerald-400" />
            <span>Operator: <strong>{currentUser?.full_name || 'Lourdes Gincen L. Cesista'}</strong> ({currentUser?.role || 'Owner'})</span>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo and System Title */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">R.K.A PHARMACY</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                FEFO+ Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 -mt-0.5">
              Clinic Pharmacy Supplies with Automated Stock Alert & Expiration Tracking
            </p>
          </div>
        </div>

        {/* Action Controls (Help Guide, UI Mode Switch, Quick Barcode & Alert Bell) */}
        <div className="flex items-center gap-2 relative">
          {/* How to Use / Emergency Guide Button */}
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300 transition shadow-xs"
            title="Open Emergency Operating Guide for beginners"
          >
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            <span>How to Use</span>
          </button>

          {/* Quick UI Mode Toggle Button */}
          <button
            onClick={() => onToggleUiMode && onToggleUiMode()}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-xs ${
              uiMode === 'minimalist'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100'
            }`}
            title="Toggle between Clean/Minimalist and Maximalist display modes"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {uiMode === 'minimalist' ? '🌿 Clean' : '🔬 Maximalist'}
            </span>
          </button>

          <button
            onClick={onQuickBarcodeScan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition shadow-xs"
            title="Scan physical barcode or search item (F2)"
          >
            <Barcode className="w-4 h-4 text-emerald-600" />
            <span className="hidden lg:inline">Quick Scan</span>
            <kbd className="hidden lg:inline bg-white px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 text-slate-500">
              F2
            </kbd>
          </button>

          {/* Alert Bell */}
          <div className="relative">
            <button
              onClick={() => setIsAlertOpen(!isAlertOpen)}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="View stock & expiry alerts"
            >
              <Bell className="w-5 h-5" />
              {totalAlerts > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                  {totalAlerts > 9 ? '9+' : totalAlerts}
                </span>
              )}
            </button>

            <AlertNotificationDropdown
              alerts={alerts}
              isOpen={isAlertOpen}
              onClose={() => setIsAlertOpen(false)}
              onNavigate={setActiveTab}
              onAcknowledgeAlert={onAcknowledgeAlert}
            />
          </div>

          {/* Operator Sign Out / Lock Session Button */}
          {currentUser && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition shadow-xs"
              title="Lock workstation / Sign out operator session"
            >
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Lock / Sign Out</span>
            </button>
          )}

          {/* Exit System Button */}
          <button
            type="button"
            onClick={onOpenExit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition shadow-xs ml-1"
            title="Exit R.K.A Pharmacy IMS"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="px-4 sm:px-6 flex gap-1 overflow-x-auto border-t border-slate-100 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                isActive
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.id === 'fefo-plus' && (
                <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1 rounded">
                  NEW
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
