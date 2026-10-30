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
  CheckCircle,
  Square,
  Sliders,
  ClipboardList,
  Building2,
  ChevronDown,
  Headphones,
  Radio
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../services/databaseService';
import './AIOnboardingConcierge.css';


export const AI_LANGUAGES = [
  { code: 'hinglish', label: 'Hinglish', native: 'हिंग्लिश', speechLang: 'hi-IN', flag: '🇮🇳' },
  { code: 'en', label: 'English', native: 'English', speechLang: 'en-US', flag: '🌐' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', speechLang: 'hi-IN', flag: '🇮🇳' },
  { code: 'ur', label: 'Urdu', native: 'اردو', speechLang: 'ur-PK', flag: '🇵🇰' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', speechLang: 'bn-IN', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', speechLang: 'ta-IN', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', speechLang: 'te-IN', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', speechLang: 'mr-IN', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', speechLang: 'gu-IN', flag: '🇮🇳' },
  { code: 'ar', label: 'Arabic', native: 'العربية', speechLang: 'ar-SA', flag: '🇸🇦' },
  { code: 'es', label: 'Spanish', native: 'Español', speechLang: 'es-ES', flag: '🇪🇸' }
];

export const TEST_PHRASES = {
  hinglish: 'Namaste! Main Karobaar Customize AI hoon. Main aapki dukaan ka setup aur billing asaan banaunga.',
  en: 'Hello! I am Karobaar Customize AI. I will help you set up and manage your business smoothly.',
  hi: 'नमस्ते! मैं करोबार कस्टमाइज़ AI हूँ। मैं आपकी दुकान का सेटअप और बिलिंग आसान बनाऊँगा।',
  ur: 'السلام علیکم! میں کاروبار کسٹمائز AI ہوں۔ میں آپ کی دکان کا سیٹ اپ آسان بناؤں گا۔',
  bn: 'নমস্কার! আমি কারবার কাস্টমাইজ এআই। আপনার দোকানের সেটআপ ও হিসাব সহজ করে দেব।',
  ta: 'வணக்கம்! நான் காரோபார் AI உதவியாளர். உங்கள் கடை அமைப்பை எளிதாக்குவேன்.',
  te: 'నమస్కారం! నేను కారోబార్ AI అసిస్టెంట్‌ని. మీ దుకాణం సెటప్‌ను సులభతరం చేస్తాను.',
  mr: 'नमस्कार! मी कारोबार कस्टमाईझ AI आहे. तुमच्या दुकानाचे व्यवस्थापन सोपे करूया.',
  gu: 'નમસ્તે! હું કારોબાર કસ્ટમાઇઝ AI છું. તમારી દુકાનનું સેટઅપ સરળ બનાવીશ.',
  ar: 'مرحباً! أنا مساعد كاروبار الذكي. سأساعدك في تهيئة وإدارة متجرك بكل سهولة.',
  es: '¡Hola! Soy Karobaar Asistente IA. Te ayudaré a configurar y gestionar tu negocio con éxito.'
};

export const LANGUAGE_SPEECH_DATA = {
  hinglish: {
    speechLang: 'hi-IN',
    nativeText: 'Namaste! Main Karobaar Customize AI hoon. Main aapki dukaan ka setup aur billing asaan banaunga.',
    phoneticText: 'Namaste! Main Karobaar Customize AI hoon. Main aapki dukaan ka setup aur billing asaan banaunga.',
    selectedLabel: 'Selected',
    confirmVoice: (g) => g === 'male' ? 'Namaste! Male voice select ho gayi hai.' : 'Namaste! Female voice select ho gayi hai.'
  },
  en: {
    speechLang: 'en-US',
    nativeText: 'Hello! I am Karobaar Customize AI. I will help you set up and manage your business smoothly.',
    phoneticText: 'Hello! I am Karobaar Customize AI. I will help you set up and manage your business smoothly.',
    selectedLabel: 'Selected',
    confirmVoice: (g) => `Voice set to ${g}. I am ready to guide you.`
  },
  hi: {
    speechLang: 'hi-IN',
    nativeText: 'नमस्ते! मैं करोबार कस्टमाइज़ AI हूँ। मैं आपकी दुकान का सेटअप और बिलिंग आसान बनाऊँगा।',
    phoneticText: 'Namaste! Main Karobaar Customize AI hoon. Main aapki dukaan ka setup aur billing asaan banaoonga.',
    selectedLabel: 'चयनित (Selected)',
    confirmVoice: (g) => g === 'male' ? 'नमस्ते! पुरुष आवाज़ चुन ली गई है।' : 'नमस्ते! महिला आवाज़ चुन ली गई है।'
  },
  ur: {
    speechLang: 'ur-PK',
    nativeText: 'السلام علیکم! میں کاروبار کسٹمائز AI ہوں۔ میں آپ کی دکان کا سیٹ اپ آسان بناؤں گا۔',
    phoneticText: 'Assalam-o-Alaikum! Main Karobaar Customize AI hoon. Main aapki dukaan ka setup aasan banaunga.',
    selectedLabel: 'منتخب (Selected)',
    confirmVoice: (g) => g === 'male' ? 'السلام علیکم! مردانہ آواز منتخب ہو گئی ہے۔' : 'السلام علیکم! زنانہ آواز منتخب ہو گئی ہے۔'
  },
  bn: {
    speechLang: 'bn-IN',
    nativeText: 'নমস্কার! আমি কারবার কাস্টমাইজ এআই। আপনার দোকানের সেটআপ ও হিসাব সহজ করে দেব।',
    phoneticText: 'Nomoshkar! Aami Karobaar Customize AI. Aaponar dokaner setup shohaj kore debo.',
    selectedLabel: 'নির্বাচিত (Selected)',
    confirmVoice: (g) => `Nomoshkar! ${g === 'male' ? 'Purush' : 'Mohila'} voice select kora hoyeche.`
  },
  ta: {
    speechLang: 'ta-IN',
    nativeText: 'வணக்கம்! நான் காரோபார் AI உதவியாளர். உங்கள் கடை அமைப்பை எளிதாக்குவேன்.',
    phoneticText: 'Vanakkam! Naan Karobaar AI udhaviyaalar. Ungal kadai amaippai elidhaakkuvaen.',
    selectedLabel: 'தேர்ந்தெடுக்கப்பட்டது (Selected)',
    confirmVoice: (g) => `Vanakkam! ${g} voice select seyyappattadhu.`
  },
  te: {
    speechLang: 'te-IN',
    nativeText: 'నమస్కారం! నేను కారోబార్ AI అసిస్టెంట్‌ని. మీ దుకాణం సెటప్‌ను సులభతరం చేస్తాను.',
    phoneticText: 'Namaskaram! Nenu Karobaar AI assistant ni. Mee dukaanaanni set up chesthaanu.',
    selectedLabel: 'ఎంచుకోబడింది (Selected)',
    confirmVoice: (g) => `Namaskaram! ${g} voice select cheyabadindhi.`
  },
  mr: {
    speechLang: 'mr-IN',
    nativeText: 'नमस्कार! मी कारोबार कस्टमाईझ AI आहे. तुमच्या दुकानाचे व्यवस्थापन सोपे करूया.',
    phoneticText: 'Namaskar! Mee Karobaar Customize AI aahe. Tumchya dukaanaache setup sope karuya.',
    selectedLabel: 'निवडलेले (Selected)',
    confirmVoice: (g) => `Namaskar! ${g} aawaj select zhaali aahe.`
  },
  gu: {
    speechLang: 'gu-IN',
    nativeText: 'નમસ્તે! હું કારોબાર કસ્ટમાઇઝ AI છું. તમારી દુકાનનું સેટઅપ સરળ બનાવીશ.',
    phoneticText: 'Namaste! Hoon Karobaar Customize AI chhu. Tamaari dukaan nu setup saral banaavish.',
    selectedLabel: 'પસંદ કરેલ (Selected)',
    confirmVoice: (g) => `Namaste! ${g} aawaj pasand thai gayee chhe.`
  },
  ar: {
    speechLang: 'ar-SA',
    nativeText: 'مرحباً! أنا مساعد كاروبار الذکی. سأساعدك في تهيئة وإدارة متجرك بكل سهولة.',
    phoneticText: "Marhaban! Ana musa'id Karobaar al-dhaki. Sa-usa'iduka fi idarat matjarik bi-kulli suhoola.",
    selectedLabel: 'محدد (Selected)',
    confirmVoice: (g) => `Marhaban! Tam dabt al-sawt ila ${g}.`
  },
  es: {
    speechLang: 'es-ES',
    nativeText: '¡Hola! Soy Karobaar Asistente IA. Te ayudaré a configurar y gestionar tu negocio con éxito.',
    phoneticText: '¡Hola! Soy Karobaar Asistente IA. Te ayudaré a configurar y gestionar tu negocio con éxito.',
    selectedLabel: 'Seleccionado (Selected)',
    confirmVoice: (g) => `Voz establecida en ${g}. Estoy listo para ayudarte.`
  }
};



export const AI_STEP_PROMPTS_PHONETIC = {
  step1: {
    hinglish: 'Namaste! Karobaar me aapka swagat hai. Main Customize AI hoon. Chaliye aapki dukaan ka pura setup step-by-step karte hain. Kripya apna naam aur phone number batayein ya type karein.',
    en: 'Welcome to Karobaar! I am Customize AI, your business assistant. Let us set up your store step-by-step. What is your full name and contact number?',
    hi: 'Namaste! Karobaar mein aapka swaagat hai. Main Customize AI hoon. Chaliye aapki dukaan ka poora setup step-by-step karte hain. Kripya apna naam aur phone number darj karein.',
    ur: 'Khush-aamdeed! Main aapka Customize AI assistant hoon. Chaliye aapki dukaan ka mukammal setup karte hain. Baraah-e-karam apna naam aur phone number darj karein.',
    bn: 'Karobaar e shagotom! Aami aaponar Customize AI. Aashun dhaape dhaape aaponar dokan setup kori. Doya kore aaponar naam o phone number likhun.',
    ta: 'Karobaarukku varaverkirom! Naan ungal AI udhaviyaalar. Ungal kadaiyai amaippom. Ungal peyar matrum tholaipesi ennai ullidavum.',
    te: 'Karobaar ku swagatham! Nenu mee AI assistant ni. Mee dukaanaanni setup cheddaam. Dayachesi mee peru mariyu phone number nu namodu cheyandi.',
    mr: 'Karobaar madhye aaple swagat aahe! Mee tumcha AI sahayyak aahe. Chala tumchya dukaanaache setup karuya. Kripya tumche naav va phone number taaka.',
    gu: 'Karobaar ma aapnu swagat chhe! Hoon tamaaro AI sahayak chhu. Chaalo tamaari dukaan nu setup kariye. Kripa karine tamaaru naam ane phone number daakhal karo.',
    ar: 'Marhaban bik fi Karobaar! Ana musaiduk al-dhaki. Dana naqum bi-tahiat matjarik khattwa bi-khattwa. Yurja idkhaalu ismik wa raqm hatifik.',
    es: '¡Bienvenido a Karobaar! Soy tu asistente de IA. Configuremos tu tienda paso a paso. Ingresa tu nombre y número de teléfono.'
  },
  step2: (name, lang) => {
    const n = name || '';
    switch (lang) {
      case 'hi': return 'Bahut khoob, ' + n + '! Ab apni dukaan ya business ka naam darj karein:';
      case 'ur': return 'Bahut khoob, ' + n + '! Ab apni dukaan ya business ka naam darj karein:';
      case 'bn': return 'Chomothkar, ' + n + '! Ebaar aaponar dokaan ba business er naam likhun:';
      case 'ta': return 'Sirappu, ' + n + '! Ippodhu ungal kadai alladhu vanigatthin peyarai ullidavum:';
      case 'te': return 'Chaala baagundi, ' + n + '! Ippudu mee dukaanaam leda vyaapaaram peru namodu cheyandi:';
      case 'mr': return 'Uttam, ' + n + '! Aata aaplya dukaanaache kinva vyavsaayache naav taaka:';
      case 'gu': return 'Saras, ' + n + '! Have tamaari dukaan athva vyavsay nu naam daakhal karo:';
      case 'ar': return 'Raa\'e, ' + n + '! Al-aan ma huwa ism matjarik aw sharikatik?';
      case 'es': return '¡Excelente, ' + n + '! ¿Cuál es el nombre de tu tienda o negocio?';
      case 'en': return 'Awesome, ' + (n || 'there') + '! What is the name of your shop or enterprise?';
      case 'hinglish':
      default: return 'Bahut badhiya, ' + (n || 'ji') + '! Ab apni dukaan ya business ka naam batayein:';
    }
  },
  step3: {
    hinglish: 'Aapka business kis type ka hai? Jaise Cafeteria, Kirana store, ya Kapde ki dukaan? Select karte hi main ready-to-sell inventory apne aap load kar dunga.',
    en: 'What type of business do you run? Select your category, and I will preload ready-to-sell products with prices for you.',
    hi: 'Aapki dukaan kis tarah ki hai? Jaise Cafeteria, Kirana store, ya Kapde ki dukaan? Main aapke liye ready-to-sell maal turant load kar doonga.',
    ur: 'Aap ka karobaar kis qism ka hai? Jaise Cafe, Karyana store, ya Garments? Main aapke liye zaroori saamaan khud shaamil kar doonga.',
    bn: 'Aaponar business kon dhoroner? Jemon Cafe, Mudikhana ba Kapoder dokan? Aami ready-to-sell stock load kore debo.',
    ta: 'Ungal vanigam ethagaiyadhu? Cafe, Maligai alladhu Thunikkadaya? Naan thayaaraana sarakkugalai yetruven.',
    te: 'Mee vyaapaaram ye rakamainadi? Cafe, Kirana leda Dustula dukaanaama? Nenu siddhamgaa unna vasthuvulanu load chesthaanu.',
    mr: 'Tumcha vyavsay konthya prakaarcha aahe? Cafe, Kirana kinva Kapdyaanche dukaan? Mee tayaar inventory load karen.',
    gu: 'Tamaaro vyavsay keva prakaarno chhe? Cafe, Kariyaanu ke Kapdaan? Hoon taiyaar maal aapmele umedi aapeesh.',
    ar: 'Ma huwa naw nashatik al-tijari? Mithla maqha, baqala, aw malabis? Sa-aqum bi-tahmil al-muntajat tilqaiyan.',
    es: '¿Qué tipo de negocio tienes? Cafetería, supermercado o tienda de ropa. Cargaré los productos por ti.'
  },
  step4: {
    hinglish: 'QR code se customer payments lene ke liye apni UPI ID enter karein (jaise naam@okaxis), aur apni billing currency chunein:',
    en: 'Enter your UPI ID or payment handle for QR customer payments, and choose your preferred currency:',
    hi: 'QR code se payments lene ke liye apni UPI ID daalein, jaise naam @ okaxis, aur apni currency chunein:',
    ur: 'Adaigi aur QR code ke liye apni UPI ya shanakhti tafseel darj karein aur currency muntakhib karein:',
    bn: 'Payment paowar jonyo UPI ID din ebong currency select korun:',
    ta: 'QR kattanangalai yerka ungal UPI mugavariyai ullittu currency thervu seyyavum:',
    te: 'Customer chellimpula kosam mee UPI ID ni namodu chesi currency ni yenchukondi:',
    mr: 'Payment sweekaranyasaathi tumchi UPI ID taaka aani currency nivda:',
    gu: 'Grahak payment sweekarva maate tamaari UPI ID daakhal karo ane currency pasand karo:',
    ar: 'Adkhil marif al-daf al-raqami al-khas bik wakhtar al-umla al-mufaddala ladayk:',
    es: 'Ingresa tu identificador de pagos y selecciona tu moneda preferida:'
  },
  step5: {
    hinglish: 'Apni pasand ki Black and White monochrome theme aur dashboard desk select karein:',
    en: 'Choose your high-contrast monochrome theme and dashboard operating layout:',
    hi: 'Apni pasand ki black and white theme aur dashboard style chunein:',
    ur: 'Apni pasand ka black and white theme aur dashboard design muntakhib karein:',
    bn: 'Aaponar pochonder monochrome theme o dashboard mode select korun:',
    ta: 'Ungalukku viruppamaana karuppu vellai theme matrum dashboard paaniyai thervu seyyavum:',
    te: 'Meeku ishtamaina monochrome theme mariyu dashboard shailini yenchukondi:',
    mr: 'Aapli aavadti monochrome theme aani dashboard style nivda:',
    gu: 'Tamaari pasandni monochrome theme ane dashboard style pasand karo:',
    ar: 'Ikhtar al-namat al-ahadi aali al-tabayun wa wajihat lawhat al-tahakkum:',
    es: 'Selecciona tu tema monocromático y la vista de panel que prefieras:'
  }
};

export const AI_STEP_PROMPTS = {
  step1: {
    hinglish: 'Namaste! Karobaar me aapka swagat hai. Main Customize AI hoon. Chaliye aapki dukaan ka pura setup step-by-step karte hain. Kripya apna naam aur phone number batayein ya type karein.',
    en: 'Welcome to Karobaar! I am Customize AI, your business assistant. Let us set up your store step-by-step. What is your full name and contact number?',
    hi: 'नमस्ते! करोबार में आपका स्वागत है। मैं कस्टमाइज़ AI हूँ। चलिए आपकी दुकान का पूरा सेटअप स्टेप-बाय-स्टेप करते हैं। कृपया अपना नाम और फ़ोन नंबर दर्ज करें।',
    ur: 'خوش آمدید! میں آپ کا کسٹمائز AI اسسٹنٹ ہوں۔ چلیے آپ کی دکان کا مکمل سیٹ اپ کرتے ہیں۔ براہ کرم اپنا نام اور فون نمبر درج کریں۔',
    bn: 'কারবারে স্বাগতম! আমি আপনার কাস্টমাইজ এআই। আসুন ধাপে ধাপে আপনার দোকান সেটআপ করি। দয়া করে আপনার নাম ও ফোন নম্বর লিখুন।',
    ta: 'காரோபாருக்கு வரவேற்கிறோம்! நான் உங்கள் AI உதவியாளர். உங்கள் கடையை அமைப்போம். உங்கள் பெயர் மற்றும் தொலைபேசி எண்ணை உள்ளிடவும்.',
    te: 'కారోబార్‌కు స్వాగతం! నేను మీ AI అసిస్టెంట్‌ని. మీ దుకాణాన్ని సెటప్ చేద్దాం. దయచేసి మీ పేరు మరియు ఫోన్ నంబర్‌ను నమోదు చేయండి.',
    mr: 'कारोबार मध्ये आपले स्वागत आहे! मी तुमचा AI सहाय्यक आहे. चला तुमच्या दुकानाचे सेटअप करूया. कृपया तुमचे नाव व फोन नंबर टाका.',
    gu: 'કારોબારમાં આપનું સ્વાગત છે! હું તમારો AI સહાયક છું. ચાલો તમારી દુકાનનું સેટઅપ કરીએ. કૃપા કરીને તમારું નામ અને ફોન નંબર દાખલ કરો.',
    ar: 'مرحباً بك في كاروبار! أنا مساعدك الذكي. دعنا نقوم بتهيئة متجرك خطوة بخطوة. يرجى إدخال اسمك ورقم هاتفك.',
    es: '¡Bienvenido a Karobaar! Soy tu asistente de IA. Configuremos tu tienda paso a paso. Ingresa tu nombre y número de teléfono.'
  },
  step2: (name, lang) => {
    switch (lang) {
      case 'hi': return `बहुत खूब, ${name || ''}! अब अपनी दुकान, कैफे या व्यापार का नाम बताएँ:`;
      case 'ur': return `بہت خوب، ${name || ''}! اب اپنی دکان یا کاروبار کا نام درج کریں:`;
      case 'bn': return `চমৎকার, ${name || ''}! এবার আপনার দোকান বা ব্যবসার নাম লিখুন:`;
      case 'ta': return `சிறப்பு, ${name || ''}! இப்போது உங்கள் கடை அல்லது வணிகத்தின் பெயரை உள்ளிடவும்:`;
      case 'te': return `చాలా బాగుంది, ${name || ''}! ఇప్పుడు మీ దుకాణం లేదా వ్యాపారం పేరు నమోదు చేయండి:`;
      case 'mr': return `उत्तम, ${name || ''}! आता आपल्या दुकानाचे किंवा व्यवसायाचे नाव टाका:`;
      case 'gu': return `સરસ, ${name || ''}! હવે તમારી દુકાન અથવા વ્યવસાયનું નામ દાખલ કરો:`;
      case 'ar': return `رائع، ${name || ''}! الآن ما هو اسم متجرك أو شركتك؟`;
      case 'es': return `¡Excelente, ${name || ''}! ¿Cuál es el nombre de tu tienda o negocio?`;
      case 'en': return `Awesome, ${name || 'there'}! What is the name of your shop or enterprise?`;
      case 'hinglish':
      default: return `Bahut badhiya, ${name || 'ji'}! Ab apni dukaan ya business ka naam batayein:`;
    }
  },
  step3: {
    hinglish: 'Aapka business kis type ka hai? Jaise Cafeteria, Kirana store, ya Kapde ki dukaan? Select karte hi main ready-to-sell inventory apne aap load kar dunga.',
    en: 'What type of business do you run? Select your category, and I will preload ready-to-sell products with prices for you.',
    hi: 'आपकी दुकान किस तरह की है? जैसे कैफेटेरिया, किराना स्टोर, या कपड़े की दुकान? मैं आपके लिए रेडी-टू-सेल माल तुरंत लोड कर दूँगा।',
    ur: 'آپ کا کاروبار کس قسم کا ہے؟ جیسے کیفے، کریانہ اسٹور، یا گارمنٹس؟ میں آپ کے لیے ضروری سامان خود شامل کر دوں گا۔',
    bn: 'আপনার ব্যবসা কোন ধরনের? যেমন ক্যাফে, মুদিখানা বা কাপড়ের দোকান? আমি উপযুক্ত স্টক লোড করে দেব।',
    ta: 'உங்கள் வணிகம் எத்தகையது? கஃபே, மளிகை அல்லது துணிக்கடையா? நான் தயாரான சரக்குகளை ஏற்றுவேன்.',
    te: 'మీ వ్యాపారం ఏ రకమైనది? కేఫ్, కిరాణా లేదా దుస్తుల దుకాణమా? నేను సిద్ధంగా ఉన్న వస్తువులను లోడ్ చేస్తాను.',
    mr: 'तुमचा व्यवसाय कोणत्या प्रकारचा आहे? कॅफे, किराणा किंवा कपड्यांचे दुकान? मी तयार इन्व्हेंटरी लोड करेन.',
    gu: 'તમારો વ્યવસાય કેવા પ્રકારનો છે? કેફે, કરિયાણું કે કપડાં? હું તૈયાર માલ આપમેળે ઉમેરી આપીશ.',
    ar: 'ما هو نوع نشاطك التجاري؟ مثل مقهى، بقالة، أو ملابس؟ سأقوم بتحميل المنتجات والأسعار تلقائياً.',
    es: '¿Qué tipo de negocio tienes? Cafetería, supermercado o tienda de ropa. Cargaré los productos por ti.'
  },
  step4: {
    hinglish: 'QR code se customer payments lene ke liye apni UPI ID enter karein (jaise naam@okaxis), aur apni billing currency chunein:',
    en: 'Enter your UPI ID or payment handle for QR customer payments, and choose your preferred currency:',
    hi: 'QR कोड से पेमेंट्स लेने के लिए अपनी UPI ID डालें, जैसे नाम @ ओकेएक्सिस, और अपनी करंसी चुनें:',
    ur: 'ادائیگی اور کیو آر کوڈ کے لیے اپنی UPI یا شناختی تفصیل درج کریں اور کرنسی منتخب کریں:',
    bn: 'পেমেন্ট পাওয়ার জন্য ইউপিআই আইডি দিন এবং মুদ্রা নির্বাচন করুন:',
    ta: 'QR கட்டணங்களை ஏற்க உங்கள் UPI முகவரியை உள்ளிட்டு நாணயத்தை தேர்ந்தெடுக்கவும்:',
    te: 'కస్టమర్ చెల్లింపుల కోసం మీ UPI ఐడిని నమోదు చేసి కరెన్సీని ఎంచుకోండి:',
    mr: 'पेमेंट स्वीकारण्यासाठी तुमची UPI आयडी टाका आणि चलन निवडा:',
    gu: 'ગ્રાહક ચુકવણી સ્વીકારવા માટે તમારી UPI ID દાખલ કરો અને કરન્સી પસંદ કરો:',
    ar: 'أدخل معرف الدفع الرقمي الخاص بك واختر العملة المفضلة لديك:',
    es: 'Ingresa tu identificador de pagos y selecciona tu moneda preferida:'
  },
  step5: {
    hinglish: 'Apni pasand ki Black and White monochrome theme aur dashboard desk select karein:',
    en: 'Choose your high-contrast monochrome theme and dashboard operating layout:',
    hi: 'अपनी पसंद की ब्लैक एंड व्हाइट थीम और डैशबोर्ड स्टाइल चुनें:',
    ur: 'اپنی پسند کا بلیک اینڈ وائٹ تھیم اور ڈیش بورڈ ڈیزائن منتخب کریں:',
    bn: 'আপনার পছন্দের মনোক্রোম থিম ও ড্যাশবোর্ড মোড নির্বাচন করুন:',
    ta: 'உங்களுக்கு விருப்பமான கருப்பு வெள்ளை தீம் மற்றும் டாஷ்போர்டு பாணியை தேர்வு செய்யவும்:',
    te: 'మీకు ఇష్టమైన మోనోక్రోమ్ థీమ్ మరియు డాష్‌బోర్డ్ శైలిని ఎంచుకోండి:',
    mr: 'आपली आवडती मोनोक्रोम थीम आणि डॅशबोर्ड शैली निवडा:',
    gu: 'તમારી પસંદની મોનોક્રોમ થીમ અને ડેશબોર્ડ સ્ટાઈલ પસંદ કરો:',
    ar: 'اختر النمط الأحادي عالي التباين وواجهة لوحة التحكم المفضلة لديك:',
    es: 'Selecciona tu tema monocromático y la vista de panel que prefieras:'
  }
};

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
  const navigate = useNavigate();
  const { 
    currentUser, 
    setCurrentUser, 
    currentBusiness, 
    setCurrentBusiness, 
    setUserBusinesses,
    launchDemoWorkspace,
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
  const [languagePreference, setLanguagePreference] = useState(() => localStorage.getItem('karobaar_ai_language') || 'hinglish');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceGender, setSelectedVoiceGender] = useState(() => localStorage.getItem('karobaar_ai_voice_gender') || 'female');
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(() => localStorage.getItem('karobaar_ai_voice_uri') || '');
  const [voicePitch, setVoicePitch] = useState(() => parseFloat(localStorage.getItem('karobaar_ai_voice_pitch') || '1.0'));
  const [voiceRate, setVoiceRate] = useState(() => parseFloat(localStorage.getItem('karobaar_ai_voice_rate') || '1.0'));
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [isSpeakingTest, setIsSpeakingTest] = useState(false);
  const langMenuRef = useRef(null);
  const voiceMenuRef = useRef(null);

  // Form states collected step-by-step
  // Filter out any default placeholder / dummy / SAS fallback names so fields start blank unless the user explicitly gave a custom name
  const isDummyName = (val) => {
    if (!val || typeof val !== 'string') return true;
    const l = val.trim().toLowerCase();
    return (
      l === 'sas cafeteria' ||
      l === 'sas cafeteria owner' ||
      l.includes('sas cafeteria') ||
      l === 'shop owner' ||
      l === 'store owner' ||
      l === 'business owner' ||
      l === 'my store' ||
      l === 'my business' ||
      l === 'demo user' ||
      l.includes('demo')
    );
  };

  const isDummyPhone = (val) => {
    if (!val || typeof val !== 'string') return true;
    const clean = val.replace(/[^0-9]/g, '');
    return clean === '9876500000' || clean.endsWith('9876500000') || clean === '1234567890';
  };

  const [ownerName, setOwnerName] = useState(() => {
    if (currentUser?.name && !isDummyName(currentUser.name)) {
      return currentUser.name;
    }
    return '';
  });
  const [phone, setPhone] = useState(() => {
    if (currentUser?.phone && !isDummyPhone(currentUser.phone)) {
      return currentUser.phone;
    }
    return '';
  });
  const [businessName, setBusinessName] = useState(() => {
    if (currentBusiness?.name && !isDummyName(currentBusiness.name)) {
      return currentBusiness.name;
    }
    return '';
  });
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('General Store & Services');
  const [currency, setCurrency] = useState('INR');
  const [upiId, setUpiId] = useState(() => {
    const saved = localStorage.getItem('karobaar_pos_upi_id');
    return (saved && saved !== 'merchant@okaxis') ? saved : '';
  });
  const [selectedTheme, setSelectedTheme] = useState(() => theme || 'light');
  const [selectedUiVersion, setSelectedUiVersion] = useState(() => appUiVersion || 'v2');

  // AI execution animation states
  const [executionPhase, setExecutionPhase] = useState(0);
  const [tourSlide, setTourSlide] = useState(0);

  const recognitionRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(e.target)) {
        setShowVoiceMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Detect and maintain all installed browser voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const vList = window.speechSynthesis.getVoices() || [];
        setAvailableVoices(vList);
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Check on mount if onboarding is required (Never blocks existing working sessions)
  useEffect(() => {
    const isTriggered = sessionStorage.getItem('karobaar_trigger_ai_onboarding') === 'true';

    if (isTriggered) {
      setIsOpen(true);
      sessionStorage.removeItem('karobaar_trigger_ai_onboarding');
    }

    const handleCustomTrigger = () => {
      setStep(1);
      setIsOpen(true);
    };

    window.addEventListener('karobaar_start_ai_onboarding', handleCustomTrigger);
    return () => window.removeEventListener('karobaar_start_ai_onboarding', handleCustomTrigger);
  }, []);

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

  // Voice selector helper: matches by language prefix, gender persona, with Indian/English fallback
  const getSelectedVoice = (targetLang, targetGender) => {
    const voices = (availableVoices && availableVoices.length > 0)
      ? availableVoices
      : ((typeof window !== 'undefined' && window.speechSynthesis) ? (window.speechSynthesis.getVoices() || []) : []);

    if (!voices.length) return null;

    const gender = targetGender || selectedVoiceGender || 'female';
    const langCode = targetLang || languagePreference || 'en';
    const langObj = AI_LANGUAGES.find(l => l.code === langCode) || AI_LANGUAGES[0];
    const prefix = (langObj.speechLang || 'en').toLowerCase().split('-')[0];

    // Check if user explicitly chose a custom system voice that matches the language
    if (selectedVoiceURI) {
      const exact = voices.find(v => (v.voiceURI === selectedVoiceURI || v.name === selectedVoiceURI) && v.lang.toLowerCase().startsWith(prefix));
      if (exact) return exact;
    }

    // 1. Filter voices for the target language
    let matching = voices.filter(v => v.lang.toLowerCase().startsWith(prefix));

    // 2. Fallbacks for languages often missing on Windows
    if (!matching.length) {
      if (langCode === 'ur' || langCode === 'hinglish') {
        matching = voices.filter(v => v.lang.toLowerCase().startsWith('hi') || v.lang.toLowerCase().includes('in'));
      } else if (['bn', 'ta', 'te', 'mr', 'gu'].includes(langCode)) {
        matching = voices.filter(v => v.lang.toLowerCase().startsWith('hi') || v.lang.toLowerCase().includes('in'));
      } else if (langCode === 'ar') {
        matching = voices.filter(v => v.lang.toLowerCase().startsWith('ar'));
      }
    }

    // 3. Global fallback to English or any voice
    if (!matching.length) {
      matching = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
    }
    if (!matching.length) {
      matching = voices;
    }

    // 4. Match gender persona within candidate voices
    if (gender === 'female' || gender === 'friendly') {
      const female = matching.find(v => {
        const n = v.name.toLowerCase();
        return n.includes('female') || n.includes('zira') || n.includes('samantha') || n.includes('karen') || 
               n.includes('victoria') || n.includes('swara') || n.includes('veena') || n.includes('neerja') || 
               n.includes('kalpana') || n.includes('hoda') || n.includes('sabina') || n.includes('helena') || 
               n.includes('catherine') || n.includes('susan');
      });
      if (female) return female;
    } else if (gender === 'male') {
      const male = matching.find(v => {
        const n = v.name.toLowerCase();
        return n.includes('male') || n.includes('david') || n.includes('mark') || n.includes('george') || 
               n.includes('rishi') || n.includes('madhur') || n.includes('prabhat') || n.includes('hemant') || 
               n.includes('naayf') || n.includes('pablo') || n.includes('richard') || n.includes('james');
      });
      if (male) return male;
    }

    return matching[0] || voices[0] || null;
  };

  // AI Speech output helper with full pitch, rate, persona, language script detection, and phonetic fallback
  const speakAI = (text, options = {}) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }
      if (window.speechSynthesis.paused) {
        try { window.speechSynthesis.resume(); } catch (_) {}
      }

      const targetLang = options.lang || languagePreference || 'en';
      const targetGender = options.gender || selectedVoiceGender || 'female';
      const langObj = AI_LANGUAGES.find(l => l.code === targetLang) || AI_LANGUAGES[0];
      const speechData = LANGUAGE_SPEECH_DATA[targetLang] || LANGUAGE_SPEECH_DATA.en;

      const voice = options.voice || getSelectedVoice(targetLang, targetGender);

      // Determine if voice supports the native non-latin characters
      const voiceLangPrefix = voice ? voice.lang.toLowerCase().split('-')[0] : '';
      const targetPrefix = (langObj.speechLang || 'en').toLowerCase().split('-')[0];
      const supportsNativeScript = (voiceLangPrefix === targetPrefix) || 
                                   (targetPrefix === 'ur' && (voiceLangPrefix === 'ur' || voiceLangPrefix === 'ar')) ||
                                   (targetPrefix === 'mr' && voiceLangPrefix === 'hi');

      // If voice does NOT support the native alphabet (e.g. English voice Microsoft David/Zira for Hindi/Urdu/Bengali/Arabic/Tamil),
      // use phonetic transliteration so audio ALWAYS plays cleanly without staying silent!
      let textToSpeak = text;
      let speechLang = supportsNativeScript ? langObj.speechLang : (voice?.lang || 'en-US');

      if (!supportsNativeScript) {
        if (options.phoneticText) {
          textToSpeak = options.phoneticText;
        } else if (speechData.phoneticText) {
          textToSpeak = speechData.phoneticText;
        }
      }

      const clean = (textToSpeak || '').replace(/[*#_]/g, '').replace(/₹/g, 'Rupees ').trim();
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = speechLang;
      if (voice) {
        utterance.voice = voice;
      }

      // Gender Pitch & Rate calibration
      let pitch = options.pitch !== undefined ? options.pitch : voicePitch;
      let rate = options.rate !== undefined ? options.rate : voiceRate;
      if (targetGender === 'male') {
        pitch = Math.min(pitch, 0.88);
      } else if (targetGender === 'female' || targetGender === 'friendly') {
        pitch = Math.max(pitch, 1.12);
      }
      utterance.pitch = pitch;
      utterance.rate = rate;

      // Keep utterance in a global reference so V8 GC doesn't delete it
      window._activeConciergeUtterance = utterance;

      utterance.onstart = (ev) => {
        if (options.onStart) options.onStart(ev);
      };
      utterance.onend = (ev) => {
        window._activeConciergeUtterance = null;
        if (options.onEnd) options.onEnd(ev);
      };
      utterance.onerror = (ev) => {
        window._activeConciergeUtterance = null;
        if (options.onError) options.onError(ev);
      };

      // 40ms dispatch ensures browser audio queue is ready
      setTimeout(() => {
        try {
          if (window.speechSynthesis.paused) window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('[speakAI execution error]', err);
        }
      }, 40);
    } catch (e) {
      console.warn('[AI Speech error]', e);
    }
  };

  // Interactive Test Voice Sample playback
  const handleTestVoiceSample = () => {
    if (isSpeakingTest) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeakingTest(false);
      return;
    }

    const samplePhrase = TEST_PHRASES[languagePreference] || TEST_PHRASES.en;
    const spData = LANGUAGE_SPEECH_DATA[languagePreference] || LANGUAGE_SPEECH_DATA.en;
    setIsSpeakingTest(true);
    speakAI(samplePhrase, {
      lang: languagePreference,
      phoneticText: spData.phoneticText,
      gender: selectedVoiceGender,
      onEnd: () => setIsSpeakingTest(false),
      onError: () => setIsSpeakingTest(false)
    });
  };

  // Switcher to Traditional /setup wizard
  const handleOpenTraditionalSetup = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsOpen(false);
    navigate('/setup?new=true');
  };

  // Speak AI prompt whenever step changes across ALL 11 languages with phonetic fallback
  useEffect(() => {
    if (!isOpen) return;

    const lang = languagePreference || 'hinglish';
    let promptNative = '';
    let promptPhonetic = '';

    if (step === 1) {
      promptNative = AI_STEP_PROMPTS.step1[lang] || AI_STEP_PROMPTS.step1.en;
      promptPhonetic = AI_STEP_PROMPTS_PHONETIC.step1[lang] || AI_STEP_PROMPTS_PHONETIC.step1.en;
    } else if (step === 2) {
      promptNative = AI_STEP_PROMPTS.step2(ownerName, lang);
      promptPhonetic = AI_STEP_PROMPTS_PHONETIC.step2(ownerName, lang);
    } else if (step === 3) {
      promptNative = AI_STEP_PROMPTS.step3[lang] || AI_STEP_PROMPTS.step3.en;
      promptPhonetic = AI_STEP_PROMPTS_PHONETIC.step3[lang] || AI_STEP_PROMPTS_PHONETIC.step3.en;
    } else if (step === 4) {
      promptNative = AI_STEP_PROMPTS.step4[lang] || AI_STEP_PROMPTS.step4.en;
      promptPhonetic = AI_STEP_PROMPTS_PHONETIC.step4[lang] || AI_STEP_PROMPTS_PHONETIC.step4.en;
    } else if (step === 5) {
      promptNative = AI_STEP_PROMPTS.step5[lang] || AI_STEP_PROMPTS.step5.en;
      promptPhonetic = AI_STEP_PROMPTS_PHONETIC.step5[lang] || AI_STEP_PROMPTS_PHONETIC.step5.en;
    }

    if (promptNative) {
      speakAI(promptNative, { lang, phoneticText: promptPhonetic, gender: selectedVoiceGender });
    }
  }, [step, isOpen, languagePreference, selectedVoiceGender]);


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
    if (launchDemoWorkspace) {
      launchDemoWorkspace('Owner').catch(() => {});
    }
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
            {/* Traditional Setup Switcher Button in Header */}
            <button
              type="button"
              onClick={handleOpenTraditionalSetup}
              className="ai-header-setup-btn"
              title="Open full classic setup page (/setup) - Comprehensive 6-step wizard"
            >
              <ClipboardList size={13} />
              <span>Full Setup Page</span>
            </button>

            {/* Language Dropdown Selector */}
            <div className="ai-menu-anchor" ref={langMenuRef}>
              <button 
                type="button" 
                className={`ai-lang-pill-btn ${showLangMenu ? 'active' : ''}`}
                onClick={() => {
                  setShowLangMenu(!showLangMenu);
                  setShowVoiceMenu(false);
                }}
                title="Select Spoken Language (11 Languages Available)"
              >
                <Globe size={13} />
                <span>
                  {AI_LANGUAGES.find(l => l.code === languagePreference)?.flag} {AI_LANGUAGES.find(l => l.code === languagePreference)?.label || 'Language'}
                </span>
                <ChevronDown size={11} style={{ transform: showLangMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {showLangMenu && (
                <div className="ai-dropdown-popover ai-lang-popover">
                  <div className="ai-popover-header">
                    <span>Select Language / भाषा चुनें</span>
                    <button type="button" onClick={() => setShowLangMenu(false)} className="ai-popover-close"><X size={13} /></button>
                  </div>
                  <div className="ai-lang-grid">
                    {AI_LANGUAGES.map(lang => {
                      const isSelected = languagePreference === lang.code;
                      const spData = LANGUAGE_SPEECH_DATA[lang.code] || LANGUAGE_SPEECH_DATA.en;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          className={`ai-lang-option ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            setLanguagePreference(lang.code);
                            localStorage.setItem('karobaar_ai_language', lang.code);
                            const spData = LANGUAGE_SPEECH_DATA[lang.code] || LANGUAGE_SPEECH_DATA.en;
                            const phraseNative = TEST_PHRASES[lang.code] || TEST_PHRASES.en;
                            speakAI(phraseNative, { 
                              lang: lang.code, 
                              phoneticText: spData.phoneticText,
                              gender: selectedVoiceGender 
                            });
                          }}
                        >
                          <span className="lang-flag">{lang.flag}</span>
                          <div className="lang-text">
                            <strong className="lang-name">{lang.label}</strong>
                            <span className="lang-native">{lang.native}</span>
                          </div>
                          {isSelected ? (
                            <span className="ai-lang-selected-pill">
                              <Check size={11} strokeWidth={3} /> Selected
                            </span>
                          ) : (
                            <span className="ai-lang-select-action">Select</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="ai-lang-footer">
                    <div className="ai-lang-footer-info">
                      <span>Active: <strong>{AI_LANGUAGES.find(l => l.code === languagePreference)?.label}</strong> ({selectedVoiceGender === 'male' ? 'Male Voice' : 'Female Voice'})</span>
                    </div>
                    <button 
                      type="button" 
                      className="ai-lang-apply-btn"
                      onClick={() => setShowLangMenu(false)}
                    >
                      Done / Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Voice Settings Popover (Persona, System Voices, Pitch, Speed, Test Sample) */}
            <div className="ai-menu-anchor" ref={voiceMenuRef}>
              <button 
                type="button"
                className={`ai-lang-pill-btn ${showVoiceMenu ? 'active' : ''}`}
                onClick={() => {
                  setShowVoiceMenu(!showVoiceMenu);
                  setShowLangMenu(false);
                }}
                title="Customize AI Voice, Persona, Pitch, and Speed"
              >
                <Headphones size={13} />
                <span>
                  Voice: {selectedVoiceGender === 'female' ? 'Female' : selectedVoiceGender === 'male' ? 'Male' : selectedVoiceGender === 'friendly' ? 'Friendly' : 'System'}
                </span>
                <ChevronDown size={11} style={{ transform: showVoiceMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {showVoiceMenu && (
                <div className="ai-dropdown-popover ai-voice-popover">
                  <div className="ai-popover-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Headphones size={14} />
                      <span style={{ fontWeight: 800 }}>Voice Studio & Controls</span>
                    </div>
                    <button type="button" onClick={() => setShowVoiceMenu(false)} className="ai-popover-close"><X size={13} /></button>
                  </div>

                  {/* Persona Selection */}
                  <div className="ai-voice-section">
                    <label className="ai-voice-label">Voice Persona / टोन</label>
                    <div className="ai-voice-chips">
                      {[
                        { id: 'female', label: 'Female', desc: 'Soft & Clear' },
                        { id: 'male', label: 'Male', desc: 'Deep & Confident' },
                        { id: 'friendly', label: 'Friendly', desc: 'Warm & Upbeat' },
                        { id: 'system', label: 'System', desc: 'OS Default' }
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className={`ai-voice-chip ${selectedVoiceGender === p.id ? 'active' : ''}`}
                          onClick={() => {
                            const newGender = p.id;
                            let newPitch = 1.0;
                            let newRate = 1.0;
                            if (newGender === 'friendly') {
                              newPitch = 1.1;
                              newRate = 1.05;
                            } else if (newGender === 'female') {
                              newPitch = 1.08;
                              newRate = 1.0;
                            } else if (newGender === 'male') {
                              newPitch = 0.90;
                              newRate = 0.98;
                            } else {
                              newPitch = 1.0;
                              newRate = 1.0;
                            }
                            setVoicePitch(newPitch);
                            setVoiceRate(newRate);
                            setSelectedVoiceGender(newGender);
                            localStorage.setItem('karobaar_ai_voice_gender', newGender);

                            // Speak confirmation in current language using new voice persona!
                            const spData = LANGUAGE_SPEECH_DATA[languagePreference] || LANGUAGE_SPEECH_DATA.en;
                            const confirmText = spData.confirmVoice ? spData.confirmVoice(newGender) : `Voice set to ${p.label}`;
                            speakAI(confirmText, { gender: newGender, pitch: newPitch, rate: newRate });
                          }}
                        >
                          <div className="ai-voice-chip-top">
                            <strong>{p.label}</strong>
                            {selectedVoiceGender === p.id ? (
                              <span className="ai-voice-selected-pill">
                                <Check size={10} strokeWidth={3} /> Selected
                              </span>
                            ) : (
                              <span className="ai-voice-select-hint">Select</span>
                            )}
                          </div>
                          <small>{p.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Browser Installed Voice Picker */}
                  {availableVoices.length > 0 && (
                    <div className="ai-voice-section">
                      <label className="ai-voice-label">System Voice ({availableVoices.length} detected)</label>
                      <select 
                        value={selectedVoiceURI} 
                        onChange={(e) => {
                          setSelectedVoiceURI(e.target.value);
                          localStorage.setItem('karobaar_ai_voice_uri', e.target.value);
                        }}
                        className="ai-voice-select"
                      >
                        <option value="">Auto-matched to language & persona</option>
                        {availableVoices.map((v, i) => (
                          <option key={`${v.voiceURI || v.name}-${i}`} value={v.voiceURI || v.name}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Pitch & Speed Adjusters */}
                  <div className="ai-voice-row">
                    <div className="ai-voice-section" style={{ flex: 1 }}>
                      <label className="ai-voice-label">Pitch ({voicePitch}x)</label>
                      <div className="ai-mini-chips">
                        {[
                          { val: 0.85, label: 'Deep' },
                          { val: 1.0, label: 'Normal' },
                          { val: 1.15, label: 'High' }
                        ].map(pt => (
                          <button
                            key={pt.val}
                            type="button"
                            className={`ai-mini-chip ${voicePitch === pt.val ? 'active' : ''}`}
                            onClick={() => {
                              setVoicePitch(pt.val);
                              localStorage.setItem('karobaar_ai_voice_pitch', String(pt.val));
                            }}
                          >
                            {pt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="ai-voice-section" style={{ flex: 1 }}>
                      <label className="ai-voice-label">Speed ({voiceRate}x)</label>
                      <div className="ai-mini-chips">
                        {[
                          { val: 0.85, label: '0.85x' },
                          { val: 1.0, label: '1.0x' },
                          { val: 1.2, label: '1.2x' }
                        ].map(rt => (
                          <button
                            key={rt.val}
                            type="button"
                            className={`ai-mini-chip ${voiceRate === rt.val ? 'active' : ''}`}
                            onClick={() => {
                              setVoiceRate(rt.val);
                              localStorage.setItem('karobaar_ai_voice_rate', String(rt.val));
                            }}
                          >
                            {rt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Test Voice Sample Button */}
                  <div className="ai-voice-test-footer">
                    <button
                      type="button"
                      onClick={handleTestVoiceSample}
                      className={`ai-voice-test-btn ${isSpeakingTest ? 'playing' : ''}`}
                    >
                      {isSpeakingTest ? (
                        <>
                          <Square size={13} fill="currentColor" />
                          <span>Stop Voice Sample</span>
                          <span className="ai-test-soundwave">
                            <span /><span /><span />
                          </span>
                        </>
                      ) : (
                        <>
                          <Play size={13} fill="currentColor" />
                          <span>Test Selected Voice</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                  {AI_STEP_PROMPTS.step1[languagePreference] || AI_STEP_PROMPTS.step1.hinglish}
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
                  placeholder="e.g. +91 98765 43210"
                  className="ai-concierge-input"
                />
              </div>
            </div>

            <div className="ai-step-footer">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  onClick={handleFinishOnboarding} 
                  className="ai-btn-secondary"
                >
                  Skip & Use Demo Store
                </button>
                <button
                  type="button"
                  onClick={handleOpenTraditionalSetup}
                  className="ai-btn-switch-setup"
                  title="Switch to full 6-step traditional setup wizard"
                >
                  <Building2 size={13} />
                  <span>Classic Setup Page (/setup)</span>
                </button>
              </div>
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
                  {AI_STEP_PROMPTS.step2(ownerName, languagePreference)}
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
                    placeholder="e.g. Sharma Kirana Store, Royal Cafe, Apex Retail"
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
                {['Sharma Supermarket', 'Apex Retail Hub', 'Royal Bakers', 'City Mobile World', 'Star Cafe'].map((sug, i) => (
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
                  {AI_STEP_PROMPTS.step3[languagePreference] || AI_STEP_PROMPTS.step3.hinglish}
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
                  {AI_STEP_PROMPTS.step4[languagePreference] || AI_STEP_PROMPTS.step4.hinglish}
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
                  {AI_STEP_PROMPTS.step5[languagePreference] || AI_STEP_PROMPTS.step5.hinglish}
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
                  {languagePreference === 'hinglish' ? 'AI Setup Shuru Karo (Execute All Live)' : languagePreference === 'hi' ? 'AI सेटअप शुरू करो (Execute All Live)' : 'Execute AI Autonomous Setup Live'}
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
                {languagePreference === 'hinglish'
                  ? `Badhai Ho! Aapki dukaan ${businessName} ab 100% live aur ready hai!`
                  : languagePreference === 'hi' 
                  ? `बधाई हो! आपकी दुकान ${businessName} पूरी तरह चालू हो चुकी है!` 
                  : `Congratulations! ${businessName} is 100% Live & Ready!`}
              </h2>
              <p className="celebrate-sub">
                {languagePreference === 'hinglish'
                  ? "Customize AI ne aapka pura store configure kar diya hai. Ye 3 main features aapko turant use karne chahiye:"
                  : languagePreference === 'hi'
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
                <span>{languagePreference === 'hinglish' ? 'Dukaan Me Pravesh Karein (Enter Live Store)' : languagePreference === 'hi' ? 'दुकान में प्रवेश करें (Enter My Live Store)' : 'Open My Dashboard & Start Selling'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
