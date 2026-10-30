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
  ShieldCheck,
  Layers,
  Activity
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { jarvisVoiceService } from '../../services/ai/jarvisVoiceService';
import { jarvisSpeechService } from '../../services/ai/jarvisSpeechService';
import { jarvisCommandRouter } from '../../services/ai/jarvisCommandRouter';
import { aiActionService } from '../../services/ai/aiActionService';
import './JarvisCommandCenter.css';

/**
 * JarvisCommandCenter (Redesigned Copilot 2.0)
 * Ultra-Modern Translucent Floating Copilot Panel for Karobaar.
 * Fluid spring animations, soundwave audio feedback, quick action carousel,
 * and direct store database intelligence.
 */
export const JarvisCommandCenter = ({
  isOpen = false,
  onClose = () => {},
  assistantName = 'Jarvis',
  initialQuery = ''
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
    return [
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: `Hello! I am ${assistantName}, your autonomous business intelligence co-pilot for **${currentBusiness?.name || 'your store'}**. How can I assist your operations today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [activityLogs, setActivityLogs] = useState([]);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isExecutingRef = useRef(false);

  // Quick Action Suggestions Chips
  const quickChips = [
    { label: "Today's Sales & Profit", icon: TrendingUp, query: "Show today's sales and profit summary" },
    { label: "Low Stock Items", icon: Package, query: "Check low stock alerts" },
    { label: "Pending Khata Balances", icon: CreditCard, query: "Show pending customer khata balances" },
    { label: "Open POS / New Sale", icon: ShoppingCart, query: "Open POS billing" },
    { label: "Toggle Dark Theme", icon: theme === 'dark' ? Sun : Moon, query: "Toggle theme" }
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

    jarvisVoiceService.onWakeWordDetected = () => {
      if (jarvisSpeechService.isSpeaking) {
        jarvisSpeechService.stop();
      }
      handleToggleMic();
    };

    return () => {
      jarvisSpeechService.stop();
      jarvisVoiceService.stopListening();
    };
  }, [isOpen]);

  // Toggle Mic
  const handleToggleMic = () => {
    if (isListening) {
      jarvisVoiceService.stopListening();
      setIsListening(false);
      setOrbState('idle');
    } else {
      if (isSpeaking) {
        jarvisSpeechService.stop();
      }
      const started = jarvisVoiceService.startListening();
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
      text: `Chat history cleared. How may I assist your business today?`,
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
        return;
      }

      // Successful completion
      setOrbState('success');
      setTimeout(() => {
        if (!isSpeaking) setOrbState('idle');
      }, 1500);

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);

      if (voiceOutput) {
        jarvisSpeechService.speak(response.text);
      }
    } catch (err) {
      console.error('[JarvisCommandCenter] Execution failure:', err);
      setOrbState('error');
      setTimeout(() => setOrbState('idle'), 2500);

      const errorMsg = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: `I encountered an issue processing that: ${err.message || 'Service busy'}. Please try again.`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      isExecutingRef.current = false;
    }
  };

  // Confirm Consequential Action
  const handleConfirmAction = async (actionDetails) => {
    if (!actionDetails) return;
    setOrbState('executing');
    setPendingConfirmation(null);

    try {
      const result = await aiActionService.executeAction(
        actionDetails.actionName,
        { ...actionDetails.parameters, _confirmed: true },
        { user: currentUser, workspace: currentBusiness }
      );

      setOrbState('success');
      setTimeout(() => setOrbState('idle'), 1500);

      const confirmationReply = `✓ Confirmed: ${actionDetails.summary} has been executed successfully.`;
      const confirmMsg = {
        id: `bot-conf-${Date.now()}`,
        sender: 'bot',
        text: confirmationReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, confirmMsg]);

      if (voiceOutput) {
        jarvisSpeechService.speak(confirmationReply);
      }
    } catch (err) {
      setOrbState('error');
      setTimeout(() => setOrbState('idle'), 2000);
      const errMsg = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: `Action failed: ${err.message}`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    }
  };

  // Helper to render markdown formatting (bold, code, links)
  const renderFormatted = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      // Split by bold (**text**)
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
      aria-label={`${assistantName} Copilot`}
    >
      {/* Optional Backdrop when Maximized */}
      {isMaximized && (
        <div 
          className="jarvis-copilot-backdrop"
          onClick={() => setIsMaximized(false)}
        />
      )}

      {/* Main Floating Copilot Card */}
      <div className="jarvis-copilot-card">
        {/* Top Header */}
        <div className="jarvis-copilot-header">
          <div className="jarvis-copilot-brand">
            <div className={`jarvis-header-orb state-${orbState}`}>
              {orbState === 'thinking' ? (
                <div className="jarvis-header-spinner" />
              ) : (
                <Sparkles size={14} className="jarvis-header-sparkle" />
              )}
            </div>
            <div>
              <div className="jarvis-title-row">
                <span className="jarvis-brand-name">{assistantName}</span>
                <span className="jarvis-brand-pill">AI 2.0</span>
                <span className="jarvis-brand-model">Gemini 2.5</span>
              </div>
              <div className="jarvis-status-row">
                <span className={`jarvis-state-dot dot-${orbState}`} />
                <span className="jarvis-state-label">
                  {orbState === 'listening' ? 'Listening to voice...' :
                   orbState === 'thinking' ? 'Analyzing store records...' :
                   orbState === 'speaking' ? 'Speaking...' :
                   orbState === 'executing' ? 'Executing verified action...' :
                   orbState === 'error' ? 'Connection retry' :
                   'Connected • Live Store Database'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="jarvis-copilot-toolbar">
            {/* View Mode Toggle: Chat vs Activity */}
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
              title="Close Jarvis (or press Esc)"
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

                  {/* Consequential Action Confirmation Box */}
                  {msg.requiresConfirmation && msg.actionDetails && (
                    <div className="jarvis-confirm-box">
                      <div className="jarvis-confirm-header">
                        <AlertTriangle size={15} className="jarvis-confirm-icon" />
                        <span>Action Requires Confirmation</span>
                      </div>
                      <p className="jarvis-confirm-summary">
                        {msg.actionDetails.summary}
                      </p>
                      <div className="jarvis-confirm-actions">
                        <button
                          type="button"
                          className="jarvis-confirm-btn approve"
                          onClick={() => handleConfirmAction(msg.actionDetails)}
                        >
                          <Check size={14} /> Confirm & Execute
                        </button>
                        <button
                          type="button"
                          className="jarvis-confirm-btn cancel"
                          onClick={() => {
                            setPendingConfirmation(null);
                            setMessages(prev => [
                              ...prev,
                              {
                                id: `bot-cancel-${Date.now()}`,
                                sender: 'bot',
                                text: 'Action cancelled. Your store data remains unchanged.',
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              }
                            ]);
                          }}
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  )}

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
                    <Mic size={12} className="mic-spin" />
                    <span>Listening to you...</span>
                  </div>
                  {/* Dynamic Soundbars */}
                  <div className="jarvis-stream-soundbars">
                    <span style={{ height: `${Math.max(4, audioLevel * 20)}px` }} />
                    <span style={{ height: `${Math.max(6, audioLevel * 30)}px` }} />
                    <span style={{ height: `${Math.max(4, audioLevel * 18)}px` }} />
                    <span style={{ height: `${Math.max(8, audioLevel * 26)}px` }} />
                    <span style={{ height: `${Math.max(4, audioLevel * 14)}px` }} />
                  </div>
                </div>
                <div className="jarvis-interim-text">
                  {interimTranscript || 'Speak your request clearly...'}
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
                  <span className="jarvis-typing-text">Jarvis is analyzing...</span>
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
                <p>Jarvis tool calls and verified system modifications will appear here in real-time.</p>
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
                    <Check size={12} /> Verified Execution
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
            placeholder={isListening ? "Listening... speak now" : `Ask ${assistantName} anything or type command...`}
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
