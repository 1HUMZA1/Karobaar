import React, { useMemo } from 'react';
import './JarvisAudioWaveform.css';

/**
 * JarvisAudioWaveform
 * Futuristic Bilateral Audio Equalizer Waveform with Neon Cyan & Electric Purple Gradients.
 * Dances smoothly to live microphone volume or speech synthesis cadence.
 */
export const JarvisAudioWaveform = ({
  state = 'idle',            // 'idle' | 'listening' | 'thinking' | 'speaking'
  audioLevel = 0,            // 0.0 to 1.0 (real audio RMS)
  frequencyData = [],        // Array of normalized frequency bands (0.0 to 1.0)
  barCount = 18,             // Number of vertical waveform bars
  height = 48,               // Max height in pixels
  className = ''
}) => {
  // Generate bilateral symmetrical bar heights
  const bars = useMemo(() => {
    const half = Math.floor(barCount / 2);
    const result = [];

    // Base profile: bell curve peaking at center
    for (let i = 0; i < barCount; i++) {
      const distFromCenter = Math.abs(i - (barCount - 1) / 2) / half;
      const bell = Math.cos(distFromCenter * (Math.PI / 2.3)); // 0 to 1

      let h = 6;
      if (state === 'listening') {
        const freqVal = frequencyData && frequencyData.length > 0 
          ? (frequencyData[i % frequencyData.length] || 0)
          : 0;
        const reactive = (audioLevel * 0.7 + freqVal * 0.5) * bell;
        h = Math.max(6, Math.round(reactive * height));
      } else if (state === 'speaking') {
        // Natural speech wave modulation
        const wave = Math.sin(Date.now() / 150 + i * 0.6) * 0.4 + 0.6;
        h = Math.max(6, Math.round(wave * bell * height * Math.max(0.4, audioLevel || 0.75)));
      } else if (state === 'thinking') {
        // Traveling wave pattern
        const phase = Math.sin(Date.now() / 120 - i * 0.5) * 0.5 + 0.5;
        h = Math.max(6, Math.round(phase * height * 0.55));
      } else {
        // Idle gentle breathing
        const idle = Math.sin(Date.now() / 500 + i * 0.3) * 0.2 + 0.25;
        h = Math.max(4, Math.round(idle * height * 0.4));
      }
      result.push(Math.min(height, h));
    }
    return result;
  }, [state, audioLevel, frequencyData, barCount, height]);

  return (
    <div 
      className={`jarvis-audio-waveform state-${state} ${className}`}
      style={{ height: `${height}px` }}
      role="presentation"
    >
      {bars.map((h, idx) => (
        <span 
          key={idx} 
          className="waveform-bar"
          style={{ 
            height: `${h}px`,
            transition: state === 'listening' ? 'height 0.08s ease' : 'height 0.15s ease'
          }} 
        />
      ))}
    </div>
  );
};

export default JarvisAudioWaveform;
