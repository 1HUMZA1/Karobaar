import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import BottomNav from '../BottomNav/BottomNav';
import { ErrorBoundary } from '../ErrorBoundary';
import './Layout.css';

const Layout = () => {
  return (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="layout-content">
        <Topbar />
        <main className="layout-main relative custom-scrollbar">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;
