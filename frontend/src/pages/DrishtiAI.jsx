// ============================================
// Drishti Kavach — Drishti AI Chat Page
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../api/client';
import logo from '/drishti-ai-logo.png';

const QUICK_PROMPTS = [
  "Show me today's threats",
  "What's the current threat level?",
  "Summarize the last 7 days",
  "Which IPs should I block?",
  "Are we GDPR compliant?",
  "Show critical events this week",
];

// Helper function to format AI response
const formatResponse = (content) => {
  // Check if response is JSON
  if (content.trim().startsWith('```') || content.includes('```')) {
    // Extract JSON from code block
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        return { type: 'json', data: parsed, raw: content };
      } catch {
        return { type: 'text', data: content };
      }
    }
  }
  
  // Try to parse as JSON directly
  try {
    const parsed = JSON.parse(content);
    return { type: 'json', data: parsed, raw: content };
  } catch {
    return { type: 'text', data: content };
  }
};

// Component to render formatted AI response
const ResponseContent = ({ content }) => {
  const formatted = formatResponse(content);
  
  if (formatted.type === 'json') {
    const data = formatted.data;
    return (
      <div className="space-y-3">
        {/* Main response */}
        {data.response && (
          <p className="text-white text-base leading-relaxed">{data.response}</p>
        )}
        
        {/* Threat assessment */}
        {data.threat_assessment && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <span className="text-red-400 font-semibold text-xs uppercase tracking-wider">Threat Assessment</span>
            <p className="text-slate-200 text-sm mt-1">{data.threat_assessment}</p>
          </div>
        )}
        
        {/* Severity rating */}
        {data.severity_rating !== undefined && data.severity_rating !== null && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Severity:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
              data.severity_rating === 'Low' || data.severity_rating === 0 ? 'bg-green-500/20 text-green-400' :
              data.severity_rating === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
              data.severity_rating === 'High' ? 'bg-orange-500/20 text-orange-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {data.severity_rating}
            </span>
          </div>
        )}
        
        {/* Recommendation */}
        {data.recommendation && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">Recommendation</span>
            <p className="text-slate-200 text-sm mt-1">{data.recommendation}</p>
          </div>
        )}
        
        {/* Sanskrit Motto - Make it prominent */}
        {data.motto && (
          <div className="mt-4 pt-3 border-t border-gold-500/20">
            <p className="text-gold-400 text-lg font-medium tracking-wide text-center" 
               style={{ fontFamily: "'Noto Sans Devanagari', 'Arial Unicode MS', sans-serif" }}>
              {data.motto}
            </p>
          </div>
        )}
        
        {/* Additional info */}
        {data.additional_info && (
          <p className="text-slate-400 text-sm italic">{data.additional_info}</p>
        )}
        
        {/* Raw JSON toggle for debugging */}
        <details className="mt-2">
          <summary className="text-slate-500 text-xs cursor-pointer hover:text-slate-400">View raw JSON</summary>
          <pre className="mt-2 p-2 bg-navy-900/50 rounded text-xs text-slate-400 overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    );
  }
  
  // Regular text response
  return (
    <div className="whitespace-pre-wrap break-words text-base leading-relaxed text-slate-200">
      {content}
    </div>
  );
};

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
      const { data } = await api.post('/ai/chat', { 
        question, 
        website_id: 1,
        session_id: sessionId 
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'I encountered an issue. Please try again.',
        time: new Date().toLocaleTimeString(),
      }]);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      console.error('[AI Error]', errorMessage);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Drishti AI encountered an error: ${errorMessage}. Please check backend logs.`,
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
          <p className="text-slate-500 text-xs">Autonomous Security Intelligence • Powered by Groq</p>
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
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-royal-600 to-royal-800 shadow-lg shadow-royal-500/20' 
                : 'bg-gradient-to-br from-gold-500/30 to-gold-600/10 border border-gold-400/40 shadow-lg shadow-gold-500/10'
            }`}>
              {msg.role === 'user' ? '👤' : '🛡️'}
            </div>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
              <div className={`px-5 py-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-royal-700/80 to-royal-800/60 text-white rounded-tr-md shadow-lg shadow-royal-500/10 border border-royal-600/30'
                  : 'bg-gradient-to-br from-navy-700 to-navy-800 border border-royal-700/40 text-slate-200 rounded-tl-md shadow-lg'
              }`} style={{ fontFamily: "'Inter', sans-serif" }}>
                {msg.role === 'assistant' ? (
                  <ResponseContent content={msg.content} />
                ) : (
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">{msg.time}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500/30 to-gold-600/10 border border-gold-400/40 flex items-center justify-center text-base shadow-lg shadow-gold-500/10">🛡️</div>
            <div className="px-5 py-4 bg-gradient-to-br from-navy-700 to-navy-800 border border-royal-700/40 rounded-2xl rounded-tl-md shadow-lg">
              <div className="flex gap-1.5 items-center">
                {[0, 0.15, 0.3].map((d, i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-gold-400 animate-bounce"
                        style={{ animationDelay: `${d}s`, animationDuration: '0.6s' }}></span>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3 mt-4 pt-4 flex-shrink-0 border-t border-royal-800/30">
        <div className="flex-1 relative">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !loading && sendMessage()}
            placeholder="Ask Drishti AI about security threats, analysis, or recommendations..."
            className="w-full px-4 py-3.5 bg-navy-800/80 border border-royal-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200 text-sm"
            style={{ fontFamily: "'Inter', sans-serif" }}
            disabled={loading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs">
            Press Enter to send
          </div>
        </div>
        <button 
          onClick={() => sendMessage()} 
          disabled={loading || !input.trim()}
          className="px-6 py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-900 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 text-sm"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Send
        </button>
      </div>
      
      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 176, 65, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 176, 65, 0.5);
        }
      `}</style>
    </div>
  );
}
