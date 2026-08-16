import React from 'react';
import { useAppContext } from '../../context/AppContext';
import DashboardPremium from './DashboardPremium';
import DashboardLegacy from './DashboardLegacy';

const Dashboard = () => {
  const { appUiVersion } = useAppContext();

  if (appUiVersion === 'legacy') {
    return <DashboardLegacy />;
  }

  // Default to Premium Command Center
  return <DashboardPremium />;
};

export default Dashboard;
