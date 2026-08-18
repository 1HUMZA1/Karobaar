import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { auth, googleProvider, githubProvider } from '../../services/firebase';
import { signInWithPopup, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '../../components/ui/Button';
import './Login.css';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const { authStatus, authError } = useAppContext();
  const navigate = useNavigate();

  // Platform Detection
  const isNative = (typeof window !== 'undefined' && window.location.protocol === 'file:') || 
                   (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform());

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
      await signInWithPopup(auth, provider);
      // Success is handled by onAuthStateChanged in AppContext
    } catch (error) {
      console.error("Firebase Auth Error:", error);
      setIsAuthenticating(false);
      if (error.code === 'auth/popup-closed-by-user') {
        setGeneralError('Sign-in cancelled.');
      } else {
        setGeneralError('Failed to initiate Sign-In.');
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
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setGeneralError('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        setGeneralError('An account with this email already exists.');
      } else {
        setGeneralError(error.message || 'Authentication failed.');
      }
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

            <form onSubmit={handleManualAuth} className="manual-auth-form">
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
                <label>Password</label>
                <div className="password-input-wrapper">
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
                {isAuthenticating || isAuthLoading ? 'Please wait...' : (isRegistering ? 'Sign Up' : 'Sign In')}
              </Button>
            </form>

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
                          <Github className="social-icon" />
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
