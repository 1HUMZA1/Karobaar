import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  LayoutGrid,
  MessageSquare
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/databaseService';
import { aiModelService } from '../../services/aiModelService';
import { executeKarobaarTool } from '../../services/aiToolsService';
import { KarobaarAIVisualizer } from './KarobaarAIVisualizer';
import { useKarobaarAIAudio } from './useKarobaarAIAudio';
import KarobaarLogo from '../KarobaarLogo/KarobaarLogo';
import './KarobaarAIOverlay.css';

/**
 * KarobaarAIOverlay
 * Immersive, Translucent JARVIS-Style AI Assistant HUD Overlay
 * Overlays directly on top of the main screen so users can see through the AI
 * Powered by pure black/white monochrome aesthetics, real Web Audio API, and 28 backend tools.
 */
export const KarobaarAIOverlay = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    currentBusiness, 
    theme, 
    toggleTheme, 
    appUiVersion, 
    setAppUiVersion,
    userBusinesses,
    switchBranch 
  } = useAppContext();
  const navigate = useNavigate();

  const businessId = currentUser?.activeBusinessId || 'demo-business-1';

  // HUD View Mode: 'visualizer' (Focus on Orb) | 'split' (Visualizer + Translucent Chat)
  const [hudViewMode, setHudViewMode] = useState('split');
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('karobaar_hud_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const transcriptScrollRef = useRef(null);
  const inputRef = useRef(null);

  // Handle final speech transcript from microphone
  const handleFinalSpeechTranscript = useCallback((finalText) => {
    if (finalText && finalText.trim()) {
      handleSendMessage(finalText.trim());
    }
  }, []);

  // Audio Hook for Real Mic Capture, Live RMS Level, and Speech Synthesis
  const {
    visualizerState,
    setVisualizerState,
    audioLevel,
    isListening,
    isSpeaking,
    interimTranscript,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
    speakText,
    stopSpeaking
  } = useKarobaarAIAudio({
    onFinalTranscript: handleFinalSpeechTranscript
  });

  // Save conversation in local storage
  useEffect(() => {
    try {
      localStorage.setItem('karobaar_hud_messages', JSON.stringify(messages.slice(-25)));
    } catch (e) {}
  }, [messages]);

  // Auto-scroll chat transcript to bottom
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [messages, visualizerState, interimTranscript]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } else {
      stopSpeaking();
      stopListening();
    }
  }, [isOpen]);

  // Global ESC key listener to close overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clear Chat History
  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem('karobaar_hud_messages');
    stopSpeaking();
  };

  // Submit User Message (via voice or typed input)
  const handleSendMessage = async (queryText) => {
    const query = (queryText || inputText).trim();
    if (!query) return;

    setInputText('');
    stopSpeaking();

    // 1. Instant local fast-path commands
    const lower = query.toLowerCase();
    if (/^(dark mode|enable dark mode|dark theme|switch to dark)/i.test(lower)) {
      if (theme !== 'dark') toggleTheme();
      const reply = "Switched to Dark Mode.";
      setMessages(prev => [...prev, 
        { id: 'user-' + Date.now(), role: 'user', content: query },
        { id: 'bot-' + (Date.now() + 1), role: 'assistant', content: reply }
      ]);
      if (voiceOutputEnabled) speakText(reply);
      return;
    }
    if (/^(light mode|enable light mode|light theme|switch to light)/i.test(lower)) {
      if (theme !== 'light') toggleTheme();
      const reply = "Switched to Light Mode.";
      setMessages(prev => [...prev, 
        { id: 'user-' + Date.now(), role: 'user', content: query },
        { id: 'bot-' + (Date.now() + 1), role: 'assistant', content: reply }
      ]);
      if (voiceOutputEnabled) speakText(reply);
      return;
    }

    // Add user message
    const userMsgId = 'user-' + Date.now();
    const updatedMessages = [...messages, {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    }];
    setMessages(updatedMessages);

    // Transition visualizer state to thinking
    setVisualizerState('thinking');

    try {
      const authContext = {
        db,
        businessId,
        currentBusiness,
        currentUser,
        navigate,
        theme,
        toggleTheme,
        appUiVersion,
        setAppUiVersion,
        userBusinesses,
        switchBranch
      };

      // Format conversation history
      const convHistory = updatedMessages.slice(-8).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Execute through Unified AI Model Service with real tool calling
      const result = await aiModelService.sendMessage({
        messages: convHistory,
        authContext,
        callbacks: {
          onToolStart: () => setVisualizerState('thinking')
        }
      });

      const replyContent = result.text || 'I analyzed that request.';

      // Extract spoken sentence
      let spokenSentence = result.spokenText;
      if (!spokenSentence) {
        const cleanForSpeech = replyContent
          .replace(/```[\s\S]*?```/g, 'Code block output.')
          .replace(/[*#_`]/g, '')
          .replace(/•/g, '')
          .replace(/\|.*?\|/g, '')
          .replace(/\n+/g, ' ')
          .trim();
        const sentences = cleanForSpeech.split(/[.?!]\s+/);
        spokenSentence = (sentences.slice(0, 2).join('. ') + '.').slice(0, 240);
      }

      const botMsg = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: replyContent,
        spokenText: spokenSentence,
        timestamp: new Date().toISOString(),
        actionData: result.actionData || null,
        toolLogs: result.toolLogs || [],
        requiresConfirmation: result.requiresConfirmation || false,
        confirmationAction: result.confirmationAction || null,
        quickActions: result.quickActions || []
      };

      setMessages(prev => [...prev, botMsg]);

      // Speak response if voice output enabled
      if (voiceOutputEnabled && spokenSentence) {
        speakText(spokenSentence);
      } else {
        setVisualizerState('done');
        setTimeout(() => setVisualizerState('idle'), 1500);
      }

    } catch (err) {
      console.error('HUD Query Error:', err);
      setVisualizerState('error');

      const fallbackMsg = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: `I encountered an issue processing that query: ${err.message}. Ready for your next command.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMsg]);

      setTimeout(() => setVisualizerState('idle'), 2500);
    }
  };

  // Handle Sensitive Action Confirmation
  const handleConfirmAction = async (msgId, actionObj) => {
    if (!actionObj) return;
    setVisualizerState('thinking');

    try {
      const authContext = {
        db,
        businessId,
        currentUser,
        currentBusiness,
        confirmed: true
      };

      const result = await executeKarobaarTool(actionObj.toolName, actionObj.toolArgs, authContext);

      const confirmMsg = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: result.success
          ? `✅ **Action Confirmed and Executed:**\n${result.message || JSON.stringify(result)}`
          : `❌ **Action Failed:** ${result.error}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, confirmMsg]);

      if (voiceOutputEnabled) {
        speakText(result.success ? 'Action executed successfully.' : 'Action failed.');
      } else {
        setVisualizerState('done');
        setTimeout(() => setVisualizerState('idle'), 1500);
      }

    } catch (err) {
      setVisualizerState('error');
      setMessages(prev => [...prev, {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: `Execution failed: ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="karobaar-hud-overlay-backdrop" role="dialog" aria-modal="true">
      {/* Immersive Frosted Container */}
      <div className="karobaar-hud-overlay-window">
        {/* TOP HUD HEADER */}
        <header className="karobaar-hud-header">
          <div className="karobaar-hud-header-left">
            <KarobaarLogo size="sm" isDark={true} />
            <div className="karobaar-hud-brand-wrap">
              <div className="karobaar-hud-title-row">
                <span className="karobaar-hud-title">Karobaar AI</span>
                <span className={`karobaar-hud-pulse-dot ${visualizerState}`} />
                <span className="karobaar-hud-state-badge">{visualizerState.toUpperCase()}</span>
              </div>
              <span className="karobaar-hud-tagline">Turn Work Into Growth.</span>
            </div>
          </div>

          {/* Mode Switcher & Controls */}
          <div className="karobaar-hud-header-actions">
            {/* View Mode Switcher */}
            <div className="karobaar-hud-view-toggle">
              <button 
                type="button" 
                onClick={() => setHudViewMode('visualizer')} 
                className={`hud-mode-btn ${hudViewMode === 'visualizer' ? 'active' : ''}`}
                title="Visualizer Core Mode"
              >
                <Sparkles size={13} />
                <span>Visualizer</span>
              </button>
              <button 
                type="button" 
                onClick={() => setHudViewMode('split')} 
                className={`hud-mode-btn ${hudViewMode === 'split' ? 'active' : ''}`}
                title="Split Transcript Mode"
              >
                <MessageSquare size={13} />
                <span>Transcript</span>
              </button>
            </div>

            {/* Voice Feedback Audio Toggle */}
            <button 
              type="button" 
              onClick={() => {
                if (voiceOutputEnabled) stopSpeaking();
                setVoiceOutputEnabled(!voiceOutputEnabled);
              }}
              className={`karobaar-hud-icon-btn ${!voiceOutputEnabled ? 'muted' : ''}`}
              title={voiceOutputEnabled ? "Mute Voice Feedback" : "Enable Voice Feedback"}
            >
              {voiceOutputEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            {/* Clear Chat */}
            <button 
              type="button" 
              onClick={handleClearChat}
              className="karobaar-hud-icon-btn"
              title="Clear Transcript"
            >
              <Trash2 size={15} />
            </button>

            {/* Close Overlay */}
            <button 
              type="button" 
              onClick={onClose}
              className="karobaar-hud-icon-btn close-btn"
              title="Close Karobaar AI [Esc]"
            >
              <X size={16} />
              <span className="esc-hint">ESC</span>
            </button>
          </div>
        </header>

        {/* HUD MAIN BODY */}
        <div className={`karobaar-hud-body ${hudViewMode}`}>
          {/* CENTER VISUALIZER SECTION */}
          <div className="karobaar-hud-visualizer-section">
            <KarobaarAIVisualizer 
              state={visualizerState}
              audioLevel={audioLevel}
              statusText={errorMessage || (isListening ? 'Listening to your voice...' : undefined)}
              spokenText={interimTranscript || (messages.length > 0 && messages[messages.length - 1].role === 'assistant' ? messages[messages.length - 1].spokenText : '')}
              size={hudViewMode === 'visualizer' ? 'large' : 'medium'}
              onMicClick={toggleListening}
              onStopSpeaking={stopSpeaking}
              showBranding={hudViewMode === 'visualizer'}
            />

            {/* 1-Touch Quick Command Chips */}
            <div className="karobaar-hud-quick-chips">
              <button type="button" onClick={() => handleSendMessage('Summarize today sales and revenue')} className="hud-chip">
                <TrendingUp size={12} />
                <span>Today's Sales</span>
              </button>
              <button type="button" onClick={() => handleSendMessage('Which items are low in stock?')} className="hud-chip">
                <Package size={12} />
                <span>Low Stock</span>
              </button>
              <button type="button" onClick={() => handleSendMessage('Who owes me money?')} className="hud-chip">
                <DollarSign size={12} />
                <span>Khata Debtors</span>
              </button>
              <button type="button" onClick={() => handleSendMessage('Open POS register counter')} className="hud-chip">
                <ShoppingCart size={12} />
                <span>Open POS</span>
              </button>
              <button type="button" onClick={() => handleSendMessage('Toggle dark mode')} className="hud-chip">
                <Moon size={12} />
                <span>Mode</span>
              </button>
            </div>
          </div>

          {/* TRANSLUCENT CONVERSATION TRANSCRIPT HUD */}
          {hudViewMode === 'split' && (
            <div className="karobaar-hud-transcript-section">
              <div className="karobaar-hud-messages-list custom-scrollbar" ref={transcriptScrollRef}>
                {messages.length === 0 ? (
                  <div className="hud-empty-transcript">
                    <p className="hud-empty-title">See-Through AI Command Center</p>
                    <p className="hud-empty-sub">
                      Ask any question or command Karobaar live while viewing your screen.
                    </p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`hud-message-row ${msg.role}`}>
                      <div className="hud-bubble">
                        {/* Text Content */}
                        <div className="hud-bubble-text">
                          {msg.content.split('\n').map((line, i) => (
                            <p key={i} style={{ margin: '0 0 4px 0', lineHeight: 1.5 }}>
                              {line}
                            </p>
                          ))}
                        </div>

                        {/* Executed Tools Pill */}
                        {msg.toolLogs && msg.toolLogs.length > 0 && (
                          <div className="hud-tool-tags">
                            {msg.toolLogs.map((tl, tli) => (
                              <span key={tli} className="hud-tool-tag">
                                <Sparkles size={11} />
                                <span>{tl.name}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Sensitive Confirmation Card */}
                        {msg.requiresConfirmation && msg.confirmationAction && (
                          <div className="hud-confirm-card">
                            <div className="hud-confirm-header">
                              <AlertTriangle size={14} />
                              <span>Confirmation Required</span>
                            </div>
                            <p className="hud-confirm-summary">{msg.confirmationAction.summary}</p>
                            <button 
                              type="button" 
                              onClick={() => handleConfirmAction(msg.id, msg.confirmationAction)}
                              className="hud-confirm-btn"
                            >
                              <Check size={13} />
                              <span>Confirm & Execute</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM TRANSLUCENT INPUT BAR */}
        <footer className="karobaar-hud-footer">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="karobaar-hud-input-bar"
          >
            {/* Prominent Microphone Voice Button */}
            <button 
              type="button" 
              onClick={toggleListening}
              className={`hud-input-mic-btn ${isListening ? 'listening' : ''}`}
              title={isListening ? "Stop Listening" : "Start Voice Input"}
            >
              <Mic size={18} />
              {isListening && <span className="mic-ripple" />}
            </button>

            {/* Text Input */}
            <input 
              ref={inputRef}
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={isListening ? "Listening... Speak naturally" : "Command Karobaar AI or ask anything... [Enter]"}
              className="hud-input-field"
              disabled={visualizerState === 'thinking'}
            />

            {/* Send Button */}
            <button 
              type="submit" 
              disabled={!inputText.trim() || visualizerState === 'thinking'}
              className="hud-input-send-btn"
              title="Send Command"
            >
              <Send size={16} />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default KarobaarAIOverlay;
