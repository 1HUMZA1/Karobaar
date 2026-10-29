/**
 * JarvisVoiceService
 * Advanced Voice Command & Speech Recognition Subsystem
 *
 * Capabilities:
 * 1. Push-to-talk speech recognition.
 * 2. Real-time interim transcript streaming ("see my voice").
 * 3. Continuous background wake-word listener ("Hey Jarvis" / "Jarvis").
 * 4. Web Audio API RMS meter feeding live volume levels into the Intelligence Orb.
 * 5. Safe permission negotiation, browser compatibility checking, and fallback.
 */

class JarvisVoiceService {
  constructor() {
    this.recognition = null;
    this.wakeWordRecognition = null;
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.dataArray = null;

    this.isListening = false;
    this.isWakeWordActive = false;
    this.isPushToTalkActive = false;
    this.audioLevel = 0;
    this.animFrameId = null;

    this.onInterimTranscript = null;
    this.onFinalTranscript = null;
    this.onWakeWordDetected = null;
    this.onStateChange = null;
    this.onError = null;
    this.onAudioLevel = null;

    this.wakeWord = 'jarvis';
    this.language = 'en-US';

    this._initSpeechRecognition();
  }

  /**
   * Check if Speech Recognition is supported in the current environment
   */
  isSupported() {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  _initSpeechRecognition() {
    if (!this.isSupported()) return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    // 1. Primary Command Recognition
    this.recognition = new SpeechRec();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = this.language;

    this.recognition.onstart = () => {
      this.isListening = true;
      this._startAudioMeter();
      if (this.onStateChange) this.onStateChange({ isListening: true });
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim && this.onInterimTranscript) {
        this.onInterimTranscript(interim);
      }

      if (final && this.onFinalTranscript) {
        this.onFinalTranscript(final.trim());
      }
    };

    this.recognition.onerror = (event) => {
      // Don't report 'no-speech' or 'aborted' as critical errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[JarvisVoice] Recognition error:', event.error);
        if (this.onError) this.onError(event.error);
      }
      this._stopAudioMeter();
      this.isListening = false;
      if (this.onStateChange) this.onStateChange({ isListening: false });
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this._stopAudioMeter();
      if (this.onStateChange) this.onStateChange({ isListening: false });

      // If wake-word was active before, resume wake-word listening
      if (this.isWakeWordActive && !this.isPushToTalkActive) {
        this.startWakeWordListening();
      }
    };

    // 2. Continuous Wake-Word Recognition
    this.wakeWordRecognition = new SpeechRec();
    this.wakeWordRecognition.continuous = true;
    this.wakeWordRecognition.interimResults = false;
    this.wakeWordRecognition.lang = this.language;

    this.wakeWordRecognition.onresult = (event) => {
      const lastIndex = event.results.length - 1;
      const transcript = (event.results[lastIndex][0].transcript || '').toLowerCase().trim();

      const normalizedWake = this.wakeWord.toLowerCase();
      if (transcript.includes(normalizedWake) || transcript.includes('hey jarvis') || transcript.includes('wake up')) {
        console.log('[JarvisVoice] Wake word detected:', transcript);
        if (this.onWakeWordDetected) {
          this.onWakeWordDetected(transcript);
        }
      }
    };

    this.wakeWordRecognition.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('[JarvisVoice] Wake-word error:', e.error);
      }
    };

    this.wakeWordRecognition.onend = () => {
      // Automatically restart wake-word recognition if enabled and not speaking/actively listening
      if (this.isWakeWordActive && !this.isListening) {
        setTimeout(() => {
          try {
            if (this.isWakeWordActive && !this.isListening) {
              this.wakeWordRecognition.start();
            }
          } catch (e) {}
        }, 600);
      }
    };
  }

  /**
   * Start push-to-talk or click-to-talk listening
   */
  startListening(lang = 'en-US') {
    if (!this.recognition) return false;

    // Pause wake-word while active command recognition is running
    this._pauseWakeWord();

    try {
      this.language = lang;
      this.recognition.lang = lang;
      this.isPushToTalkActive = true;
      this.recognition.start();
      return true;
    } catch (err) {
      // Already running or permission denied
      return false;
    }
  }

  /**
   * Stop active listening
   */
  stopListening() {
    this.isPushToTalkActive = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this._stopAudioMeter();
  }

  /**
   * Start background continuous wake-word listening ("Hey Jarvis")
   */
  startWakeWordListening(wakePhrase = 'jarvis') {
    if (!this.wakeWordRecognition) return;
    this.wakeWord = wakePhrase || 'jarvis';
    this.isWakeWordActive = true;

    try {
      this.wakeWordRecognition.start();
    } catch (e) {
      // already active
    }
  }

  /**
   * Stop wake-word listening
   */
  stopWakeWordListening() {
    this.isWakeWordActive = false;
    if (this.wakeWordRecognition) {
      try {
        this.wakeWordRecognition.stop();
      } catch (e) {}
    }
  }

  _pauseWakeWord() {
    if (this.wakeWordRecognition) {
      try {
        this.wakeWordRecognition.stop();
      } catch (e) {}
    }
  }

  /**
   * Web Audio API RMS Volume Level Meter
   */
  async _startAudioMeter() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!this.isListening || !this.analyser) {
          this.audioLevel = 0;
          if (this.onAudioLevel) this.onAudioLevel(0);
          return;
        }

        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
          sum += this.dataArray[i];
        }
        const avg = sum / this.dataArray.length;
        const normalized = Math.min(1.0, avg / 128);
        this.audioLevel = normalized;

        if (this.onAudioLevel) {
          this.onAudioLevel(normalized);
        }

        this.animFrameId = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      // Fallback silently without breaking text interaction
    }
  }

  _stopAudioMeter() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.audioLevel = 0;
    if (this.onAudioLevel) this.onAudioLevel(0);
  }
}

export const jarvisVoiceService = new JarvisVoiceService();
