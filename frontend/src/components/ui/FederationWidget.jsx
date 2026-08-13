// ============================================
// Drishti Kavach — Federation Intelligence Widget
// Shows global cross-website threat status
// ============================================

import React, { useEffect, useState } from 'react';
import api from '../../api/client';

export default function FederationWidget() {
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSignatures();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchSignatures, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSignatures = async () => {
    try {
      const { data } = await api.get('/federation/signatures');
      setSignatures(data.signatures || []);
      setError(null);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Federation not available for your role.');
      } else {
        setError('Could not load federation data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const uniqueIPs = new Set(signatures.map(s => s.ip)).size;
  const recentCount = signatures.filter(s => {
    const age = Date.now() - new Date(s.created_at).getTime();
    return age < 24 * 60 * 60 * 1000; // Last 24h
  }).length;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(4, 12, 26, 0.95) 0%, rgba(10, 6, 30, 0.95) 100%)',
      border: '1px solid rgba(138, 43, 226, 0.25)',
      borderRadius: '0.5rem',
      padding: '1.25rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent glow line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #8a2be2, #00d4ff, transparent)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🌐</span>
          <h3 style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#b388ff',
            fontFamily: "'Orbitron', monospace",
            letterSpacing: '0.08em',
            margin: 0,
          }}>
            FEDERATED INTEL
          </h3>
        </div>
        <div style={{
          fontSize: '0.6rem',
          padding: '0.15rem 0.5rem',
          borderRadius: '1rem',
          background: signatures.length > 0 ? 'rgba(0, 255, 136, 0.15)' : 'rgba(138, 43, 226, 0.15)',
          color: signatures.length > 0 ? '#00ff88' : '#b388ff',
          border: `1px solid ${signatures.length > 0 ? 'rgba(0, 255, 136, 0.3)' : 'rgba(138, 43, 226, 0.3)'}`,
          fontFamily: "'Orbitron', monospace",
          fontWeight: 700,
        }}>
          {signatures.length > 0 ? 'ACTIVE' : 'IDLE'}
        </div>
      </div>

      {/* Stats Row */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#7a8290', fontSize: '0.75rem' }}>
          <span className="animate-pulse">Connecting to neural network...</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '0.75rem', color: '#7a8290', fontSize: '0.7rem' }}>{error}</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {/* Total Signatures */}
            <div style={{
              background: 'rgba(138, 43, 226, 0.1)',
              border: '1px solid rgba(138, 43, 226, 0.2)',
              borderRadius: '0.375rem',
              padding: '0.75rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#b388ff', fontFamily: "'Orbitron', monospace" }}>
                {signatures.length}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em', marginTop: '0.25rem' }}>
                SIGNATURES
              </div>
            </div>

            {/* Unique IPs */}
            <div style={{
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '0.375rem',
              padding: '0.75rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#00d4ff', fontFamily: "'Orbitron', monospace" }}>
                {uniqueIPs}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em', marginTop: '0.25rem' }}>
                BLOCKED IPs
              </div>
            </div>

            {/* Last 24h */}
            <div style={{
              background: 'rgba(255, 107, 0, 0.1)',
              border: '1px solid rgba(255, 107, 0, 0.2)',
              borderRadius: '0.375rem',
              padding: '0.75rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ff6b00', fontFamily: "'Orbitron', monospace" }}>
                {recentCount}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em', marginTop: '0.25rem' }}>
                LAST 24H
              </div>
            </div>
          </div>

          {/* Recent Signatures List */}
          {signatures.length > 0 && (
            <div>
              <div style={{
                fontSize: '0.6rem',
                color: '#7a8290',
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}>
                RECENT GLOBAL THREATS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '120px', overflowY: 'auto' }}>
                {signatures.slice(0, 5).map((sig) => (
                  <div key={sig.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '0.25rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#ff3d3d',
                        boxShadow: '0 0 6px rgba(255, 61, 61, 0.6)',
                      }} />
                      <span style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: '#e0e0e0' }}>
                        {sig.ip}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.6rem', color: '#7a8290' }}>
                      {new Date(sig.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {signatures.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '0.75rem',
              color: '#00ff88',
              fontSize: '0.7rem',
              fontFamily: "'Orbitron', monospace",
            }}>
              ✅ Network Clear — No Active Global Threats
            </div>
          )}
        </>
      )}
    </div>
  );
}
