// ============================================
// Drishti Kavach — Super Admin Credentials Page
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Credentials() {
  const { user } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [status, setStatus] = useState({ loading: false, error: null, success: null });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.users || []);
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });

    try {
      await api.post('/users', form);
      setStatus({ loading: false, error: null, success: 'Credentials created successfully!' });
      setForm({ username: '', email: '', password: '', role: 'user' });
      fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatus(s => ({ ...s, success: null })), 3000);
    } catch (err) {
      setStatus({ 
        loading: false, 
        error: err.response?.data?.error || 'Failed to create credentials', 
        success: null 
      });
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('WARNING: This will permanently delete this account. Proceed?')) return;
    try {
      await api.delete(`/users/${id}/permanent`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (user?.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400 border border-red-700/30 p-6 rounded bg-red-900/10">
          <h2 className="text-xl font-bold font-orbitron mb-2">ACCESS DENIED</h2>
          <p className="text-sm">Only Super Admins can access the credentials portal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#00d4ff]/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron tracking-wider text-[#00d4ff] drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]">
            CREDENTIALS VAULT
          </h1>
          <p className="text-sm text-slate-400 mt-1">Super Admin Exclusive - Secure Account Provisioning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="dk-card bg-[#040c1a]/80 backdrop-blur border-[#00d4ff]/20 shadow-[0_0_15px_rgba(0,212,255,0.05)]">
            <h3 className="font-semibold text-[#00d4ff] mb-4 font-orbitron text-sm">PROVISION NEW ACCOUNT</h3>
            
            {status.error && (
              <div className="mb-4 p-3 rounded bg-red-900/20 border border-red-500/50 text-red-400 text-xs">
                {status.error}
              </div>
            )}
            
            {status.success && (
              <div className="mb-4 p-3 rounded bg-green-900/20 border border-green-500/50 text-green-400 text-xs">
                {status.success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="e.g. system_admin" 
                  className="w-full bg-[#020408] border border-[#00d4ff]/20 rounded p-2 text-white text-sm focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="admin@quickkaam.in" 
                  className="w-full bg-[#020408] border border-[#00d4ff]/20 rounded p-2 text-white text-sm focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••" 
                  className="w-full bg-[#020408] border border-[#00d4ff]/20 rounded p-2 text-white text-sm focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/50"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Account Role</label>
                <select 
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full bg-[#020408] border border-[#00d4ff]/20 rounded p-2 text-[#00d4ff] text-sm focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/50"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Super Admin creation must be done via direct database injection for security.</p>
              </div>

              <button 
                type="submit" 
                disabled={status.loading}
                className="w-full mt-4 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/50 font-orbitron tracking-widest text-xs py-3 rounded transition-all hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] disabled:opacity-50"
              >
                {status.loading ? 'PROVISIONING...' : 'CREATE CREDENTIALS'}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Accounts List */}
        <div className="lg:col-span-2">
          <div className="dk-card bg-[#040c1a]/80 backdrop-blur border-[#00d4ff]/20 shadow-[0_0_15px_rgba(0,212,255,0.05)] overflow-hidden">
            <h3 className="font-semibold text-[#00d4ff] mb-4 font-orbitron text-sm">ACTIVE CREDENTIALS DIRECTORY</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#00d4ff]/20 text-left bg-[#020408]/50">
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Account</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">IP Address</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">IP Information</th>
                    <th className="px-4 py-3 text-xs font-medium text-red-500/70 uppercase tracking-wider text-right">Danger Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#00d4ff]/10">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-[#00d4ff]/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{u.username}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{u.email || 'Encrypted'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] uppercase font-orbitron tracking-wider px-2 py-1 rounded border ${
                          u.role === 'superadmin' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                          u.role === 'admin' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                          'text-green-400 border-green-500/30 bg-green-500/10'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs ${u.is_active ? 'text-green-400' : 'text-slate-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-400' : 'bg-slate-500'}`}></span>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                          {u.last_ip || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-400">
                          {u.last_ip ? 'Monitored / Logged' : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== 'superadmin' && u.id !== user.id ? (
                          <button 
                            onClick={() => handlePermanentDelete(u.id)}
                            className="text-[10px] uppercase tracking-wider bg-red-900/20 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400 px-3 py-1.5 rounded transition-all"
                          >
                            PERM-DELETE
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-500 text-sm">
                        No credentials found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
