import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { auth, googleProvider, githubProvider } from '../../services/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '../../components/ui/Button';
import { Code, Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import { Country } from 'country-state-city';
import './Login.css';

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
        className="form-input" 
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

// Generate country code options once
const countryOptions = Country.getAllCountries().map(c => {
  const cleanCode = '+' + c.phonecode.replace(/[^0-9]/g, '');
  return {
    value: cleanCode,
    label: `${c.isoCode} (${cleanCode}) ${c.name}`
  };
});

// Add a few popular ones at the top to make it easier, then the full list
const topPhoneCodes = ['+1', '+44', '+91', '+92', '+971'].map(code => 
  countryOptions.find(c => c.value === code)
).filter(Boolean);

const finalCountryOptions = [...topPhoneCodes, { value: '', label: '--- All Countries ---' }, ...countryOptions];

const PHONE_LENGTHS = {
  '+1': 10,   // US/Canada
  '+44': 10,  // UK
  '+91': 10,  // India
  '+92': 10,  // Pakistan
  '+971': 9,  // UAE
  '+61': 9,   // Australia
  '+86': 11,  // China
  '+49': 11,  // Germany
  '+33': 9,   // France
  '+81': 10,  // Japan
};

const Login = () => {
  const [loginMethod, setLoginMethod] = useState('email');
  const [countryCode, setCountryCode] = useState('+1');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifierLogin) {
      window.recaptchaVerifierLogin = new RecaptchaVerifier(auth, 'login-recaptcha-container', {
        'size': 'invisible'
      });
    }
  };

  const handleSendCode = async () => {
    setGeneralError('');
    setSuccessMessage('');
    if (!phoneNumber) return setErrors({ phone: 'Phone number is required' });
    
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.length < 6) {
      return setErrors({ phone: 'Phone number is too short. Please enter a valid number.' });
    }
    let fullPhone = countryCode + formattedPhone;
    
    try {
      setIsAuthenticating(true);
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifierLogin;
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      window.loginConfirmationResult = confirmationResult;
      setVerificationId(confirmationResult.verificationId);
      setCodeSent(true);
      setSuccessMessage('An SMS verification code has been sent to your phone.');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-phone-number') {
        setErrors({ phone: 'Invalid phone number format. Please check your country code and number.' });
      } else if (error.code === 'auth/billing-not-enabled') {
        setGeneralError('SMS Verification requires Firebase Billing to be enabled. Please upgrade to the Blaze plan in your Firebase Console.');
      } else {
        setGeneralError(error.message);
      }
      if (window.recaptchaVerifierLogin) {
        window.recaptchaVerifierLogin.render().then(widgetId => grecaptcha.reset(widgetId));
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleVerifyCode = async () => {
    setGeneralError('');
    if (!verificationCode) return setErrors({ code: 'Verification code is required' });
    
    try {
      setIsAuthenticating(true);
      const result = await window.loginConfirmationResult.confirm(verificationCode);
      // Success is handled by AppContext
    } catch (error) {
      console.error(error);
      setGeneralError('Invalid verification code. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const { authStatus, authError } = useAppContext();
  const navigate = useNavigate();

  // Platform Detection
  const isNative = (typeof window !== 'undefined' && window.location.protocol === 'file:') || 
                   (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) ||
                   (typeof navigator !== 'undefined' && navigator.userAgent.includes('KarobaarApp'));

  const isAuthLoading = authStatus === 'loading';

  // Handle potential errors from redirect
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        await getRedirectResult(auth);
      } catch (error) {
        console.error("Redirect Auth Error:", error);
        if (error.code === 'auth/network-request-failed') {
          setGeneralError('Network error. Please check your internet connection.');
        } else if (error.code === 'auth/unauthorized-domain') {
          setGeneralError('This domain is not authorized for Authentication.');
        } else if (error.code === 'auth/account-exists-with-different-credential') {
          setGeneralError('An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.');
        } else {
          setGeneralError('Authentication failed. Please try again.');
        }
      }
    };
    checkRedirectResult();
  }, []);

  const [typedText, setTypedText] = useState('');
  const fullText = "The Complete Business Operating System.";

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, []);

  // Redirect if already authenticated
  if (authStatus === 'pending_onboarding') {
    return <Navigate to="/setup" replace />;
  }
  if (authStatus === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSocialLogin = async (provider) => {
    setGeneralError('');
    setIsAuthenticating(true);
    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
      // Success is handled by onAuthStateChanged in AppContext or getRedirectResult
    } catch (error) {
      console.error("Firebase Auth Error:", error);
      setIsAuthenticating(false);
      if (error.code === 'auth/popup-closed-by-user') {
        setGeneralError('Sign-in cancelled.');
      } else {
        setGeneralError(`Error: ${error.message}`);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email address is required';
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleManualAuth = async (e) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validateForm()) return;

    setIsAuthenticating(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Success will be caught by Context onAuthStateChanged
    } catch (error) {
      console.error("Manual Auth Error:", error);
      setIsAuthenticating(false);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
        setGeneralError('No Karobaar workspace found for this email address. Please create an account or verify your credentials.');
      } else if (error.code === 'auth/wrong-password') {
        setGeneralError('Invalid password. Please try again or reset your password.');
      } else if (error.code === 'auth/email-already-in-use') {
        setGeneralError('An account with this email already exists.');
      } else {
        setGeneralError(error.message || 'Authentication failed.');
      }
    }
  };

  const handleResetPassword = async () => {
    setGeneralError('');
    setSuccessMessage('');
    if (!email.trim()) {
      setErrors({ email: 'Please enter your email address first to reset your password.' });
      return;
    }
    
    setIsAuthenticating(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('A password reset link has been sent directly to your email address.');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        setGeneralError('No Karobaar workspace found for this email address.');
      } else {
        setGeneralError(error.message);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };


  return (
    <div className="login-wrapper">
      {/* Left side: Branding and Visuals */}
      <div className="login-visuals">
        <div className="visuals-content">
          <div className="visual-logo">
            <span className="logo-icon-box">K</span>
            Karobaar
          </div>
          <h1 className="visual-title">
            {typedText}
            <span className="typing-cursor">|</span>
          </h1>
          <p className="visual-subtitle">
            Manage inventory, sales, payroll, and tasks seamlessly in one unified platform.
          </p>
          
          <div className="visual-features">
            <div className="feature-pill" style={{ animationDelay: '0.1s' }}>Smart POS</div>
            <div className="feature-pill" style={{ animationDelay: '0.2s' }}>Inventory Tracking</div>
            <div className="feature-pill" style={{ animationDelay: '0.3s' }}>Payroll Management</div>
          </div>
        </div>
        <div className="visual-background-shape"></div>
      </div>

      {/* Right side: Login Card */}
      <div className="login-container">
        <div className="login-card-wrapper">
          <div className="login-header">
            <h2 className="login-title">{isRegistering ? 'Create an account' : 'Welcome back'}</h2>
            <p className="login-subtitle">
              {isRegistering ? 'Join Karobaar and set up your workspace.' : 'Sign in to your Karobaar workspace.'}
            </p>
          </div>

          <div className="login-card">
            {(generalError || authError) && (
              <div className="error-banner animate-shake">
                {generalError || authError}
              </div>
            )}
            
            {successMessage && (
              <div className="error-banner" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                {successMessage}
              </div>
            )}

            <div className="login-tabs" style={{ display: 'flex', marginBottom: '1.5rem', gap: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => {setLoginMethod('email'); setGeneralError(''); setSuccessMessage('');}} 
                style={{ flex: 1, padding: '0.6rem', background: loginMethod === 'email' ? 'var(--text-main, #000)' : 'transparent', color: loginMethod === 'email' ? '#fff' : '#666', fontWeight: 600, border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Email
              </button>
              <button 
                type="button" 
                onClick={() => {setLoginMethod('phone'); setGeneralError(''); setSuccessMessage('');}} 
                style={{ flex: 1, padding: '0.6rem', background: loginMethod === 'phone' ? 'var(--text-main, #000)' : 'transparent', color: loginMethod === 'phone' ? '#fff' : '#666', fontWeight: 600, border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Phone
              </button>
            </div>

            <div id="login-recaptcha-container"></div>

            {loginMethod === 'email' ? (
              <form onSubmit={handleManualAuth} className={`manual-auth-form form-transition-enter`} key={`email-${isRegistering}`} style={{ position: 'relative', zIndex: 10 }}>
                <div className="form-group">
                  <label>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: null}) }}
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                    placeholder="name@company.com"
                    disabled={isAuthenticating || authStatus === 'loading'}
                  />
                  {errors.email && <span className="input-error-msg">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ marginBottom: 0 }}>Password</label>
                    {!isRegistering && (
                      <button 
                        type="button" 
                        onClick={handleResetPassword} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="password-input-wrapper" style={{ marginTop: '0.5rem' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password: null}) }}
                      className={`form-input ${errors.password ? 'input-error' : ''}`}
                      placeholder={isRegistering ? 'Create a password (min 6 chars)' : 'Enter your password'}
                      disabled={isAuthenticating || authStatus === 'loading'}
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="eye-icon">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="eye-icon">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <span className="input-error-msg">{errors.password}</span>}
                </div>

                <Button 
                  type="submit" 
                  className={`login-submit-btn ${isAuthenticating || isAuthLoading ? 'loading' : ''}`}
                  disabled={isAuthenticating || isAuthLoading}
                >
                  {isAuthenticating ? (
                    <div className="btn-loader"></div>
                  ) : (
                    isRegistering ? 'Create account' : 'Sign in to workspace'
                  )}
                </Button>
              </form>
            ) : (
              <div className="manual-auth-form form-transition-enter" key={`phone-${isRegistering}`} style={{ position: 'relative', zIndex: 10 }}>
                <div className="form-group">
                  <label>Phone Number</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ width: '120px', flexShrink: 0 }}>
                      {codeSent ? (
                        <div className="form-input" style={{ background: '#f5f5f5', color: '#666', border: '1px solid #e5e7eb' }}>
                          {countryCode}
                        </div>
                      ) : (
                        <CustomSelect 
                          options={finalCountryOptions} 
                          value={countryCode} 
                          onChange={(e) => setCountryCode(e.target.value)}
                        />
                      )}
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => { 
                        const onlyNums = e.target.value.replace(/[^0-9\s-]/g, '');
                        const digitCount = onlyNums.replace(/[^0-9]/g, '').length;
                        const maxLen = PHONE_LENGTHS[countryCode] || 15;
                        
                        if (digitCount <= maxLen) {
                          setPhoneNumber(onlyNums); 
                          if(errors.phone) setErrors({...errors, phone: null});
                        }
                      }}
                      className={`form-input ${errors.phone ? 'input-error' : ''}`}
                      placeholder="555 000 0000"
                      disabled={isAuthenticating || authStatus === 'loading' || codeSent}
                      style={{ flex: 1 }}
                    />
                  </div>
                  {errors.phone && <span className="input-error-msg">{errors.phone}</span>}
                </div>
                
                {codeSent && (
                  <div className="form-group">
                    <label>6-digit OTP</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => { 
                        const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                        if (onlyNums.length <= 6) {
                          setVerificationCode(onlyNums); 
                          if(errors.code) setErrors({...errors, code: null});
                        }
                      }}
                      className={`form-input ${errors.code ? 'input-error' : ''}`}
                      placeholder="123456"
                      disabled={isAuthenticating || authStatus === 'loading'}
                    />
                    {errors.code && <span className="input-error-msg">{errors.code}</span>}
                  </div>
                )}
                
                {!codeSent ? (
                  <Button 
                    type="button" 
                    className="login-submit-btn" 
                    onClick={handleSendCode}
                    disabled={isAuthenticating || authStatus === 'loading' || !phoneNumber}
                  >
                    {isAuthenticating ? <div className="btn-loader"></div> : 'Send Code'}
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    className="login-submit-btn" 
                    onClick={handleVerifyCode}
                    disabled={isAuthenticating || authStatus === 'loading' || !verificationCode}
                  >
                    {isAuthenticating ? <div className="btn-loader"></div> : 'Verify & Sign In'}
                  </Button>
                )}
              </div>
            )}

            {/* Social Login - Hidden on Native Mobile due to WebView popup restrictions */}
            {!isNative && (
              <>
                <div className="login-divider">
                  <span>Or continue with</span>
                </div>

                <div className="social-auth-container">
                  <button 
                    onClick={() => handleSocialLogin(googleProvider)}
                    className={`social-auth-btn ${isAuthenticating || isAuthLoading ? 'loading' : ''}`}
                    type="button"
                    disabled={isAuthenticating || isAuthLoading}
                  >
                    <div className="btn-bg-slide"></div>
                    <div className="btn-content">
                      {isAuthenticating || isAuthLoading ? (
                        <div className="spinner"></div>
                      ) : (
                        <>
                          <svg className="social-icon" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          <span>Google</span>
                        </>
                      )}
                    </div>
                  </button>

                  <button 
                    onClick={() => handleSocialLogin(githubProvider)}
                    className={`social-auth-btn ${isAuthenticating || isAuthLoading ? 'loading' : ''}`}
                    type="button"
                    disabled={isAuthenticating || isAuthLoading}
                  >
                    <div className="btn-bg-slide"></div>
                    <div className="btn-content">
                      {isAuthenticating || isAuthLoading ? (
                        <div className="spinner"></div>
                      ) : (
                        <>
                          <Code className="social-icon" />
                          <span>GitHub</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </>
            )}


            <div className="toggle-mode-text">
              {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
              <button 
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setErrors({}); setGeneralError(''); }}
                className="toggle-mode-link"
              >
                {isRegistering ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
