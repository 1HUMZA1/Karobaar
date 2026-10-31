import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
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

  const { requireAuthAndSetup } = useAppContext();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      // F2 -> Instant Quick POS / New Sale
      if (e.key === 'F2') {
        e.preventDefault();
        if (requireAuthAndSetup && requireAuthAndSetup('POS New Sale Register')) return;
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
  }, [navigate, requireAuthAndSetup]);

  // Global Trackpad & Mouse Wheel Delegator: guarantees laptop trackpad scrolls smoothly anywhere
  useEffect(() => {
    const handleGlobalWheel = (e) => {
      const main = document.querySelector('.layout-main');
      if (!main) return;

      // Check if target is an internal scrollable element (modal, dropdown list, etc.)
      let el = e.target;
      let isInsideScrollableChild = false;
      while (el && el !== document.body && el !== main) {
        try {
          const style = window.getComputedStyle(el);
          const canScrollY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
          if (canScrollY) {
            isInsideScrollableChild = true;
            break;
          }
        } catch (_) {}
        el = el.parentElement;
      }

      // If wheel occurred over a non-scrollable area (margins, headers, cards), delegate directly to layout-main
      if (!isInsideScrollableChild) {
        main.scrollTop += e.deltaY;
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, []);

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
