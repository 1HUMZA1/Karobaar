import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Square, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw, 
  ChevronRight, 
  Check, 
  AlertTriangle,
  Maximize2,
  Minimize2,
  Settings,
  HelpCircle,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import JarvisIntelligenceOrb from './JarvisIntelligenceOrb';
import { jarvisVoiceService } from '../../services/ai/jarvisVoiceService';
import { jarvisSpeechService } from '../../services/ai/jarvisSpeechService';
import { jarvisCommandRouter } from '../../services/ai/jarvisCommandRouter';
import { aiActionService } from '../../services/ai/aiActionService';
import './JarvisCommandCenter.css';

/**
 * JarvisCommandCenter
 * Next-Generation Autonomous AI Co-Pilot for Karobaar
 * Features the reactive intelligence orb avatar, real-time voice recognition,
 * Gemini 2.5 tool execution, and consequential action confirmation.
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
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'activity' | 'settings'

  // Preferences & Toggles
  const [voiceOutput, setVoiceOutput] = useState(() => {
    return localStorage.getItem('karobaar_jarvis_voice_output') !== 'false';
  });
  const [handsFree, setHandsFree] = useState(() => {
    return localStorage.getItem('karobaar_jarvis_hands_free') === 'true';
  });
  const [wakeWordEnabled, setWakeWordEnabled] = useState(() => {
    return localStorage.getItem('karobaar_jarvis_wake_word') === 'true';
  });
  const [isMaximized, setIsMaximized] = useState(false);

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
        text: `Hello! I am ${assistantName}, your autonomous business intelligence co-pilot for ${currentBusiness?.name || 'your store'}. How can I assist your operations today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [activityLogs, setActivityLogs] = useState([]);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isExecutingRef = useRef(false);

  // Persist Messages
  useEffect(() => {
    try {
      localStorage.setItem('karobaar_jarvis_chat_history', JSON.stringify(messages.slice(-30)));
    } catch (e) {}
  }, [messages]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript, orbState]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      if (initialQuery) {
        handleExecute(initialQuery);
      }
    } else {
      jarvisSpeechService.stop();
      jarvisVoiceService.stopListening();
      setOrbState('idle');
    }
  }, [isOpen]);

  // Voice output setting change
  useEffect(() => {
    jarvisSpeechService.voiceEnabled = voiceOutput;
    localStorage.setItem('karobaar_jarvis_voice_output', voiceOutput ? 'true' : 'false');
  }, [voiceOutput]);

  // Hands-free setting change
  useEffect(() => {
    localStorage.setItem('karobaar_jarvis_hands_free', handsFree ? 'true' : 'false');
  }, [handsFree]);

  // Wake-word setup
  useEffect(() => {
    if (wakeWordEnabled && !isListening && !isSpeaking) {
      jarvisVoiceService.startWakeWordListening(assistantName.toLowerCase());
    } else {
      jarvisVoiceService.stopWakeWordListening();
    }
    localStorage.setItem('karobaar_jarvis_wake_word', wakeWordEnabled ? 'true' : 'false');
  }, [wakeWordEnabled, assistantName, isListening, isSpeaking]);

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
      // If hands-free mode is enabled, start listening for next turn
      if (handsFree && isOpen) {
        setTimeout(() => {
          handleToggleMic();
        }, 500);
      }
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
  }, [handsFree, isOpen]);

  // Toggle Mic (Push-to-talk / Click-to-talk)
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

  // Stop Generation / Cancel
  const handleStop = () => {
    isExecutingRef.current = false;
    jarvisSpeechService.stop();
    jarvisVoiceService.stopListening();
    setIsListening(false);
    setIsSpeaking(false);
    setOrbState('idle');
    setPendingConfirmation(null);
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
        activeRoute: location.pathname
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
        text: `I ran into an issue: ${err.message}. Please try again.`,
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

  if (!isOpen) return null;

  return (
    <div className={`jarvis-command-center-backdrop ${isMaximized ? 'maximized' : ''}`}>
      <div 
        className="jarvis-command-center-panel"
        role="dialog"
        aria-label={`${assistantName} Command Center`}
      >
        {/* Top Header Bar */}
        <div className="jarvis-cc-header">
          <div className="jarvis-cc-identity">
            <div className="jarvis-cc-orb-wrap">
              <JarvisIntelligenceOrb 
                state={orbState}
                audioLevel={audioLevel}
                size={44}
                showRings={false}
                interactive={false}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="jarvis-cc-title">{assistantName}</h3>
                <span className="jarvis-cc-badge">AI 2.0</span>
                <span className="jarvis-cc-model">Gemini 2.5 Flash</span>
              </div>
              <div className="jarvis-cc-status">
                <span className={`status-indicator ${orbState}`} />
                <span className="status-label">
                  {orbState === 'listening' ? 'Listening to voice...' :
                   orbState === 'thinking' ? 'Analyzing business context...' :
                   orbState === 'speaking' ? 'Speaking...' :
                   orbState === 'executing' ? 'Executing verified action...' :
                   orbState === 'error' ? 'Connection fault' :
                   'Ready • Connected to store database'}
                </span>
              </div>
            </div>
          </div>

          <div className="jarvis-cc-controls">
            {/* View Tabs */}
            <div className="jarvis-cc-tabs">
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
                title="Command & Chat"
              >
                Chat
              </button>
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
                title="Real-time Tool Execution Logs"
              >
                Activity ({activityLogs.length})
              </button>
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
                title="Voice & Preferences"
              >
                Preferences
              </button>
            </div>

            {/* Audio Voice Toggle */}
            <button 
              type="button"
              className={`control-btn ${voiceOutput ? 'active' : ''}`}
              onClick={() => setVoiceOutput(!voiceOutput)}
              title={voiceOutput ? "Voice output enabled (click to mute)" : "Voice output muted (click to enable)"}
            >
              {voiceOutput ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Maximize Toggle */}
            <button 
              type="button"
              className="control-btn"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Restore size" : "Maximize view"}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button 
              type="button"
              className="control-btn close-btn"
              onClick={onClose}
              title="Close Jarvis"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Hero Interactive Orb (Centered in Chat View) */}
        {activeTab === 'chat' && (
          <div className="jarvis-cc-hero-visualizer">
            <JarvisIntelligenceOrb 
              state={orbState}
              audioLevel={audioLevel}
              size={isMaximized ? 210 : 150}
              showRings={true}
              interactive={true}
              onClick={handleToggleMic}
            />
            {isListening && (
              <div className="jarvis-cc-listening-prompt">
                <span className="live-mic-dot" />
                <span>{interimTranscript || "Listening... speak your command"}</span>
              </div>
            )}
          </div>
        )}

        {/* Content Body: Chat Stream */}
        {activeTab === 'chat' && (
          <div className="jarvis-cc-messages-scroll" role="log">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`jarvis-msg-row ${msg.sender === 'user' ? 'user-side' : 'bot-side'}`}
              >
                <div className="jarvis-msg-bubble">
                  <div className="msg-content">
                    {msg.text}
                  </div>

                  {/* Reviewable Consequential Confirmation Action Card */}
                  {msg.requiresConfirmation && msg.actionDetails && (
                    <div className="jarvis-confirmation-card">
                      <div className="confirmation-header">
                        <ShieldCheck size={16} />
                        <span>Action Review Required</span>
                      </div>
                      <div className="confirmation-summary">
                        {msg.actionDetails.summary}
                      </div>
                      <div className="confirmation-actions">
                        <button
                          type="button"
                          className="confirm-btn-primary"
                          onClick={() => handleConfirmAction(msg.actionDetails)}
                        >
                          <Check size={14} /> Confirm & Execute
                        </button>
                        <button
                          type="button"
                          className="confirm-btn-secondary"
                          onClick={() => handleStop()}
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <span className="msg-timestamp">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Content Body: Activity Tool Logs */}
        {activeTab === 'activity' && (
          <div className="jarvis-cc-activity-panel">
            <div className="activity-panel-header">
              <Activity size={16} />
              <h4>Live Application Tool Activity</h4>
            </div>
            {activityLogs.length === 0 ? (
              <div className="activity-empty">
                <Layers size={32} />
                <p>No backend tool calls executed yet in this session.</p>
                <span>Ask about sales, stock, or customer balances to see real-time database queries.</span>
              </div>
            ) : (
              <div className="activity-list">
                {activityLogs.map(log => (
                  <div key={log.id} className="activity-item">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs">{log.toolName}</span>
                      <span className="text-[10px] text-zinc-400">{log.timestamp}</span>
                    </div>
                    <pre className="activity-args">
                      {JSON.stringify(log.args, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Body: Preferences Panel */}
        {activeTab === 'settings' && (
          <div className="jarvis-cc-preferences-panel">
            <h4>Jarvis Voice & Interaction Settings</h4>
            
            <label className="pref-toggle-row">
              <div>
                <span className="pref-label">Spoken Voice Responses</span>
                <span className="pref-sub">Jarvis reads business answers aloud via speech synthesis</span>
              </div>
              <input 
                type="checkbox" 
                checked={voiceOutput} 
                onChange={e => setVoiceOutput(e.target.checked)} 
              />
            </label>

            <label className="pref-toggle-row">
              <div>
                <span className="pref-label">Hands-Free Conversation</span>
                <span className="pref-sub">Automatically listens for follow-up question after speaking</span>
              </div>
              <input 
                type="checkbox" 
                checked={handsFree} 
                onChange={e => setHandsFree(e.target.checked)} 
              />
            </label>

            <label className="pref-toggle-row">
              <div>
                <span className="pref-label">Wake-Word Detection</span>
                <span className="pref-sub">Listens continuously for "Hey Jarvis" or "{assistantName}"</span>
              </div>
              <input 
                type="checkbox" 
                checked={wakeWordEnabled} 
                onChange={e => setWakeWordEnabled(e.target.checked)} 
              />
            </label>

            <div className="pref-info-block">
              <span className="font-bold block mb-1">Active AI Model</span>
              <span className="text-zinc-400 text-xs">Gemini 2.5 Flash • Official Google GenAI SDK v2.31.0</span>
            </div>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        {activeTab === 'chat' && (
          <div className="jarvis-cc-quick-chips">
            <button type="button" onClick={() => handleExecute("How much did my business sell today?")}>
              Today's Sales
            </button>
            <button type="button" onClick={() => handleExecute("Which products are running low?")}>
              Low Stock
            </button>
            <button type="button" onClick={() => handleExecute("Audit store health and recommendations")}>
              Store Briefing
            </button>
            <button type="button" onClick={() => handleExecute("Who owes me money?")}>
              Customer Udhaar
            </button>
            <button type="button" onClick={() => handleExecute("Switch display mode")}>
              Dark / Light
            </button>
            <button type="button" onClick={() => handleExecute("What can Jarvis do?")}>
              Capabilities
            </button>
          </div>
        )}

        {/* Bottom Input Command Bar */}
        <form className="jarvis-cc-input-bar" onSubmit={(e) => { e.preventDefault(); handleExecute(inputText); }}>
          <button
            type="button"
            className={`mic-button ${isListening ? 'listening' : ''}`}
            onClick={handleToggleMic}
            title={isListening ? "Listening... click to stop" : "Click to speak voice command"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            ref={inputRef}
            type="text"
            className="command-text-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={isListening ? "Listening... speak now" : "Type a command or ask Jarvis anything..."}
          />

          {(orbState === 'thinking' || isSpeaking) ? (
            <button
              type="button"
              className="stop-button"
              onClick={handleStop}
              title="Stop generation"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              type="submit"
              className="send-button"
              disabled={!inputText.trim()}
              title="Send command"
            >
              <Send size={16} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default JarvisCommandCenter;
