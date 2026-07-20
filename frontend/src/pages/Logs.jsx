// ============================================
// Drishti Kavach — Logs Page
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { LogOut, ShieldAlert, Filter } from 'lucide-react';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filter, setFilter] = useState({ startDate: '', endDate: '' });
  const [selectedTab, setSelectedTab] = useState('login');

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get('/audit/' + selectedTab, {
        params: { ...filter, page, limit: 50 },
      });
      setLogs(response.data.logs || []);
      setPagination({
        page: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0,
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [filter, selectedTab]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatus = (log) => {
    if (log.success === false) return 'Failed';
    if (log.success === true) return 'Success';
    if (log.action?.toLowerCase().includes('error')) return 'Error';
    return '-';
  };

  // Get action display text based on tab and log type
  const getActionDisplay = (log) => {
    if (selectedTab === 'login') {
      return log.success ? '🔐 User Login' : '❌ Login Failed';
    }
    if (selectedTab === 'errors') {
      return log.error_type || log.level || 'Error';
    }
    // Security/System logs
    return log.action || 'System Event';
  };

  // Get user display based on tab
  const getUserDisplay = (log) => {
    if (selectedTab === 'login') {
      return log.email || log.user_id || 'Unknown';
    }
    if (selectedTab === 'errors') {
      return log.user_id || 'System';
    }
    // Security/System logs
    return log.changed_by || log.entity_type || 'System';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-blue-600 rounded-lg"><LogOut className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">System Logs</h1>
            <p className="text-gray-400">View login, error, and system audit logs (30-day retention)</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 mb-6 border-b border-gray-700">
        {[
          { id: 'login', label: 'Login Logs' },
          { id: 'security', label: 'Security Logs' },
          { id: 'errors', label: 'Error Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setSelectedTab(tab.id); fetchLogs(1); }}
            className={`px-4 py-2 rounded-t-lg ${
              selectedTab === tab.id
                ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Start Date</label>
          <input type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })} className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">End Date</label>
          <input type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })} className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm" />
        </div>
        <button onClick={() => fetchLogs(1)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          <Filter className="w-4 h-4 inline mr-2" /> Filter
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading logs...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <p>Error: {error}</p>
            <button onClick={() => fetchLogs()} className="mt-4 text-blue-400 hover:underline">Try Again</button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No logs found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Timestamp</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Action</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">User/IP</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Details</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {logs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">{formatDate(log.created_at || log.logged_at || log.timestamp)}</td>
                      <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">{getActionDisplay(log)}</td>
                      <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                        <div>{getUserDisplay(log)}</div>
                        {log.ip_address && <div className="text-gray-500 text-xs">{log.ip_address}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 max-w-md">
                        {selectedTab === 'login' && log.failure_reason && <div className="text-red-400">Reason: {log.failure_reason}</div>}
                        {selectedTab === 'login' && log.location && <div className="text-gray-400">Location: {typeof log.location === 'string' ? log.location : JSON.stringify(log.location)}</div>}
                        {selectedTab === 'errors' && log.error_type && <div className="font-semibold">{log.error_type}</div>}
                        {selectedTab === 'errors' && log.message && <div className="truncate">{log.message.substring(0, 100)}</div>}
                        {selectedTab === 'security' && log.old_values && <div className="text-xs">Old: {typeof log.old_values === 'string' ? log.old_values : JSON.stringify(log.old_values).substring(0, 50)}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs ${
                          getStatus(log) === 'Success' ? 'bg-green-500/20 text-green-400' :
                          getStatus(log) === 'Failed' ? 'bg-red-500/20 text-red-400' :
                          getStatus(log) === 'Error' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {getStatus(log)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">Showing {logs.length} of {pagination.total} logs</div>
              <div className="flex space-x-2">
                <button onClick={() => fetchLogs(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50 hover:bg-gray-600 text-white">Prev</button>
                <button onClick={() => fetchLogs(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50 hover:bg-gray-600 text-white">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LogsPage;