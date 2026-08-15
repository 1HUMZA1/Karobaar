import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Calculator, ClipboardList, 
  Users, Package, Box, ShoppingBag, Truck, UserCircle, 
  Clock, CalendarOff, Banknote, Receipt, FileText, 
  BarChart3, CheckSquare, Bell, Settings, X, CreditCard
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import './Sidebar.css';

const ALL_ROLES = ['Owner', 'Admin', 'Manager', 'Sales Staff', 'Cashier', 'Warehouse', 'Accountant', 'HR', 'Employee', 'OWNER'];
const MANAGEMENT = ['Owner', 'Admin', 'Manager', 'OWNER'];
const SALES_POS = ['Owner', 'Admin', 'Manager', 'Sales Staff', 'Cashier', 'OWNER'];
const WAREHOUSE_OPS = ['Owner', 'Admin', 'Manager', 'Warehouse', 'OWNER'];
const FINANCE = ['Owner', 'Admin', 'Accountant', 'OWNER'];
const HR_OPS = ['Owner', 'Admin', 'HR', 'Manager', 'OWNER'];

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ALL_ROLES, moduleId: 'core' },
  { name: 'POS', path: '/pos', icon: <Calculator size={20} />, roles: SALES_POS, moduleId: 'pos' },
  { name: 'Orders', path: '/orders', icon: <ClipboardList size={20} />, roles: SALES_POS, moduleId: 'sales' },
  { name: 'Customers', path: '/customers', icon: <Users size={20} />, roles: SALES_POS, moduleId: 'customers' },
  { name: 'Products', path: '/products', icon: <Package size={20} />, roles: WAREHOUSE_OPS, moduleId: 'inventory' },
  { name: 'Inventory', path: '/inventory', icon: <Box size={20} />, roles: WAREHOUSE_OPS, moduleId: 'inventory' },
  { name: 'Purchases', path: '/purchases', icon: <ShoppingBag size={20} />, roles: WAREHOUSE_OPS, moduleId: 'purchases' },
  { name: 'Suppliers', path: '/suppliers', icon: <Truck size={20} />, roles: WAREHOUSE_OPS, moduleId: 'suppliers' },
  { name: 'Employees', path: '/employees', icon: <UserCircle size={20} />, roles: HR_OPS, moduleId: 'employees' },
  { name: 'Attendance', path: '/attendance', icon: <Clock size={20} />, roles: ALL_ROLES, moduleId: 'attendance' },
  { name: 'Leave', path: '/leave', icon: <CalendarOff size={20} />, roles: ALL_ROLES, moduleId: 'leave' },
  { name: 'Payroll', path: '/payroll', icon: <Banknote size={20} />, roles: HR_OPS, moduleId: 'payroll' },
  { name: 'Expenses', path: '/expenses', icon: <Receipt size={20} />, roles: FINANCE, moduleId: 'expenses' },
  { name: 'Invoices', path: '/invoices', icon: <FileText size={20} />, roles: FINANCE, moduleId: 'invoices' },
  { name: 'Payments', path: '/payments', icon: <CreditCard size={20} />, roles: FINANCE, moduleId: 'payments' },
  { name: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} />, roles: ALL_ROLES, moduleId: 'tasks' },
  { name: 'Reports', path: '/reports', icon: <BarChart3 size={20} />, roles: MANAGEMENT, moduleId: 'reports' },
  { name: 'Notifications', path: '/notifications', icon: <Bell size={20} />, roles: ALL_ROLES, moduleId: 'core' },
  { name: 'Settings', path: '/settings', icon: <Settings size={20} />, roles: ['Owner', 'Admin', 'OWNER'], moduleId: 'core' },
];

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen, userRole, currentBusiness } = useAppContext();

  const enabledModules = currentBusiness?.modules || {};
  
  const filteredNavItems = navItems.filter(item => {
    // 1. Check Role Access
    const hasRole = item.roles.includes(userRole) || userRole === 'OWNER';
    // 2. Check Module Enablement (core modules are always enabled)
    const isModuleEnabled = item.moduleId === 'core' || enabledModules[item.moduleId] === true || enabledModules[item.moduleId] === "true";
    
    return hasRole && isModuleEnabled;
  });

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">K</div>
            <span className="logo-text">Karobaar</span>
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {filteredNavItems.map((item) => (
              <li key={item.name}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (window.innerWidth <= 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
