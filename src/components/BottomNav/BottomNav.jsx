import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, TrendingUp, ShoppingBag, MoreHorizontal } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  return (
    <div className="bottom-nav">
      <NavLink to="/dashboard" className={({ isActive }) => 'bottom-nav-item ' + (isActive ? 'active' : '')}>
        <Home size={20} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/pos" className={({ isActive }) => 'bottom-nav-item ' + (isActive ? 'active' : '')}>
        <TrendingUp size={20} />
        <span>Sales</span>
      </NavLink>
      <NavLink to="/orders" className={({ isActive }) => 'bottom-nav-item ' + (isActive ? 'active' : '')}>
        <ShoppingBag size={20} />
        <span>Orders</span>
      </NavLink>
      <NavLink to="/more" className={({ isActive }) => 'bottom-nav-item ' + (isActive ? 'active' : '')}>
        <MoreHorizontal size={20} />
        <span>More</span>
      </NavLink>
    </div>
  );
};

export default BottomNav;
