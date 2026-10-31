/**
 * JarvisVoiceService 3.0
 * Real-Time Continuous Speech Recognition & Voice Processing Subsystem
 *
 * Capabilities:
 * 1. Two-way live voice conversations with automatic speech-end detection.
 * 2. Real-time interim transcript streaming ("see your voice as you speak").
 * 3. Multilingual recognition (English, Urdu, Hindi, Arabic, Spanish, French, German).
 * 4. Silence detection timer for automatic conversational turn-taking (ChatGPT Voice style).
 * 5. Web Audio API RMS meter & multi-band frequency analyzer for waveforms and glowing orb.
 * 6. Background noise tolerance, echo prevention, and automatic recovery.
 */

export const RECOGNITION_LANG_MAP = {
  en: 'en-US',
  'en-gb': 'en-GB',
  ur: 'ur-PK',
  hi: 'hi-IN',
  hinglish: 'hi-IN',
  ar: 'ar-SA',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE'
};

class JarvisVoiceService {
  constructor() {
    this.recognition = null;
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.dataArray = null;

    this.isListening = false;
    this.isLiveTalkActive = false;
    this._recognitionStarting = false;
    this.audioLevel = 0;
    this.animFrameId = null;

    // Silence detection for natural conversational turn-taking
    this.silenceTimer = null;
    this.silenceWaitMs = 1400; // 1.4 seconds of silence indicates user finished speaking
    this.accumulatedTranscript = '';
    this.lastInterimText = '';

    // Callbacks
    this.onInterimTranscript = null;
    this.onFinalTranscript = null;
    this.onStateChange = null;
    this.onError = null;
    this.onAudioLevel = null;
    this.onFrequencyData = null;

    this.language = 'en-US';

    this._initSpeechRecognition();
  }

  isSupported() {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  _initSpeechRecognition() {
    if (!this.isSupported()) return;

    try {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.language;

      this.recognition.onstart = () => {
        this._recognitionStarting = false;
        this.isListening = true;
        this._startAudioMeter();
        if (this.onStateChange) this.onStateChange({ isListening: true, isLiveTalk: this.isLiveTalkActive });
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i][0];
          const transcript = item.transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        const activeText = (final || interim).trim();

        if (interim && this.onInterimTranscript) {
          this.onInterimTranscript(interim);
        }

        if (activeText) {
          this.lastInterimText = activeText;
          // Reset silence timer on every chunk of speech
          this._resetSilenceTimer();
        }

        if (final) {
          this.accumulatedTranscript += (this.accumulatedTranscript ? ' ' : '') + final.trim();
        }
      };

      this.recognition.onerror = (event) => {
        this._recognitionStarting = false;
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('[JarvisVoice 3.0] Recognition event:', event.error);
          if (this.onError) this.onError(event.error);
        }
        if (!this.isLiveTalkActive) {
          this.isListening = false;
          this._stopAudioMeter();
          if (this.onStateChange) this.onStateChange({ isListening: false, isLiveTalk: false });
        }
      };

      this.recognition.onend = () => {
        this._recognitionStarting = false;

        // In continuous Live Talk mode, smoothly re-listen unless paused or closed
        if (this.isLiveTalkActive) {
          setTimeout(() => {
            if (this.isLiveTalkActive && !this.isListening && !this._recognitionStarting) {
              try {
                this._recognitionStarting = true;
                this.recognition.start();
              } catch (_) {
                this._recognitionStarting = false;
              }
            }
          }, 250);
          return;
        }

        this.isListening = false;
        this._stopAudioMeter();
        if (this.onStateChange) this.onStateChange({ isListening: false, isLiveTalk: false });
      };
    } catch (err) {
      console.warn('[JarvisVoice] Recognition init warning:', err);
    }
  }

  _resetSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    // Auto-detect when user finished speaking after silenceWaitMs
    this.silenceTimer = setTimeout(() => {
      this._commitSpeechResult();
    }, this.silenceWaitMs);
  }

  _commitSpeechResult() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    const textToCommit = (this.accumulatedTranscript || this.lastInterimText || '').trim();
    this.accumulatedTranscript = '';
    this.lastInterimText = '';

    if (textToCommit && this.onFinalTranscript) {
      this.onFinalTranscript(textToCommit);
    }
  }

  /**
   * Start listening in standard mode or Live Talk mode
   */
  startListening(lang = 'en', isLiveTalk = false) {
    if (!this.recognition) return false;
    this.isLiveTalkActive = !!isLiveTalk;
    const targetLocale = RECOGNITION_LANG_MAP[lang] || RECOGNITION_LANG_MAP.en;
    this.language = targetLocale;
    this.recognition.lang = targetLocale;

    if (this.isListening || this._recognitionStarting) return true;

    try {
      this._recognitionStarting = true;
      this.accumulatedTranscript = '';
      this.lastInterimText = '';
      this.recognition.start();
      return true;
    } catch (err) {
      this._recognitionStarting = false;
      return false;
    }
  }

  /**
   * Pause listening while Jarvis is speaking (to prevent echo feedback)
   */
  pauseListening() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this._recognitionStarting = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
    this.isListening = false;
    this._stopAudioMeter();
    if (this.onStateChange) this.onStateChange({ isListening: false, isLiveTalk: this.isLiveTalkActive });
  }

  /**
   * Resume listening after Jarvis finishes speaking
   */
  resumeListening(lang = 'en') {
    if (!this.isLiveTalkActive) return;
    this.startListening(lang, true);
  }

  /**
   * Stop all listening and exit Live Talk mode
   */
  stopListening() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.isLiveTalkActive = false;
    this._recognitionStarting = false;
    this.accumulatedTranscript = '';
    this.lastInterimText = '';

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
    this.isListening = false;
    this._stopAudioMeter();
    if (this.onStateChange) this.onStateChange({ isListening: false, isLiveTalk: false });
  }

  /**
   * Check microphone permission
   */
  async checkMicPermission() {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return 'prompt';
    try {
      const res = await navigator.permissions.query({ name: 'microphone' });
      return res.state; // 'granted', 'denied', or 'prompt'
    } catch (_) {
      return 'prompt';
    }
  }

  /**
   * Real-time audio RMS & multi-frequency meter feeding waveforms and glowing orb
   */
  async _startAudioMeter() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch (_) {}
      }

      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }

      if (this.audioContext.state === 'closed') return;

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.55;
      source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!this.isListening || !this.analyser) {
          this.audioLevel = 0;
          if (this.onAudioLevel) this.onAudioLevel(0);
          if (this.onFrequencyData) this.onFrequencyData([]);
          return;
        }

        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        const freqs = [];
        for (let i = 0; i < this.dataArray.length; i++) {
          sum += this.dataArray[i];
          freqs.push(this.dataArray[i] / 255);
        }
        const avg = sum / this.dataArray.length;
        const normalized = Math.min(1.0, Math.max(0, (avg - 8) / 110));
        this.audioLevel = normalized;

        if (this.onAudioLevel) {
          this.onAudioLevel(normalized);
        }

        if (this.onFrequencyData) {
          this.onFrequencyData(freqs);
        }

        this.animFrameId = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (_) {
      // Audio meter graceful fallback
    }
  }

  _stopAudioMeter() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(track => track.stop());
      } catch (_) {}
      this.mediaStream = null;
    }
    this.audioLevel = 0;
    if (this.onAudioLevel) this.onAudioLevel(0);
    if (this.onFrequencyData) this.onFrequencyData([]);
  }
}

export const jarvisVoiceService = new JarvisVoiceService();
