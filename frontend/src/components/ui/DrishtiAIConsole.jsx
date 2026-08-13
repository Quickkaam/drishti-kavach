import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, ChevronDown, ChevronUp, ShieldAlert, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import api from '../../api/client';

// Helper function to format AI response
const formatResponse = (content) => {
  if (content.trim().startsWith('```') || content.includes('```')) {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        return { type: 'json', data: parsed };
      } catch {
        return { type: 'text', data: content };
      }
    }
  }
  
  try {
    const parsed = JSON.parse(content);
    return { type: 'json', data: parsed };
  } catch {
    return { type: 'text', data: content };
  }
};

// Component to render formatted AI response - Clean, no JSON structure
const ResponseContent = ({ content }) => {
  const formatted = formatResponse(content);
  
  if (formatted.type === 'json') {
    const data = formatted.data;
    
    return (
      <div className="space-y-3">
        {data.message && <p className="text-[#e8f4fd] text-xs leading-relaxed">{data.message}</p>}
        {data.response && !data.message && <p className="text-[#e8f4fd] text-xs leading-relaxed">{data.response}</p>}
        
        {(data.threat_assessment || data.threat_level) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-red-400 text-xs">⚠️</span>
              <span className="text-red-400 font-semibold text-[10px] uppercase tracking-wider">Threat Assessment</span>
            </div>
            <p className="text-slate-200 text-xs">
              {typeof data.threat_assessment === 'object' 
                ? data.threat_assessment.summary || JSON.stringify(data.threat_assessment)
                : data.threat_assessment || data.threat_level}
            </p>
          </div>
        )}
        
        {(data.severity_rating !== undefined && data.severity_rating !== null) && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px] font-medium">Risk:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              data.severity_rating === 'Low' || data.severity_rating === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              data.severity_rating === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              data.severity_rating === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
              'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {data.severity_rating}
            </span>
          </div>
        )}
        
        {(data.recommendation || data.recommended_action) && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-blue-400 text-xs">💡</span>
              <span className="text-blue-400 font-semibold text-[10px] uppercase tracking-wider">Action</span>
            </div>
            <p className="text-slate-200 text-xs">{data.recommendation || data.recommended_action}</p>
          </div>
        )}
        
        {data.assessment && (
          <div className="bg-black/20 border border-slate-600/30 rounded p-2">
            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Assessment</span>
            <p className="text-slate-200 text-xs mt-1">{data.assessment}</p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="whitespace-pre-wrap break-words text-xs leading-relaxed text-[#e8f4fd]">
      {content}
    </div>
  );
};

export default function DrishtiAIConsole() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(uuidv4());
  
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'ai', 
      text: 'Drishti AI initialized. I am monitoring global traffic anomalies. How can I assist you today?',
    }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isCollapsed) {
      scrollToBottom();
    }
  }, [messages, isCollapsed, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const question = input.trim();
    const newMsg = { id: Date.now(), sender: 'user', text: question };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { 
        question, 
        website_id: 1,
        session_id: sessionId,
        provider: 'groq',
      });
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.response || 'I encountered an issue. Please try again.',
      }]);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      console.error('[AI Error]', errorMessage);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: `⚠️ Error: ${errorMessage}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`rounded-lg flex flex-col transition-all duration-300 accent-line-top animate-border-glow slide-in-3 ${isCollapsed ? 'h-[50px]' : 'flex-1 min-h-0 h-full'}`}
      style={{
        background: 'linear-gradient(135deg, rgba(4, 12, 26, 0.95) 0%, rgba(10, 6, 30, 0.95) 100%)',
        border: '1px solid rgba(138, 43, 226, 0.25)',
        overflow: 'hidden',
            overflowY: 'auto',
            position: 'relative'
      }}
    >
      
      {/* Header */}
      <div 
        className="p-3 border-b border-purple-500/20 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Bot className="text-[#b388ff]" size={18} />
          <p className="font-orbitron text-xs tracking-widest text-[#b388ff] font-bold">DRISHTI AI</p>
        </div>
        {isCollapsed ? <ChevronDown size={16} className="text-[#7a8290]" /> : <ChevronUp size={16} className="text-[#7a8290]" />}
      </div>

      {/* Chat Area */}
      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-start gap-2 max-w-[90%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.sender === 'user' ? 'bg-[#00d4ff]/20 text-[#00d4ff]' : 'bg-[#b388ff]/20 text-[#b388ff]'}`}>
                    {msg.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-3 rounded-lg text-sm font-inter shadow-lg ${
                    msg.sender === 'user' 
                      ? 'bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#e8f4fd] rounded-br-none' 
                      : 'bg-black/40 border border-purple-500/20 text-[#e8f4fd] rounded-bl-none w-full'
                  }`}>
                    {msg.sender === 'user' ? (
                      <span className="text-xs">{msg.text}</span>
                    ) : (
                      <ResponseContent content={msg.text} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex flex-col items-start">
                <div className="flex items-start gap-2 max-w-[90%] flex-row">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-[#b388ff]/20 text-[#b388ff]">
                    <Bot size={12} />
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-purple-500/20 rounded-bl-none flex items-center gap-2">
                    <Loader2 size={14} className="text-[#b388ff] animate-spin" />
                    <span className="text-xs text-[#b388ff] font-orbitron tracking-widest">ANALYZING...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-purple-500/20 bg-black/20">
            <form onSubmit={handleSend} className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Drishti AI..." 
                disabled={loading}
                className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm font-inter text-text-primary focus:outline-none focus:border-purple-500/50 focus:shadow-[0_0_10px_rgba(138,43,226,0.2)] transition-all disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={loading}
                className="bg-[#b388ff]/10 border border-[#b388ff]/30 text-[#b388ff] p-2 rounded hover:bg-[#b388ff]/20 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

