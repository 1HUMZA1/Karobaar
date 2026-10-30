import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import BottomNav from '../BottomNav/BottomNav';
import { CustomizeAIChatbot } from '../AI/CustomizeAIChatbot';
import { AIOnboardingConcierge } from '../AI/AIOnboardingConcierge';
import { LiveFeatureSpotlight } from '../AI/LiveFeatureSpotlight';
import { ErrorBoundary } from '../ErrorBoundary';
import './Layout.css';

const Layout = () => {
  const navigate = useNavigate();

  // 1-second auto-tracking of active screen for instant accidental close recovery
  useEffect(() => {
    const trackActiveScreen = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/') && !hash.includes('/login') && !hash.includes('/home') && !hash.includes('/about')) {
        localStorage.setItem('karobaar_last_active_route', hash);
        localStorage.setItem('karobaar_last_active_timestamp', Date.now().toString());
      }
    };
    trackActiveScreen();
    window.addEventListener('hashchange', trackActiveScreen);
    window.addEventListener('beforeunload', trackActiveScreen);
    const interval = setInterval(trackActiveScreen, 1000);
    return () => {
      window.removeEventListener('hashchange', trackActiveScreen);
      window.removeEventListener('beforeunload', trackActiveScreen);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      // F2 -> Instant Quick POS / New Sale
      if (e.key === 'F2') {
        e.preventDefault();
        navigate('/pos');
      }
      // F1 -> Instant Dashboard
      if (e.key === 'F1') {
        e.preventDefault();
        navigate('/dashboard');
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [navigate]);

  return (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="layout-content">
        <Topbar />
        <main className="layout-main relative custom-scrollbar">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav />
      <CustomizeAIChatbot />
      <AIOnboardingConcierge />
      <LiveFeatureSpotlight />
    </div>
  );
};

export default Layout;
