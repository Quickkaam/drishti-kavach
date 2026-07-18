// ============================================
// Drishti Kavach — MITRE ATT&CK Matrix Page
// दृष्टि कवच — Threat Framework Visualization
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const ACCENT  = '#00d4ff';
const GOLD    = '#f5b041';
const GREEN   = '#00ff88';
const RED     = '#ff3d3d';
const ORANGE  = '#ff6b00';

const SEVERITY_CONFIG = {
  critical: { color: RED,    label: '🔴 Critical',  bg: 'rgba(255,61,61,0.15)',   border: 'rgba(255,61,61,0.4)' },
  high:     { color: ORANGE, label: '🟠 High',       bg: 'rgba(255,107,0,0.15)',  border: 'rgba(255,107,0,0.4)' },
  medium:   { color: GOLD,   label: '🟡 Medium',     bg: 'rgba(245,176,65,0.15)', border: 'rgba(245,176,65,0.4)' },
  low:      { color: GREEN,  label: '🔵 Low',        bg: 'rgba(0,255,136,0.1)',   border: 'rgba(0,255,136,0.3)' },
};

function getSeverityConfig(sev) {
  return SEVERITY_CONFIG[sev?.toLowerCase()] || { color: '#7a8290', label: '⬜ No Data', bg: 'rgba(122,130,144,0.05)', border: 'rgba(122,130,144,0.2)' };
}

function TechniqueCell({ technique, onClick, isSelected }) {
  const cfg = technique.detected
    ? getSeverityConfig(technique.severity)
    : { color: '#3a424f', label: '', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)' };

  return (
    <div
      onClick={() => technique.detected && onClick(technique)}
      style={{
        padding: '0.4rem 0.5rem',
        background: isSelected ? `rgba(0,212,255,0.15)` : cfg.bg,
        border: `1px solid ${isSelected ? ACCENT : cfg.border}`,
        borderRadius: '0.25rem',
        cursor: technique.detected ? 'pointer' : 'default',
        transition: 'all 0.2s',
        minWidth: '90px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {technique.detected && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: cfg.color }} />
      )}
      <div style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", color: technique.detected ? cfg.color : '#3a424f', fontWeight: 700 }}>
        {technique.technique_id}
      </div>
      <div style={{ fontSize: '0.55rem', color: technique.detected ? '#aaa' : '#2a3040', marginTop: '0.15rem', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {technique.name}
      </div>
      {technique.detected && technique.count > 0 && (
        <div style={{ fontSize: '0.5rem', color: cfg.color, marginTop: '0.2rem', fontFamily: "'Orbitron', monospace" }}>
          ×{technique.count}
        </div>
      )}
    </div>
  );
}

function TechniqueDetailPanel({ technique, onClose, onResolve }) {
  if (!technique) return null;
  const cfg = getSeverityConfig(technique.severity);

  return (
    <div style={{
      position: 'fixed',
      top: 0, right: 0, bottom: 0,
      width: '380px',
      background: 'linear-gradient(180deg, #040c18 0%, #020408 100%)',
      border: `1px solid ${cfg.border}`,
      borderRight: 'none',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: `-8px 0 32px rgba(0,0,0,0.5)`,
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '1.25rem', borderBottom: `1px solid rgba(0,212,255,0.1)`, background: cfg.bg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: cfg.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
              {technique.technique_id}
            </div>
            <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, marginTop: '0.25rem' }}>
              {technique.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#7a8290', marginTop: '0.25rem' }}>
              {technique.tactic}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#7a8290', fontSize: '1.25rem', cursor: 'pointer' }}
          >×</button>
        </div>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '0.2rem 0.6rem', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '1rem', fontSize: '0.65rem', color: cfg.color, fontWeight: 700 }}>
            {cfg.label}
          </span>
          {technique.count > 0 && (
            <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '1rem', fontSize: '0.65rem', color: ACCENT }}>
              Detected ×{technique.count}
            </span>
          )}
          {technique.is_resolved && (
            <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '1rem', fontSize: '0.65rem', color: GREEN }}>
              ✅ Resolved
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>

        <section>
          <div style={{ fontSize: '0.65rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Description</div>
          <p style={{ fontSize: '0.8rem', color: '#ccc', lineHeight: 1.6 }}>{technique.description}</p>
        </section>

        {technique.remediation && (
          <section>
            <div style={{ fontSize: '0.65rem', color: '#7a8290', fontFamily: "'Orbitron', monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem" }}>
              🛡️ Remediation
            </div>
            <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '0.25rem', padding: '0.75rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#aaa', lineHeight: 1.6 }}>{technique.remediation}</p>
            </div>
          </section>
        )}

        {technique.last_seen && (
          <section>
            <div style={{ fontSize: '0.65rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Last Detected</div>
            <div style={{ fontSize: '0.8rem', color: GOLD }}>{new Date(technique.last_seen).toLocaleString()}</div>
          </section>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(0,212,255,0.1)' }}>
          {technique.mitre_url && (
            <a
              href={technique.mitre_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flex: 1, padding: '0.6rem', textAlign: 'center', border: `1px solid rgba(0,212,255,0.3)`, borderRadius: '0.25rem', color: ACCENT, fontSize: '0.75rem', fontFamily: "'Orbitron', monospace", textDecoration: 'none', background: 'rgba(0,212,255,0.08)' }}
            >
              🔗 MITRE WEBSITE
            </a>
          )}
          {technique.detected && !technique.is_resolved && (
            <button
              onClick={() => onResolve(technique.technique_id)}
              style={{ flex: 1, padding: '0.6rem', border: `1px solid rgba(0,255,136,0.4)`, borderRadius: '0.25rem', color: GREEN, fontSize: '0.75rem', fontFamily: "'Orbitron', monospace", background: 'rgba(0,255,136,0.08)', cursor: 'pointer' }}
            >
              ✅ MARK RESOLVED
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MitreMatrix() {
  const { user } = useAuth();
  const [matrixData,  setMatrixData]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [filter,      setFilter]      = useState('all'); // all | detected | critical | high | medium | low

  const fetchMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const params = user?.website_id ? `?website_id=${user.website_id}` : '';
      const res = await api.get(`/api/mitre/matrix${params}`);
      setMatrixData(res.data);
    } catch (err) {
      console.error('[MITRE MATRIX]', err);
    } finally {
      setLoading(false);
    }
  }, [user?.website_id]);

  useEffect(() => { fetchMatrix(); }, [fetchMatrix]);

  const handleResolve = async (techniqueId) => {
    try {
      await api.post(`/api/mitre/mark-resolved/${techniqueId}`, { website_id: user?.website_id });
      await fetchMatrix();
      setSelected(prev => prev ? { ...prev, is_resolved: true } : null);
    } catch (err) {
      console.error('[MITRE RESOLVE]', err);
    }
  };

  const filterTechniques = (techniques) => {
    if (filter === 'all')       return techniques;
    if (filter === 'detected')  return techniques.filter(t => t.detected);
    return techniques.filter(t => t.detected && t.severity?.toLowerCase() === filter);
  };

  const stats = matrixData?.stats || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', fontFamily: "'Orbitron', monospace", letterSpacing: '0.08em' }}>
            🎯 MITRE ATT&CK MATRIX
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#7a8290', marginTop: '0.25rem' }}>
            Enterprise Threat Framework — Detected Techniques Visualization
          </p>
        </div>
        <button
          onClick={fetchMatrix}
          style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontFamily: "'Orbitron', monospace", border: '1px solid rgba(0,255,136,0.3)', borderRadius: '0.25rem', background: 'rgba(0,255,136,0.08)', color: GREEN, cursor: 'pointer' }}
        >
          ↻ REFRESH
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Total Techniques', value: stats.total_techniques, color: '#7a8290' },
          { label: 'Detected',         value: stats.total_detected,   color: GOLD },
          { label: 'Resolved',         value: stats.total_resolved,   color: GREEN },
          { label: 'Critical Active',  value: stats.critical_active,  color: RED },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)', borderRadius: '0.375rem', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.6rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, fontFamily: "'Orbitron', monospace", marginTop: '0.25rem' }}>{s.value ?? 0}</div>
          </div>
        ))}
      </div>

      {/* ── Filter ── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.7rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", alignSelf: 'center' }}>FILTER:</span>
        {['all', 'detected', 'critical', 'high', 'medium', 'low'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.65rem',
              fontFamily: "'Orbitron', monospace",
              border: `1px solid ${filter === f ? ACCENT : 'rgba(0,212,255,0.15)'}`,
              borderRadius: '1rem',
              background: filter === f ? 'rgba(0,212,255,0.15)' : 'transparent',
              color: filter === f ? ACCENT : '#7a8290',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {Object.entries(SEVERITY_CONFIG).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: v.color }} />
            <span style={{ fontSize: '0.65rem', color: '#7a8290' }}>{v.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#2a3040' }} />
          <span style={{ fontSize: '0.65rem', color: '#7a8290' }}>⬜ Not Detected</span>
        </div>
      </div>

      {/* ── Matrix ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#7a8290', fontFamily: "'Orbitron', monospace", fontSize: '0.75rem' }}>
          ◈ LOADING MITRE MATRIX...
        </div>
      ) : matrixData ? (
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${matrixData.tactics.length}, minmax(100px, 1fr))`, gap: '0.5rem', minWidth: '1200px' }}>
            {/* Tactic headers */}
            {matrixData.tactics.map(tactic => (
              <div
                key={tactic}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(0,212,255,0.06)',
                  border: '1px solid rgba(0,212,255,0.15)',
                  borderRadius: '0.25rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.6rem', color: ACCENT, fontFamily: "'Orbitron', monospace", fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.3 }}>
                  {tactic}
                </div>
                <div style={{ fontSize: '0.55rem', color: '#7a8290', marginTop: '0.2rem' }}>
                  {(matrixData.matrix[tactic] || []).filter(t => t.detected).length} detected
                </div>
              </div>
            ))}

            {/* Technique cells */}
            {matrixData.tactics.map(tactic => {
              const techniques = filterTechniques(matrixData.matrix[tactic] || []);
              return (
                <div key={tactic} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {techniques.map(tech => (
                    <TechniqueCell
                      key={tech.technique_id}
                      technique={tech}
                      onClick={setSelected}
                      isSelected={selected?.technique_id === tech.technique_id}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#7a8290', padding: '3rem', fontFamily: "'Orbitron', monospace", fontSize: '0.75rem' }}>
          No MITRE data available
        </div>
      )}

      {/* ── Technique Detail Panel ── */}
      {selected && (
        <TechniqueDetailPanel
          technique={selected}
          onClose={() => setSelected(null)}
          onResolve={handleResolve}
        />
      )}

      {/* Click-outside to close panel */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 380, bottom: 0, zIndex: 99 }}
        />
      )}
    </div>
  );
}
