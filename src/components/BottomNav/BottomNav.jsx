import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Box, FileText, MoreHorizontal } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  return (
    <div className="bottom-nav">
      <NavLink to="/dashboard" className={({ isActive }) => 'bottom-nav-item ' + (isActive ? 'active' : '')}>
        <LayoutDashboard size={22} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/pos" className={({ isActive }) => 'bottom-nav-item ' + (isActive ? 'active' : '')}>
        <ShoppingCart size={22} />
        <span>Sales</span>
      </NavLink>
      <NavLink to="/products" className={({ isActive }) => 'bottom-nav-item ' + (isActive ? 'active' : '')}>
        <Box size={22} />
        <span>Products</span>
      </NavLink>
      <NavLink to="/orders" className={({ isActive }) => 'bottom-nav-item ' + (isActive ? 'active' : '')}>
        <FileText size={22} />
        <span>Orders</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => 'bottom-nav-item ' + (isActive ? 'active' : '')}>
        <MoreHorizontal size={22} />
        <span>More</span>
      </NavLink>
    </div>
  );
};

export default BottomNav;
