import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  History,
  FlaskConical,
  Settings,
  Bell,
  Search,
  HelpCircle,
  LogOut,
  Lock,
  FileText,
  Globe,
  Menu,
  X,
  Moon,
  Sun,
  Calendar,
  Sparkles,
  ScanBarcode,
} from 'lucide-react';
import AlertNotificationDropdown from './AlertNotificationDropdown';
import { useLanguage } from '../context/LanguageContext';
import { getIsDemoMode } from '../utils/apiInterceptor';

/* ─────────────────────────────────────────────
   R.K.A. Pharmacy Clinical Cross Logo Token
───────────────────────────────────────────── */
function PharmacyCrossLogo({ className = "w-6 h-6 shrink-0" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8.5" y="2.5" width="7" height="19" rx="3.5" fill="#059669" />
      <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" fill="#059669" />
      <path d="M6 12H9.5L10.8 9.2L13.2 14.8L14.5 12H18" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Status Badge Token (Pill)
───────────────────────────────────────────── */
function StatusBadge({ online }) {
  if (online) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider select-none border shadow-xs bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-500 animate-pulse" />
      CONNECTING • DB WAIT
    </span>
  );
}

export default function Navbar({
  activeTab,
  setActiveTab,
  activeSubTab,
  onSubTabChange,
  alerts,
  onQuickBarcodeScan,
  theme = 'light',
  onToggleTheme,
  onOpenHelp,
  onOpenExit,
  onOpenSearch,
  onOpenCalendar,
  isSystemLoaded = true,
  currentUser,
  onLogout,
  onAcknowledgeAlert,
  children,
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isDemo, setIsDemo] = useState(getIsDemoMode());
  const userMenuRef = useRef(null);
  const langRef = useRef(null);
  const alertRef = useRef(null);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleDemoChange = (e) => {
      setIsDemo(e.detail?.isDemo ?? getIsDemoMode());
    };
    window.addEventListener('rka_demo_mode_changed', handleDemoChange);
    return () => window.removeEventListener('rka_demo_mode_changed', handleDemoChange);
  }, []);

  const totalAlerts = alerts?.summary?.total_alerts || 0;
  const operatorName = currentUser?.full_name || 'Lourdes Gincen L. Cesista';

  /* ── 9 Core Clinical Navigation Tabs (R.K.A. Pharmacy Floating Pill Sidebar) ── */
  const navTabs = [
    { id: 'dashboard',       label: t('nav_dashboard',       'Dashboard'),       icon: LayoutDashboard },
    { id: 'inventory',       label: t('nav_inventory',       'Inventory'),        icon: Boxes },
    { id: 'stock-in',        label: t('nav_stock_in',        'Stock-In'),         icon: ArrowDownToLine },
    { id: 'purchase-orders', label: t('nav_purchase_orders', 'Purchase Orders'),  icon: FileText },
    { id: 'stock-out',       label: t('nav_dispense',        'POS / Dispense'),   icon: ArrowUpFromLine, isPrimary: true },
    { id: 'fefo-plus',       label: t('nav_fefo_risk',       'FEFO+ Risk'),       icon: TrendingUp,      badge: 'ACTIVE' },
    { id: 'audit',           label: t('nav_audit_trail',     'Audit Trail'),      icon: History },
    { id: 'simulation',      label: t('nav_simulation',      'Simulation'),       icon: FlaskConical },
    { id: 'settings',        label: t('nav_settings',        'Settings'),         icon: Settings },
  ];

  const currentNavTab = navTabs.find(item => item.id === activeTab) || navTabs[0];

  /* ── Sub-navigation tags for Sub-strip ── */
  const subNavMap = {
    inventory: [
      { id: 'all-sku', labelKey: 'subnav_inv_all', label: 'All SKU Catalog' },
      { id: 'low-stock', labelKey: 'subnav_inv_low', label: 'Low Stock' },
      { id: 'critical', labelKey: 'subnav_inv_critical', label: 'Critical Expiry' },
      { id: 'quarantine', labelKey: 'subnav_inv_quarantine', label: 'Quarantine / Expired' },
    ],
    'stock-in': [
      { id: 'batch-intake', labelKey: 'subnav_stockin_intake', label: 'Batch Intake' },
      { id: 'recent-intake', labelKey: 'subnav_stockin_recent', label: 'Recent Deliveries' },
      { id: 'supplier-invoices', labelKey: 'subnav_stockin_invoices', label: 'Supplier Invoices' },
    ],
    'purchase-orders': [
      { id: 'po-active', labelKey: 'subnav_po_active', label: 'Purchase Orders' },
      { id: 'po-drafts', labelKey: 'subnav_po_drafts', label: 'Draft Requests' },
      { id: 'po-history', labelKey: 'subnav_po_history', label: 'PO History' },
    ],
    'stock-out': [
      { id: 'pos-counter', labelKey: 'subnav_dispense_counter', label: 'Dispense Counter' },
      { id: 'today-sales', labelKey: 'subnav_dispense_today', label: 'Today Transactions' },
      { id: 'price-inquiry', labelKey: 'subnav_dispense_inquiry', label: 'Price Inquiry' },
    ],
    'fefo-plus': [
      { id: 'fefo-matrix', labelKey: 'subnav_fefo_matrix', label: 'FEFO+ Risk Matrix' },
      { id: 'clearance', labelKey: 'subnav_fefo_clearance', label: 'Clearance Discounts' },
      { id: 'margin-loss', labelKey: 'subnav_fefo_margin', label: 'Margin Protection' },
    ],
    audit: [
      { id: 'audit-log', labelKey: 'subnav_audit_log', label: 'Tamper-Evident Log' },
      { id: 'operator-sessions', labelKey: 'subnav_audit_sessions', label: 'Operator Sessions' },
    ],
    simulation: [
      { id: 'demand-forecast', labelKey: 'subnav_sim_forecast', label: 'Replenishment Forecast' },
      { id: 'stress-test', labelKey: 'subnav_sim_stress', label: 'Run Simulation' },
    ],
    settings: [
      { id: 'general-pref', labelKey: 'subnav_settings_pref', label: 'Preferences' },
      { id: 'security-keys', labelKey: 'subnav_settings_security', label: 'Security & Backup' },
      { id: 'branch-profile', labelKey: 'subnav_settings_branch', label: 'Branch Setup' },
    ],
  };

  const currentSubTabs = subNavMap[activeTab] || [];

  /* ── Language Options ── */
  const languages = [
    { code: 'en',      label: 'English',                  short: 'EN' },
    { code: 'fil',     label: 'Filipino (Tagalog)',        short: 'FIL' },
    { code: 'taglish', label: 'Taglish (Conversational)',  short: 'TAG' },
  ];
  const currentLang = languages.find(l => l.code === language) || languages[0];

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    function handle(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setIsLangOpen(false);
      if (alertRef.current && !alertRef.current.contains(e.target)) setIsAlertOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  /* ── Keyboard shortcut "/" or Ctrl+K for quick search ── */
  useEffect(() => {
    function handle(e) {
      if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        if (onOpenSearch) {
          onOpenSearch();
        }
      }
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onOpenSearch]);

  return (
    <div className="starline-shell w-full max-w-[1780px] h-full max-h-full bg-[#e8ebef]/90 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.07)] border border-white/80 p-3 sm:p-4 md:p-6 flex flex-col md:flex-row gap-5 overflow-hidden transition-all">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          R.K.A. PHARMACY LEFT SIDEBAR: FLOATING PILL BUTTONS
      ═══════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          starline-sidebar fixed inset-y-0 left-0 z-50 w-64 bg-[#e8ebef] p-5 flex flex-col justify-between
          transition-transform duration-200 ease-in-out select-none no-print
          md:static md:translate-x-0 md:w-56 lg:w-60 md:p-0 md:bg-transparent md:h-full md:shrink-0
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
        aria-label="R.K.A. Pharmacy Sidebar Navigation"
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="px-1 py-1 mb-5 flex items-center justify-between">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsMobileOpen(false);
              }}
              className="flex items-center gap-3 text-left group cursor-pointer"
              title={t('nav_dashboard_title', 'R.K.A. Pharmacy Dashboard')}
            >
              <PharmacyCrossLogo />
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                  R.K.A. Pharmacy
                </span>
                <span className="text-[10px] text-teal-700 font-bold tracking-wider block uppercase mt-0.5">
                  FEFO+ Dispensary IMS
                </span>
              </div>
            </button>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden text-slate-500 hover:text-slate-900 p-1 rounded-full hover:bg-white transition"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Floating Pill Navigation List */}
          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar pr-1">
            {navTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isDispense = item.id === 'stock-out';

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    starline-pill-btn w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs transition-all cursor-pointer group
                    ${
                      isActive
                        ? 'starline-pill-active bg-[#dcf363] text-slate-950 font-bold shadow-[0_2px_8px_rgba(220,243,99,0.45)] border border-[#d2ec50]'
                        : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-slate-200/50 hover:border-slate-300'
                    }
                  `}
                  title={item.label}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-slate-950' : 'text-slate-500 group-hover:text-slate-800'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1.5">
                    {isDispense && (
                      <span className="text-[9px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full tabular-nums leading-none shadow-xs">
                        F2
                      </span>
                    )}
                    {item.badge && (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60 px-1.5 py-0.5 rounded-full leading-none">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Quick Actions */}
        <div className="pt-4 mt-2 border-t border-slate-200/60 dark:border-white/10 flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenHelp}
            className="starline-pill-btn w-full flex items-center gap-3 px-4 py-2 rounded-full text-xs font-semibold bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-slate-200/40 transition cursor-pointer dark:bg-[#1a202c] dark:text-slate-300 dark:hover:bg-[#242c3d] dark:hover:text-white dark:border-white/10"
          >
            <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>{t('nav_help_guide', 'Help Guide')}</span>
          </button>

          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
              {operatorName}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white dark:hover:bg-white/10 dark:hover:text-slate-200 transition cursor-pointer"
                title={t('title_lock_station', 'Lock Station')}
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onOpenExit}
                className="p-1.5 rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                title={t('title_exit', 'Exit')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════
          R.K.A. PHARMACY MAIN WORKSPACE COLUMN (Header + Subnav + Content)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header: Navigation Controls on Left, Floating Utility Capsule on Right */}
        <header className="relative z-40 mb-3 flex items-center justify-between gap-3 shrink-0 select-none no-print">
          {/* Mobile Navigation Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-xs text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Right Floating Utility Capsule */}
          <div className="relative z-40 flex items-center gap-1.5 bg-white/90 dark:bg-[#181d26]/95 backdrop-blur-md rounded-full px-3.5 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-white/90 dark:border-white/10">
            {/* Search */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
              title={t('title_search', 'Search (/ or Ctrl+K)')}
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Quick Barcode Scanner / POS */}
            <button
              type="button"
              onClick={onQuickBarcodeScan || (() => setActiveTab('stock-out'))}
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
              title={t('title_quick_dispense', 'Quick Dispense / Barcode Scanner (F2)')}
            >
              <ScanBarcode className="w-3.5 h-3.5" />
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
              title={theme === 'dark' ? t('title_light_mode', 'Switch to Light Mode') : t('title_dark_mode', 'Switch to Dark Mode')}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#dcf363]" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={alertRef}>
              <button
                type="button"
                onClick={() => setIsAlertOpen(!isAlertOpen)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer relative"
                title={t('title_alerts', 'Alerts and notifications')}
              >
                <Bell className="w-3.5 h-3.5" />
                {totalAlerts > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white tabular-nums leading-none">
                    {totalAlerts > 9 ? '9+' : totalAlerts}
                  </span>
                )}
              </button>
              <AlertNotificationDropdown
                alerts={alerts}
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  setIsAlertOpen(false);
                }}
                onAcknowledgeAlert={onAcknowledgeAlert}
              />
            </div>

            {/* Calendar Indicator */}
            <button
              type="button"
              onClick={onOpenCalendar || (() => setActiveTab('audit'))}
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
              title={t('title_calendar', 'Dispensary Operational Calendar & Expiry Horizons')}
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>

            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="h-7 px-2 flex items-center gap-1 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer text-xs font-bold"
                title={t('title_language', 'Switch Language')}
              >
                <Globe className="w-3 h-3 text-slate-400" />
                <span className="text-[10px]">{currentLang.short}</span>
              </button>
              {isLangOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#181d26] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in">
                  <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/10">
                    {t('select_language', 'Language')}
                  </div>
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer ${
                        language === l.code ? 'font-bold text-slate-950 dark:text-white bg-slate-50 dark:bg-white/10' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{l.label}</span>
                      {language === l.code && <span className="w-1.5 h-1.5 rounded-full bg-[#dcf363]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />

            {/* Operator Avatar with Green Dot & Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserOpen(!isUserOpen)}
                className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-slate-300 dark:hover:ring-white/20 transition cursor-pointer"
                title={operatorName}
              >
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                    {(operatorName).charAt(0)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
                </div>
              </button>
              {isUserOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#181d26] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/10">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {operatorName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {currentUser?.role?.includes('Owner') ? t('role_pharmacist_owner', 'Pharmacist / Sole Proprietor') : (currentUser?.role || t('role_operator', 'Operator'))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setIsUserOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('btn_logout', 'Lock / Sign Out')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenExit();
                      setIsUserOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border-t border-slate-100 dark:border-white/10 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>{t('btn_exit', 'Exit Workstation')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* R.K.A. Sub-Navigation Pill Strip */}
        <div className="starline-subnav relative z-10 mb-4 bg-[#dce0e5]/80 dark:bg-[#1e2430]/90 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center justify-between gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-xs border border-white/60 dark:border-white/10 no-print">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className={`text-slate-900 dark:text-white font-extrabold px-2.5 py-1 whitespace-nowrap text-xs ${
              currentSubTabs.length > 0 ? 'border-r border-slate-300 dark:border-white/10 pr-3' : ''
            }`}>
              {currentNavTab.label}
            </span>
            {currentSubTabs.length === 0 && activeTab === 'dashboard' && (
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {t('nav_mission_control', 'Dispensary Mission Control')}
              </span>
            )}
            {currentSubTabs.map((sub) => {
              const isSubActive = activeSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSubTabChange?.(sub.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isSubActive
                      ? 'bg-white dark:bg-[#1e2430] text-slate-950 dark:text-white shadow-xs border border-slate-300/80 dark:border-white/10 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                >
                  {sub.labelKey ? t(sub.labelKey, sub.label) : sub.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isDemo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider select-none border border-amber-300 dark:border-amber-700/50 bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
                <span>{t('demo_mode_badge', 'DEMO MODE')}</span>
              </span>
            )}
            <StatusBadge online={isSystemLoaded} />
          </div>
        </div>

        {/* Main Content View (Children) */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 relative z-0">
          {children}
        </div>
      </div>
    </div>
  );
}
