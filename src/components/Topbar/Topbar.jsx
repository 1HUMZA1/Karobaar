import React from 'react';
import { Menu, Search, Sun, Moon, Bell, User } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import './Topbar.css';

const Topbar = () => {
  const { toggleSidebar, theme, toggleTheme, userRole } = useAppContext();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search products, orders, customers..." 
            className="search-input"
          />
        </div>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        
        <button className="icon-btn notification-btn" title="Notifications">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        <div className="user-profile">
          <div className="avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
