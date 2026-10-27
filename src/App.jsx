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

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles, moduleId }) => {
  const { authStatus, userRole, currentBusiness } = useAppContext();
  
  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (authStatus === 'pending_onboarding') {
    return <Navigate to="/setup" replace />;
  }
  
  // Role Check (Case-insensitive comparison)
  const normalizedRole = (userRole || 'OWNER').toUpperCase();
  const normalizedAllowed = allowedRoles ? allowedRoles.map(r => r.toUpperCase()) : [];
  const hasRole = allowedRoles ? (normalizedAllowed.includes(normalizedRole) || normalizedRole === 'OWNER') : true;
  if (!hasRole) {
    return <Navigate to="/dashboard" replace />;
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
  ALL: ['OWNER', 'MANAGER', 'STAFF', 'ACCOUNTANT', 'SALES', 'INVENTORY'],
  MANAGEMENT: ['OWNER', 'MANAGER'],
  SALES_POS: ['OWNER', 'MANAGER', 'STAFF', 'SALES'],
  WAREHOUSE_OPS: ['OWNER', 'MANAGER', 'STAFF', 'INVENTORY'],
  FINANCE: ['OWNER', 'MANAGER', 'ACCOUNTANT'],
  HR_OPS: ['OWNER', 'MANAGER'],
  SETTINGS_OPS: ['OWNER']
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
        backgroundColor: '#000000',
        color: '#ffffff',
        overflow: 'hidden',
        userSelect: 'none'
      }}>
        {/* Subtle radial ambient background light */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Center: Brand Logo + Tagline */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <KarobaarLogo 
            size="xl" 
            theme="light" 
            layout="vertical" 
            showTagline={true} 
          />
        </div>

        {/* Bottom: Minimalist pill progress bar matching Screen 1 */}
        <div style={{
          position: 'absolute',
          bottom: '48px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '140px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '9999px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '9999px',
              transition: 'width 0.2s ease-out'
            }} />
          </div>

          {isSlow && (
            <button 
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: '12px',
                padding: '6px 14px',
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              Refresh App
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
