import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle, X, ShieldAlert, Store, User } from 'lucide-react';
import './SignOutModal.css';

export const SignOutModal = () => {
  const { isSignOutModalOpen, closeSignOutModal, logout, currentUser, currentBusiness } = useAppContext();
  const navigate = useNavigate();

  if (!isSignOutModalOpen) return null;

  const handleConfirmLogout = async () => {
    closeSignOutModal();
    if (logout) {
      await logout();
    }
    navigate('/login');
  };

  return (
    <div className="signout-modal-backdrop" onClick={closeSignOutModal}>
      <div 
        className="signout-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
      >
        <button 
          className="signout-modal-close" 
          onClick={closeSignOutModal}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="signout-modal-icon-wrap">
          <div className="signout-modal-icon-ring">
            <AlertTriangle size={28} className="signout-warning-icon" />
          </div>
        </div>

        <h3 id="signout-modal-title" className="signout-modal-title">
          Sign Out of Karobaar?
        </h3>
        
        <p className="signout-modal-desc">
          Are you sure you want to sign out? You will be disconnected from your current session and returned to the sign-in screen.
        </p>

        {(currentUser || currentBusiness) && (
          <div className="signout-account-pill">
            {currentBusiness?.name && (
              <div className="signout-pill-row">
                <Store size={14} className="signout-pill-icon" />
                <span className="signout-pill-label">Business:</span>
                <strong className="signout-pill-val">{currentBusiness.name}</strong>
              </div>
            )}
            {currentUser?.email && (
              <div className="signout-pill-row">
                <User size={14} className="signout-pill-icon" />
                <span className="signout-pill-label">Account:</span>
                <span className="signout-pill-val">{currentUser.name || currentUser.email}</span>
              </div>
            )}
          </div>
        )}

        <div className="signout-warning-notice">
          <ShieldAlert size={15} className="shrink-0" />
          <span>Any unsaved draft orders or offline cache will be securely closed.</span>
        </div>

        <div className="signout-modal-actions">
          <button 
            type="button" 
            className="signout-btn-cancel" 
            onClick={closeSignOutModal}
          >
            Stay Signed In
          </button>
          <button 
            type="button" 
            className="signout-btn-confirm" 
            onClick={handleConfirmLogout}
          >
            <LogOut size={16} /> Yes, Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignOutModal;
