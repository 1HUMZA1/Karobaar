import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import DashboardPremium from './DashboardPremium';
import DashboardLegacy from './DashboardLegacy';
import './DashboardModeTransition.css';

const Dashboard = () => {
  const { appUiVersion, setAppUiVersion } = useAppContext();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState('');

  const handleSwitchMode = (targetMode) => {
    if (targetMode === appUiVersion) return;
    
    const message = targetMode === 'legacy' ? 'Changing to Legacy Mode...' : 'Changing to Premium Mode...';
    setTransitionText(message);
    setIsTransitioning(true);

    // Smooth deliberate transition
    setTimeout(() => {
      setAppUiVersion(targetMode);
    }, 380);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 650);
  };

  return (
    <>
      {/* Loading Screen Overlay when toggling modes */}
      {isTransitioning && (
        <div className="mode-transition-overlay" aria-live="polite" role="status">
          <div className="mode-transition-box">
            <div className="mode-transition-logo">K</div>
            <div className="mode-transition-spinner"></div>
            <div>
              <h3 className="mode-transition-title">{transitionText}</h3>
              <p className="mode-transition-sub">Applying layout & features</p>
            </div>
            <div className="mode-transition-bar">
              <div className="mode-transition-bar-fill"></div>
            </div>
          </div>
        </div>
      )}

      {appUiVersion === 'legacy' ? (
        <DashboardLegacy onSwitchMode={handleSwitchMode} currentMode="legacy" />
      ) : (
        <DashboardPremium onSwitchMode={handleSwitchMode} currentMode="premium" />
      )}
    </>
  );
};

export default Dashboard;
