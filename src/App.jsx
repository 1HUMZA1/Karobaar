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

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { authStatus, userRole } = useAppContext();
  
  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (authStatus === 'pending_onboarding') {
    return <Navigate to="/setup" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If authenticated but unauthorized for this specific route, send to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Route Groups for easy maintenance
const ROLES = {
  ALL: ['OWNER', 'ADMIN', 'MANAGER', 'SALES STAFF', 'CASHIER', 'WAREHOUSE', 'ACCOUNTANT', 'HR', 'EMPLOYEE'],
  MANAGEMENT: ['OWNER', 'ADMIN', 'MANAGER'],
  SALES_POS: ['OWNER', 'ADMIN', 'MANAGER', 'SALES STAFF', 'CASHIER'],
  WAREHOUSE_OPS: ['OWNER', 'ADMIN', 'MANAGER', 'WAREHOUSE'],
  FINANCE: ['OWNER', 'ADMIN', 'ACCOUNTANT'],
  HR_OPS: ['OWNER', 'ADMIN', 'HR'],
  SETTINGS_OPS: ['OWNER', 'ADMIN']
};

const LOADING_QUOTES = [
  "Initializing system architecture...",
  "Syncing business data...",
  "Loading dashboard modules...",
  "Making the setup ready for you...",
  "Establishing secure connection...",
  "Almost there..."
];

const AppContent = () => {
  const { authStatus } = useAppContext();
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (authStatus !== 'loading') return;
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % LOADING_QUOTES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [authStatus]);

  if (authStatus === 'loading') {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000', color: 'white', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-1px', background: 'linear-gradient(to right, #fff, #a0a0a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>K</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <p style={{ margin: 0, fontWeight: 500, fontSize: '0.85rem', letterSpacing: '4px', textTransform: 'uppercase', color: '#888' }}>Karobaar OS</p>
            <div style={{ width: '120px', height: '2px', backgroundColor: '#1a1a1a', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff', borderRadius: '4px', animation: 'progress-sweep 1s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}></div>
            </div>
            <p style={{ 
              marginTop: '16px', 
              fontSize: '1rem', 
              color: '#888', 
              fontStyle: 'italic',
              animation: 'pulse-opacity 2s infinite ease-in-out',
              textAlign: 'center',
              maxWidth: '300px'
            }}>
              {LOADING_QUOTES[quoteIndex]}
            </p>
          </div>
        </div>
        <style>{`
          @keyframes progress-sweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes pulse-opacity {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
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
          
          <Route path="pos" element={<ProtectedRoute allowedRoles={ROLES.SALES_POS}><POS /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute allowedRoles={ROLES.SALES_POS}><Orders /></ProtectedRoute>} />
          <Route path="customers" element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'SALES STAFF']}><Customers /></ProtectedRoute>} />
          
          <Route path="products" element={<ProtectedRoute allowedRoles={ROLES.WAREHOUSE_OPS}><Products /></ProtectedRoute>} />
          <Route path="inventory" element={<ProtectedRoute allowedRoles={ROLES.WAREHOUSE_OPS}><Inventory /></ProtectedRoute>} />
          <Route path="purchases" element={<ProtectedRoute allowedRoles={ROLES.WAREHOUSE_OPS}><Purchases /></ProtectedRoute>} />
          <Route path="suppliers" element={<ProtectedRoute allowedRoles={ROLES.WAREHOUSE_OPS}><Suppliers /></ProtectedRoute>} />
          
          <Route path="employees" element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'HR']}><Employees /></ProtectedRoute>} />
          <Route path="attendance" element={<ProtectedRoute allowedRoles={ROLES.ALL}><Attendance /></ProtectedRoute>} />
          <Route path="leave" element={<ProtectedRoute allowedRoles={ROLES.ALL}><Leave /></ProtectedRoute>} />
          <Route path="payroll" element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'HR', 'ACCOUNTANT']}><Payroll /></ProtectedRoute>} />
          
          <Route path="expenses" element={<ProtectedRoute allowedRoles={ROLES.FINANCE}><Expenses /></ProtectedRoute>} />
          
          <Route path="tasks" element={<ProtectedRoute allowedRoles={ROLES.ALL}><Tasks /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'Manager', 'HR', 'Accountant']}><Reports /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={ROLES.SETTINGS_OPS}><Settings /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute allowedRoles={ROLES.ALL}><Notifications /></ProtectedRoute>} />
          
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
