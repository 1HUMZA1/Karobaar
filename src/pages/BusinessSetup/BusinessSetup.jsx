import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../services/databaseService';
import { Button } from '../../components/ui/Button';
import './BusinessSetup.css';

const BusinessSetup = () => {
  const { currentUser, refreshUserProfile, isAuthLoading } = useAppContext();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Retail');
  const [currency, setCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If they aren't logged in at all, or they are logged in but NOT pending setup, redirect.
  if (!isAuthLoading && (!currentUser || !currentUser.isPendingSetup)) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setError('Business name is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Create the Business
      const newBusiness = await db.add('businesses', {
        name: businessName,
        type: businessType,
        currency: currency
      });

      // 2. Create the User Profile as OWNER
      await db.add('users', {
        firebaseUid: currentUser.firebaseUid,
        email: currentUser.email,
        name: currentUser.name || 'New Owner',
        photoURL: currentUser.photoURL || '',
        role: 'Owner',
        businessId: newBusiness.id,
        accountStatus: 'active'
      });

      // 3. Refresh Context to exit pending state
      await refreshUserProfile();
      
      // 4. Redirect to Dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      setError('Failed to create business. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-header">
          <div className="setup-logo">
            <span className="logo-icon-box">K</span>
          </div>
          <h2>Create Your Business</h2>
          <p>Welcome to Karobaar! Let's set up your workspace.</p>
        </div>

        {error && <div className="setup-error">{error}</div>}

        <form onSubmit={handleCreateBusiness}>
          <div className="form-group">
            <label>Business Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div className="form-group">
            <label>Business Type</label>
            <select 
              className="form-input"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
            >
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Services">Services</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Currency</label>
            <select 
              className="form-input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="PKR">PKR (Rs)</option>
            </select>
          </div>

          <Button type="submit" className="setup-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Workspace...' : 'Complete Setup'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BusinessSetup;
