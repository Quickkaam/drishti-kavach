// ============================================
// Drishti Sentinel — Service Provisioning Admin
// Super Admin: Enable/disable client services
// ============================================

import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Save, Zap, Users, Settings, Loader, ChevronRight } from 'lucide-react';
import api from '../api/client';

export default function SentinelAdmin() {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchClients();
    fetchServices();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/sentinel/clients');
      setClients(data.clients || []);
      if (data.clients && data.clients.length > 0) {
        setSelectedClient(data.clients[0]);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/sentinel/catalog');
      setServices(data.services || {});
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  const toggleService = async (serviceId, newEnabled) => {
    if (!selectedClient) return;

    setSaving(true);
    try {
      await api.post('/sentinel/toggle', {
        website_id: selectedClient.id,
        service_id: serviceId,
        enabled: newEnabled
      });

      // Update local state
      const updatedClient = {
        ...selectedClient,
        enabled_services: newEnabled
          ? [...(selectedClient.enabled_services || []), serviceId]
          : (selectedClient.enabled_services || []).filter(id => id !== serviceId)
      };
      setSelectedClient(updatedClient);

      // Update clients list
      setClients(prev => prev.map(c => 
        c.id === selectedClient.id ? updatedClient : c
      ));
    } catch (err) {
      console.error('Failed to toggle service:', err);
      alert(err.response?.data?.error || 'Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  const applyTier = async (tier) => {
    if (!selectedClient) return;

    setSaving(true);
    try {
      await api.post('/sentinel/apply-tier', {
        website_id: selectedClient.id,
        tier
      });

      fetchClients(); // Refresh to get updated services
      alert(`Tier ${tier} applied successfully!`);
    } catch (err) {
      console.error('Failed to apply tier:', err);
      alert(err.response?.data?.error || 'Failed to apply tier');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-royal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Drishti Sentinel</h1>
          <p className="text-slate-400">Service Provisioning Control Panel</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Shield className="w-4 h-4" />
          <span>Super Admin Panel</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Client List */}
        <div className="lg:col-span-1">
          <div className="dk-card border border-slate-700/50 bg-slate-900/50 h-[calc(100vh-200px)] overflow-y-auto">
            <div className="p-4 border-b border-slate-700/50">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-royal-400" />
                Clients
              </h3>
            </div>
            <div className="divide-y divide-slate-700/50">
              {clients.map(client => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-4 cursor-pointer transition-colors ${selectedClient?.id === client.id ? 'bg-royal-900/30' : 'hover:bg-slate-800/50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{client.name}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">{client.domain}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${client.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {client.status}
                      </span>
                      {client.enabled_services && (
                        <span className="text-xs text-slate-400">
                          {client.enabled_services.length} enabled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Service Controls */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <div className="space-y-6">
              {/* Client Header */}
              <div className="dk-card border border-slate-700/50 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedClient.name}</h2>
                    <p className="text-slate-400">{selectedClient.domain}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => applyTier('starter')}
                      disabled={saving}
                      className="px-4 py-2 bg-royal-600 hover:bg-royal-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Apply Starter
                    </button>
                    <button
                      onClick={() => applyTier('pro')}
                      disabled={saving}
                      className="px-4 py-2 bg-royal-600 hover:bg-royal-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Apply Pro
                    </button>
                    <button
                      onClick={() => applyTier('enterprise')}
                      disabled={saving}
                      className="px-4 py-2 bg-royal-600 hover:bg-royal-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Apply Enterprise
                    </button>
                  </div>
                </div>
              </div>

              {/* Service Toggles */}
              {Object.entries(services).map(([category, categoryServices]) => (
                <div key={category} className="dk-card border border-slate-700/50 bg-slate-900/50">
                  <h3 className="text-lg font-bold text-white mb-4 capitalize p-4 border-b border-slate-700/50">
                    {category.replace('_', ' ')}
                  </h3>
                  <div className="divide-y divide-slate-700/50">
                    {categoryServices.map(service => {
                      const isEnabled = selectedClient.enabled_services?.includes(service.service_id);
                      return (
                        <div key={service.service_id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">{service.display_name}</p>
                              {service.is_default && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{service.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-xs text-slate-400">
                              {isEnabled ? (
                                <span className="text-green-400 flex items-center gap-1">
                                  <Check className="w-4 h-4" /> Enabled
                                </span>
                              ) : (
                                <span className="text-slate-500">Disabled</span>
                              )}
                            </div>
                            <button
                              onClick={() => toggleService(service.service_id, !isEnabled)}
                              disabled={saving}
                              className={`w-14 h-7 rounded-full transition-all relative ${isEnabled ? 'bg-green-500' : 'bg-slate-700'}`}
                            >
                              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-7 shadow-[0_0_10px_rgba(74,222,128,0.8)]' : 'translate-x-1'}`}></span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={fetchClients}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-royal-600 hover:bg-royal-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? 'Saving...' : 'Refresh Services'}
                </button>
              </div>
            </div>
          ) : (
            <div className="dk-card border border-slate-700/50 bg-slate-900/50 p-12 text-center">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Client Selected</h3>
              <p className="text-slate-400">Select a client from the left panel to manage their services</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
