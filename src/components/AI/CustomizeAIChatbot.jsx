import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Bot, 
  Send, 
  X, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  Check, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Moon, 
  Sun, 
  LayoutDashboard, 
  RotateCcw,
  Zap,
  TrendingUp,
  AlertTriangle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Play,
  Globe,
  Maximize2,
  Minimize2,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../services/databaseService';
import { processJarvisQuery, cleanSpokenQuery, isSelfEcho } from './jarvisEngine';
import { aiModelService } from '../../services/aiModelService';
import { executeKarobaarTool } from '../../services/aiToolsService';
import KarobaarAIOverlay from './KarobaarAIOverlay';
import JarvisMiniCharacter from './JarvisMiniCharacter';
import JarvisConversationBubble from './JarvisConversationBubble';
import JarvisSettingsModal from './JarvisSettingsModal';
import './CustomizeAIChatbot.css';

// Smart Anti-Repetition Dynamic Greeting Pools
const WAKE_GREETING_POOLS = {
  hi: [
    "जी सर, कहिए?",
    "हाँ सर, मैं सुन रहा हूँ। बताइए क्या सहायता करूँ?",
    "आज्ञा दीजिए सर, सिस्टम तैयार है।",
    "बताइए सर, क्या काम करना है?",
    "जी, बताइए क्या करूँ आपके लिए?"
  ],
  hinglish: [
    "Haanji sir, boliye?",
    "Ji sir, main sun raha hoon! Bataiye kya madad karoon?",
    "Ready sir! Kya command execute karni hai?",
    "Yes sir, all systems live hain. Boliye!",
    "Bataiye sir, kaise assist karoon?"
  ],
  en: [
    "Yes sir, I'm listening. How can I help?",
    "Ready when you are, sir.",
    "Go ahead, sir. What would you like to do?",
    "Online and listening, sir.",
    "Yes? How can I assist your business?"
  ],
  ur: [
    "جی سر، فرمائیے؟",
    "ہاں سر، میں سن رہا ہوں۔ کیا مدد کروں؟",
    "حکم دیجیے سر، سسٹم تیار ہے۔"
  ],
  ar: [
    "نعم يا سيدي، أنا أستمع إليك.",
    "جاهز لأمرك، كيف أساعدك اليوم؟"
  ],
  es: [
    "¿Sí, señor? Estoy escuchando.",
    "Listo cuando usted diga. ¿En qué le ayudo?"
  ]
};

const getDynamicWakeGreeting = (lang, assistantName, recentList = []) => {
  const normalizedLang = (lang || 'hinglish').toLowerCase();
  const pool = WAKE_GREETING_POOLS[normalizedLang] || 
    (normalizedLang.startsWith('hi') ? WAKE_GREETING_POOLS.hi : 
     normalizedLang.startsWith('en') ? WAKE_GREETING_POOLS.en : 
     normalizedLang.startsWith('ur') ? WAKE_GREETING_POOLS.ur :
     normalizedLang.startsWith('ar') ? WAKE_GREETING_POOLS.ar :
     normalizedLang.startsWith('es') ? WAKE_GREETING_POOLS.es :
     WAKE_GREETING_POOLS.hinglish);
  const available = pool.filter(g => !recentList.includes(g));
  const chosen = (available.length > 0 ? available : pool)[Math.floor(Math.random() * (available.length || pool.length))];
  return chosen.replace(/Jarvis/g, assistantName);
};

export const CustomizeAIChatbot = () => {
  const { 
    theme, 
    toggleTheme, 
    appUiVersion, 
    setAppUiVersion, 
    currentUser, 
    currentBusiness, 
    userBusinesses, 
    switchBranch 
  } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Simple, Non-Intrusive UI States
  const [isHudOverlayOpen, setIsHudOverlayOpen] = useState(false);
  const [isConversationBubbleOpen, setIsConversationBubbleOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isBarMinimized, setIsBarMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [aiLanguage, setAiLanguage] = useState(() => localStorage.getItem('karobaar_ai_language') || 'hinglish');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Audio Context & Analyser for Live Character Reaction
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animFrameRef = useRef(null);

  // Measure audio RMS levels while listening
  useEffect(() => {
    if (isListening) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          micStreamRef.current = stream;
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128;
            src.connect(analyser);
            analyserRef.current = analyser;
            const data = new Uint8Array(analyser.frequencyBinCount);
            const loop = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(data);
              let sum = 0;
              for (let i = 0; i < data.length; i++) sum += data[i];
              const avg = sum / data.length;
              setAudioLevel(Math.min(1.0, Math.max(0, (avg - 10) / 70)));
              animFrameRef.current = requestAnimationFrame(loop);
            };
            loop();
          }
        }).catch(() => {});
      }
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch (e) {}
        audioContextRef.current = null;
      }
      setAudioLevel(0);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch (e) {}
      }
    };
  }, [isListening]);

  // Settings for Customize AI
  const [aiSettings, setAiSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('karobaar_customize_ai_settings');
      const saved = raw ? JSON.parse(raw) : {};
      const name = (saved.assistantName && saved.assistantName !== 'Customize') ? saved.assistantName : 'Jarvis';
      return {
        assistantName: name,
        persona: 'friendly',
        voiceFeedback: true,
        selectedVoiceName: 'auto',
        speechRate: 1.05,
        speechPitch: 1.0,
        speechVolume: 1.0,
        speechPauseDelay: 1.5,
        preventRepetitions: true,
        verbosity: 'balanced',
        characterStyle: 'robot',
        characterPosition: 'bottom_left',
        autoExecuteSafe: true,
        confirmSensitive: true,
        showFloatingBubble: true,
        wakeChime: true,
        ...saved,
        assistantName: name
      };
    } catch {
      return { 
        assistantName: 'Jarvis', 
        persona: 'friendly', 
        voiceFeedback: true, 
        selectedVoiceName: 'auto',
        speechPauseDelay: 1.5,
        preventRepetitions: true,
        characterStyle: 'robot', 
        wakeChime: true 
      };
    }
  });

  const assistantName = (aiSettings.assistantName && aiSettings.assistantName !== 'Customize') ? aiSettings.assistantName : 'Jarvis';

  // Backwards compatibility migration: ensure Jarvis is the assistantName
  useEffect(() => {
    try {
      const raw = localStorage.getItem('karobaar_customize_ai_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.assistantName || parsed.assistantName === 'Customize') {
          parsed.assistantName = 'Jarvis';
          localStorage.setItem('karobaar_customize_ai_settings', JSON.stringify(parsed));
          setAiSettings(prev => ({ ...prev, assistantName: 'Jarvis' }));
        }
      }
    } catch {}
  }, []);

  // Conversation history
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem('karobaar_customize_ai_history');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'welcome-1',
        sender: 'bot',
        text: `Hello! I am **${assistantName}**, your Autonomous AI Co-Pilot for ${currentBusiness?.name || 'Karobaar'}. I can operate the app live for you: talk to me to create sales, audit inventory, switch modes, or highlight app features on screen.`,
        timestamp: new Date().toISOString(),
        quickActions: [
          { label: '📊 Today\'s Sales', query: 'Show today sales summary' },
          { label: '⚠️ Low Stock', query: 'Which items are low in stock?' },
          { label: '🛒 Add Burger to Bill', query: 'Add 2 Burger to cart' },
          { label: '👥 Debtors', query: 'Who owes me money?' },
          { label: '🌙 Toggle Dark Mode', query: 'Toggle dark mode' }
        ]
      }
    ];
  });

  // Pre-warm Speech Synthesis voices immediately on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Global Continuous Speech Recognition Refs with Anti-Echo Hardware/State Locks
  const recognitionRef = useRef(null);
  const isListeningEnabledRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const lastSpokenTextRef = useRef('');
  const recentSpokenListRef = useRef([]);
  const lastSpeechEndTimeRef = useRef(0);
  const speechCooldownTimerRef = useRef(null);
  const isHudOverlayOpenRef = useRef(isHudOverlayOpen);
  
  // Robust Speech Accumulation & Silence Wait Buffer (Guarantees listening to FULL command)
  const speechAccumulatorRef = useRef('');
  const speechSilenceTimerRef = useRef(null);
  const recentBotGreetingsRef = useRef([]);
  const speechPauseDelayRef = useRef(aiSettings.speechPauseDelay || 1.5);

  useEffect(() => {
    speechPauseDelayRef.current = aiSettings.speechPauseDelay || 1.5;
  }, [aiSettings.speechPauseDelay]);

  // Sync isHudOverlayOpen ref & pause background listener while HUD overlay is open
  const isConversationBubbleOpenRef = useRef(isConversationBubbleOpen);
  useEffect(() => {
    isConversationBubbleOpenRef.current = isConversationBubbleOpen;
  }, [isConversationBubbleOpen]);

  useEffect(() => {
    isHudOverlayOpenRef.current = isHudOverlayOpen;
    if (isHudOverlayOpen) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
        setIsListening(false);
      }
    } else {
      if (isListeningEnabledRef.current && !isSpeakingRef.current && recognitionRef.current) {
        setTimeout(() => {
          try {
            const timeSinceSpeech = Date.now() - lastSpeechEndTimeRef.current;
            if (!isSpeakingRef.current && isListeningEnabledRef.current && !isHudOverlayOpenRef.current && timeSinceSpeech >= 900) {
              recognitionRef.current.start();
            }
          } catch (e) {}
        }, 300);
      }
    }
  }, [isHudOverlayOpen]);

  // Toggle voice input recording / mute
  const toggleVoiceListening = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    isListeningEnabledRef.current = next;
    if (!next && recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      setIsListening(false);
    } else if (next && recognitionRef.current && !isSpeakingRef.current && !isHudOverlayOpenRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  // Continuous Ambient Listener: Listens to the FULL command and reacts only after true silence
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition is not supported on this browser.');
      return;
    }

    let isMounted = true;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Map configured language to recognition acoustic model
    const langAcousticMap = {
      'hinglish': 'en-IN',
      'hi': 'hi-IN',
      'en-in': 'en-IN',
      'en': 'en-US',
      'en-gb': 'en-GB',
      'ur': 'ur-PK',
      'ar': 'ar-SA',
      'es': 'es-ES'
    };
    recognition.lang = langAcousticMap[aiLanguage] || 'en-IN';

    recognition.onstart = () => {
      if (isMounted) setIsListening(true);
    };

    recognition.onresult = (event) => {
      // ANTI-ECHO GUARD 1: Assistant is currently speaking out loud!
      if (isSpeakingRef.current) {
        speechAccumulatorRef.current = '';
        setInterimTranscript('');
        return;
      }

      // ANTI-ECHO GUARD 2: Within 900ms acoustic echo cooldown buffer
      const timeSinceSpeech = Date.now() - lastSpeechEndTimeRef.current;
      if (timeSinceSpeech < 900) {
        speechAccumulatorRef.current = '';
        setInterimTranscript('');
        return;
      }

      // If HUD overlay is open, background ambient listener yields
      if (isHudOverlayOpenRef.current) {
        speechAccumulatorRef.current = '';
        setInterimTranscript('');
        return;
      }

      let currentInterim = '';
      let newlyFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          newlyFinal += piece + ' ';
        } else {
          currentInterim += piece;
        }
      }

      if (newlyFinal) {
        speechAccumulatorRef.current = (speechAccumulatorRef.current + ' ' + newlyFinal).trim();
      }

      // Combine accumulated finalized speech with current interim words
      const fullSoFar = (speechAccumulatorRef.current + ' ' + currentInterim).trim();

      // STRICT PRIVACY & NO SELF-ACTING GUARD:
      // If idle (conversation bubble is closed), do NOT react to room noise unless
      // the user explicitly addressed Jarvis with the wake word ("Hey Jarvis", "Jarvis")!
      const isAlreadyEngaged = isConversationBubbleOpenRef.current;
      const { isSoloWakeWord: previewSolo, hasWakeWord: previewWake } = cleanSpokenQuery(fullSoFar, assistantName);

      if (!isAlreadyEngaged && !previewSolo && !previewWake) {
        // Ambient speech not addressed to Jarvis. Do not pop up bubble, do not act!
        return;
      }

      if (fullSoFar) {
        // Show live real-time transcription in the dialog bubble ("see my voice")
        setInterimTranscript(fullSoFar);
        setIsConversationBubbleOpen(true);
      }

      // Configurable silence delay (default: 1.5s) to guarantee listening to FULL command before reacting
      const pauseDelayMs = Math.round((Number(speechPauseDelayRef.current) || 1.5) * 1000);

      // RESET silence debounce timer on every word / syllable. Never cut off mid-sentence!
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = setTimeout(() => {
        // Re-check speaking & cooldown guards
        if (isSpeakingRef.current || (Date.now() - lastSpeechEndTimeRef.current) < 900 || isHudOverlayOpenRef.current) {
          speechAccumulatorRef.current = '';
          setInterimTranscript('');
          return;
        }

        const raw = (speechAccumulatorRef.current + ' ' + currentInterim).trim();
        speechAccumulatorRef.current = '';
        setInterimTranscript('');

        if (!raw || raw.length < 2) return;

        // Anti-Echo Check: Drop self-hearing audio
        if (isSelfEcho(raw, lastSpokenTextRef.current, recentSpokenListRef.current)) {
          console.warn('[Anti-Echo Filter] Dropped self-hearing transcript:', raw);
          return;
        }

        const { isSoloWakeWord, hasWakeWord, cleanedQuery } = cleanSpokenQuery(raw, assistantName);

        // If assistant was NOT already engaged and neither wake word nor solo wake word was spoken, drop it!
        if (!isAlreadyEngaged && !hasWakeWord && !isSoloWakeWord) {
          return;
        }

        if (isSoloWakeWord) {
          // User ONLY said wake word ("Hey Jarvis") and paused for full silence delay.
          // Wake up attentively: play chime, open conversation bubble in listening mode,
          // BUT DO NOT blurt out a loud monologue or execute unprompted actions!
          if (aiSettings.wakeChime !== false) playWakeChime();
          setIsConversationBubbleOpen(true);
          // Keep microphone actively listening for the upcoming user question.
          return;
        }

        // User spoke their question or command!
        if (cleanedQuery) {
          setIsConversationBubbleOpen(true);
          handleUserQuery(cleanedQuery);
        }
      }, pauseDelayMs);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsListening(false);
        isListeningEnabledRef.current = false;
        setVoiceEnabled(false);
      }
    };

    recognition.onend = () => {
      if (isMounted) {
        setIsListening(false);
        const inCooldown = (Date.now() - lastSpeechEndTimeRef.current) < 900;
        if (isListeningEnabledRef.current && !isSpeakingRef.current && !inCooldown && !isHudOverlayOpenRef.current) {
          setTimeout(() => {
            try {
              const stillInCooldown = (Date.now() - lastSpeechEndTimeRef.current) < 900;
              if (isMounted && isListeningEnabledRef.current && !isSpeakingRef.current && !stillInCooldown && !isHudOverlayOpenRef.current) {
                recognition.start();
              }
            } catch (e) {}
          }, 250);
        }
      }
    };

    if (!isHudOverlayOpenRef.current) {
      try {
        recognition.start();
      } catch (e) {}
    }

    recognitionRef.current = recognition;

    return () => {
      isMounted = false;
      clearTimeout(speechSilenceTimerRef.current);
      try { recognition.abort(); } catch (e) {}
    };
  }, [assistantName, aiLanguage, voiceEnabled]);

  // Speech Output Helper with Custom Voices, Volume, Cadence & Strict Anti-Echo Locks
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;

    // 1. Synchronously lock speaking state IMMEDIATELY
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    clearTimeout(speechCooldownTimerRef.current);
    clearTimeout(speechSilenceTimerRef.current);
    speechAccumulatorRef.current = '';
    setInterimTranscript('');

    // 2. Cancel any pending speech synthesis
    window.speechSynthesis.cancel();

    const clean = String(text || '')
      .replace(/[*#_\x60]/g, '')
      .replace(/•/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!clean) {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    // 3. Register utterance for semantic anti-echo filtering
    lastSpokenTextRef.current = clean;
    recentSpokenListRef.current = [clean, ...(recentSpokenListRef.current || []).slice(0, 5)];

    // 4. Temporarily abort speech recognition so mic stops capturing speaker output
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = Number(aiSettings.speechRate) || 1.05;
    utterance.pitch = Number(aiSettings.speechPitch) || 1.0;
    utterance.volume = Math.max(0.2, Math.min(1.0, Number(aiSettings.speechVolume) || 1.0));

    const voices = window.speechSynthesis.getVoices();

    // Use custom chosen voice from Settings if set
    if (aiSettings.selectedVoiceName && aiSettings.selectedVoiceName !== 'auto') {
      const match = voices.find(v => v.name === aiSettings.selectedVoiceName || v.voiceURI === aiSettings.selectedVoiceName);
      if (match) {
        utterance.voice = match;
        utterance.lang = match.lang;
      }
    } else {
      const isHindi = /[\u0900-\u097F]/.test(clean) || /(namaste|dhanyawad|aapka|shukriya|kar diya|kardo|hai|kripya|bhejo|aaj|kamayi|bikri|dukan|maal|batao|udhaar)/i.test(clean);

      if (isHindi || aiLanguage === 'hi' || aiLanguage === 'hinglish') {
        const hiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('madhur'));
        if (hiVoice) utterance.voice = hiVoice;
        utterance.lang = 'hi-IN';
      } else {
        const inVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('neerja'));
        if (inVoice) utterance.voice = inVoice;
        utterance.lang = 'en-IN';
      }
    }

    try {
      window.speechSynthesis.resume();
    } catch (e) {}

    const restartListeningAfterCooldown = () => {
      lastSpeechEndTimeRef.current = Date.now();
      setIsSpeaking(false);

      // Enforce 900ms acoustic echo cooldown buffer so residual speaker sound clears
      clearTimeout(speechCooldownTimerRef.current);
      speechCooldownTimerRef.current = setTimeout(() => {
        isSpeakingRef.current = false;
        if (isListeningEnabledRef.current && recognitionRef.current && !isHudOverlayOpenRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        }
      }, 900);
    };

    const maxDuration = Math.min(14000, Math.max(2500, clean.length * 80));
    const safetyTimer = setTimeout(() => {
      if (isSpeakingRef.current) restartListeningAfterCooldown();
    }, maxDuration);

    utterance.onend = () => {
      clearTimeout(safetyTimer);
      restartListeningAfterCooldown();
    };

    utterance.onerror = () => {
      clearTimeout(safetyTimer);
      restartListeningAfterCooldown();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      restartListeningAfterCooldown();
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    clearTimeout(speechCooldownTimerRef.current);
    lastSpeechEndTimeRef.current = Date.now();
    setIsSpeaking(false);
    // Keep lock for 400ms to clear audio queues
    speechCooldownTimerRef.current = setTimeout(() => {
      isSpeakingRef.current = false;
      if (isListeningEnabledRef.current && recognitionRef.current && !isHudOverlayOpenRef.current) {
        try { recognitionRef.current.start(); } catch (err) {}
      }
    }, 400);
  };

  // Web Audio Synthesizer: 2-Tone Wake Chime
  const playWakeChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  // Global Keyboard Shortcut: Ctrl+J / Cmd+J
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        playWakeChime();
        setIsHudOverlayOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  // Listen to wake event from Dedicated Topbar Button -> Opens Conversation Bubble
  useEffect(() => {
    const handleWakeEvent = (e) => {
      if (aiSettings.wakeChime !== false) playWakeChime();
      setIsConversationBubbleOpen(true);

      // Start voice listening attentively
      if (recognitionRef.current && isListeningEnabledRef.current && !isSpeakingRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {}
      }

      if (e?.detail?.query) {
        handleUserQuery(e.detail.query);
      }
      // If no query was passed (just a wake call):
      // Jarvis simply opens the bubble in attentive listening mode without unprompted speech or actions.
    };
    window.addEventListener('karobaar_wake_ai_assistant', handleWakeEvent);
    return () => window.removeEventListener('karobaar_wake_ai_assistant', handleWakeEvent);
  }, [assistantName, aiLanguage, aiSettings, voiceEnabled]);

  // Sync settings dynamically when changed in Settings tab
  useEffect(() => {
    const handleSettingsSync = (e) => {
      try {
        const saved = JSON.parse(localStorage.getItem('karobaar_customize_ai_settings') || '{}');
        setAiSettings(prev => ({
          ...prev,
          assistantName: e?.detail?.assistantName || saved.assistantName || 'Jarvis',
          ...saved
        }));
      } catch {}
    };
    window.addEventListener('karobaar_settings_updated', handleSettingsSync);
    window.addEventListener('storage', handleSettingsSync);
    return () => {
      window.removeEventListener('karobaar_settings_updated', handleSettingsSync);
      window.removeEventListener('storage', handleSettingsSync);
    };
  }, []);

  // Focus input when drawer opens
  useEffect(() => {
    if (isChatDrawerOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isChatDrawerOpen]);

  // Save conversation history
  useEffect(() => {
    try {
      localStorage.setItem('karobaar_customize_ai_history', JSON.stringify(messages.slice(-30)));
    } catch (e) {}
  }, [messages]);

  // Scroll to bottom on new message in drawer
  useEffect(() => {
    if (isChatDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatDrawerOpen, isTyping]);

  const handleClearHistory = () => {
    stopSpeaking();
    if (window.confirm('Clear AI chat history?')) {
      const resetMsg = [
        {
          id: 'welcome-reset',
          sender: 'bot',
          text: `Chat history cleared. How can **${assistantName}** assist your business today?`,
          timestamp: new Date().toISOString()
        }
      ];
      setMessages(resetMsg);
      localStorage.removeItem('karobaar_customize_ai_history');
    }
  };

  // Export database backup helper
  const triggerBackupExport = async () => {
    try {
      const businessId = currentUser?.activeBusinessId || 'demo-business-1';
      const [products, sales, customers, expenses, employees, suppliers, invoices, attendance, tasks] = await Promise.all([
        db.getCollection('products', businessId),
        db.getCollection('sales', businessId),
        db.getCollection('customers', businessId),
        db.getCollection('expenses', businessId),
        db.getCollection('employees', businessId),
        db.getCollection('suppliers', businessId),
        db.getCollection('invoices', businessId),
        db.getCollection('attendance', businessId),
        db.getCollection('tasks', businessId)
      ]);

      const backupData = {
        system: 'Karobaar ERP & POS',
        version: '3.0',
        exportedAt: new Date().toISOString(),
        business: currentBusiness || { id: businessId, name: 'Karobaar Store' },
        user: { id: currentUser?.id, name: currentUser?.name, role: currentUser?.role },
        data: {
          products: products || [],
          sales: sales || [],
          customers: customers || [],
          expenses: expenses || [],
          employees: employees || [],
          suppliers: suppliers || [],
          invoices: invoices || [],
          attendance: attendance || [],
          tasks: tasks || []
        },
        summary: {
          productsCount: (products || []).length,
          salesCount: (sales || []).length,
          customersCount: (customers || []).length,
          expensesCount: (expenses || []).length
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (currentBusiness?.name || 'Karobaar').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeName}_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return backupData;
    } catch (err) {
      console.error('Backup export failed:', err);
      throw err;
    }
  };

  // Handle sensitive action confirmation in Jarvis drawer
  const handleConfirmSensitiveAction = async (msgId, actionObj) => {
    if (!actionObj) return;
    setIsTyping(true);
    const businessId = currentUser?.activeBusinessId || 'demo-business-1';
    const authContext = {
      db,
      businessId,
      currentUser,
      currentBusiness,
      confirmed: true
    };

    try {
      const execResult = await executeKarobaarTool(actionObj.toolName, actionObj.toolArgs, authContext);
      setIsTyping(false);

      const resultMsg = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: execResult.success
          ? `✅ **Action Confirmed & Executed:**\n${execResult.message || JSON.stringify(execResult)}`
          : `❌ **Action Failed:** ${execResult.error}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, resultMsg]);
      if (voiceEnabled) {
        speakText(execResult.success ? 'Action executed successfully.' : 'Action failed.');
      }
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: `Error executing confirmed action: ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  // Autonomous Realtime AI Command & Query Processing Engine (Unified Model + Tool Loop)
  const handleUserQuery = async (queryText) => {
    const query = (queryText || inputMessage).trim();
    if (!query) return;

    stopSpeaking();
    setInputMessage('');
    const userMsgId = 'user-' + Date.now();
    const newMessages = [...messages, {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString()
    }];
    setMessages(newMessages);
    setIsTyping(true);

    // 1. Instant local fast-path shortcuts for voice UI control
    const lower = query.toLowerCase();

    // Dark Mode Command (flexible matching)
    if (/(?:switch to |change to |turn on |turn to |set |enable |activate |laga do |kardo |kar do )?(?:dark mode|dark theme|black theme|black mode|night mode)|dark mode/i.test(lower)) {
      toggleTheme('dark');
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('karobaar-theme', 'dark');
      }
      const reply = "Switched to Dark Mode. All cards, metrics, and details are now high-contrast dark.";
      setIsTyping(false);
      setMessages(prev => [...prev, { id: 'bot-' + Date.now(), sender: 'bot', text: reply, timestamp: new Date().toISOString() }]);
      if (voiceEnabled) speakText(reply);
      return;
    }

    // Light Mode Command (flexible matching)
    if (/(?:switch to |change to |turn on |turn to |set |enable |activate |laga do |kardo |kar do )?(?:light mode|light theme|white theme|white mode|day mode)|light mode/i.test(lower)) {
      toggleTheme('light');
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('karobaar-theme', 'light');
      }
      const reply = "Switched to Light Mode.";
      setIsTyping(false);
      setMessages(prev => [...prev, { id: 'bot-' + Date.now(), sender: 'bot', text: reply, timestamp: new Date().toISOString() }]);
      if (voiceEnabled) speakText(reply);
      return;
    }

    // Settings Command
    if (/(?:open |show |change |view )?(?:jarvis |ai )?settings/i.test(lower)) {
      setIsSettingsModalOpen(true);
      const reply = `Opening ${assistantName} Settings. You can customize voice speed, listening mode, name, and permissions.`;
      setIsTyping(false);
      setMessages(prev => [...prev, { id: 'bot-' + Date.now(), sender: 'bot', text: reply, timestamp: new Date().toISOString() }]);
      if (voiceEnabled) speakText(reply);
      return;
    }

    if (/^(mute|stop talking|be quiet|shant ho jao|awaz band|silence)/i.test(lower)) {
      stopSpeaking();
      setVoiceEnabled(false);
      const reply = "Voice feedback muted. I will respond in text.";
      setIsTyping(false);
      setMessages(prev => [...prev, { id: 'bot-' + Date.now(), sender: 'bot', text: reply, timestamp: new Date().toISOString() }]);
      return;
    }
    if (/^(unmute|enable voice|awaz chalu|speak)/i.test(lower)) {
      setVoiceEnabled(true);
      const reply = "Voice feedback enabled.";
      setIsTyping(false);
      setMessages(prev => [...prev, { id: 'bot-' + Date.now(), sender: 'bot', text: reply, timestamp: new Date().toISOString() }]);
      speakText(reply);
      return;
    }

    const businessId = currentUser?.activeBusinessId || 'demo-business-1';

    try {
      const authContext = {
        db,
        businessId,
        currentBusiness,
        currentUser,
        navigate,
        theme,
        toggleTheme,
        appUiVersion,
        setAppUiVersion,
        userBusinesses,
        switchBranch,
        aiLanguage,
        assistantName,
        triggerBackupExport
      };

      // Prepare conversation history (last 8 messages for context)
      const convHistory = newMessages.slice(-8).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      // Route through Unified AI Model Service with real tool calling & general intelligence
      const result = await aiModelService.sendMessage({
        messages: convHistory,
        authContext,
        callbacks: {
          onStatusChange: (status) => {}
        }
      });

      setIsTyping(false);

      const replyText = result.text || 'I analyzed that request.';

      // Extract natural spoken sentence for speech output
      let spokenText = result.spokenText;
      if (!spokenText) {
        const cleanForSpeech = replyText
          .replace(new RegExp('```[\s\S]*?```', 'g'), 'Code block output.')
          .replace(/[*#_`]/g, '')
          .replace(/•/g, '')
          .replace(/\|.*?\|/g, '')
          .replace(/\n+/g, ' ')
          .trim();
        const sentences = cleanForSpeech.split(/[.?!]\s+/);
        spokenText = (sentences.slice(0, 2).join('. ') + '.').slice(0, 240);
      }

      const newBotMsg = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: replyText,
        spokenText,
        timestamp: new Date().toISOString(),
        actionData: result.actionData || null,
        toolLogs: result.toolLogs || [],
        requiresConfirmation: result.requiresConfirmation || false,
        confirmationAction: result.confirmationAction || null,
        quickActions: result.quickActions || []
      };

      setMessages(prev => [...prev, newBotMsg]);

      // Speak natural human response out loud
      if (voiceEnabled) {
        speakText(spokenText);
      }

    } catch (err) {
      console.error('Jarvis Query Error:', err);
      setIsTyping(false);

      const fallbackMsg = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: `I analyzed your request: "${query}". I am active and ready. Would you like to check today's sales or open the POS counter?`,
        timestamp: new Date().toISOString(),
        actionData: null,
        quickActions: [
          { label: '📊 Today\'s Sales', query: 'Show today sales summary' },
          { label: '🛒 Open POS', query: 'Open POS register' }
        ]
      };

      setMessages(prev => [...prev, fallbackMsg]);
      if (voiceEnabled) {
        speakText("I am active and ready. Would you like to check today's sales or open the POS counter?");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserQuery();
    }
  };

  // Markdown bold formatting helper
  const renderFormattedText = (line) => {
    if (!line) return '';
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-main, #ffffff)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const latestBotMsg = [...messages].reverse().find(m => m.sender === 'bot');
  const latestBotText = latestBotMsg
    ? latestBotMsg.text.replace(/[*#_`]/g, '').trim().slice(0, 110) + (latestBotMsg.text.replace(/[*#_`]/g, '').trim().length > 110 ? '...' : '')
    : '';

  return (
    <>
      {/* 1. Small Animated AI Assistant Character in Below-Left Side */}
      <JarvisMiniCharacter 
        isListening={isListening}
        isSpeaking={isSpeaking}
        isThinking={isTyping}
        audioLevel={audioLevel}
        voiceEnabled={voiceEnabled}
        assistantName={assistantName}
        characterStyle={aiSettings.characterStyle || 'robot'}
        isBubbleOpen={isConversationBubbleOpen}
        onCharacterClick={() => {
          if (isSpeaking) {
            stopSpeaking();
          } else {
            setIsConversationBubbleOpen(prev => !prev);
          }
        }}
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        onToggleMic={toggleVoiceListening}
      />

      {/* 2. Human-Like Floating Conversational Dialog (anchored right above mini character) */}
      <JarvisConversationBubble 
        isOpen={isConversationBubbleOpen}
        onClose={() => setIsConversationBubbleOpen(false)}
        assistantName={assistantName}
        messages={messages}
        interimTranscript={interimTranscript}
        isListening={isListening}
        isSpeaking={isSpeaking}
        isTyping={isTyping}
        voiceEnabled={voiceEnabled}
        theme={theme}
        onSendMessage={(text) => handleUserQuery(text)}
        onToggleMic={toggleVoiceListening}
        onStopSpeaking={stopSpeaking}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenFullHud={() => {
          setIsConversationBubbleOpen(false);
          setIsHudOverlayOpen(true);
        }}
      />

      {/* 3. Comprehensive Settings Center Modal */}
      <JarvisSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentSettings={{ ...aiSettings, aiLanguage }}
        onSaveSettings={(newSettings) => {
          setAiSettings(newSettings);
          if (newSettings.aiLanguage) {
            setAiLanguage(newSettings.aiLanguage);
            localStorage.setItem('karobaar_ai_language', newSettings.aiLanguage);
          }
          localStorage.setItem('karobaar_customize_ai_settings', JSON.stringify(newSettings));
        }}
        onClearHistory={handleClearHistory}
      />

      {/* 4. Translucent Full HUD Overlay (on Ctrl+J or maximize) */}
      <KarobaarAIOverlay 
        isOpen={isHudOverlayOpen}
        onClose={() => setIsHudOverlayOpen(false)}
      />
    </>
  );
};

export default CustomizeAIChatbot;
