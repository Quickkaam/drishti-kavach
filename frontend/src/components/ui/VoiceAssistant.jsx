// ============================================
// Drishti Sentinel — Voice Assistant Widget
// Floating microphone button with push-to-talk
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, X, Loader, Send, Volume2, VolumeX } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function VoiceAssistant({ isOpen, setIsOpen, setInput }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(window.speechSynthesis);

  // Initialize Speech Recognition (Browser native)
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.lang = 'en-IN';
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }

        // Show interim results as user speaks
        if (interimTranscript) {
          setTranscript(prev => prev + ' ' + interimTranscript);
        }
        
        // Process final transcript
        if (finalTranscript && setInput) {
          setInput(finalTranscript);
          if (setIsOpen) setIsOpen(false);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Error: ${event.error}`);
        setIsListening(false);
        setIsLoading(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Don't auto-process here - let user confirm by clicking send
        if (transcript.trim()) {
          // transcript already set in onresult
        }
      };

      recognitionRef.current = recognition;
    } else {
      setError('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
    }
  }, [transcript]);

  // Speak response with female voice
  const speakResponse = useCallback((text) => {
    if (isMuted || !speechSynthesisRef.current) return;

    // Cancel any ongoing speech
    speechSynthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to find a female voice
    const voices = speechSynthesisRef.current.getVoices();
    console.log('Available voices:', voices.map(v => v.name));
    
    const femaleVoice = voices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('google us english') ||
      v.name.toLowerCase().includes('samantha') ||
      v.name.toLowerCase().includes('google uk english female')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
      console.log('Using voice:', femaleVoice.name);
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesisRef.current.speak(utterance);
  }, [isMuted]);

  const processTranscript = async (text = transcript) => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const user = JSON.parse(localStorage.getItem('dk_user'));
      const websiteId = user.websites?.[0]?.id;

      console.log('Sending to voice API:', text);
      
      const { data } = await api.post('/ai/voice', {
        transcript: text,
        website_id: websiteId
      });

      console.log('Voice API response:', data);

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
          speakResponse(`You have ${data.alerts.length} new alerts.`);
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

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setError(null);
      try {
        recognitionRef.current.start();
        console.log('Listening started...');
      } catch (err) {
        console.error('Failed to start listening:', err);
        setError('Failed to start microphone. Please check permissions.');
      }
    }
  }, [isListening]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      speechSynthesisRef.current.cancel();
    }
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      processTranscript(transcript);
    }
  };

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return null;
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Voice Assistant Widget */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 bg-slate-800/95 backdrop-blur-xl border border-slate-600 rounded-2xl shadow-2xl overflow-hidden">
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
          <div className="p-4 bg-slate-900/30 min-h-[80px] max-h-[150px] overflow-y-auto">
            {transcript ? (
              <p className="text-white text-sm whitespace-pre-wrap">{transcript}</p>
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
              title="Hold to speak"
            >
              {isLoading ? (
                <Loader className="w-6 h-6 text-white animate-spin" />
              ) : isListening ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!transcript.trim() || isLoading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send to AI"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Microphone Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 ${
          isOpen ? 'bg-slate-700' : 'bg-royal-600 hover:bg-royal-500'
        }`}
        title="Open Voice Assistant"
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
