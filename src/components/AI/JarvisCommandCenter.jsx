import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Check, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  CreditCard,
  ShoppingCart,
  Moon,
  Sun,
  Layers,
  Activity,
  Radio,
  Headphones
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { jarvisVoiceService } from '../../services/ai/jarvisVoiceService';
import { jarvisSpeechService } from '../../services/ai/jarvisSpeechService';
import { jarvisCommandRouter } from '../../services/ai/jarvisCommandRouter';
import { JarvisIntelligenceOrb } from './JarvisIntelligenceOrb';
import { JarvisAudioWaveform } from './JarvisAudioWaveform';
import './JarvisCommandCenter.css';

/**
 * JarvisCommandCenter 3.0
 * Futuristic ChatGPT-inspired AI Copilot Panel for Karobaar & SAS Cafeteria.
 * Dark glassmorphism with elegant blue, purple and cyan lighting,
 * animated intelligence orb, dynamic waveforms, timestamps, and one-click Live Talk.
 */
export const JarvisCommandCenter = ({
  isOpen = false,
  onClose = () => {},
  assistantName = 'Jarvis',
  initialQuery = '',
  onOpenLiveTalk = () => {}
}) => {
  const { 
    currentUser, 
    currentBusiness, 
    theme, 
    toggleTheme 
  } = useAppContext();

  const navigate = useNavigate();
  const location = useLocation();

  // Avatar & Operational State
  const [orbState, setOrbState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing' | 'success' | 'error'
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'activity'
  const [isMaximized, setIsMaximized] = useState(false);

  // Preferences & Toggles
  const [voiceOutput, setVoiceOutput] = useState(() => {
    return localStorage.getItem('karobaar_jarvis_voice_output') !== 'false';
  });

  // Message History & Tool Activity Log
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('karobaar_jarvis_chat_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const storeName = currentBusiness?.name || 'SAS CAFETERIA';
    return [
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: `Hello! I am ${assistantName} 3.0, your autonomous business intelligence co-pilot for **${storeName}**. You can chat with me, ask for cafeteria analytics, or tap **Live Talk** for continuous two-way voice conversations.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [activityLogs, setActivityLogs] = useState([]);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isExecutingRef = useRef(false);

  // Quick Action Suggestions Chips (Focused on Cafeteria & Store Intelligence)
  const quickChips = [
    { label: "☕ Cafeteria Daily Sales", icon: TrendingUp, query: "Show today's cafeteria sales and orders summary" },
    { label: "💰 Today's Profit Margin", icon: CreditCard, query: "How much profit did we make today?" },
    { label: "⚠️ Low Stock Alert", icon: Package, query: "Check low stock items and inventory reorder list" },
    { label: "👥 Pending Khata (Udhaar)", icon: CreditCard, query: "Who owes money in customer khata balances?" },
    { label: "🛒 POS Register", icon: ShoppingCart, query: "Open POS billing register" },
    { label: "🌓 Toggle Theme", icon: theme === 'dark' ? Sun : Moon, query: "Toggle theme" }
  ];

  // Persist Messages
  useEffect(() => {
    try {
      localStorage.setItem('karobaar_jarvis_chat_history', JSON.stringify(messages.slice(-30)));
    } catch (e) {}
  }, [messages]);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, interimTranscript, orbState, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 220);
      if (initialQuery) {
        handleExecute(initialQuery);
      }
    } else {
      jarvisSpeechService.stop();
      jarvisVoiceService.stopListening();
      setOrbState('idle');
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [isOpen]);

  // Voice output setting change
  useEffect(() => {
    jarvisSpeechService.voiceEnabled = voiceOutput;
    localStorage.setItem('karobaar_jarvis_voice_output', voiceOutput ? 'true' : 'false');
  }, [voiceOutput]);

  // Configure Voice & Speech Callbacks
  useEffect(() => {
    jarvisVoiceService.onInterimTranscript = (text) => {
      setInterimTranscript(text);
    };

    jarvisVoiceService.onFinalTranscript = (finalText) => {
      setInterimTranscript('');
      setIsListening(false);
      setOrbState('thinking');
      handleExecute(finalText);
    };

    jarvisVoiceService.onAudioLevel = (level) => {
      setAudioLevel(level);
    };

    jarvisVoiceService.onFrequencyData = (freqs) => {
      setFrequencyData(freqs);
    };

    jarvisVoiceService.onStateChange = ({ isListening: listening }) => {
      setIsListening(listening);
      if (listening) {
        setOrbState('listening');
      } else if (!isExecutingRef.current && !jarvisSpeechService.isSpeaking) {
        setOrbState('idle');
      }
    };

    jarvisSpeechService.onStart = () => {
      setIsSpeaking(true);
      setOrbState('speaking');
    };

    jarvisSpeechService.onEnd = () => {
      setIsSpeaking(false);
      setOrbState('idle');
    };

    jarvisSpeechService.onAudioLevel = (level) => {
      setAudioLevel(level);
    };

    return () => {
      jarvisSpeechService.stop();
      jarvisVoiceService.stopListening();
    };
  }, [isOpen]);

  // Toggle Mic (standard push/click to talk)
  const handleToggleMic = () => {
    if (isListening) {
      jarvisVoiceService.stopListening();
      setIsListening(false);
      setOrbState('idle');
    } else {
      if (isSpeaking) {
        jarvisSpeechService.stop();
      }
      const lang = localStorage.getItem('karobaar_ai_language') || 'en';
      const started = jarvisVoiceService.startListening(lang, false);
      if (started) {
        setIsListening(true);
        setOrbState('listening');
      }
    }
  };

  // Clear Chat History
  const handleClearHistory = () => {
    const welcome = {
      id: `msg-welcome-${Date.now()}`,
      sender: 'bot',
      text: `Chat history cleared. How may I assist your cafeteria and store operations today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcome]);
    try {
      localStorage.removeItem('karobaar_jarvis_chat_history');
    } catch (_) {}
  };

  // Execute User Query
  const handleExecute = async (queryText) => {
    const text = String(queryText || '').trim();
    if (!text || isExecutingRef.current) return;

    isExecutingRef.current = true;
    setInputText('');
    setInterimTranscript('');
    setOrbState('thinking');

    // Add user message to history
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await jarvisCommandRouter.routeCommand(text, {
        user: currentUser,
        workspace: currentBusiness,
        navigate,
        toggleTheme,
        currentTheme: theme,
        activeRoute: location.pathname,
        setVoiceOutput
      });

      // Log tool activity if present
      if (response.toolCalls && response.toolCalls.length > 0) {
        const newLogs = response.toolCalls.map(tc => ({
          id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          toolName: tc.name,
          args: tc.args,
          timestamp: new Date().toLocaleTimeString(),
          status: 'EXECUTED'
        }));
        setActivityLogs(prev => [...newLogs, ...prev]);
      }

      // Check if action requires explicit user confirmation
      if (response.requiresConfirmation && response.pendingAction) {
        setPendingConfirmation(response.pendingAction);
        setOrbState('idle');

        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: response.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          requiresConfirmation: true,
          actionDetails: response.pendingAction
        };
        setMessages(prev => [...prev, botMsg]);

        if (voiceOutput) {
          jarvisSpeechService.speak(response.text);
        }
        isExecutingRef.current = false;
        return;
      }

      // Successful completion
      setOrbState('success');
      setTimeout(() => {
        if (!jarvisSpeechService.isSpeaking) setOrbState('idle');
      }, 1500);

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);

      // Speak response out loud if voice output is enabled
      if (voiceOutput) {
        jarvisSpeechService.speak(response.text);
      }

    } catch (err) {
      console.error('[Jarvis Command Error]:', err);
      setOrbState('error');
      setTimeout(() => setOrbState('idle'), 2000);

      const errMsg = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: `I encountered an issue processing that command: ${err.message || 'Unknown error'}. All systems remain operational.`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      isExecutingRef.current = false;
    }
  };

  // Helper to render markdown formatting (bold, code, links)
  const renderFormatted = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={lIdx} className="jarvis-msg-line">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="jarvis-bold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={pIdx} className="jarvis-code">{part.slice(1, -1)}</code>;
            }
            return part;
          })}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`jarvis-copilot-container ${isMaximized ? 'copilot-maximized' : ''}`}
      role="dialog"
      aria-label={`${assistantName} 3.0 Copilot`}
    >
      {/* Optional Backdrop when Maximized */}
      {isMaximized && (
        <div 
          className="jarvis-copilot-backdrop"
          onClick={() => setIsMaximized(false)}
        />
      )}

      {/* Main Floating Copilot Card with Dark Glassmorphism */}
      <div className="jarvis-copilot-card">
        {/* Top Header */}
        <div className="jarvis-copilot-header">
          <div className="jarvis-copilot-brand">
            {/* Integrated Glowing 3.0 Orb */}
            <div className="jarvis-header-orb-wrap">
              <JarvisIntelligenceOrb 
                state={orbState}
                audioLevel={audioLevel}
                size={40}
                onClick={handleToggleMic}
                interactive={true}
              />
            </div>
            <div>
              <div className="jarvis-title-row">
                <span className="jarvis-brand-name">{assistantName}</span>
                <span className="jarvis-brand-pill">AI 3.0</span>
                <span className="jarvis-brand-model">Gemini 2.5 Flash</span>
              </div>
              <div className="jarvis-status-row">
                <span className={`jarvis-state-dot dot-${orbState}`} />
                <span className="jarvis-state-label">
                  {orbState === 'listening' ? 'Listening to voice...' :
                   orbState === 'thinking' ? 'Analyzing cafeteria records...' :
                   orbState === 'speaking' ? 'Speaking response...' :
                   orbState === 'success' ? 'Command completed' :
                   orbState === 'error' ? 'Connection retry' :
                   'Live Cafeteria Intelligence'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="jarvis-copilot-toolbar">
            {/* Dedicated Flagship LIVE TALK Button */}
            <button
              type="button"
              className="jarvis-live-talk-trigger-btn"
              onClick={() => {
                onClose();
                onOpenLiveTalk();
              }}
              title="Launch full-screen ChatGPT-style Live Voice mode"
            >
              <Radio size={14} className="live-talk-pulse-icon" />
              <span>LIVE TALK</span>
            </button>

            {/* View Mode Toggle: Chat vs Logs */}
            <div className="jarvis-view-tabs">
              <button
                type="button"
                className={`jarvis-view-tab ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
                title="Chat view"
              >
                Chat
              </button>
              <button
                type="button"
                className={`jarvis-view-tab ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
                title="Tool execution logs"
              >
                Logs {activityLogs.length > 0 ? `(${activityLogs.length})` : ''}
              </button>
            </div>

            {/* Voice Mute / Unmute */}
            <button
              type="button"
              className={`jarvis-tool-btn ${voiceOutput ? 'active' : 'muted'}`}
              onClick={() => setVoiceOutput(!voiceOutput)}
              title={voiceOutput ? "Voice output enabled (click to mute)" : "Voice output muted (click to unmute)"}
              aria-label="Toggle voice output"
            >
              {voiceOutput ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            {/* Clear History */}
            <button
              type="button"
              className="jarvis-tool-btn"
              onClick={handleClearHistory}
              title="Clear chat history"
              aria-label="Clear chat history"
            >
              <RotateCcw size={14} />
            </button>

            {/* Maximize / Restore */}
            <button
              type="button"
              className="jarvis-tool-btn"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Restore floating window" : "Maximize view"}
              aria-label="Toggle maximize"
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Close */}
            <button
              type="button"
              className="jarvis-tool-btn close-btn"
              onClick={onClose}
              title="Close Jarvis"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick Action Suggestion Carousel */}
        {activeTab === 'chat' && (
          <div className="jarvis-quick-chips-bar">
            {quickChips.map((chip, idx) => {
              const Icon = chip.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  className="jarvis-quick-chip"
                  onClick={() => handleExecute(chip.query)}
                >
                  <Icon size={12} className="jarvis-chip-icon" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Body */}
        {activeTab === 'chat' ? (
          <div className="jarvis-chat-stream">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`jarvis-message-row ${msg.sender === 'user' ? 'user-side' : 'bot-side'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="jarvis-bot-avatar">
                    <Sparkles size={12} />
                  </div>
                )}
                
                <div className={`jarvis-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'} ${msg.isError ? 'error-bubble' : ''}`}>
                  <div className="jarvis-bubble-body">
                    {renderFormatted(msg.text)}
                  </div>

                  <div className="jarvis-bubble-time">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {/* Dynamic Soundwave & Interim Voice Transcription */}
            {isListening && (
              <div className="jarvis-voice-stream-card">
                <div className="jarvis-voice-stream-head">
                  <div className="jarvis-live-mic-badge">
                    <Mic size={13} className="mic-spin" />
                    <span>Listening to your speech...</span>
                  </div>
                  {/* Dynamic Audio Waveform */}
                  <JarvisAudioWaveform 
                    state="listening"
                    audioLevel={audioLevel}
                    frequencyData={frequencyData}
                    barCount={14}
                    height={28}
                  />
                </div>
                <div className="jarvis-interim-text">
                  {interimTranscript || 'Listening to your request... speak freely'}
                </div>
              </div>
            )}

            {/* Dancing Dots Typing Indicator */}
            {orbState === 'thinking' && !isListening && (
              <div className="jarvis-message-row bot-side">
                <div className="jarvis-bot-avatar">
                  <Sparkles size={12} />
                </div>
                <div className="jarvis-bubble bot-bubble jarvis-typing-bubble">
                  <div className="jarvis-dancing-dots">
                    <span className="dot dot-1" />
                    <span className="dot dot-2" />
                    <span className="dot dot-3" />
                  </div>
                  <span className="jarvis-typing-text">Jarvis 3.0 is analyzing store records...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Activity Logs Tab */
          <div className="jarvis-activity-stream">
            {activityLogs.length === 0 ? (
              <div className="jarvis-activity-empty">
                <Layers size={32} className="jarvis-empty-icon" />
                <h4>No actions logged yet</h4>
                <p>Jarvis tool calls and cafeteria database operations will appear here in real time.</p>
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="jarvis-activity-card">
                  <div className="jarvis-act-head">
                    <span className="jarvis-act-name">{log.toolName}</span>
                    <span className="jarvis-act-time">{log.timestamp}</span>
                  </div>
                  <pre className="jarvis-act-args">
                    {JSON.stringify(log.args, null, 2)}
                  </pre>
                  <div className="jarvis-act-status">
                    <Check size={12} /> Verified Store Execution
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Input Bar */}
        <form 
          className="jarvis-copilot-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleExecute(inputText);
          }}
        >
          {/* Push to talk voice mic */}
          <button
            type="button"
            className={`jarvis-input-mic-btn ${isListening ? 'listening' : ''}`}
            onClick={handleToggleMic}
            title={isListening ? "Stop listening" : "Click to speak"}
            aria-label="Microphone"
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            className="jarvis-input-field"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening... speak now" : `Ask ${assistantName} 3.0 anything or type command...`}
            disabled={isListening}
          />

          {/* Send Button */}
          <button
            type="submit"
            className="jarvis-input-send-btn"
            disabled={!inputText.trim() || isListening}
            title="Send query (Enter)"
            aria-label="Send query"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default JarvisCommandCenter;
