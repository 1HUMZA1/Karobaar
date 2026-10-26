import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import BottomNav from '../BottomNav/BottomNav';
import { ErrorBoundary } from '../ErrorBoundary';
import './Layout.css';

const Layout = () => {
  const navigate = useNavigate();

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
    </div>
  );
};

export default Layout;
