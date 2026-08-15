import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import { initializeDemoData } from './services/demoData';

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
import { useAppContext } from './context/AppContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole } = useAppContext();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If authenticated but unauthorized for this specific route, send to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Route Groups for easy maintenance
const ROLES = {
  ALL: ['Owner', 'Admin', 'Manager', 'Sales Staff', 'Cashier', 'Warehouse', 'Accountant', 'HR', 'Employee'],
  MANAGEMENT: ['Owner', 'Admin', 'Manager'],
  SALES_POS: ['Owner', 'Admin', 'Manager', 'Sales Staff', 'Cashier'],
  WAREHOUSE_OPS: ['Owner', 'Admin', 'Manager', 'Warehouse'],
  FINANCE: ['Owner', 'Admin', 'Accountant'],
  HR_OPS: ['Owner', 'Admin', 'HR'],
  SETTINGS_OPS: ['Owner', 'Admin']
};

function App() {
  useEffect(() => {
    initializeDemoData();
  }, []);

  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
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
            <Route path="customers" element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'Manager', 'Sales Staff']}><Customers /></ProtectedRoute>} />
            
            <Route path="products" element={<ProtectedRoute allowedRoles={ROLES.WAREHOUSE_OPS}><Products /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute allowedRoles={ROLES.WAREHOUSE_OPS}><Inventory /></ProtectedRoute>} />
            <Route path="purchases" element={<ProtectedRoute allowedRoles={ROLES.WAREHOUSE_OPS}><Purchases /></ProtectedRoute>} />
            <Route path="suppliers" element={<ProtectedRoute allowedRoles={ROLES.WAREHOUSE_OPS}><Suppliers /></ProtectedRoute>} />
            
            <Route path="employees" element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'Manager', 'HR']}><Employees /></ProtectedRoute>} />
            <Route path="attendance" element={<ProtectedRoute allowedRoles={ROLES.ALL}><Attendance /></ProtectedRoute>} />
            <Route path="leave" element={<ProtectedRoute allowedRoles={ROLES.ALL}><Leave /></ProtectedRoute>} />
            <Route path="payroll" element={<ProtectedRoute allowedRoles={['Owner', 'Admin', 'HR', 'Accountant']}><Payroll /></ProtectedRoute>} />
            
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
    </AppProvider>
  );
}

export default App;
