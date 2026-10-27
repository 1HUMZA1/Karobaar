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
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/databaseService';
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
        text: `Hello! I am **${assistantName}**, your Realtime Voice AI Assistant for ${currentBusiness?.name || 'Karobaar'}. I can operate the app live for you: talk to me to create sales, audit inventory, switch modes, or highlight app features on screen.`,
        timestamp: new Date().toISOString(),
        quickActions: [
          { label: '🎙️ Voice: "Today\'s Sales"', query: 'Show today sales summary' },
          { label: '🎙️ Voice: "Check Low Stock"', query: 'Which items are low in stock?' },
          { label: '🛒 Voice: "Add 2 Burger to bill"', query: 'Add 2 Burger to cart' },
          { label: '⚡ Voice: "Switch to Legacy Desk"', query: 'Switch to legacy operations desk' },
          { label: '🌙 Voice: "Toggle Dark Mode"', query: 'Toggle dark mode' }
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

  // Helper: Clean spoken query, handle solo wake-words, and strip prefixes
  const cleanSpokenQuery = (text) => {
    if (!text) return '';
    const name = (aiSettings.assistantName || 'Jarvis').toLowerCase();
    let cleaned = text.trim();
    const lower = cleaned.toLowerCase();

    // Check if user spoke ONLY the wake word
    const soloWakeWords = [
      name, 
      `hey ${name}`, 
      `ok ${name}`, 
      `hello ${name}`, 
      `wake up ${name}`, 
      `${name} wake up`, 
      `suno ${name}`
    ];
    if (soloWakeWords.includes(lower)) {
      playWakeChime();
      setIsBarMinimized(false);
      const isHi = aiLanguage === 'hi';
      const isEn = aiLanguage === 'en';
      const greeting = isHi
        ? `जी सर, ${assistantName} सुन रहा है! कहिए, क्या सहायता करूँ?`
        : isEn
        ? `Yes sir, ${assistantName} is listening from anywhere. How can I assist you?`
        : `Ji sir, ${assistantName} sun raha hai! Boliye, main kya kar sakta hoon?`;
      speakText(greeting);
      return '';
    }

    // Strip wake word prefixes if user spoke "Hey Jarvis [command]"
    const prefixRegex = new RegExp(`^(?:hey|ok|hello|wake up|suno)?\\s*${name}\\s*(?:bhai|ji|sir)?[,\\s]*`, 'i');
    cleaned = cleaned.replace(prefixRegex, '').trim();

    return cleaned || text;
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
            const queryToRun = cleanSpokenQuery(interimRef.current.trim());
            interimRef.current = '';
            setInterimTranscript('');
            if (queryToRun) {
              handleUserQuery(queryToRun);
            }
          }
        }, 450);
      }

      if (final.trim()) {
        clearTimeout(commitTimerRef.current);
        interimRef.current = '';
        setInterimTranscript('');
        const queryToRun = cleanSpokenQuery(final.trim());
        if (queryToRun) {
          handleUserQuery(queryToRun);
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
        // Automatically restart so Jarvis listens from everywhere continuously!
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
  }, [aiSettings.assistantName, aiLanguage]);

  // Speech Output Engine
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
      clearTimeout(safetyTimer);
      restartListening();
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (isListeningEnabledRef.current && recognitionRef.current) {
        setTimeout(() => {
          try { recognitionRef.current.start(); } catch (e) {}
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

  // Listen to wake event from Dedicated Topbar Button
  useEffect(() => {
    const handleWakeEvent = (e) => {
      playWakeChime();
      setIsBarMinimized(false);
      if (e?.detail?.query) {
        handleUserQuery(e.detail.query);
      } else {
        const isHi = aiLanguage === 'hi';
        const isEn = aiLanguage === 'en';
        const greeting = isHi
          ? `जी सर, ${assistantName} सुन रहा है!`
          : isEn
          ? `Yes sir, ${assistantName} is listening!`
          : `Ji sir, ${assistantName} sun raha hai!`;
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

  // Autonomous Realtime AI Command & Query Processing Engine
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

    const businessId = currentUser?.activeBusinessId || 'demo-business-1';
    const lower = query.toLowerCase();

    // Export database backup helper
    const triggerBackupExport = async () => {
      try {
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
          version: '2.0',
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

    // Ultra-fast Realtime Processing (0ms Artificial Delay)
    (async () => {
      let botResponse = '';
      let botActionData = null;

      try {
        // ==========================================
        // 1. ASSISTANT NAME & WAKE WORD IDENTITY
        // ==========================================
        if (
          lower.includes('change your name') || 
          lower.includes('change name to') || 
          lower.includes('call yourself') || 
          lower.includes('rename to') || 
          lower.includes('set assistant name') || 
          lower.includes('mera naam') || 
          (lower.includes('naam') && (lower.includes('rakho') || lower.includes('badlo') || lower.includes('change')))
        ) {
          let newName = 'Jarvis';
          if (lower.includes('mr. h') || lower.includes('mr h') || lower.includes('mister h')) {
            newName = 'Mr. H';
          } else if (lower.includes('jarvis')) {
            newName = 'Jarvis';
          } else {
            const match = lower.match(/(?:to|naam|be)\s+([a-zA-Z0-9_\.\s]+?)(?:\s+rakho|\s+kardo|$)/i);
            if (match && match[1]) {
              newName = match[1].trim().split(' ')[0];
              newName = newName.charAt(0).toUpperCase() + newName.slice(1);
            }
          }

          const raw = localStorage.getItem('karobaar_customize_ai_settings');
          const prev = raw ? JSON.parse(raw) : {};
          const updated = { ...prev, assistantName: newName };
          localStorage.setItem('karobaar_customize_ai_settings', JSON.stringify(updated));
          setAiSettings(updated);
          window.dispatchEvent(new CustomEvent('karobaar_settings_updated', { detail: { assistantName: newName } }));

          const isHi = aiLanguage === 'hi';
          botResponse = isHi
            ? `जी बिल्कुल! मेरा नाम अब बदलकर **${newName}** कर दिया गया है। आप मुझे जब चाहें **"${newName}"** कहकर बुला सकते हैं!`
            : `Understood! My identity has been updated to **${newName}**. You can call me "**${newName}**" anytime.`;
          botActionData = { type: 'action_confirmed', badge: `Assistant Renamed: ${newName}` };
        }

        // ==========================================
        // 2. LANGUAGE SWITCHING
        // ==========================================
        else if (
          lower.includes('speak hindi') || 
          lower.includes('hindi me') || 
          lower.includes('switch to hindi') || 
          lower.includes('hindi mode')
        ) {
          setAiLanguage('hi');
          localStorage.setItem('karobaar_ai_language', 'hi');
          botResponse = `नमस्ते! मैंने भाषा **हिंदी** पर सेट कर दी है। अब मैं आपसे हिंदी में बात करूँगा। कहिए, क्या सहायता करूँ?`;
          botActionData = { type: 'action_confirmed', badge: 'भाषा: हिंदी' };
        }
        else if (
          lower.includes('speak english') || 
          lower.includes('english mode') || 
          lower.includes('switch to english')
        ) {
          setAiLanguage('en');
          localStorage.setItem('karobaar_ai_language', 'en');
          botResponse = `Language switched to **English**. I am ready to autonomously control your entire workspace. What would you like to do?`;
          botActionData = { type: 'action_confirmed', badge: 'Language: English' };
        }
        else if (
          lower.includes('speak hinglish') || 
          lower.includes('hinglish mode') || 
          lower.includes('hinglish me')
        ) {
          setAiLanguage('hinglish');
          localStorage.setItem('karobaar_ai_language', 'hinglish');
          botResponse = `Language switched to **Hinglish**! Ab hum natural Hinglish me baat karenge. Boliye sir, kya karna hai?`;
          botActionData = { type: 'action_confirmed', badge: 'Language: Hinglish' };
        }

        // ==========================================
        // 3. DATABASE BACKUP EXPORT & DOWNLOAD
        // ==========================================
        else if (
          lower.includes('backup') || 
          lower.includes('export database') || 
          lower.includes('download database') || 
          lower.includes('download backup') || 
          lower.includes('data download') || 
          lower.includes('export my data')
        ) {
          const backupResult = await triggerBackupExport();
          const pCount = backupResult.summary.productsCount;
          const sCount = backupResult.summary.salesCount;
          const cCount = backupResult.summary.customersCount;

          const isHi = aiLanguage === 'hi';
          botResponse = isHi
            ? `आपके स्टोर का पूरा डेटाबेस JSON बैकअप फाइल के रूप में डाउनलोड हो चुका है!\n\n• **प्रोडक्ट्स:** ${pCount}\n• **ऑर्डर्स/बिक्री:** ${sCount}\n• **ग्राहक:** ${cCount}\n• **खर्च और हाज़िरी रिकॉर्ड्स:** सुरक्षित निर्यात`
            : `Your complete store database backup has been generated and downloaded to your computer!\n\n• **Products:** ${pCount} records\n• **Sales & Orders:** ${sCount} records\n• **Customers:** ${cCount} records\n• **Expenses & Attendance:** Included`;
          
          botActionData = {
            type: 'metrics',
            title: isHi ? 'बैकअप डाउनलोड संपन्न' : 'Database Backup Exported',
            metrics: [
              { label: 'Products', value: pCount },
              { label: 'Sales', value: sCount },
              { label: 'Customers', value: cCount }
            ],
            cta: { label: isHi ? 'सेटिंग्स देखें' : 'View Settings', path: '/settings' }
          };
        }

        // ==========================================
        // 4. CLOUD DATA SYNC
        // ==========================================
        else if (
          lower.includes('sync data') || 
          lower.includes('cloud sync') || 
          lower.includes('sync now') || 
          lower.includes('refresh data') || 
          lower.includes('sync karo')
        ) {
          await db.syncAllFromCloud(businessId);
          await db.syncPendingQueue();
          botResponse = aiLanguage === 'hi'
            ? `क्लाउड डेटाबेस के साथ सभी रिकॉर्ड्स सफलतापूर्वक सिंक हो चुके हैं! आपका लैपटॉप और मोबाइल डेटा अब 100% एक समान है।`
            : `Cloud database synchronization complete! All your records, stock numbers, and invoices across all devices are now up-to-date.`;
          botActionData = { type: 'action_confirmed', badge: 'Cloud Data Synced' };
        }

        // ==========================================
        // 5. CLEAR CHAT HISTORY
        // ==========================================
        else if (
          lower.includes('clear chat') || 
          lower.includes('clear history') || 
          lower.includes('delete chat') || 
          lower.includes('chat reset') || 
          lower.includes('history saaf')
        ) {
          setMessages([{
            id: 'bot-' + Date.now(),
            sender: 'bot',
            text: `Chat history cleared. I am ready for your next command!`,
            timestamp: new Date().toISOString()
          }]);
          localStorage.removeItem('karobaar_customize_ai_history');
          botResponse = `Chat history has been cleared.`;
          botActionData = { type: 'action_confirmed', badge: 'Chat Cleared' };
        }

        // ==========================================
        // 6. THEME TOGGLE (DARK / LIGHT MONOCHROME)
        // ==========================================
        else if (
          lower.includes('dark mode') || 
          lower.includes('light mode') || 
          lower.includes('theme') || 
          (lower.includes('mode') && (lower.includes('change') || lower.includes('toggle') || lower.includes('switch') || lower.includes('badlo') || lower.includes('kardo') || lower.includes('lagao')))
        ) {
          toggleTheme();
          const newTheme = theme === 'light' ? 'Dark' : 'Light';
          const isHi = aiLanguage === 'hi';
          botResponse = isHi
            ? `थीम को **${newTheme === 'Dark' ? 'डार्क' : 'लाइट'} मोड** में बदल दिया गया है! हाई-कंट्रास्ट मोनोक्रोम स्टाइलिंग सक्रिय है।`
            : `Switched theme to **${newTheme} Mode**! Crisp monochrome styling is active across the workspace.`;
          botActionData = { type: 'action_confirmed', badge: `${newTheme} Theme Activated` };
        }

        // ==========================================
        // 7. OPERATING MODE (LEGACY vs PREMIUM)
        // ==========================================
        else if (lower.includes('legacy') || lower.includes('operations desk') || lower.includes('fast mode') || lower.includes('v1 mode')) {
          setAppUiVersion('legacy');
          navigate('/dashboard');
          botResponse = `Reconfigured workspace to **Legacy Operations Desk**! Navigating to your responsive 4-column action dashboard now.`;
          botActionData = { type: 'action_confirmed', badge: 'Legacy Desk Activated' };
        }
        else if (lower.includes('premium') || lower.includes('command center') || lower.includes('v2 mode')) {
          setAppUiVersion('premium');
          navigate('/dashboard');
          botResponse = `Reconfigured workspace to **Premium Command Center**! Executive metrics, live radar health, and dual charts are active.`;
          botActionData = { type: 'action_confirmed', badge: 'Premium Center Activated' };
        }

        // ==========================================
        // 8. LIVE TOUR & FEATURE SPOTLIGHT
        // ==========================================
        else if (lower.includes('tour') || lower.includes('spotlight') || lower.includes('feature') || lower.includes('outline') || lower.includes('guide') || lower.includes('sikhao') || lower.includes('dikhao') || lower.includes('samjhao')) {
          setIsOpen(false);
          stopSpeaking();
          const isHinglish = aiLanguage === 'hinglish' || !/[\u0900-\u097F]/.test(lower);
          botResponse = isHinglish
            ? `Main aapke liye Live Feature Outlining Tour shuru kar raha hoon. Screen par highlighted boxes dekhiye!`
            : `मैं आपके लिए लाइव फ़ीचर स्पॉटलाइट शुरू कर रहा हूँ। स्क्रीन पर आउटलाइन्स देखिए!`;
          botActionData = { type: 'action_confirmed', badge: 'Live Feature Spotlight Active' };
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('karobaar_start_spotlight_tour', { detail: { stepIndex: 0 } }));
          }, 350);
        }

        // ==========================================
        // 9. STORE ONBOARDING CONCIERGE
        // ==========================================
        else if (lower.includes('setup') || lower.includes('onboard') || lower.includes('shuru karo') || lower.includes('store setup') || lower.includes('business setup') || lower.includes('dukan setup') || lower.includes('meri dukan') || lower.includes('mera business')) {
          setIsOpen(false);
          stopSpeaking();
          window.dispatchEvent(new CustomEvent('karobaar_start_ai_onboarding'));
          const isHinglish = aiLanguage === 'hinglish' || !/[\u0900-\u097F]/.test(lower);
          botResponse = isHinglish
            ? `Maine aapke liye Live Store Setup Concierge shuru kar diya hai. Chaliye step-by-step aapki dukaan setup karte hain!`
            : `मैंने आपकी दुकान का लाइव सेटअप विज़ार्ड शुरू कर दिया है। चलिए मिलकर आपका स्टोर कॉन्फ़िगर करते हैं!`;
          botActionData = { type: 'action_confirmed', badge: 'AI Store Setup Launched' };
        }

        // ==========================================
        // 10. MULTI-BRANCH OPERATIONS & SWITCHING
        // ==========================================
        else if (lower.includes('branch') || lower.includes('outlet')) {
          if (lower.includes('switch') || lower.includes('badlo') || lower.includes('change') || lower.includes('open')) {
            const availableBranches = userBusinesses && userBusinesses.length > 0 ? userBusinesses : [currentBusiness];
            let matchedBranch = null;

            for (const b of availableBranches) {
              const bName = (b.name || '').toLowerCase();
              if (bName && lower.includes(bName)) {
                matchedBranch = b;
                break;
              }
            }

            if (matchedBranch) {
              botResponse = `Switching active workspace to **${matchedBranch.name}** branch...`;
              botActionData = { type: 'action_confirmed', badge: `Branch: ${matchedBranch.name}` };
              setTimeout(() => {
                switchBranch(matchedBranch.id);
              }, 400);
            } else {
              navigate('/branches');
              const branchList = (userBusinesses || []).map(b => `• **${b.name}**`).join('\n');
              botResponse = `Opening **Branches** manager. Available stores:\n${branchList || '• Current Store'}\n\nSay "Switch to [Branch Name]" to switch instantly.`;
              botActionData = { type: 'action_confirmed', badge: 'Branches Opened' };
            }
          } else {
            navigate('/branches');
            const branchList = (userBusinesses || []).map(b => `• **${b.name}**`).join('\n');
            botResponse = `Opening **Branches** manager. You currently manage:\n${branchList || '• Current Store'}`;
            botActionData = { type: 'action_confirmed', badge: 'Branches Opened' };
          }
        }

        // ==========================================
        // 11. PRODUCTS & INVENTORY - ADD NEW PRODUCT
        // ==========================================
        else if (
          lower.startsWith('add product') || 
          lower.startsWith('add new product') || 
          lower.startsWith('create product') || 
          lower.startsWith('add item') || 
          lower.startsWith('naya product') || 
          lower.includes('product banao') || 
          lower.includes('item jodo')
        ) {
          const priceMatch = lower.match(/(?:price|rate|selling price|for|rs|₹|kimat)\s*(?:of|is|:)?\s*(\d+(?:\.\d+)?)/i) || lower.match(/(\d+(?:\.\d+)?)\s*(?:rupees|rs|₹)/i);
          const stockMatch = lower.match(/(?:stock|quantity|qty|units|piece|pieces|pcs)\s*(?:of|is|:)?\s*(\d+)/i) || lower.match(/(\d+)\s*(?:stock|units|pcs|pieces|piece)/i);
          const categoryMatch = lower.match(/category\s+([a-zA-Z\s]+?)(?=\s+(?:price|rate|stock|qty|$))/i);

          const prodPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
          const prodStock = stockMatch ? parseInt(stockMatch[1], 10) : 20;
          const prodCategory = categoryMatch ? categoryMatch[1].trim() : 'General';

          let rawName = lower
            .replace(/add new product|add product|create product|add item|naya product|product banao|item jodo/gi, '')
            .replace(/(?:price|rate|selling price|for|rs|₹|kimat)\s*(?:of|is|:)?\s*\d+(?:\.\d+)?/gi, '')
            .replace(/\d+(?:\.\d+)?\s*(?:rupees|rs|₹)/gi, '')
            .replace(/(?:stock|quantity|qty|units|piece|pieces|pcs)\s*(?:of|is|:)?\s*\d+/gi, '')
            .replace(/\d+\s*(?:stock|units|pcs|pieces|piece)/gi, '')
            .replace(/category\s+[a-zA-Z\s]+/gi, '')
            .replace(/with|and|having|of/gi, '')
            .trim();

          const prodName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'New Product';

          if (prodPrice > 0) {
            const newProd = {
              name: prodName,
              sellingPrice: prodPrice,
              purchasePrice: Math.round(prodPrice * 0.6),
              stockQuantity: prodStock,
              minimumStock: 5,
              category: prodCategory,
              sku: `SKU-${Date.now().toString().slice(-5)}`,
              status: 'Active',
              createdAt: new Date().toISOString()
            };

            await db.add('products', newProd, businessId);
            window.dispatchEvent(new CustomEvent('karobaar_data_synced', { detail: { businessId } }));
            navigate('/products');

            botResponse = aiLanguage === 'hi'
              ? `नया प्रोडक्ट **${prodName}** (मूल्य: ₹${prodPrice}, स्टॉक: ${prodStock} पीस) इन्वेंट्री कैटलॉग में सफलतापूर्वक जोड़ दिया गया है!`
              : `Added new product **${prodName}** (Price: ₹${prodPrice}, Stock: ${prodStock} units, Category: ${prodCategory}) directly to your live inventory!`;
            
            botActionData = {
              type: 'action_confirmed',
              badge: `Product Added: ${prodName} (₹${prodPrice})`
            };
          } else {
            navigate('/products');
            botResponse = `Opening **Products Catalog**. To add an item via voice, say e.g. "Add product Samosa price 20 stock 50".`;
          }
        }

        // ==========================================
        // 12. PRODUCTS & INVENTORY - RESTOCK & UPDATE STOCK
        // ==========================================
        else if (
          lower.includes('restock') || 
          lower.includes('update stock') || 
          lower.includes('stock update') || 
          lower.includes('stock badhao') || 
          (lower.includes('stock') && (lower.includes('kardo') || lower.includes('daalo') || lower.includes('set')))
        ) {
          const qtyMatch = lower.match(/(\d+)\s*(?:units|pcs|pieces|piece)?/i);
          const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 0;

          const products = await db.getCollection('products', businessId);
          let targetProduct = null;

          for (const p of products) {
            const pName = (p.name || '').toLowerCase();
            if (pName && lower.includes(pName)) {
              targetProduct = p;
              break;
            }
          }

          if (targetProduct && qty > 0) {
            const oldStock = targetProduct.stockQuantity || 0;
            const isAdd = lower.includes('add') || lower.includes('badhao') || lower.includes('plus');
            const newStock = isAdd ? (oldStock + qty) : qty;

            await db.update('products', targetProduct.id, { stockQuantity: newStock }, businessId);
            window.dispatchEvent(new CustomEvent('karobaar_data_synced', { detail: { businessId } }));
            navigate('/products');

            botResponse = aiLanguage === 'hi'
              ? `**${targetProduct.name}** का स्टॉक अपडेट हो गया! पहले ${oldStock} था, अब कुल **${newStock} पीस** उपलब्ध हैं।`
              : `Stock for **${targetProduct.name}** updated! Previous: ${oldStock}, New Total: **${newStock} units**.`;

            botActionData = {
              type: 'action_confirmed',
              badge: `Restocked ${targetProduct.name}: ${newStock} units`
            };
          } else {
            navigate('/products');
            botResponse = `Opening **Products & Inventory**. To restock via voice, say e.g. "Restock Burger 50" or "Add 30 stock to Cold Coffee".`;
          }
        }

        // ==========================================
        // 13. PRODUCTS & INVENTORY - DELETE PRODUCT
        // ==========================================
        else if (
          lower.startsWith('delete product') || 
          lower.startsWith('remove product') || 
          lower.includes('product delete') || 
          lower.includes('item hatao')
        ) {
          const products = await db.getCollection('products', businessId);
          let targetProduct = null;

          for (const p of products) {
            const pName = (p.name || '').toLowerCase();
            if (pName && lower.includes(pName)) {
              targetProduct = p;
              break;
            }
          }

          if (targetProduct) {
            await db.delete('products', targetProduct.id, businessId);
            window.dispatchEvent(new CustomEvent('karobaar_data_synced', { detail: { businessId } }));
            navigate('/products');

            botResponse = `Product **${targetProduct.name}** has been removed from your inventory catalog.`;
            botActionData = { type: 'action_confirmed', badge: `Deleted: ${targetProduct.name}` };
          } else {
            botResponse = `Could not find that product in your inventory to remove. Please check the name under Products.`;
          }
        }

        // ==========================================
        // 14. PRODUCTS & INVENTORY - LOW STOCK AUDIT
        // ==========================================
        else if (
          lower.includes('low stock') || 
          lower.includes('stock audit') || 
          lower.includes('maal kitna') || 
          (lower.includes('stock') && !lower.includes('add') && !lower.includes('restock') && !lower.includes('update') && !lower.includes('check'))
        ) {
          const products = await db.getCollection('products', businessId);
          const lowStock = products.filter(p => (p.stockQuantity || 0) <= 10);
          const isHindiQuery = /(maal|kam|kitna|batao|dukan)/i.test(lower);

          if (lowStock.length === 0) {
            botResponse = isHindiQuery 
              ? `बहुत बढ़िया! आपकी दुकान का सारा माल भरपूर स्टॉक में है। कुल ${products.length} प्रोडक्ट्स सुरक्षित हैं।`
              : `Great news! All your inventory is well-stocked. Total ${products.length} products tracked, and none are below minimum threshold.`;
          } else {
            botResponse = isHindiQuery
              ? `इन्वेंट्री ऑडिट पूरा हुआ। **${lowStock.length} प्रोडक्ट्स** का स्टॉक कम है और री-ऑर्डर की ज़रूरत है:\n` +
                lowStock.slice(0, 5).map(p => `• **${p.name}**: सिर्फ ${p.stockQuantity || 0} पीस बचे हैं (रेट: ₹${p.sellingPrice || p.price || 0})`).join('\n')
              : `Audit complete. Found **${lowStock.length} items** requiring re-order attention:\n` +
                lowStock.slice(0, 5).map(p => `• **${p.name}**: Only ${p.stockQuantity || 0} units left (Price: ₹${p.sellingPrice || p.price || 0})`).join('\n') +
                (lowStock.length > 5 ? `\n...and ${lowStock.length - 5} more items.` : '');
            
            botActionData = {
              type: 'inventory_alert',
              title: isHindiQuery ? 'लो स्टॉक चेतावनी' : 'Low Stock Reorder Guard',
              items: lowStock.slice(0, 4),
              cta: { label: isHindiQuery ? 'इन्वेंट्री खोलें' : 'Open Inventory', path: '/products' }
            };
          }
        }

        // ==========================================
        // 15. CUSTOMERS & KHATA - ADD CUSTOMER
        // ==========================================
        else if (
          lower.startsWith('add customer') || 
          lower.startsWith('create customer') || 
          lower.startsWith('naya grahak') || 
          lower.includes('customer banao') || 
          lower.includes('grahak jodo')
        ) {
          const phoneMatch = lower.match(/(?:phone|mobile|contact|number)\s*(?:is|:)?\s*([0-9\+\-\s]{7,15})/i) || lower.match(/([0-9]{10})/i);
          const custPhone = phoneMatch ? phoneMatch[1].replace(/\s+/g, '') : '';

          let rawName = lower
            .replace(/add customer|create customer|naya grahak|customer banao|grahak jodo/gi, '')
            .replace(/(?:phone|mobile|contact|number)\s*(?:is|:)?\s*[0-9\+\-\s]{7,15}/gi, '')
            .replace(/[0-9]{10}/g, '')
            .replace(/with|having|name/gi, '')
            .trim();

          const custName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'New Customer';

          const newCustomer = {
            name: custName,
            phone: custPhone,
            totalPurchases: 0,
            totalSpending: 0,
            outstandingBalance: 0,
            customerType: 'Retail',
            status: 'Active',
            createdAt: new Date().toISOString()
          };

          await db.add('customers', newCustomer, businessId);
          window.dispatchEvent(new CustomEvent('karobaar_data_synced', { detail: { businessId } }));
          navigate('/customers');

          botResponse = aiLanguage === 'hi'
            ? `नया ग्राहक **${custName}** ${custPhone ? `(फ़ोन: ${custPhone})` : ''} उधार खाता लेजर में जोड़ दिया गया है!`
            : `Added new customer **${custName}** ${custPhone ? `(Phone: ${custPhone})` : ''} to your customer ledger!`;

          botActionData = {
            type: 'action_confirmed',
            badge: `Customer Added: ${custName}`
          };
        }

        // ==========================================
        // 16. CUSTOMERS & KHATA - RECORD PAYMENT RECEIVED (VASOOLI)
        // ==========================================
        else if (
          lower.includes('received') || 
          lower.includes('mile') || 
          lower.includes('jama karo') || 
          lower.includes('jama kardo') || 
          lower.includes('vasooli') || 
          (lower.includes('payment') && (lower.includes('from') || lower.includes('se')))
        ) {
          const amountMatch = lower.match(/(?:rs|₹|of)?\s*(\d+(?:\.\d+)?)/i);
          const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

          const customers = await db.getCollection('customers', businessId);
          let targetCustomer = null;

          for (const c of customers) {
            const cName = (c.name || '').toLowerCase();
            if (cName && lower.includes(cName)) {
              targetCustomer = c;
              break;
            }
          }

          if (targetCustomer && amount > 0) {
            const prevBal = targetCustomer.outstandingBalance || 0;
            const newBal = Math.max(0, prevBal - amount);

            await db.update('customers', targetCustomer.id, { outstandingBalance: newBal }, businessId);
            await db.add('payments', {
              customerId: targetCustomer.id,
              customerName: targetCustomer.name,
              amount: amount,
              type: 'Customer Payment',
              method: 'Cash',
              date: new Date().toISOString(),
              note: 'Voice logged via Jarvis'
            }, businessId);

            window.dispatchEvent(new CustomEvent('karobaar_data_synced', { detail: { businessId } }));
            navigate('/customers');

            botResponse = aiLanguage === 'hi'
              ? `**${targetCustomer.name}** से **₹${amount}** की वसूली दर्ज कर ली गई है! पिछला उधार: ₹${prevBal}, अब शेष उधार: **₹${newBal}**.`
              : `Recorded **₹${amount}** payment from **${targetCustomer.name}**! Previous Balance: ₹${prevBal}, New Remaining Due: **₹${newBal}**.`;

            botActionData = {
              type: 'action_confirmed',
              badge: `Payment Logged: ₹${amount} from ${targetCustomer.name}`
            };
          } else {
            navigate('/customers');
            botResponse = `Opening **Customer Khata**. To record payment via voice, say e.g. "Received 500 payment from Rahul".`;
          }
        }

        // ==========================================
        // 17. CUSTOMERS & KHATA - ADD UDHAAR / CREDIT
        // ==========================================
        else if (
          (lower.includes('udhaar') || lower.includes('credit') || lower.includes('baki')) && 
          (lower.includes('add') || lower.includes('give') || lower.includes('jodo') || lower.includes('likho') || lower.includes('do'))
        ) {
          const amountMatch = lower.match(/(?:rs|₹|of)?\s*(\d+(?:\.\d+)?)/i);
          const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

          const customers = await db.getCollection('customers', businessId);
          let targetCustomer = null;

          for (const c of customers) {
            const cName = (c.name || '').toLowerCase();
            if (cName && lower.includes(cName)) {
              targetCustomer = c;
              break;
            }
          }

          if (targetCustomer && amount > 0) {
            const prevBal = targetCustomer.outstandingBalance || 0;
            const newBal = prevBal + amount;

            await db.update('customers', targetCustomer.id, { outstandingBalance: newBal }, businessId);
            window.dispatchEvent(new CustomEvent('karobaar_data_synced', { detail: { businessId } }));
            navigate('/customers');

            botResponse = aiLanguage === 'hi'
              ? `**${targetCustomer.name}** के खाते में **₹${amount}** का उधार जोड़ दिया गया है! कुल बकाया: **₹${newBal}**.`
              : `Added **₹${amount}** credit/udhaar to **${targetCustomer.name}**'s ledger. Total balance due: **₹${newBal}**.`;

            botActionData = {
              type: 'action_confirmed',
              badge: `Udhaar Added: ₹${amount} to ${targetCustomer.name}`
            };
          } else {
            navigate('/customers');
            botResponse = `Opening **Customer Khata**. To add udhaar via voice, say e.g. "Add 300 udhaar to Rahul".`;
          }
        }

        // ==========================================
        // 18. CUSTOMERS & KHATA - DUES AUDIT
        // ==========================================
        else if (lower.includes('customer') || lower.includes('khata') || lower.includes('udhaar') || lower.includes('dues') || lower.includes('credit') || lower.includes('baki')) {
          const customers = await db.getCollection('customers', businessId);
          const withDues = customers.filter(c => (c.outstandingBalance || 0) > 0);
          const totalDues = withDues.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
          const isHindiQuery = /(udhaar|baki|khata|kaun|grahak)/i.test(lower);

          botResponse = isHindiQuery
            ? `आपके **${withDues.length} ग्राहकों** पर कुल **₹${totalDues.toFixed(2)}** का उधार बाकी है:\n` +
              withDues.slice(0, 4).map(c => `• **${c.name}**: ₹${c.outstandingBalance.toFixed(2)} बाकी (${c.phone || 'फ़ोन नहीं है'})`).join('\n') +
              (withDues.length > 4 ? `\n...और ${withDues.length - 4} अन्य ग्राहक।` : '')
            : `You have **${withDues.length} customers** with pending Udhaar balance totaling **₹${totalDues.toFixed(2)}**:\n` +
              withDues.slice(0, 4).map(c => `• **${c.name}**: Due ₹${c.outstandingBalance.toFixed(2)} (${c.phone || 'No phone'})`).join('\n') +
              (withDues.length > 4 ? `\n...and ${withDues.length - 4} more customers.` : '');
          
          botActionData = {
            type: 'dues_alert',
            title: isHindiQuery ? 'उधार खाता लेजर' : 'Udhaar Outstanding Ledger',
            cta: { label: isHindiQuery ? 'ग्राहक खाता खोलें' : 'View Customer Khata', path: '/customers' }
          };
        }

        // ==========================================
        // 19. EXPENSES & CASHFLOW LOGGING
        // ==========================================
        else if (lower.includes('expense') || lower.includes('kharcha')) {
          const expenseMatch = lower.match(/(?:add|log|record|naya|new)?\s*(?:expense|kharcha)?\s*(?:of|rs|₹)?\s*(\d+)(?:\s*(?:for|on|pe|ka|me)\s*(.+))?/i);
          const expAmount = expenseMatch && expenseMatch[1] ? parseFloat(expenseMatch[1]) : 0;
          const expNote = expenseMatch && expenseMatch[2] ? expenseMatch[2].trim() : 'General Business Expense';

          if (expAmount > 0) {
            await db.add('expenses', {
              businessId,
              amount: expAmount,
              category: 'General',
              description: expNote,
              date: new Date().toISOString(),
              createdVia: 'Jarvis Autonomous Voice'
            });
            window.dispatchEvent(new CustomEvent('karobaar_data_synced', { detail: { businessId } }));
            navigate('/expenses');

            botResponse = aiLanguage === 'hi'
              ? `₹${expAmount} का खर्च (${expNote}) सीधे बिज़नेस लेजर में दर्ज कर दिया गया है!`
              : `Recorded expense of **₹${expAmount}** for *${expNote}* directly into your live cashflow!`;
            botActionData = { type: 'action_confirmed', badge: `Expense Added: ₹${expAmount}` };
          } else {
            navigate('/expenses');
            botResponse = `Opening **Expenses & Cashflow** tracker. You can log bills, supplier payments, or say "Jarvis add expense 200 for milk".`;
          }
        }

        // ==========================================
        // 20. TASKS & TO-DO BOARD
        // ==========================================
        else if (lower.includes('task') || lower.includes('to-do') || lower.includes('todo') || lower.includes('remind me')) {
          if (lower.includes('add') || lower.includes('create') || lower.includes('naya') || lower.includes('remind') || lower.includes('likho')) {
            let taskTitle = lower
              .replace(/add task|create task|naya task|remind me to|task likho|add to-do/gi, '')
              .trim();
            taskTitle = taskTitle ? taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1) : 'New Task Reminder';

            const newTask = {
              title: taskTitle,
              assignee: currentUser?.name || 'Admin',
              priority: 'Medium',
              due: 'Today',
              status: 'Todo',
              createdAt: new Date().toISOString()
            };

            await db.add('tasks', newTask, businessId);
            window.dispatchEvent(new CustomEvent('karobaar_data_synced', { detail: { businessId } }));
            navigate('/tasks');

            botResponse = `Added task "**${taskTitle}**" to your internal Task Management board!`;
            botActionData = { type: 'action_confirmed', badge: `Task Created: ${taskTitle}` };
          } else {
            const tasks = await db.getCollection('tasks', businessId);
            navigate('/tasks');
            const taskList = tasks.map(t => `• **${t.title}** (${t.status})`).join('\n');
            botResponse = `Opening **Task Management**. Active tasks (${tasks.length}):\n${taskList || 'All tasks completed!'}`;
            botActionData = { type: 'action_confirmed', badge: `Tasks: ${tasks.length}` };
          }
        }

        // ==========================================
        // 21. ATTENDANCE & TIMECLOCK
        // ==========================================
        else if (lower.includes('attendance') || lower.includes('timeclock') || lower.includes('clock in') || lower.includes('hazri') || lower.includes('punch in') || lower.includes('clock out')) {
          const todayStr = new Date().toISOString().split('T')[0];
          const timeStr = new Date().toLocaleTimeString();

          await db.add('attendance', {
            employeeId: currentUser?.id || 'emp-self',
            employeeName: currentUser?.name || 'Staff Member',
            date: todayStr,
            checkIn: new Date().toISOString(),
            status: 'Present',
            loggedVia: 'Jarvis Voice AI'
          }, businessId);

          window.dispatchEvent(new CustomEvent('karobaar_data_synced', { detail: { businessId } }));
          navigate('/attendance');

          botResponse = aiLanguage === 'hi'
            ? `आज की हाज़िरी दर्ज हो चुकी है! स्टेटस: **उपस्थित (Present)**, समय: ${timeStr}.`
            : `Marked attendance for today as **Present** at ${timeStr}! Record synced to your company timeclock.`;
          
          botActionData = { type: 'action_confirmed', badge: `Attendance Marked: Present` };
        }

        // ==========================================
        // 22. EMPLOYEES & STAFF MANAGEMENT
        // ==========================================
        else if (lower.includes('employee') || lower.includes('staff') || lower.includes('worker')) {
          if (lower.startsWith('add') || lower.startsWith('create') || lower.startsWith('naya')) {
            const salaryMatch = lower.match(/(?:salary|tankhwah|pay)\s*(?:is|:)?\s*(\d+)/i) || lower.match(/(\d+)\s*(?:salary|tankhwah)/i);
            const roleMatch = lower.match(/role\s+([a-zA-Z]+)/i);

            const empSalary = salaryMatch ? parseInt(salaryMatch[1], 10) : 15000;
            const empRole = roleMatch ? roleMatch[1].trim() : 'Staff';

            let rawName = lower
              .replace(/add employee|create employee|naya staff|naya worker|staff jodo/gi, '')
              .replace(/(?:salary|tankhwah|pay)\s*(?:is|:)?\s*\d+/gi, '')
              .replace(/\d+\s*(?:salary|tankhwah)/gi, '')
              .replace(/role\s+[a-zA-Z]+/gi, '')
              .trim();

            const empName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'New Staff';

            const newEmployee = {
              name: empName,
              role: empRole,
              salary: empSalary,
              phone: '',
              status: 'Active',
              createdAt: new Date().toISOString()
            };

            await db.add('employees', newEmployee, businessId);
            window.dispatchEvent(new CustomEvent('karobaar_data_synced', { detail: { businessId } }));
            navigate('/employees');

            botResponse = `Added employee **${empName}** (Role: ${empRole}, Salary: ₹${empSalary}) to your staff directory!`;
            botActionData = { type: 'action_confirmed', badge: `Employee Added: ${empName}` };
          } else {
            const employees = await db.getCollection('employees', businessId);
            navigate('/employees');
            const empList = employees.map(e => `• **${e.name}** (${e.role || 'Staff'}) - Salary: ₹${e.salary || 0}`).join('\n');
            botResponse = `Opening **Employees Directory**. Active staff (${employees.length}):\n${empList || 'No staff registered yet.'}`;
            botActionData = { type: 'action_confirmed', badge: `Staff: ${employees.length} Members` };
          }
        }

        // ==========================================
        // 23. POS CART & BILLING AUTOMATION
        // ==========================================
        else if (lower.includes('clear cart') || lower.includes('empty cart') || lower.includes('reset cart') || lower.includes('cart khali')) {
          sessionStorage.setItem('pending_ai_pos_action', JSON.stringify({ clear: true, timestamp: Date.now() }));
          navigate('/pos');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('karobaar_ai_pos_action', { detail: { clear: true } }));
          }, 300);
          botResponse = `Cleared your active POS cart. Billing register is ready for new items.`;
          botActionData = { type: 'action_confirmed', badge: 'Cart Cleared' };
        }
        else if (lower.includes('hold order') || lower.includes('park order') || lower.includes('hold bill') || lower.includes('park bill')) {
          sessionStorage.setItem('pending_ai_pos_action', JSON.stringify({ hold: true, timestamp: Date.now() }));
          navigate('/pos');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('karobaar_ai_pos_action', { detail: { hold: true } }));
          }, 300);
          botResponse = `Placed active order on Hold. You can resume it anytime from Held Orders [F4].`;
          botActionData = { type: 'action_confirmed', badge: 'Order Held / Parked' };
        }
        else if (lower.includes('pay with upi') || lower.includes('upi payment') || lower.includes('pay by upi') || lower.includes('upi mode')) {
          sessionStorage.setItem('pending_ai_pos_action', JSON.stringify({ paymentMethod: 'UPI', timestamp: Date.now() }));
          navigate('/pos');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('karobaar_ai_pos_action', { detail: { paymentMethod: 'UPI' } }));
          }, 300);
          botResponse = `Payment method switched to **UPI QR Code**. Customers can scan dynamic QR or shop standee.`;
          botActionData = { type: 'action_confirmed', badge: 'UPI Mode Selected' };
        }
        else if (lower.includes('pay with cash') || lower.includes('cash payment') || lower.includes('pay by cash') || lower.includes('cash mode')) {
          sessionStorage.setItem('pending_ai_pos_action', JSON.stringify({ paymentMethod: 'Cash', timestamp: Date.now() }));
          navigate('/pos');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('karobaar_ai_pos_action', { detail: { paymentMethod: 'Cash' } }));
          }, 300);
          botResponse = `Payment method switched to **Cash**. Tendered cash counter and change calculator ready.`;
          botActionData = { type: 'action_confirmed', badge: 'Cash Mode Selected' };
        }
        else if (lower.includes('discount') || lower.includes('chhoot') || lower.includes('percent off')) {
          const discountMatch = lower.match(/(?:discount|chhoot|off)\s*(?:of|rs|₹)?\s*(\d+)/) || lower.match(/(\d+)\s*(?:rupees|rs|%|percent)?\s*(?:discount|off)/);
          const discountVal = discountMatch ? parseInt(discountMatch[1], 10) : 0;
          if (discountVal > 0) {
            sessionStorage.setItem('pending_ai_pos_action', JSON.stringify({ discount: discountVal, timestamp: Date.now() }));
            navigate('/pos');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('karobaar_ai_pos_action', { detail: { discount: discountVal } }));
            }, 300);
            botResponse = `Applied a discount of **₹${discountVal}** to the POS bill!`;
            botActionData = { type: 'action_confirmed', badge: `₹${discountVal} Discount Applied` };
          } else {
            botResponse = `Please specify the discount amount, e.g. "Apply 50 discount" or "Give 20 rupees off".`;
          }
        }
        else if (lower.includes('checkout') || lower.includes('complete sale') || lower.includes('finalize bill') || lower.includes('bill complete') || lower.includes('bill banao') || lower.includes('print bill')) {
          sessionStorage.setItem('pending_ai_pos_action', JSON.stringify({ checkout: true, timestamp: Date.now() }));
          navigate('/pos');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('karobaar_ai_pos_action', { detail: { checkout: true } }));
          }, 300);
          botResponse = `Finalizing sale and triggering POS checkout settlement! Customer can pay via QR, Cash, or Split.`;
          botActionData = { type: 'action_confirmed', badge: 'Checkout Finalized' };
        }

        // ==========================================
        // 24. POS ADD ITEM (VOICE BILLING)
        // ==========================================
        else if (
          lower.includes('to cart') || 
          lower.includes('to bill') || 
          lower.includes('cart me') || 
          lower.includes('bill me') || 
          lower.includes('becho') || 
          lower.startsWith('sell ') || 
          (lower.startsWith('add ') && !lower.includes('task') && !lower.includes('customer') && !lower.includes('employee') && !lower.includes('product') && !lower.includes('stock') && !lower.includes('expense') && !lower.includes('udhaar'))
        ) {
          const products = await db.getCollection('products', businessId);
          let targetProduct = null;
          let targetQty = 1;

          const qtyMatch = lower.match(/\b(\d+)\s*(?:pcs|plates|unit|units)?\b/);
          if (qtyMatch) {
            const parsed = parseInt(qtyMatch[1], 10);
            if (!isNaN(parsed) && parsed > 0 && parsed <= 100) targetQty = parsed;
          }

          for (const p of products) {
            const pName = (p.name || '').toLowerCase();
            if (!pName) continue;
            if (lower.includes(pName) || pName.split(/\s+/).some(w => w.length >= 3 && lower.includes(w))) {
              targetProduct = p;
              break;
            }
          }

          if (targetProduct) {
            sessionStorage.setItem('pending_ai_pos_action', JSON.stringify({
              action: 'add_item',
              product: targetProduct,
              quantity: targetQty,
              timestamp: Date.now()
            }));
            navigate('/pos');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('karobaar_ai_pos_action', {
                detail: { action: 'add_item', product: targetProduct, quantity: targetQty }
              }));
            }, 300);
            const totalCost = (targetProduct.sellingPrice || targetProduct.price || 0) * targetQty;
            const isHinglish = aiLanguage === 'hinglish' || /(kardo|daal|becho|jodo|chai|maal)/i.test(lower);
            const isHi = aiLanguage === 'hi';
            
            botResponse = isHinglish
              ? `Added **${targetQty}x ${targetProduct.name}** (₹${totalCost.toFixed(2)}) directly aapke POS cart me! Billing counter open ho gaya hai.`
              : isHi
              ? `जी, **${targetQty}x ${targetProduct.name}** (₹${totalCost.toFixed(2)}) आपके बिल में जोड़ दिया गया है।`
              : `Added **${targetQty}x ${targetProduct.name}** (₹${totalCost.toFixed(2)}) directly to your POS cart! Opening billing counter.`;

            botActionData = {
              type: 'action_confirmed',
              badge: `Added ${targetQty}x ${targetProduct.name} (₹${totalCost.toFixed(2)})`
            };
          } else if (lower.startsWith('add') || lower.startsWith('sell') || lower.includes('to cart') || lower.includes('to bill')) {
            botResponse = `I looked for that product in your inventory, but couldn't find a close match. Please verify the name in your Products catalog or add it first.`;
          } else {
            navigate('/pos');
            botResponse = `Opening the **POS Terminal / New Sale** register [F2]! Ready for fast item billing.`;
            botActionData = { type: 'action_confirmed', badge: 'POS Terminal Launched' };
          }
        }

        // ==========================================
        // 25. SALES & REVENUE REPORTS
        // ==========================================
        else if (lower.includes('today sale') || lower.includes('today\'s sale') || lower.includes('aaj ki sale') || (lower.includes('sale') && !lower.includes('new sale') && !lower.includes('add') && !lower.includes('sell') && !lower.includes('bill')) || lower.includes('revenue') || lower.includes('income') || lower.includes('kamayi') || lower.includes('earning')) {
          const sales = await db.getCollection('sales', businessId);
          const today = new Date().toISOString().split('T')[0];
          const todaySales = sales.filter(s => (s.date || '').startsWith(today));
          const totalRev = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
          const ordersCount = todaySales.length;

          const isHindiQuery = /(aaj|kamayi|bikri|kitna|kya)/i.test(lower);
          botResponse = isHindiQuery
            ? `**${currentBusiness?.name || 'Karobaar'}** की आज की बिक्री रिपोर्ट:\n\n• **आज का रेवेन्यू:** ₹${totalRev.toFixed(2)}\n• **कुल ऑर्डर्स:** ${ordersCount} ऑर्डर्स\n• **लाइफटाइम बिक्री:** ${sales.length} ट्रांसैक्शन्स`
            : `Here is today's sales report for **${currentBusiness?.name || 'Karobaar'}**:\n\n• **Today's Revenue:** ₹${totalRev.toFixed(2)}\n• **Orders Count:** ${ordersCount} orders\n• **Total Lifetime Sales:** ${sales.length} transactions`;
          
          botActionData = {
            type: 'metrics',
            title: isHindiQuery ? "लाइव बिक्री रिपोर्ट" : "Live Sales Performance",
            metrics: [
              { label: isHindiQuery ? 'आज की कमाई' : 'Today Revenue', value: `₹${totalRev.toFixed(2)}` },
              { label: isHindiQuery ? 'ऑर्डर्स' : 'Orders Count', value: ordersCount },
              { label: isHindiQuery ? 'कुल बिक्री' : 'Lifetime Sales', value: sales.length }
            ],
            cta: { label: isHindiQuery ? 'सभी ऑर्डर्स देखें' : 'View All Orders', path: '/orders' }
          };
        }

        // ==========================================
        // 26. 100% EXHAUSTIVE ROUTE NAVIGATION
        // ==========================================
        else if (
          lower.startsWith('open ') || 
          lower.startsWith('go to ') || 
          lower.startsWith('navigate ') || 
          lower.includes('page kholo') || 
          lower.includes('kholo') || 
          lower.includes('desk') || 
          lower === 'dashboard' || 
          lower === 'pos' || 
          lower === 'orders' || 
          lower === 'invoices' || 
          lower === 'products' || 
          lower === 'inventory' || 
          lower === 'purchases' || 
          lower === 'suppliers' || 
          lower === 'customers' || 
          lower === 'employees' || 
          lower === 'attendance' || 
          lower === 'leave' || 
          lower === 'payroll' || 
          lower === 'expenses' || 
          lower === 'payments' || 
          lower === 'tasks' || 
          lower === 'reports' || 
          lower === 'settings' || 
          lower === 'notifications'
        ) {
          if (lower.includes('invoice') || lower.includes('bill desk')) {
            navigate('/invoices');
            botResponse = `Opening **Tax Invoices & Billing Desk**. View GST invoices and settlement receipts.`;
          } else if (lower.includes('pos') || lower.includes('register') || lower.includes('counter') || lower.includes('new sale')) {
            navigate('/pos');
            botResponse = `Opening the **POS Terminal / New Sale** register [F2]! Fast barcode billing ready.`;
            botActionData = { type: 'action_confirmed', badge: 'POS Terminal Launched' };
          } else if (lower.includes('inventory') || lower.includes('warehouse') || lower.includes('godown')) {
            navigate('/inventory');
            botResponse = `Opening **Inventory & Warehouse Operations**. Track reorder points, low stock warnings, and storage.`;
          } else if (lower.includes('purchase') || lower.includes('kharidari')) {
            navigate('/purchases');
            botResponse = `Opening **Purchases & Raw Materials**. Manage vendor invoices and purchase orders.`;
          } else if (lower.includes('supplier') || lower.includes('vendor') || lower.includes('vyapari')) {
            navigate('/suppliers');
            botResponse = `Opening **Suppliers Directory**. View vendor credit balances and contact info.`;
          } else if (lower.includes('product') || lower.includes('catalog') || lower.includes('saman') || lower.includes('item')) {
            navigate('/products');
            botResponse = `Opening **Products & Inventory Catalog**. Manage product prices, variants, categories, and stock quantities.`;
          } else if (lower.includes('customer') || lower.includes('khata') || lower.includes('udhaar') || lower.includes('grahak')) {
            navigate('/customers');
            botResponse = `Opening **Customer Khata & Credit Ledger**. View outstanding customer balances, payment records, and reminders.`;
          } else if (lower.includes('payroll') || lower.includes('salary') || lower.includes('tankhwah')) {
            navigate('/payroll');
            botResponse = `Opening **Payroll & Compensation**. Review monthly staff salaries, advances, and payouts.`;
          } else if (lower.includes('leave') || lower.includes('chhutti') || lower.includes('holiday')) {
            navigate('/leave');
            botResponse = `Opening **Leave Management**. Review staff time-off requests and approvals.`;
          } else if (lower.includes('attendance') || lower.includes('hazri') || lower.includes('timeclock')) {
            navigate('/attendance');
            botResponse = `Opening **Attendance & Timeclock**. Track clock-ins, daily work hours, and staff leave approvals.`;
          } else if (lower.includes('employee') || lower.includes('staff') || lower.includes('team')) {
            navigate('/employees');
            botResponse = `Opening **Employees & Staff Management**. Manage staff roles, view salaries, and track commissions.`;
          } else if (lower.includes('payment') || lower.includes('transaction') || lower.includes('jama')) {
            navigate('/payments');
            botResponse = `Opening **Payments & Settlement History**. Review all customer and vendor cash transactions.`;
          } else if (lower.includes('expense') || lower.includes('kharcha')) {
            navigate('/expenses');
            botResponse = `Opening **Expenses & Cashflow**. Log vendor payments, utility bills, and daily petty cash spend.`;
          } else if (lower.includes('task') || lower.includes('todo') || lower.includes('assignment')) {
            navigate('/tasks');
            botResponse = `Opening **Task Management**. Track assignments, priority tasks, and reminders.`;
          } else if (lower.includes('order') || lower.includes('receipt') || lower.includes('history')) {
            navigate('/orders');
            botResponse = `Opening **Orders & Receipts**. Review previous sales transactions and printed invoice receipts.`;
          } else if (lower.includes('branch') || lower.includes('outlet')) {
            navigate('/branches');
            botResponse = `Opening **Multi-Branch Operations**. Switch between store branches and manage transfers.`;
          } else if (lower.includes('hq') || lower.includes('analytics') || lower.includes('head office')) {
            navigate('/hq-analytics');
            botResponse = `Opening **HQ Enterprise Analytics**. Multi-store revenue comparison and performance metrics.`;
          } else if (lower.includes('report') || lower.includes('graph') || lower.includes('statement')) {
            navigate('/reports');
            botResponse = `Opening **Reports & Business Analytics**. View sales graphs, revenue breakdowns, and tax statements.`;
          } else if (lower.includes('notification') || lower.includes('alert')) {
            navigate('/notifications');
            botResponse = `Opening **System Notifications & Alerts**.`;
          } else if (lower.includes('setting') || lower.includes('config') || lower.includes('preference')) {
            navigate('/settings');
            botResponse = `Opening **Settings & Workspace**. Configure Business Profile, Currency, UPI QR, and Customize AI rules.`;
          } else {
            navigate('/dashboard');
            botResponse = `Navigating to **Karobaar Dashboard** overview.`;
          }
        }

        // ==========================================
        // 27. GENERAL CAPABILITIES & HELP
        // ==========================================
        else {
          const isHi = aiLanguage === 'hi';
          botResponse = isHi
            ? `मैं सुन रहा हूँ: "${query}"\n\nमैं आपकी पूरी दुकान को आवाज़ से नियंत्रित कर सकता हूँ:\n• "Add product Samosa price 20 stock 50"\n• "Add 2 Burger to cart"\n• "Received 500 payment from Rahul"\n• "Add expense 350 for tea"\n• "Mark attendance"\n• "Check low stock" / "Today's sales"\n• "Export backup" / "Dark mode"`
            : `I am listening: "${query}".\n\nI have 100% autonomous control over Karobaar:\n• **Products:** "Add product Samosa price 20 stock 50", "Restock Burger 50", "Low stock"\n• **Khata:** "Add customer Rahul phone 9876543210", "Received 500 from Rahul"\n• **POS:** "Add 2 Burger to cart", "Apply 20 discount", "Checkout", "Pay with UPI"\n• **Expenses:** "Add expense 350 for milk"\n• **HR & Tasks:** "Mark attendance", "Add task Check stock"\n• **System:** "Export backup", "Toggle dark mode", "Switch to legacy mode"`;
        }
      } catch (err) {
        console.error('AI Processing Error:', err);
        botResponse = `I encountered an issue processing that command. Please try again.`;
      }

      setIsTyping(false);
      const newBotMsg = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toISOString(),
        actionData: botActionData,
        quickActions: [
          { label: '📊 Today\'s Sales', query: 'Show today sales summary' },
          { label: '⚠️ Low Stock', query: 'Which items are low in stock?' },
          { label: '🛒 Add Burger to Bill', query: 'Add 2 Burger to cart' },
          { label: '💾 Export Backup', query: 'Export database backup' }
        ]
      };

      setMessages(prev => [...prev, newBotMsg]);
      // Speak response out loud in voice mode
      speakText(botResponse);
    })();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserQuery();
    }
  };

  // Latest assistant response for subtitle display
  const latestBotMsg = [...messages].reverse().find(m => m.sender === 'bot');
  const latestBotText = latestBotMsg
    ? latestBotMsg.text.replace(/[*#_`]/g, '').trim().slice(0, 110) + (latestBotMsg.text.replace(/[*#_`]/g, '').trim().length > 110 ? '...' : '')
    : '';

  return (
    <>
      {/* VIEW 1: Minimized Floating Pill (When collapsed in bottom corner) */}
      {isBarMinimized ? (
        <button 
          type="button"
          className="jarvis-minimized-pill"
          onClick={() => setIsBarMinimized(false)}
          title="Expand Jarvis Voice Bar (Listening from everywhere)"
        >
          <span className={`jarvis-bar-dot ${isListening ? 'listening' : isSpeaking ? 'speaking' : !voiceEnabled ? 'muted' : 'idle'}`} />
          <Sparkles size={14} />
          <span>{assistantName} Active</span>
        </button>
      ) : (
        /* VIEW 2: Simple, Non-Intrusive Floating Jarvis Bar (Listening from everywhere, ZERO POPUPS) */
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
                title="View Full Chat History & Details"
              >
                <MessageSquare size={14} />
              </button>

              {/* Minimize Bar */}
              <button 
                type="button" 
                onClick={() => setIsBarMinimized(true)}
                className="jarvis-bar-icon-btn"
                title="Minimize to Pill"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Optional Slide-over Chat History Drawer (Opened ONLY via Chat Icon, NO BACKDROP) */}
      {isChatDrawerOpen && (
        <div className="jarvis-chat-side-drawer">
          <div className="customize-ai-header">
            <div className="customize-ai-header-left">
              <div className="customize-ai-avatar">
                <Sparkles size={15} />
              </div>
              <div>
                <h3 className="customize-ai-title">{assistantName} History</h3>
                <p className="customize-ai-status">
                  {isListening ? '● Listening from anywhere' : '● Ambient Ready'}
                </p>
              </div>
            </div>

            <div className="customize-ai-header-actions">
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
                        <p key={idx} style={{ margin: '0 0 4px 0' }}>{line}</p>
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
                              <div key={it.id} className="customize-ai-item-row">
                                <span>{it.name}</span>
                                <span className="stock-alert">{it.stockQuantity} left</span>
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
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Text Input */}
          <div className="customize-ai-input-area">
            <div className="customize-ai-input-box">
              <input 
                type="text" 
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Type a command for ${assistantName}...`}
                className="customize-ai-text-input"
              />
              <button 
                type="button" 
                onClick={() => handleUserQuery()}
                disabled={!inputMessage.trim()}
                className="customize-ai-send-btn"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
