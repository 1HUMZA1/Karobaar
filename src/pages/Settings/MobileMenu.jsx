import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { 
  Building2, 
  Users, 
  Bell, 
  CreditCard, 
  Printer, 
  Cloud, 
  HelpCircle, 
  Info, 
  LogOut, 
  ChevronRight, 
  Utensils, 
  Package, 
  FileText, 
  Receipt, 
  TrendingUp, 
  Clock, 
  Truck, 
  X,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { KarobaarLogo } from '../../components/KarobaarLogo/KarobaarLogo';
import './MobileMenu.css';

export const MobileMenu = () => {
  const { currentUser, currentBusiness, logout, requestSignOut } = useAppContext();
  const navigate = useNavigate();

  // About Screen 10 state
  const [showAbout, setShowAbout] = useState(false);

  const handleLogout = async () => {
    if (requestSignOut) {
      requestSignOut();
      return;
    }
    try {
      if (logout) {
        await logout();
      } else {
        await signOut(auth);
      }
    } catch (e) {
      console.warn("Logout:", e);
    }
    localStorage.removeItem('karobaar_session_user');
    localStorage.removeItem('karobaar_session_business');
    navigate('/login');
    window.location.reload();
  };

  const businessDisplayName = currentBusiness?.name || 'My Business';

  // Screen 10 View (About Karobaar)
  if (showAbout) {
    return (
      <div className="karobaar-about-page">
        {/* About Header */}
        <div className="k-about-top-bar">
          <button 
            type="button" 
            className="k-about-back-btn" 
            onClick={() => setShowAbout(false)}
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="k-about-header-title">About</h2>
          <div style={{ width: 24 }}></div>
        </div>

        <div className="px-4 py-3">
          {/* Pitch Black Hero Card matching Screen 10 */}
          <div className="k-about-hero-card">
            <KarobaarLogo size="lg" theme="light" layout="vertical" showTagline={true} />
          </div>

          {/* About Karobaar description */}
          <div className="k-about-content-block">
            <h3 className="k-about-subheading">About Karobaar</h3>
            <p className="k-about-desc">
              Karobaar is a simple and powerful business management app designed to help you track sales, manage orders, handle expenses and grow your business — all in one place.
            </p>

            {/* 2x2 Feature Grid matching Screen 10 */}
            <div className="k-about-feature-grid">
              <div className="k-about-feature-card">
                <div className="k-about-feature-icon">
                  <TrendingUp size={22} />
                </div>
                <span className="k-about-feature-name">Sales Tracking</span>
              </div>

              <div className="k-about-feature-card">
                <div className="k-about-feature-icon">
                  <FileText size={22} />
                </div>
                <span className="k-about-feature-name">Order Management</span>
              </div>

              <div className="k-about-feature-card">
                <div className="k-about-feature-icon">
                  <Receipt size={22} />
                </div>
                <span className="k-about-feature-name">Expense Management</span>
              </div>

              <div className="k-about-feature-card">
                <div className="k-about-feature-icon">
                  <Package size={22} />
                </div>
                <span className="k-about-feature-name">Reports & Analytics</span>
              </div>
            </div>

            {/* Bottom Dark Badge matching Screen 10 */}
            <div className="k-about-footer-card">
              <p className="k-about-footer-main">Built for businesses.</p>
              <p className="k-about-footer-sub">Powered by you.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 9 View (Settings & More)
  return (
    <div className="karobaar-settings-page pb-24">
      <MobileHeader title="Settings" />

      <div className="px-4 py-3">
        {/* Business Account Card matching Screen 9 */}
        <div className="k-settings-account-card">
          <div className="k-settings-avatar-box">
            <Utensils size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="k-settings-account-name">{businessDisplayName}</h3>
            <p className="k-settings-account-type">Business Account</p>
          </div>
          <span className="k-verified-pill">Active</span>
        </div>

        {/* Quick Operations Strip */}
        <p className="k-settings-group-label">Quick Management</p>
        <div className="k-quick-ops-grid mb-4">
          <button type="button" className="k-ops-chip" onClick={() => navigate('/products')}>
            <Package size={16} /> Products
          </button>
          <button type="button" className="k-ops-chip" onClick={() => navigate('/customers')}>
            <Users size={16} /> Customers
          </button>
          <button type="button" className="k-ops-chip" onClick={() => navigate('/expenses')}>
            <Receipt size={16} /> Expenses
          </button>
          <button type="button" className="k-ops-chip" onClick={() => navigate('/invoices')}>
            <FileText size={16} /> Invoices
          </button>
          <button type="button" className="k-ops-chip" onClick={() => navigate('/employees')}>
            <Building2 size={16} /> Employees
          </button>
          <button type="button" className="k-ops-chip" onClick={() => navigate('/reports')}>
            <TrendingUp size={16} /> Reports
          </button>
        </div>

        {/* Settings Menu List matching Screen 9 */}
        <p className="k-settings-group-label">Business Preferences</p>
        <div className="k-settings-menu-list">
          <div className="k-settings-row" onClick={() => navigate('/settings?tab=general')}>
            <div className="k-settings-row-left">
              <div className="k-settings-icon-wrap">
                <Building2 size={18} />
              </div>
              <span>Business Profile</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          <div className="k-settings-row" onClick={() => navigate('/settings?tab=users')}>
            <div className="k-settings-row-left">
              <div className="k-settings-icon-wrap">
                <Users size={18} />
              </div>
              <span>Manage Users</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          <div className="k-settings-row" onClick={() => navigate('/notifications')}>
            <div className="k-settings-row-left">
              <div className="k-settings-icon-wrap">
                <Bell size={18} />
              </div>
              <span>Notifications</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          <div className="k-settings-row" onClick={() => navigate('/settings?tab=payments')}>
            <div className="k-settings-row-left">
              <div className="k-settings-icon-wrap">
                <CreditCard size={18} />
              </div>
              <span>Payment Methods</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          <div className="k-settings-row" onClick={() => navigate('/settings?tab=printer')}>
            <div className="k-settings-row-left">
              <div className="k-settings-icon-wrap">
                <Printer size={18} />
              </div>
              <span>Printer Settings</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          <div className="k-settings-row" onClick={() => navigate('/settings?tab=backup')}>
            <div className="k-settings-row-left">
              <div className="k-settings-icon-wrap">
                <Cloud size={18} />
              </div>
              <span>Backup & Sync</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          <div className="k-settings-row" onClick={() => navigate('/settings?tab=help')}>
            <div className="k-settings-row-left">
              <div className="k-settings-icon-wrap">
                <HelpCircle size={18} />
              </div>
              <span>Help & Support</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          {/* Screen 10 trigger */}
          <div className="k-settings-row" onClick={() => setShowAbout(true)}>
            <div className="k-settings-row-left">
              <div className="k-settings-icon-wrap">
                <Info size={18} />
              </div>
              <span>About</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </div>

        {/* Outlined Log Out button matching Screen 9 */}
        <button 
          type="button" 
          className="k-logout-outline-btn mt-6"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default MobileMenu;
