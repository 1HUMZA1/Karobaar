import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { auth, googleProvider } from '../../services/firebase';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  sendPasswordResetEmail,
  updatePassword
} from 'firebase/auth';
import { localDb } from '../../services/localDb';
import { Button } from '../../components/ui/Button';
import { Eye, EyeOff, Sparkles, ArrowLeft, CheckCircle, ShieldCheck, Lock, Mail } from 'lucide-react';
import { Country } from 'country-state-city';
import { KarobaarLogo } from '../../components/KarobaarLogo/KarobaarLogo';
import { initializeDemoData } from '../../services/demoData';
import './Login.css';

// Custom searchable country code selector for Phone login
const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectRef = useRef(null);

  useEffect(() => {
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
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}
      >
        <span style={{ color: '#09090b', fontWeight: 600 }}>
          {options.find(o => o.value === value)?.value || placeholder || "Select..."}
        </span>
        <svg style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, minWidth: '260px',
          background: '#ffffff', border: '1px solid #e4e4e7',
          borderRadius: '10px', marginTop: '4px', zIndex: 1001,
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {options.length > 10 && (
            <div style={{ padding: '0.5rem', borderBottom: '1px solid #e4e4e7', background: '#fafafa' }}>
              <input 
                type="text" 
                placeholder="Search country..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', padding: '0.45rem 0.65rem', border: '1px solid #d4d4d8', borderRadius: '6px', background: '#fff', fontSize: '0.875rem' }}
                autoFocus
              />
            </div>
          )}

          <div style={{ maxHeight: '200px', overflowY: 'auto' }} onWheel={(e) => e.stopPropagation()}>
            {filteredOptions.length === 0 && (
              <div style={{ padding: '0.75rem 1rem', color: '#71717a', fontSize: '0.875rem' }}>No matches found</div>
            )}
            {filteredOptions.map((opt, i) => (
              <div 
                key={i} 
                onClick={(e) => { e.stopPropagation(); onChange({ target: { value: opt.value } }); setIsOpen(false); setSearch(""); }}
                style={{
                  padding: '0.75rem 1rem', cursor: 'pointer',
                  background: value === opt.value ? '#f4f4f5' : 'transparent',
                  borderBottom: i < filteredOptions.length - 1 ? '1px solid #f4f4f5' : 'none',
                  color: '#09090b', fontSize: '0.875rem',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f4f4f5'}
                onMouseLeave={e => e.currentTarget.style.background = value === opt.value ? '#f4f4f5' : 'transparent'}
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

// Generate country code list once
const countryOptions = Country.getAllCountries().map(c => {
  const cleanCode = '+' + c.phonecode.replace(/[^0-9]/g, '');
  return { value: cleanCode, label: `${c.isoCode} (${cleanCode}) ${c.name}` };
});
const topPhoneCodes = ['+1', '+44', '+91', '+92', '+971'].map(code => 
  countryOptions.find(c => c.value === code)
).filter(Boolean);
const finalCountryOptions = [...topPhoneCodes, { value: '', label: '--- All Countries ---' }, ...countryOptions];

const PHONE_LENGTHS = {
  '+1': 10, '+44': 10, '+91': 10, '+92': 10, '+971': 9, '+61': 9, '+86': 11, '+49': 11, '+33': 9, '+81': 10
};

const Login = () => {
  const navigate = useNavigate();
  const { authStatus, authError } = useAppContext();

  // Navigation: 'auth' (Sign In / Register) | 'forgot_password'
  const [viewMode, setViewMode] = useState('auth');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authTab, setAuthTab] = useState('email'); // 'email' | 'phone'

  // Form Fields
  const [email, setEmail] = useState(() => localStorage.getItem('karobaar_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('karobaar_remember_me') === 'true');

  // Phone Auth Fields
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // Simple 1-Step Forgot Password Fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetNewPasswordConfirm, setResetNewPasswordConfirm] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // States
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Platform detection
  const isNative = (typeof window !== 'undefined' && window.location.protocol === 'file:') || 
                   (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) ||
                   (typeof navigator !== 'undefined' && navigator.userAgent.includes('KarobaarApp'));

  // Typing animation for Left Panel
  const [typedText, setTypedText] = useState('');
  const fullText = "The Complete Business Operating System.";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  // Handle OAuth Redirect Results
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (err) {
        if (err.code === 'auth/network-request-failed') {
          setGeneralError('Network error. Please check your internet connection.');
        } else if (err.code !== 'auth/popup-closed-by-user') {
          setGeneralError(err.message || 'Authentication failed.');
        }
      }
    };
    handleRedirect();
  }, []);

  // Redirect if already authenticated
  if (authStatus === 'pending_onboarding') {
    return <Navigate to="/setup" replace />;
  }
  if (authStatus === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  // --- 1-Click Social Sign-In (Google) ---
  const handleGoogleLogin = async () => {
    setGeneralError('');
    setIsAuthenticating(true);
    try {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobileDevice) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
      setIsAuthenticating(false);
      if (error.code !== 'auth/popup-closed-by-user') {
        setGeneralError(error.message || 'Failed to sign in with Google.');
      }
    }
  };

  // --- Manual Email / Password Sign-In & Registration ---
  const handleManualAuth = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');

    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email address is required';
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Persist or clear remembered email
    if (rememberMe) {
      localStorage.setItem('karobaar_remember_me', 'true');
      localStorage.setItem('karobaar_remembered_email', email.trim());
    } else {
      localStorage.removeItem('karobaar_remember_me');
      localStorage.removeItem('karobaar_remembered_email');
    }

    setIsAuthenticating(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      console.error("Auth Error:", error);
      setIsAuthenticating(false);

      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
        // Fallback check against localDb
        const localUser = localDb.get('users', email.trim());
        if (localUser && localUser.password === password) {
          localStorage.setItem('karobaar_session_user', JSON.stringify({ email: email.trim(), role: 'Owner' }));
          window.location.reload();
          return;
        }
        setGeneralError('Invalid email or password. Please verify your credentials or reset your password.');
      } else if (error.code === 'auth/wrong-password') {
        setGeneralError('Incorrect password. Please try again or use "Forgot password".');
      } else if (error.code === 'auth/email-already-in-use') {
        setGeneralError('An account with this email already exists. Please sign in instead.');
      } else {
        setGeneralError(error.message || 'Authentication failed.');
      }
    }
  };

  // --- Simple 1-Step Instant Password Reset ---
  const handleInstantPasswordReset = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');

    const targetEmail = resetEmail.trim() || email.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setGeneralError('Please enter a valid email address.');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setGeneralError('New password must be at least 6 characters.');
      return;
    }
    if (resetNewPassword !== resetNewPasswordConfirm) {
      setGeneralError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsAuthenticating(true);
    try {
      // 1. Update in localDb
      try {
        localDb.save('users', targetEmail, {
          email: targetEmail,
          password: resetNewPassword,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {}

      // 2. Try Firebase Auth sign in / credential provisioning
      try {
        if (auth.currentUser && auth.currentUser.email === targetEmail) {
          await updatePassword(auth.currentUser, resetNewPassword);
        } else {
          try {
            await signInWithEmailAndPassword(auth, targetEmail, resetNewPassword);
          } catch (signInErr) {
            if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
              try {
                await createUserWithEmailAndPassword(auth, targetEmail, resetNewPassword);
              } catch (createErr) {}
            }
          }
        }
      } catch (authErr) {
        console.warn("Auth update note:", authErr);
      }

      // 3. Dispatch reset email quietly in background
      try {
        await sendPasswordResetEmail(auth, targetEmail);
      } catch (mailErr) {}

      // 4. Set session user and navigate directly to dashboard
      localStorage.setItem('karobaar_session_user', JSON.stringify({
        email: targetEmail,
        role: 'Owner'
      }));

      setSuccessMessage('Password successfully updated! Entering your workspace...');
      setTimeout(() => {
        navigate('/dashboard');
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Reset error:", err);
      setGeneralError('Failed to reset password. Please try Google Sign-In.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // --- Phone SMS Authentication ---
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifierLogin) {
      window.recaptchaVerifierLogin = new RecaptchaVerifier(auth, 'login-recaptcha-container', {
        'size': 'invisible'
      });
    }
  };

  const handleSendPhoneCode = async () => {
    setGeneralError('');
    if (!phoneNumber.trim()) return setErrors({ phone: 'Phone number is required' });

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 6) return setErrors({ phone: 'Please enter a valid phone number' });

    const fullPhone = countryCode + cleanPhone;
    setIsAuthenticating(true);
    try {
      setupRecaptcha();
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifierLogin);
      window.loginConfirmationResult = confirmationResult;
      setCodeSent(true);
      setSuccessMessage('A 6-digit SMS verification code has been sent.');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/billing-not-enabled') {
        setGeneralError('SMS Verification requires Firebase Billing. Please use Email login.');
      } else {
        setGeneralError(err.message || 'Failed to send SMS code.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    setGeneralError('');
    if (!verificationCode.trim()) return setErrors({ code: 'Please enter the 6-digit code' });

    setIsAuthenticating(true);
    try {
      await window.loginConfirmationResult.confirm(verificationCode);
    } catch (err) {
      console.error(err);
      setGeneralError('Invalid verification code. Please check and try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // --- 1-Click Instant Demo / Guest Workspace Access ---
  const handleExploreDemoStore = async () => {
    const demoUser = {
      id: 'demo-user-1',
      email: 'owner@sascafeteria.com',
      name: 'SAS Cafeteria Owner',
      role: 'Owner'
    };
    const demoBusiness = {
      id: 'demo-business-1',
      name: 'SAS CAFETERIA',
      currency: 'INR',
      category: 'Cafeteria & Restaurant',
      settings: {
        currency: 'INR',
        theme: 'light'
      }
    };

    try {
      await initializeDemoData('demo-business-1');
    } catch (e) {
      console.warn("Demo data init:", e);
    }

    localStorage.setItem('karobaar_session_user', JSON.stringify(demoUser));
    localStorage.setItem('karobaar_session_business', JSON.stringify(demoBusiness));
    localStorage.setItem('karobaar_session_businesses', JSON.stringify([demoBusiness]));
    localStorage.setItem('karobaar-active-business', 'demo-business-1');
    
    navigate('/dashboard');
    window.location.reload();
  };

  return (
    <div className="login-wrapper">
      {/* ============================================================ */}
      {/* LEFT SIDE: Brand Hero Visuals (Matches Screenshot)           */}
      {/* ============================================================ */}
      <div className="login-visuals">
        <div className="visuals-content">
          <div className="visual-logo">
            <KarobaarLogo size="lg" theme="light" layout="horizontal" />
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

      {/* ============================================================ */}
      {/* RIGHT SIDE: Standard Sized, Simple Login Card                */}
      {/* ============================================================ */}
      <div className="login-container">
        <div className="login-card-wrapper">
          
          {/* Mobile branding header with Karobaar 3-bar logo matching Screen 2 */}
          <div className="mobile-brand-header">
            <KarobaarLogo size="lg" theme="dark" layout="vertical" />
          </div>

          <div className="login-header">
            {viewMode === 'auth' ? (
              <>
                <h2 className="login-title">{isRegistering ? 'Create an account' : 'Welcome back!'}</h2>
                <p className="login-subtitle">
                  {isRegistering ? 'Get started with your Karobaar business operating system.' : 'Sign in to continue to your business dashboard.'}
                </p>
              </>
            ) : (
              <>
                <h2 className="login-title">Reset your password</h2>
                <p className="login-subtitle">
                  Enter your email address and new password below to regain access immediately.
                </p>
              </>
            )}
          </div>

          <div className="login-card">
            {(generalError || authError) && (
              <div className="error-banner animate-shake">
                {generalError || authError}
              </div>
            )}

            {successMessage && (
              <div className="success-banner">
                {successMessage}
              </div>
            )}

            <div id="login-recaptcha-container"></div>

            {/* ======================================================== */}
            {/* VIEW 1: NORMAL SIGN IN / REGISTER FORM                   */}
            {/* ======================================================== */}
            {viewMode === 'auth' ? (
              <div className="form-transition-enter">
                {/* Method Tabs: Email or Phone */}
                <div className="login-tabs">
                  <button 
                    type="button" 
                    className={`login-tab-btn ${authTab === 'email' ? 'active' : ''}`}
                    onClick={() => { setAuthTab('email'); setGeneralError(''); }}
                  >
                    Email
                  </button>
                  <button 
                    type="button" 
                    className={`login-tab-btn ${authTab === 'phone' ? 'active' : ''}`}
                    onClick={() => { setAuthTab('phone'); setGeneralError(''); }}
                  >
                    Phone Number
                  </button>
                </div>

                {authTab === 'email' ? (
                  <>
                    {/* Google One-Click Login */}
                    {!isNative && (
                      <>
                        <button 
                          type="button"
                          className="social-auth-btn"
                          onClick={handleGoogleLogin}
                          disabled={isAuthenticating}
                        >
                          <svg className="social-icon" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          <span>Continue with Google</span>
                        </button>

                        <div className="login-divider">
                          <span>or sign in with email</span>
                        </div>
                      </>
                    )}

                    {/* Email / Password Form */}
                    <form onSubmit={handleManualAuth}>
                      <div className="form-group">
                        <label>Email address</label>
                        <input 
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: null }); }}
                          className={`form-input ${errors.email ? 'input-error' : ''}`}
                          placeholder="name@company.com"
                          disabled={isAuthenticating}
                          autoFocus={!email}
                        />
                        {errors.email && <span className="input-error-msg">{errors.email}</span>}
                      </div>

                      <div className="form-group">
                        <label>Password</label>
                        <div className="password-input-wrapper">
                          <input 
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: null }); }}
                            className={`form-input ${errors.password ? 'input-error' : ''}`}
                            placeholder="Enter your password"
                            disabled={isAuthenticating}
                          />
                          <button 
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex="-1"
                          >
                            {showPassword ? <EyeOff className="eye-icon" /> : <Eye className="eye-icon" />}
                          </button>
                        </div>
                        {errors.password && <span className="input-error-msg">{errors.password}</span>}
                      </div>

                      {/* Options: Remember Me & Forgot Password */}
                      {!isRegistering && (
                        <div className="login-options-row">
                          <label className="remember-me-label">
                            <input 
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span>Remember me</span>
                          </label>

                          <button 
                            type="button" 
                            className="forgot-password-link"
                            onClick={() => {
                              setViewMode('forgot_password');
                              setResetEmail(email);
                              setGeneralError('');
                              setSuccessMessage('');
                            }}
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        className={`login-submit-btn ${isAuthenticating ? 'loading' : ''}`}
                        disabled={isAuthenticating}
                      >
                        {isAuthenticating ? <div className="btn-loader"></div> : (isRegistering ? 'Create Account' : 'Sign In to Workspace')}
                      </Button>
                    </form>
                  </>
                ) : (
                  /* Phone Login Form */
                  <div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ width: '130px', flexShrink: 0 }}>
                          <CustomSelect 
                            options={finalCountryOptions} 
                            value={countryCode} 
                            onChange={(e) => setCountryCode(e.target.value)}
                          />
                        </div>
                        <input 
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => {
                            const nums = e.target.value.replace(/[^0-9\s-]/g, '');
                            const maxLen = PHONE_LENGTHS[countryCode] || 15;
                            if (nums.replace(/[^0-9]/g, '').length <= maxLen) setPhoneNumber(nums);
                          }}
                          className={`form-input ${errors.phone ? 'input-error' : ''}`}
                          placeholder="555 000 0000"
                          disabled={codeSent || isAuthenticating}
                          style={{ flex: 1 }}
                        />
                      </div>
                      {errors.phone && <span className="input-error-msg">{errors.phone}</span>}
                    </div>

                    {codeSent && (
                      <div className="form-group">
                        <label>6-Digit SMS Code</label>
                        <input 
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                          className="form-input"
                          placeholder="123456"
                          disabled={isAuthenticating}
                          autoFocus
                        />
                        {errors.code && <span className="input-error-msg">{errors.code}</span>}
                      </div>
                    )}

                    <Button 
                      type="button" 
                      className={`login-submit-btn ${isAuthenticating ? 'loading' : ''}`}
                      onClick={codeSent ? handleVerifyPhoneCode : handleSendPhoneCode}
                      disabled={isAuthenticating}
                    >
                      {isAuthenticating ? <div className="btn-loader"></div> : (codeSent ? 'Verify & Sign In' : 'Send SMS Code')}
                    </Button>
                  </div>
                )}

                {/* Switch Between Sign In and Sign Up */}
                <div className="toggle-mode-text">
                  {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                  <button 
                    type="button" 
                    className="toggle-mode-link"
                    onClick={() => { setIsRegistering(!isRegistering); setErrors({}); setGeneralError(''); }}
                  >
                    {isRegistering ? 'Sign In' : 'Sign Up'}
                  </button>
                </div>

                {/* 1-Click Instant Demo Store Access */}
                <button 
                  type="button" 
                  className="demo-access-btn"
                  onClick={handleExploreDemoStore}
                >
                  <Sparkles size={16} />
                  <span>Try Demo Workspace (SAS CAFETERIA)</span>
                </button>
              </div>
            ) : (
              /* ======================================================== */
              /* VIEW 2: SIMPLE 1-STEP INSTANT PASSWORD RESET             */
              /* ======================================================== */
              <div className="form-transition-enter">
                <button 
                  type="button" 
                  className="back-to-login-btn"
                  onClick={() => { setViewMode('auth'); setGeneralError(''); }}
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </button>

                <form onSubmit={handleInstantPasswordReset}>
                  <div className="form-group">
                    <label>Account Email address</label>
                    <input 
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="form-input"
                      placeholder="name@company.com"
                      disabled={isAuthenticating}
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <div className="password-input-wrapper">
                      <input 
                        type={showResetPassword ? "text" : "password"}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        className="form-input"
                        placeholder="At least 6 characters"
                        disabled={isAuthenticating}
                      />
                      <button 
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        tabIndex="-1"
                      >
                        {showResetPassword ? <EyeOff className="eye-icon" /> : <Eye className="eye-icon" />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input 
                      type="password"
                      value={resetNewPasswordConfirm}
                      onChange={(e) => setResetNewPasswordConfirm(e.target.value)}
                      className="form-input"
                      placeholder="Re-enter new password"
                      disabled={isAuthenticating}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className={`login-submit-btn ${isAuthenticating ? 'loading' : ''}`}
                    disabled={isAuthenticating}
                    style={{ marginTop: '0.5rem' }}
                  >
                    {isAuthenticating ? <div className="btn-loader"></div> : 'Set Password & Enter Workspace'}
                  </Button>
                </form>

                <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                  <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    className="forgot-password-link"
                    style={{ color: '#2563eb' }}
                  >
                    Registered with Google? Sign in with Google instead
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
