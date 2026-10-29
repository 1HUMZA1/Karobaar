import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { auth, googleProvider } from '../../services/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { KarobaarLogo } from '../../components/KarobaarLogo/KarobaarLogo';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, ExternalLink } from 'lucide-react';

const GoogleAuth = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('authenticating'); // 'authenticating' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [userData, setUserData] = useState(null);

  const targetPort = searchParams.get('port') || (window.location.port ? window.location.port : null);

  const notifyApp = async (payload) => {
    // 1. Post to LocalServer callback (trying localhost, 127.0.0.1)
    if (targetPort) {
      const hosts = Array.from(new Set([window.location.hostname || 'localhost', 'localhost', '127.0.0.1']));
      let delivered = false;
      for (const host of hosts) {
        try {
          await fetch(`http://${host}:${targetPort}/api/auth-callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          delivered = true;
          break;
        } catch (_) {}
      }
      if (!delivered) {
        try {
          const img = new Image();
          img.src = `http://localhost:${targetPort}/api/auth-callback?data=${encodeURIComponent(JSON.stringify(payload))}`;
        } catch (_) {}
      }
    }

    // 2. Post to opener window if opened via window.open
    if (window.opener) {
      try {
        window.opener.postMessage({ type: 'KAROBAAR_GOOGLE_AUTH_SUCCESS', payload }, '*');
      } catch (_) {}
    }

    // 3. Store in current browser localStorage
    try {
      localStorage.setItem('karobaar_session_user', JSON.stringify(payload));
      localStorage.setItem('karobaar_remember_me', 'true');
      localStorage.setItem('karobaar_remembered_email', payload.email);
      localStorage.removeItem('karobaar_explicit_logout');
    } catch (_) {}

    setStatus('success');
    setUserData(payload);

    // Attempt auto-close tab after 1.8 seconds
    setTimeout(() => {
      try {
        window.close();
      } catch (_) {}
    }, 1800);
  };

  const handleStartGoogleSignIn = async () => {
    setStatus('authenticating');
    setErrorMessage('');
    try {
      let result = null;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr) {
        if (popupErr.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw popupErr;
      }

      if (result?.user) {
        const payload = {
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName || result.user.email.split('@')[0],
          photoURL: result.user.photoURL || '',
          role: 'Owner',
          activeBusinessId: null, // Will create or link actual business
          memberships: []
        };
        await notifyApp(payload);
      }
    } catch (err) {
      console.error('[GoogleAuth Error]', err);
      setStatus('error');
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setErrorMessage(
          `Domain "${window.location.hostname}" is not authorized by Firebase. Please use "localhost" or add this domain in Firebase Console.`
        );
      } else {
        setErrorMessage(err.message || 'Failed to authenticate with Google. Please try again.');
      }
    }
  };

  useEffect(() => {
    // 1. If loaded under 127.0.0.1 IP, immediately normalize to localhost so Firebase Auth whitelist succeeds
    if (window.location.hostname === '127.0.0.1') {
      window.location.replace(window.location.href.replace('127.0.0.1', 'localhost'));
      return;
    }

    // 2. Check if returning from a redirect
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const payload = {
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName || result.user.email.split('@')[0],
            photoURL: result.user.photoURL || '',
            role: 'Owner',
            activeBusinessId: null,
            memberships: []
          };
          await notifyApp(payload);
          return;
        }
      } catch (e) {
        console.warn('[GoogleAuth Redirect Note]', e);
      }
      // If not redirect result, trigger popup sign-in
      handleStartGoogleSignIn();
    };

    checkRedirect();
  }, []);

  const isUnauthorizedDomain = errorMessage.includes('not authorized by Firebase') || errorMessage.includes('unauthorized-domain');
  const isIpAddress = window.location.hostname === '127.0.0.1';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#09090b',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '20px',
        padding: '40px 32px',
        maxWidth: '460px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.45)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <KarobaarLogo size={42} showText={true} />
        </div>

        {status === 'authenticating' && (
          <div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Loader2 className="animate-spin" size={28} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
              Signing in with Google...
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              Please select your Google account in the browser prompt. Once complete, Karobaar will update automatically.
            </p>
            <button
              onClick={handleStartGoogleSignIn}
              style={{
                backgroundColor: '#ffffff',
                color: '#09090b',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Retry Google Prompt
            </button>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#4ade80'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
              Sign-In Successful!
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 8px 0' }}>
              Connected as <strong style={{ color: '#ffffff' }}>{userData?.email}</strong>
            </p>
            <p style={{ color: '#71717a', fontSize: '0.82rem', margin: '0 0 24px 0' }}>
              You may now return to the Karobaar app. This tab can be closed safely.
            </p>
            <button
              onClick={() => {
                try { window.close(); } catch (_) {}
              }}
              style={{
                backgroundColor: '#ffffff',
                color: '#09090b',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Close & Return to Karobaar <ArrowRight size={15} />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#f87171'
            }}>
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
              Authentication Failed
            </h2>
            <p style={{ color: '#f87171', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              {errorMessage}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isIpAddress && (
                <button
                  onClick={() => window.location.replace(window.location.href.replace('127.0.0.1', 'localhost'))}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#09090b',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Switch to localhost (Recommended)
                </button>
              )}

              {isUnauthorizedDomain && (
                <a
                  href="https://console.firebase.google.com/project/karobaaaar/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#27272a',
                    color: '#ffffff',
                    border: '1px solid #3f3f46',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    fontWeight: 500,
                    fontSize: '0.84rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  Open Firebase Authorized Domains <ExternalLink size={13} />
                </a>
              )}

              <button
                onClick={handleStartGoogleSignIn}
                style={{
                  backgroundColor: isIpAddress ? 'transparent' : '#ffffff',
                  color: isIpAddress ? '#ffffff' : '#09090b',
                  border: isIpAddress ? '1px solid #3f3f46' : 'none',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAuth;
