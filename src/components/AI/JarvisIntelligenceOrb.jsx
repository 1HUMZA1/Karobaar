import React, { useRef, useEffect, useCallback } from 'react';
import './JarvisIntelligenceOrb.css';

/**
 * JarvisIntelligenceOrb
 * Flagship Reactive AI Avatar for Karobaar
 * Direct realization of the particle waveform intelligence orb (reference image: media_1793262887591_821adc13.png)
 *
 * States:
 * - 'idle'       : Subtle hypnotic breathing, gentle 3D sphere rotation, low-amplitude wave ripples.
 * - 'listening'  : Reacts directly to microphone audioLevel; particles surge and pulse outwards.
 * - 'thinking'   : Accelerated axial spin, scanning wave ribbons, dense orbital core compression.
 * - 'speaking'   : Undulating audio-frequency waveforms synchronized to speech cadences.
 * - 'executing'  : Focused energy compression with glowing particle acceleration during real operations.
 * - 'success'    : Harmonic outward wave expansion and smooth settling.
 * - 'error'      : Restrained discordant pulse, temporary particle turbulence, automatic recovery.
 */
export const JarvisIntelligenceOrb = ({
  state = 'idle',            // 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing' | 'success' | 'error'
  audioLevel = 0,            // 0.0 to 1.0 (live microphone or speech RMS volume)
  size = 180,                // Diameter in pixels
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

  // Keep refs synchronized without recreating animation loop
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

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // High-DPI Scaling for crisp rendering on Retina screens
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = (size / 2) * 0.76;

    // Pre-calculate ribbon strands configuration
    const NUM_RIBBONS = 28;           // Concentric waveform layers
    const POINTS_PER_RIBBON = 64;     // Points along each ribbon
    const TOTAL_POINTS = NUM_RIBBONS * POINTS_PER_RIBBON;

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
      const currentAudio = audioLevelRef.current;

      // Speed & Amplitude multipliers based on real state
      let speed = 0.018;
      let waveAmp = 1.0;
      let rotSpeed = 0.006;
      let particleAlpha = 0.75;
      let coreGlow = 0.2;

      switch (currentState) {
        case 'listening':
          speed = 0.035;
          waveAmp = 1.4 + currentAudio * 3.2;
          particleAlpha = 0.95;
          coreGlow = 0.4 + currentAudio * 0.6;
          break;
        case 'thinking':
          speed = 0.065;
          rotSpeed = 0.024;
          waveAmp = 1.8;
          particleAlpha = 0.85;
          coreGlow = 0.6;
          break;
        case 'speaking':
          speed = 0.042;
          waveAmp = 1.5 + Math.sin(timeRef.current * 8) * 0.7;
          particleAlpha = 0.9;
          coreGlow = 0.5;
          break;
        case 'executing':
          speed = 0.08;
          rotSpeed = 0.035;
          waveAmp = 2.2;
          particleAlpha = 1.0;
          coreGlow = 0.8;
          break;
        case 'success':
          speed = 0.025;
          waveAmp = 1.1;
          particleAlpha = 0.9;
          coreGlow = 0.5;
          break;
        case 'error':
          speed = 0.05;
          waveAmp = 2.5;
          particleAlpha = 0.8;
          coreGlow = 0.7;
          break;
        case 'idle':
        default:
          speed = prefersReducedMotion ? 0.005 : 0.016;
          waveAmp = 0.9;
          rotSpeed = 0.005;
          particleAlpha = 0.68;
          coreGlow = 0.25;
          break;
      }

      timeRef.current += speed;
      const t = timeRef.current;

      // Clear Canvas
      ctx.clearRect(0, 0, size, size);

      // Core Background Glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, baseRadius * 1.15);
      if (currentState === 'error') {
        bgGrad.addColorStop(0, `rgba(239, 68, 68, ${coreGlow * 0.5})`);
        bgGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.12)');
        bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        bgGrad.addColorStop(0, `rgba(255, 255, 255, ${coreGlow * 0.45})`);
        bgGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
        bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      // Outer Constraining Orbital Ring (subtle hairline boundary)
      if (showRings) {
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius * 1.02, 0, Math.PI * 2);
        ctx.strokeStyle = currentState === 'error' 
          ? 'rgba(239, 68, 68, 0.3)' 
          : 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Secondary spinning segmented ring
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * rotSpeed * 3);
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 1.08, 0, Math.PI * 1.4);
        ctx.strokeStyle = currentState === 'error'
          ? 'rgba(239, 68, 68, 0.45)'
          : 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 12]);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Waveform Particle Strands (Direct representation of reference image)
      ctx.fillStyle = currentState === 'error' ? '#ef4444' : '#ffffff';

      for (let r = 0; r < NUM_RIBBONS; r++) {
        const ribbonRatio = r / NUM_RIBBONS;
        const ribbonRadius = baseRadius * (0.35 + ribbonRatio * 0.65);
        const ribbonPhase = ribbonRatio * Math.PI * 2;
        const ribbonTilt = Math.sin(ribbonRatio * Math.PI + t * 0.5) * 0.45;

        ctx.beginPath();

        for (let p = 0; p < POINTS_PER_RIBBON; p++) {
          const theta = (p / POINTS_PER_RIBBON) * Math.PI * 2;

          // Multi-harmonic sinusoidal perturbation
          const harmonic1 = Math.sin(theta * 3 + ribbonPhase + t * 2.2) * 8.5;
          const harmonic2 = Math.cos(theta * 5 - t * 1.8 + ribbonRatio * 4) * 5.0;
          const harmonic3 = Math.sin(theta * 7 + t * 3.5) * (3.0 * waveAmp);
          
          // Breathing modulation
          const breath = Math.sin(t * 1.2 + ribbonPhase) * 3.0;

          const rDist = ribbonRadius + (harmonic1 + harmonic2 + harmonic3 + breath) * (waveAmp * 0.6);

          // 3D Spherical Tilt Projection
          const x3d = rDist * Math.cos(theta);
          const y3d = rDist * Math.sin(theta);
          const z3d = Math.sin(theta + ribbonPhase) * (rDist * 0.35 * ribbonTilt);

          // Project to 2D
          const px = cx + x3d;
          const py = cy + (y3d * Math.cos(ribbonTilt) - z3d * Math.sin(ribbonTilt));

          // Particle point size & opacity based on z-depth and state
          const depthAlpha = Math.max(0.15, Math.min(1.0, 0.6 + (z3d / (baseRadius * 0.5)) * 0.4));
          const ptAlpha = particleAlpha * depthAlpha;
          const ptSize = (0.75 + depthAlpha * 0.85) * (size > 140 ? 1.1 : 0.85);

          // Draw individual particle point
          ctx.globalAlpha = ptAlpha;
          ctx.fillRect(px - ptSize / 2, py - ptSize / 2, ptSize, ptSize);
        }
      }

      ctx.globalAlpha = 1.0;
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [size, showRings]);

  return (
    <div 
      className={`jarvis-intelligence-orb-container state-${state} ${interactive ? 'interactive' : ''} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      onClick={onClick}
      role="img"
      aria-label={`Jarvis AI Intelligence Orb in ${state} mode`}
    >
      <canvas 
        ref={canvasRef} 
        style={{ width: `${size}px`, height: `${size}px` }}
        className="jarvis-intelligence-orb-canvas"
      />
    </div>
  );
};

export default JarvisIntelligenceOrb;
