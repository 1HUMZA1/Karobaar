import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Bot, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Volume2, 
  VolumeX, 
  Check, 
  Zap, 
  Target,
  Maximize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import './LiveFeatureSpotlight.css';

export const LiveFeatureSpotlight = () => {
  const navigate = useNavigate();
  const { theme } = useAppContext();

  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);

  // Settings: assistant name & language
  const [assistantName, setAssistantName] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('karobaar_customize_ai_settings') || '{}');
      return s.assistantName || 'Jarvis';
    } catch { return 'Jarvis'; }
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('karobaar_ai_language') || 'hinglish';
  });

  // Tour steps with precise selectors and multilingual instructions
  const tourSteps = [
    {
      id: 'step-wake',
      selector: '[data-tour="mr-h-btn"], .topbar-mr-h-wake-btn',
      title: `${assistantName} Dedicated Wake Button`,
      path: '/dashboard',
      content: {
        hinglish: `Ye mera dedicated Wake Button hai. Is par tap karke ya mic me "Hey ${assistantName}" bolte hi main live voice mode me hazir ho jata hoon.`,
        english: `This is my dedicated Wake Button. Tap it or say "Hey ${assistantName}" into your mic to wake me instantly in hands-free mode.`,
        hindi: `यह मेरा समर्पित वेक बटन है। इस पर टैप करके या "हे मिस्टर H" बोलकर आप मुझे कभी भी लाइव बुला सकते हैं।`
      }
    },
    {
      id: 'step-search',
      selector: '[data-tour="omni-search"], .topbar-search-wrapper',
      title: 'Universal Command Bar (Ctrl + K)',
      path: '/dashboard',
      content: {
        hinglish: 'Ye aapka Universal Omni-Search Bar hai. Keyboard par Ctrl + K dabakar aap kisi bhi tab par ja sakte hain, catalog products search kar sakte hain, ya direct AI commands chala sakte hain.',
        english: 'This is your Universal Omni-Search Bar. Press Ctrl + K to navigate anywhere, search products, or run instant AI commands.',
        hindi: 'यह आपका यूनिवर्सल कमांड बार है (Ctrl + K)। यहाँ से आप किसी भी पेज पर जा सकते हैं और सीधे उत्पाद खोज सकते हैं।'
      }
    },
    {
      id: 'step-theme',
      selector: '[data-tour="theme-toggle"], .topbar-theme-toggle-btn, .topbar-mode-badge',
      title: 'Monochrome Theme & Mode Desk',
      path: '/dashboard',
      content: {
        hinglish: 'Yahan se aap Pure Dark Mode aur Crisp Light Mode me switch kar sakte hain, aur Legacy Operations Desk ya Premium Command Center activate kar sakte hain.',
        english: 'Toggle pure high-contrast Dark and Light themes, and switch between Legacy Operations Desk and Premium Command Center.',
        hindi: 'यहाँ से आप डार्क और लाइट थीम के बीच स्विच कर सकते हैं और लेगेसी ऑपरेशन्स डेस्क एक्टिवेट कर सकते हैं।'
      }
    },
    {
      id: 'step-pos',
      selector: '[data-tour="pos-quick-cart"], .pos-cart-container, .pos-cart-panel, [data-tour="pos-btn"]',
      title: 'Ultra-Fast POS Terminal [F2]',
      path: '/pos',
      content: {
        hinglish: 'Ye aapka POS billing register hai [F2]. Yahan touch items ya barcode scanner se secondon me invoice bante hain aur QR code se payment accept hoti hai.',
        english: 'This is your POS billing terminal [F2]. Tap products or scan barcodes to create invoices and accept instant UPI payments.',
        hindi: 'यह आपका POS बिलिंग काउंटर है [F2]। यहाँ टच या बारकोड स्कैनर से सेकंडों में बिल बनाए जाते हैं।'
      }
    },
    {
      id: 'step-inventory',
      selector: '[data-tour="inventory-radar"], .low-stock-card, [data-tour="inventory-btn"]',
      title: 'Realtime Inventory Guard',
      path: '/products',
      content: {
        hinglish: 'Ye aapka Realtime Inventory Guard hai. Jaise hi koi item minimum stock limit se kam hota hai, ye aapko pehle hi warning alert de deta hai.',
        english: 'This is your Realtime Inventory Guard. Tracks your stock and warns you immediately before items run out of stock.',
        hindi: 'यह आपका इन्वेंट्री गार्ड है जो माल खत्म होने से पहले ही आपको चेतावनी देकर सतर्क करता है।'
      }
    },
    {
      id: 'step-khata',
      selector: '[data-tour="khata-dues"], .customer-dues-card, [data-tour="customers-btn"]',
      title: 'Customer Khata & Udhaar Ledger',
      path: '/customers',
      content: {
        hinglish: 'Ye aapka Customer Khata ledger hai. Sabhi grahakon ka pending udhaar balance, payment history aur reminder yahan track hote hain.',
        english: 'This is your Customer Khata ledger. Track customer dues, payment history, and credit balance in real time.',
        hindi: 'यह आपका ग्राहक उधार खाता है जहाँ सभी ग्राहकों का बकाया बैलेंस और भुगतान रिकॉर्ड रहता है।'
      }
    }
  ];

  // Listen to start spotlight tour event
  useEffect(() => {
    const handleStartTour = (e) => {
      const initialStep = e?.detail?.stepIndex || 0;
      setCurrentStepIndex(initialStep);
      setIsActive(true);
    };

    window.addEventListener('karobaar_start_spotlight_tour', handleStartTour);
    return () => window.removeEventListener('karobaar_start_spotlight_tour', handleStartTour);
  }, []);

  // Update target rect when step changes or window resizes
  useEffect(() => {
    if (!isActive) return;

    const currentStep = tourSteps[currentStepIndex];
    if (!currentStep) return;

    // Navigate to required path if not currently on it
    if (currentStep.path && !window.location.hash.includes(currentStep.path)) {
      navigate(currentStep.path);
    }

    const updatePosition = () => {
      let targetEl = document.querySelector(currentStep.selector);
      
      // Fallback selector attempt
      if (!targetEl && currentStep.selector.includes(',')) {
        const fallbacks = currentStep.selector.split(',').map(s => s.trim());
        for (const fb of fallbacks) {
          targetEl = document.querySelector(fb);
          if (targetEl) break;
        }
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const rect = targetEl.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      } else {
        // Fallback default center spotlight if element is not in DOM
        setTargetRect({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 180,
          width: 360,
          height: 140
        });
      }
    };

    const timer = setTimeout(updatePosition, 300);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    // Speak the explanation for current step
    const textToSpeak = currentStep.content[language] || currentStep.content.hinglish;
    speakSpotlight(textToSpeak);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isActive, currentStepIndex, language]);

  // Keyboard navigation: Escape closes, Arrows navigate
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        stopSpeech();
        setIsActive(false);
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStepIndex]);

  const speakSpotlight = (text) => {
    if (!voiceSpeechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const clean = text.replace(/[*#_`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (language === 'hi') {
      const hiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('swara'));
      if (hiVoice) utterance.voice = hiVoice;
      utterance.lang = 'hi-IN';
    } else {
      const inVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('neerja'));
      if (inVoice) utterance.voice = inVoice;
      utterance.lang = 'en-IN';
    }

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const handleNext = () => {
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      stopSpeech();
      setIsActive(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isActive || !targetRect) return null;

  const currentStep = tourSteps[currentStepIndex];
  const stepText = currentStep.content[language] || currentStep.content.hinglish;

  // Calculate tooltip placement (place above or below based on vertical space)
  const isNearBottom = targetRect.top + targetRect.height + 220 > window.innerHeight;
  const tooltipTop = isNearBottom 
    ? Math.max(16, targetRect.top - 200) 
    : targetRect.top + targetRect.height + 14;

  const tooltipLeft = Math.min(
    Math.max(16, targetRect.left + targetRect.width / 2 - 180),
    window.innerWidth - 380
  );

  return (
    <div className="live-spotlight-backdrop" onClick={() => { stopSpeech(); setIsActive(false); }}>
      {/* 1. Pulsing Target Outline directly over the active feature */}
      <div 
        className="live-spotlight-outline"
        style={{
          top: `${targetRect.top - 6}px`,
          left: `${targetRect.left - 6}px`,
          width: `${targetRect.width + 12}px`,
          height: `${targetRect.height + 12}px`
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="spotlight-bracket bracket-tl" />
        <div className="spotlight-bracket bracket-tr" />
        <div className="spotlight-bracket bracket-bl" />
        <div className="spotlight-bracket bracket-br" />
        <div className="spotlight-radar-pulse" />
      </div>

      {/* 2. Side-By-Side Interactive Instructions Card */}
      <div 
        className="live-spotlight-card"
        style={{
          top: `${tooltipTop}px`,
          left: `${tooltipLeft}px`
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Card Header */}
        <div className="spotlight-card-header">
          <div className="spotlight-card-badge">
            <div className="spotlight-pulse-dot" />
            <Bot size={13} />
            <span>{assistantName} Live Guidance</span>
          </div>

          <div className="spotlight-card-actions">
            <span className="spotlight-step-counter">
              {currentStepIndex + 1} / {tourSteps.length}
            </span>

            <button 
              type="button" 
              className={`spotlight-icon-btn ${!voiceSpeechEnabled ? 'muted' : ''}`}
              onClick={() => {
                if (voiceSpeechEnabled) stopSpeech();
                setVoiceSpeechEnabled(!voiceSpeechEnabled);
              }}
              title={voiceSpeechEnabled ? 'Mute guidance speech' : 'Enable guidance speech'}
            >
              {voiceSpeechEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>

            <button 
              type="button" 
              className="spotlight-icon-btn"
              onClick={() => { stopSpeech(); setIsActive(false); }}
              title="Close feature guide (Esc)"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="spotlight-card-body">
          <h3 className="spotlight-feature-title">{currentStep.title}</h3>
          <p className="spotlight-feature-text">{stepText}</p>
        </div>

        {/* Card Footer Navigation */}
        <div className="spotlight-card-footer">
          {currentStepIndex > 0 ? (
            <button type="button" onClick={handlePrev} className="spotlight-btn-secondary">
              <ArrowLeft size={13} /> Back
            </button>
          ) : <div />}

          <button 
            type="button" 
            onClick={handleNext}
            className="spotlight-btn-primary"
          >
            <span>{currentStepIndex === tourSteps.length - 1 ? 'Finish Tour' : 'Next Feature'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
