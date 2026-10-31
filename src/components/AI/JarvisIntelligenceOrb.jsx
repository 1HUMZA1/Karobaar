import React, { useRef, useEffect } from 'react';
import './JarvisIntelligenceOrb.css';

/**
 * JarvisIntelligenceOrb 3.0
 * Futuristic ChatGPT-inspired AI Intelligence Orb with Cyan, Blue & Electric Purple Lighting.
 * Multi-layer radial glow, harmonic energy fields, and real-time audio reactivity.
 *
 * States:
 * - 'idle'       : Celestial breathing pulse, calm ambient blue/purple nebulous core.
 * - 'listening'  : High-energy neon cyan/blue expansion reacting to microphone RMS levels.
 * - 'thinking'   : Accelerated dual-orbit quantum particle rings with chromatic violet glow.
 * - 'speaking'   : Harmonic vocal frequency waves undulating in sync with speech cadence.
 * - 'success'    : Harmonic emerald-cyan settling bloom.
 * - 'error'      : Pulsing amber-red alert.
 */
export const JarvisIntelligenceOrb = ({
  state = 'idle',            // 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing' | 'success' | 'error'
  audioLevel = 0,            // 0.0 to 1.0 (live microphone or speech RMS volume)
  size = 140,                // Diameter in pixels
  className = '',
  onClick = null,
  showRings = true,
  interactive = true,
  statusLabel = ''
}) => {
  const canvasRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const timeRef = useRef(0);
  const stateRef = useRef(state);
  const audioLevelRef = useRef(audioLevel);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = (size / 2) * 0.42;

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (!isVisible) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      const currentState = stateRef.current;
      const currentAudio = audioLevelRef.current || 0;

      // Time advance based on activity
      const timeSpeed = currentState === 'thinking' ? 0.05 : currentState === 'listening' ? 0.035 : currentState === 'speaking' ? 0.04 : 0.02;
      timeRef.current += timeSpeed;
      const t = timeRef.current;

      ctx.clearRect(0, 0, size, size);

      const isListening = currentState === 'listening';
      const isSpeaking = currentState === 'speaking';
      const isThinking = currentState === 'thinking';
      const isError = currentState === 'error';

      // 1. Ambient Outer Halo (Deep Blue & Violet Nebula)
      const outerGlowRadius = baseRadius * (1.8 + currentAudio * 0.6);
      const outerGlow = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, outerGlowRadius);

      if (isError) {
        outerGlow.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        outerGlow.addColorStop(0.5, 'rgba(185, 28, 28, 0.18)');
        outerGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (isListening) {
        outerGlow.addColorStop(0, 'rgba(6, 182, 212, 0.55)');   // Cyan
        outerGlow.addColorStop(0.45, 'rgba(59, 130, 246, 0.28)'); // Blue
        outerGlow.addColorStop(1, 'rgba(147, 51, 234, 0)');      // Purple fade
      } else if (isSpeaking) {
        outerGlow.addColorStop(0, 'rgba(168, 85, 247, 0.52)');  // Purple
        outerGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.25)');   // Cyan
        outerGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');      // Blue fade
      } else if (isThinking) {
        outerGlow.addColorStop(0, 'rgba(147, 51, 234, 0.6)');   // Electric Violet
        outerGlow.addColorStop(0.5, 'rgba(59, 130, 246, 0.3)');   // Blue
        outerGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
      } else {
        // Idle calm breathing
        const idlePulse = Math.sin(t * 1.5) * 0.1 + 0.9;
        outerGlow.addColorStop(0, `rgba(59, 130, 246, ${0.35 * idlePulse})`);  // Blue
        outerGlow.addColorStop(0.5, `rgba(147, 51, 234, ${0.18 * idlePulse})`); // Purple
        outerGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
      }

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, outerGlowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Dynamic Concentric Harmonic Waves
      if (showRings) {
        const ringCount = isListening || isSpeaking ? 4 : 3;

        for (let i = 1; i <= ringCount; i++) {
          const ringDist = baseRadius * (0.85 + i * 0.32);
          const wavePhase = isListening 
            ? Math.sin(t * 3.2 + i * 1.2) * (3 + currentAudio * 16)
            : isSpeaking
            ? Math.sin(t * 4.0 + i * 0.9) * (2 + currentAudio * 12)
            : isThinking
            ? Math.sin(t * 2.8 + i) * 2.5
            : Math.sin(t * 1.8 + i) * 1.8;

          const ringRadius = Math.max(8, ringDist + wavePhase);
          const alpha = isListening
            ? Math.min(0.9, 0.35 + currentAudio * 0.5 - i * 0.08)
            : isSpeaking
            ? Math.min(0.85, 0.3 + currentAudio * 0.45 - i * 0.07)
            : isThinking
            ? 0.45 - i * 0.1
            : 0.28 - i * 0.07;

          ctx.save();
          if (isThinking) {
            // Rotating orbital segments in thinking state
            ctx.translate(cx, cy);
            ctx.rotate(t * (i % 2 === 0 ? 1.8 : -1.8));
            ctx.beginPath();
            ctx.strokeStyle = i % 2 === 0 ? `rgba(6, 182, 212, ${alpha})` : `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 1.8;
            ctx.setLineDash([12 + i * 4, 10]);
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 1.6);
            ctx.stroke();
          } else {
            ctx.beginPath();
            const ringGrad = ctx.createLinearGradient(cx - ringRadius, cy, cx + ringRadius, cy);
            ringGrad.addColorStop(0, `rgba(6, 182, 212, ${alpha})`);   // Cyan
            ringGrad.addColorStop(0.5, `rgba(59, 130, 246, ${alpha})`); // Blue
            ringGrad.addColorStop(1, `rgba(168, 85, 247, ${alpha})`);  // Purple
            ctx.strokeStyle = ringGrad;
            ctx.lineWidth = i === 1 ? 2.0 : 1.2;
            ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // 3. Central Pulsing Glass Orb Core
      const corePulse = isListening
        ? Math.sin(t * 4) * 2 + currentAudio * 14
        : isSpeaking
        ? Math.sin(t * 5) * 3 + currentAudio * 10
        : isThinking
        ? Math.sin(t * 6) * 2.5
        : Math.sin(t * 2) * 1.5;

      const coreRadius = Math.max(10, baseRadius * 0.58 + corePulse);

      // Core Gradient
      const coreGrad = ctx.createRadialGradient(
        cx - coreRadius * 0.2, 
        cy - coreRadius * 0.2, 
        coreRadius * 0.1, 
        cx, 
        cy, 
        coreRadius
      );

      if (isError) {
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.4, '#ef4444');
        coreGrad.addColorStop(1, '#7f1d1d');
      } else if (isListening) {
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.3, '#38bdf8'); // Sky
        coreGrad.addColorStop(0.7, '#06b6d4'); // Cyan
        coreGrad.addColorStop(1, '#1e3a8a');   // Deep Blue
      } else if (isSpeaking) {
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.35, '#c084fc'); // Lavender
        coreGrad.addColorStop(0.7, '#8b5cf6');  // Violet
        coreGrad.addColorStop(1, '#0284c7');    // Ocean Blue
      } else if (isThinking) {
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.4, '#a855f7');
        coreGrad.addColorStop(0.8, '#3b82f6');
        coreGrad.addColorStop(1, '#0f172a');
      } else {
        // Idle
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.3, '#60a5fa');  // Light Blue
        coreGrad.addColorStop(0.65, '#3b82f6'); // Royal Blue
        coreGrad.addColorStop(1, '#6366f1');   // Indigo
      }

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight on glass orb
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(cx - coreRadius * 0.28, cy - coreRadius * 0.28, coreRadius * 0.22, 0, Math.PI * 2);
      ctx.fill();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [size, showRings]);

  return (
    <div 
      className={`jarvis-3-orb-wrapper ${className} ${interactive ? 'interactive' : ''} state-${state}`}
      onClick={onClick}
      style={{ width: `${size}px`, height: `${size}px` }}
      role="button"
      tabIndex={0}
      aria-label={`Jarvis AI 3.0 Orb - Status: ${state}`}
    >
      <canvas 
        ref={canvasRef}
        style={{ width: `${size}px`, height: `${size}px`, display: 'block' }}
      />
      {statusLabel && (
        <span className="jarvis-3-orb-status-pill">{statusLabel}</span>
      )}
    </div>
  );
};

export default JarvisIntelligenceOrb;
