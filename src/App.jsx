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
  const { authStatus } = useAppContext();
  const [sloganIndex, setSloganIndex] = useState(0);
  const [sysMsgIndex, setSysMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (authStatus !== 'loading') return;
    
    const sloganInterval = setInterval(() => {
      setSloganIndex(prev => (prev + 1) % SLOGANS.length);
    }, 2500);
    
    const sysMsgInterval = setInterval(() => {
      setSysMsgIndex(prev => (prev + 1) % SYSTEM_MESSAGES.length);
    }, 1800);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const increment = prev < 60 ? Math.random() * 15 : (prev < 90 ? Math.random() * 5 : Math.random() * 1.5);
        return Math.min(prev + increment, 99);
      });
    }, 250);
    
    return () => {
      clearInterval(sloganInterval);
      clearInterval(sysMsgInterval);
      clearInterval(progressInterval);
    };
  }, [authStatus]);

  if (authStatus === 'loading') {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)', position: 'fixed', top: 0, left: 0, zIndex: 9999, transition: 'background-color 0.3s' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%', maxWidth: '400px' }}>
          
          {/* Logo */}
          <div style={{ position: 'relative', width: '84px', height: '84px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', color: 'var(--text-main)', border: '3px solid var(--text-main)', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', animation: 'pulse-soft 2.5s infinite ease-in-out' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-1px' }}>K</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-main)' }}>Karobaar</h2>
            
            {/* Slogan */}
            <p style={{ 
              margin: '0 0 24px 0',
              fontSize: '1rem', 
              color: 'var(--text-secondary)', 
              fontWeight: 500,
              animation: 'fade-text 2.5s infinite ease-in-out',
              textAlign: 'center'
            }}>
              {SLOGANS[sloganIndex]}
            </p>
            
            {/* Progress Bar & System Message */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', padding: '0 32px' }}>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--text-primary)', borderRadius: '4px', transition: 'width 0.3s ease-out' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 4px' }}>
                <p style={{ 
                  margin: 0,
                  fontSize: '0.75rem', 
                  color: 'var(--text-muted)', 
                  fontWeight: 500
                }}>
                  {SYSTEM_MESSAGES[sysMsgIndex]}
                </p>
                <p style={{ 
                  margin: 0,
                  fontSize: '0.75rem', 
                  color: 'var(--text-main)', 
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {Math.floor(progress)}%
                </p>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes spin-fast {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fade-text {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          @keyframes pulse-soft {
            0%, 100% { transform: scale(1); box-shadow: var(--shadow-md); }
            50% { transform: scale(1.02); box-shadow: var(--shadow-lg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
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
