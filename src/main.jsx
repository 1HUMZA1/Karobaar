import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("RootErrorBoundary caught exception:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('karobaar_session_user');
      localStorage.removeItem('karobaar_session_business');
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
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textAlign: 'center'
        }}>
          {/* Karobaar 3-Ascending-Bars Logo */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', marginBottom: '20px' }}>
            <div style={{ width: '8px', height: '18px', backgroundColor: '#ffffff', borderRadius: '4px' }}></div>
            <div style={{ width: '8px', height: '28px', backgroundColor: '#ffffff', borderRadius: '4px' }}></div>
            <div style={{ width: '8px', height: '40px', backgroundColor: '#ffffff', borderRadius: '4px' }}></div>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0' }}>Karobaar</h1>
          <p style={{ fontSize: '0.875rem', color: '#a1a1aa', margin: '0 0 24px 0', maxWidth: '320px' }}>
            An unexpected error occurred while loading your workspace.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              backgroundColor: '#ffffff',
              color: '#09090b',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,255,255,0.1)'
            }}
          >
            Restart Karobaar Workspace
          </button>
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
