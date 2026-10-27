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
  Minimize2
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/databaseService';
import './CustomizeAIChatbot.css';

export const CustomizeAIChatbot = () => {
  const { theme, toggleTheme, appUiVersion, setAppUiVersion, currentUser, currentBusiness } = useAppContext();
  const navigate = useNavigate();
  
  // UI States
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false); // ChatGPT Voice Orb Screen
  const [isListening, setIsListening] = useState(false);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiLanguage, setAiLanguage] = useState(() => localStorage.getItem('karobaar_ai_language') || 'hinglish'); // 'hinglish' | 'en' | 'hi'
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Sync refs for uninterrupted voice callbacks
  const voiceModeActiveRef = useRef(voiceModeActive);
  const voiceSpeechEnabledRef = useRef(voiceSpeechEnabled);

  useEffect(() => {
    voiceModeActiveRef.current = voiceModeActive;
  }, [voiceModeActive]);

  useEffect(() => {
    voiceSpeechEnabledRef.current = voiceSpeechEnabled;
  }, [voiceSpeechEnabled]);

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

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English / Hindi mix support

      recognition.onstart = () => {
        setIsListening(true);
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
          setInterimTranscript(interim);
        }

        if (final.trim()) {
          setInterimTranscript('');
          handleUserQuery(final.trim());
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If in voice mode and assistant is not speaking, keep listening active
        if (voiceModeActiveRef.current && !isSpeakingRef.current) {
          setTimeout(() => {
            try {
              if (voiceModeActiveRef.current && !isSpeakingRef.current) {
                recognition.start();
              }
            } catch (e) {}
          }, 250);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const isSpeakingRef = useRef(false);

  const startListening = () => {
    stopSpeaking();
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.abort();
    } catch (e) {}
    setTimeout(() => {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {}
    }, 120);
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {}
    setIsListening(false);
  };

  // Text-To-Speech function
  const speakText = (textToSpeak) => {
    if (!voiceSpeechEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // cancel ongoing speech
    // Clean markdown characters
    const clean = textToSpeak
      .replace(/[*#_`]/g, '')
      .replace(/•/g, '')
      .replace(/₹/g, 'Rupees ')
      .trim();

    // Limit spoken length for responsiveness
    const sentences = clean.split('\n').filter(Boolean).slice(0, 3).join('. ');
    const utterance = new SpeechSynthesisUtterance(sentences);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const isHindi = /[\u0900-\u097F]/.test(sentences) || /(namaste|dhanyawad|aapka|shukriya|kar diya|kardo|hai|kripya|bhejo|aaj|kamayi|bikri|dukan|maal|batao|udhaar)/i.test(sentences);
    if (isHindi) {
      const hiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('madhur'));
      if (hiVoice) utterance.voice = hiVoice;
      utterance.lang = 'hi-IN';
    } else {
      const inVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('neerja'));
      if (inVoice) utterance.voice = inVoice;
      utterance.lang = 'en-IN';
    }

    // Chrome speech queue unfreeze trick
    try {
      window.speechSynthesis.resume();
    } catch (e) {}

    isSpeakingRef.current = true;
    setIsSpeaking(true);

    const safetyTimer = setTimeout(() => {
      if (isSpeakingRef.current) {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        if (voiceModeActiveRef.current) startListening();
      }
    }, Math.min(5000, Math.max(1800, clean.length * 65)));

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      clearTimeout(safetyTimer);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (voiceModeActiveRef.current) {
        setTimeout(startListening, 250);
      }
    };

    utterance.onerror = () => {
      clearTimeout(safetyTimer);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (voiceModeActiveRef.current) {
        setTimeout(startListening, 250);
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      clearTimeout(safetyTimer);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (voiceModeActiveRef.current) startListening();
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Toggle Voice Input Recording
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported on this browser. Try Google Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14); // A5

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Handled silently
    }
  };

  // Trigger Assistant Wake
  const triggerAssistantWake = (queryAfterWake = '') => {
    playWakeChime();
    setIsOpen(true);
    setVoiceModeActive(true);
    const name = aiSettings.assistantName || 'Jarvis';

    if (queryAfterWake) {
      setTimeout(() => {
        handleUserQuery(queryAfterWake);
      }, 250);
    } else {
      // Start listening directly so user can speak immediately!
      startListening();

      const isHi = aiLanguage === 'hi';
      const isEn = aiLanguage === 'en';
      const greeting = isHi
        ? `जी सर, ${name} हाज़िर है! कहिए, क्या सहायता करूँ?`
        : isEn
        ? `Yes sir, ${name} is online and listening. How can I assist you?`
        : `Ji sir, ${name} hazir hai! Boliye, main aapke liye kya kar sakta hoon?`;

      setTimeout(() => {
        speakText(greeting);
      }, 150);
    }
  };

  // Listen to wake event from Dedicated Topbar Button
  useEffect(() => {
    const handleWakeEvent = (e) => {
      triggerAssistantWake(e?.detail?.query || '');
    };
    window.addEventListener('karobaar_wake_ai_assistant', handleWakeEvent);
    return () => window.removeEventListener('karobaar_wake_ai_assistant', handleWakeEvent);
  }, [aiSettings.assistantName, aiLanguage]);

  // Sync settings dynamically when changed in Settings tab
  useEffect(() => {
    const handleSettingsSync = (e) => {
      try {
        const saved = JSON.parse(localStorage.getItem('karobaar_customize_ai_settings') || '{}');
        setAiSettings(prev => ({
          ...prev,
          assistantName: e?.detail?.assistantName || saved.assistantName || 'Mr. H',
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

  // Background Speech Recognition for Hands-Free Wake Words ("Hey Mr. H", "Hey Jarvis", etc.)
  const bgRecognitionRef = useRef(null);
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isOpen || aiSettings.backgroundWake === false) {
      if (bgRecognitionRef.current) {
        try { bgRecognitionRef.current.abort(); } catch {}
      }
      return;
    }

    let isComponentMounted = true;
    try {
      const bgRec = new SpeechRecognition();
      bgRec.continuous = true;
      bgRec.interimResults = false;
      bgRec.lang = 'en-IN';

      bgRec.onresult = (event) => {
        const lastIdx = event.results.length - 1;
        const transcript = (event.results[lastIdx][0]?.transcript || '').toLowerCase().trim();
        const currentName = (aiSettings.assistantName || 'Jarvis').toLowerCase();

        // Strictly single active identity: Only the active selected assistant can be called!
        const wakeTriggers = [
          currentName,
          `hey ${currentName}`,
          `ok ${currentName}`,
          `hello ${currentName}`,
          `wake up ${currentName}`,
          `${currentName} wake up`,
          `suno ${currentName}`
        ];

        const matchedTrigger = wakeTriggers.find(t => transcript.includes(t));
        if (matchedTrigger) {
          try { bgRec.stop(); } catch {}
          let queryPart = transcript.substring(transcript.indexOf(matchedTrigger) + matchedTrigger.length).trim();
          triggerAssistantWake(queryPart);
        }
      };

      bgRec.onerror = (e) => {
        // Continuous recovery for background voice recognition
      };

      bgRec.onend = () => {
        if (isComponentMounted && !isOpen && aiSettings.backgroundWake !== false) {
          setTimeout(() => {
            try { bgRec.start(); } catch {}
          }, 300);
        }
      };

      bgRec.start();
      bgRecognitionRef.current = bgRec;
    } catch (e) {
      // Permission or autoplay restriction
    }

    return () => {
      isComponentMounted = false;
      if (bgRecognitionRef.current) {
        try { bgRecognitionRef.current.abort(); } catch {}
      }
    };
  }, [isOpen, aiSettings.assistantName, aiSettings.backgroundWake]);

  // Listen to open event from Topbar or Global Search
  useEffect(() => {
    const handleOpenAi = (e) => {
      setIsOpen(true);
      if (e.detail && e.detail.query) {
        handleUserQuery(e.detail.query);
      }
    };
    window.addEventListener('karobaar_open_ai_assistant', handleOpenAi);
    return () => window.removeEventListener('karobaar_open_ai_assistant', handleOpenAi);
  }, []);

  // Save conversation history
  useEffect(() => {
    try {
      localStorage.setItem('karobaar_customize_ai_history', JSON.stringify(messages.slice(-30)));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && !voiceModeActive) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping, voiceModeActive]);

  const handleClearHistory = () => {
    stopSpeaking();
    if (window.confirm('Clear AI chat history?')) {
      const resetMsg = [
        {
          id: 'welcome-reset',
          sender: 'bot',
          text: `Chat history cleared. How can **Customize** assist your business today?`,
          timestamp: new Date().toISOString(),
          quickActions: [
            { label: '📊 Check Today\'s Sales', query: 'Show today sales summary' },
            { label: '📦 Low Stock Alert', query: 'Which items are low in stock?' }
          ]
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

    // AI reasoning delay simulation
    setTimeout(async () => {
      let botResponse = '';
      let botActionData = null;

      try {
        // 1. Live Feature Spotlight & Outlining Tour
        if (lower.includes('tour') || lower.includes('spotlight') || lower.includes('feature') || lower.includes('outline') || lower.includes('guide') || lower.includes('sikhao') || lower.includes('dikhao') || lower.includes('samjhao')) {
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

        // 2. Autonomous Navigation Across All Web Modules
        else if (lower.startsWith('open ') || lower.startsWith('go to ') || lower.startsWith('navigate ') || lower.includes('page kholo') || lower.includes('kholo') || lower === 'dashboard' || lower === 'pos' || lower === 'orders' || lower === 'products' || lower === 'customers' || lower === 'expenses' || lower === 'reports' || lower === 'settings') {
          if (lower.includes('invoice') || lower.includes('bill')) {
            navigate('/invoices');
            botResponse = `Opening **Tax Invoices & Billing** desk. Track printed tax receipts, invoice prefixes, and settlement slips.`;
          } else if (lower.includes('pos') || lower.includes('billing') || lower.includes('register') || lower.includes('new sale') || lower.includes('counter')) {
            navigate('/pos');
            botResponse = `Opening the **POS Terminal / New Sale** register [F2]! Ready for fast item billing.`;
            botActionData = { type: 'action_confirmed', badge: 'POS Terminal Launched' };
          } else if (lower.includes('product') || lower.includes('catalog') || lower.includes('inventory') || lower.includes('stock') || lower.includes('items')) {
            navigate('/products');
            botResponse = `Opening **Products & Inventory Catalog**. Manage product prices, variants, categories, and stock quantities.`;
          } else if (lower.includes('customer') || lower.includes('khata') || lower.includes('udhaar') || lower.includes('grahak')) {
            navigate('/customers');
            botResponse = `Opening **Customer Khata & Credit Ledger**. View outstanding customer balances, payment records, and reminders.`;
          } else if (lower.includes('expense') || lower.includes('kharcha')) {
            navigate('/expenses');
            botResponse = `Opening **Expenses & Cashflow**. Log vendor payments, utility bills, and daily petty cash spend.`;
          } else if (lower.includes('report') || lower.includes('analytics')) {
            navigate('/reports');
            botResponse = `Opening **Reports & Business Analytics**. View sales graphs, revenue breakdowns, and tax statements.`;
          } else if (lower.includes('employee') || lower.includes('staff') || lower.includes('worker') || lower.includes('payroll')) {
            navigate('/employees');
            botResponse = `Opening **Employees & Staff Management**. Manage staff roles, view salaries, and track commissions.`;
          } else if (lower.includes('attendance') || lower.includes('timeclock') || lower.includes('clock in') || lower.includes('hazri')) {
            navigate('/attendance');
            botResponse = `Opening **Attendance & Timeclock**. Track clock-ins, daily work hours, and staff leave approvals.`;
          } else if (lower.includes('branch') || lower.includes('outlet')) {
            navigate('/branches');
            botResponse = `Opening **Multi-Branch Operations**. Switch between store branches and manage transfers.`;
          } else if (lower.includes('order') || lower.includes('receipt') || lower.includes('history')) {
            navigate('/orders');
            botResponse = `Opening **Orders & Receipts**. Review previous sales transactions and printed invoice receipts.`;
          } else if (lower.includes('setting') || lower.includes('config')) {
            navigate('/settings');
            botResponse = `Opening **Settings & Workspace**. Configure Business Profile, Currency, UPI QR, and Customize AI rules.`;
          } else if (lower.includes('notification') || lower.includes('alert')) {
            navigate('/notifications');
            botResponse = `Opening **System Notifications & Alerts**.`;
          } else {
            navigate('/dashboard');
            botResponse = `Navigating to **Karobaar Dashboard** overview.`;
          }
        }

        // 3. Autonomous Expense Recording live into Database
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

        // 4. Autonomous POS Checkout & Settlement
        else if (lower.includes('checkout') || lower.includes('complete sale') || lower.includes('finalize bill') || lower.includes('bill complete') || lower.includes('bill banao')) {
          sessionStorage.setItem('pending_ai_pos_action', JSON.stringify({ checkout: true, timestamp: Date.now() }));
          navigate('/pos');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('karobaar_ai_pos_action', { detail: { checkout: true } }));
          }, 300);
          botResponse = `Finalizing sale and opening POS checkout settlement! Customer can pay via QR, Cash, or Split.`;
          botActionData = { type: 'action_confirmed', badge: 'Checkout Opened' };
        }

        // 5. Business Setup & AI Store Onboarding Concierge
        else if (lower.includes('setup') || lower.includes('onboard') || lower.includes('shuru karo') || lower.includes('store setup') || lower.includes('business setup') || lower.includes('dukan setup') || lower.includes('meri dukan') || lower.includes('mera business')) {
          setIsOpen(false);
          stopSpeaking();
          window.dispatchEvent(new CustomEvent('karobaar_start_ai_onboarding'));
          const isHinglish = aiLanguage === 'hinglish' || !/[ऀ-ॿ]/.test(lower);
          botResponse = isHinglish
            ? `Maine aapke liye Live Store Setup Concierge shuru kar diya hai. Chaliye step-by-step aapki dukaan setup karte hain!`
            : `मैंने आपकी दुकान का लाइव सेटअप विज़ार्ड शुरू कर दिया है। चलिए मिलकर आपका स्टोर कॉन्फ़िगर करते हैं!`;
          botActionData = { type: 'action_confirmed', badge: 'AI Store Setup Launched' };
        }

                // 1. Sales & Revenue Live Automation
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

        // 2. Clear POS Cart
        else if (lower.includes('clear cart') || lower.includes('empty cart') || lower.includes('reset cart') || lower.includes('delete cart') || lower.includes('cart khali')) {
          sessionStorage.setItem('pending_ai_pos_action', JSON.stringify({ clear: true, timestamp: Date.now() }));
          navigate('/pos');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('karobaar_ai_pos_action', { detail: { clear: true } }));
          }, 300);
          botResponse = `Cleared your active POS cart. Billing register is ready for new items.`;
          botActionData = { type: 'action_confirmed', badge: 'Cart Cleared' };
        }

        // 3. Hold POS Order
        else if (lower.includes('hold order') || lower.includes('park order') || lower.includes('hold bill') || lower.includes('park bill')) {
          sessionStorage.setItem('pending_ai_pos_action', JSON.stringify({ hold: true, timestamp: Date.now() }));
          navigate('/pos');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('karobaar_ai_pos_action', { detail: { hold: true } }));
          }, 300);
          botResponse = `Placed the active order on Hold. You can resume it anytime from Held Orders [F4].`;
          botActionData = { type: 'action_confirmed', badge: 'Order Held / Parked' };
        }

        // 4. POS Payment Method Switch
        else if (lower.includes('pay with upi') || lower.includes('upi payment') || lower.includes('pay by upi') || lower.includes('gpay payment') || lower.includes('upi mode')) {
          sessionStorage.setItem('pending_ai_pos_action', JSON.stringify({ paymentMethod: 'UPI', timestamp: Date.now() }));
          navigate('/pos');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('karobaar_ai_pos_action', { detail: { paymentMethod: 'UPI' } }));
          }, 300);
          botResponse = `Payment method switched to **UPI QR Code**. Customers can scan dynamic QR or your shop standee.`;
          botActionData = { type: 'action_confirmed', badge: 'UPI Mode Selected' };
        }
        else if (lower.includes('pay with cash') || lower.includes('cash payment') || lower.includes('pay by cash') || lower.includes('cash mode')) {
          sessionStorage.setItem('pending_ai_pos_action', JSON.stringify({ paymentMethod: 'Cash', timestamp: Date.now() }));
          navigate('/pos');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('karobaar_ai_pos_action', { detail: { paymentMethod: 'Cash' } }));
          }, 300);
          botResponse = `Payment method switched to **Cash**. Tendered cash counter and quick change calculator ready.`;
          botActionData = { type: 'action_confirmed', badge: 'Cash Mode Selected' };
        }

        // 5. Apply Discount to POS
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

        // 6. Live POS Product Addition (e.g. "Add 2 Burger", "Sell Cold Coffee", "Chai daal do")
        else if (lower.includes('add') || lower.includes('sell') || lower.includes('becho') || lower.includes('daal') || lower.includes('dal') || lower.includes('order') || lower.includes('cart')) {
          const products = await db.getCollection('products', businessId);
          let targetProduct = null;
          let targetQty = 1;

          // Extract quantity if present
          const qtyMatch = lower.match(/\b(\d+)\s*(?:pcs|plates|unit|units)?\b/);
          if (qtyMatch) {
            const parsed = parseInt(qtyMatch[1], 10);
            if (!isNaN(parsed) && parsed > 0 && parsed <= 100) targetQty = parsed;
          }

          // Match product name
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
            const isHindi = aiLanguage === 'hi';
            
            botResponse = isHinglish
              ? `Added **${targetQty}x ${targetProduct.name}** (₹${totalCost.toFixed(2)}) directly aapke POS cart me! Billing counter open ho gaya hai.`
              : isHindi
              ? `जी, **${targetQty}x ${targetProduct.name}** (₹${totalCost.toFixed(2)}) आपके बिल में जोड़ दिया गया है।`
              : `Added **${targetQty}x ${targetProduct.name}** (₹${totalCost.toFixed(2)}) directly to your POS cart! Opening billing counter.`;

            botActionData = {
              type: 'action_confirmed',
              badge: `Added ${targetQty}x ${targetProduct.name} (₹${totalCost.toFixed(2)})`
            };
          } else if (lower.startsWith('add') || lower.startsWith('sell') || lower.includes('to cart') || lower.includes('to bill')) {
            botResponse = `I looked for that product in your inventory, but couldn't find a close match. Please verify the name in your Products catalog or add it first.`;
          } else {
            // Default POS open
            navigate('/pos');
            botResponse = `Opening the **POS Terminal / New Sale** register [F2]! Barcode scanner mode, category filters, and touch grid are ready for billing.`;
            botActionData = { type: 'action_confirmed', badge: 'POS Terminal Launched' };
          }
        }

        // 2. Low Stock & Inventory Live Audit
        else if (lower.includes('stock') || lower.includes('inventory') || lower.includes('maal') || (lower.includes('product') && lower.includes('low'))) {
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

        // 3. Theme Toggle Live App Control
        else if (lower.includes('dark') || lower.includes('light') || lower.includes('theme') || (lower.includes('mode') && (lower.includes('change') || lower.includes('toggle') || lower.includes('switch') || lower.includes('kardo') || lower.includes('badlo') || lower.includes('lagao')))) {
          toggleTheme();
          const newTheme = theme === 'light' ? 'Dark' : 'Light';
          const isHindiQuery = /(badlo|lagao|kardo|rang|mod)/i.test(lower);
          botResponse = isHindiQuery
            ? `थीम को **${newTheme === 'Dark' ? 'डार्क' : 'लाइट'} मोड** में बदल दिया गया है! ब्लैक एंड व्हाइट स्टाइलिंग तुरंत अपडेट हो चुकी है।`
            : `Switched theme to **${newTheme} Mode**! The monochrome high-contrast styling has been updated across the entire workspace.`;
          botActionData = {
            type: 'action_confirmed',
            badge: `${newTheme} Theme Activated`
          };
        }

        // 4. Operating Mode Live App Control (Legacy vs Premium)
        else if (lower.includes('legacy') || lower.includes('operations desk') || lower.includes('fast mode')) {
          setAppUiVersion('legacy');
          navigate('/dashboard');
          botResponse = `Reconfigured workspace to **Legacy Operations Desk**! Navigating to your responsive 4-column action dashboard now.`;
          botActionData = {
            type: 'action_confirmed',
            badge: 'Legacy Desk Activated'
          };
        }
        else if (lower.includes('premium') || lower.includes('command center')) {
          setAppUiVersion('premium');
          navigate('/dashboard');
          botResponse = `Reconfigured workspace to **Premium Command Center**! Executive metrics, live radar health, and dual charts are active.`;
          botActionData = {
            type: 'action_confirmed',
            badge: 'Premium Center Activated'
          };
        }

        // 5. Direct POS Navigation & POS Item Automation
        else if (lower.includes('pos') || lower.includes('bill') || lower.includes('new sale') || lower.includes('register') || lower.includes('counter')) {
          navigate('/pos');
          botResponse = `Opening the **POS Terminal / New Sale** register [F2]! Barcode scanner mode, category filters, and touch grid are ready for billing.`;
          botActionData = {
            type: 'action_confirmed',
            badge: 'POS Terminal Launched'
          };
        }

        // 6. Customers & Khata Udhaar Live Audit
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

        // 7. General Navigation
        else if (lower.includes('setting') || lower.includes('config') || lower.includes('backup') || lower.includes('password')) {
          navigate('/settings');
          botResponse = `Navigating to **Settings & Workspace** where you can configure Business Profile, Preferences, Features & Modules, and Customize AI rules.`;
        }
        else if (lower.includes('expense') || lower.includes('kharcha')) {
          navigate('/expenses');
          botResponse = `Opening **Expenses & Petty Cash** tracker. You can log vendor bills, utilities, and daily business spend here.`;
        }
        else if (lower.includes('report') || lower.includes('analytics')) {
          navigate('/reports');
          botResponse = `Opening **Reports & Business Analytics** where you can view sales graphs, category breakdowns, and GST tax sheets.`;
        }

        // 8. General AI Consulting & Capabilities
        else {
          botResponse = `I am listening: "${query}".\n\nI can operate your business live: speak to me to check today's sales, audit low stock, toggle dark mode, switch between Legacy and Premium dashboards, launch POS billing, or look up customer dues.\n\nTap the microphone or choose a quick command below!`;
        }
      } catch (err) {
        console.error('AI Processing Error:', err);
        botResponse = `I encountered an issue processing that live command. Please verify your connection or try a direct command like "Show today's sales" or "Check stock".`;
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
          { label: '⚡ Legacy Mode', query: 'Switch to legacy operations desk' }
        ]
      };

      setMessages(prev => [...prev, newBotMsg]);
      // Speak response out loud in voice mode
      speakText(botResponse);
    }, 400);
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
    ? latestBotMsg.text.replace(/[*#_`]/g, '').trim().slice(0, 130) + (latestBotMsg.text.replace(/[*#_`]/g, '').trim().length > 130 ? '...' : '')
    : '';

  return (
    <>
      {/* Floating Realtime AI Trigger Button (Strictly Monochrome) */}
      {aiSettings.showFloatingBubble && !isOpen && (
        <button 
          className="customize-ai-floating-trigger"
          onClick={() => setIsOpen(true)}
          title="Open Customize Voice AI Assistant"
        >
          <div className="customize-trigger-orb" />
          <Sparkles size={16} className="customize-sparkle-icon" />
          <span className="customize-trigger-text">{assistantName} AI</span>
        </button>
      )}

      {/* Main Realtime Voice AI Window / Overlay */}
      {isOpen && (
        <div className={`customize-ai-drawer-overlay ${voiceModeActive ? 'bottom-popup-mode' : ''}`} onClick={() => { stopSpeaking(); setIsOpen(false); }}>
          <div 
            className={`customize-ai-panel ${voiceModeActive ? 'jarvis-bottom-popup' : ''}`} 
            onClick={e => e.stopPropagation()}
          >
            {/* VIEW 1: Voice Mode (Sleek Minimalist Liquid Orb Popup) */}
            {voiceModeActive ? (
              <div className="jarvis-liquid-popup-content">
                {/* Sleek Minimalist Voice Header */}
                <div className="jarvis-voice-header">
                  <div className="jarvis-header-brand">
                    <div className={`jarvis-status-orb ${isListening ? 'listening' : isSpeaking ? 'speaking' : ''}`} />
                    <span className="jarvis-header-name">{assistantName}</span>
                    <span className="jarvis-header-sub">Voice AI</span>
                  </div>

                  <div className="jarvis-header-actions">
                    {/* Clean Language Selector */}
                    <button 
                      type="button" 
                      className="jarvis-lang-pill"
                      onClick={() => {
                        const next = aiLanguage === 'hinglish' ? 'en' : aiLanguage === 'en' ? 'hi' : 'hinglish';
                        setAiLanguage(next);
                        localStorage.setItem('karobaar_ai_language', next);
                      }}
                      title="Toggle Language: Hinglish / EN / हिंदी"
                    >
                      <Globe size={12} />
                      <span>{aiLanguage === 'hinglish' ? 'Hinglish' : aiLanguage === 'hi' ? 'हिंदी' : 'EN'}</span>
                    </button>

                    {/* Close Button */}
                    <button 
                      type="button"
                      onClick={() => { stopSpeaking(); setIsOpen(false); }} 
                      className="jarvis-close-btn"
                      title={`Close ${assistantName}`}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Drag handle */}
                <div className="jarvis-bottom-drag-bar" />

                {/* Centered Round Liquid Voice Sphere */}
                <div className="jarvis-liquid-sphere-wrapper">
                  <div 
                    className={`jarvis-liquid-sphere ${isListening ? 'listening' : isSpeaking ? 'speaking' : 'idle'}`}
                    onClick={() => {
                      if (isSpeaking) {
                        stopSpeaking();
                        try { recognitionRef.current?.start(); } catch (e) {}
                      } else {
                        toggleVoiceInput();
                      }
                    }}
                    title={isSpeaking ? "Tap orb to interrupt" : isListening ? "Listening... Tap to pause" : `Tap to speak to ${assistantName}`}
                  >
                    {/* Concentric soundwave shockwave rings */}
                    <div className="liquid-audio-ring ring-1" />
                    <div className="liquid-audio-ring ring-2" />
                    <div className="liquid-audio-ring ring-3" />

                    {/* Liquid chamber with dynamic wave layers */}
                    <div className="liquid-chamber">
                      <div className="liquid-wave-layer wave-deep" />
                      <div className="liquid-wave-layer wave-mid" />
                      <div className="liquid-wave-layer wave-surface" />
                      
                      {/* Fluid rising micro-bubbles */}
                      <div className="liquid-bubble b1" />
                      <div className="liquid-bubble b2" />
                      <div className="liquid-bubble b3" />
                      <div className="liquid-bubble b4" />
                    </div>

                    {/* Glowing Center AI Arc Reactor Glyph */}
                    <div className="liquid-core-glyph">
                      <Sparkles size={18} className="liquid-core-sparkle" />
                    </div>
                  </div>
                </div>

                {/* Real-time Subtitle & Status (Clean borderless cinema typography, NO BOX BORDER) */}
                <div className="jarvis-voice-info-block">
                  <div className="jarvis-status-headline">
                    {isListening ? (
                      <span className="status-listening-badge"><span className="status-pulse-dot" /> Listening to your voice...</span>
                    ) : isSpeaking ? (
                      <span className="status-speaking-badge"><span className="status-pulse-dot" /> {assistantName} speaking (Tap orb to interrupt)</span>
                    ) : (
                      <span className="status-idle-badge"><span className="status-pulse-dot" /> {assistantName} ready • Full app control</span>
                    )}
                  </div>

                  <div className="jarvis-subtitle-clean">
                    <p className="jarvis-subtitle-text">
                      {interimTranscript ? `“${interimTranscript}”` : latestBotText ? latestBotText : `Say "Hey ${assistantName}" or tap the mic below`}
                    </p>
                  </div>
                </div>

                {/* 1-Tap Quick Action Commands (Centered flex-wrap cluster, NO SCROLLBAR) */}
                <div className="jarvis-fast-commands-cluster">
                  <button type="button" onClick={() => handleUserQuery('Show today sales summary')} className="jarvis-fast-chip">
                    <TrendingUp size={12} />
                    <span>Today's Sales</span>
                  </button>
                  <button type="button" onClick={() => handleUserQuery('Add 2 Burger to cart')} className="jarvis-fast-chip">
                    <ShoppingCart size={12} />
                    <span>Bill 2 Burger</span>
                  </button>
                  <button type="button" onClick={() => handleUserQuery('Which items are low in stock?')} className="jarvis-fast-chip">
                    <AlertTriangle size={12} />
                    <span>Low Stock</span>
                  </button>
                  <button type="button" onClick={() => handleUserQuery('Toggle dark mode')} className="jarvis-fast-chip">
                    <Moon size={12} />
                    <span>Dark Mode</span>
                  </button>
                </div>

                {/* Bottom Voice Controls Bar */}
                <div className="jarvis-bottom-controls-bar">
                  <button 
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`jarvis-mic-main-btn ${isListening ? 'listening' : ''}`}
                    title={isListening ? 'Stop listening' : 'Start speaking'}
                  >
                    {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setVoiceModeActive(false)}
                    className="jarvis-switch-mode-btn"
                    title="Switch to detailed text chat and action cards view"
                  >
                    <Bot size={13} />
                    <span>Switch to Chat History</span>
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW 2: Chat Stream Feed Mode */
              <>
                <div className="customize-ai-header">
                  <div className="customize-ai-header-left">
                    <div className={`customize-ai-avatar ${isSpeaking ? 'speaking-pulse' : ''}`}>
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <div className="customize-ai-title-row">
                        <h3 className="customize-ai-title">{assistantName}</h3>
                        <span className="customize-ai-badge">Voice AI</span>
                      </div>
                      <p className="customize-ai-status">
                        {isListening ? (
                          <span className="status-listening">● Listening to your voice...</span>
                        ) : isSpeaking ? (
                          <span className="status-speaking">● Speaking response...</span>
                        ) : (
                          '● Realtime • Ready to operate'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Header Actions for Chat view */}
                  <div className="customize-ai-header-actions">
                    <button 
                      type="button" 
                      className="customize-ai-icon-btn"
                      onClick={() => {
                        const next = aiLanguage === 'hinglish' ? 'en' : aiLanguage === 'en' ? 'hi' : 'hinglish';
                        setAiLanguage(next);
                        localStorage.setItem('karobaar_ai_language', next);
                      }}
                      style={{ width: 'auto', padding: '0 8px', fontSize: '11px', fontWeight: 700, gap: '4px' }}
                      title="Toggle Language: Hinglish / English / Hindi"
                    >
                      <Globe size={13} />
                      <span>{aiLanguage === 'hinglish' ? 'Hinglish' : aiLanguage === 'hi' ? 'हिंदी' : 'EN'}</span>
                    </button>

                    <button 
                      onClick={() => setVoiceModeActive(true)}
                      className="customize-ai-icon-btn"
                      title="Switch to Voice Orb View"
                    >
                      <Radio size={15} />
                    </button>

                    <button 
                      onClick={() => {
                        if (voiceSpeechEnabled) stopSpeaking();
                        setVoiceSpeechEnabled(!voiceSpeechEnabled);
                      }}
                      className={`customize-ai-icon-btn ${!voiceSpeechEnabled ? 'muted' : ''}`}
                      title={voiceSpeechEnabled ? 'Mute AI voice output' : 'Enable AI voice output'}
                    >
                      {voiceSpeechEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    </button>

                    <button 
                      onClick={handleClearHistory} 
                      className="customize-ai-icon-btn"
                      title="Clear conversation"
                    >
                      <Trash2 size={15} />
                    </button>

                    <button 
                      onClick={() => { stopSpeaking(); setIsOpen(false); }} 
                      className="customize-ai-icon-btn"
                      title="Close AI window"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>
                <div className="customize-ai-messages custom-scrollbar">
                  {messages.map(msg => (
                    <div key={msg.id} className={`customize-ai-message-row ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                      {msg.sender === 'bot' && (
                        <div className="customize-ai-bot-icon">
                          <Bot size={14} />
                        </div>
                      )}

                      <div className="customize-ai-bubble-wrap">
                        <div className={`customize-ai-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                          <div className="customize-ai-bubble-text">
                            {msg.text.split('\n').map((line, idx) => (
                              <p key={idx} style={{ margin: '0 0 4px 0' }}>
                                {line.startsWith('• ') ? (
                                  <span style={{ display: 'inline-block', marginLeft: '6px' }}>{line}</span>
                                ) : line}
                              </p>
                            ))}
                          </div>

                          {/* Re-play voice speech button for bot message */}
                          {msg.sender === 'bot' && (
                            <div className="customize-bubble-actions">
                              <button 
                                onClick={() => speakText(msg.text)} 
                                className="customize-speech-replay-btn"
                                title="Listen to this response out loud"
                              >
                                <Volume2 size={12} />
                                <span>Speak</span>
                              </button>
                            </div>
                          )}

                          {/* Interactive Action Card */}
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
                                    setIsOpen(false);
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

                        {/* Quick Suggestion Chips */}
                        {msg.quickActions && (
                          <div className="customize-ai-chips-wrap">
                            {msg.quickActions.map((qa, i) => (
                              <button 
                                key={i} 
                                className="customize-ai-chip"
                                onClick={() => handleUserQuery(qa.query)}
                              >
                                {qa.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="customize-ai-message-row bot">
                      <div className="customize-ai-bot-icon">
                        <Bot size={14} />
                      </div>
                      <div className="customize-ai-bubble bot-bubble">
                        <div className="customize-ai-typing-indicator">
                          <span></span><span></span><span></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Voice Listening Banner when user is speaking */}
                {isListening && (
                  <div className="customize-live-listening-bar">
                    <div className="listening-pulse-dot" />
                    <span className="listening-text">
                      {interimTranscript ? `"${interimTranscript}"` : 'Listening... speak your command now'}
                    </span>
                    <button onClick={toggleVoiceInput} className="listening-stop-btn">Stop</button>
                  </div>
                )}

                {/* Input Bar with Real-time Voice Button */}
                <div className="customize-ai-input-bar">
                  <button 
                    type="button" 
                    onClick={toggleVoiceInput}
                    className={`customize-ai-mic-btn ${isListening ? 'active' : ''}`}
                    title={isListening ? 'Stop listening' : 'Speak command with voice'}
                  >
                    <Mic size={16} />
                  </button>

                  <input 
                    type="text"
                    placeholder="Ask or speak to operate app live..."
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="customize-ai-input"
                    autoFocus
                  />

                  <button 
                    type="button" 
                    onClick={() => handleUserQuery()}
                    disabled={!inputMessage.trim() || isTyping}
                    className="customize-ai-send-btn"
                    title="Send instruction"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
