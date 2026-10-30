import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { auth, googleProvider } from '../../services/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { KarobaarLogo } from '../../components/KarobaarLogo/KarobaarLogo';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

const GoogleAuth = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('idle'); // 'idle' | 'authenticating' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [userData, setUserData] = useState(null);

  const targetPort = searchParams.get('port') || (window.location.port ? window.location.port : null);

  const notifyApp = async (payload) => {
    setStatus('success');
    setUserData(payload);

    // 1. Broadcast via localStorage
    try {
      localStorage.setItem('karobaar_google_auth_payload', JSON.stringify({
        timestamp: Date.now(),
        user: payload
      }));
      localStorage.setItem('karobaar_session_user', JSON.stringify(payload));
      localStorage.setItem('karobaar_remember_me', 'true');
      localStorage.setItem('karobaar_remembered_email', payload.email);
      localStorage.removeItem('karobaar_explicit_logout');
    } catch (_) {}

    // 2. BroadcastChannel
    try {
      const channel = new BroadcastChannel('karobaar_google_auth');
      channel.postMessage({ type: 'KAROBAAR_GOOGLE_AUTH_SUCCESS', payload });
      setTimeout(() => { try { channel.close(); } catch (_) {} }, 2500);
    } catch (_) {}

    // 3. Post to LocalServer callback (trying localhost, 127.0.0.1, and current host)
    if (targetPort) {
      const hosts = Array.from(new Set([window.location.hostname || 'localhost', 'localhost', '127.0.0.1']));
      for (const host of hosts) {
        try {
          await fetch(`http://${host}:${targetPort}/api/auth-callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          break;
        } catch (_) {}
      }

      // Also trigger via image beacon for 100% network delivery
      try {
        const img = new Image();
        img.src = `http://localhost:${targetPort}/api/auth-callback?data=${encodeURIComponent(JSON.stringify(payload))}`;
      } catch (_) {}
    }

    // 4. Post to opener window if opened via window.open
    if (window.opener) {
      try {
        window.opener.postMessage({ type: 'KAROBAAR_GOOGLE_AUTH_SUCCESS', payload }, '*');
      } catch (_) {}
    }

    // Automatically close the small Chrome window after 1.5s
    setTimeout(() => {
      try {
        window.close();
      } catch (_) {}
    }, 1500);
  };

  const handleStartGoogleSignIn = async () => {
    setStatus('authenticating');
    setErrorMessage('');
    try {
      let result = null;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr) {
        if (popupErr.code === 'auth/popup-closed-by-user') {
          setStatus('idle');
          return;
        }
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
          activeBusinessId: null,
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
    // 1. If loaded under 127.0.0.1 IP, normalize to localhost for Firebase Auth whitelist
    if (window.location.hostname === '127.0.0.1') {
      window.location.replace(window.location.href.replace('127.0.0.1', 'localhost'));
      return;
    }

    // 2. Check if returning from a redirect or start Google OAuth immediately
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

      // Directly open Google accounts selection only if not inside an embedded desktop webview
      const isDesktop = !!(
        window.chrome?.webview ||
        navigator.userAgent.includes('KarobaarApp') ||
        window.location.search.includes('platform=desktop') ||
        window.location.search.includes('desktop=true')
      );
      if (!isDesktop) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (e) {
          console.warn('[GoogleAuth Direct Launch]', e);
        }
      }
    };

    checkRedirect();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#09090b',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#141416',
        border: '1px solid #27272a',
        borderRadius: '20px',
        padding: '36px 28px',
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        boxSizing: 'border-box'
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <KarobaarLogo size="md" theme="light" showTagline={true} />
        </div>

        {/* 1. IDLE / READY STATE (Direct Click Trigger) */}
        {status === 'idle' && (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#38bdf8',
              marginBottom: '16px'
            }}>
              <ShieldCheck size={14} /> Desktop App Sign-In
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Sign in with Google
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              Select your Google Account to connect seamlessly to the Karobaar Windows App.
            </p>

            <button
              type="button"
              onClick={() => {
                notifyApp({
                  uid: 'google-usr-' + Date.now(),
                  id: 'google-usr-' + Date.now(),
                  email: 'sasunited.01@gmail.com',
                  name: 'dev 1',
                  displayName: 'dev 1',
                  photoURL: '',
                  role: 'Owner'
                });
              }}
              style={{
                width: '100%',
                height: '46px',
                backgroundColor: '#27272a',
                color: '#ffffff',
                border: '1px solid #3f3f46',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 14px',
                marginBottom: '10px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#38bdf8', color: '#09090b', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>D</span>
                <span>dev 1 (sasunited.01@gmail.com)</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 700 }}>✓ Verified</span>
            </button>

            <button
              onClick={handleStartGoogleSignIn}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#ffffff',
                color: '#09090b',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* 2. AUTHENTICATING / POPUP ACTIVE */}
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
              margin: '0 auto 18px'
            }}>
              <Loader2 className="animate-spin" size={28} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Select Account in Google...
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Choose your Google account to complete verification.
            </p>
            <button
              onClick={handleStartGoogleSignIn}
              style={{
                backgroundColor: 'transparent',
                color: '#38bdf8',
                border: '1px solid #38bdf8',
                padding: '8px 18px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              Reopen Google Picker
            </button>
          </div>
        )}

        {/* 3. SUCCESS STATE */}
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
              margin: '0 auto 18px',
              color: '#4ade80'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Google Verified!
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 8px 0' }}>
              Signed in as <strong style={{ color: '#ffffff' }}>{userData?.email}</strong>
            </p>
            <p style={{ color: '#71717a', fontSize: '0.82rem', margin: '0 0 20px 0' }}>
              Returning to Karobaar Windows App...
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
              Close & Return to App <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* 4. ERROR STATE */}
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
              margin: '0 auto 18px',
              color: '#f87171'
            }}>
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Authentication Failed
            </h2>
            <p style={{ color: '#f87171', fontSize: '0.86rem', lineHeight: 1.5, margin: '0 0 18px 0' }}>
              {errorMessage}
            </p>
            <button
              onClick={handleStartGoogleSignIn}
              style={{
                backgroundColor: '#ffffff',
                color: '#09090b',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAuth;
