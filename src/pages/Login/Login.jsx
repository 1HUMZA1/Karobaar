import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import './Login.css';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const { authenticate, register, login } = useAppContext();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (isRegistering && !name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email address is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 4) newErrors.password = 'Password must be at least 4 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validateForm()) return;

    if (isRegistering) {
      const res = await register(email, password, name);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setGeneralError(res.message);
      }
    } else {
      const res = await authenticate(email, password, rememberMe);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setGeneralError(res.message);
      }
    }
  };

  const handleGoogleLogin = () => {
    // Mocking Google Auth flow
    // In a real scenario, this would trigger @react-oauth/google or Firebase Auth
    login({ role: 'Owner', email: 'google@user.com', name: 'Google User' });
    navigate('/dashboard');
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setErrors({});
    setGeneralError('');
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="login-logo">
          <span className="logo-icon-box">K</span>
          Karobaar
        </div>
        <h2 className="login-title">
          {isRegistering ? 'Create an account' : 'Sign in to your account'}
        </h2>
        <p className="login-subtitle">
          {isRegistering ? 'Join the ultimate business OS' : 'Welcome back to the ultimate business OS'}
        </p>
      </div>

      <div className="login-card">
        {generalError && (
          <div className="error-banner mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold text-center">
            {generalError}
          </div>
        )}

        <form onSubmit={handleManualLogin}>
          {isRegistering && (
            <div className="form-group">
              <label>Full Name</label>
              {errors.name && <span className="input-error-msg text-red-500 text-xs font-bold mb-1 block">{errors.name}</span>}
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if(errors.name) setErrors({...errors, name: null}) }}
                className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email address</label>
            {errors.email && <span className="input-error-msg text-red-500 text-xs font-bold mb-1 block">{errors.email}</span>}
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: null}) }}
              className={`form-input ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            {errors.password && <span className="input-error-msg text-red-500 text-xs font-bold mb-1 block">{errors.password}</span>}
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password: null}) }}
              className={`form-input ${errors.password ? 'border-red-500' : ''}`}
              placeholder={isRegistering ? 'Create a password' : 'Enter your password'}
            />
          </div>

          <div className="form-actions">
            {!isRegistering ? (
              <>
                <div className="remember-me">
                  <input 
                    type="checkbox" 
                    id="remember-me" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember-me">Remember me</label>
                </div>
                <a href="#" className="forgot-password">Forgot password?</a>
              </>
            ) : (
              <div className="text-sm text-gray-500">
                By creating an account, you agree to our Terms.
              </div>
            )}
          </div>

          <Button type="submit" className="login-submit-btn w-full">
            {isRegistering ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>

        <div className="divider">
          <span className="divider-text">Or continue with</span>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="google-auth-btn"
          type="button"
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <div className="mt-6 text-center text-sm font-semibold text-gray-600">
          {isRegistering ? 'Already have an account? ' : 'Don\'t have an account? '}
          <button 
            onClick={toggleMode}
            className="text-black underline cursor-pointer bg-transparent border-none p-0 ml-1"
          >
            {isRegistering ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
