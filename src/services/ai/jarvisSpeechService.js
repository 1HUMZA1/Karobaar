/**
 * JarvisSpeechService 3.0
 * Advanced Text-to-Speech (TTS) Synthesis with Male & Female Voice Profiles,
 * Multilingual Support (English, Urdu, Hindi, Arabic, Spanish, French, German),
 * Voice Preview, and Natural Vocal Cadence Simulation.
 */

export const JARVIS_VOICE_PROFILES = {
  natural: {
    id: 'natural',
    label: 'Natural Balanced',
    desc: 'Clear, well-paced human tone',
    pitchModifier: 1.0,
    rateModifier: 1.0
  },
  professional: {
    id: 'professional',
    label: 'Deep Professional',
    desc: 'Lower pitch, authoritative executive tone',
    pitchModifier: 0.85,
    rateModifier: 0.98
  },
  friendly: {
    id: 'friendly',
    label: 'Friendly Conversational',
    desc: 'Warm, dynamic, engaging cadence',
    pitchModifier: 1.08,
    rateModifier: 1.06
  }
};

export const JARVIS_LANG_LOCALES = {
  en: { code: 'en-US', label: 'English (US)', flag: '🇺🇸', sample: "Hello, I am Jarvis. All cafeteria operations are live and ready." },
  'en-gb': { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧', sample: "Good day, I am Jarvis. All cafeteria operations are live and ready." },
  ur: { code: 'ur-PK', label: 'Urdu (اردو)', flag: '🇵🇰', sample: "سلام، میں جاروس ہوں۔ کیفے ٹیریا کا نظام بالکل تیار ہے۔" },
  hi: { code: 'hi-IN', label: 'Hindi (हिंदी)', flag: '🇮🇳', sample: "नमस्ते, मैं जार्विस हूँ। कैफेटेरिया का सिस्टम पूरी तरह तैयार है।" },
  hinglish: { code: 'hi-IN', label: 'Hinglish', flag: '🇮🇳', sample: "Haanji sir, main Jarvis hoon. Cafeteria ke saare systems live hain." },
  ar: { code: 'ar-SA', label: 'Arabic (العربية)', flag: '🇸🇦', sample: "مرحباً، أنا جارفيس. جميع عمليات الكافتيريا جاهزة ونشطة." },
  es: { code: 'es-ES', label: 'Spanish (Español)', flag: '🇪🇸', sample: "Hola, soy Jarvis. Todas las operaciones de la cafetería están listas." },
  fr: { code: 'fr-FR', label: 'French (Français)', flag: '🇫🇷', sample: "Bonjour, je suis Jarvis. Toutes les opérations de la cafétéria sont prêtes." },
  de: { code: 'de-DE', label: 'German (Deutsch)', flag: '🇩🇪', sample: "Hallo, ich bin Jarvis. Alle Cafeteria-Systeme sind einsatzbereit." }
};

class JarvisSpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.voices = [];

    // Core Settings
    this.voiceEnabled = true;
    this.selectedGender = 'male'; // 'male' | 'female' | 'auto'
    this.selectedProfile = 'natural'; // 'natural' | 'professional' | 'friendly'
    this.selectedAccent = 'auto'; // 'auto' | 'us' | 'uk' | 'in'
    this.selectedLanguage = 'en'; // 'en' | 'ur' | 'hi' | 'hinglish' | 'ar' | 'es' | 'fr' | 'de'
    this.selectedVoiceName = 'auto'; // specific voice name or 'auto'
    this.speechRate = 1.0;
    this.speechPitch = 1.0;
    this.speechVolume = 1.0;

    // Callbacks
    this.onStart = null;
    this.onEnd = null;
    this.onAudioLevel = null;
    this.audioSimInterval = null;

    this._loadSettings();
    this._loadVoices();
  }

  _loadSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem('karobaar_jarvis_voice_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.voiceEnabled !== undefined) this.voiceEnabled = !!s.voiceEnabled;
        if (s.selectedGender) this.selectedGender = s.selectedGender;
        if (s.selectedProfile) this.selectedProfile = s.selectedProfile;
        if (s.selectedAccent) this.selectedAccent = s.selectedAccent;
        if (s.selectedLanguage) this.selectedLanguage = s.selectedLanguage;
        if (s.selectedVoiceName) this.selectedVoiceName = s.selectedVoiceName;
        if (s.speechRate) this.speechRate = Number(s.speechRate) || 1.0;
        if (s.speechPitch) this.speechPitch = Number(s.speechPitch) || 1.0;
        if (s.speechVolume) this.speechVolume = Number(s.speechVolume) || 1.0;
      }
    } catch (_) {}
  }

  saveSettings(newSettings = {}) {
    Object.assign(this, newSettings);
    if (typeof localStorage !== 'undefined') {
      try {
        const payload = {
          voiceEnabled: this.voiceEnabled,
          selectedGender: this.selectedGender,
          selectedProfile: this.selectedProfile,
          selectedAccent: this.selectedAccent,
          selectedLanguage: this.selectedLanguage,
          selectedVoiceName: this.selectedVoiceName,
          speechRate: this.speechRate,
          speechPitch: this.speechPitch,
          speechVolume: this.speechVolume
        };
        localStorage.setItem('karobaar_jarvis_voice_settings', JSON.stringify(payload));
      } catch (_) {}
    }
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
   * Intelligently selects the best matching system voice based on gender, language, accent and availability
   */
  resolveBestVoice(options = {}) {
    const voices = this.getAvailableVoices();
    if (!voices || voices.length === 0) return null;

    const voiceName = options.voiceName || this.selectedVoiceName;
    if (voiceName && voiceName !== 'auto') {
      const explicit = voices.find(v => v.name === voiceName || v.voiceURI === voiceName);
      if (explicit) return explicit;
    }

    const gender = options.gender || this.selectedGender || 'male';
    const langKey = options.lang || this.selectedLanguage || 'en';
    const localeConfig = JARVIS_LANG_LOCALES[langKey] || JARVIS_LANG_LOCALES.en;
    const targetLangPrefix = localeConfig.code.split('-')[0].toLowerCase();
    const accent = options.accent || this.selectedAccent || 'auto';

    // 1. Filter voices for the target language
    let langMatches = voices.filter(v => (v.lang || '').toLowerCase().startsWith(targetLangPrefix));
    if (langMatches.length === 0) {
      // Fallback to English voices if target language has no native system voice installed
      langMatches = voices.filter(v => (v.lang || '').toLowerCase().startsWith('en'));
    }
    if (langMatches.length === 0) langMatches = voices;

    // 2. Filter by accent if requested
    if (accent === 'uk') {
      const ukMatches = langMatches.filter(v => (v.lang || '').toLowerCase().includes('gb') || v.name.toLowerCase().includes('uk') || v.name.toLowerCase().includes('british'));
      if (ukMatches.length > 0) langMatches = ukMatches;
    } else if (accent === 'us') {
      const usMatches = langMatches.filter(v => (v.lang || '').toLowerCase().includes('us') || v.name.toLowerCase().includes('us') || v.name.toLowerCase().includes('united states'));
      if (usMatches.length > 0) langMatches = usMatches;
    } else if (accent === 'in') {
      const inMatches = langMatches.filter(v => (v.lang || '').toLowerCase().includes('in') || v.name.toLowerCase().includes('india'));
      if (inMatches.length > 0) langMatches = inMatches;
    }

    // 3. Filter by gender heuristics
    const maleKeywords = ['male', 'david', 'george', 'daniel', 'oliver', 'guy', 'james', 'richard', 'stefan', 'paul', 'jorge', 'maged'];
    const femaleKeywords = ['female', 'zira', 'samantha', 'victoria', 'jenny', 'karen', 'moira', 'susan', 'catherine', 'hazel', 'helen', 'helena', 'hoda'];

    if (gender === 'male') {
      const maleVoice = langMatches.find(v => {
        const nameLower = v.name.toLowerCase();
        return maleKeywords.some(kw => nameLower.includes(kw));
      });
      if (maleVoice) return maleVoice;
    } else if (gender === 'female') {
      const femaleVoice = langMatches.find(v => {
        const nameLower = v.name.toLowerCase();
        return femaleKeywords.some(kw => nameLower.includes(kw));
      });
      if (femaleVoice) return femaleVoice;
    }

    // 4. Return natural preferred voice or first available
    const preferred = langMatches.find(v => 
      v.name.includes('Natural') || 
      v.name.includes('Google') || 
      v.name.includes('Neural') ||
      v.name.includes('Enhanced')
    );

    return preferred || langMatches[0] || voices[0];
  }

  /**
   * Speak plain or markdown text
   */
  speak(text, options = {}) {
    if (!this.synth || !this.voiceEnabled) return;

    this.stop(); // Stop any currently playing utterance

    // Strip markdown formatting symbols for natural human speech
    const cleanText = String(text || '')
      .replace(/[*#_`>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\b(?:https?:\/\/|www\.)\S+/gi, 'link')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Profile pitch and rate calculation
    const profileKey = options.profile || this.selectedProfile || 'natural';
    const profile = JARVIS_VOICE_PROFILES[profileKey] || JARVIS_VOICE_PROFILES.natural;

    const baseRate = Number(options.rate !== undefined ? options.rate : this.speechRate) || 1.0;
    const basePitch = Number(options.pitch !== undefined ? options.pitch : this.speechPitch) || 1.0;
    const baseVolume = Number(options.volume !== undefined ? options.volume : this.speechVolume) || 1.0;

    utterance.rate = Math.max(0.5, Math.min(2.0, baseRate * profile.rateModifier));
    utterance.pitch = Math.max(0.5, Math.min(1.8, basePitch * profile.pitchModifier));
    utterance.volume = Math.max(0, Math.min(1.0, baseVolume));

    // Resolve voice
    const matchedVoice = this.resolveBestVoice({
      gender: options.gender || this.selectedGender,
      lang: options.lang || this.selectedLanguage,
      accent: options.accent || this.selectedAccent,
      voiceName: options.voiceName || this.selectedVoiceName
    });

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      const loc = JARVIS_LANG_LOCALES[options.lang || this.selectedLanguage] || JARVIS_LANG_LOCALES.en;
      utterance.lang = loc.code;
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

    // Keep reference on window to prevent premature garbage collection on Windows WebView
    if (typeof window !== 'undefined') {
      window._jarvisActiveUtterance = utterance;
      utterance.addEventListener('end', () => { window._jarvisActiveUtterance = null; });
      utterance.addEventListener('error', () => { window._jarvisActiveUtterance = null; });
      try {
        this.synth.resume();
      } catch (_) {}
    }

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /**
   * Preview a voice with custom test sample
   */
  previewVoice(options = {}) {
    const langKey = options.lang || this.selectedLanguage || 'en';
    const loc = JARVIS_LANG_LOCALES[langKey] || JARVIS_LANG_LOCALES.en;
    const sample = options.text || loc.sample;
    this.speak(sample, { ...options, force: true });
  }

  /**
   * Stop speech immediately (allow user to interrupt Jarvis instantly)
   */
  stop() {
    if (!this.synth) return;
    try {
      this.synth.cancel();
    } catch (_) {}
    this.isSpeaking = false;
    this._stopAudioCadenceSimulation();
    if (this.onEnd) this.onEnd();
  }

  /**
   * Simulates dynamic RMS audio levels during speech playback to animate the Intelligence Orb and Waveforms
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
      const baseWave = Math.sin(step * 0.45) * 0.38 + 0.48;
      const microJitter = (Math.random() - 0.5) * 0.28;
      const simulatedLevel = Math.max(0.12, Math.min(0.96, baseWave + microJitter));

      if (this.onAudioLevel) {
        this.onAudioLevel(simulatedLevel);
      }
    }, 50);
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
