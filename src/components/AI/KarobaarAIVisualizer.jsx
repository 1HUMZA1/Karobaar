import React, { useMemo } from 'react';
import { Mic, Sparkles, Volume2, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';
import './KarobaarAIVisualizer.css';

/**
 * KarobaarAIVisualizer
 * Premium Futuristic JARVIS-style Animated AI Assistant Visualizer
 * Pure Black, White, Charcoal & Subtle Grey Palette.
 * Zero neon colors, zero static images. 100% SVG + CSS keyframe animations.
 *
 * States:
 * 1. idle       - Gentle breathing pulse, slow orbital rings
 * 2. listening  - Reactive sound waves, mic audio levels, expanding ripples
 * 3. thinking   - Fast spinning rings, orbiting particles, scanning eyes
 * 4. speaking   - Rhythmically pulsing sound-wave bars, audio playback cadence
 * 5. done       - Subtle completion sparkle, smooth transition back to idle
 * 6. error      - Warning indicator with retry feedback
 */
export const KarobaarAIVisualizer = ({
  state = 'idle',            // 'idle' | 'listening' | 'thinking' | 'speaking' | 'done' | 'error'
  audioLevel = 0,            // 0.0 to 1.0 (real audio input volume)
  statusText = '',           // Custom subtitle or status override
  spokenText = '',           // Spoken transcript or response snippet
  size = 'medium',           // 'small' | 'medium' | 'large'
  onMicClick = null,
  onStopSpeaking = null,
  showBranding = true
}) => {
  // Normalize state
  const currentState = useMemo(() => {
    const s = String(state || 'idle').toLowerCase();
    if (['listening', 'thinking', 'speaking', 'done', 'error'].includes(s)) return s;
    return 'idle';
  }, [state]);

  // Waveform Bar Heights generator based on state and audio level
  const waveformBars = useMemo(() => {
    // 8 bilateral bars: left and right
    const baseHeights = [10, 16, 26, 38, 48, 32, 18, 12];
    
    return baseHeights.map((h, i) => {
      let scale = 1;
      if (currentState === 'listening') {
        // Boosted by real mic volume + dynamic phase
        const dynamicPhase = Math.sin((i + 1) * 0.8) * 0.4 + 0.6;
        scale = 0.5 + (audioLevel * 1.8 + dynamicPhase * 0.5);
      } else if (currentState === 'speaking') {
        // Rhythmic speaking pulse
        const speakPhase = Math.sin((i * 1.2) + Date.now() / 140) * 0.5 + 0.9;
        scale = speakPhase;
      } else if (currentState === 'thinking') {
        // Traveling wave
        scale = 0.4 + (i % 3 === 0 ? 0.6 : 0.2);
      } else if (currentState === 'done') {
        scale = 0.6;
      } else {
        // Idle
        scale = 0.35 + Math.sin(i * 0.5) * 0.15;
      }
      return Math.max(6, Math.min(60, Math.round(h * scale)));
    });
  }, [currentState, audioLevel]);

  // Pill badge configuration
  const pillConfig = useMemo(() => {
    switch (currentState) {
      case 'listening':
        return {
          icon: <Mic size={14} className="karobaar-pill-icon pulse-mic" />,
          label: "I'm listening...",
          className: 'pill-listening'
        };
      case 'thinking':
        return {
          icon: <Sparkles size={14} className="karobaar-pill-icon spin-sparkle" />,
          label: statusText || 'Thinking...',
          className: 'pill-thinking'
        };
      case 'speaking':
        return {
          icon: <Volume2 size={14} className="karobaar-pill-icon pulse-wave" />,
          label: 'Speaking...',
          className: 'pill-speaking'
        };
      case 'done':
        return {
          icon: <CheckCircle2 size={14} className="karobaar-pill-icon" />,
          label: 'Ready for next question',
          className: 'pill-done'
        };
      case 'error':
        return {
          icon: <AlertTriangle size={14} className="karobaar-pill-icon" />,
          label: statusText || 'Microphone Error',
          className: 'pill-error'
        };
      case 'idle':
      default:
        return {
          icon: <Radio size={14} className="karobaar-pill-icon idle-dot" />,
          label: statusText || 'Ready when you are.',
          className: 'pill-idle'
        };
    }
  }, [currentState, statusText]);

  return (
    <div className={`karobaar-ai-visualizer-root size-${size} state-${currentState}`}>
      {/* Top Futuristic Speech Pill */}
      <div className={`karobaar-status-speech-pill ${pillConfig.className}`} role="status" aria-live="polite">
        {pillConfig.icon}
        <span className="pill-text">{pillConfig.label}</span>
      </div>

      {/* Main Interactive Animated Robot Core Visualizer */}
      <div className="karobaar-core-container">
        <svg 
          viewBox="0 0 420 340" 
          className="karobaar-visualizer-svg"
          aria-hidden="true"
        >
          <defs>
            {/* Glow Filter for White Accents */}
            <filter id="whiteGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle Soft Shadow */}
            <filter id="coreDropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#000000" floodOpacity="0.85" />
            </filter>

            {/* Metallic Helmet Gradient */}
            <linearGradient id="helmetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2c2c34" />
              <stop offset="35%" stopColor="#18181c" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>

            {/* Glowing White Rim Highlight */}
            <linearGradient id="whiteRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#d4d4d8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#52525b" stopOpacity="0.4" />
            </linearGradient>

            {/* Ear Pod Gradient */}
            <linearGradient id="earPodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="50%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#27272a" />
            </linearGradient>

            {/* Subtle Particle Radial */}
            <radialGradient id="particleGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* BACKGROUND CONCENTRIC RINGS */}
          <g className="concentric-rings-group">
            {/* Outer Ring 3 */}
            <circle 
              cx="210" 
              cy="170" 
              r="155" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.12)" 
              strokeWidth="1.2" 
              strokeDasharray="4 8"
              className="orbital-ring ring-outer"
            />

            {/* Middle Ring 2 with Orbiting Particles */}
            <circle 
              cx="210" 
              cy="170" 
              r="128" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.22)" 
              strokeWidth="1.5" 
              strokeDasharray="14 18"
              className="orbital-ring ring-middle"
            />

            {/* Orbiting Particle Dots on Middle Ring */}
            <g className="orbiting-particles-group">
              <circle cx="210" cy="42" r="3" fill="#ffffff" filter="url(#whiteGlow)" className="particle dot-1" />
              <circle cx="338" cy="170" r="2.5" fill="#ffffff" filter="url(#whiteGlow)" className="particle dot-2" />
              <circle cx="210" cy="298" r="3" fill="#ffffff" filter="url(#whiteGlow)" className="particle dot-3" />
              <circle cx="82" cy="170" r="2.5" fill="#ffffff" filter="url(#whiteGlow)" className="particle dot-4" />
            </g>

            {/* Inner Ring 1 */}
            <circle 
              cx="210" 
              cy="170" 
              r="102" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.35)" 
              strokeWidth="1.6" 
              strokeDasharray="8 6"
              className="orbital-ring ring-inner"
            />

            {/* Audio Acoustic Wave Expanding Ring (Listening / Speaking) */}
            {(currentState === 'listening' || currentState === 'speaking') && (
              <>
                <circle 
                  cx="210" 
                  cy="170" 
                  r="92" 
                  fill="none" 
                  stroke="rgba(255, 255, 255, 0.4)" 
                  strokeWidth="1.8" 
                  className="sonic-ripple sonic-ripple-1" 
                />
                <circle 
                  cx="210" 
                  cy="170" 
                  r="92" 
                  fill="none" 
                  stroke="rgba(255, 255, 255, 0.25)" 
                  strokeWidth="1.4" 
                  className="sonic-ripple sonic-ripple-2" 
                />
              </>
            )}
          </g>

          {/* BILATERAL SOUND-WAVE BARS */}
          <g className="soundwave-bars-group">
            {/* Left Sound Wave Bars (Radiating outwards to the left) */}
            {waveformBars.slice().reverse().map((height, idx) => {
              // x coordinates: 35, 48, 61, 74, 87, 100, 113, 126
              const xPos = 35 + idx * 13;
              const yPos = 170 - height / 2;
              return (
                <rect 
                  key={`wave-left-${idx}`}
                  x={xPos} 
                  y={yPos} 
                  width="3.5" 
                  height={height} 
                  rx="1.75" 
                  fill="rgba(255, 255, 255, 0.75)"
                  filter={idx > 4 ? "url(#whiteGlow)" : undefined}
                  className={`waveform-bar bar-l-${idx}`}
                />
              );
            })}

            {/* Right Sound Wave Bars (Radiating outwards to the right) */}
            {waveformBars.map((height, idx) => {
              // x coordinates: 290, 303, 316, 329, 342, 355, 368, 381
              const xPos = 290 + idx * 13;
              const yPos = 170 - height / 2;
              return (
                <rect 
                  key={`wave-right-${idx}`}
                  x={xPos} 
                  y={yPos} 
                  width="3.5" 
                  height={height} 
                  rx="1.75" 
                  fill="rgba(255, 255, 255, 0.75)"
                  filter={idx < 3 ? "url(#whiteGlow)" : undefined}
                  className={`waveform-bar bar-r-${idx}`}
                />
              );
            })}
          </g>

          {/* MAIN FUTURISTIC ROBOT CORE */}
          <g className="robot-core-body" filter="url(#coreDropShadow)">
            {/* Head Antenna */}
            <g className="antenna-group">
              {/* Antenna Stem */}
              <rect 
                x="207.5" 
                y="94" 
                width="5" 
                height="22" 
                rx="2.5" 
                fill="#52525b" 
                stroke="#d4d4d8" 
                strokeWidth="1"
              />
              {/* Glowing Top Pill / Light */}
              <rect 
                x="206" 
                y="80" 
                width="8" 
                height="15" 
                rx="4" 
                fill="#ffffff" 
                filter="url(#whiteGlow)"
                className="antenna-light"
              />
            </g>

            {/* Outer Helmet Shield */}
            <rect 
              x="146" 
              y="108" 
              width="128" 
              height="124" 
              rx="54" 
              fill="url(#helmetGrad)" 
              stroke="url(#whiteRimGrad)" 
              strokeWidth="2.8" 
              className="robot-helmet"
              filter="url(#whiteGlow)"
            />

            {/* Left Earphone Capsule */}
            <g className="ear-pod left-ear">
              <rect 
                x="136" 
                y="142" 
                width="14" 
                height="56" 
                rx="7" 
                fill="url(#earPodGrad)" 
                stroke="rgba(255, 255, 255, 0.85)" 
                strokeWidth="2" 
              />
              <circle cx="143" cy="170" r="3.5" fill="#ffffff" filter="url(#whiteGlow)" />
            </g>

            {/* Right Earphone Capsule */}
            <g className="ear-pod right-ear">
              <rect 
                x="270" 
                y="142" 
                width="14" 
                height="56" 
                rx="7" 
                fill="url(#earPodGrad)" 
                stroke="rgba(255, 255, 255, 0.85)" 
                strokeWidth="2" 
              />
              <circle cx="277" cy="170" r="3.5" fill="#ffffff" filter="url(#whiteGlow)" />
            </g>

            {/* Inner Visor Screen (Deep Obsidian Black) */}
            <rect 
              x="158" 
              y="124" 
              width="104" 
              height="92" 
              rx="40" 
              fill="#060608" 
              stroke="rgba(255, 255, 255, 0.18)" 
              strokeWidth="1.2" 
              className="visor-screen"
            />

            {/* DYNAMIC EYES (Changes per state) */}
            <g className="robot-eyes-group">
              {currentState === 'listening' ? (
                /* Listening: Attentive Glowing Open Arcs that pulse */
                <>
                  <path 
                    d="M 174 168 Q 186 150 198 168" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="5" 
                    strokeLinecap="round" 
                    filter="url(#whiteGlow)"
                    className="eye-arc eye-left attentive"
                  />
                  <path 
                    d="M 222 168 Q 234 150 246 168" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="5" 
                    strokeLinecap="round" 
                    filter="url(#whiteGlow)"
                    className="eye-arc eye-right attentive"
                  />
                </>
              ) : currentState === 'thinking' ? (
                /* Thinking: Scanning Circular Orbital Eyes */
                <>
                  <g className="thinking-eye left-scan">
                    <circle cx="186" cy="167" r="10" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="6 4" className="spin-eye" />
                    <circle cx="186" cy="167" r="3.5" fill="#ffffff" filter="url(#whiteGlow)" />
                  </g>
                  <g className="thinking-eye right-scan">
                    <circle cx="234" cy="167" r="10" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="6 4" className="spin-eye reverse" />
                    <circle cx="234" cy="167" r="3.5" fill="#ffffff" filter="url(#whiteGlow)" />
                  </g>
                </>
              ) : currentState === 'speaking' ? (
                /* Speaking: Friendly Rhythmic Pulsing Crescent Eyes */
                <>
                  <path 
                    d="M 174 170 Q 186 154 198 170" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="5" 
                    strokeLinecap="round" 
                    filter="url(#whiteGlow)"
                    className="eye-arc eye-left speaking-eye"
                  />
                  <path 
                    d="M 222 170 Q 234 154 246 170" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="5" 
                    strokeLinecap="round" 
                    filter="url(#whiteGlow)"
                    className="eye-arc eye-right speaking-eye"
                  />
                </>
              ) : currentState === 'done' ? (
                /* Done: Friendly Happy Smile Eyes */
                <>
                  <path 
                    d="M 174 169 Q 186 152 198 169" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="5.5" 
                    strokeLinecap="round" 
                    filter="url(#whiteGlow)"
                    className="eye-arc eye-left done-eye"
                  />
                  <path 
                    d="M 222 169 Q 234 152 246 169" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="5.5" 
                    strokeLinecap="round" 
                    filter="url(#whiteGlow)"
                    className="eye-arc eye-right done-eye"
                  />
                  {/* Subtle Sparkle stars */}
                  <polygon points="186,145 188,150 193,150 189,153 191,158 186,155 182,158 184,153 180,150 185,150" fill="#ffffff" filter="url(#whiteGlow)" />
                </>
              ) : currentState === 'error' ? (
                /* Error: Straight horizontal or worried eyes */
                <>
                  <line x1="175" y1="168" x2="197" y2="168" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
                  <line x1="223" y1="168" x2="245" y2="168" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
                </>
              ) : (
                /* Idle: Happy Curved Crescent Arcs (matching original design) */
                <>
                  <path 
                    d="M 174 171 Q 186 155 198 171" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="4.8" 
                    strokeLinecap="round" 
                    filter="url(#whiteGlow)"
                    className="eye-arc eye-left idle-eye"
                  />
                  <path 
                    d="M 222 171 Q 234 155 246 171" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="4.8" 
                    strokeLinecap="round" 
                    filter="url(#whiteGlow)"
                    className="eye-arc eye-right idle-eye"
                  />
                </>
              )}
            </g>
          </g>
        </svg>
      </div>

      {/* Spoken Text Feedback (Realtime speech transcript / AI spoken response) */}
      {spokenText && (
        <div className="karobaar-visualizer-speech-subtitle">
          <p className="speech-quote">"{spokenText}"</p>
        </div>
      )}

      {/* Prominent Interaction Buttons according to state */}
      <div className="karobaar-visualizer-actions-bar">
        {currentState === 'listening' ? (
          <button 
            type="button" 
            onClick={onMicClick} 
            className="karobaar-action-btn btn-stop-listening"
            title="Stop Listening"
          >
            <span className="btn-dot active-red" />
            <span>Stop Listening</span>
          </button>
        ) : currentState === 'speaking' ? (
          <button 
            type="button" 
            onClick={onStopSpeaking} 
            className="karobaar-action-btn btn-stop-speaking"
            title="Stop Speaking"
          >
            <Volume2 size={14} />
            <span>Stop Speaking</span>
          </button>
        ) : (
          <button 
            type="button" 
            onClick={onMicClick} 
            className={`karobaar-action-btn btn-mic-toggle ${currentState === 'thinking' ? 'disabled' : ''}`}
            disabled={currentState === 'thinking'}
            title="Start Voice Command"
          >
            <Mic size={15} />
            <span>{currentState === 'thinking' ? 'Processing...' : 'Tap to Speak'}</span>
          </button>
        )}
      </div>

      {/* Bottom Branding (Matching Image) */}
      {showBranding && (
        <div className="karobaar-visualizer-branding">
          <div className="brand-header">
            {/* 3-Bar Chart Icon matching design */}
            <span className="brand-icon-bars" aria-hidden="true">
              <span className="bar bar-1" />
              <span className="bar bar-2" />
              <span className="bar bar-3" />
            </span>
            <span className="brand-title">Karobaar AI</span>
          </div>
          <span className="brand-tagline">Turn Work Into Growth.</span>
        </div>
      )}
    </div>
  );
};

export default KarobaarAIVisualizer;
