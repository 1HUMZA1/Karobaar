import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, TrendingUp, Sparkles, Package, ShoppingBag, MoreHorizontal } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  return (
    <nav className="k-floating-pill-nav" aria-label="Mobile Navigation">
      <div className="k-pill-dock-container">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => 'k-pill-nav-item ' + (isActive ? 'active' : '')}
          title="Dashboard"
        >
          <div className="k-nav-icon-wrap">
            <LayoutGrid size={18} />
          </div>
          <span className="k-nav-label">Home</span>
        </NavLink>

        <NavLink 
          to="/pos" 
          className={({ isActive }) => 'k-pill-nav-item ' + (isActive ? 'active' : '')}
          title="POS / Sales"
        >
          <div className="k-nav-icon-wrap">
            <TrendingUp size={18} />
          </div>
          <span className="k-nav-label">POS</span>
        </NavLink>

        <NavLink 
          to="/products" 
          className={({ isActive }) => 'k-pill-nav-item ' + (isActive ? 'active' : '')}
          title="Products"
        >
          <div className="k-nav-icon-wrap">
            <Package size={18} />
          </div>
          <span className="k-nav-label">Stock</span>
        </NavLink>

        <NavLink 
          to="/orders" 
          className={({ isActive }) => 'k-pill-nav-item ' + (isActive ? 'active' : '')}
          title="Orders"
        >
          <div className="k-nav-icon-wrap">
            <ShoppingBag size={18} />
          </div>
          <span className="k-nav-label">Orders</span>
        </NavLink>

                <button 
          type="button" 
          onClick={() => window.dispatchEvent(new CustomEvent('karobaar_wake_ai_assistant'))}
          className="k-pill-nav-item"
          title="Wake Jarvis Voice Assistant"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div className="k-nav-icon-wrap">
            <Sparkles size={18} />
          </div>
          <span className="k-nav-label">Jarvis</span>
        </button>
        <NavLink 
          to="/more" 
          className={({ isActive }) => 'k-pill-nav-item ' + (isActive ? 'active' : '')}
          title="All Modules"
        >
          <div className="k-nav-icon-wrap">
            <MoreHorizontal size={18} />
          </div>
          <span className="k-nav-label">Menu</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;