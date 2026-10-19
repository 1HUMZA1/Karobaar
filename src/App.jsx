import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout/Layout';

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

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles, moduleId }) => {
  const { authStatus, userRole, currentBusiness } = useAppContext();
  
  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (authStatus === 'pending_onboarding') {
    return <Navigate to="/setup" replace />;
  }
  
  // Role Check
  const hasRole = allowedRoles ? (allowedRoles.includes(userRole) || userRole === 'OWNER') : true;
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

  useEffect(() => {
    if (authStatus !== 'loading') return;
    
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
  }, [authStatus]);

  if (authStatus === 'loading') {
    return (
      <div className="login-splash-screen" style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        zIndex: 9999,
        overflow: 'hidden'
      }}>
        {/* LEFT / TOP HALF: DEEP BLACK WITH WHITE DOT GRID */}
        <div style={{
          flex: 1,
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          padding: '2.5rem',
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          overflow: 'hidden'
        }}>
          {/* Subtle soft circular ambient glow */}
          <div style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '360px', gap: '20px' }}>
            {/* White Icon Box with Black 'K' */}
            <div style={{ 
              width: '56px', 
              height: '56px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: '#ffffff', 
              color: '#000000', 
              borderRadius: '14px', 
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6)',
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-1px'
            }}>
              K
            </div>

            <div>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.5px', color: '#ffffff' }}>Karobaar</h2>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.95rem', color: '#a0a0a0', fontWeight: 500, animation: 'fade-text 2.5s infinite ease-in-out' }}>
                {SLOGANS[sloganIndex]}
              </p>
            </div>

            {/* Feature Pills matching Login Theme */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '4px' }}>
              <span style={{ padding: '6px 14px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '100px', fontSize: '0.75rem', color: '#e5e5e5', fontWeight: 500 }}>Smart POS</span>
              <span style={{ padding: '6px 14px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '100px', fontSize: '0.75rem', color: '#e5e5e5', fontWeight: 500 }}>Real-time Sync</span>
              <span style={{ padding: '6px 14px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '100px', fontSize: '0.75rem', color: '#e5e5e5', fontWeight: 500 }}>Multi-Branch</span>
            </div>
          </div>
        </div>

        {/* RIGHT / BOTTOM HALF: CRISP WHITE WITH DARK DOT GRID */}
        <div style={{
          flex: 1,
          backgroundColor: '#fafafa',
          color: '#000000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          padding: '2.5rem',
          backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          overflow: 'hidden'
        }}>
          <div style={{ width: '100%', maxWidth: '340px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111111', letterSpacing: '-0.3px' }}>Starting Workspace</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#666666' }}>Preparing your dashboard and modules...</p>
            </div>

            {/* Black progress bar on crisp white card/track */}
            <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${progress}%`, 
                height: '100%', 
                backgroundColor: '#000000', 
                borderRadius: '4px', 
                transition: 'width 0.25s ease-out'
              }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#666666', fontWeight: 500 }}>
                {SYSTEM_MESSAGES[sysMsgIndex]}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#000000', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {Math.floor(progress)}%
              </p>
            </div>

            {isSlow && (
              <div style={{ marginTop: '12px', padding: '12px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: '#666666' }}>Connection taking longer than usual...</p>
                <button 
                  type="button"
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    background: '#000000',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  Quick Refresh
                </button>
              </div>
            )}
          </div>
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
