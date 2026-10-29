/**
 * JarvisSpeechService
 * Text-to-Speech (TTS) Synthesis with Natural Voice Discovery & Audiocadence Simulation
 */

class JarvisSpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.voices = [];
    this.speechRate = 1.0;
    this.speechPitch = 1.0;
    this.speechVolume = 1.0;
    this.selectedVoice = null;
    this.voiceEnabled = true;

    this.onStart = null;
    this.onEnd = null;
    this.onAudioLevel = null;
    this.audioSimInterval = null;

    this._loadVoices();
  }

  _loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
    }
  }

  getAvailableVoices() {
    if (!this.voices || this.voices.length === 0) {
      this._loadVoices();
    }
    return this.voices || [];
  }

  /**
   * Speak plain or markdown text
   */
  speak(text, options = {}) {
    if (!this.synth || !this.voiceEnabled) return;

    this.stop(); // Stop any currently playing utterance

    // Strip markdown formatting symbols for natural speech
    const cleanText = text
      .replace(/[*#_`>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.rate || this.speechRate;
    utterance.pitch = options.pitch || this.speechPitch;
    utterance.volume = options.volume || this.speechVolume;

    // Select natural voice (prioritize high quality English / local voices)
    const available = this.getAvailableVoices();
    if (options.voice) {
      utterance.voice = options.voice;
    } else {
      const preferred = available.find(v => 
        v.name.includes('Google') || 
        v.name.includes('Natural') || 
        v.name.includes('Samantha') || 
        v.name.includes('Daniel') ||
        v.name.includes('Siri')
      ) || available[0];
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this._startAudioCadenceSimulation();
      if (this.onStart) this.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this._stopAudioCadenceSimulation();
      if (this.onEnd) this.onEnd();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this._stopAudioCadenceSimulation();
      if (this.onEnd) this.onEnd();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /**
   * Stop speech immediately
   */
  stop() {
    if (!this.synth) return;
    this.synth.cancel();
    this.isSpeaking = false;
    this._stopAudioCadenceSimulation();
    if (this.onEnd) this.onEnd();
  }

  /**
   * Simulates dynamic RMS audio levels during speech playback to feed the Intelligence Orb
   */
  _startAudioCadenceSimulation() {
    this._stopAudioCadenceSimulation();
    let step = 0;
    this.audioSimInterval = setInterval(() => {
      if (!this.isSpeaking) {
        this._stopAudioCadenceSimulation();
        return;
      }
      step++;
      // Natural speech rhythm simulation (rising, falling, pauses between clauses)
      const baseWave = Math.sin(step * 0.45) * 0.4 + 0.5;
      const microJitter = (Math.random() - 0.5) * 0.25;
      const simulatedLevel = Math.max(0.1, Math.min(0.95, baseWave + microJitter));

      if (this.onAudioLevel) {
        this.onAudioLevel(simulatedLevel);
      }
    }, 60);
  }

  _stopAudioCadenceSimulation() {
    if (this.audioSimInterval) {
      clearInterval(this.audioSimInterval);
      this.audioSimInterval = null;
    }
    if (this.onAudioLevel) {
      this.onAudioLevel(0);
    }
  }
}

export const jarvisSpeechService = new JarvisSpeechService();
