import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Calculator, ClipboardList, 
  Users, Package, Box, ShoppingBag, Truck, UserCircle, 
  Clock, CalendarOff, Banknote, Receipt, FileText, 
  BarChart3, CheckSquare, Bell, Settings, Menu, X
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import './Sidebar.css';

const navItems = [
  { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
  { name: 'Sales', path: '/sales', icon: <ShoppingCart size={20} /> },
  { name: 'POS', path: '/pos', icon: <Calculator size={20} /> },
  { name: 'Orders', path: '/orders', icon: <ClipboardList size={20} /> },
  { name: 'Customers', path: '/customers', icon: <Users size={20} /> },
  { name: 'Products', path: '/products', icon: <Package size={20} /> },
  { name: 'Inventory', path: '/inventory', icon: <Box size={20} /> },
  { name: 'Purchases', path: '/purchases', icon: <ShoppingBag size={20} /> },
  { name: 'Suppliers', path: '/suppliers', icon: <Truck size={20} /> },
  { name: 'Employees', path: '/employees', icon: <UserCircle size={20} /> },
  { name: 'Attendance', path: '/attendance', icon: <Clock size={20} /> },
  { name: 'Leave', path: '/leave', icon: <CalendarOff size={20} /> },
  { name: 'Payroll', path: '/payroll', icon: <Banknote size={20} /> },
  { name: 'Expenses', path: '/expenses', icon: <Receipt size={20} /> },
  { name: 'Invoices', path: '/invoices', icon: <FileText size={20} /> },
  { name: 'Reports', path: '/reports', icon: <BarChart3 size={20} /> },
  { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
  { name: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} /> },
  { name: 'Notifications', path: '/notifications', icon: <Bell size={20} /> },
  { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
];

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useAppContext();

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
            <div className="logo-icon">M</div>
            <span className="logo-text">My Business</span>
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
            {navItems.map((item) => (
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
