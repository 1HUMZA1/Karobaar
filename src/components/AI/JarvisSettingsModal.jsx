import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Settings, 
  Volume2, 
  VolumeX, 
  Mic, 
  Sparkles, 
  Bot, 
  Sliders, 
  ShieldCheck, 
  RotateCcw, 
  Trash2, 
  Check, 
  Globe, 
  Play,
  Clock,
  Repeat
} from 'lucide-react';
import './JarvisSettingsModal.css';

/**
 * JarvisSettingsModal
 * Comprehensive settings center allowing users to customize every aspect of Jarvis:
 * Name, Voice rate/pitch/volume/system voice, Silence Wait Time (full command listening),
 * Spoken language, Listening modes, Visual Avatar, Persona, and Anti-Repetition.
 */

export const JARVIS_LANGUAGES = [
  { id: 'hinglish', label: 'Hinglish', sub: 'Hindi + English', tag: 'IN' },
  { id: 'en', label: 'English', sub: 'US / Global', tag: 'US' },
  { id: 'en-in', label: 'English', sub: 'India', tag: 'IN' },
  { id: 'en-gb', label: 'English', sub: 'UK', tag: 'UK' },
  { id: 'hi', label: 'हिंदी', sub: 'Hindi', tag: 'IN' },
  { id: 'ur', label: 'اردو', sub: 'Urdu', tag: 'PK' },
  { id: 'bn', label: 'বাংলা', sub: 'Bengali', tag: 'IN' },
  { id: 'ta', label: 'தமிழ்', sub: 'Tamil', tag: 'IN' },
  { id: 'te', label: 'తెలుగు', sub: 'Telugu', tag: 'IN' },
  { id: 'mr', label: 'मराठी', sub: 'Marathi', tag: 'IN' },
  { id: 'gu', label: 'ગુજરાતી', sub: 'Gujarati', tag: 'IN' },
  { id: 'ar', label: 'العربية', sub: 'Arabic', tag: 'SA' },
  { id: 'es', label: 'Español', sub: 'Spanish', tag: 'ES' }
];

export const JARVIS_SPEECH_SAMPLES = {
  en: {
    native: "Hello! I am {name}. Your voice settings are configured and ready.",
    phonetic: "Hello! I am {name}. Your voice settings are configured and ready.",
    lang: "en-US"
  },
  'en-in': {
    native: "Hello! I am {name}. Your voice settings are configured and ready.",
    phonetic: "Hello! I am {name}. Your voice settings are configured and ready.",
    lang: "en-IN"
  },
  'en-gb': {
    native: "Hello! I am {name}. Your voice settings are configured and ready.",
    phonetic: "Hello! I am {name}. Your voice settings are configured and ready.",
    lang: "en-GB"
  },
  hinglish: {
    native: "जी सर, मैं {name} हूँ! आपकी वॉयس सेटिंग्स बिल्कुल सही काम कर रही हैं।",
    phonetic: "Ji sir! Main {name} hoon. Aapki voice settings bilkul sahi kaam kar rahi hain.",
    lang: "hi-IN"
  },
  hi: {
    native: "नमस्ते! मैं {name} हूँ। आपकी आवाज़ की सेटिंग्स बिल्कुल तैयार हैं।",
    phonetic: "Namaste! Main {name} hoon. Aapki aawaaz ki settings bilkul tayyar hain.",
    lang: "hi-IN"
  },
  ur: {
    native: "سلام! میں {name} ہوں۔ آپ کی آواز کی ترتیبات مکمل طور پر تیار ہیں۔",
    phonetic: "Salam! Main {name} hoon. Aap ki aawaaz ki setting mukammal tayyar hai.",
    lang: "ur-PK"
  },
  bn: {
    native: "নমস্কার! আমি {name}। আপনার ভয়েস সেটিংস সম্পূর্ণ প্রস্তুত।",
    phonetic: "Nomoshkar! Aami {name}. Aponar voice settings ekdom toiri.",
    lang: "bn-IN"
  },
  ta: {
    native: "வணக்கம்! நான் {name}. உங்கள் குரல் அமைப்புகள் தயாராக உள்ளன.",
    phonetic: "Vanakkam! Naan {name}. Ungal kural amaippugal thayaaraaga ullana.",
    lang: "ta-IN"
  },
  te: {
    native: "నమస్కారం! నేను {name}. మీ వాయిస్ సెట్టింగ్‌లు సిద్ధంగా ఉన్నాయి.",
    phonetic: "Namaskaram! Nenu {name}. Mee voice settings poorthiga sidhamgaa unnaayi.",
    lang: "te-IN"
  },
  mr: {
    native: "नमस्कार! मी {name} आहे. तुमचे व्हॉइस सेटिंग्ज पूर्णपणे तयार आहेत.",
    phonetic: "Namaskar! Mee {name} aahe. Tumchi aawajachi settings purna tayar aahe.",
    lang: "mr-IN"
  },
  gu: {
    native: "નમસ્તે! હું {name} છું. તમારો વોઈસ સેટિંગ્સ તૈયાર છે.",
    phonetic: "Namaste! Hoon {name} chhoon. Tamaari voice settings taiyaar chhe.",
    lang: "gu-IN"
  },
  ar: {
    native: "مرحباً! أنا {name}. تم إعداد الصوت بنجاح.",
    phonetic: "Marhaban! Ana {name}. Tam iadaad as-sawt binajah.",
    lang: "ar-SA"
  },
  es: {
    native: "¡Hola! Soy {name}. La configuración de voz está lista.",
    phonetic: "Hola! Soy {name}. La configuracion de voz esta lista.",
    lang: "es-ES"
  }
};

export const JarvisSettingsModal = ({
  isOpen = false,
  onClose = () => {},
  currentSettings = {},
  onSaveSettings = () => {},
  onClearHistory = () => {}
}) => {
  const [activeTab, setActiveTab] = useState('voice'); // 'voice' | 'identity' | 'listening' | 'character' | 'safety'
  const [systemVoices, setSystemVoices] = useState([]);
  const modalBodyRef = useRef(null);

  // Reset scroll to top on tab change or modal open
  useEffect(() => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  }, [activeTab, isOpen]);

  // Fetch available system voices dynamically from SpeechSynthesis
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setSystemVoices(v);
        }
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const [settings, setSettings] = useState({
    assistantName: 'Jarvis',
    persona: 'friendly', // 'friendly' | 'concise' | 'advisor'
    voiceFeedback: true,
    selectedVoiceName: 'auto',
    speechRate: 1.05,
    speechPitch: 1.0,
    speechVolume: 1.0,
    speechPauseDelay: 1.5, // Wait time in seconds for full command before replying
    aiLanguage: 'hinglish',
    listeningMode: 'ambient',
    wakeChime: true,
    characterStyle: 'robot', // 'robot' | 'orb' | 'pulse'
    characterPosition: 'bottom_left',
    autoExecuteSafe: true,
    confirmSensitive: true,
    preventRepetitions: true,
    verbosity: 'balanced', // 'concise' | 'balanced' | 'detailed'
    ...currentSettings
  });

  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setSettings(prev => ({ ...prev, ...currentSettings }));
    }
  }, [currentSettings, isOpen]);

  const handleChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  function handleSave() {
    onSaveSettings(settings);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 400);
  }

  const davidVoice = systemVoices.find(v => v.name.includes('David'));
  const ziraVoice = systemVoices.find(v => v.name.includes('Zira'));

  if (!isOpen) return null;

  // Test Voice function using selected voice and parameters
  const handleTestVoice = (overrideLang, overrideVoiceName) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (e) {}

    const activeLang = overrideLang || settings.aiLanguage || 'hinglish';
    const activeVoiceName = overrideVoiceName !== undefined ? overrideVoiceName : (settings.selectedVoiceName || 'auto');
    const assistantName = settings.assistantName || 'Jarvis';

    const sampleConfig = JARVIS_SPEECH_SAMPLES[activeLang] || JARVIS_SPEECH_SAMPLES.en;
    const voices = (systemVoices && systemVoices.length > 0) ? systemVoices : window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (activeVoiceName && activeVoiceName !== 'auto') {
      selectedVoice = voices.find(v => v.name === activeVoiceName || v.voiceURI === activeVoiceName) || null;
    }

    // Determine if selected voice or system has native support for this language
    let isNativeVoice = false;
    const targetPrefix = (sampleConfig.lang || 'en').toLowerCase().split('-')[0];

    if (selectedVoice) {
      const vLang = (selectedVoice.lang || '').toLowerCase();
      if (vLang.startsWith(targetPrefix)) {
        isNativeVoice = true;
      }
    } else {
      // Auto mode: try to find a native voice for target language
      const nativeCandidate = voices.find(v => (v.lang || '').toLowerCase().startsWith(targetPrefix));
      if (nativeCandidate) {
        selectedVoice = nativeCandidate;
        isNativeVoice = true;
      } else {
        // Fallback to David / Zira or default host voice
        const david = voices.find(v => v.name.includes('David'));
        const zira = voices.find(v => v.name.includes('Zira'));
        selectedVoice = david || zira || voices[0] || null;
      }
    }

    // Choose native script only if voice natively supports it; otherwise smooth Roman phonetic transliteration!
    const textToSpeak = (isNativeVoice ? sampleConfig.native : sampleConfig.phonetic).replace(/\{name\}/g, assistantName);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = Number(settings.speechRate) || 1.05;
    utterance.pitch = Number(settings.speechPitch) || 1.0;
    utterance.volume = Number(settings.speechVolume) || 1.0;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = isNativeVoice ? (sampleConfig.lang || selectedVoice.lang) : (selectedVoice.lang || 'en-US');
    } else {
      utterance.lang = isNativeVoice ? (sampleConfig.lang || 'en-US') : 'en-US';
    }

    // Prevent garbage collection from cancelling audio prematurely on Chromium/Windows
    window._jarvisSettingsUtterance = utterance;
    utterance.onend = () => { window._jarvisSettingsUtterance = null; };
    utterance.onerror = () => { window._jarvisSettingsUtterance = null; };

    try {
      window.speechSynthesis.resume();
    } catch (_) {}

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="jarvis-settings-overlay" onClick={onClose}>
      <div 
        className="jarvis-settings-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Jarvis Assistant Settings"
      >
        {/* Header */}
        <div className="settings-modal-header">
          <div className="settings-header-left">
            <div className="settings-header-avatar">
              <Settings size={16} />
            </div>
            <div>
              <h3 className="settings-modal-title">{settings.assistantName} Settings</h3>
              <p className="settings-modal-sub">Customize voice, full command listening, language & avatar</p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="settings-close-btn" title="Close settings">
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="settings-modal-tabs">
          <button 
            type="button" 
            onClick={() => setActiveTab('voice')}
            className={`settings-tab-btn ${activeTab === 'voice' ? 'active' : ''}`}
          >
            <Volume2 size={13} />
            <span>Voice & Audio</span>
          </button>

          <button 
            type="button" 
            onClick={() => setActiveTab('identity')}
            className={`settings-tab-btn ${activeTab === 'identity' ? 'active' : ''}`}
          >
            <Bot size={13} />
            <span>Identity & Tone</span>
          </button>

          <button 
            type="button" 
            onClick={() => setActiveTab('listening')}
            className={`settings-tab-btn ${activeTab === 'listening' ? 'active' : ''}`}
          >
            <Mic size={13} />
            <span>Listening</span>
          </button>

          <button 
            type="button" 
            onClick={() => setActiveTab('character')}
            className={`settings-tab-btn ${activeTab === 'character' ? 'active' : ''}`}
          >
            <Sparkles size={13} />
            <span>Character Avatar</span>
          </button>

          <button 
            type="button" 
            onClick={() => setActiveTab('safety')}
            className={`settings-tab-btn ${activeTab === 'safety' ? 'active' : ''}`}
          >
            <ShieldCheck size={13} />
            <span>Safety & Memory</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="settings-modal-body custom-scrollbar" ref={modalBodyRef}>
          {/* TAB 1: VOICE & AUDIO */}
          {activeTab === 'voice' && (
            <div className="settings-section">
              {/* Voice Output Toggle */}
              <div className="setting-toggle-row">
                <div>
                  <h4 className="setting-label">Voice Speech Output</h4>
                  <p className="setting-desc">Speak answers out loud with human-like cadence</p>
                </div>
                <label className="jarvis-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.voiceFeedback} 
                    onChange={(e) => handleChange('voiceFeedback', e.target.checked)} 
                  />
                  <span className="jarvis-slider" />
                </label>
              </div>

              {/* System Voice Selection */}
              <div className="setting-input-block">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="setting-label">Selected System Voice</label>
                  <span className="setting-badge-pill">
                    {settings.selectedVoiceName === 'auto' ? '✨ Auto-detected' : (settings.selectedVoiceName || 'Default')}
                  </span>
                </div>
                <p className="setting-desc">Choose from high-clarity host voices with instant sample playback</p>

                {/* Quick Voice Chips */}
                <div className="voice-quick-chips">
                  <button 
                    type="button" 
                    className={`voice-chip ${(!settings.selectedVoiceName || settings.selectedVoiceName === 'auto') ? 'active' : ''}`}
                    onClick={() => {
                      handleChange('selectedVoiceName', 'auto');
                      handleTestVoice(settings.aiLanguage, 'auto');
                    }}
                  >
                    <span>✨ Auto Match</span>
                    {(!settings.selectedVoiceName || settings.selectedVoiceName === 'auto') && (
                      <span className="chip-tick-pill">✓ Selected</span>
                    )}
                  </button>

                  {davidVoice && (
                    <button 
                      type="button" 
                      className={`voice-chip ${settings.selectedVoiceName === davidVoice.name ? 'active' : ''}`}
                      onClick={() => {
                        handleChange('selectedVoiceName', davidVoice.name);
                        handleTestVoice(settings.aiLanguage, davidVoice.name);
                      }}
                    >
                      <span>👨 Male (David)</span>
                      {settings.selectedVoiceName === davidVoice.name && (
                        <span className="chip-tick-pill">✓ Selected</span>
                      )}
                    </button>
                  )}

                  {ziraVoice && (
                    <button 
                      type="button" 
                      className={`voice-chip ${settings.selectedVoiceName === ziraVoice.name ? 'active' : ''}`}
                      onClick={() => {
                        handleChange('selectedVoiceName', ziraVoice.name);
                        handleTestVoice(settings.aiLanguage, ziraVoice.name);
                      }}
                    >
                      <span>👩 Female (Zira)</span>
                      {settings.selectedVoiceName === ziraVoice.name && (
                        <span className="chip-tick-pill">✓ Selected</span>
                      )}
                    </button>
                  )}
                </div>

                <div className="voice-select-with-test" style={{ marginTop: '10px' }}>
                  <select 
                    value={settings.selectedVoiceName || 'auto'}
                    onChange={(e) => {
                      const newVoice = e.target.value;
                      handleChange('selectedVoiceName', newVoice);
                      handleTestVoice(settings.aiLanguage, newVoice);
                    }}
                    className="setting-select-field"
                  >
                    <option value="auto">✨ Auto / Best Match for Language</option>
                    {systemVoices.map(v => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => handleTestVoice(settings.aiLanguage, settings.selectedVoiceName)} 
                    className="test-voice-btn"
                    title="Play voice sample in active language"
                  >
                    <Play size={12} />
                    <span>Test Voice</span>
                  </button>
                </div>
              </div>

              {/* Spoken & Understood Language */}
              <div className="setting-input-block">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="setting-label">Spoken & Understood Language</label>
                  <span className="setting-badge-pill" style={{ color: '#10b981' }}>
                    13 Languages Supported
                  </span>
                </div>
                <p className="setting-desc">Click any language to hear instant live pronunciation in your chosen voice</p>
                
                <div className="setting-language-grid">
                  {JARVIS_LANGUAGES.map(lang => {
                    const isSelected = settings.aiLanguage === lang.id;
                    return (
                      <button 
                        key={lang.id}
                        type="button" 
                        onClick={() => {
                          handleChange('aiLanguage', lang.id);
                          handleTestVoice(lang.id, settings.selectedVoiceName);
                        }}
                        className={`setting-language-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="lang-tag-row">
                          <span className="lang-country-badge">{lang.tag}</span>
                          {isSelected ? (
                            <span className="lang-selected-pill">✓ Selected</span>
                          ) : (
                            <span className="lang-select-action">Select</span>
                          )}
                        </div>
                        <div className="lang-title-row">
                          <span className="lang-native-name">{lang.label}</span>
                          <span className="lang-sub-name">{lang.sub}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Silence Wait Time Before Replying (Wait for Full Command) */}
              <div className="setting-input-block">
                <div className="setting-label-with-val">
                  <label className="setting-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} />
                    <span>Silence Wait Time (Wait for Full Command)</span>
                  </label>
                  <span className="setting-slider-val">{settings.speechPauseDelay || 1.5}s</span>
                </div>
                <p className="setting-desc">
                  How long Jarvis waits in silence after you speak before answering. Prevents Jarvis from interrupting while you pause to think or breathe.
                </p>
                <input 
                  type="range" 
                  min="0.8" 
                  max="2.5" 
                  step="0.1"
                  value={settings.speechPauseDelay || 1.5}
                  onChange={(e) => handleChange('speechPauseDelay', parseFloat(e.target.value))}
                  className="jarvis-slider-input"
                />
                <div className="slider-hints">
                  <span>0.8s (Fast)</span>
                  <span>1.5s (Balanced - Recommended)</span>
                  <span>2.5s (Patient - Long Pauses)</span>
                </div>
              </div>

              {/* Speech Speed */}
              <div className="setting-input-block">
                <div className="setting-label-with-val">
                  <label className="setting-label">Speech Speed / Rate</label>
                  <span className="setting-slider-val">{settings.speechRate}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.8" 
                  max="1.3" 
                  step="0.05"
                  value={settings.speechRate}
                  onChange={(e) => handleChange('speechRate', parseFloat(e.target.value))}
                  className="jarvis-slider-input"
                />
                <div className="slider-hints">
                  <span>0.8x (Clear)</span>
                  <span>1.0x (Normal)</span>
                  <span>1.3x (Fast)</span>
                </div>
              </div>

              {/* Voice Pitch */}
              <div className="setting-input-block">
                <div className="setting-label-with-val">
                  <label className="setting-label">Voice Pitch</label>
                  <span className="setting-slider-val">{settings.speechPitch}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.8" 
                  max="1.2" 
                  step="0.05"
                  value={settings.speechPitch}
                  onChange={(e) => handleChange('speechPitch', parseFloat(e.target.value))}
                  className="jarvis-slider-input"
                />
              </div>

              {/* Voice Volume */}
              <div className="setting-input-block">
                <div className="setting-label-with-val">
                  <label className="setting-label">Voice Volume</label>
                  <span className="setting-slider-val">{Math.round((settings.speechVolume || 1.0) * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.2" 
                  max="1.0" 
                  step="0.05"
                  value={settings.speechVolume || 1.0}
                  onChange={(e) => handleChange('speechVolume', parseFloat(e.target.value))}
                  className="jarvis-slider-input"
                />
              </div>
            </div>
          )}

          {/* TAB 2: IDENTITY & ANTI-REPETITION */}
          {activeTab === 'identity' && (
            <div className="settings-section">
              <div className="setting-input-block">
                <label className="setting-label">Assistant Name</label>
                <p className="setting-desc">The wake-word and display name of your assistant</p>
                <div className="name-quick-choices">
                  {['Jarvis', 'Mr. H', 'Karobaar AI'].map(name => (
                    <button 
                      key={name}
                      type="button" 
                      onClick={() => handleChange('assistantName', name)}
                      className={`setting-choice-btn ${settings.assistantName === name ? 'selected' : ''}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={settings.assistantName} 
                  onChange={(e) => handleChange('assistantName', e.target.value)}
                  placeholder="Or enter custom name..."
                  className="setting-text-field"
                  maxLength={24}
                />
              </div>

              {/* Anti-Repetition Engine Toggle */}
              <div className="setting-toggle-row">
                <div>
                  <h4 className="setting-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Repeat size={13} />
                    <span>Smart Anti-Repetition Engine</span>
                  </h4>
                  <p className="setting-desc">Varies intros and greetings dynamically; prevents Jarvis from saying the same things repeatedly</p>
                </div>
                <label className="jarvis-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.preventRepetitions !== false} 
                    onChange={(e) => handleChange('preventRepetitions', e.target.checked)} 
                  />
                  <span className="jarvis-slider" />
                </label>
              </div>

              {/* Response Verbosity */}
              <div className="setting-input-block">
                <label className="setting-label">Response Verbosity</label>
                <p className="setting-desc">How detailed Jarvis answers your queries</p>
                <div className="setting-pill-options">
                  {[
                    { id: 'concise', label: '⚡ Concise (1-sentence answers)' },
                    { id: 'balanced', label: '🤝 Balanced (Natural coworker)' },
                    { id: 'detailed', label: '📊 Detailed (In-depth analysis)' }
                  ].map(v => (
                    <button 
                      key={v.id}
                      type="button"
                      onClick={() => handleChange('verbosity', v.id)}
                      className={`setting-choice-btn ${settings.verbosity === v.id ? 'selected' : ''}`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-input-block">
                <label className="setting-label">Conversational Persona</label>
                <p className="setting-desc">How Jarvis communicates with you</p>
                <div className="persona-cards-grid">
                  <button 
                    type="button"
                    onClick={() => handleChange('persona', 'friendly')}
                    className={`persona-option-card ${settings.persona === 'friendly' ? 'selected' : ''}`}
                  >
                    <h5>🤝 Friendly Coworker</h5>
                    <p>Warm, conversational tone, explains business details simply and answers like a real human.</p>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleChange('persona', 'concise')}
                    className={`persona-option-card ${settings.persona === 'concise' ? 'selected' : ''}`}
                  >
                    <h5>⚡ Concise & Direct</h5>
                    <p>Minimal words, exact numbers, fastest response time.</p>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleChange('persona', 'advisor')}
                    className={`persona-option-card ${settings.persona === 'advisor' ? 'selected' : ''}`}
                  >
                    <h5>📊 Strategic Executive</h5>
                    <p>In-depth insights, margin calculations, and profit optimization suggestions.</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LISTENING & WAKE WORD */}
          {activeTab === 'listening' && (
            <div className="settings-section">
              <div className="setting-input-block">
                <label className="setting-label">Microphone Capture Mode</label>
                <div className="listening-modes-list">
                  <label className="listening-mode-card">
                    <input 
                      type="radio" 
                      name="listeningMode" 
                      value="ambient"
                      checked={settings.listeningMode === 'ambient'}
                      onChange={() => handleChange('listeningMode', 'ambient')}
                    />
                    <div>
                      <strong>Continuous Ambient Listening (Recommended)</strong>
                      <p>Jarvis listens from everywhere for "Hey {settings.assistantName}" without needing to click.</p>
                    </div>
                  </label>

                  <label className="listening-mode-card">
                    <input 
                      type="radio" 
                      name="listeningMode" 
                      value="push_to_talk"
                      checked={settings.listeningMode === 'push_to_talk'}
                      onChange={() => handleChange('listeningMode', 'push_to_talk')}
                    />
                    <div>
                      <strong>Click-to-Talk Only</strong>
                      <p>Microphone captures only after explicitly clicking the character or mic button.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="setting-toggle-row">
                <div>
                  <h4 className="setting-label">Audio Wake Chime</h4>
                  <p className="setting-desc">Play 2-tone chime when assistant wakes up</p>
                </div>
                <label className="jarvis-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.wakeChime} 
                    onChange={(e) => handleChange('wakeChime', e.target.checked)} 
                  />
                  <span className="jarvis-slider" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: CHARACTER AVATAR */}
          {activeTab === 'character' && (
            <div className="settings-section">
              <div className="setting-input-block">
                <label className="setting-label">Character Visual Style</label>
                <div className="character-styles-grid">
                  <button 
                    type="button"
                    onClick={() => handleChange('characterStyle', 'robot')}
                    className={`char-style-card ${settings.characterStyle === 'robot' ? 'selected' : ''}`}
                  >
                    <div className="char-preview-icon">🤖</div>
                    <strong>Mini Robot Buddy</strong>
                    <span>Expressive eyes, animated antenna, living digital face</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleChange('characterStyle', 'orb')}
                    className={`char-style-card ${settings.characterStyle === 'orb' ? 'selected' : ''}`}
                  >
                    <div className="char-preview-icon">🌐</div>
                    <strong>Futuristic Core Orb</strong>
                    <span>Concentric rotating rings & glowing central core</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleChange('characterStyle', 'pulse')}
                    className={`char-style-card ${settings.characterStyle === 'pulse' ? 'selected' : ''}`}
                  >
                    <div className="char-preview-icon">⚡</div>
                    <strong>Minimalist Sound Bar</strong>
                    <span>Subtle audio equalizer dots</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SAFETY & MEMORY */}
          {activeTab === 'safety' && (
            <div className="settings-section">
              <div className="setting-toggle-row">
                <div>
                  <h4 className="setting-label">Auto-Execute Safe Actions</h4>
                  <p className="setting-desc">Instantly switch themes, search stock, and open pages on voice command</p>
                </div>
                <label className="jarvis-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.autoExecuteSafe} 
                    onChange={(e) => handleChange('autoExecuteSafe', e.target.checked)} 
                  />
                  <span className="jarvis-slider" />
                </label>
              </div>

              <div className="setting-toggle-row">
                <div>
                  <h4 className="setting-label">Require Confirmation for Financials</h4>
                  <p className="setting-desc">Always confirm before creating sales, recording expenses, or altering inventory</p>
                </div>
                <label className="jarvis-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.confirmSensitive} 
                    onChange={(e) => handleChange('confirmSensitive', e.target.checked)} 
                  />
                  <span className="jarvis-slider" />
                </label>
              </div>

              <div className="settings-danger-zone">
                <button 
                  type="button" 
                  onClick={onClearHistory} 
                  className="clear-history-action-btn"
                >
                  <Trash2 size={13} />
                  <span>Clear Conversation History</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="settings-modal-footer">
          <button type="button" onClick={onClose} className="settings-btn-cancel">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="settings-btn-save">
            {savedNotice ? <Check size={14} /> : null}
            <span>{savedNotice ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default JarvisSettingsModal;
