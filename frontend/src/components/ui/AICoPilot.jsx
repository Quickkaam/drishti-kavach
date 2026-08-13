import React, { useState, useEffect, useRef } from 'react';
import { usePageContext } from '../../context/PageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const AICoPilot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [insights, setInsights] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const { currentPage, pageData } = usePageContext();
  const { currentWebsiteId, token } = useAuth();
  
  const endOfMessagesRef = useRef(null);

  // Auto-scroll when new content arrives
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [insights, suggestions]);

  // Fetch insights when the Co-Pilot is opened or page context changes (while open)
  useEffect(() => {
    if (isOpen && currentWebsiteId) {
      fetchInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentPage, pageData, currentWebsiteId]);

  const fetchInsights = async (userQuery = '') => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/ai/copilot', {
        page: currentPage,
        context: pageData,
        website_id: currentWebsiteId,
        query: userQuery
      });

      // Axios throws error on non-2xx status, so if we reach here, it's successful
      setInsights(data.insights || 'No specific insights found.');
      setSuggestions(data.suggestions || []);

    } catch (err) {
      console.error('Co-Pilot API Error:', err);
      setInsights('I am having trouble connecting to my neural network. Error: ' + (err.response?.data?.error || err.message));
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = async (suggestion) => {
    setIsExecuting(true);
    try {
      const { data } = await api.post('/ai/execute-suggestion', {
        action: suggestion.action,
        target: suggestion.target,
        website_id: currentWebsiteId,
        reasoning: suggestion.reasoning || `Triggered by Co-Pilot from ${currentPage} page`
      });

      alert(`Action successful: ${data.message || 'Executed'}`);
      // Refresh insights after action
      fetchInsights();
    } catch (err) {
      alert(`Action failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleQuerySubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const userQuery = query;
    setQuery('');
    fetchInsights(userQuery);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-50 transition-all duration-300 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-500 animate-pulse'
        }`}
        style={{ width: '60px', height: '60px' }}
      >
        {isOpen ? (
          <svg className="w-7 h-7 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl" role="img" aria-label="robot">🤖</span>
        )}
      </button>

      {/* Slide-out Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-gray-900/95 backdrop-blur-xl border-l border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-700/50 bg-gray-800/50 flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="font-bold text-white text-lg tracking-wide">Drishti Co-Pilot</h3>
            <p className="text-xs text-indigo-400">Context: <span className="font-mono uppercase text-indigo-300">{currentPage.replace('_', ' ')}</span></p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          
          {/* AI Insights */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">AI Insights</h4>
            {isLoading ? (
              <div className="flex items-center gap-3 p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                <p className="text-gray-300 text-sm animate-pulse">Analyzing page context...</p>
              </div>
            ) : (
              <div className="p-4 bg-indigo-900/20 rounded-xl border border-indigo-500/30 text-indigo-100 text-sm leading-relaxed whitespace-pre-wrap">
                {insights || "I'm monitoring this page. Everything looks quiet."}
              </div>
            )}
          </div>

          {/* Action Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Suggested Actions</h4>
              <div className="space-y-3">
                {suggestions.map((sugg, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleActionClick(sugg)}
                    disabled={isExecuting}
                    className="w-full text-left p-3 rounded-lg bg-gray-800/80 border border-gray-700 hover:border-indigo-500 hover:bg-gray-800 transition-colors group flex justify-between items-center"
                  >
                    <div>
                      <span className="text-white text-sm block font-medium group-hover:text-indigo-300 transition-colors">{sugg.label}</span>
                      {sugg.reasoning && (
                        <span className="text-gray-400 text-xs block mt-1 line-clamp-1">{sugg.reasoning}</span>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700/50 bg-gray-900">
          <form onSubmit={handleQuerySubmit} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about this data..."
              className="w-full bg-gray-800 text-white rounded-full py-3 pl-4 pr-12 text-sm border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AICoPilot;
