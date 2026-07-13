// ============================================
// Drishti Kavach — Cyber-Noir Login Page
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Animated neural network SVG background
const NeuralBg = () => (
  <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="nodeGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#00d4ff" stopOpacity="0"/>
      </radialGradient>
    </defs>
    {/* Neural lines */}
    {[
      [100,200,400,100],[400,100,700,300],[700,300,900,150],[900,150,1100,400],
      [200,500,500,400],[500,400,800,600],[800,600,1000,500],[1000,500,1200,700],
      [150,700,450,800],[450,800,750,650],[750,650,1050,800],[50,400,300,600],
    ].map(([x1,y1,x2,y2],i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#00d4ff" strokeWidth="0.5" strokeOpacity="0.3"
            strokeDasharray="4 8"/>
    ))}
    {/* Nodes */}
    {[[100,200],[400,100],[700,300],[900,150],[200,500],[500,400],[800,600],[450,800],[750,650]].map(([cx,cy],i) => (
      <circle key={i} cx={cx} cy={cy} r="2" fill="#00d4ff" fillOpacity="0.6"/>
    ))}
  </svg>
);

// Hex corner decoration
const HexCorner = ({ className }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" className={className}>
    <path d="M0 0 L12 0 L20 8 L20 20" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.6"/>
  </svg>
);

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | scanning | authenticated
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileWidgetRef = useRef(null);

  // Initialize Turnstile
  useEffect(() => {
    const initTurnstile = () => {
      if (window.turnstile && !turnstileWidgetRef.current) {
        turnstileWidgetRef.current = window.turnstile.render('#turnstile-widget-login', {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
          theme: 'dark',
          size: 'normal',
          callback: (token) => {
            setTurnstileToken(token);
          },
          'expired-callback': () => {
            setTurnstileToken('');
            if (turnstileWidgetRef.current && window.turnstile) {
              window.turnstile.reset(turnstileWidgetRef.current);
            }
          },
          'error-callback': () => {
            setTurnstileToken('');
            console.error('Turnstile widget error');
          },
        });
      }
    };

    // Load Turnstile script if not already loaded
    if (!document.querySelector('script[src*="challenges.cloudflare.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = initTurnstile;
      document.head.appendChild(script);
    } else {
      initTurnstile();
    }

    return () => {
      if (turnstileWidgetRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check Turnstile token
    if (!turnstileToken && import.meta.env.VITE_TURNSTILE_SITE_KEY) {
      setError('Please complete the security verification');
      return;
    }
    
    setError('');
    setLoading(true);
    setPhase('scanning');
    try {
      await login(email, password, turnstileToken);
      setPhase('authenticated');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      setPhase('idle');
      
      // Handle Turnstile errors
      if (err.response?.data?.code === 'TURNSTILE_REQUIRED' || 
          err.response?.data?.code === 'TURNSTILE_FAILED') {
        setError('Security verification failed. Please try again.');
        // Reset Turnstile widget
        if (turnstileWidgetRef.current && window.turnstile) {
          window.turnstile.reset(turnstileWidgetRef.current);
          setTurnstileToken('');
        }
      } else {
        setError(err.response?.data?.error || 'AUTHENTICATION FAILED');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: 'radial-gradient(ellipse at 50% 0%, #040c1a 0%, #020408 60%)' }}>

      <NeuralBg />

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.01) 2px, rgba(0,212,255,0.01) 4px)' }}/>

      {/* Corner decorations */}
      <HexCorner className="absolute top-8 left-8 rotate-0"/>
      <HexCorner className="absolute top-8 right-8 rotate-90"/>
      <HexCorner className="absolute bottom-8 left-8 -rotate-90"/>
      <HexCorner className="absolute bottom-8 right-8 rotate-180"/>

      <div className="w-full max-w-md px-4 relative z-10 fade-in">

        {/* Logo + Brand */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <img src="/logo.png" alt="Drishti Kavach" className="h-24 w-auto mx-auto logo-shield"/>
          </div>
          <h1 className="font-orbitron text-3xl font-black tracking-widest text-glow-cyan mb-1">
            DRISHTI KAVACH
          </h1>
          <div className="circuit-line my-2 mx-auto max-w-xs"/>
          <p className="font-orbitron text-xs tracking-[0.4em] text-cyber-gold opacity-80">
            NEURAL SHIELD INITIATIVE
          </p>
          <p className="text-text-muted text-xs mt-3 font-mono-code italic">
            दृष्टिः रक्षति, रक्षा दृश्यते
          </p>
        </div>

        {/* Login Card */}
        <div className="cyber-card p-8 relative scanline-effect">
          <HexCorner className="absolute top-0 left-0"/>
          <HexCorner className="absolute top-0 right-0 rotate-90"/>

          <div className="cyber-label mb-6 flex items-center gap-2">
            <div className={`pulse-${phase === 'scanning' ? 'gold' : phase === 'authenticated' ? 'cyan' : 'cyan'}`}/>
            {phase === 'scanning' ? 'SCANNING NEURAL SIGNATURE...' : phase === 'authenticated' ? 'ACCESS GRANTED' : 'SECURE ACCESS TERMINAL'}
          </div>

          {error && (
            <div className="mb-5 p-3 border border-cyber-red/40 bg-cyber-red/5 fade-in">
              <p className="text-cyber-red font-orbitron text-xs tracking-wider">⚠ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="cyber-label block mb-2">IDENTITY VECTOR</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                     className="cyber-input" placeholder="operative@drishti.kavach" required/>
            </div>
            <div>
              <label className="cyber-label block mb-2">NEURAL KEY</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                     className="cyber-input" placeholder="••••••••••••" required/>
            </div>

            {/* Turnstile Security Verification */}
            <div id="turnstile-widget-login" style={{ minHeight: '65px', margin: '15px 0' }}></div>

            <button type="submit" disabled={loading}
                    className="cyber-btn cyber-btn-solid w-full mt-2 flex items-center justify-center gap-3 py-3 disabled:opacity-40">
              {loading ? (
                <><span className="w-4 h-4 border border-cyber-cyan/40 border-t-cyber-cyan rounded-full animate-spin"/>
                INITIALIZING...</>
              ) : (
                <>INITIALIZE NEURAL SHIELD →</>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 border border-cyber-gold/20 bg-cyber-gold/5">
            <p className="font-orbitron text-xs text-cyber-gold tracking-wider mb-2">◈ DEMO ACCESS</p>
            <div className="font-mono-code text-xs text-text-secondary space-y-1">
              <p>ID: <span className="text-cyber-cyan">demo@drishti.com</span></p>
              <p>KEY: <span className="text-cyber-cyan">demo1234</span></p>
            </div>
          </div>
        </div>

        <p className="text-center font-orbitron text-xs tracking-widest text-text-muted mt-6">
          DRISHTI KAVACH v1.0 · CLASSIFIED SYSTEM
        </p>
      </div>
    </div>
  );
}
