import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { auth, googleProvider } from '../../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { Button } from '../../components/ui/Button';
import './Login.css';

const Login = () => {
  const [generalError, setGeneralError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const { isAuthenticated, isAuthLoading } = useAppContext();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (!isAuthLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = async () => {
    setGeneralError('');
    setIsAuthenticating(true);

    try {
      // The context listener (onAuthStateChanged) will automatically pick this up
      // and redirect the user if successful
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Firebase Auth Error:", error);
      setIsAuthenticating(false);
      
      // Handle specific Firebase errors cleanly
      if (error.code === 'auth/popup-closed-by-user') {
        setGeneralError('Sign-in popup was closed before completing.');
      } else if (error.code === 'auth/network-request-failed') {
        setGeneralError('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setGeneralError('This domain is not authorized for Google Sign-In.');
      } else {
        setGeneralError('Authentication failed. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="login-logo">
          <span className="logo-icon-box">K</span>
          Karobaar
        </div>
        <h2 className="login-title">Sign in to Karobaar</h2>
        <p className="login-subtitle">Manage your business. Simply.</p>
      </div>

      <div className="login-card" style={{ paddingBottom: '3rem' }}>
        {generalError && (
          <div className="error-banner mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold text-center">
            {generalError}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          className="google-auth-btn"
          type="button"
          disabled={isAuthenticating || isAuthLoading}
          style={{ padding: '1.25rem', fontSize: '1.1rem' }}
        >
          {isAuthenticating || isAuthLoading ? (
            <span className="flex items-center gap-2">
              <div style={{ width: '20px', height: '20px', border: '2px solid #ccc', borderTop: '2px solid #333', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              Authenticating...
            </span>
          ) : (
            <>
              <svg className="google-icon" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <div className="mt-8 text-center text-sm font-semibold text-gray-500">
          Secure authentication provided by Google
        </div>
      </div>
    </div>
  );
};

export default Login;
