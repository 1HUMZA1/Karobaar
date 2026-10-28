import React, { useState, useEffect } from 'react';
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
  Play
} from 'lucide-react';
import './JarvisSettingsModal.css';

/**
 * JarvisSettingsModal
 * Comprehensive settings center allowing users to customize every aspect of Jarvis:
 * Name, Voice rate/pitch, Language, Listening modes, Visual Avatar, Persona, and Safety permissions.
 */
export const JarvisSettingsModal = ({
  isOpen = false,
  onClose = () => {},
  currentSettings = {},
  onSaveSettings = () => {},
  onClearHistory = () => {}
}) => {
  const [activeTab, setActiveTab] = useState('voice'); // 'voice' | 'identity' | 'listening' | 'character' | 'safety'
  
  const [settings, setSettings] = useState({
    assistantName: 'Jarvis',
    persona: 'friendly', // 'friendly' | 'concise' | 'advisor'
    voiceFeedback: true,
    speechRate: 1.05,
    speechPitch: 1.0,
    aiLanguage: 'hinglish', // 'hinglish' | 'en' | 'hi'
    listeningMode: 'ambient', // 'ambient' | 'push_to_talk' | 'wake_word'
    wakeChime: true,
    characterStyle: 'robot', // 'robot' | 'orb' | 'pulse'
    characterPosition: 'bottom_left', // 'bottom_left' | 'bottom_right'
    autoExecuteSafe: true,
    confirmSensitive: true,
    ...currentSettings
  });

  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setSettings(prev => ({ ...prev, ...currentSettings }));
    }
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    onSaveSettings(settings);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 400);
  };

  // Test Voice function
  const handleTestVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let sampleText = `Hello! I am ${settings.assistantName}. Your voice settings are configured and ready.`;
    if (settings.aiLanguage === 'hi') {
      sampleText = `नमस्ते! मैं ${settings.assistantName} हूँ। आपकी आवाज़ की सेटिंग्स बिल्कुल तैयार हैं।`;
    } else if (settings.aiLanguage === 'hinglish') {
      sampleText = `जी सर, मैं ${settings.assistantName} हूँ! आपकी वॉयस सेटिंग्स टेस्ट हो रही हैं। सब कुछ तैयार है!`;
    }

    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.rate = Number(settings.speechRate) || 1.05;
    utterance.pitch = Number(settings.speechPitch) || 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (settings.aiLanguage === 'hi' || settings.aiLanguage === 'hinglish') {
      const hiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (hiVoice) utterance.voice = hiVoice;
      utterance.lang = 'hi-IN';
    } else {
      const inVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));
      if (inVoice) utterance.voice = inVoice;
      utterance.lang = 'en-IN';
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
              <p className="settings-modal-sub">Customize voice, character, listening & behavior</p>
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
            <span>Identity & Name</span>
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

        {/* Tab Contents */}
        <div className="settings-modal-content custom-scrollbar">
          {/* TAB 1: VOICE & AUDIO */}
          {activeTab === 'voice' && (
            <div className="settings-section">
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

              <div className="setting-input-block">
                <label className="setting-label">Spoken Language</label>
                <div className="setting-pill-options">
                  <button 
                    type="button" 
                    onClick={() => handleChange('aiLanguage', 'hinglish')}
                    className={`setting-choice-btn ${settings.aiLanguage === 'hinglish' ? 'selected' : ''}`}
                  >
                    Hinglish (Hindi + English)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleChange('aiLanguage', 'en')}
                    className={`setting-choice-btn ${settings.aiLanguage === 'en' ? 'selected' : ''}`}
                  >
                    English (India)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleChange('aiLanguage', 'hi')}
                    className={`setting-choice-btn ${settings.aiLanguage === 'hi' ? 'selected' : ''}`}
                  >
                    हिंदी (Hindi)
                  </button>
                </div>
              </div>

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

              <div className="test-voice-action">
                <button 
                  type="button" 
                  onClick={handleTestVoice} 
                  className="test-voice-btn"
                  title="Play audio sample with current voice settings"
                >
                  <Play size={13} />
                  <span>Test Voice Sample</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IDENTITY & PERSONA */}
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
