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

  if (!isOpen) return null;

  // Test Voice function using selected voice and parameters
  const handleTestVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let sampleText = `Hello! I am ${settings.assistantName}. Your voice settings are configured and ready.`;
    if (settings.aiLanguage === 'hi') {
      sampleText = `नमस्ते! मैं ${settings.assistantName} हूँ। आपकी आवाज़ की सेटिंग्स बिल्कुल तैयार हैं।`;
    } else if (settings.aiLanguage === 'hinglish') {
      sampleText = `जी सर, मैं ${settings.assistantName} हूँ! आपकी वॉयस सेटिंग्स बिल्कुल सही काम कर रही हैं।`;
    } else if (settings.aiLanguage === 'ur') {
      sampleText = `سلام! میں ${settings.assistantName} ہوں۔ آپ کی آواز کی ترتیبات مکمل طور پر تیار ہیں۔`;
    } else if (settings.aiLanguage === 'es') {
      sampleText = `¡Hola! Soy ${settings.assistantName}. La configuración de voz está lista.`;
    } else if (settings.aiLanguage === 'ar') {
      sampleText = `مرحباً! أنا ${settings.assistantName}. تم إعداد الصوت بنجاح.`;
    }

    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.rate = Number(settings.speechRate) || 1.05;
    utterance.pitch = Number(settings.speechPitch) || 1.0;
    utterance.volume = Number(settings.speechVolume) || 1.0;

    const voices = systemVoices.length > 0 ? systemVoices : window.speechSynthesis.getVoices();

    if (settings.selectedVoiceName && settings.selectedVoiceName !== 'auto') {
      const match = voices.find(v => v.name === settings.selectedVoiceName || v.voiceURI === settings.selectedVoiceName);
      if (match) utterance.voice = match;
    } else {
      if (settings.aiLanguage === 'hi' || settings.aiLanguage === 'hinglish') {
        const hiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
        if (hiVoice) utterance.voice = hiVoice;
        utterance.lang = 'hi-IN';
      } else {
        const inVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));
        if (inVoice) utterance.voice = inVoice;
        utterance.lang = 'en-IN';
      }
    }

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
                <label className="setting-label">Selected System Voice</label>
                <p className="setting-desc">Choose from any available voice installed on your device</p>
                <div className="voice-select-with-test">
                  <select 
                    value={settings.selectedVoiceName || 'auto'}
                    onChange={(e) => handleChange('selectedVoiceName', e.target.value)}
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
                    onClick={handleTestVoice} 
                    className="test-voice-btn"
                    title="Play voice sample"
                  >
                    <Play size={12} />
                    <span>Test</span>
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <div className="setting-input-block">
                <label className="setting-label">Spoken & Understood Language</label>
                <div className="setting-pill-options">
                  {[
                    { id: 'hinglish', label: 'Hinglish (Hindi + English)' },
                    { id: 'en-in', label: 'English (India)' },
                    { id: 'en', label: 'English (US / Global)' },
                    { id: 'en-gb', label: 'English (UK)' },
                    { id: 'hi', label: 'हिंदी (Hindi)' },
                    { id: 'ur', label: 'اردو (Urdu)' },
                    { id: 'ar', label: 'العربية (Arabic)' },
                    { id: 'es', label: 'Español (Spanish)' }
                  ].map(lang => (
                    <button 
                      key={lang.id}
                      type="button" 
                      onClick={() => handleChange('aiLanguage', lang.id)}
                      className={`setting-choice-btn ${settings.aiLanguage === lang.id ? 'selected' : ''}`}
                    >
                      {lang.label}
                    </button>
                  ))}
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
