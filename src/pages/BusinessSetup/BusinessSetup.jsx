import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../services/databaseService';
import { Button } from '../../components/ui/Button';
import { auth } from '../../services/firebase';
import { signOut, RecaptchaVerifier, linkWithPhoneNumber, PhoneAuthProvider, linkWithCredential } from 'firebase/auth';
import { Country, City } from 'country-state-city';
import { Building2, Link, Users, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Store, Sparkles } from 'lucide-react';
import './BusinessSetup.css';

const MODULES_LIST = [
  { id: 'sales', label: 'Sales' },
  { id: 'pos', label: 'POS' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'customers', label: 'Customers' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'employees', label: 'Employees' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'leave', label: 'Leave Management' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'payments', label: 'Payments' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'reports', label: 'Reports' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'projects', label: 'Projects' },
  { id: 'documents', label: 'Business Documents' },
  { id: 'notifications', label: 'Notifications' }
];

const ALL_COUNTRIES = Country.getAllCountries();

const TOP_CITIES = {
  "India": ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur"],
  "Pakistan": ["Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", "Peshawar", "Multan", "Hyderabad", "Islamabad", "Quetta"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "Austin"],
  "United Kingdom": ["London", "Birmingham", "Manchester", "Glasgow", "Newcastle", "Sheffield", "Liverpool", "Leeds", "Bristol", "Edinburgh"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah", "Fujairah"],
  "Bangladesh": ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Barisal", "Rangpur", "Comilla"],
  "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Hobart"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Ta'if", "Tabuk", "Buraidah"],
  "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein"],
  "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf"],
  "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg"]
};

const getCitiesForCountry = (countryName) => {
  if (!countryName || countryName === 'Other') return [];
  
  // If we have curated top cities for this country, put them at the very top!
  const recommended = TOP_CITIES[countryName] || [];
  
  const country = ALL_COUNTRIES.find(c => c.name === countryName);
  if (!country) return recommended;
  
  const cities = City.getCitiesOfCountry(country.isoCode) || [];
  const allCityNames = Array.from(new Set(cities.map(c => c.name))).sort();
  
  const otherCities = allCityNames.filter(c => !recommended.includes(c));
  
  return [...recommended, ...otherCities];
};

const countryPhoneOptions = ALL_COUNTRIES.map(c => {
  const cleanCode = '+' + c.phonecode.replace(/[^0-9]/g, '');
  return {
    value: cleanCode,
    label: `${c.isoCode} (${cleanCode}) ${c.name}`
  };
});

const topPhoneCodes = ['+1', '+44', '+91', '+92', '+971'].map(code => 
  countryPhoneOptions.find(c => c.value === code)
).filter(Boolean);

const finalCountryPhoneOptions = [...topPhoneCodes, { value: '', label: '--- All Countries ---' }, ...countryPhoneOptions];

const PHONE_LENGTHS = {
  '+1': 10,
  '+44': 10,
  '+91': 10,
  '+92': 10,
  '+971': 9,
  '+61': 9,
  '+86': 11,
  '+49': 11,
  '+33': 9,
  '+81': 10,
};

const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const selectRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);
  
  return (
    <div ref={selectRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 1000 : 1 }}>
      <div 
        className="setup-input" 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); setSearch(""); }}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card, #fff)' }}
      >
        <span style={{ opacity: value ? 1 : 0.5, color: 'var(--text-main, #000)' }}>
          {options.find(o => o.value === value)?.value || placeholder || "Select..."}
        </span>
        <svg style={{transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, minWidth: '260px',
          background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '8px', marginTop: '4px', zIndex: 1001,
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {options.length > 10 && (
            <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-card, #fff)' }}>
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'transparent', color: 'var(--text-main)' }}
                autoFocus
              />
            </div>
          )}
          
          <div 
            style={{ maxHeight: '220px', overflowY: 'auto', overscrollBehavior: 'contain' }} 
            onWheel={(e) => e.stopPropagation()}
          >
            {filteredOptions.length === 0 && (
              <div style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>No matches found</div>
            )}
            {filteredOptions.map((opt, i) => (
              <div 
                key={i} 
                onClick={(e) => { e.stopPropagation(); onChange({ target: { value: opt.value } }); setIsOpen(false); setSearch(""); }}
                style={{
                  padding: '0.85rem 1rem', cursor: 'pointer',
                  background: value === opt.value ? 'var(--bg-hover, #f1f5f9)' : 'transparent',
                  borderBottom: i < filteredOptions.length - 1 ? '1px solid var(--border-color, #e2e8f0)' : 'none',
                  color: 'var(--text-main, #000)',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover, #f1f5f9)'}
                onMouseLeave={e => e.currentTarget.style.background = value === opt.value ? 'var(--bg-hover, #f1f5f9)' : 'transparent'}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const BusinessSetup = () => {
  const { authStatus, currentUser, refreshUserProfile } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinParam = searchParams.get('join') || '';
  const newParam = searchParams.get('new') === 'true';

  const [setupMode, setSetupMode] = useState(() => {
    if (joinParam && (joinParam.toUpperCase().includes('KB-INV-') || joinParam.length >= 6)) {
      return 'join';
    }
    return 'choose';
  }); // 'choose' | 'create' | 'join'
  const [joinCodeInput, setJoinCodeInput] = useState(joinParam);
  const [invitePreview, setInvitePreview] = useState(null);
  const [isVerifyingInvite, setIsVerifyingInvite] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const isAuthLoading = authStatus === 'loading';

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-verify if joinParam exists
  useEffect(() => {
    if (joinParam) {
      verifyInviteCode(joinParam);
    }
  }, [joinParam]);

  const verifyInviteCode = async (codeToVerify) => {
    const rawInput = (codeToVerify || joinCodeInput || '').trim();
    let clean = rawInput.toUpperCase();
    if (clean.includes('JOIN=')) {
      clean = clean.split('JOIN=')[1].split('&')[0];
    }
    if (clean.includes('#/SETUP?JOIN=')) {
      clean = clean.split('#/SETUP?JOIN=')[1].split('&')[0];
    }
    clean = clean.trim();
    if (!clean) return;
    setJoinCodeInput(clean);
    setIsVerifyingInvite(true);
    setInviteError('');
    try {
      const found = (await db.getInvitationByCode(rawInput)) || (await db.getInvitationByCode(clean));
      if (!found) {
        setInviteError('Invitation not found. Please verify the code or ask your owner for a new one.');
        setInvitePreview(null);
      } else if (found.status === 'revoked') {
        setInviteError('This invitation has been revoked by the business owner.');
        setInvitePreview(null);
      } else if (found.status === 'accepted') {
        setInviteError('This invitation has already been accepted.');
        setInvitePreview(null);
      } else if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
        setInviteError('This invitation has expired.');
        setInvitePreview(null);
      } else {
        setInvitePreview(found);
      }
    } catch (e) {
      setInviteError(e.message || 'Error checking invitation.');
    } finally {
      setIsVerifyingInvite(false);
    }
  };

  const handleJoinInviteSubmit = async (e) => {
    e.preventDefault();
    const rawInput = joinCodeInput.trim();
    let clean = rawInput.toUpperCase();
    if (clean.includes('JOIN=')) {
      clean = clean.split('JOIN=')[1].split('&')[0];
    }
    clean = clean.trim();
    if (!clean) return;
    setIsJoining(true);
    setInviteError('');
    try {
      const activeUser = currentUser || { 
        id: auth.currentUser?.uid || 'user-' + Date.now(), 
        uid: auth.currentUser?.uid || 'user-' + Date.now(), 
        email: auth.currentUser?.email || '',
        name: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Team Member'
      };
      // Try accepting with full raw input (handles embedded payload) or clean code
      let res;
      try {
        res = await db.acceptInvitation(rawInput, activeUser);
      } catch (err) {
        res = await db.acceptInvitation(clean, activeUser);
      }
      setJoinSuccess(`Joined ${res.businessName || 'business'} successfully as ${res.role}!`);
      localStorage.setItem('karobaar-active-business', res.businessId);
      localStorage.setItem('karobaar_onboarding_completed', 'true');
      setTimeout(() => {
        window.location.hash = '#/dashboard';
        window.location.reload();
      }, 1000);
    } catch (e) {
      setInviteError(e.message || 'Failed to accept invitation.');
    } finally {
      setIsJoining(false);
    }
  };

  // Step 1: Personal Profile
  const [personal, setPersonal] = useState({
    fullName: (currentUser?.name && !currentUser.name.toLowerCase().includes('sas') && !currentUser.name.toLowerCase().includes('cafeteria')) ? currentUser.name : '',
    countryCode: '+1',
    phone: auth.currentUser?.phoneNumber || '',
    language: 'English'
  });

  const [isPhoneVerified, setIsPhoneVerified] = useState(!!auth.currentUser?.phoneNumber);
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState({ type: '', text: '' }); // type: 'error' | 'success'

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // Response expired.
        }
      });
    }
  };

  const sendVerificationCode = async () => {
    setVerificationMessage({ type: '', text: '' });
    if (!personal.phone) {
      return setVerificationMessage({ type: 'error', text: 'Please enter a phone number' });
    }
    
    let formattedPhone = personal.phone.replace(/[^0-9]/g, '');
    if (formattedPhone.length < 6) {
      return setVerificationMessage({ type: 'error', text: 'Phone number is too short. Please enter a valid number.' });
    }
    let fullPhone = personal.countryCode + formattedPhone;

    try {
      setIsSendingCode(true);
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const user = auth.currentUser;
      
      const confirmationResult = await linkWithPhoneNumber(user, fullPhone, appVerifier);
      window.confirmationResult = confirmationResult;
      setVerificationId(confirmationResult.verificationId);
      setCodeSent(true);
      setVerificationMessage({ type: 'success', text: 'Verification code sent via SMS.' });
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-phone-number') {
        setVerificationMessage({ type: 'error', text: 'Invalid phone number format. Please check your country code and number.' });
      } else if (error.code === 'auth/billing-not-enabled') {
        setVerificationMessage({ type: 'error', text: 'SMS Verification requires Firebase Billing to be enabled. Please upgrade to the Blaze plan in your Firebase Console.' });
      } else {
        setVerificationMessage({ type: 'error', text: error.message });
      }
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then(widgetId => {
          grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async () => {
    setVerificationMessage({ type: '', text: '' });
    if (!verificationCode) return setVerificationMessage({ type: 'error', text: 'Please enter the code' });
    
    try {
      setIsVerifyingCode(true);
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const user = auth.currentUser;
      await linkWithCredential(user, credential);
      
      setIsPhoneVerified(true);
      setCodeSent(false);
      setVerificationMessage({ type: 'success', text: 'Phone number successfully linked!' });
    } catch (error) {
      console.error(error);
      setVerificationMessage({ type: 'error', text: 'Invalid verification code.' });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Step 2: App Experience
  const [appKnowledge, setAppKnowledge] = useState('Newbie'); // 'Newbie', 'Rookie', 'Pro'

  // Step 3: Business Info
  const [business, setBusiness] = useState({
    name: '',
    type: 'Retail',
    category: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pin: '',
    phone: '',
    email: '',
    website: '',
    gst: '',
    currency: 'USD',
    fyStart: 'April',
    timezone: 'UTC'
  });

  // Step 4: Business Size
  const [size, setSize] = useState({
    employees: '1',
    monthlySales: 'Under ₹50,000'
  });

  // Step 5: Modules
  const [modules, setModules] = useState(['sales', 'inventory', 'customers', 'reports']);

  // Step 6: Preferences
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    language: 'English',
    timezone: 'UTC',
    taxSystem: 'GST',
    invoiceFormat: 'INV-{YYYY}-{0000}',
    lowStockThreshold: 5,
    defaultPaymentMethod: 'Cash'
  });

  const [submitState, setSubmitState] = useState(''); // '', 'Saving locally...', 'Saved locally', 'Opening your dashboard...'

  // Early returns strictly AFTER all hooks are called
  if (authStatus === 'authenticated' && !joinParam && !newParam && currentUser?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  const toggleModule = (modId) => {
    setModules(prev => prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]);
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!personal.fullName.trim()) return setError('Full name is required.');
      if (!personal.phone.trim()) return setError('Phone number is required.');
      
      const phoneDigits = personal.phone.replace(/[^0-9]/g, '');
      if (phoneDigits.length < 6) {
        return setError('Please enter a valid phone number (at least 6 digits).');
      }
      
      // Auto-accept if user skipped or didn't receive SMS
      if (!isPhoneVerified) {
        setIsPhoneVerified(true);
      }
    }
    if (step === 3 && !business.name.trim()) return setError('Business name is required.');
    setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      setSetupMode('choose');
    } else {
      setStep(s => s - 1);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitState('Saving locally...');
    setError('');

    try {
      const user = auth.currentUser || currentUser || {
        uid: 'user-' + Date.now(),
        email: (personal.phone ? personal.phone.replace(/[^0-9]/g, '') : 'owner') + '@karobaar.local',
        displayName: personal.fullName || 'Business Owner'
      };
      if (!user) throw new Error("Authentication lost. Please log in again.");

      // 1. Create Business
      const newBusiness = await db.add('businesses', {
        name: business.name,
        type: business.type,
        country: business.country,
        city: business.city,
        ownerId: user.uid,
        ownerEmail: user.email ? user.email.toLowerCase() : '',
        modules: modules.reduce((acc, mod) => ({ ...acc, [mod]: true }), {}),
        settings: {
          currency: preferences.currency,
          dateFormat: preferences.dateFormat,
          lowStockThreshold: Number(preferences.lowStockThreshold) || 5
        }
      });

      if (!newBusiness || !newBusiness.id) {
        throw new Error("Failed to create business profile.");
      }
      
      // 2. Add Membership
      await db.add('members', {
        userId: user.uid,
        role: 'OWNER',
        addedAt: new Date().toISOString()
      }, newBusiness.id, user.uid);

      // 3. Mark Onboarding Complete
      await db.add('users', {
        firebaseUid: user.uid,
        email: user.email,
        name: personal.fullName,
        photoURL: user.photoURL || '',
        phone: personal.phone,
        country: business.country,
        language: personal.language,
        role: 'OWNER', // frontend reference
        memberships: [newBusiness.id],
        accountStatus: 'active',
        appKnowledge: appKnowledge, // Newbie, Rookie, Pro
        personalPreferences: {
          theme: 'light',
          density: 'comfortable',
          layout: 'modern'
        },
        onboardingCompleted: true
      }, null, user.uid);

      setSubmitState('✓ Saved locally');

      // Refresh global state from local cache instantly
      await refreshUserProfile();
      if (newBusiness?.id) {
        db.startRealtimeSync(newBusiness.id);
      }
      
      setSubmitState('Opening your dashboard...');

      // Navigate to dashboard cleanly
      navigate('/dashboard');
    } catch (err) {
      console.error("[SETUP ERROR]", err);
      setError(err.message || 'Unable to save your business information. Please try again.');
      setIsSubmitting(false);
      setSubmitState('');
    }
  };

  const stepsList = setupMode === 'choose' ? [
    { id: 1, title: 'Choose Path', desc: 'Create or join a business' },
    { id: 2, title: 'Configure Workspace', desc: 'Details & initial preferences' },
    { id: 3, title: 'Enter Dashboard', desc: 'Launch your store workspace' }
  ] : setupMode === 'join' ? [
    { id: 1, title: 'Enter Code', desc: 'Input owner invitation code' },
    { id: 2, title: 'Verify Details', desc: 'Confirm role & business' },
    { id: 3, title: 'Enter Workspace', desc: 'Access your team dashboard' }
  ] : [
    { id: 1, title: 'Personal Profile', desc: 'Your contact details' },
    { id: 2, title: 'App Experience', desc: 'Tailor your learning' },
    { id: 3, title: 'Business Details', desc: 'Basic company info' },
    { id: 4, title: 'Business Size', desc: 'Scale and revenue' },
    { id: 5, title: 'Select Modules', desc: 'Features you need' },
    { id: 6, title: 'Preferences', desc: 'Regional settings' }
  ];

  const currentStepNumber = setupMode === 'choose'
    ? 1
    : setupMode === 'join'
      ? (invitePreview ? 2 : 1)
      : step;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <div className="setup-wrapper">
      {/* Left Panel - Visuals & Stepper */}
      <div className="setup-visuals">
        <div className="setup-brand">
          <div className="logo-icon-box">K</div>
          Karobaar OS
        </div>
        
        <div className="setup-progress">
          {stepsList.map((s) => (
            <div 
              key={s.id} 
              className={`progress-step ${currentStepNumber === s.id ? 'active' : ''} ${currentStepNumber > s.id ? 'completed' : ''}`}
            >
              <div className="step-indicator">
                {currentStepNumber > s.id ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  s.id
                )}
              </div>
              <div className="step-text">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <button 
            type="button"
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'var(--text-secondary)',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              width: '100%',
              justifyContent: 'center'
            }}
            onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign out
          </button>
        </div>
      </div>

      {/* Right Panel - Form content */}
      <div className="setup-container">
        <div className={`setup-card ${setupMode === 'choose' ? 'choice-mode' : ''}`}>
          {/* Quick AI Concierge Switcher Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-body, #f4f4f5)',
            border: '1px solid var(--border-color, #e2e8f0)',
            marginBottom: '20px',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--text-main, #09090b)', color: '#fff' }}>
                NEW
              </span>
              <span style={{ fontSize: '0.86rem', color: 'var(--text-main, #09090b)', fontWeight: 600 }}>
                Want the 30-second conversational voice setup instead?
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('karobaar_trigger_ai_onboarding', 'true');
                navigate('/dashboard');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--text-main, #09090b)',
                backgroundColor: 'transparent',
                color: 'var(--text-main, #09090b)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Open AI Concierge ⚡
            </button>
          </div>

          {setupMode === 'choose' ? (
            <div className="setup-choice-screen">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  className="setup-nav-back-btn"
                  onClick={handleLogout}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', fontSize: '0.86rem' }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Sign In</span>
                </button>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Role Selection
                </span>
              </div>

              <div className="setup-header" style={{ marginBottom: '1.25rem' }}>
                <h2>Get Started with Karobaar</h2>
                <p>Choose an option below to set up your workspace according to your role.</p>
              </div>

              <div className="setup-choice-container">
                {/* Question 1: Create a Business */}
                <div 
                  className="setup-choice-card"
                  onClick={() => {
                    setSetupMode('create');
                    setStep(1);
                  }}
                >
                  <div className="setup-choice-top">
                    <div className="setup-choice-icon-wrap">
                      <Building2 size={24} />
                    </div>
                    <span className="setup-choice-badge badge-owner">
                      Owner / Founder
                    </span>
                  </div>

                  <div className="setup-choice-content">
                    <h3>1. Create a Business</h3>
                    <p>
                      Starting or managing your own business? Build a fresh workspace for your shop, retail store, wholesale agency, or company from scratch.
                    </p>
                    <ul className="setup-choice-perks">
                      <li>
                        <CheckCircle2 size={16} />
                        <span>Full administrative ownership & store branding</span>
                      </li>
                      <li>
                        <CheckCircle2 size={16} />
                        <span>Pre-configured POS, Inventory, Invoices & Tax</span>
                      </li>
                      <li>
                        <CheckCircle2 size={16} />
                        <span>Generate secure team invite codes for staff</span>
                      </li>
                    </ul>
                  </div>

                  <div className="setup-choice-action">
                    <span>Create Business Workspace</span>
                    <ArrowRight size={18} />
                  </div>
                </div>

                {/* Question 2: Join an Existing Business */}
                <div 
                  className="setup-choice-card"
                  onClick={() => {
                    setSetupMode('join');
                  }}
                >
                  <div className="setup-choice-top">
                    <div className="setup-choice-icon-wrap">
                      <Users size={24} />
                    </div>
                    <span className="setup-choice-badge badge-staff">
                      Staff / Cashier / Manager
                    </span>
                  </div>

                  <div className="setup-choice-content">
                    <h3>2. Join a Business</h3>
                    <p>
                      Invited by your store owner or manager? Enter your invitation code (KB-INV-XXXXX) to instantly connect to your team's live workspace.
                    </p>
                    <ul className="setup-choice-perks">
                      <li>
                        <CheckCircle2 size={16} />
                        <span>Instant access — zero business configuration needed</span>
                      </li>
                      <li>
                        <CheckCircle2 size={16} />
                        <span>Pre-assigned role permissions (Manager, Cashier, etc.)</span>
                      </li>
                      <li>
                        <CheckCircle2 size={16} />
                        <span>Live multi-user sync with real-time stock & sales</span>
                      </li>
                    </ul>
                  </div>

                  <div className="setup-choice-action">
                    <span>Join with Invite Code</span>
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Top Navigation Bar: Back & Step Indicator */}
              <div className="setup-top-nav">
                <button
                  type="button"
                  className="setup-nav-back-btn"
                  onClick={() => setSetupMode('choose')}
                  style={{ fontWeight: 700 }}
                >
                  <ArrowLeft size={16} />
                  <span>← Back to Selection</span>
                </button>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {setupMode === 'create' ? `Step ${step} of 6: New Business Onboarding` : 'Redeem Business Invitation'}
                </div>
              </div>

              {/* Mode Switcher: Create vs Join */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                marginBottom: '24px',
                gap: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => { setSetupMode('create'); setStep(1); }}
                  style={{
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: setupMode === 'create' ? '2.5px solid var(--text-main, #09090b)' : '2.5px solid transparent',
                    color: setupMode === 'create' ? 'var(--text-main, #09090b)' : 'var(--text-secondary, #64748b)',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Building2 size={16} />
                  <span>Create New Business</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSetupMode('join')}
                  style={{
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: setupMode === 'join' ? '2.5px solid var(--text-main, #09090b)' : '2.5px solid transparent',
                    color: setupMode === 'join' ? 'var(--text-main, #09090b)' : 'var(--text-secondary, #64748b)',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Link size={16} />
                  <span>Join with Invite Code</span>
                </button>
              </div>

              {setupMode === 'join' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="setup-header" style={{ marginBottom: '12px' }}>
                <h2>Join an Existing Workspace</h2>
                <p>Enter the invitation code provided by your business owner.</p>
              </div>

              {inviteError && (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                  {inviteError}
                </div>
              )}

              {joinSuccess && (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                  {joinSuccess} Redirecting to your dashboard...
                </div>
              )}

              <form onSubmit={handleJoinInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="setup-form-group full-width">
                  <label>Invitation Code</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="setup-input"
                      value={joinCodeInput}
                      onChange={e => {
                        const val = e.target.value.toUpperCase();
                        setJoinCodeInput(val);
                        setInviteError('');
                        if (val.length >= 11 || val.includes('JOIN=') || val.includes('DATA=')) {
                          verifyInviteCode(val);
                        }
                      }}
                      placeholder="KB-INV-XXXXX"
                      style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => verifyInviteCode()}
                      disabled={isVerifyingInvite}
                      style={{
                        padding: '0 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isVerifyingInvite ? 'Checking...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {invitePreview && (
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--text-main)',
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        Invitation Verified
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--text-main)', color: 'var(--bg-body)' }}>
                        {invitePreview.role}
                      </span>
                    </div>

                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {invitePreview.businessName || 'Business Workspace'}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Invited by: <strong>{invitePreview.invitedByName || 'Owner'}</strong>
                    </div>

                    {invitePreview.notes && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        "{invitePreview.notes}"
                      </div>
                    )}
                  </div>
                )}

                <div className="setup-footer" style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    className="setup-btn setup-btn-secondary"
                    onClick={() => setSetupMode('choose')}
                    disabled={isJoining}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Selection</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isJoining || !joinCodeInput.trim()}
                    className="setup-btn setup-btn-primary"
                  >
                    {isJoining ? 'Joining Workspace...' : 'Accept Invitation & Enter Dashboard'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
          <div className="setup-header">
            <h2>{stepsList[step - 1]?.title || 'Business Setup'}</h2>
            <p>{stepsList[step - 1]?.desc || 'Configure your business parameters'}</p>
          </div>

          {error && <div className="setup-error">{error}</div>}

          <form onSubmit={step === 6 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            
            {step === 1 && (
              <div className="step-content setup-form-grid">
                <div id="recaptcha-container"></div>
                <div className="setup-form-group full-width">
                  <label>Full Name</label>
                  <input type="text" className="setup-input" value={personal.fullName} onChange={e => setPersonal({...personal, fullName: e.target.value})} required placeholder="Enter your full name"/>
                </div>
                <div className="setup-form-group full-width">
                  <label>Phone Number</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ width: '130px', flexShrink: 0 }}>
                      {codeSent || isPhoneVerified ? (
                        <div className="setup-input" style={{ background: '#f5f5f5', color: '#666', border: '1px solid #e5e7eb', height: '100%', display: 'flex', alignItems: 'center' }}>
                          {personal.countryCode}
                        </div>
                      ) : (
                        <CustomSelect 
                          options={finalCountryPhoneOptions} 
                          value={personal.countryCode} 
                          onChange={(e) => setPersonal({...personal, countryCode: e.target.value})}
                        />
                      )}
                    </div>
                    <input 
                      type="tel" 
                      className="setup-input" 
                      value={personal.phone} 
                      onChange={e => {
                        const onlyNums = e.target.value.replace(/[^0-9\s-]/g, '');
                        const digitCount = onlyNums.replace(/[^0-9]/g, '').length;
                        const maxLen = PHONE_LENGTHS[personal.countryCode] || 15;
                        
                        if (digitCount <= maxLen) {
                          setPersonal({...personal, phone: onlyNums});
                          if (isPhoneVerified) setIsPhoneVerified(false);
                        }
                      }} 
                      disabled={isPhoneVerified || codeSent}
                      placeholder="555 000 0000"
                      style={{ flex: 1 }}
                    />
                    {!isPhoneVerified && !codeSent && (
                      <Button type="button" onClick={sendVerificationCode} disabled={isSendingCode || !personal.phone}>
                        {isSendingCode ? 'Sending...' : 'Verify'}
                      </Button>
                    )}
                    {isPhoneVerified && (
                      <div style={{ display: 'flex', alignItems: 'center', color: '#16a34a', padding: '0 0.5rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      </div>
                    )}
                  </div>
                  
                  {codeSent && !isPhoneVerified && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="setup-input" 
                        value={verificationCode} 
                        onChange={e => {
                          const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                          if (onlyNums.length <= 6) {
                            setVerificationCode(onlyNums);
                          }
                        }} 
                        placeholder="6-digit OTP"
                        style={{ flex: 1 }}
                      />
                      <Button type="button" onClick={verifyCode} disabled={isVerifyingCode || !verificationCode}>
                        {isVerifyingCode ? 'Verifying...' : 'Submit OTP'}
                      </Button>
                    </div>
                  )}
                  {verificationMessage.text && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: verificationMessage.type === 'error' ? 'var(--text-danger, #dc2626)' : 'var(--text-success, #16a34a)' }}>
                      {verificationMessage.text}
                    </div>
                  )}
                  {!isPhoneVerified && (
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPhoneVerified(true);
                          setVerificationMessage({ type: 'success', text: 'Phone verification skipped for this session.' });
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary, #71717a)',
                          fontSize: '0.82rem',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: '0'
                        }}
                      >
                        Skip SMS verification & continue directly
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step-content">
                <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem'}}>
                  How familiar are you with business management applications? This helps us tailor your experience.
                </p>
                <div className="setup-modules-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div 
                    className={`module-card ${appKnowledge === 'Newbie' ? 'selected' : ''}`}
                    onClick={() => setAppKnowledge('Newbie')}
                    style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="module-checkbox">
                        {appKnowledge === 'Newbie' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <span style={{fontWeight: 600, fontSize: '1.05rem'}}>Newbie</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '1.75rem', lineHeight: 1.4 }}>
                      I'm new to business management apps and need step-by-step guidance.
                    </span>
                  </div>

                  <div 
                    className={`module-card ${appKnowledge === 'Rookie' ? 'selected' : ''}`}
                    onClick={() => setAppKnowledge('Rookie')}
                    style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="module-checkbox">
                        {appKnowledge === 'Rookie' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <span style={{fontWeight: 600, fontSize: '1.05rem'}}>Rookie</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '1.75rem', lineHeight: 1.4 }}>
                      I have some experience with these tools, but might need occasional help.
                    </span>
                  </div>

                  <div 
                    className={`module-card ${appKnowledge === 'Pro' ? 'selected' : ''}`}
                    onClick={() => setAppKnowledge('Pro')}
                    style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="module-checkbox">
                        {appKnowledge === 'Pro' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <span style={{fontWeight: 600, fontSize: '1.05rem'}}>Pro</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '1.75rem', lineHeight: 1.4 }}>
                      I'm an experienced user and know exactly what I'm doing. No instructions needed.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-content setup-form-grid">
                <div className="setup-form-group full-width">
                  <label>Business Name</label>
                  <input type="text" className="setup-input" value={business.name} onChange={e => setBusiness({...business, name: e.target.value})} required placeholder="Acme Corporation"/>
                </div>
                <div className="setup-form-group">
                  <label>Business Type</label>
                  <CustomSelect 
                    value={business.type} 
                    onChange={e => setBusiness({...business, type: e.target.value})}
                    placeholder="Select Type"
                    options={[
                      {value: 'Retail', label: 'Retail'},
                      {value: 'Wholesale', label: 'Wholesale'},
                      {value: 'E-commerce', label: 'E-commerce'},
                      {value: 'Services', label: 'Services'},
                      {value: 'Manufacturing', label: 'Manufacturing'},
                      {value: 'Cafeteria / Restaurant', label: 'Cafeteria / Restaurant'},
                      {value: 'Other', label: 'Other'}
                    ]}
                  />
                </div>
                <div className="setup-form-group">
                  <label>Tax/GST Number (Optional)</label>
                  <input type="text" className="setup-input" value={business.gst} onChange={e => setBusiness({...business, gst: e.target.value})} placeholder="e.g. 22AAAAA0000A1Z5"/>
                </div>
                <div className="setup-form-group">
                  <label>Country</label>
                  <CustomSelect 
                    value={business.country} 
                    onChange={e => setBusiness({...business, country: e.target.value, city: ''})}
                    placeholder="Select Country"
                    options={[
                      ...ALL_COUNTRIES.map(c => ({value: c.name, label: c.name})),
                      {value: 'Other', label: 'Other'}
                    ]}
                  />
                </div>
                <div className="setup-form-group">
                  <label>City</label>
                  {business.country && getCitiesForCountry(business.country).length > 0 ? (
                    <CustomSelect 
                      value={business.city} 
                      onChange={e => setBusiness({...business, city: e.target.value})}
                      placeholder="Select a city"
                      options={[
                        ...getCitiesForCountry(business.country).map(city => ({value: city, label: city})),
                        {value: 'Other', label: 'Other (Type manually)'}
                      ]}
                    />
                  ) : (
                    <input type="text" className="setup-input" value={business.city} onChange={e => setBusiness({...business, city: e.target.value})} placeholder={business.country ? "Type your city" : "Select a country first"} />
                  )}
                  {business.city === 'Other' && (
                     <input type="text" className="setup-input" style={{marginTop: '0.5rem'}} onChange={e => setBusiness({...business, city: e.target.value})} placeholder="Enter your city name" autoFocus />
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="step-content setup-form-grid">
                <div className="setup-form-group full-width">
                  <label>Number of Employees</label>
                  <CustomSelect 
                    value={size.employees} 
                    onChange={e => setSize({...size, employees: e.target.value})}
                    placeholder="Select employees count"
                    options={[
                      {value: 'Just me (1)', label: 'Just me (1)'},
                      {value: '2–5', label: '2–5'},
                      {value: '6–10', label: '6–10'},
                      {value: '11–25', label: '11–25'},
                      {value: '26-50', label: '26-50'},
                      {value: '100+', label: '100+'}
                    ]}
                  />
                </div>
                <div className="setup-form-group full-width">
                  <label>Monthly Sales Range</label>
                  <CustomSelect 
                    value={size.monthlySales} 
                    onChange={e => setSize({...size, monthlySales: e.target.value})}
                    placeholder="Select sales range"
                    options={[
                      {value: 'Under ₹50,000', label: 'Under ₹50,000'},
                      {value: '₹50,000–₹1 lakh', label: '₹50,000–₹1 lakh'},
                      {value: '₹1–5 lakh', label: '₹1–5 lakh'},
                      {value: '₹5–10 lakh', label: '₹5–10 lakh'},
                      {value: '₹50 lakh+', label: '₹50 lakh+'}
                    ]}
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="step-content">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                  <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem'}}>Select features you need. You can always change this later in Settings.</p>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (modules.length === MODULES_LIST.length) {
                        setModules([]);
                      } else {
                        setModules(MODULES_LIST.map(m => m.id));
                      }
                    }}
                    style={{background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline'}}
                  >
                    {modules.length === MODULES_LIST.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="setup-modules-grid">
                  {MODULES_LIST.map(mod => {
                    const isSelected = modules.includes(mod.id);
                    return (
                      <div 
                        key={mod.id} 
                        className={`module-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleModule(mod.id)}
                      >
                        <div className="module-checkbox">
                          {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <span style={{fontWeight: isSelected ? 600 : 400, fontSize: '0.9rem'}}>{mod.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="step-content setup-form-grid">
                <div className="setup-form-group">
                  <label>Currency</label>
                  <CustomSelect 
                    value={preferences.currency} 
                    onChange={e => setPreferences({...preferences, currency: e.target.value})}
                    placeholder="Select Currency"
                    options={[
                      {value: 'USD', label: 'USD ($)'},
                      {value: 'EUR', label: 'EUR (€)'},
                      {value: 'INR', label: 'INR (₹)'},
                      {value: 'GBP', label: 'GBP (£)'},
                      {value: 'PKR', label: 'PKR (Rs)'},
                      {value: 'AED', label: 'AED (د.إ)'},
                      {value: 'CAD', label: 'CAD ($)'},
                      {value: 'AUD', label: 'AUD ($)'}
                    ]}
                  />
                </div>
                <div className="setup-form-group">
                  <label>Date Format</label>
                  <CustomSelect 
                    value={preferences.dateFormat} 
                    onChange={e => setPreferences({...preferences, dateFormat: e.target.value})}
                    placeholder="Select Date Format"
                    options={[
                      {value: 'DD/MM/YYYY', label: 'DD/MM/YYYY'},
                      {value: 'MM/DD/YYYY', label: 'MM/DD/YYYY'},
                      {value: 'YYYY-MM-DD', label: 'YYYY-MM-DD'}
                    ]}
                  />
                </div>
                <div className="setup-form-group full-width">
                  <label>Low Stock Alert Threshold</label>
                  <input type="number" className="setup-input" value={preferences.lowStockThreshold} onChange={e => setPreferences({...preferences, lowStockThreshold: Number(e.target.value)})} min="0"/>
                </div>
              </div>
            )}

            <div className="setup-footer">
              <button 
                type="button" 
                className="setup-btn setup-btn-secondary" 
                onClick={handleBack} 
                disabled={isSubmitting}
              >
                <ArrowLeft size={16} />
                <span>{step === 1 ? 'Back to Selection' : 'Previous'}</span>
              </button>
              
              <button type="submit" className="setup-btn setup-btn-primary" disabled={isSubmitting}>
                {submitState || (isSubmitting ? 'Saving...' : step === 6 ? 'Finish Setup' : 'Continue')}
              </button>
            </div>
          </form>
          </>
          )}
        </>
        )}
        </div>
      </div>
    </div>
  );
};

export default BusinessSetup;
