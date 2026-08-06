// ============================================
// Drishti Sentinel — Voice Assistant Widget
// Floating microphone button with push-to-talk
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Loader, Send, Volume2, VolumeX } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(window.speechSynthesis);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Initialize Speech Recognition (Browser native)
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-IN';
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (interimTranscript) {
          // Show interim results as user speaks
          setTranscript(prev => prev + ' ' + interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
        setIsLoading(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          processTranscript();
        }
      };
    }
  }, [transcript]);

  // Speak response
  const speakResponse = (text) => {
    if (isMuted || !speechSynthesisRef.current) return;

    // Cancel any ongoing speech
    speechSynthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to find a female voice
    const voices = speechSynthesisRef.current.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('google us english') ||
      v.name.toLowerCase().includes('samantha')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesisRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const processTranscript = async () => {
    if (!transcript.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const user = JSON.parse(localStorage.getItem('dk_user'));
      const websiteId = user.websites?.[0]?.id;

      const { data } = await api.post('/ai/voice', {
        transcript,
        website_id: websiteId
      });

      if (data.response) {
        setResponse(data.response);
        if (!isMuted && data.should_speak) {
          speakResponse(data.response);
        }
      }

      if (data.command_result) {
        console.log('Command executed:', data.command_result);
      }

      if (data.alerts && data.alerts.length > 0) {
        console.log('New alerts:', data.alerts);
        // Play alert sound
        if (!isMuted) {
          speakResponse(`You have ${data.alerts.length} new ${data.alerts[0].severity} alerts.`);
        }
      }
    } catch (err) {
      console.error('Voice command failed:', err);
      setError(err.response?.data?.error || 'Failed to process command');
      setResponse('Sorry, I encountered an error processing your request.');
    } finally {
      setIsLoading(false);
      setIsListening(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      speechSynthesisRef.current.cancel();
    }
  };

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return null; // Don't show widget if speech recognition not supported
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Voice Assistant Widget */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 bg-slate-800/95 backdrop-blur-xl border border-slate-600 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
              <h3 className="text-white font-semibold text-sm">Drishti Voice Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Transcript Area */}
          <div className="p-4 bg-slate-900/30 min-h-[80px]">
            {transcript ? (
              <p className="text-white text-sm">{transcript}</p>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Listening...</span>
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">Hold microphone and speak</p>
            )}
          </div>

          {/* Response Area */}
          {response && (
            <div className="px-4 pb-4">
              <div className="bg-royal-900/20 border border-royal-700/30 rounded-lg p-3">
                <p className="text-royal-300 text-sm">{response}</p>
                {isSpeaking && (
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1 h-3 bg-royal-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="px-4 pb-4">
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-900/50">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleListening}
              disabled={isLoading}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-royal-600 hover:bg-royal-500 shadow-lg shadow-royal-900/50'
              }`}
            >
              {isLoading ? (
                <Loader className="w-6 h-6 text-white animate-spin" />
              ) : isListening ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>
            <div className="w-8"></div> {/* Spacer */}
          </div>
        </div>
      )}

      {/* Floating Microphone Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 ${
          isOpen ? 'bg-slate-700' : 'bg-royal-600 hover:bg-royal-500'
        }`}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <Mic className="w-7 h-7 text-white" />
        )}
      </button>
    </div>
  );
}
