// ============================================
// Drishti Kavach — Users Management Page
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'viewer' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data } = await api.get('/users');
    setUsers(data.users || []);
  };

  const createUser = async () => {
    try {
      await api.post('/users', form);
      setForm({ username: '', email: '', password: '', role: 'viewer' });
      setCreating(false);
      fetchUsers();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const toggleActive = async (id, current) => {
    await api.patch(`/users/${id}`, { is_active: !current });
    fetchUsers();
  };

  const roleColors = { admin: 'text-red-400 border-red-700/30', analyst: 'text-yellow-400 border-yellow-700/30', viewer: 'text-slate-400 border-slate-700/30', client: 'text-blue-400 border-blue-700/30' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <button onClick={() => setCreating(!creating)} className="dk-btn-primary">
          {creating ? '✕ Cancel' : '➕ Add User'}
        </button>
      </div>

      {creating && (
        <div className="dk-card max-w-lg space-y-4">
          <h3 className="font-semibold text-slate-200">Create User</h3>
          {[
            { key: 'username', placeholder: 'analyst_john', label: 'Username' },
            { key: 'email', placeholder: 'john@example.com', label: 'Email', type: 'email' },
            { key: 'password', placeholder: '••••••••', label: 'Password', type: 'password' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-slate-400 mb-1.5">{f.label}</label>
              <input type={f.type || 'text'} value={form[f.key]}
                     onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                     placeholder={f.placeholder} className="dk-input" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="dk-input">
              {['admin', 'analyst', 'viewer', 'client'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={createUser} className="dk-btn-primary">Create User</button>
        </div>
      )}

      <div className="dk-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-royal-800/30 text-left">
              {['Username', 'Email', 'Role', 'Last Login', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-royal-800/10 hover:bg-royal-800/10">
                <td className="px-3 py-2.5 font-medium text-slate-200">{u.username}</td>
                <td className="px-3 py-2.5 text-slate-400 text-xs">{u.email}</td>
                <td className="px-3 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded border ${roleColors[u.role] || ''}`}>{u.role}</span>
                </td>
                <td className="px-3 py-2.5 text-slate-500 text-xs">
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-3 py-2.5">
                  <span className={`text-xs ${u.is_active ? 'text-green-400' : 'text-red-400'}`}>
                    {u.is_active ? '✅ Active' : '🚫 Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <button onClick={() => toggleActive(u.id, u.is_active)}
                          className={`text-xs px-2 py-0.5 rounded border ${u.is_active ? 'text-red-400 border-red-700/30' : 'text-green-400 border-green-700/30'}`}>
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
