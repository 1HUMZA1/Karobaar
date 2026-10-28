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
import BusinessSetup from './pages/BusinessSetup/BusinessSetup';
import Invoices from './pages/Invoices/Invoices';
import Payments from './pages/Payments/Payments';
import Landing from './pages/Landing/Landing';
import Branches from './pages/Branches/Branches';
import HQAnalytics from './pages/Branches/HQAnalytics';
import MobileMenu from './pages/Settings/MobileMenu';
import AccessDenied from './components/AccessDenied/AccessDenied';
import { hasPermission, normalizeRole, PERMISSIONS } from './utils/permissions';

// Protected Route Component with Role & Permission Enforcement
const ProtectedRoute = ({ children, allowedRoles, requiredPermission, moduleId }) => {
  const { authStatus, userRole, currentUser, currentBusiness } = useAppContext();
  
  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (authStatus === 'pending_onboarding') {
    return <Navigate to="/setup" replace />;
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
  "Transforming Effort Into Growth.",
  "Where Effort Becomes Growth.",
  "Empowering Work. Accelerating Growth.",
  "Work Smarter. Grow Stronger.",
  "Turning Vision Into Progress.",
  "Built to Simplify. Designed to Grow.",
  "Your Business. Your Growth.",
  "From Ideas to Impact.",
  "Powering Smarter Business.",
  "Elevate Your Work. Accelerate Growth.",
  "Business, Simplified.",
  "Plan Better. Work Smarter. Grow Faster.",
  "Turning Ambition Into Achievement.",
  "Built for Businesses That Think Bigger.",
  "Smarter Tools. Stronger Businesses.",
  "Make Every Move Count.",
  "Your Growth Starts Here.",
  "Drive Progress. Build Success.",
  "Work Better. Achieve More.",
  "Karobaar — Built to Grow."
];

const SYSTEM_MESSAGES = [
  "Initializing system architecture...",
  "Syncing business data...",
  "Loading dashboard modules...",
  "Making the setup ready for you...",
  "Establishing secure connection...",
  "Almost there..."
];

const AppContent = () => {
  const { authStatus, currentUser, currentBusiness } = useAppContext();
  const [sloganIndex, setSloganIndex] = useState(0);
  const [sysMsgIndex, setSysMsgIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [isSlow, setIsSlow] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Hard 800ms limit: never trap user on loading/splash screen
    const hardLimit = setTimeout(() => {
      setTimedOut(true);
    }, 800);
    return () => clearTimeout(hardLimit);
  }, []);

  useEffect(() => {
    if (authStatus !== 'loading' || timedOut) return;
    
    const sloganInterval = setInterval(() => {
      setSloganIndex(prev => (prev + 1) % SLOGANS.length);
    }, 2000);
    
    const sysMsgInterval = setInterval(() => {
      setSysMsgIndex(prev => (prev + 1) % SYSTEM_MESSAGES.length);
    }, 1200);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 80) return prev + 15;
        if (prev < 95) return prev + 5;
        return Math.min(prev + 1, 99);
      });
    }, 120);

    const slowTimer = setTimeout(() => {
      setIsSlow(true);
    }, 4000);
    
    return () => {
      clearInterval(sloganInterval);
      clearInterval(sysMsgInterval);
      clearInterval(progressInterval);
      clearTimeout(slowTimer);
    };
  }, [authStatus, timedOut]);

  if (authStatus === 'loading' && !timedOut) {
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

          {/* Sleek Loading Progress Bar */}
          <div style={{
            width: '240px',
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
              transition: 'width 0.25s ease-out'
            }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '240px',
            fontSize: '0.82rem',
            color: 'var(--text-muted, #71717a)',
            fontWeight: 500
          }}>
            <span>{SYSTEM_MESSAGES[sysMsgIndex]}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main, #09090b)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.floor(progress)}%
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

  return (
    <HashRouter>
      <Routes>
        <Route path="/home" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<BusinessSetup />} />
        
        <Route path="/" element={
          <ProtectedRoute allowedRoles={ROLES.ALL}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
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
