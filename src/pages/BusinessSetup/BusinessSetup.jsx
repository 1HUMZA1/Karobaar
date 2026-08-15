import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../services/databaseService';
import { Button } from '../../components/ui/Button';
import { auth } from '../../services/firebase';
import './BusinessSetup.css';

const MODULES_LIST = [
  { id: 'sales', label: 'Sales' },
  { id: 'pos', label: 'POS' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'customers', label: 'Customers' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'employees', label: 'Employees' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'leave', label: 'Leave Management' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'payments', label: 'Payments' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'reports', label: 'Reports' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'projects', label: 'Projects' },
  { id: 'documents', label: 'Business Documents' },
  { id: 'notifications', label: 'Notifications' }
];

const COUNTRY_CITIES = {
  "India": ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow"],
  "Pakistan": ["Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", "Peshawar", "Multan", "Hyderabad", "Islamabad", "Quetta"],
  "USA": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas"],
  "UK": ["London", "Birmingham", "Manchester", "Glasgow", "Newcastle", "Sheffield", "Liverpool", "Leeds", "Bristol"],
  "UAE": ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah", "Fujairah"],
  "Bangladesh": ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Barisal", "Rangpur", "Comilla"],
  "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Hobart"],
  "Other": []
};

const BusinessSetup = () => {
  const { authStatus, currentUser, refreshUserProfile } = useAppContext();
  const navigate = useNavigate();

  const isAuthLoading = authStatus === 'loading';

  // If the user has already completed setup, do not let them stay on this page
  if (authStatus === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Personal Profile
  const [personal, setPersonal] = useState({
    fullName: currentUser?.name || '',
    phone: '',
    language: 'English'
  });

  // Step 2: Business Info
  const [business, setBusiness] = useState({
    name: '',
    type: 'Retail',
    category: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pin: '',
    phone: '',
    email: '',
    website: '',
    gst: '',
    currency: 'USD',
    fyStart: 'April',
    timezone: 'UTC'
  });

  // Step 3: Business Size
  const [size, setSize] = useState({
    employees: '1',
    monthlySales: 'Under ₹50,000'
  });

  // Step 4: Modules
  const [modules, setModules] = useState(['sales', 'inventory', 'customers', 'reports']);

  // Step 5: Preferences
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    language: 'English',
    timezone: 'UTC',
    taxSystem: 'GST',
    invoiceFormat: 'INV-{YYYY}-{0000}',
    lowStockThreshold: 5,
    defaultPaymentMethod: 'Cash'
  });

  if (authStatus === 'unauthenticated' || authStatus === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleModule = (modId) => {
    setModules(prev => prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]);
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && !personal.fullName.trim()) return setError('Full name is required.');
    if (step === 2 && !business.name.trim()) return setError('Business name is required.');
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);
  const [submitState, setSubmitState] = useState(''); // '', 'Saving locally...', 'Saved locally', 'Opening your dashboard...'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitState('Saving locally...');
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication lost. Please log in again.");

      // 1. Create Business
      const newBusiness = await db.add('businesses', {
        name: business.name,
        type: business.type,
        country: business.country,
        city: business.city,
        ownerId: user.uid,
        modules: modules.reduce((acc, mod) => ({ ...acc, [mod]: true }), {}),
        settings: {
          currency: preferences.currency,
          dateFormat: preferences.dateFormat,
          lowStockThreshold: Number(preferences.lowStockThreshold) || 5
        }
      });

      if (!newBusiness || !newBusiness.id) {
        throw new Error("Failed to create business profile.");
      }
      
      // 2. Add Membership
      await db.add('members', {
        userId: user.uid,
        role: 'OWNER',
        addedAt: new Date().toISOString()
      }, newBusiness.id, user.uid);

      // 3. Mark Onboarding Complete
      await db.add('users', {
        firebaseUid: user.uid,
        email: user.email,
        name: personal.fullName,
        photoURL: user.photoURL || '',
        phone: personal.phone,
        country: business.country,
        language: personal.language,
        role: 'OWNER', // frontend reference
        memberships: [newBusiness.id],
        accountStatus: 'active',
        personalPreferences: {
          theme: 'light',
          density: 'comfortable',
          layout: 'modern'
        },
        onboardingCompleted: true
      }, null, user.uid);

      setSubmitState('✓ Saved locally');

      // Refresh global state from local cache instantly
      await refreshUserProfile();
      
      setSubmitState('Opening your dashboard...');

      // Navigate to dashboard cleanly
      navigate('/dashboard');
    } catch (err) {
      console.error("[SETUP ERROR]", err);
      setError(err.message || 'Unable to save your business information. Please try again.');
      setIsSubmitting(false);
      setSubmitState('');
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card" style={{ maxWidth: '600px' }}>
        <div className="setup-header">
          <div className="setup-logo">
            <span className="logo-icon-box">K</span>
          </div>
          <h2>{['Personal Profile', 'Business Details', 'Business Size', 'Select Modules', 'Preferences'][step - 1]}</h2>
          <p>Step {step} of 5</p>
        </div>

        {error && <div className="setup-error">{error}</div>}

        <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          
          {step === 1 && (
            <div className="step-content">
              <div className="form-group"><label>Full Name</label><input type="text" className="form-input" value={personal.fullName} onChange={e => setPersonal({...personal, fullName: e.target.value})} required/></div>
              <div className="form-group"><label>Phone Number</label><input type="tel" className="form-input" value={personal.phone} onChange={e => setPersonal({...personal, phone: e.target.value})} placeholder="+919876543210"/></div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <div className="form-group"><label>Business Name</label><input type="text" className="form-input" value={business.name} onChange={e => setBusiness({...business, name: e.target.value})} required/></div>
              <div className="form-group"><label>Business Type</label>
                <select className="form-input" value={business.type} onChange={e => setBusiness({...business, type: e.target.value})}>
                  <option>Retail</option><option>Wholesale</option><option>E-commerce</option><option>Services</option><option>Manufacturing</option><option>Other</option>
                </select>
              </div>
              <div className="form-group"><label>Country</label>
                <select className="form-input" value={business.country} onChange={e => setBusiness({...business, country: e.target.value, city: ''})}>
                  <option value="">Select Country</option>
                  {Object.keys(COUNTRY_CITIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group"><label>City</label>
                <input type="text" list="city-options" className="form-input" value={business.city} onChange={e => setBusiness({...business, city: e.target.value})} placeholder={business.country ? "Select or type a city" : "Select a country first"} />
                <datalist id="city-options">
                  {(COUNTRY_CITIES[business.country] || []).map(city => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
              <div className="form-group"><label>Tax/GST Number (Optional)</label><input type="text" className="form-input" value={business.gst} onChange={e => setBusiness({...business, gst: e.target.value})}/></div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <div className="form-group"><label>Number of Employees</label>
                <select className="form-input" value={size.employees} onChange={e => setSize({...size, employees: e.target.value})}>
                  <option>1</option><option>2–5</option><option>6–10</option><option>11–25</option><option>26-50</option><option>100+</option>
                </select>
              </div>
              <div className="form-group"><label>Monthly Sales Range</label>
                <select className="form-input" value={size.monthlySales} onChange={e => setSize({...size, monthlySales: e.target.value})}>
                  <option>Under ₹50,000</option><option>₹50,000–₹1 lakh</option><option>₹1–5 lakh</option><option>₹5–10 lakh</option><option>₹50 lakh+</option>
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-content">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <p style={{margin: 0, color: '#666'}}>Select the features you want to use. You can change this later.</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    if (modules.length === MODULES_LIST.length) {
                      setModules([]);
                    } else {
                      setModules(MODULES_LIST.map(m => m.id));
                    }
                  }}
                  style={{padding: '0.25rem 0.75rem', fontSize: '0.85rem'}}
                >
                  {modules.length === MODULES_LIST.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem'}}>
                {MODULES_LIST.map(mod => (
                  <label key={mod.id} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer'}}>
                    <input type="checkbox" checked={modules.includes(mod.id)} onChange={() => toggleModule(mod.id)} />
                    {mod.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="step-content">
              <div className="form-group"><label>Currency</label>
                <select className="form-input" value={preferences.currency} onChange={e => setPreferences({...preferences, currency: e.target.value})}>
                  <option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="INR">INR (₹)</option>
                </select>
              </div>
              <div className="form-group"><label>Date Format</label>
                <select className="form-input" value={preferences.dateFormat} onChange={e => setPreferences({...preferences, dateFormat: e.target.value})}>
                  <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
                </select>
              </div>
              <div className="form-group"><label>Low Stock Threshold</label>
                <input type="number" className="form-input" value={preferences.lowStockThreshold} onChange={e => setPreferences({...preferences, lowStockThreshold: Number(e.target.value)})} min="0"/>
              </div>
            </div>
          )}

          <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
            <div className="setup-footer">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting} style={{ padding: '16px 32px' }}>
                  Back
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting} variant="primary" style={{ flex: 1, padding: '16px', fontSize: '1.1rem' }}>
                {submitState || (isSubmitting ? 'Saving...' : step === 5 ? 'Finish Setup' : 'Continue')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessSetup;
