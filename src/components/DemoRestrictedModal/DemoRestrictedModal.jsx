import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Lock, ArrowRight, X, ShieldAlert, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
import './DemoRestrictedModal.css';

/**
 * DemoRestrictedModal
 * High-visibility, elegant dialog shown when a user in demo preview mode
 * attempts to interact with or use live operational features (POS, Inventory,
 * Orders, Invoices, Customers, Settings, etc.).
 */
export const DemoRestrictedModal = () => {
  const { 
    isDemoRestrictedModalOpen, 
    demoRestrictedFeatureName, 
    closeDemoRestrictedModal,
    exitDemoWorkspace 
  } = useAppContext();
  const navigate = useNavigate();

  if (!isDemoRestrictedModalOpen) return null;

  const handleSignIn = async () => {
    closeDemoRestrictedModal();
    if (exitDemoWorkspace) {
      await exitDemoWorkspace();
    }
    navigate('/login');
  };

  const handleSetup = async () => {
    closeDemoRestrictedModal();
    if (exitDemoWorkspace) {
      await exitDemoWorkspace();
    }
    navigate('/setup?new=true');
  };

  return (
    <div className="demo-restricted-backdrop" onClick={closeDemoRestrictedModal}>
      <div 
        className="demo-restricted-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-restricted-title"
      >
        <button 
          className="demo-restricted-close" 
          onClick={closeDemoRestrictedModal}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="demo-restricted-icon-wrap">
          <div className="demo-restricted-icon-ring">
            <Lock size={26} className="demo-restricted-lock-icon" />
          </div>
        </div>

        <div className="demo-restricted-badge">
          <ShieldAlert size={12} />
          <span>Demo Preview Mode</span>
        </div>

        <h3 id="demo-restricted-title" className="demo-restricted-title">
          First sign in and do the setup
        </h3>

        <p className="demo-restricted-desc">
          You are currently exploring Karobaar in sample demo mode. To use{' '}
          <strong>{demoRestrictedFeatureName || 'this feature'}</strong> and manage live business operations, please first sign in to your account and complete your store setup.
        </p>

        <div className="demo-restricted-benefits">
          <div className="demo-benefit-item">
            <CheckCircle2 size={14} className="demo-benefit-icon" />
            <span>Process real sales, print GST tax invoices & track cash register</span>
          </div>
          <div className="demo-benefit-item">
            <CheckCircle2 size={14} className="demo-benefit-icon" />
            <span>Manage true stock inventory, custom barcodes & low-stock alerts</span>
          </div>
          <div className="demo-benefit-item">
            <CheckCircle2 size={14} className="demo-benefit-icon" />
            <span>Track customer khata (Udhaar), collect payments & invite team members</span>
          </div>
        </div>

        <div className="demo-restricted-actions">
          <button 
            type="button" 
            className="demo-btn-setup"
            onClick={handleSetup}
          >
            <Sparkles size={16} />
            <span>Complete Store Setup</span>
            <ArrowRight size={15} />
          </button>

          <button 
            type="button" 
            className="demo-btn-signin"
            onClick={handleSignIn}
          >
            <UserCheck size={15} />
            <span>Sign In / Sign Up</span>
          </button>

          <button 
            type="button" 
            className="demo-btn-cancel"
            onClick={closeDemoRestrictedModal}
          >
            Continue Browsing Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoRestrictedModal;
