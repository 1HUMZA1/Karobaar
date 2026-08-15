import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  useEffect(() => {
    initializeDemoData();
  }, []);

  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="sales" element={<Navigate to="/pos" replace />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="pos" element={<POS />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="products" element={<Products />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="settings" element={<Settings />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
