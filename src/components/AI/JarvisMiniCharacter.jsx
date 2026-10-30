import React, { useMemo } from 'react';
import { Mic, MicOff, Settings, Sparkles, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';
import './JarvisMiniCharacter.css';

/**
 * JarvisMiniCharacter
 * Redesigned Ultra-Modern Floating AI Capsule Dock (Linear & Apple Intelligence Inspired).
 * Positioned cleanly at bottom-right corner.
 * Features reactive visual feedback, soundwave equalizers, live status indicator, and instant copilot trigger.
 */
export const JarvisMiniCharacter = ({
  isListening = false,
  isSpeaking = false,
  isThinking = false,
  audioLevel = 0,
  voiceEnabled = true,
  assistantName = 'Jarvis',
  characterStyle = 'orb',
  isBubbleOpen = false,
  onCharacterClick = () => {},
  onSettingsClick = () => {},
  onToggleMic = () => {}
}) => {
  // Determine primary state
  const currentState = useMemo(() => {
    if (isSpeaking) return 'speaking';
    if (isThinking) return 'thinking';
    if (isListening) return 'listening';
    return 'idle';
  }, [isSpeaking, isThinking, isListening]);

  // Audio equalizer bars (3 reactive bars for voice feedback)
  const soundBars = useMemo(() => {
    const heights = [6, 14, 8];
    if (currentState === 'listening') {
      return [
        Math.max(5, Math.min(22, Math.round(6 + audioLevel * 20))),
        Math.max(8, Math.min(26, Math.round(14 + audioLevel * 24))),
        Math.max(6, Math.min(20, Math.round(8 + audioLevel * 18)))
      ];
    }
    if (currentState === 'speaking') {
      return [10, 20, 12];
    }
    return [4, 4, 4];
  }, [currentState, audioLevel]);

  const statusLabel = useMemo(() => {
    switch (currentState) {
      case 'listening': return 'Listening...';
      case 'thinking': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return 'Ready';
    }
  }, [currentState]);

  return (
    <div 
      className={`jarvis-floating-dock ${currentState} ${isBubbleOpen ? 'panel-open' : ''}`}
      role="region"
      aria-label={`${assistantName} AI Copilot`}
    >
      {/* Ambient Pulsing Aura */}
      {(currentState === 'listening' || currentState === 'speaking') && (
        <div className="jarvis-dock-aura" />
      )}

      {/* Main Interactive Pill */}
      <div 
        className="jarvis-pill-button"
        onClick={onCharacterClick}
        title={`${assistantName} AI • Click to chat or press Mic to speak`}
      >
        {/* Futuristic Glowing AI Orb Indicator */}
        <div className={`jarvis-orb-indicator state-${currentState}`}>
          {currentState === 'listening' || currentState === 'speaking' ? (
            <div className="jarvis-soundwave-mini">
              <span style={{ height: `${soundBars[0]}px` }} />
              <span style={{ height: `${soundBars[1]}px` }} />
              <span style={{ height: `${soundBars[2]}px` }} />
            </div>
          ) : currentState === 'thinking' ? (
            <div className="jarvis-spinner-ring" />
          ) : (
            <div className="jarvis-idle-core">
              <Sparkles size={13} className="jarvis-sparkle-icon" />
            </div>
          )}
        </div>

        {/* Brand & Live Status */}
        <div className="jarvis-dock-meta">
          <div className="jarvis-dock-name-row">
            <span className="jarvis-dock-name">{assistantName}</span>
            <span className="jarvis-dock-tag">AI 2.0</span>
          </div>
          <div className="jarvis-dock-sub">
            <span className={`jarvis-status-dot dot-${currentState}`} />
            <span className="jarvis-status-text">{statusLabel}</span>
          </div>
        </div>

        {/* Chat Toggle Indicator */}
        <div className="jarvis-toggle-icon-wrap">
          {isBubbleOpen ? (
            <ChevronDown size={14} className="jarvis-chevron" />
          ) : (
            <MessageSquare size={13} className="jarvis-msg-icon" />
          )}
        </div>
      </div>

      {/* Push-to-Talk Mic Quick Trigger */}
      <button
        type="button"
        className={`jarvis-mic-pill-btn ${isListening ? 'active-listening' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleMic();
        }}
        title={isListening ? "Stop listening" : "Click to speak to Jarvis"}
        aria-label="Toggle microphone"
      >
        {isListening ? (
          <div className="jarvis-mic-pulse-ring" />
        ) : null}
        <Mic size={15} />
      </button>

      {/* Settings Shortcut */}
      {onSettingsClick && (
        <button
          type="button"
          className="jarvis-settings-pill-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSettingsClick();
          }}
          title="Jarvis AI Settings"
          aria-label="Jarvis Settings"
        >
          <Settings size={14} />
        </button>
      )}
    </div>
  );
};

export default JarvisMiniCharacter;
