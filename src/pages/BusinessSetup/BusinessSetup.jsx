import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../services/databaseService';
import { Button } from '../../components/ui/Button';
import { auth } from '../../services/firebase';
import { signOut, RecaptchaVerifier, linkWithPhoneNumber, PhoneAuthProvider } from 'firebase/auth';
import { Country, City } from 'country-state-city';
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

  const isAuthLoading = authStatus === 'loading';

  // If the user has already completed setup, do not let them stay on this page
  if (authStatus === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Personal Profile
  const [personal, setPersonal] = useState({
    fullName: currentUser?.name || '',
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

  if (authStatus === 'unauthenticated' || authStatus === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
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
      if (phoneDigits.length < 10) {
        return setError('Please enter a valid phone number (at least 10 digits).');
      }
      
      if (!isPhoneVerified) {
        return setError('Please verify your phone number via SMS before continuing.');
      }
    }
    if (step === 3 && !business.name.trim()) return setError('Business name is required.');
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);
  const [submitState, setSubmitState] = useState(''); // '', 'Saving locally...', 'Saved locally', 'Opening your dashboard...'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitState('Saving locally...');
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication lost. Please log in again.");

      // 1. Create Business
      const newBusiness = await db.add('businesses', {
        name: business.name,
        type: business.type,
        country: business.country,
        city: business.city,
        ownerId: user.uid,
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

  const stepsList = [
    { id: 1, title: 'Personal Profile', desc: 'Your contact details' },
    { id: 2, title: 'App Experience', desc: 'Tailor your learning' },
    { id: 3, title: 'Business Details', desc: 'Basic company info' },
    { id: 4, title: 'Business Size', desc: 'Scale and revenue' },
    { id: 5, title: 'Select Modules', desc: 'Features you need' },
    { id: 6, title: 'Preferences', desc: 'Regional settings' }
  ];

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
              className={`progress-step ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}
            >
              <div className="step-indicator">
                {step > s.id ? (
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
        <div className="setup-card">
          <div className="setup-header">
            <h2>{stepsList[step - 1].title}</h2>
            <p>{stepsList[step - 1].desc}</p>
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
                disabled={isSubmitting || step === 1}
                style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
              >
                Previous
              </button>
              
              <button type="submit" className="setup-btn setup-btn-primary" disabled={isSubmitting}>
                {submitState || (isSubmitting ? 'Saving...' : step === 6 ? 'Finish Setup' : 'Continue')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessSetup;
