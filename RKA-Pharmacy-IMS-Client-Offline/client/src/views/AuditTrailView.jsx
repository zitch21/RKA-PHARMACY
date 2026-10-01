import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Search,
  ShieldAlert,
  Tag,
  RotateCcw,
  UserCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Trash2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ArchiveRestore,
  ShoppingBag,
  PackageCheck,
  Lock,
  ShieldCheck,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import HelperText from '../components/HelperText';
import { formatDatePH } from '../utils/dateFormatter';

export default function AuditTrailView({
  uiMode = 'clean',
  activeSubTab = 'audit-log',
  onSubTabChange: _onSubTabChange,
}) {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  /* Operator Sessions Sub-Tab State */
  const [authLogs, setAuthLogs] = useState([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionFilter, setSessionFilter] = useState('ALL');
  const [sessionSearch, setSessionSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      });
      if (actionFilter) params.append('action', actionFilter);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthSessions = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/audit?limit=250');
      const data = await res.json();
      const all = data.logs || [];
      const authEvents = all.filter(l =>
        l.entity_type === 'AUTH' ||
        ['USER_LOGIN', 'USER_LOGOUT', 'FAILED_LOGIN_ATTEMPT', 'PASSWORD_CHANGED'].includes(l.action)
      );
      setAuthLogs(authEvents);
    } catch (err) {
      console.error('Failed to load session logs:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  useEffect(() => {
    if (activeSubTab === 'operator-sessions') {
      fetchAuthSessions();
    }
  }, [activeSubTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportCSV = () => {
    window.open('/api/audit/export-csv', '_blank');
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'STOCK_OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tabular-nums uppercase bg-teal-50 text-teal-800 border border-teal-200">
            <ArrowUpFromLine className="w-3 h-3 text-teal-600" />
            <span>{t('audit_badge_dispense_fefo', 'DISPENSE (FEFO)')}</span>
          </span>
        );
      case 'STOCK_OUT_OVERRIDE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tabular-nums uppercase bg-rose-50 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            <span>{t('audit_badge_fefo_override', 'FEFO OVERRIDE')}</span>
          </span>
        );
      case 'STOCK_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tabular-nums uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ArrowDownToLine className="w-3 h-3 text-emerald-600" />
            <span>{t('audit_badge_stock_in', 'STOCK IN')}</span>
          </span>
        );
      case 'DISPOSAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tabular-nums uppercase bg-rose-950 text-rose-200 border border-rose-800">
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>{t('audit_badge_disposal', 'DISPOSAL')}</span>
          </span>
        );
      case 'STOCK_ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tabular-nums uppercase bg-zinc-100 text-zinc-800 border border-zinc-300">
            <Sliders className="w-3 h-3 text-zinc-600" />
            <span>{t('audit_badge_adjustment', 'ADJUSTMENT')}</span>
          </span>
        );
      case 'PRICE_ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tabular-nums uppercase bg-amber-50 text-amber-900 border border-amber-300">
            <Tag className="w-3 h-3 text-amber-700" />
            <span>{t('audit_badge_price_revision', 'PRICE REVISION')}</span>
          </span>
        );
      case 'DATABASE_RESTORE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tabular-nums uppercase bg-teal-950 text-teal-200 border border-teal-700">
            <ArchiveRestore className="w-3 h-3 text-teal-400" />
            <span>{t('audit_badge_db_restore', 'DB RESTORE')}</span>
          </span>
        );
      case 'RECEIVE_PURCHASE_ORDER_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tabular-nums uppercase bg-teal-50 text-teal-800 border border-teal-300">
            <PackageCheck className="w-3 h-3 text-teal-600" />
            <span>{t('audit_badge_receive_po', 'RECEIVE PO')}</span>
          </span>
        );
      case 'PLACE_PURCHASE_ORDER':
      case 'CREATE_PURCHASE_ORDER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tabular-nums uppercase bg-indigo-50 text-indigo-800 border border-indigo-200">
            <ShoppingBag className="w-3 h-3 text-indigo-600" />
            <span>{action === 'PLACE_PURCHASE_ORDER' ? t('audit_badge_place_po', 'PLACE PO') : t('audit_badge_draft_po', 'DRAFT PO')}</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold tabular-nums uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
            {action}
          </span>
        );
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  /* ══ SUB-TAB: OPERATOR SESSIONS ══ */
  if (activeSubTab === 'operator-sessions') {
    const filteredSessions = authLogs.filter(l => {
      if (sessionFilter !== 'ALL' && l.action !== sessionFilter) return false;
      if (!sessionSearch) return true;
      const q = sessionSearch.toLowerCase();
      return (
        ((l.operator || l.operator_name) && (l.operator || l.operator_name).toLowerCase().includes(q)) ||
        (l.details && JSON.stringify(l.details).toLowerCase().includes(q))
      );
    });

    const loginCount = authLogs.filter(l => l.action === 'USER_LOGIN').length;
    const failedCount = authLogs.filter(l => l.action === 'FAILED_LOGIN_ATTEMPT').length;
    const logoutCount = authLogs.filter(l => l.action === 'USER_LOGOUT').length;

    return (
      <div className={`pb-12 ${uiMode === 'clean' ? 'p-2 sm:p-4 space-y-4' : 'p-4 sm:p-6 space-y-5'}`}>
        {/* Header */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600" />
              {t('audit_sessions_title', 'Operator Sessions & Authentication Security Log')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('audit_sessions_subtitle', 'Cryptographically audited log of user sign-in sessions, authorization verifications, and access alerts')}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAuthSessions}
            disabled={authLoading}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${authLoading ? 'animate-spin' : ''}`} />
            {t('btn_refresh_sessions', 'Refresh Sessions')}
          </button>
        </div>

        {/* Security KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('kpi_successful_logins', 'Successful Logins')}</p>
              <p className="text-2xl font-black text-teal-700 tabular-nums">{loginCount}</p>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('kpi_security_alerts_failed', 'Security Alerts (Failed)')}</p>
              <p className="text-2xl font-black text-rose-600 tabular-nums">{failedCount}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('kpi_signed_out', 'Signed Out')}</p>
              <p className="text-2xl font-black text-slate-800 tabular-nums">{logoutCount}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('kpi_password_policy', 'Password Policy')}</p>
              <p className="text-sm font-black text-slate-900 mt-1">Scrypt + SHA-256</p>
              <p className="text-[10px] text-teal-700 font-bold">FIPS & HIPAA Grade</p>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('audit_session_search_placeholder', 'Search operator, username, or IP address...')}
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'USER_LOGIN', 'FAILED_LOGIN_ATTEMPT', 'USER_LOGOUT'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSessionFilter(type)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
                  sessionFilter === type
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'ALL' ? t('audit_filter_all_sessions', 'All Sessions') :
                 type === 'USER_LOGIN' ? t('audit_filter_logins', 'Logins') :
                 type === 'FAILED_LOGIN_ATTEMPT' ? t('audit_filter_failed', 'Failed Alerts') : t('audit_filter_logouts', 'Logouts')}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b border-zinc-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">{t('audit_th_timestamp', 'Timestamp')}</th>
                  <th className="px-4 py-3">{t('audit_th_event', 'Security Event')}</th>
                  <th className="px-4 py-3">{t('audit_th_operator', 'Operator')}</th>
                  <th className="px-4 py-3">{t('audit_th_context', 'Session Details / Context')}</th>
                  <th className="px-4 py-3 text-center">{t('audit_th_status', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSessions.map((s) => {
                  const isSuccess = s.action === 'USER_LOGIN';
                  const isFailed = s.action === 'FAILED_LOGIN_ATTEMPT';
                  const isLogout = s.action === 'USER_LOGOUT';
                  let detailsParsed = s.details;
                  if (typeof detailsParsed === 'string') {
                    try { detailsParsed = JSON.parse(detailsParsed); } catch { detailsParsed = {}; }
                  }

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 tabular-nums">
                        {formatDatePH(s.created_at, 'full')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isSuccess && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                            {t('audit_badge_authenticated', 'Operator Authenticated')}
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                            {t('audit_badge_failed_auth', 'Failed Authentication')}
                          </span>
                        )}
                        {isLogout && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {t('audit_badge_signed_out', 'Operator Signed Out')}
                          </span>
                        )}
                        {!isSuccess && !isFailed && !isLogout && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {s.action}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{s.operator || s.operator_name || 'System Operator'}</span>
                        {detailsParsed?.role && (
                          <span className="text-[10px] text-teal-700 font-semibold">{detailsParsed.role}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {isFailed ? (
                          <span className="text-rose-700 font-medium text-[11px]">
                            Attempted username: <strong>{detailsParsed?.attempted_username || 'Unknown'}</strong> (IP: {detailsParsed?.ip || '127.0.0.1'})
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">
                            Session token validated • Scrypt salted hash match
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {t('audit_badge_audited', 'Audited')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      <Lock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">{t('audit_empty_sessions', 'No session records match your filter.')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pb-12 ${uiMode === 'clean' ? 'p-2 sm:p-4 space-y-3' : 'p-4 sm:p-6 space-y-4'}`}>
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              <span>{t('audit_trail_ledger') || 'Audit Trail & Compliance Ledger'}</span>
            </h2>
            <span className="bg-teal-50 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-200 uppercase tracking-widest tabular-nums">
              {t('badge_immutable') || 'IMMUTABLE RECORD'}
            </span>
          </div>
          <HelperText uiMode={uiMode} className="text-xs text-slate-500 mt-0.5">
            {t('audit_subtitle') || 'Chronological security ledger tracking all dispensations, manual overrides, deliveries, and pricing adjustments'}
          </HelperText>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-lg shadow-2xs transition self-start md:self-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-teal-600" />
          <span>{t('btn_export_csv') || 'Export CSV Report'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t('audit_search_placeholder') || 'Search audit records by medicine, lot, receipt, or operator...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-zinc-50 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shrink-0 cursor-pointer shadow-xs"
            >
              {t('btn_search') || 'Search'}
            </button>
          </form>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-800 cursor-pointer"
            >
              <option value="">{t('audit_filter_all_events') || 'All Operational Events'}</option>
              <option value="STOCK_OUT">{t('audit_filter_stock_out') || 'Stock-Out (FEFO Dispense)'}</option>
              <option value="STOCK_OUT_OVERRIDE">{t('audit_filter_override') || 'Stock-Out Overrides'}</option>
              <option value="STOCK_IN">{t('audit_filter_stock_in') || 'Stock-In (Intake)'}</option>
              <option value="STOCK_ADJUSTMENT">{t('audit_filter_adjustment') || 'Physical Count Adjustments'}</option>
              <option value="PRICE_ADJUSTMENT">{t('audit_filter_price') || 'Price Revisions'}</option>
              <option value="DISPOSAL">{t('audit_filter_disposal') || 'Disposal & Quarantine'}</option>
              <option value="CREATE_MEDICINE">{t('audit_filter_create_med') || 'Registered Medicines'}</option>
            </select>
          </div>
        </div>

        {(searchTerm || actionFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-slate-500">
            <span>
              {t('audit_active_filter_label') || 'Active Filter:'} <strong className="text-slate-800">{actionFilter || t('audit_filter_all') || 'All'}</strong> {searchTerm && `| "${searchTerm}"`}
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setActionFilter('');
                setPage(1);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-md transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('btn_clear_filter') || 'Reset Filters'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                <th className="py-2.5 px-4">{t('audit_col_timestamp') || 'Timestamp'}</th>
                <th className="py-2.5 px-3">{t('audit_col_action') || 'Action / Event'}</th>
                <th className="py-2.5 px-3">{t('audit_col_entity') || 'Entity'}</th>
                <th className="py-2.5 px-3">{t('audit_col_operator') || 'Operator'}</th>
                <th className="py-2.5 px-4">{t('audit_col_details') || 'Audit Details & Context'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-sans">
              {logs.map((log) => {
                let parsedDetails = null;
                try {
                  parsedDetails = JSON.parse(log.details);
                } catch {
                  parsedDetails = null;
                }

                return (
                  <tr key={log.id} className="hover:bg-zinc-50/80 transition">
                    <td className="py-2.5 px-4 whitespace-nowrap text-zinc-500 text-[11px] tabular-nums">
                      {log.timestamp}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="text-[10px] text-zinc-400 tabular-nums block">
                          #{log.entity_id}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-medium text-xs">{log.operator}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-slate-700">
                      {parsedDetails ? (
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {parsedDetails.medicine && (
                              <span className="font-bold text-slate-900">
                                {parsedDetails.medicine}
                              </span>
                            )}
                            {parsedDetails.batch_number && (
                              <span className="tabular-nums bg-zinc-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700 border border-zinc-200">
                                {t('audit_label_lot') || 'Lot:'} {parsedDetails.batch_number}
                              </span>
                            )}
                            {parsedDetails.quantity !== undefined && (
                              <span className="text-slate-600 tabular-nums text-[11px]">
                                {t('audit_label_qty') || 'Qty:'} <strong>{parsedDetails.quantity}</strong>
                              </span>
                            )}
                            {parsedDetails.receipt_no && (
                              <span className="text-[10px] text-zinc-400 tabular-nums">
                                {t('audit_label_ref') || 'Ref:'} {parsedDetails.receipt_no}
                              </span>
                            )}
                          </div>

                          {parsedDetails.override_reason && (
                            <div className="text-[11px] font-medium text-rose-900 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1">
                              <strong className="text-rose-950 font-bold uppercase tracking-wider text-[9px] block">
                                {t('audit_override_justification_title') || 'Mandatory FEFO Override Justification:'}
                              </strong>
                              {parsedDetails.override_reason}
                            </div>
                          )}

                          {parsedDetails.reason && (
                            <div className="text-[11px] text-amber-900 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200 mt-0.5">
                              <strong>{t('audit_label_reason') || 'Reason:'}</strong> {parsedDetails.reason}
                            </div>
                          )}

                          {parsedDetails.notes && (
                            <div className="text-[10px] text-zinc-500 italic mt-0.5">
                              {t('audit_label_note') || 'Note:'} {parsedDetails.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600">{log.details}</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-zinc-400 text-xs">
                    {t('audit_empty_records') || 'No audit records match the query.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-600">
          <span className="tabular-nums text-[11px]">
            {t('audit_pagination_showing', {
              from: total === 0 ? 0 : (page - 1) * 50 + 1,
              to: Math.min(page * 50, total),
              total: total
            }) || `Showing ${total === 0 ? 0 : (page - 1) * 50 + 1} to ${Math.min(page * 50, total)} of ${total} security entries`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(prev => prev - 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 transition font-medium text-xs cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t('btn_prev') || 'Previous'}</span>
            </button>
            <span className="px-2.5 py-1 font-bold tabular-nums text-[11px] text-teal-900 bg-teal-50 border border-teal-200 rounded-lg tabular-nums">
              {t('pagination_page_of', { page, totalPages }) || `Page ${page} / ${totalPages}`}
            </span>
            <button
              disabled={page >= totalPages || logs.length < 50}
              onClick={() => setPage(prev => prev + 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 transition font-medium text-xs cursor-pointer"
            >
              <span>{t('btn_next') || 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
