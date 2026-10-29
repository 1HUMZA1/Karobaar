import React, { useRef, useEffect } from 'react';
import './JarvisIntelligenceOrb.css';

/**
 * JarvisIntelligenceOrb
 * Minimalist, Clean, Luxury Monochrome Soundwave Orb for Karobaar AI
 *
 * States:
 * - 'idle'       : Calm, rhythmic breathing pulse, smooth concentric halo.
 * - 'listening'  : Clean reactive audio waveform expansion based on live microphone volume.
 * - 'thinking'   : Elegant orbital ring rotation, scanning gradient pulse.
 * - 'speaking'   : Harmonic vocal frequency waves pulsing with speech cadence.
 * - 'executing'  : Focused energy compression with subtle acceleration.
 * - 'success'    : Smooth outward harmonic settling.
 * - 'muted'      : Dimmed, serene, motionless circle.
 * - 'error'      : Subtle red accent pulse, gentle recovery.
 */
export const JarvisIntelligenceOrb = ({
  state = 'idle',            // 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing' | 'success' | 'muted' | 'error'
  audioLevel = 0,            // 0.0 to 1.0 (live microphone or speech RMS volume)
  size = 90,                 // Diameter in pixels
  className = '',
  onClick = null,
  showRings = true,
  interactive = true
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
    const baseRadius = (size / 2) * 0.45;

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

      timeRef.current += 0.025;
      const t = timeRef.current;

      ctx.clearRect(0, 0, size, size);

      // Determine accent colors based on theme and state
      const isError = currentState === 'error';
      const isMuted = currentState === 'muted';
      const isListening = currentState === 'listening';
      const isSpeaking = currentState === 'speaking';
      const isThinking = currentState === 'thinking';

      // 1. Central Core Glowing Circle
      const corePulse = isMuted ? 0 : isListening 
        ? Math.sin(t * 4) * 2 + currentAudio * 12 
        : isSpeaking 
        ? Math.sin(t * 6) * 3 + currentAudio * 10 
        : isThinking
        ? Math.sin(t * 5) * 2
        : Math.sin(t * 2) * 1.5;

      const coreRadius = Math.max(6, baseRadius * 0.55 + corePulse);

      // Core Gradient Glow
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 1.8);
      if (isError) {
        coreGrad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
        coreGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
        coreGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (isMuted) {
        coreGrad.addColorStop(0, 'rgba(113, 113, 122, 0.5)');
        coreGrad.addColorStop(0.6, 'rgba(113, 113, 122, 0.15)');
        coreGrad.addColorStop(1, 'rgba(113, 113, 122, 0)');
      } else {
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        coreGrad.addColorStop(0.4, 'rgba(240, 240, 245, 0.5)');
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Solid Inner Core
      ctx.fillStyle = isError ? '#ef4444' : isMuted ? '#71717a' : '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(3, coreRadius * 0.6), 0, Math.PI * 2);
      ctx.fill();

      // 2. Harmonic Wave Rings (Simple, clean, non-chaotic)
      if (showRings && !isMuted) {
        const NUM_RINGS = isListening || isSpeaking ? 4 : 3;

        for (let i = 1; i <= NUM_RINGS; i++) {
          const ringOffset = i * (baseRadius * 0.42);
          const waveFactor = isListening 
            ? Math.sin(t * 3 + i) * 3 + currentAudio * (18 + i * 8)
            : isSpeaking
            ? Math.sin(t * 4 + i * 1.2) * (2 + i) + currentAudio * (14 + i * 6)
            : isThinking
            ? Math.sin(t * 2.5 + i * 0.8) * 2
            : Math.sin(t * 1.8 + i) * 1.8;

          const ringRadius = Math.max(8, baseRadius + ringOffset + waveFactor);
          const alpha = isListening 
            ? Math.max(0.1, 0.85 - i * 0.18 + currentAudio * 0.3)
            : isSpeaking
            ? Math.max(0.1, 0.75 - i * 0.16)
            : isThinking
            ? Math.max(0.1, 0.55 - i * 0.14)
            : Math.max(0.08, 0.4 - i * 0.1);

          ctx.strokeStyle = isError 
            ? `rgba(239, 68, 68, ${alpha})` 
            : `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = i === 1 ? 1.5 : 1.0;

          if (isThinking) {
            // Rotating dashed orbital ring for thinking
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(t * (i % 2 === 0 ? 1 : -1) * 1.5);
            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 1.4);
            ctx.stroke();
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

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
      className={`jarvis-clean-orb-container ${className} ${interactive ? 'interactive' : ''}`}
      onClick={onClick}
      style={{ width: `${size}px`, height: `${size}px` }}
      role="img"
      aria-label={`Jarvis AI Animation - State: ${state}`}
    >
      <canvas 
        ref={canvasRef}
        style={{ width: `${size}px`, height: `${size}px`, display: 'block' }}
      />
    </div>
  );
};

export default JarvisIntelligenceOrb;
