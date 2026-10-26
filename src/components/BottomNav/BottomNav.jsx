import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, TrendingUp, ShoppingBag, MoreHorizontal } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  return (
    <nav className="k-floating-pill-nav" aria-label="Mobile Navigation">
      <div className="k-pill-dock-container">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => 'k-pill-nav-item ' + (isActive ? 'active' : '')}
        >
          <div className="k-nav-icon-wrap">
            <LayoutGrid size={19} />
          </div>
          <span className="k-nav-label">Home</span>
        </NavLink>

        <NavLink 
          to="/pos" 
          className={({ isActive }) => 'k-pill-nav-item ' + (isActive ? 'active' : '')}
        >
          <div className="k-nav-icon-wrap">
            <TrendingUp size={19} />
          </div>
          <span className="k-nav-label">Sales</span>
        </NavLink>

        <NavLink 
          to="/orders" 
          className={({ isActive }) => 'k-pill-nav-item ' + (isActive ? 'active' : '')}
        >
          <div className="k-nav-icon-wrap">
            <ShoppingBag size={19} />
          </div>
          <span className="k-nav-label">Orders</span>
        </NavLink>

        <NavLink 
          to="/more" 
          className={({ isActive }) => 'k-pill-nav-item ' + (isActive ? 'active' : '')}
        >
          <div className="k-nav-icon-wrap">
            <MoreHorizontal size={19} />
          </div>
          <span className="k-nav-label">More</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
