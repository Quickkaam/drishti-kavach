// ============================================
// Drishti Kavach — Drishti AI Chat Page
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../api/client';
import logo from '/drishti-kavach-logo.png';

const QUICK_PROMPTS = [
  "Show me today's threats",
  "What's the current threat level?",
  "Summarize the last 7 days",
  "Which IPs should I block?",
  "Are we GDPR compliant?",
  "Show critical events this week",
];

export default function DrishtiAI() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '🛡️ **Namaste.** I am Drishti AI — your intelligent security guardian.\n\nI can help you analyze threats, investigate IPs, generate summaries, and provide actionable security recommendations.\n\n*दृष्टिः रक्षति, रक्षा दृश्यते* — Vision protects, and protection is seen.\n\nHow can I help you today?',
      time: new Date().toLocaleTimeString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(uuidv4());
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question, time: new Date().toLocaleTimeString() }]);
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { question, session_id: sessionId });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'I encountered an issue. Please try again.',
        time: new Date().toLocaleTimeString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Drishti AI is temporarily unavailable. Please check your API key configuration.',
        time: new Date().toLocaleTimeString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">

      {/* Header */}
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <div className="w-12 h-12 rounded-full flex items-center justify-center border border-gold-400/40 overflow-hidden"
             style={{ background: 'radial-gradient(circle, rgba(245,176,65,0.2) 0%, transparent 70%)' }}>
          <img src={logo} alt="Drishti AI" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Drishti AI</h1>
          <p className="text-slate-500 text-xs">Autonomous Security Intelligence • Powered by DeepSeek</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400 bg-green-900/20 border border-green-800/30 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
          Guardian Mode Active
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => sendMessage(p)}
                  className="text-xs px-3 py-1.5 rounded-full border border-royal-700/50 text-slate-400 hover:text-gold-400 hover:border-gold-400/40 transition-colors bg-navy-800/50">
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
              msg.role === 'user' ? 'bg-royal-800' : 'bg-gold-400/20 border border-gold-400/30'
            }`}>
              {msg.role === 'user' ? '👤' : '🛡️'}
            </div>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-royal-800/60 text-slate-200 rounded-tr-sm'
                  : 'bg-navy-800 border border-royal-800/40 text-slate-300 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
              <span className="text-xs text-slate-600">{msg.time}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gold-400/20 border border-gold-400/30 flex items-center justify-center text-sm">🛡️</div>
            <div className="px-4 py-3 bg-navy-800 border border-royal-800/40 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                {[0.1, 0.2, 0.3].map(d => (
                  <span key={d} className="w-2 h-2 rounded-full bg-gold-400/60 animate-bounce"
                        style={{ animationDelay: `${d}s` }}></span>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3 mt-4 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask Drishti AI anything about your security..."
          className="dk-input flex-1"
          disabled={loading}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                className="dk-btn-primary px-5 disabled:opacity-50">
          Send
        </button>
      </div>
    </div>
  );
}
