import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

export default function DrishtiAIConsole() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'ai', 
      text: 'Drishti AI initialized. I am monitoring global traffic anomalies. How can I assist you today?',
      actions: []
    },
    {
      id: 2,
      sender: 'ai',
      text: 'Alert: Detected a high volume of SQLi attempts from 185.220.101.45 targeting the login endpoint.',
      actions: ['Block IP', 'Ignore']
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
  }, [messages, isCollapsed]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const newMsg = { id: Date.now(), sender: 'user', text: input, actions: [] };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Mock AI response with typing animation effect (timeout)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Analyzing the request... The origin seems to be part of a known botnet. I recommend an immediate block.',
        actions: ['Execute Block']
      }]);
    }, 1000);
  };

  const handleAction = (action, msgId) => {
    // Mock action handling
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'ai',
      text: `Action executed: [${action}]. Security policy updated.`,
      actions: []
    }]);
  };

  return (
    <div className={`glass-panel rounded-lg flex flex-col transition-all duration-300 bg-[#0a0a2e]/80 border-[#f5b041]/30 ${isCollapsed ? 'h-[50px]' : 'h-full min-h-[300px]'}`}>
      
      {/* Header */}
      <div 
        className="p-3 border-b border-[#f5b041]/20 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Bot className="text-[#f5b041]" size={18} />
          <p className="font-orbitron text-xs tracking-widest text-[#f5b041] font-bold">DRISHTI AI</p>
        </div>
        {isCollapsed ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronUp size={16} className="text-text-muted" />}
      </div>

      {/* Chat Area */}
      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-[#00d4ff]/20 text-[#00d4ff]' : 'bg-[#f5b041]/20 text-[#f5b041]'}`}>
                    {msg.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-3 rounded-lg text-sm font-inter shadow-lg ${
                    msg.sender === 'user' 
                      ? 'bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#e8f4fd] rounded-br-none' 
                      : 'bg-black/40 border border-[#f5b041]/20 text-[#e8f4fd] rounded-bl-none'
                  }`}>
                    {msg.text}
                    
                    {/* Suggested Actions */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {msg.actions.map(action => (
                          <button 
                            key={action}
                            onClick={() => handleAction(action, msg.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-orbitron rounded bg-[#ff3d3d]/10 border border-[#ff3d3d]/40 text-[#ff3d3d] hover:bg-[#ff3d3d]/20 hover:shadow-[0_0_10px_rgba(255,61,61,0.3)] transition-all"
                          >
                            <ShieldAlert size={12} />
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-[#f5b041]/20 bg-black/20">
            <form onSubmit={handleSend} className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Drishti AI..." 
                className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm font-inter text-text-primary focus:outline-none focus:border-[#f5b041]/50 focus:shadow-[0_0_10px_rgba(245,176,65,0.2)] transition-all"
              />
              <button 
                type="submit"
                className="bg-[#f5b041]/10 border border-[#f5b041]/30 text-[#f5b041] p-2 rounded hover:bg-[#f5b041]/20 transition-colors"
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
