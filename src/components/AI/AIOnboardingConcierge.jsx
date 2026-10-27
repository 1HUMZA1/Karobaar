import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Bot, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Store, 
  User, 
  CreditCard, 
  PackageCheck, 
  LayoutDashboard, 
  ShoppingBag, 
  Utensils, 
  Smartphone, 
  Pill, 
  FileText, 
  X, 
  Play, 
  Sun, 
  Moon, 
  Zap,
  Globe,
  CheckCircle
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../services/databaseService';
import './AIOnboardingConcierge.css';

// Starter Product Templates by Business Category
const CATEGORY_PRODUCTS = {
  'Cafeteria & Restaurant': [
    { id: 'prod_cafe_1', name: 'Classic Burger', category: 'Food', purchasePrice: 45, sellingPrice: 80, stockQuantity: 50, minimumStock: 10, unit: 'pcs', barcode: '8901001001' },
    { id: 'prod_cafe_2', name: 'French Fries', category: 'Food', purchasePrice: 25, sellingPrice: 50, stockQuantity: 60, minimumStock: 15, unit: 'plate', barcode: '8901001002' },
    { id: 'prod_cafe_3', name: 'Cold Coffee', category: 'Drinks', purchasePrice: 35, sellingPrice: 70, stockQuantity: 40, minimumStock: 8, unit: 'glass', barcode: '8901001003' },
    { id: 'prod_cafe_4', name: 'Masala Chai', category: 'Drinks', purchasePrice: 8, sellingPrice: 20, stockQuantity: 100, minimumStock: 20, unit: 'cup', barcode: '8901001004' },
    { id: 'prod_cafe_5', name: 'Veg Grilled Sandwich', category: 'Food', purchasePrice: 30, sellingPrice: 65, stockQuantity: 35, minimumStock: 10, unit: 'pcs', barcode: '8901001005' },
    { id: 'prod_cafe_6', name: 'Chocolate Brownie', category: 'Dessert', purchasePrice: 28, sellingPrice: 55, stockQuantity: 30, minimumStock: 6, unit: 'pcs', barcode: '8901001006' }
  ],
  'Grocery & Kirana': [
    { id: 'prod_groc_1', name: 'Basmati Rice (1kg)', category: 'Grains', purchasePrice: 70, sellingPrice: 95, stockQuantity: 80, minimumStock: 15, unit: 'kg', barcode: '8902001001' },
    { id: 'prod_groc_2', name: 'Wheat Chakki Atta (5kg)', category: 'Flour', purchasePrice: 175, sellingPrice: 210, stockQuantity: 50, minimumStock: 10, unit: 'bag', barcode: '8902001002' },
    { id: 'prod_groc_3', name: 'Mustard Oil (1 Litre)', category: 'Oils', purchasePrice: 120, sellingPrice: 145, stockQuantity: 60, minimumStock: 12, unit: 'bottle', barcode: '8902001003' },
    { id: 'prod_groc_4', name: 'White Sugar (1kg)', category: 'Pantry', purchasePrice: 38, sellingPrice: 46, stockQuantity: 100, minimumStock: 20, unit: 'kg', barcode: '8902001004' },
    { id: 'prod_groc_5', name: 'Tata Iodized Salt (1kg)', category: 'Pantry', purchasePrice: 22, sellingPrice: 28, stockQuantity: 90, minimumStock: 15, unit: 'pack', barcode: '8902001005' },
    { id: 'prod_groc_6', name: 'Premium Tea Powder (250g)', category: 'Beverages', purchasePrice: 85, sellingPrice: 110, stockQuantity: 45, minimumStock: 10, unit: 'pack', barcode: '8902001006' }
  ],
  'Retail & Clothing': [
    { id: 'prod_app_1', name: 'Classic Cotton T-Shirt', category: 'Men', purchasePrice: 220, sellingPrice: 399, stockQuantity: 40, minimumStock: 8, unit: 'pcs', barcode: '8903001001' },
    { id: 'prod_app_2', name: 'Slim Fit Denim Jeans', category: 'Apparel', purchasePrice: 580, sellingPrice: 999, stockQuantity: 30, minimumStock: 6, unit: 'pcs', barcode: '8903001002' },
    { id: 'prod_app_3', name: 'Casual Cotton Shirt', category: 'Men', purchasePrice: 380, sellingPrice: 699, stockQuantity: 35, minimumStock: 7, unit: 'pcs', barcode: '8903001003' },
    { id: 'prod_app_4', name: 'Zipper Winter Jacket', category: 'Outerwear', purchasePrice: 850, sellingPrice: 1499, stockQuantity: 20, minimumStock: 5, unit: 'pcs', barcode: '8903001004' },
    { id: 'prod_app_5', name: 'Formal Stretch Trousers', category: 'Men', purchasePrice: 450, sellingPrice: 799, stockQuantity: 25, minimumStock: 5, unit: 'pcs', barcode: '8903001005' }
  ],
  'Electronics & Mobile': [
    { id: 'prod_elec_1', name: '33W Fast Charger (Type-C)', category: 'Accessories', purchasePrice: 260, sellingPrice: 499, stockQuantity: 40, minimumStock: 10, unit: 'pcs', barcode: '8904001001' },
    { id: 'prod_elec_2', name: 'Braided Type-C Fast Cable', category: 'Accessories', purchasePrice: 85, sellingPrice: 199, stockQuantity: 70, minimumStock: 15, unit: 'pcs', barcode: '8904001002' },
    { id: 'prod_elec_3', name: 'Wireless Bluetooth Earbuds', category: 'Audio', purchasePrice: 480, sellingPrice: 899, stockQuantity: 25, minimumStock: 5, unit: 'box', barcode: '8904001003' },
    { id: 'prod_elec_4', name: '9D Tempered Glass Guard', category: 'Protection', purchasePrice: 40, sellingPrice: 149, stockQuantity: 100, minimumStock: 25, unit: 'pcs', barcode: '8904001004' },
    { id: 'prod_elec_5', name: '10,000mAh Slim Power Bank', category: 'Power', purchasePrice: 580, sellingPrice: 999, stockQuantity: 20, minimumStock: 5, unit: 'pcs', barcode: '8904001005' }
  ],
  'Pharmacy & Healthcare': [
    { id: 'prod_med_1', name: 'Paracetamol 650mg (Strip of 15)', category: 'Medicine', purchasePrice: 20, sellingPrice: 32, stockQuantity: 120, minimumStock: 25, unit: 'strip', barcode: '8905001001' },
    { id: 'prod_med_2', name: 'Vitamin C Chewable (Pack of 30)', category: 'Supplements', purchasePrice: 35, sellingPrice: 55, stockQuantity: 60, minimumStock: 15, unit: 'pack', barcode: '8905001002' },
    { id: 'prod_med_3', name: 'Waterproof Bandage Strips (Box)', category: 'First Aid', purchasePrice: 25, sellingPrice: 40, stockQuantity: 50, minimumStock: 10, unit: 'box', barcode: '8905001003' },
    { id: 'prod_med_4', name: 'Digital Clinical Thermometer', category: 'Devices', purchasePrice: 140, sellingPrice: 220, stockQuantity: 30, minimumStock: 6, unit: 'pcs', barcode: '8905001004' },
    { id: 'prod_med_5', name: 'Herbal Cough Relief Syrup (100ml)', category: 'OTC', purchasePrice: 52, sellingPrice: 85, stockQuantity: 45, minimumStock: 10, unit: 'bottle', barcode: '8905001005' }
  ],
  'General Store & Services': [
    { id: 'prod_gen_1', name: 'Spiral Ruled Notebook A4', category: 'Stationery', purchasePrice: 38, sellingPrice: 65, stockQuantity: 60, minimumStock: 12, unit: 'pcs', barcode: '8906001001' },
    { id: 'prod_gen_2', name: 'Ballpoint Pens Blue (Pack of 5)', category: 'Stationery', purchasePrice: 30, sellingPrice: 50, stockQuantity: 70, minimumStock: 15, unit: 'pack', barcode: '8906001002' },
    { id: 'prod_gen_3', name: 'A4 Copier Paper (500 Sheets)', category: 'Paper', purchasePrice: 210, sellingPrice: 280, stockQuantity: 40, minimumStock: 8, unit: 'ream', barcode: '8906001003' },
    { id: 'prod_gen_4', name: 'Document Clear Folder File', category: 'Office', purchasePrice: 14, sellingPrice: 25, stockQuantity: 80, minimumStock: 15, unit: 'pcs', barcode: '8906001004' },
    { id: 'prod_gen_5', name: 'Permanent Marker Pen (Black)', category: 'Stationery', purchasePrice: 18, sellingPrice: 30, stockQuantity: 65, minimumStock: 10, unit: 'pcs', barcode: '8906001005' }
  ]
};

export const AIOnboardingConcierge = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    currentBusiness, 
    setCurrentBusiness, 
    setUserBusinesses,
    theme, 
    setTheme, 
    appUiVersion, 
    setAppUiVersion 
  } = useAppContext();

  // Wizard active visibility
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Owner, 2: Business, 3: Category, 4: Payments/UPI, 5: Theme, 6: AI Executing, 7: Live Tour
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [languagePreference, setLanguagePreference] = useState('hi'); // 'hi' (Hindi/Hinglish) | 'en' (English)

  // Form states collected step-by-step
  const [ownerName, setOwnerName] = useState(() => currentUser?.name || 'Shop Owner');
  const [phone, setPhone] = useState(() => currentUser?.phone || '+91 98765 00000');
  const [businessName, setBusinessName] = useState(() => currentBusiness?.name || 'My Store');
  const [tagline, setTagline] = useState('The Complete Business OS');
  const [category, setCategory] = useState('Cafeteria & Restaurant');
  const [currency, setCurrency] = useState('INR');
  const [upiId, setUpiId] = useState(() => localStorage.getItem('karobaar_pos_upi_id') || 'merchant@okaxis');
  const [selectedTheme, setSelectedTheme] = useState(() => theme || 'light');
  const [selectedUiVersion, setSelectedUiVersion] = useState(() => appUiVersion || 'v2');

  // AI execution animation states
  const [executionPhase, setExecutionPhase] = useState(0);
  const [tourSlide, setTourSlide] = useState(0);

  const recognitionRef = useRef(null);

  // Check on mount if onboarding is required
  useEffect(() => {
    const userEmail = currentUser?.email || 'default';
    const hasCompletedOnboarding = localStorage.getItem(`karobaar_onboarding_completed_${userEmail}`) === 'true';
    const isTriggered = sessionStorage.getItem('karobaar_trigger_ai_onboarding') === 'true';

    if (isTriggered || (!hasCompletedOnboarding && currentUser)) {
      setIsOpen(true);
      sessionStorage.removeItem('karobaar_trigger_ai_onboarding');
    }

    const handleCustomTrigger = () => {
      setStep(1);
      setIsOpen(true);
    };

    window.addEventListener('karobaar_start_ai_onboarding', handleCustomTrigger);
    return () => window.removeEventListener('karobaar_start_ai_onboarding', handleCustomTrigger);
  }, [currentUser]);

  // Speech Recognition initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = languagePreference === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        setInterimTranscript(text);
        if (e.results[0].isFinal) {
          applyVoiceInputToCurrentStep(text);
          setInterimTranscript('');
          setIsListening(false);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [languagePreference, step]);

  // AI Speech output helper
  const speakAI = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const clean = text.replace(/[*#_`]/g, '').replace(/₹/g, 'Rupees ').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (languagePreference === 'hi' || /[\u0900-\u097F]/.test(clean)) {
      const hiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('madhur'));
      if (hiVoice) utterance.voice = hiVoice;
      utterance.lang = 'hi-IN';
    } else {
      const enVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('neerja'));
      if (enVoice) utterance.voice = enVoice;
      utterance.lang = 'en-IN';
    }

    window.speechSynthesis.speak(utterance);
  };

  // Speak AI prompt whenever step changes
  useEffect(() => {
    if (!isOpen) return;

    if (step === 1) {
      const greeting = languagePreference === 'hi' 
        ? "नमस्ते! करोबार में आपका स्वागत है। मैं कस्टमाइज़ AI हूँ। चलिए आपकी दुकान का पूरा सेटअप स्टेप-बाय-स्टेप करते हैं। कृपया अपना नाम और फ़ोन नंबर बताएँ।"
        : "Welcome to Karobaar! I am Customize AI, your business assistant. Let's set up your store step-by-step. What is your full name and contact number?";
      speakAI(greeting);
    } else if (step === 2) {
      const prompt = languagePreference === 'hi'
        ? "बहुत बढ़िया! अब अपनी दुकान या बिज़नेस का नाम बताएँ या नीचे से सेलेक्ट करें।"
        : "Great! What is the name of your shop or business?";
      speakAI(prompt);
    } else if (step === 3) {
      const prompt = languagePreference === 'hi'
        ? "आपकी दुकान किस तरह की है? जैसे कैफेटेरिया, किराना स्टोर, या कपड़े की दुकान? मैं आपके लिए रेडी-टू-सेल माल तुरंत लोड कर दूँगा।"
        : "What type of business do you run? Select your category, and I will preload ready-to-sell products with prices for you.";
      speakAI(prompt);
    } else if (step === 4) {
      const prompt = languagePreference === 'hi'
        ? "QR कोड से पेमेंट्स लेने के लिए अपनी UPI ID डालें, जैसे नाम @ ओकेएक्सिस, और अपनी करंसी चुनें।"
        : "Enter your UPI ID for QR code payments, and choose your business currency.";
      speakAI(prompt);
    } else if (step === 5) {
      const prompt = languagePreference === 'hi'
        ? "अपनी पसंद की ब्लैक एंड व्हाइट थीम और डैशबोर्ड स्टाइल चुनें।"
        : "Choose your monochrome theme and dashboard operating style.";
      speakAI(prompt);
    }
  }, [step, isOpen, languagePreference]);

  // Voice Input Handler for the active step
  const applyVoiceInputToCurrentStep = (spokenText) => {
    const clean = spokenText.trim();
    if (!clean) return;

    if (step === 1) {
      setOwnerName(clean);
      speakAI(`Got it, ${clean}!`);
    } else if (step === 2) {
      setBusinessName(clean);
      speakAI(`Store name set to ${clean}!`);
    } else if (step === 3) {
      const lower = clean.toLowerCase();
      if (lower.includes('cafe') || lower.includes('restaurant') || lower.includes('food') || lower.includes('khana')) {
        setCategory('Cafeteria & Restaurant');
      } else if (lower.includes('kirana') || lower.includes('grocery') || lower.includes('ration')) {
        setCategory('Grocery & Kirana');
      } else if (lower.includes('cloth') || lower.includes('fashion') || lower.includes('kapde') || lower.includes('retail')) {
        setCategory('Retail & Clothing');
      } else if (lower.includes('mobile') || lower.includes('electric') || lower.includes('tech')) {
        setCategory('Electronics & Mobile');
      } else if (lower.includes('medicine') || lower.includes('pharma') || lower.includes('dawa')) {
        setCategory('Pharmacy & Healthcare');
      } else {
        setCategory('General Store & Services');
      }
    } else if (step === 4) {
      if (clean.includes('@')) {
        setUpiId(clean.replace(/\s+/g, ''));
      }
    }
  };

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is supported in Chrome & Edge browsers.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Autonomous Execution: AI handles 100% of the setup
  const executeAutonomousAiSetup = async () => {
    setStep(6); // Step 6 is AI Execution screen
    setExecutionPhase(1);

    const businessId = `biz_${Date.now()}`;
    const userId = currentUser?.id || `user_${Date.now()}`;

    try {
      // Phase 1: Business Profile
      speakAI(languagePreference === 'hi' ? "आपका बिज़नेस प्रोफाइल तैयार किया जा रहा है..." : "Configuring your business profile...");
      await new Promise(r => setTimeout(r, 700));
      setExecutionPhase(2);

      const newBizDoc = {
        id: businessId,
        name: businessName.toUpperCase().trim() || 'MY STORE',
        tagline: tagline.trim(),
        currency: currency,
        category: category,
        address: 'Main Market, City Center',
        phone: phone,
        settings: {
          currency: currency,
          theme: selectedTheme,
          appUiVersion: selectedUiVersion,
          upiId: upiId.trim(),
          taxRate: 5
        },
        modules: {
          pos: true,
          inventory: true,
          orders: true,
          customers: true,
          expenses: true,
          suppliers: true,
          reports: true,
          employees: true,
          invoices: true
        }
      };

      // Save to Database
      await db.save('businesses', businessId, newBizDoc);

      // Phase 2: User profile & permissions
      setExecutionPhase(3);
      speakAI(languagePreference === 'hi' ? "मालिक के अधिकार रजिस्टर हो रहे हैं..." : "Registering owner permissions...");
      await new Promise(r => setTimeout(r, 650));

      const updatedUser = {
        ...currentUser,
        id: userId,
        name: ownerName,
        phone: phone,
        role: 'Owner',
        activeBusinessId: businessId,
        memberships: [businessId],
        onboardingCompleted: true
      };
      await db.save('users', userId, updatedUser);

      // Phase 3: Preload starter catalog products
      setExecutionPhase(4);
      speakAI(languagePreference === 'hi' ? "आपकी दुकान के लिए माल और बारकोड लोड हो रहे हैं..." : "Injecting category catalog products...");
      await new Promise(r => setTimeout(r, 700));

      const starterProducts = CATEGORY_PRODUCTS[category] || CATEGORY_PRODUCTS['Cafeteria & Restaurant'];
      await db.saveCollection('products', starterProducts, businessId);

      // Phase 4: Configure UPI and theme
      setExecutionPhase(5);
      speakAI(languagePreference === 'hi' ? "UPI QR कोड और थीम अप्लाई हो रही है..." : "Configuring UPI payment gateway & monochrome theme...");
      await new Promise(r => setTimeout(r, 600));

      localStorage.setItem('karobaar_pos_upi_id', upiId.trim());
      localStorage.setItem('karobaar-theme', selectedTheme);
      localStorage.setItem('karobaar-ui-version', selectedUiVersion);
      localStorage.setItem('karobaar-active-business', businessId);
      localStorage.setItem('karobaar_session_user', JSON.stringify(updatedUser));
      localStorage.setItem('karobaar_session_business', JSON.stringify(newBizDoc));
      localStorage.setItem('karobaar_session_businesses', JSON.stringify([newBizDoc]));

      const userEmail = currentUser?.email || 'default';
      localStorage.setItem(`karobaar_onboarding_completed_${userEmail}`, 'true');

      // Update React context
      setCurrentUser(updatedUser);
      setCurrentBusiness(newBizDoc);
      setUserBusinesses([newBizDoc]);
      setTheme(selectedTheme);
      setAppUiVersion(selectedUiVersion);

      // Finish & Move to Tour
      setExecutionPhase(6);
      await new Promise(r => setTimeout(r, 500));
      setStep(7); // Step 7 is Interactive Live Tour
      const tourPrompt = languagePreference === 'hi'
        ? `मुबारक हो! आपकी दुकान ${businessName} पूरी तरह लाइव है। चलिए 3 मुख्य फीचर्स देख लेते हैं।`
        : `Congratulations! Your store ${businessName} is fully configured and live! Here are the 3 key features to run your business today.`;
      speakAI(tourPrompt);
    } catch (err) {
      console.error('AI setup execution error:', err);
      alert('Setup completed with local fallback.');
      setStep(7);
    }
  };

  const handleFinishOnboarding = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-onboarding-overlay">
      <div className="ai-onboarding-modal">
        {/* Header Bar */}
        <div className="ai-onboarding-header">
          <div className="ai-onboarding-brand">
            <div className="ai-concierge-orb" />
            <Sparkles size={18} className="ai-concierge-sparkle" />
            <div>
              <div className="ai-concierge-title-row">
                <span className="ai-concierge-name">Customize AI</span>
                <span className="ai-concierge-badge">Live Store Concierge</span>
              </div>
              <p className="ai-concierge-sub">Autonomous Business Setup & Instruction Engine</p>
            </div>
          </div>

          <div className="ai-onboarding-header-actions">
            {/* Language toggle: Hindi / English */}
            <button 
              type="button" 
              className="ai-lang-pill-btn"
              onClick={() => {
                const nextLang = languagePreference === 'hi' ? 'en' : 'hi';
                setLanguagePreference(nextLang);
              }}
              title="Change spoken language"
            >
              <Globe size={13} />
              <span>{languagePreference === 'hi' ? 'हिंदी (Hindi)' : 'English'}</span>
            </button>

            {/* Mute toggle */}
            <button 
              type="button"
              className={`ai-header-btn ${!voiceEnabled ? 'muted' : ''}`}
              onClick={() => {
                if (voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
                setVoiceEnabled(!voiceEnabled);
              }}
              title={voiceEnabled ? 'Mute AI voice' : 'Enable AI voice'}
            >
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Quick Skip / Dismiss */}
            <button 
              type="button"
              className="ai-header-btn"
              onClick={handleFinishOnboarding}
              title="Skip setup and use demo store"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Step Indicator Progress Bar */}
        {step <= 5 && (
          <div className="ai-steps-progressbar">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`ai-step-segment ${s <= step ? 'completed' : ''} ${s === step ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        {/* Live Listening Banner */}
        {isListening && (
          <div className="ai-listening-banner">
            <div className="listening-pulse-dot" />
            <span>{interimTranscript ? `"${interimTranscript}"` : 'Listening to your voice... Speak now'}</span>
            <button onClick={toggleVoiceRecording} className="ai-stop-mic-btn">Done</button>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 1: Owner Profile & Identity                             */}
        {/* ============================================================ */}
        {step === 1 && (
          <div className="ai-step-content">
            <div className="ai-prompt-callout">
              <div className="ai-speech-bubble">
                <p>
                  {languagePreference === 'hi'
                    ? "नमस्ते! करोबार में आपका स्वागत है। मैं कस्टमाइज़ AI हूँ। आपकी दुकान का पूरा सेटअप मैं खुद करूँगा। कृपया अपना नाम और फ़ोन नंबर दर्ज करें या बोलें।"
                    : "Welcome to Karobaar! I am Customize AI. I will configure your entire store for you. Please enter or speak your full name and contact number."}
                </p>
              </div>
            </div>

            <div className="ai-form-fields-grid">
              <div className="ai-field-group">
                <label>Your Full Name (मालिक का नाम)</label>
                <div className="ai-input-with-voice">
                  <input 
                    type="text" 
                    value={ownerName} 
                    onChange={e => setOwnerName(e.target.value)} 
                    placeholder="e.g. Rahul Sharma"
                    className="ai-concierge-input"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={toggleVoiceRecording} 
                    className={`ai-input-mic-btn ${isListening ? 'active' : ''}`}
                    title="Speak Name"
                  >
                    <Mic size={16} />
                  </button>
                </div>
              </div>

              <div className="ai-field-group">
                <label>Phone / WhatsApp Number (फ़ोन नंबर)</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="+91 98765 00000"
                  className="ai-concierge-input"
                />
              </div>
            </div>

            <div className="ai-step-footer">
              <button 
                type="button" 
                onClick={handleFinishOnboarding} 
                className="ai-btn-secondary"
              >
                Skip & Use Demo Store
              </button>
              <button 
                type="button" 
                onClick={() => setStep(2)} 
                disabled={!ownerName.trim()}
                className="ai-btn-primary"
              >
                <span>Continue to Business Details</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: Business & Store Name                                */}
        {/* ============================================================ */}
        {step === 2 && (
          <div className="ai-step-content">
            <div className="ai-prompt-callout">
              <div className="ai-speech-bubble">
                <p>
                  {languagePreference === 'hi'
                    ? `बहुत खूब, ${ownerName}! अब अपनी दुकान, कैफे या व्यापार का नाम बताएँ:`
                    : `Awesome, ${ownerName}! What is the name of your shop or enterprise?`}
                </p>
              </div>
            </div>

            <div className="ai-form-fields-grid">
              <div className="ai-field-group">
                <label>Business / Shop Name (दुकान का नाम)</label>
                <div className="ai-input-with-voice">
                  <input 
                    type="text" 
                    value={businessName} 
                    onChange={e => setBusinessName(e.target.value)} 
                    placeholder="e.g. Sharma Kirana Store, SAS Cafeteria"
                    className="ai-concierge-input"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={toggleVoiceRecording} 
                    className={`ai-input-mic-btn ${isListening ? 'active' : ''}`}
                    title="Speak Business Name"
                  >
                    <Mic size={16} />
                  </button>
                </div>
              </div>

              <div className="ai-field-group">
                <label>Tagline / Subtitle (स्लोगन)</label>
                <input 
                  type="text" 
                  value={tagline} 
                  onChange={e => setTagline(e.target.value)} 
                  placeholder="e.g. Best Taste, Best Quality"
                  className="ai-concierge-input"
                />
              </div>

              <div className="ai-chips-container">
                <span className="ai-chips-label">Quick Suggestions:</span>
                {['SAS Cafeteria', 'Sharma Supermarket', 'Apex Retail Hub', 'Royal Bakers', 'City Mobile World'].map((sug, i) => (
                  <button 
                    key={i} 
                    type="button" 
                    className="ai-suggestion-chip"
                    onClick={() => setBusinessName(sug)}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="ai-step-footer">
              <button type="button" onClick={() => setStep(1)} className="ai-btn-secondary">
                <ArrowLeft size={15} /> Back
              </button>
              <button 
                type="button" 
                onClick={() => setStep(3)} 
                disabled={!businessName.trim()}
                className="ai-btn-primary"
              >
                <span>Select Business Category</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: Business Category & Inventory Autoload               */}
        {/* ============================================================ */}
        {step === 3 && (
          <div className="ai-step-content">
            <div className="ai-prompt-callout">
              <div className="ai-speech-bubble">
                <p>
                  {languagePreference === 'hi'
                    ? "आपकी दुकान किस केटेगरी में आती है? सेलेक्ट करते ही AI आपके लिए तैयार माल, बारकोड और कीमतें अपने आप लोड कर देगा।"
                    : "What is your industry? Customize AI will automatically generate ready-to-sell inventory with barcodes and prices for this category."}
                </p>
              </div>
            </div>

            <div className="ai-categories-grid">
              {[
                { name: 'Cafeteria & Restaurant', icon: Utensils, desc: 'Burgers, Cold Coffee, Tea, Sandwiches, Brownies' },
                { name: 'Grocery & Kirana', icon: ShoppingBag, desc: 'Basmati Rice, Atta, Mustard Oil, Sugar, Spices' },
                { name: 'Retail & Clothing', icon: Store, desc: 'T-Shirts, Denim Jeans, Shirts, Winter Jackets' },
                { name: 'Electronics & Mobile', icon: Smartphone, desc: 'Type-C Chargers, Cables, Earbuds, Power Banks' },
                { name: 'Pharmacy & Healthcare', icon: Pill, desc: 'Paracetamol, Vitamin C, Bandages, Digital Thermometer' },
                { name: 'General Store & Services', icon: FileText, desc: 'Notebooks, Pens, A4 Paper, Folders, Stationery' }
              ].map(cat => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.name;
                return (
                  <div 
                    key={cat.name}
                    className={`ai-category-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setCategory(cat.name);
                      speakAI(`Selected ${cat.name}!`);
                    }}
                  >
                    <div className="ai-cat-icon-wrap">
                      <IconComponent size={20} />
                    </div>
                    <div className="ai-cat-info">
                      <div className="ai-cat-title-row">
                        <h4 className="ai-cat-title">{cat.name}</h4>
                        {isSelected && <CheckCircle2 size={16} className="ai-cat-check" />}
                      </div>
                      <p className="ai-cat-desc">{cat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="ai-step-footer">
              <button type="button" onClick={() => setStep(2)} className="ai-btn-secondary">
                <ArrowLeft size={15} /> Back
              </button>
              <button 
                type="button" 
                onClick={() => setStep(4)} 
                className="ai-btn-primary"
              >
                <span>Continue to Payments & UPI</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 4: Currency, UPI ID & Payments                          */}
        {/* ============================================================ */}
        {step === 4 && (
          <div className="ai-step-content">
            <div className="ai-prompt-callout">
              <div className="ai-speech-bubble">
                <p>
                  {languagePreference === 'hi'
                    ? "दुकान में QR कोड से पैसे लेने के लिए अपनी UPI ID डालें, जैसे नाम @ ओकेएक्सिस, और अपनी बिलिंग करंसी चुनें:"
                    : "Enter your UPI ID so customers can pay via instant Google Pay / PhonePe QR code, and select your currency:"}
                </p>
              </div>
            </div>

            <div className="ai-form-fields-grid">
              <div className="ai-field-group">
                <label>Merchant UPI ID (e.g. Google Pay / PhonePe / Paytm)</label>
                <div className="ai-input-with-voice">
                  <input 
                    type="text" 
                    value={upiId} 
                    onChange={e => setUpiId(e.target.value)} 
                    placeholder="shopname@okaxis"
                    className="ai-concierge-input"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={toggleVoiceRecording} 
                    className={`ai-input-mic-btn ${isListening ? 'active' : ''}`}
                    title="Speak UPI ID"
                  >
                    <Mic size={16} />
                  </button>
                </div>
                
                {/* UPI Handle Quick Chips */}
                <div className="ai-chips-container" style={{ marginTop: '8px' }}>
                  <span className="ai-chips-label">Quick Handles:</span>
                  {['@okaxis', '@ybl', '@paytm', '@upi', '@oksbi'].map(handle => (
                    <button
                      key={handle}
                      type="button"
                      className="ai-suggestion-chip"
                      onClick={() => {
                        const base = upiId.includes('@') ? upiId.split('@')[0] : (upiId || 'shop');
                        setUpiId(`${base}${handle}`);
                      }}
                    >
                      {handle}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ai-field-group">
                <label>Store Currency (बिलिंग मुद्रा)</label>
                <select 
                  value={currency} 
                  onChange={e => setCurrency(e.target.value)}
                  className="ai-concierge-select"
                >
                  <option value="INR">₹ INR (Indian Rupee)</option>
                  <option value="USD">$ USD (US Dollar)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="GBP">£ GBP (British Pound)</option>
                  <option value="EUR">€ EUR (Euro)</option>
                </select>
              </div>
            </div>

            <div className="ai-step-footer">
              <button type="button" onClick={() => setStep(3)} className="ai-btn-secondary">
                <ArrowLeft size={15} /> Back
              </button>
              <button 
                type="button" 
                onClick={() => setStep(5)} 
                className="ai-btn-primary"
              >
                <span>Continue to Theme & Layout</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 5: Visual Theme & Operating Mode                        */}
        {/* ============================================================ */}
        {step === 5 && (
          <div className="ai-step-content">
            <div className="ai-prompt-callout">
              <div className="ai-speech-bubble">
                <p>
                  {languagePreference === 'hi'
                    ? "अपनी पसंद की थीम और स्पीड मोड चुनें। इसके बाद AI अपने आप पूरा सेटअप लाइव कर देगा।"
                    : "Choose your workspace monochrome style and dashboard layout. Then Customize AI will execute the entire setup live!"}
                </p>
              </div>
            </div>

            <div className="ai-preferences-grid">
              {/* Theme Selection */}
              <div className="ai-pref-box">
                <label className="ai-pref-label">Monochrome Theme</label>
                <div className="ai-toggle-tiles">
                  <div 
                    className={`ai-toggle-tile ${selectedTheme === 'dark' ? 'active' : ''}`}
                    onClick={() => setSelectedTheme('dark')}
                  >
                    <Moon size={20} />
                    <div className="tile-text">
                      <strong>Pure Dark Mode</strong>
                      <span>Solid black background, high-contrast white buttons</span>
                    </div>
                  </div>

                  <div 
                    className={`ai-toggle-tile ${selectedTheme === 'light' ? 'active' : ''}`}
                    onClick={() => setSelectedTheme('light')}
                  >
                    <Sun size={20} />
                    <div className="tile-text">
                      <strong>Crisp Light Mode</strong>
                      <span>Clean paper white background, sharp black buttons</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operating Layout Mode */}
              <div className="ai-pref-box">
                <label className="ai-pref-label">Operating Layout Desk</label>
                <div className="ai-toggle-tiles">
                  <div 
                    className={`ai-toggle-tile ${selectedUiVersion === 'legacy' ? 'active' : ''}`}
                    onClick={() => setSelectedUiVersion('legacy')}
                  >
                    <Zap size={20} />
                    <div className="tile-text">
                      <strong>Legacy Operations Desk</strong>
                      <span>Ultra-fast 4-column responsive operational action desk</span>
                    </div>
                  </div>

                  <div 
                    className={`ai-toggle-tile ${selectedUiVersion === 'v2' || selectedUiVersion === 'premium' ? 'active' : ''}`}
                    onClick={() => setSelectedUiVersion('v2')}
                  >
                    <LayoutDashboard size={20} />
                    <div className="tile-text">
                      <strong>Premium Command Center</strong>
                      <span>Executive financial charts, health radar, and live audit logs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ai-step-footer">
              <button type="button" onClick={() => setStep(4)} className="ai-btn-secondary">
                <ArrowLeft size={15} /> Back
              </button>
              <button 
                type="button" 
                onClick={executeAutonomousAiSetup}
                className="ai-btn-primary execute-cta"
              >
                <Sparkles size={16} />
                <span>
                  {languagePreference === 'hi' ? 'AI सेटअप शुरू करो (Execute All Live)' : 'Execute AI Autonomous Setup Live'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 6: AI Autonomous Live Execution ("वह AI करे पूरा सब कुछ") */}
        {/* ============================================================ */}
        {step === 6 && (
          <div className="ai-execution-screen">
            <div className="ai-execution-header">
              <div className="ai-execution-spinner" />
              <h3>Customize AI is configuring your store live...</h3>
              <p>Please wait while AI provisions database entities, products, and payment channels.</p>
            </div>

            <div className="ai-checklist-container">
              {[
                { phase: 2, label: 'Initializing official Business Profile in database' },
                { phase: 3, label: 'Configuring Owner credentials, role permissions, and branch' },
                { phase: 4, label: `Preloading ${category} ready-to-sell inventory catalog with barcodes` },
                { phase: 5, label: `Configuring UPI ID (${upiId}) and payment gateway tokens` },
                { phase: 6, label: `Applying ${selectedTheme.toUpperCase()} theme & ${selectedUiVersion.toUpperCase()} operations desk` }
              ].map((item, idx) => {
                const isDone = executionPhase >= item.phase;
                const isCurrent = executionPhase === item.phase - 1;
                return (
                  <div key={idx} className={`ai-checklist-row ${isDone ? 'done' : isCurrent ? 'current' : 'pending'}`}>
                    <div className="checklist-bullet">
                      {isDone ? <Check size={14} /> : isCurrent ? <div className="mini-pulse" /> : idx + 1}
                    </div>
                    <span className="checklist-text">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 7: Interactive Live Tour & Step-by-Step Instructions     */}
        {/* ============================================================ */}
        {step === 7 && (
          <div className="ai-tour-screen">
            <div className="ai-tour-celebrate">
              <div className="celebrate-badge">
                <CheckCircle size={28} />
              </div>
              <h2>
                {languagePreference === 'hi' 
                  ? `बधाई हो! आपकी दुकान ${businessName} पूरी तरह चालू हो चुकी है!` 
                  : `Congratulations! ${businessName} is 100% Live & Ready!`}
              </h2>
              <p className="celebrate-sub">
                {languagePreference === 'hi'
                  ? "AI ने आपका पूरा बिज़नेस सेटअप कर दिया है। यहाँ 3 मुख्य फीचर्स हैं जो आपको तुरंत इस्तेमाल करने चाहिए:"
                  : "Customize AI has executed your setup. Here is your quick 3-step walkthrough to start operating immediately:"}
              </p>
            </div>

            {/* 3 Guided Feature Instruction Cards */}
            <div className="ai-tour-cards-grid">
              <div className={`ai-tour-card ${tourSlide === 0 ? 'highlight' : ''}`} onClick={() => setTourSlide(0)}>
                <div className="tour-card-icon"><ShoppingBag size={22} /></div>
                <h4>1. POS Billing [F2]</h4>
                <p>Press <strong>F2</strong> anytime to jump to billing. Tap items or scan barcodes to create invoices and accept UPI in seconds.</p>
              </div>

              <div className={`ai-tour-card ${tourSlide === 1 ? 'highlight' : ''}`} onClick={() => setTourSlide(1)}>
                <div className="tour-card-icon"><Store size={22} /></div>
                <h4>2. Inventory & Low Stock</h4>
                <p>Your starter items are ready in stock. Karobaar guards inventory and alerts you before items run out.</p>
              </div>

              <div className={`ai-tour-card ${tourSlide === 2 ? 'highlight' : ''}`} onClick={() => setTourSlide(2)}>
                <div className="tour-card-icon"><Mic size={22} /></div>
                <h4>3. Hands-Free Voice AI</h4>
                <p>Just talk to <strong>Customize AI</strong>! Say <em>"Add 2 Burger to cart"</em>, <em>"Aaj ki sale kitni hai"</em>, or <em>"Toggle theme"</em>.</p>
              </div>
            </div>

            <div className="ai-step-footer" style={{ marginTop: '24px' }}>
              <button 
                type="button" 
                onClick={handleFinishOnboarding}
                className="ai-btn-primary full-cta"
              >
                <span>{languagePreference === 'hi' ? 'दुकान में प्रवेश करें (Enter My Live Store)' : 'Open My Dashboard & Start Selling'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
