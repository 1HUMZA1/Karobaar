import React, { useMemo } from 'react';
import { Mic, MicOff, Settings, Sparkles, Volume2 } from 'lucide-react';
import './JarvisMiniCharacter.css';

/**
 * JarvisMiniCharacter
 * Small, lovable futuristic animated AI assistant character located in the below-left side.
 * Actively listens, reacts to human voice with audio waveforms, and engages naturally.
 *
 * States:
 * - 'idle': Gentle breathing animation, friendly digital eyes with periodic blinks, antenna radar ping
 * - 'listening': Attentive wide eyes, dynamic sound-wave bars dancing to mic audio
 * - 'thinking': Visor scanning beam, fast pulse
 * - 'speaking': Joyful eyes, mouth waveform pulsating to speech cadence
 */
export const JarvisMiniCharacter = ({
  isListening = false,
  isSpeaking = false,
  isThinking = false,
  audioLevel = 0,
  voiceEnabled = true,
  assistantName = 'Jarvis',
  characterStyle = 'robot', // 'robot' | 'orb' | 'pulse'
  isBubbleOpen = false,
  onCharacterClick = () => {},
  onSettingsClick = () => {},
  onToggleMic = () => {}
}) => {
  // Determine primary state
  const currentState = useMemo(() => {
    if (isSpeaking) return 'speaking';
    if (isThinking) return 'thinking';
    if (isListening && voiceEnabled) return 'listening';
    return 'idle';
  }, [isSpeaking, isThinking, isListening, voiceEnabled]);

  // Audio waveform bars (3 left, 3 right)
  const miniBars = useMemo(() => {
    const base = [8, 16, 24];
    return base.map((h, i) => {
      if (currentState === 'listening') {
        const factor = 0.5 + audioLevel * 1.5 + Math.sin(i * 1.5 + Date.now() / 150) * 0.4;
        return Math.max(5, Math.min(28, Math.round(h * factor)));
      }
      if (currentState === 'speaking') {
        const factor = 0.7 + Math.sin(i * 2 + Date.now() / 120) * 0.5;
        return Math.max(6, Math.min(26, Math.round(h * factor)));
      }
      return 6; // idle flat dot
    });
  }, [currentState, audioLevel]);

  return (
    <div 
      className={`jarvis-mini-character-dock ${currentState} ${isBubbleOpen ? 'bubble-open' : ''}`}
      role="region"
      aria-label={`${assistantName} Voice Assistant Character`}
    >
      {/* Mini Robot Avatar Button */}
      <div 
        className="jarvis-avatar-container"
        onClick={onCharacterClick}
        title={`${assistantName} AI • Click to speak or chat (Press or say "Hey ${assistantName}")`}
      >
        {/* Radar Pulse Rings (when listening or waking) */}
        {(currentState === 'listening' || currentState === 'speaking') && (
          <div className="jarvis-pulse-ring-ambient" />
        )}

        {/* Small Animated Character SVG based on Character Style */}
        <div className="jarvis-svg-wrap">
          {characterStyle === 'orb' ? (
            <svg 
              viewBox="0 0 100 100" 
              className={`jarvis-character-svg style-orb state-${currentState}`}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="jarvisOrbGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <circle cx="50" cy="50" r="42" fill="#09090b" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="34" fill="none" stroke="#71717a" strokeWidth="1.2" strokeDasharray="6 4" className="orb-ring-outer" />
              <circle cx="50" cy="50" r="24" fill="none" stroke="#d4d4d8" strokeWidth="1.4" strokeDasharray="4 3" className="orb-ring-mid" />
              <circle cx="50" cy="50" r="13" fill="#ffffff" filter="url(#jarvisOrbGlow)" className="orb-core" />
            </svg>
          ) : characterStyle === 'pulse' ? (
            <svg 
              viewBox="0 0 100 100" 
              className={`jarvis-character-svg style-pulse state-${currentState}`}
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" r="42" fill="#09090b" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="25" y="40" width="7" height="20" rx="3.5" fill="#a1a1aa" className="pulse-bar-1" />
              <rect x="37" y="28" width="7" height="44" rx="3.5" fill="#e4e4e7" className="pulse-bar-2" />
              <rect x="49" y="18" width="7" height="64" rx="3.5" fill="#ffffff" className="pulse-bar-3" />
              <rect x="61" y="28" width="7" height="44" rx="3.5" fill="#e4e4e7" className="pulse-bar-4" />
              <rect x="73" y="40" width="7" height="20" rx="3.5" fill="#a1a1aa" className="pulse-bar-5" />
            </svg>
          ) : (
            <svg 
              viewBox="0 0 100 100" 
              className={`jarvis-character-svg style-robot state-${currentState}`}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="jarvisGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="jarvisHelmetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#27272a" />
                  <stop offset="100%" stopColor="#09090b" />
                </linearGradient>
                <linearGradient id="jarvisVisorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#18181b" />
                  <stop offset="100%" stopColor="#000000" />
                </linearGradient>
              </defs>

              {/* Top Antenna */}
              <g className="jarvis-antenna">
                <rect x="48" y="6" width="4" height="15" rx="2" fill="#71717a" stroke="#d4d4d8" strokeWidth="0.75" />
                <circle 
                  cx="50" 
                  cy="6" 
                  r="4.5" 
                  fill="#ffffff" 
                  className="antenna-tip-light" 
                  filter="url(#jarvisGlow)" 
                />
              </g>

              {/* Left and Right Ear Muffs (Audio Receivers) */}
              <rect x="11" y="38" width="6" height="24" rx="3" fill="#3f3f46" stroke="#ffffff" strokeWidth="0.8" />
              <rect x="83" y="38" width="6" height="24" rx="3" fill="#3f3f46" stroke="#ffffff" strokeWidth="0.8" />

              {/* Outer Helmet Head */}
              <rect 
                x="16" 
                y="20" 
                width="68" 
                height="60" 
                rx="22" 
                fill="url(#jarvisHelmetGrad)" 
                stroke="#ffffff" 
                strokeWidth="1.8" 
                className="jarvis-helmet-body"
              />

              {/* Inner Visor Display */}
              <rect 
                x="23" 
                y="28" 
                width="54" 
                height="44" 
                rx="15" 
                fill="url(#jarvisVisorGrad)" 
                stroke="rgba(255, 255, 255, 0.35)" 
                strokeWidth="1" 
                className="jarvis-visor"
              />

              {/* STATE-BASED DIGITAL FACE EXPRESSIONS */}
              {currentState === 'listening' ? (
                /* LISTENING: Wide alert attentive eyes */
                <g className="jarvis-face-listening">
                  <rect x="31" y="42" width="11" height="16" rx="5.5" fill="#ffffff" filter="url(#jarvisGlow)" className="eye-listening-l" />
                  <rect x="58" y="42" width="11" height="16" rx="5.5" fill="#ffffff" filter="url(#jarvisGlow)" className="eye-listening-r" />
                  {/* Listening mouth waveform indicator */}
                  <path d="M 44 63 Q 50 67 56 63" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />
                </g>
              ) : currentState === 'speaking' ? (
                /* SPEAKING: Happy animated eyes + speaking mouth */
                <g className="jarvis-face-speaking">
                  <path d="M 32 49 Q 38 41 44 49" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#jarvisGlow)" />
                  <path d="M 56 49 Q 62 41 68 49" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#jarvisGlow)" />
                  {/* Mouth wave */}
                  <rect x="42" y="60" width="16" height="4" rx="2" fill="#ffffff" filter="url(#jarvisGlow)" className="mouth-speaking-bar" />
                </g>
              ) : currentState === 'thinking' ? (
                /* THINKING: Scanning visor beam */
                <g className="jarvis-face-thinking">
                  <rect x="28" y="46" width="14" height="8" rx="4" fill="#ffffff" className="eye-thinking-l" />
                  <rect x="58" y="46" width="14" height="8" rx="4" fill="#ffffff" className="eye-thinking-r" />
                  <rect x="25" y="48" width="50" height="3" rx="1.5" fill="#ffffff" filter="url(#jarvisGlow)" className="visor-scan-beam" />
                </g>
              ) : (
                /* IDLE: Calm, friendly curved eyes with natural blinking */
                <g className="jarvis-face-idle">
                  <path d="M 32 47 Q 38 44 44 47" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" className="eye-idle-l" />
                  <path d="M 56 47 Q 62 44 68 47" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" className="eye-idle-r" />
                  {/* Tiny friendly smile dot */}
                  <circle cx="50" cy="58" r="1.5" fill="rgba(255, 255, 255, 0.7)" />
                </g>
              )}
            </svg>
          )}
        </div>

        {/* Live Audio Waves (Beside the character) */}
        {(currentState === 'listening' || currentState === 'speaking') && (
          <div className="jarvis-side-soundwaves">
            {miniBars.map((h, i) => (
              <span 
                key={`mini-bar-${i}`} 
                className="mini-soundwave-bar" 
                style={{ height: `${h}px` }} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Pill Badge with Status & Quick Controls */}
      <div className="jarvis-character-badge">
        <button 
          type="button" 
          className="jarvis-status-pill-btn"
          onClick={onCharacterClick}
          title={currentState === 'listening' ? "Listening... click to pause" : "Click to speak with Jarvis"}
        >
          <span className={`status-dot ${currentState}`} />
          <span className="status-name">{assistantName}</span>
          <span className="status-state-desc">
            {currentState === 'listening' 
              ? 'Listening...' 
              : currentState === 'speaking' 
                ? 'Speaking...' 
                : currentState === 'thinking' 
                  ? 'Thinking...' 
                  : 'Ready'}
          </span>
        </button>

        {/* Mic Toggle Button */}
        <button 
          type="button" 
          onClick={(e) => {
            e.stopPropagation();
            onToggleMic();
          }} 
          className={`jarvis-pill-icon-btn ${isListening ? 'active' : 'muted'}`}
          title={isListening ? "Mute Microphone" : "Turn on Microphone"}
        >
          {isListening ? <Mic size={12} /> : <MicOff size={12} />}
        </button>

        {/* Settings Button */}
        <button 
          type="button" 
          onClick={(e) => {
            e.stopPropagation();
            onSettingsClick();
          }} 
          className="jarvis-pill-icon-btn"
          title="Open Jarvis Voice & AI Settings"
        >
          <Settings size={12} />
        </button>
      </div>
    </div>
  );
};

export default JarvisMiniCharacter;
