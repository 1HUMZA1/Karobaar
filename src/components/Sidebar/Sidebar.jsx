import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Calculator, ClipboardList, 
  Users, Package, Box, ShoppingBag, Truck, UserCircle, 
  Clock, CalendarOff, Banknote, Receipt, FileText, 
  BarChart3, CheckSquare, Bell, Settings, X, CreditCard,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import './Sidebar.css';

const ALL_ROLES = ['Owner', 'Admin', 'Manager', 'Sales Staff', 'Cashier', 'Warehouse', 'Accountant', 'HR', 'Employee', 'OWNER'];
const MANAGEMENT = ['Owner', 'Admin', 'Manager', 'OWNER'];
const SALES_POS = ['Owner', 'Admin', 'Manager', 'Sales Staff', 'Cashier', 'OWNER'];
const WAREHOUSE_OPS = ['Owner', 'Admin', 'Manager', 'Warehouse', 'OWNER'];
const FINANCE = ['Owner', 'Admin', 'Accountant', 'OWNER'];
const HR_OPS = ['Owner', 'Admin', 'HR', 'Manager', 'OWNER'];

const navGroups = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ALL_ROLES, moduleId: 'core' },
    ]
  },
  {
    title: 'SALES',
    items: [
      { name: 'POS / New Sale', path: '/pos', icon: <Calculator size={20} />, roles: SALES_POS, moduleId: 'pos' },
      { name: 'Orders', path: '/orders', icon: <ClipboardList size={20} />, roles: SALES_POS, moduleId: 'sales' },
      { name: 'Invoices', path: '/invoices', icon: <FileText size={20} />, roles: FINANCE, moduleId: 'invoices' },
    ]
  },
  {
    title: 'INVENTORY',
    items: [
      { name: 'Products', path: '/products', icon: <Package size={20} />, roles: WAREHOUSE_OPS, moduleId: 'inventory' },
      { name: 'Stock / Inventory', path: '/inventory', icon: <Box size={20} />, roles: WAREHOUSE_OPS, moduleId: 'inventory' },
      { name: 'Purchases', path: '/purchases', icon: <ShoppingBag size={20} />, roles: WAREHOUSE_OPS, moduleId: 'purchases' },
      { name: 'Suppliers', path: '/suppliers', icon: <Truck size={20} />, roles: WAREHOUSE_OPS, moduleId: 'suppliers' },
    ]
  },
  {
    title: 'CUSTOMERS',
    items: [
      { name: 'Customers', path: '/customers', icon: <Users size={20} />, roles: SALES_POS, moduleId: 'customers' },
    ]
  },
  {
    title: 'PEOPLE',
    items: [
      { name: 'Employees', path: '/employees', icon: <UserCircle size={20} />, roles: HR_OPS, moduleId: 'employees' },
      { name: 'Attendance', path: '/attendance', icon: <Clock size={20} />, roles: ALL_ROLES, moduleId: 'attendance' },
      { name: 'Leave', path: '/leave', icon: <CalendarOff size={20} />, roles: ALL_ROLES, moduleId: 'leave' },
      { name: 'Payroll', path: '/payroll', icon: <Banknote size={20} />, roles: HR_OPS, moduleId: 'payroll' },
    ]
  },
  {
    title: 'FINANCE',
    items: [
      { name: 'Expenses', path: '/expenses', icon: <Receipt size={20} />, roles: FINANCE, moduleId: 'expenses' },
      { name: 'Payments', path: '/payments', icon: <CreditCard size={20} />, roles: FINANCE, moduleId: 'payments' },
      { name: 'Reports', path: '/reports', icon: <BarChart3 size={20} />, roles: MANAGEMENT, moduleId: 'reports' },
    ]
  },
  {
    title: 'BUSINESS',
    items: [
      { name: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} />, roles: ALL_ROLES, moduleId: 'tasks' },
      { name: 'Settings', path: '/settings', icon: <Settings size={20} />, roles: ['Owner', 'Admin', 'OWNER'], moduleId: 'core' },
    ]
  }
];

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen, userRole, currentBusiness } = useAppContext();
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const enabledModules = currentBusiness?.modules || {};
  
  const togglePin = () => setIsPinned(!isPinned);
  const isEffectivelyCollapsed = !isPinned;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside 
        className={`sidebar ${sidebarOpen ? 'mobile-open' : ''} ${isEffectivelyCollapsed ? 'collapsed' : ''}`}
      >
        <div className="sidebar-header">
          <div className="logo-container" onClick={() => window.open('#/home', '_blank')} style={{ cursor: 'pointer' }} title="Visit Karobaar Landing Page">
            <span className="logo-icon">K</span>
            <span className="logo-text">Karobaar</span>
          </div>
          
          <button 
            className="sidebar-close-btn hidden-desktop"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <button className="sidebar-toggle-btn hidden-mobile" onClick={togglePin}>
          {isEffectivelyCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className="sidebar-business-info">
          <div className="business-badge">
            {currentBusiness?.name || 'My Business'}
          </div>
        </div>

        <nav className="sidebar-nav custom-scrollbar">
          {navGroups.map((group, groupIdx) => {
            // Filter items in this group
            const visibleItems = group.items.filter(item => {
              const hasRole = item.roles.includes(userRole) || userRole === 'OWNER';
              const isModuleEnabled = item.moduleId === 'core' || enabledModules[item.moduleId] === true || enabledModules[item.moduleId] === "true";
              return hasRole && isModuleEnabled;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="nav-group">
                <h4 className="nav-group-title">{group.title}</h4>
                <ul>
                  {visibleItems.map((item) => (
                    <li key={item.name}>
                      <NavLink 
                        to={item.path} 
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title={isEffectivelyCollapsed ? item.name : undefined}
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
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p className="footer-title">Karobaar OS</p>
          <p className="footer-version">v2.0.0</p>
          <p className="footer-status"><span>●</span> All systems operational</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
