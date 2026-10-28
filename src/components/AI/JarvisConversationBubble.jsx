import React, { useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Settings, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  TrendingUp, 
  AlertTriangle, 
  Moon, 
  Sun, 
  ShoppingCart, 
  DollarSign,
  Maximize2
} from 'lucide-react';
import './JarvisConversationBubble.css';

/**
 * JarvisConversationBubble
 * Elegant, human-like floating conversational dialog anchored right above the mini character.
 * Displays live voice transcription ("see my voice") and answers in clear conversational prose.
 */
export const JarvisConversationBubble = ({
  isOpen = false,
  onClose = () => {},
  assistantName = 'Jarvis',
  messages = [],
  interimTranscript = '',
  isListening = false,
  isSpeaking = false,
  isTyping = false,
  voiceEnabled = true,
  theme = 'light',
  onSendMessage = () => {},
  onToggleMic = () => {},
  onStopSpeaking = () => {},
  onOpenSettings = () => {},
  onOpenFullHud = () => {}
}) => {
  const [inputText, setInputText] = React.useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, interimTranscript, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleChipClick = (query) => {
    onSendMessage(query);
  };

  // Helper to render markdown bolding
  const renderFormatted = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="bubble-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Get last 4 messages to keep bubble clean and simple
  const recentMessages = messages.slice(-6);

  return (
    <div 
      className="jarvis-conv-bubble-panel"
      role="dialog"
      aria-label={`${assistantName} Voice Conversation`}
    >
      {/* Header */}
      <div className="jarvis-bubble-header">
        <div className="jarvis-bubble-brand">
          <div className="jarvis-bubble-bot-avatar">
            <Sparkles size={13} />
          </div>
          <div>
            <h4 className="jarvis-bubble-title">{assistantName}</h4>
            <span className="jarvis-bubble-subtitle">
              {isSpeaking ? (
                <span className="state-pulse speaking">● Speaking to you...</span>
              ) : isListening ? (
                <span className="state-pulse listening">● Listening... speak now</span>
              ) : isTyping ? (
                <span className="state-pulse thinking">● Thinking...</span>
              ) : (
                <span>Ready • Say "Hey {assistantName}"</span>
              )}
            </span>
          </div>
        </div>

        <div className="jarvis-bubble-actions">
          {/* Full Screen HUD option */}
          <button 
            type="button" 
            onClick={onOpenFullHud}
            className="jarvis-bubble-tool-btn" 
            title="Expand to Full HUD"
          >
            <Maximize2 size={13} />
          </button>

          {/* Settings */}
          <button 
            type="button" 
            onClick={onOpenSettings}
            className="jarvis-bubble-tool-btn" 
            title="Jarvis Settings"
          >
            <Settings size={13} />
          </button>

          {/* Close / Minimize */}
          <button 
            type="button" 
            onClick={onClose}
            className="jarvis-bubble-tool-btn close-btn" 
            title="Close conversation"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="jarvis-bubble-body custom-scrollbar">
        {recentMessages.length === 0 && !interimTranscript && (
          <div className="jarvis-bubble-empty">
            <p className="empty-greeting">
              "Hello! Say <strong>"Hey {assistantName}"</strong> or tap the microphone to have a conversation."
            </p>
          </div>
        )}

        {recentMessages.map((msg) => (
          <div key={msg.id} className={`bubble-msg-row ${msg.sender === 'user' ? 'user-side' : 'bot-side'}`}>
            <div className={`bubble-card ${msg.sender === 'user' ? 'user-card' : 'bot-card'}`}>
              <div className="bubble-text">
                {msg.text.split('\n').map((line, lIdx) => (
                  <p key={lIdx} style={{ margin: '0 0 3px 0' }}>
                    {renderFormatted(line)}
                  </p>
                ))}
              </div>

              {msg.sender === 'bot' && isSpeaking && msg.spokenText && (
                <div className="bubble-speaking-bar-indicator">
                  <span className="bar b1" />
                  <span className="bar b2" />
                  <span className="bar b3" />
                  <button type="button" onClick={onStopSpeaking} className="stop-speech-mini-btn" title="Stop speaking">
                    Stop
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live Recognized User Speech ("See My Voice") */}
        {interimTranscript && (
          <div className="bubble-msg-row user-side">
            <div className="bubble-card user-card interim-voice-card">
              <span className="voice-wave-dot" />
              <p className="interim-text">“{interimTranscript}”</p>
            </div>
          </div>
        )}

        {/* Thinking Indicator */}
        {isTyping && !interimTranscript && (
          <div className="bubble-msg-row bot-side">
            <div className="bubble-card bot-card typing-card">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggested Chips */}
      <div className="jarvis-bubble-quick-chips">
        <button type="button" onClick={() => handleChipClick('Show today sales summary')} className="bubble-chip">
          <TrendingUp size={11} />
          <span>Sales</span>
        </button>
        <button type="button" onClick={() => handleChipClick('Which items are low in stock?')} className="bubble-chip">
          <AlertTriangle size={11} />
          <span>Low Stock</span>
        </button>
        <button type="button" onClick={() => handleChipClick('Who owes me money?')} className="bubble-chip">
          <DollarSign size={11} />
          <span>Debtors</span>
        </button>
        <button type="button" onClick={() => handleChipClick(theme === 'dark' ? 'switch to light mode' : 'switch to dark mode')} className="bubble-chip">
          {theme === 'dark' ? <Sun size={11} /> : <Moon size={11} />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="jarvis-bubble-input-bar">
        {/* Mic Button */}
        <button 
          type="button" 
          onClick={onToggleMic} 
          className={`bubble-mic-btn ${isListening ? 'active-listening' : ''}`}
          title={isListening ? "Listening... click to stop" : "Start speaking"}
        >
          {isListening ? <Mic size={15} /> : <MicOff size={15} />}
        </button>

        <input 
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Talk or type to ${assistantName}...`}
          className="bubble-text-input"
        />

        <button 
          type="submit" 
          disabled={!inputText.trim()}
          className="bubble-send-btn"
          title="Send message"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

export default JarvisConversationBubble;
