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
import { processJarvisQuery, cleanSpokenQuery } from './jarvisEngine';
import { aiModelService } from '../../services/aiModelService';
import { executeKarobaarTool } from '../../services/aiToolsService';
import './CustomizeAIChatbot.css';

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
  const isAiPage = location.pathname === '/ai';

  // Automatically close floating drawer when navigating to full-page AI workspace
  useEffect(() => {
    if (isAiPage) {
      setIsChatDrawerOpen(false);
    }
  }, [isAiPage]);

  // Simple, Non-Intrusive UI States
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isBarMinimized, setIsBarMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiLanguage, setAiLanguage] = useState(() => localStorage.getItem('karobaar_ai_language') || 'hinglish');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Settings for Customize AI
  const [aiSettings, setAiSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('karobaar_customize_ai_settings');
      const saved = raw ? JSON.parse(raw) : {};
      const name = (saved.assistantName && saved.assistantName !== 'Customize') ? saved.assistantName : 'Jarvis';
      return {
        assistantName: name,
        showFloatingBubble: true,
        autoExecute: true,
        voiceFeedback: true,
        ...saved,
        assistantName: name
      };
    } catch {
      return { assistantName: 'Jarvis', showFloatingBubble: true, autoExecute: true, voiceFeedback: true };
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

  // Global Continuous Speech Recognition Refs
  const recognitionRef = useRef(null);
  const isListeningEnabledRef = useRef(true);
  const isSpeakingRef = useRef(false);
  const interimRef = useRef('');
  const commitTimerRef = useRef(null);

  // Toggle voice input recording / mute
  const toggleVoiceListening = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    isListeningEnabledRef.current = next;
    if (!next && recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      setIsListening(false);
    } else if (next && recognitionRef.current && !isSpeakingRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  // Continuous Ambient Listener active from EVERYWHERE in the application
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
    recognition.lang = 'en-IN'; // Indian English / Hindi accent support

    recognition.onstart = () => {
      if (isMounted) setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          final += piece;
        } else {
          interim += piece;
        }
      }

      if (interim) {
        interimRef.current = interim;
        setInterimTranscript(interim);

        // Fast auto-dispatch after 450ms pause
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = setTimeout(() => {
          if (interimRef.current && interimRef.current.trim().length > 1) {
            const raw = interimRef.current.trim();
            interimRef.current = '';
            setInterimTranscript('');

            const { isSoloWakeWord, cleanedQuery } = cleanSpokenQuery(raw, assistantName);
            if (isSoloWakeWord) {
              playWakeChime();
              setIsBarMinimized(false);
              setIsChatDrawerOpen(true);
              const isHi = aiLanguage === 'hi';
              const greeting = isHi
                ? `जी सर, ${assistantName} सुन रहा है! कहिए, क्या सहायता करूँ?`
                : `Yes sir, ${assistantName} is listening from anywhere! How can I assist you?`;
              speakText(greeting);
              return;
            }

            if (cleanedQuery) {
              handleUserQuery(cleanedQuery);
            }
          }
        }, 450);
      }

      if (final.trim()) {
        clearTimeout(commitTimerRef.current);
        interimRef.current = '';
        setInterimTranscript('');

        const raw = final.trim();
        const { isSoloWakeWord, cleanedQuery } = cleanSpokenQuery(raw, assistantName);
        if (isSoloWakeWord) {
          playWakeChime();
          setIsBarMinimized(false);
          setIsChatDrawerOpen(true);
          const isHi = aiLanguage === 'hi';
          const greeting = isHi
            ? `जी सर, ${assistantName} सुन रहा है! कहिए, क्या सहायता करूँ?`
            : `Yes sir, ${assistantName} is listening from anywhere! How can I assist you?`;
          speakText(greeting);
          return;
        }

        if (cleanedQuery) {
          handleUserQuery(cleanedQuery);
        }
      }
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
        // Automatically restart so Jarvis listens from everywhere continuously
        if (isListeningEnabledRef.current && !isSpeakingRef.current) {
          setTimeout(() => {
            try {
              if (isMounted && isListeningEnabledRef.current && !isSpeakingRef.current) {
                recognition.start();
              }
            } catch (e) {}
          }, 200);
        }
      }
    };

    try {
      recognition.start();
    } catch (e) {}

    recognitionRef.current = recognition;

    return () => {
      isMounted = false;
      try { recognition.abort(); } catch (e) {}
    };
  }, [assistantName, aiLanguage]);

  // Speech Output Helper with Natural Human Cadence
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Temporarily pause speech recognition while speaking so Jarvis does not hear itself
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const clean = text
      .replace(/[*#_`]/g, '')
      .replace(/•/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const isHindi = /[\u0900-\u097F]/.test(clean) || /(namaste|dhanyawad|aapka|shukriya|kar diya|kardo|hai|kripya|bhejo|aaj|kamayi|bikri|dukan|maal|batao|udhaar)/i.test(clean);

    if (isHindi) {
      const hiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('madhur'));
      if (hiVoice) utterance.voice = hiVoice;
      utterance.lang = 'hi-IN';
    } else {
      const inVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('neerja'));
      if (inVoice) utterance.voice = inVoice;
      utterance.lang = 'en-IN';
    }

    try {
      window.speechSynthesis.resume();
    } catch (e) {}

    isSpeakingRef.current = true;
    setIsSpeaking(true);

    const restartListening = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (isListeningEnabledRef.current && recognitionRef.current) {
        setTimeout(() => {
          try {
            if (isListeningEnabledRef.current && !isSpeakingRef.current) {
              recognitionRef.current.start();
            }
          } catch (e) {}
        }, 150);
      }
    };

    const safetyTimer = setTimeout(() => {
      if (isSpeakingRef.current) restartListening();
    }, Math.min(6000, Math.max(1800, clean.length * 65)));

    utterance.onend = () => {
      clearTimeout(safetyTimer);
      restartListening();
    };

    utterance.onerror = () => {
      clearTimeout(safetyTimer);
      restartListening();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      restartListening();
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    if (isListeningEnabledRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        setTimeout(() => {
          try { recognitionRef.current.start(); } catch (err) {}
        }, 100);
      }
    }
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
        setIsBarMinimized(false);
        setIsChatDrawerOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  // Listen to wake event from Dedicated Topbar Button
  useEffect(() => {
    const handleWakeEvent = (e) => {
      playWakeChime();
      setIsBarMinimized(false);
      setIsChatDrawerOpen(true);

      // Start voice listening if enabled
      if (recognitionRef.current && isListeningEnabledRef.current && !isSpeakingRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {}
      }

      if (e?.detail?.query) {
        handleUserQuery(e.detail.query);
      } else {
        const isHi = aiLanguage === 'hi';
        const greeting = isHi
          ? `जी सर, ${assistantName} सुन रहा है! कहिए, क्या सहायता करूँ?`
          : `Yes sir, ${assistantName} is listening from anywhere! How can I assist you?`;
        speakText(greeting);
      }
    };
    window.addEventListener('karobaar_wake_ai_assistant', handleWakeEvent);
    return () => window.removeEventListener('karobaar_wake_ai_assistant', handleWakeEvent);
  }, [assistantName, aiLanguage]);

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
    if (/^(dark mode|enable dark mode|dark theme|switch to dark)/i.test(lower)) {
      if (theme !== 'dark') toggleTheme();
      const reply = "Switched to Dark Mode.";
      setIsTyping(false);
      setMessages(prev => [...prev, { id: 'bot-' + Date.now(), sender: 'bot', text: reply, timestamp: new Date().toISOString() }]);
      if (voiceEnabled) speakText(reply);
      return;
    }
    if (/^(light mode|enable light mode|light theme|switch to light)/i.test(lower)) {
      if (theme !== 'light') toggleTheme();
      const reply = "Switched to Light Mode.";
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

  // Do not render floating Jarvis bar when user is directly in full-page Karobaar AI workspace
  if (isAiPage) return null;

  return (
    <>
      {/* VIEW 1: Minimized Floating Pill */}
      {isBarMinimized ? (
        <button 
          type="button"
          className="jarvis-minimized-pill"
          onClick={() => setIsBarMinimized(false)}
          title={`Expand ${assistantName} Voice Bar (Listening from everywhere • Press Ctrl+J)`}
        >
          <span className={`jarvis-bar-dot ${isListening ? 'listening' : isSpeaking ? 'speaking' : !voiceEnabled ? 'muted' : 'idle'}`} />
          <Sparkles size={14} />
          <span>{assistantName} Active</span>
        </button>
      ) : (
        /* VIEW 2: Simple, Non-Intrusive Floating Jarvis Bar */
        <div className="jarvis-simple-bar-wrapper">
          <div className="jarvis-simple-bar">
            {/* Brand & Status Indicator */}
            <div 
              className="jarvis-bar-brand"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                else toggleVoiceListening();
              }}
              title={isSpeaking ? "Tap to stop speaking" : isListening ? "Listening everywhere • Tap to mute" : "Muted • Tap to listen"}
            >
              <span className={`jarvis-bar-dot ${isListening ? 'listening' : isSpeaking ? 'speaking' : !voiceEnabled ? 'muted' : 'idle'}`} />
              <span className="jarvis-bar-title">{assistantName}</span>
            </div>

            <div className="jarvis-bar-divider" />

            {/* Live Dynamic Speech / Feedback Text */}
            <div className="jarvis-bar-text-area">
              <p className={`jarvis-bar-live-text ${interimTranscript ? 'interim' : latestBotText ? 'response' : 'idle'}`}>
                {interimTranscript ? (
                  `“${interimTranscript}”`
                ) : latestBotText ? (
                  latestBotText
                ) : isListening ? (
                  `Listening everywhere... Speak naturally`
                ) : (
                  `Mic muted • Tap mic to listen`
                )}
              </p>
            </div>

            {/* Quick Commands (Subtle 1-Click Chips) */}
            <div className="jarvis-bar-chips-cluster">
              <button type="button" onClick={() => handleUserQuery('Show today sales summary')} className="jarvis-bar-chip">
                <TrendingUp size={11} />
                <span>Sales</span>
              </button>
              <button type="button" onClick={() => handleUserQuery('Which items are low in stock?')} className="jarvis-bar-chip">
                <AlertTriangle size={11} />
                <span>Stock</span>
              </button>
              <button type="button" onClick={() => handleUserQuery('Who owes me money?')} className="jarvis-bar-chip">
                <DollarSign size={11} />
                <span>Khata</span>
              </button>
              <button type="button" onClick={() => handleUserQuery('Toggle dark mode')} className="jarvis-bar-chip">
                <Moon size={11} />
                <span>Mode</span>
              </button>
            </div>

            {/* Bar Controls */}
            <div className="jarvis-bar-actions">
              {/* Language Selector */}
              <button 
                type="button" 
                className="jarvis-bar-lang-pill"
                onClick={() => {
                  const next = aiLanguage === 'hinglish' ? 'en' : aiLanguage === 'en' ? 'hi' : 'hinglish';
                  setAiLanguage(next);
                  localStorage.setItem('karobaar_ai_language', next);
                }}
                title="Toggle Language: Hinglish / EN / हिंदी"
              >
                <Globe size={11} />
                <span>{aiLanguage === 'hinglish' ? 'Hinglish' : aiLanguage === 'hi' ? 'हिंदी' : 'EN'}</span>
              </button>

              {/* Mic Toggle Button */}
              <button 
                type="button" 
                onClick={toggleVoiceListening}
                className={`jarvis-bar-icon-btn ${isListening ? 'active' : 'muted'}`}
                title={isListening ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isListening ? <Mic size={14} /> : <MicOff size={14} />}
              </button>

              {/* Side Chat Drawer Toggle Button */}
              <button 
                type="button" 
                onClick={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
                className={`jarvis-bar-icon-btn ${isChatDrawerOpen ? 'active' : ''}`}
                title="View Full Chat History & Details [Ctrl+J]"
              >
                <MessageSquare size={14} />
              </button>

              {/* Minimize Bar */}
              <button 
                type="button" 
                onClick={() => setIsBarMinimized(true)}
                className="jarvis-bar-icon-btn"
                title="Minimize bar to bottom corner"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Executive Side Chat Drawer */}
      {isChatDrawerOpen && (
        <div className="jarvis-chat-side-drawer">
          <div className="customize-ai-header">
            <div className="customize-ai-header-left">
              <div className="customize-ai-avatar">
                <Sparkles size={15} />
              </div>
              <div>
                <h3 className="customize-ai-title">{assistantName} AI 3.0</h3>
                <p className="customize-ai-status">
                  {isListening ? '● Listening from anywhere' : '● Ambient Ready [Ctrl+J]'}
                </p>
              </div>
            </div>

            <div className="customize-ai-header-actions">
              <button onClick={() => { setIsChatDrawerOpen(false); navigate('/ai'); }} className="customize-ai-icon-btn" title="Open Full Karobaar AI Workspace">
                <Maximize2 size={14} />
              </button>
              <button onClick={handleClearHistory} className="customize-ai-icon-btn" title="Clear chat history">
                <Trash2 size={14} />
              </button>
              <button onClick={() => setIsChatDrawerOpen(false)} className="customize-ai-icon-btn" title="Close drawer">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Message Stream */}
          <div className="customize-ai-messages custom-scrollbar">
            {messages.map(msg => (
              <div key={msg.id} className={`customize-ai-message-row ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                {msg.sender === 'bot' && (
                  <div className="customize-ai-bot-icon">
                    <Bot size={13} />
                  </div>
                )}

                <div className="customize-ai-bubble-wrap">
                  <div className={`customize-ai-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                    <div className="customize-ai-bubble-text">
                      {msg.text.split('\n').map((line, idx) => (
                        <p key={idx} style={{ margin: '0 0 4px 0', lineHeight: 1.5 }}>
                          {renderFormattedText(line)}
                        </p>
                      ))}
                    </div>

                    {/* Action Card if present */}
                    {msg.actionData && (
                      <div className="customize-ai-action-card">
                        {msg.actionData.badge && (
                          <div className="customize-ai-action-badge">
                            <CheckCircle2 size={13} />
                            <span>{msg.actionData.badge}</span>
                          </div>
                        )}
                        {msg.actionData.metrics && (
                          <div className="customize-ai-metrics-grid">
                            {msg.actionData.metrics.map((m, i) => (
                              <div key={i} className="customize-ai-metric-item">
                                <span className="metric-label">{m.label}</span>
                                <span className="metric-value">{m.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.actionData.items && (
                          <div className="customize-ai-items-list">
                            {msg.actionData.items.map(it => (
                              <div key={it.id || it.name} className="customize-ai-item-row">
                                <span>{it.name}</span>
                                <span className="stock-alert">{it.stockQuantity || 0} left</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.actionData.cta && (
                          <button 
                            className="customize-ai-cta-btn"
                            onClick={() => {
                              setIsChatDrawerOpen(false);
                              navigate(msg.actionData.cta.path);
                            }}
                          >
                            <span>{msg.actionData.cta.label}</span>
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Tool Execution Logs if any */}
                    {msg.toolLogs && msg.toolLogs.length > 0 && (
                      <div className="customize-ai-tool-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {msg.toolLogs.map((tl, tli) => (
                          <span 
                            key={tli} 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              background: 'rgba(255, 255, 255, 0.06)', 
                              border: '1px solid var(--border-color)', 
                              fontSize: '10.5px', 
                              color: 'var(--text-secondary)' 
                            }}
                          >
                            <Zap size={10} />
                            <span>{tl.name}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Sensitive Action Confirmation Card */}
                    {msg.requiresConfirmation && msg.confirmationAction && (
                      <div 
                        className="customize-ai-confirm-card"
                        style={{
                          marginTop: '10px',
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1.5px solid var(--border-color)',
                          background: 'rgba(255, 255, 255, 0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                          <AlertTriangle size={14} />
                          <span>Confirmation Required</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.4 }}>
                          {msg.confirmationAction.summary}
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleConfirmSensitiveAction(msg.id, msg.confirmationAction)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: 'var(--text-main)',
                            color: 'var(--bg-main)',
                            border: 'none',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Check size={13} />
                          <span>Confirm & Execute</span>
                        </button>
                      </div>
                    )}

                    {/* Follow-up Quick Action Chips */}
                    {msg.quickActions && msg.quickActions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                        {msg.quickActions.map((qa, qi) => (
                          <button
                            key={qi}
                            type="button"
                            onClick={() => handleUserQuery(qa.query)}
                            style={{
                              background: 'var(--bg-card, #18181b)',
                              border: '1px solid var(--border-color, #27272a)',
                              borderRadius: '12px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--text-main, #ffffff)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {qa.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Text Input */}
          <div className="customize-ai-input-bar">
            <input 
              ref={inputRef}
              type="text" 
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Command ${assistantName} [Ctrl+J]...`}
              className="customize-ai-input"
            />
            <button 
              type="button" 
              onClick={() => handleUserQuery()}
              disabled={!inputMessage.trim()}
              className="customize-ai-send-btn"
              title="Send Command"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomizeAIChatbot;
