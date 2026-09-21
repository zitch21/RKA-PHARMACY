import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Search,
  Filter,
  ShieldAlert,
  ArrowDownToLine,
  ArrowUpFromLine,
  Trash2,
  Sliders,
  Calendar,
  UserCheck,
  Tag
} from 'lucide-react';

export default function AuditTrailView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

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

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

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
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">STOCK OUT (FEFO)</span>;
      case 'STOCK_OUT_OVERRIDE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-amber-700" /> OVERRIDE</span>;
      case 'STOCK_IN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">STOCK IN</span>;
      case 'DISPOSAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">DISPOSAL</span>;
      case 'STOCK_ADJUSTMENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">ADJUSTMENT</span>;
      case 'PRICE_ADJUSTMENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 flex items-center gap-1"><Tag className="w-3 h-3 text-purple-700" /> PRICE ADJUSTMENT</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <span>Centralized Audit Trail & Transaction Ledger</span>
            </h2>
            <span className="bg-indigo-50 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-200">
              Immutable
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Permanent record of stock additions, releases, adjustments, FEFO overrides, and disposals
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by details, batch, medicine, receipt, or operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
          >
            Search
          </button>
        </form>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700"
          >
            <option value="">All Action Types</option>
            <option value="STOCK_OUT">Stock-Out (FEFO Dispense)</option>
            <option value="STOCK_OUT_OVERRIDE">Stock-Out Overrides</option>
            <option value="STOCK_IN">Stock-In (Intake)</option>
            <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
            <option value="PRICE_ADJUSTMENT">Price Adjustments</option>
            <option value="DISPOSAL">Stock Disposals</option>
            <option value="CREATE_MEDICINE">Registered Medicines</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 px-3">Entity</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-4">Details & Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {logs.map((log) => {
                let parsedDetails = null;
                try {
                  parsedDetails = JSON.parse(log.details);
                } catch (e) {
                  parsedDetails = null;
                }

                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px] font-mono">
                      {log.timestamp}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          ID: {log.entity_id}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-medium text-xs">{log.operator}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      {parsedDetails ? (
                        <div className="space-y-1">
                          {parsedDetails.medicine && (
                            <span className="font-bold text-slate-900 mr-2">
                              {parsedDetails.medicine}
                            </span>
                          )}
                          {parsedDetails.batch_number && (
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700 mr-2">
                              Batch: {parsedDetails.batch_number}
                            </span>
                          )}
                          {parsedDetails.quantity && (
                            <span className="text-slate-600 mr-2">
                              Qty: <strong>{parsedDetails.quantity}</strong>
                            </span>
                          )}
                          {parsedDetails.receipt_no && (
                            <span className="text-[11px] text-slate-500 mr-2">
                              Ref: {parsedDetails.receipt_no}
                            </span>
                          )}
                          {parsedDetails.override_reason && (
                            <div className="text-xs font-semibold text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                              <strong>Mandatory Override Reason:</strong> {parsedDetails.override_reason}
                            </div>
                          )}
                          {parsedDetails.reason && (
                            <div className="text-xs text-red-800 bg-red-50 p-1.5 rounded mt-1">
                              <strong>Reason:</strong> {parsedDetails.reason}
                            </div>
                          )}
                          {parsedDetails.notes && (
                            <div className="text-[11px] text-slate-500 italic">
                              Note: {parsedDetails.notes}
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
                  <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
                    No audit records match the query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
          <span>Total records: <strong>{total}</strong></span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(prev => prev - 1)}
              className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <span className="px-2 py-1 font-semibold text-slate-700">Page {page}</span>
            <button
              disabled={logs.length < 50}
              onClick={() => setPage(prev => prev + 1)}
              className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
