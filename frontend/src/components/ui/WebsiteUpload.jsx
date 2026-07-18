// ============================================
// Drishti Kavach — ZIP Upload Component
// AI-powered website onboarding via ZIP file
// ============================================

import React, { useState, useRef } from 'react';
import api from '../../api/client';

const ACCENT = '#00d4ff';
const GREEN  = '#00ff88';
const GOLD   = '#f5b041';
const RED    = '#ff3d3d';

export default function WebsiteUpload({ websiteId, websiteName, onSuccess }) {
  const [status,    setStatus]    = useState('idle'); // idle | uploading | success | error
  const [progress,  setProgress]  = useState(0);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const [dragOver,  setDragOver]  = useState(false);
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      setError('Only .zip files are accepted');
      setStatus('error');
      return;
    }
    if (file.size > 52428800) {
      setError('ZIP file too large (max 50MB)');
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setProgress(10);
    setError(null);
    setResult(null);

    try {
      // Read file as base64
      const base64 = await readFileAsBase64(file);
      setProgress(30);

      // Upload to backend
      const res = await api.post(`/api/websites/${websiteId}/upload`, { zipBase64: base64 });
      setProgress(90);

      const { filesProcessed, filesInjected, zipBase64: resultZip } = res.data;

      setResult({ filesProcessed, filesInjected, zipBase64: resultZip, filename: file.name });
      setProgress(100);
      setStatus('success');

      if (onSuccess) onSuccess({ filesProcessed, filesInjected });
    } catch (err) {
      console.error('[ZIP UPLOAD]', err);
      setError(err.response?.data?.error || err.message || 'Upload failed');
      setStatus('error');
      setProgress(0);
    }
  };

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]); // strip "data:...base64," prefix
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const downloadResult = () => {
    if (!result?.zipBase64) return;
    const bytes  = atob(result.zipBase64);
    const arr    = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob   = new Blob([arr], { type: 'application/zip' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = result.filename?.replace('.zip', '-tracked.zip') || 'tracked-website.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.25rem' }}>📦</span>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>AI-Powered Auto-Setup</div>
          <div style={{ fontSize: '0.7rem', color: '#7a8290' }}>
            Upload your website ZIP — tracking code will be auto-injected into all HTML files
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      {status !== 'success' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? ACCENT : 'rgba(0,212,255,0.2)'}`,
            borderRadius: '0.5rem',
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.02)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
          <div style={{ fontSize: '0.875rem', color: dragOver ? ACCENT : '#ccc' }}>
            {status === 'uploading' ? 'Processing...' : 'Drop your ZIP file here or click to browse'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#7a8290', marginTop: '0.25rem' }}>
            Max size: 50MB · Supported: .zip
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            style={{ display: 'none' }}
            onChange={e => processFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Progress Bar */}
      {status === 'uploading' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#ccc' }}>
              {progress < 30 ? 'Reading file...' : progress < 90 ? 'Injecting tracking code...' : 'Finalizing...'}
            </span>
            <span style={{ fontSize: '0.7rem', color: ACCENT, fontFamily: "'JetBrains Mono', monospace" }}>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(0,212,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${ACCENT}, ${GREEN})`,
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,61,61,0.08)', border: '1px solid rgba(255,61,61,0.3)', borderRadius: '0.375rem', fontSize: '0.8rem', color: RED, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => { setStatus('idle'); setError(null); }} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#7a8290', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
      )}

      {/* Success */}
      {status === 'success' && result && (
        <div style={{ padding: '1rem', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>✅</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: GREEN }}>Upload Complete!</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.6rem', color: '#7a8290', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Files Found</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: GOLD, fontFamily: "'Orbitron', monospace" }}>{result.filesProcessed}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6rem', color: '#7a8290', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Injected</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: GREEN, fontFamily: "'Orbitron', monospace" }}>{result.filesInjected}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={downloadResult}
              style={{ flex: 1, padding: '0.6rem', border: '1px solid rgba(0,255,136,0.4)', borderRadius: '0.25rem', background: 'rgba(0,255,136,0.1)', color: GREEN, fontSize: '0.75rem', fontFamily: "'Orbitron', monospace", cursor: 'pointer', fontWeight: 700 }}
            >
              ⬇️ DOWNLOAD TRACKED ZIP
            </button>
            <button
              onClick={() => { setStatus('idle'); setResult(null); }}
              style={{ padding: '0.6rem 1rem', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '0.25rem', background: 'transparent', color: '#7a8290', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Upload Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
