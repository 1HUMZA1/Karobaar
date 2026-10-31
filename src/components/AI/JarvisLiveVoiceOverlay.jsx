import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Settings, 
  PhoneOff, 
  Globe, 
  Check, 
  ChevronDown,
  User,
  Zap,
  RotateCcw
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { jarvisVoiceService } from '../../services/ai/jarvisVoiceService';
import { jarvisSpeechService, JARVIS_LANG_LOCALES } from '../../services/ai/jarvisSpeechService';
import { aiService } from '../../services/ai/aiService';
import { JarvisIntelligenceOrb } from './JarvisIntelligenceOrb';
import { JarvisAudioWaveform } from './JarvisAudioWaveform';
import './JarvisLiveVoiceOverlay.css';

/**
 * JarvisLiveVoiceOverlay 3.0
 * Full-Screen ChatGPT-Style Live Voice Conversation Mode for Karobaar & SAS Cafeteria.
 *
 * Implements continuous hands-free two-way conversation loop,
 * real-time voice recognition, instant speech interruption,
 * male/female voices, 7 languages, and live cafeteria data intelligence.
 */
export const JarvisLiveVoiceOverlay = ({
  isOpen = false,
  onClose = () => {},
  assistantName = 'Jarvis',
  onOpenSettings = () => {}
}) => {
  const { currentUser, currentBusiness, theme, toggleTheme } = useAppContext();

  // Core State
  const [sessionState, setSessionState] = useState('listening'); // 'listening' | 'thinking' | 'speaking' | 'idle'
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState([]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastAssistantSpeech, setLastAssistantSpeech] = useState('');
  const [activeLanguage, setActiveLanguage] = useState(() => {
    return localStorage.getItem('karobaar_ai_language') || 'en';
  });
  const [activeGender, setActiveGender] = useState(() => {
    return jarvisSpeechService.selectedGender || 'male';
  });
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isGenderMenuOpen, setIsGenderMenuOpen] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const isExecutingRef = useRef(false);
  const langMenuRef = useRef(null);
  const genderMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setIsLangMenuOpen(false);
      }
      if (genderMenuRef.current && !genderMenuRef.current.contains(e.target)) {
        setIsGenderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Handle User Speech Input
  const handleUserSpokenInput = useCallback(async (spokenText) => {
    if (!spokenText || !spokenText.trim() || isExecutingRef.current) return;

    isExecutingRef.current = true;
    const cleanText = spokenText.trim();
    setLiveTranscript(cleanText);
    setSessionState('thinking');

    // Pause mic listening while processing and preparing response
    jarvisVoiceService.pauseListening();

    try {
      // Append to local multi-turn history
      const updatedHistory = [
        ...conversationHistory.slice(-8),
        { role: 'user', content: cleanText }
      ];
      setConversationHistory(updatedHistory);

      // Query AI intelligence with live business and cafeteria context
      const authContext = {
        currentUser,
        currentBusiness,
        businessId: currentBusiness?.id || 'biz-sas-and-sons',
        db: null,
        aiLanguage: activeLanguage,
        assistantName
      };

      const response = await aiService.sendMessage({
        query: cleanText,
        messages: updatedHistory,
        authContext,
        callbacks: {
          onStatusChange: (status) => {}
        }
      });

      const replyText = response.text || "I processed your request.";
      const spokenReply = response.spokenText || replyText;

      setLastAssistantSpeech(replyText);
      setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: replyText }
      ]);

      // If speaker is unmuted, speak out loud
      if (!isSpeakerMuted && jarvisSpeechService.voiceEnabled) {
        setSessionState('speaking');

        jarvisSpeechService.speak(spokenReply, {
          lang: activeLanguage,
          gender: activeGender,
          rate: 1.04
        });
      } else {
        // If muted, pause briefly then resume listening
        setTimeout(() => {
          if (isOpen && !isMicMuted) {
            setSessionState('listening');
            jarvisVoiceService.startListening(activeLanguage, true);
          } else {
            setSessionState('idle');
          }
          isExecutingRef.current = false;
        }, 1200);
      }
    } catch (err) {
      console.error('[Live Talk Error]', err);
      setSessionState('idle');
      isExecutingRef.current = false;
      if (isOpen && !isMicMuted) {
        setSessionState('listening');
        jarvisVoiceService.startListening(activeLanguage, true);
      }
    }
  }, [conversationHistory, currentUser, currentBusiness, activeLanguage, activeGender, isSpeakerMuted, isMicMuted, isOpen, assistantName]);

  // Speech Recognition & Speech Synthesis Bindings
  useEffect(() => {
    if (!isOpen) {
      jarvisVoiceService.stopListening();
      jarvisSpeechService.stop();
      isExecutingRef.current = false;
      return;
    }

    // Set callbacks
    jarvisVoiceService.onInterimTranscript = (text) => {
      setLiveTranscript(text);
      if (sessionState !== 'listening') setSessionState('listening');
    };

    jarvisVoiceService.onFinalTranscript = (finalText) => {
      handleUserSpokenInput(finalText);
    };

    jarvisVoiceService.onAudioLevel = (lvl) => {
      setAudioLevel(lvl);
    };

    jarvisVoiceService.onFrequencyData = (freqs) => {
      setFrequencyData(freqs);
    };

    jarvisSpeechService.onAudioLevel = (lvl) => {
      setAudioLevel(lvl);
    };

    jarvisSpeechService.onStart = () => {
      setSessionState('speaking');
    };

    jarvisSpeechService.onEnd = () => {
      isExecutingRef.current = false;
      // When Jarvis finishes speaking, automatically resume listening for continuous conversation!
      if (isOpen && !isMicMuted) {
        setSessionState('listening');
        setLiveTranscript('');
        jarvisVoiceService.startListening(activeLanguage, true);
      } else {
        setSessionState('idle');
      }
    };

    // Initial greeting if opening fresh
    if (conversationHistory.length === 0) {
      const storeName = currentBusiness?.name || 'SAS CAFETERIA';
      const welcome = `Hello! I am ${assistantName}. Live conversation is active for ${storeName}. What can I do for you?`;
      setLastAssistantSpeech(welcome);
      setSessionState('speaking');
      jarvisSpeechService.speak(welcome, {
        lang: activeLanguage,
        gender: activeGender
      });
    } else {
      setSessionState('listening');
      jarvisVoiceService.startListening(activeLanguage, true);
    }

    return () => {
      jarvisVoiceService.stopListening();
      jarvisSpeechService.stop();
    };
  }, [isOpen, activeLanguage, activeGender, isMicMuted]);

  if (!isOpen) return null;

  // Instant interruption: user taps orb or waveform to interrupt Jarvis speaking
  const handleInterrupt = () => {
    if (sessionState === 'speaking') {
      jarvisSpeechService.stop();
      setSessionState('listening');
      setLiveTranscript('');
      jarvisVoiceService.startListening(activeLanguage, true);
    } else if (sessionState === 'listening') {
      // Toggle pause/listen
      if (isMicMuted) {
        setIsMicMuted(false);
        jarvisVoiceService.startListening(activeLanguage, true);
        setSessionState('listening');
      } else {
        setIsMicMuted(true);
        jarvisVoiceService.pauseListening();
        setSessionState('idle');
      }
    } else if (sessionState === 'idle') {
      setIsMicMuted(false);
      jarvisVoiceService.startListening(activeLanguage, true);
      setSessionState('listening');
    }
  };

  // Toggle Mic
  const handleToggleMic = () => {
    if (isMicMuted) {
      setIsMicMuted(false);
      jarvisVoiceService.startListening(activeLanguage, true);
      setSessionState('listening');
    } else {
      setIsMicMuted(true);
      jarvisVoiceService.pauseListening();
      setSessionState('idle');
    }
  };

  // Toggle Speaker
  const handleToggleSpeaker = () => {
    if (isSpeakerMuted) {
      setIsSpeakerMuted(false);
      jarvisSpeechService.voiceEnabled = true;
    } else {
      setIsSpeakerMuted(true);
      jarvisSpeechService.stop();
      jarvisSpeechService.voiceEnabled = false;
    }
  };

  // Switch Voice Gender
  const handleSelectGender = (gender) => {
    setActiveGender(gender);
    jarvisSpeechService.selectedGender = gender;
    jarvisSpeechService.saveSettings({ selectedGender: gender });
    setIsGenderMenuOpen(false);
    jarvisSpeechService.previewVoice({
      gender,
      lang: activeLanguage,
      text: gender === 'male' ? "Male voice enabled. Ready to assist." : "Female voice enabled. Ready to assist."
    });
  };

  // Switch Language
  const handleSelectLanguage = (langKey) => {
    setActiveLanguage(langKey);
    localStorage.setItem('karobaar_ai_language', langKey);
    setIsLangMenuOpen(false);
    jarvisSpeechService.selectedLanguage = langKey;
    jarvisSpeechService.saveSettings({ selectedLanguage: langKey });
    jarvisSpeechService.previewVoice({
      lang: langKey,
      gender: activeGender
    });
    // Restart recognition in new language
    jarvisVoiceService.startListening(langKey, true);
  };

  const statusLabel = 
    sessionState === 'listening' ? 'Listening...' :
    sessionState === 'thinking' ? 'Thinking...' :
    sessionState === 'speaking' ? 'Speaking (Tap to interrupt)' :
    'Standing By';

  const currentLangMeta = JARVIS_LANG_LOCALES[activeLanguage] || JARVIS_LANG_LOCALES.en;

  return (
    <div className="jarvis-live-overlay-container" role="dialog" aria-modal="true">
      {/* Background Ambient Nebula */}
      <div className="live-overlay-backdrop" />
      <div className={`live-ambient-aura state-${sessionState}`} />

      {/* Top Header Bar */}
      <header className="live-overlay-header">
        <div className="live-status-badge">
          <span className={`live-status-dot dot-${sessionState}`} />
          <span className="live-status-text">{statusLabel}</span>
        </div>

        <div className="live-brand-title">
          <Sparkles size={14} className="live-brand-sparkle" />
          <span>{assistantName} 3.0 Live Talk</span>
        </div>

        <div className="live-header-actions">
          <button 
            type="button" 
            onClick={onOpenSettings} 
            className="live-header-icon-btn"
            title="Assistant Voice & AI Settings"
          >
            <Settings size={18} />
          </button>

          <button 
            type="button" 
            onClick={onClose} 
            className="live-close-btn"
            title="Exit Live Talk Mode"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Center Main Stage */}
      <main className="live-overlay-stage">
        {/* Animated Central Jarvis AI 3.0 Orb */}
        <div className="live-orb-container">
          <JarvisIntelligenceOrb 
            state={sessionState}
            audioLevel={audioLevel}
            size={window.innerWidth < 640 ? 180 : 230}
            onClick={handleInterrupt}
            interactive={true}
          />
        </div>

        {/* Animated Symmetrical Audio Waveform */}
        <div className="live-waveform-container">
          <JarvisAudioWaveform 
            state={sessionState}
            audioLevel={audioLevel}
            frequencyData={frequencyData}
            barCount={window.innerWidth < 640 ? 20 : 28}
            height={54}
          />
        </div>

        {/* Live Speech Transcription / Subtitle Pill */}
        <div className="live-transcription-card">
          {sessionState === 'listening' ? (
            <div className="transcription-listening">
              <span className="transcription-indicator">Heard:</span>
              <p className="transcription-text">
                {liveTranscript || "Speak naturally. Jarvis is listening..."}
              </p>
            </div>
          ) : sessionState === 'speaking' ? (
            <div className="transcription-speaking">
              <span className="transcription-indicator jarvis-indicator">{assistantName}:</span>
              <p className="transcription-text speech-reply">
                {lastAssistantSpeech}
              </p>
            </div>
          ) : sessionState === 'thinking' ? (
            <div className="transcription-thinking">
              <div className="typing-dots">
                <span /><span /><span />
              </div>
              <p className="transcription-text">Analyzing business context...</p>
            </div>
          ) : (
            <div className="transcription-idle">
              <p className="transcription-text">Tap the Orb or Microphone to start talking.</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Floating Control Bar */}
      <footer className="live-overlay-footer">
        <div className="live-controls-dock">
          {/* Mute / Unmute Mic Button */}
          <button 
            type="button"
            className={`live-control-btn mic-btn ${isMicMuted ? 'muted' : 'active'}`}
            onClick={handleToggleMic}
            title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Voice Gender Switcher Dropdown */}
          <div className="relative" ref={genderMenuRef}>
            <button 
              type="button"
              className="live-control-pill"
              onClick={() => setIsGenderMenuOpen(prev => !prev)}
              title="Select Male or Female Voice"
            >
              <User size={15} />
              <span>{activeGender === 'female' ? '👩 Female Voice' : '👨 Male Voice'}</span>
              <ChevronDown size={14} />
            </button>

            {isGenderMenuOpen && (
              <div className="live-dropdown-menu">
                <div className="live-dropdown-header">Select Voice Gender</div>
                <button 
                  type="button"
                  className={`live-dropdown-item ${activeGender === 'male' ? 'active' : ''}`}
                  onClick={() => handleSelectGender('male')}
                >
                  <span>👨 Male Voice (David / Natural)</span>
                  {activeGender === 'male' && <Check size={14} />}
                </button>
                <button 
                  type="button"
                  className={`live-dropdown-item ${activeGender === 'female' ? 'active' : ''}`}
                  onClick={() => handleSelectGender('female')}
                >
                  <span>👩 Female Voice (Zira / Samantha)</span>
                  {activeGender === 'female' && <Check size={14} />}
                </button>
              </div>
            )}
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button 
              type="button"
              className="live-control-pill"
              onClick={() => setIsLangMenuOpen(prev => !prev)}
              title="Select Language"
            >
              <span className="lang-flag">{currentLangMeta.flag}</span>
              <span>{currentLangMeta.label}</span>
              <ChevronDown size={14} />
            </button>

            {isLangMenuOpen && (
              <div className="live-dropdown-menu lang-dropdown">
                <div className="live-dropdown-header">Spoken & Understood Language</div>
                {Object.entries(JARVIS_LANG_LOCALES).map(([key, item]) => (
                  <button 
                    key={key}
                    type="button"
                    className={`live-dropdown-item ${activeLanguage === key ? 'active' : ''}`}
                    onClick={() => handleSelectLanguage(key)}
                  >
                    <span className="lang-flag">{item.flag}</span>
                    <span>{item.label}</span>
                    {activeLanguage === key && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Speaker Mute / Unmute Button */}
          <button 
            type="button"
            className={`live-control-btn ${isSpeakerMuted ? 'muted' : 'active'}`}
            onClick={handleToggleSpeaker}
            title={isSpeakerMuted ? "Unmute Voice Audio" : "Mute Voice Audio"}
          >
            {isSpeakerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {/* End Call / Finish Button */}
          <button 
            type="button"
            className="live-control-btn end-call-btn"
            onClick={onClose}
            title="End Live Talk"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default JarvisLiveVoiceOverlay;
