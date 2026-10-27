import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("RootErrorBoundary caught exception:", error, errorInfo);
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      window.__triggerRootError = (err) => {
        this.setState({ 
          hasError: true, 
          error: new Error(err || "Session cache corrupted during sync simulation.") 
        });
      };
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReset = () => {
    try {
      localStorage.removeItem('karobaar_session_user');
      localStorage.removeItem('karobaar_session_business');
      sessionStorage.clear();
    } catch (e) {}
    window.location.hash = '#/dashboard';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#09090b',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          {/* Subtle Ambient Radial Glow */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(9,9,11,0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          {/* Elevated Recovery Panel */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '460px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(18, 18, 21, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '40px 32px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            {/* Official Karobaar "K" Brand Logo Emblem */}
            <div 
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                border: '2.5px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.9rem',
                lineHeight: 1,
                userSelect: 'none',
                boxShadow: '0 8px 24px rgba(255,255,255,0.12)',
                marginBottom: '18px',
                letterSpacing: '-0.02em',
                background: '#09090b'
              }}
              aria-label="Karobaar Logo"
            >
              K
            </div>

            <h1 style={{ 
              fontSize: '1.65rem', 
              fontWeight: 800, 
              margin: '0 0 6px 0', 
              letterSpacing: '-0.02em',
              color: '#ffffff'
            }}>
              Karobaar
            </h1>

            <div style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#a1a1aa',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}>
              Workspace Session Recovery
            </div>

            <p style={{ 
              fontSize: '0.92rem', 
              color: '#d4d4d8', 
              lineHeight: 1.55, 
              margin: '0 0 20px 0', 
              maxWidth: '380px' 
            }}>
              We encountered an unexpected hiccup loading this view. Your local offline database, khata balances, and business records remain completely safe.
            </p>

            {/* Safety Indicator Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.78rem',
              color: '#a1a1aa',
              marginBottom: '26px'
            }}>
              <span style={{ 
                width: '7px', 
                height: '7px', 
                borderRadius: '50%', 
                backgroundColor: '#ffffff', 
                display: 'inline-block' 
              }} />
              <span>Local Database Safe • Instant Cloud Recovery</span>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              width: '100%'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  width: '100%',
                  backgroundColor: '#ffffff',
                  color: '#09090b',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '13px 20px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255,255,255,0.12)',
                  transition: 'transform 0.15s ease, opacity 0.15s ease'
                }}
              >
                Reload Workspace
              </button>

              <button
                onClick={this.handleClearAndReset}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                Clear Cache & Reset
              </button>
            </div>

            {/* Technical Diagnostics Toggle */}
            {this.state.error && (
              <div style={{ marginTop: '22px', width: '100%', textAlign: 'left' }}>
                <button
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#71717a',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    padding: '4px 0',
                    textDecoration: 'underline',
                    display: 'block',
                    margin: '0 auto'
                  }}
                >
                  {this.state.showDetails ? 'Hide Diagnostics' : 'Show Error Diagnostics'}
                </button>
                {this.state.showDetails && (
                  <pre style={{
                    marginTop: '10px',
                    padding: '12px',
                    backgroundColor: '#0c0c0e',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    color: '#a1a1aa',
                    maxHeight: '140px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace'
                  }}>
                    {String(this.state.error?.message || this.state.error || 'Unknown error')}
                  </pre>
                )}
              </div>
            )}

            <div style={{
              marginTop: '24px',
              fontSize: '0.75rem',
              color: '#52525b',
              letterSpacing: '0.02em'
            }}>
              Karobaar — Turn Work Into Growth.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
)
