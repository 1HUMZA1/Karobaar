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
  const [collapsed, setCollapsed] = useState(false);

  const enabledModules = currentBusiness?.modules || {};
  
  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">K</div>
            {!collapsed && <span className="logo-text">Karobaar</span>}
          </div>
          
          <button className="sidebar-toggle-btn hidden-mobile" onClick={toggleCollapse}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <button 
            className="sidebar-close-btn hidden-desktop"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-business-info">
          {!collapsed && (
            <div className="business-badge">
              {currentBusiness?.businessName || 'My Business'}
            </div>
          )}
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
                {!collapsed && <h4 className="nav-group-title">{group.title}</h4>}
                <ul>
                  {visibleItems.map((item) => (
                    <li key={item.name}>
                      <NavLink 
                        to={item.path} 
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title={collapsed ? item.name : undefined}
                        onClick={() => {
                          if (window.innerWidth <= 768) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        {!collapsed && <span className="nav-text">{item.name}</span>}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="mt-auto pt-4 px-4 pb-2 border-t border-border-color text-xs text-text-muted text-center flex flex-col items-center justify-center">
            <p className="font-semibold mb-0.5">Karobaar OS</p>
            <p>Version 1.0.0</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
