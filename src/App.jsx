import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout/Layout';
import { KarobaarLogo } from './components/KarobaarLogo/KarobaarLogo';

import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import POS from './pages/POS/POS';
import Inventory from './pages/Inventory/Inventory';
import Employees from './pages/Employees/Employees';
import Attendance from './pages/Attendance/Attendance';
import Customers from './pages/Customers/Customers';
import Orders from './pages/Orders/Orders';
import Expenses from './pages/Expenses/Expenses';
import Suppliers from './pages/Suppliers/Suppliers';
import Purchases from './pages/Purchases/Purchases';
import Leave from './pages/Leave/Leave';
import Payroll from './pages/Payroll/Payroll';
import Tasks from './pages/Tasks/Tasks';
import Settings from './pages/Settings/Settings';
import Reports from './pages/Reports/Reports';
import Notifications from './pages/Notifications/Notifications';
import Login from './pages/Login/Login';
import GoogleAuth from './pages/Login/GoogleAuth';
import BusinessSetup from './pages/BusinessSetup/BusinessSetup';
import Invoices from './pages/Invoices/Invoices';
import Payments from './pages/Payments/Payments';
import Landing from './pages/Landing/Landing';
import Branches from './pages/Branches/Branches';
import HQAnalytics from './pages/Branches/HQAnalytics';
import MobileMenu from './pages/Settings/MobileMenu';
import SignOutModal from './components/SignOutModal/SignOutModal';
import DemoRestrictedModal from './components/DemoRestrictedModal/DemoRestrictedModal';
import AccessDenied from './components/AccessDenied/AccessDenied';
import { hasPermission, normalizeRole, PERMISSIONS } from './utils/permissions';

// Protected Route Component with Role & Permission Enforcement
const ProtectedRoute = ({ children, allowedRoles, requiredPermission, moduleId }) => {
  const { authStatus, userRole, currentUser, currentBusiness, isDemoMode, requireAuthAndSetup } = useAppContext();
  
  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (authStatus === 'pending_onboarding') {
    return <Navigate to="/setup" replace />;
  }

  // Demo Mode Restriction: Block operational subpages in preview mode
  if (isDemoMode && moduleId && moduleId !== 'core') {
    requireAuthAndSetup?.(moduleId);
    return <Navigate to="/dashboard" replace />;
  }
  
  // Role Check (Normalized role comparison, Owner always has access)
  const normRole = normalizeRole(userRole);
  const normalizedAllowed = allowedRoles ? allowedRoles.map(r => normalizeRole(r).toLowerCase()) : [];
  const hasRole = allowedRoles ? (normalizedAllowed.includes(normRole.toLowerCase()) || normRole === 'Owner') : true;
  
  // Permission Check
  const hasPerm = requiredPermission ? hasPermission(currentUser, requiredPermission) : true;

  if (!hasRole || !hasPerm) {
    return (
      <AccessDenied 
        requiredRole={allowedRoles?.[0]} 
        requiredPermission={requiredPermission} 
        moduleName={moduleId || 'this page'} 
      />
    );
  }

  // Module Check
  if (moduleId && currentBusiness) {
    const modules = currentBusiness.modules || {};
    // If a module is explicitly set to false, block it. Otherwise allow it (default opt-in)
    const isModuleEnabled = modules[moduleId] !== false && modules[moduleId] !== 'false';
    if (!isModuleEnabled) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

// Route Groups for easy maintenance
const ROLES = {
  ALL: ['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY', 'ACCOUNTANT', 'CUSTOM', 'STAFF', 'SALES'],
  MANAGEMENT: ['OWNER', 'MANAGER'],
  SALES_POS: ['OWNER', 'MANAGER', 'CASHIER', 'SALES', 'STAFF'],
  WAREHOUSE_OPS: ['OWNER', 'MANAGER', 'INVENTORY', 'STAFF'],
  FINANCE: ['OWNER', 'MANAGER', 'ACCOUNTANT'],
  HR_OPS: ['OWNER', 'MANAGER'],
  SETTINGS_OPS: ['OWNER', 'MANAGER']
};

const SLOGANS = [
  "Where Effort Becomes Progress.",
  "Work Smarter. Grow Faster.",
  "Plan Better. Achieve More.",
  "Built to Simplify. Designed to Grow.",
  "Smarter Tools. Stronger Businesses.",
  "Turning Ambition Into Achievement.",
  "Every Transaction, Seamlessly Managed.",
  "Your Business. Your Progress.",
  "Empowering Work. Accelerating Growth.",
  "Make Every Move Count.",
  "Karobaar — Built to Grow."
];

const AppContent = () => {
  const { authStatus, currentUser, currentBusiness } = useAppContext();
  const [sloganIndex, setSloganIndex] = useState(0);
  const [quoteFade, setQuoteFade] = useState('in'); // 'in' | 'out' | 'prep'
  const isAlreadyShown = typeof window !== 'undefined' && sessionStorage.getItem('karobaar_splash_shown') === 'true';
  const [splashFinished, setSplashFinished] = useState(isAlreadyShown);
  const [progress, setProgress] = useState(isAlreadyShown ? 100 : 0);
  const [statusMessage, setStatusMessage] = useState("Initializing workspace...");
  const [isSlow, setIsSlow] = useState(false);

  // Rotating quotes with smooth fade-in and fade-out (only runs during initial boot)
  useEffect(() => {
    if (splashFinished) return;

    const quoteInterval = setInterval(() => {
      setQuoteFade('out');
      setTimeout(() => {
        setSloganIndex(prev => (prev + 1) % SLOGANS.length);
        setQuoteFade('prep');
        setTimeout(() => {
          setQuoteFade('in');
        }, 30);
      }, 380);
    }, 2200);

    return () => clearInterval(quoteInterval);
  }, [splashFinished]);

  // Smooth 0 to 100 countdown progress ticker (runs strictly ONCE per session)
  useEffect(() => {
    if (splashFinished) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }

        // If auth is still checking, slow down near 92%
        if (authStatus === 'loading' && prev >= 90) {
          return Math.min(94, prev + 1);
        }

        // Normal smooth progression
        const step = Math.floor(Math.random() * 5) + 4;
        const next = Math.min(100, prev + step);

        if (next < 25) setStatusMessage("Initializing workspace...");
        else if (next < 55) setStatusMessage("Syncing business records...");
        else if (next < 85) setStatusMessage("Loading modules...");
        else if (next < 100) setStatusMessage("Finalizing workspace...");
        else setStatusMessage("Ready.");

        return next;
      });
    }, 40);

    const slowTimer = setTimeout(() => {
      setIsSlow(true);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearTimeout(slowTimer);
    };
  }, [authStatus, splashFinished]);

  // When 100% countdown finishes and auth is loaded, complete splash and lock session flag
  useEffect(() => {
    if (splashFinished) return;
    if (progress >= 100 && authStatus !== 'loading') {
      const finishTimer = setTimeout(() => {
        try {
          sessionStorage.setItem('karobaar_splash_shown', 'true');
        } catch (e) {}
        setSplashFinished(true);
      }, 200);
      return () => clearTimeout(finishTimer);
    }
  }, [progress, authStatus, splashFinished]);

  // Safety limit: ensure workspace opens smoothly within 1.8s
  useEffect(() => {
    if (splashFinished) return;
    const safetyLimit = setTimeout(() => {
      try {
        sessionStorage.setItem('karobaar_splash_shown', 'true');
      } catch (e) {}
      setSplashFinished(true);
    }, 1800);
    return () => clearTimeout(safetyLimit);
  }, [splashFinished]);

  if (!splashFinished) {
    return (
      <div className="login-splash-screen" style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed', 
        top: 0, 
        left: 0, 
        zIndex: 9999,
        backgroundColor: 'var(--bg-body, #f1f3f6)',
        color: 'var(--text-main, #09090b)',
        overflow: 'hidden',
        userSelect: 'none',
        padding: '24px',
        boxSizing: 'border-box'
      }}>
        {/* Center: Brand Logo + Large Typography */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'fadeIn 0.5s ease-out',
          maxWidth: '420px',
          width: '100%'
        }}>
          {/* Signature "K" Logo Emblem */}
          <div 
            style={{
              width: '78px',
              height: '78px',
              borderRadius: '20px',
              border: '3.5px solid var(--text-main, #09090b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main, #09090b)',
              fontWeight: 800,
              fontSize: '2.6rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              marginBottom: '18px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
            }}
          >
            K
          </div>

          <h1 style={{
            margin: '0 0 8px 0',
            fontWeight: 800,
            fontSize: '2.5rem',
            letterSpacing: '-0.03em',
            color: 'var(--text-main, #09090b)',
            lineHeight: 1.1
          }}>
            Karobaar
          </h1>

          <p style={{
            margin: '0 0 28px 0',
            fontSize: '1.18rem',
            color: 'var(--text-secondary, #52525b)',
            fontWeight: 500,
            letterSpacing: '0.01em'
          }}>
            Turn Work Into Growth.
          </p>

          {/* 100 Countdown Progress Bar */}
          <div style={{
            width: '260px',
            maxWidth: '85vw',
            height: '6px',
            backgroundColor: 'var(--border-color, rgba(9, 9, 11, 0.12))',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '12px'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: 'var(--text-main, #09090b)',
              borderRadius: '9999px',
              transition: 'width 0.16s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>

          {/* Counter & Workspace Status Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '260px',
            maxWidth: '85vw',
            fontSize: '0.85rem',
            color: 'var(--text-muted, #71717a)',
            fontWeight: 500,
            marginBottom: '20px'
          }}>
            <span>{statusMessage}</span>
            <span style={{ 
              fontWeight: 700, 
              color: 'var(--text-main, #09090b)', 
              fontVariantNumeric: 'tabular-nums',
              fontSize: '0.92rem'
            }}>
              {Math.floor(progress)}%
            </span>
          </div>

          {/* Rotating Motivational Quotes with Fade-In & Fade-Out */}
          <div style={{
            minHeight: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: '380px',
            textAlign: 'center',
            padding: '0 16px'
          }}>
            <span 
              style={{
                fontSize: '0.92rem',
                fontWeight: 500,
                fontStyle: 'italic',
                color: 'var(--text-secondary, #71717a)',
                letterSpacing: '0.01em',
                lineHeight: 1.4,
                display: 'inline-block',
                transition: quoteFade === 'prep' ? 'none' : 'opacity 0.38s cubic-bezier(0.16, 1, 0.3, 1), transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: quoteFade === 'in' ? 1 : 0,
                transform: quoteFade === 'in' 
                  ? 'translateY(0) scale(1)' 
                  : quoteFade === 'out' 
                    ? 'translateY(-8px) scale(0.98)' 
                    : 'translateY(8px) scale(0.98)'
              }}
            >
              “{SLOGANS[sloganIndex]}”
            </span>
          </div>

          {isSlow && (
            <button 
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '6px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '9999px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              Refresh Workspace
            </button>
          )}
        </div>
      </div>
    );
  }

  // Auto-resume to last active screen if closed accidentally
const RootResumeRedirect = () => {
  const lastRoute = localStorage.getItem('karobaar_last_active_route');
  if (lastRoute && lastRoute.startsWith('#/') && !lastRoute.includes('/login') && !lastRoute.includes('/home') && !lastRoute.includes('/about') && !lastRoute.includes('/setup')) {
    const cleanPath = lastRoute.replace('#', '');
    return <Navigate to={cleanPath} replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

  return (
    <HashRouter>
      <SignOutModal />
      <DemoRestrictedModal />
      <Routes>
        <Route path="/home" element={<Landing />} />
        <Route path="/website" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/about" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/google-auth" element={<GoogleAuth />} />
        <Route path="/setup" element={<BusinessSetup />} />
        
        <Route path="/" element={
          <ProtectedRoute allowedRoles={ROLES.ALL}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<RootResumeRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="ai" element={<Navigate to="/dashboard" replace />} />
          <Route path="sales" element={<Navigate to="/pos" replace />} />
          
          <Route path="pos" element={<ProtectedRoute allowedRoles={ROLES.SALES_POS} moduleId="pos"><POS /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute allowedRoles={ROLES.SALES_POS} moduleId="sales"><Orders /></ProtectedRoute>} />
          <Route path="invoices" element={<ProtectedRoute allowedRoles={ROLES.FINANCE} moduleId="invoices"><Invoices /></ProtectedRoute>} />
          <Route path="customers" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'STAFF', 'SALES']} moduleId="customers"><Customers /></ProtectedRoute>} />
          
          <Route path="products" element={<ProtectedRoute allowedRoles={ROLES.WAREHOUSE_OPS} moduleId="inventory"><Products /></ProtectedRoute>} />
          <Route path="inventory" element={<ProtectedRoute allowedRoles={ROLES.WAREHOUSE_OPS} moduleId="inventory"><Inventory /></ProtectedRoute>} />
          <Route path="purchases" element={<ProtectedRoute allowedRoles={ROLES.WAREHOUSE_OPS} moduleId="purchases"><Purchases /></ProtectedRoute>} />
          <Route path="suppliers" element={<ProtectedRoute allowedRoles={ROLES.WAREHOUSE_OPS} moduleId="suppliers"><Suppliers /></ProtectedRoute>} />
          
          <Route path="employees" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER']} moduleId="employees"><Employees /></ProtectedRoute>} />
          <Route path="attendance" element={<ProtectedRoute allowedRoles={ROLES.ALL} moduleId="attendance"><Attendance /></ProtectedRoute>} />
          <Route path="leave" element={<ProtectedRoute allowedRoles={ROLES.ALL} moduleId="leave"><Leave /></ProtectedRoute>} />
          <Route path="payroll" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT']} moduleId="payroll"><Payroll /></ProtectedRoute>} />
          
          <Route path="expenses" element={<ProtectedRoute allowedRoles={ROLES.FINANCE} moduleId="expenses"><Expenses /></ProtectedRoute>} />
          <Route path="payments" element={<ProtectedRoute allowedRoles={ROLES.FINANCE} moduleId="payments"><Payments /></ProtectedRoute>} />
          
          <Route path="tasks" element={<ProtectedRoute allowedRoles={ROLES.ALL} moduleId="tasks"><Tasks /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT']} moduleId="reports"><Reports /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={ROLES.SETTINGS_OPS} moduleId="core"><Settings /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute allowedRoles={ROLES.ALL} moduleId="core"><Notifications /></ProtectedRoute>} />
          <Route path="branches" element={<ProtectedRoute allowedRoles={['OWNER']} moduleId="core"><Branches /></ProtectedRoute>} />
          <Route path="hq-analytics" element={<ProtectedRoute allowedRoles={['OWNER']} moduleId="core"><HQAnalytics /></ProtectedRoute>} />
          <Route path="more" element={<ProtectedRoute allowedRoles={ROLES.ALL} moduleId="core"><MobileMenu /></ProtectedRoute>} />
          
          {/* Catch all authenticated routes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
