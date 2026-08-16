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

  // Step 2: App Experience
  const [appKnowledge, setAppKnowledge] = useState('Newbie'); // 'Newbie', 'Rookie', 'Pro'

  // Step 3: Business Info
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

  // Step 4: Business Size
  const [size, setSize] = useState({
    employees: '1',
    monthlySales: 'Under ₹50,000'
  });

  // Step 5: Modules
  const [modules, setModules] = useState(['sales', 'inventory', 'customers', 'reports']);

  // Step 6: Preferences
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
    if (step === 3 && !business.name.trim()) return setError('Business name is required.');
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
        appKnowledge: appKnowledge, // Newbie, Rookie, Pro
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

  const stepsList = [
    { id: 1, title: 'Personal Profile', desc: 'Your contact details' },
    { id: 2, title: 'App Experience', desc: 'Tailor your learning' },
    { id: 3, title: 'Business Details', desc: 'Basic company info' },
    { id: 4, title: 'Business Size', desc: 'Scale and revenue' },
    { id: 5, title: 'Select Modules', desc: 'Features you need' },
    { id: 6, title: 'Preferences', desc: 'Regional settings' }
  ];

  return (
    <div className="setup-wrapper">
      {/* Left Panel - Visuals & Stepper */}
      <div className="setup-visuals">
        <div className="setup-brand">
          <div className="logo-icon-box">K</div>
          Karobaar OS
        </div>
        
        <div className="setup-progress">
          {stepsList.map((s) => (
            <div 
              key={s.id} 
              className={`progress-step ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}
            >
              <div className="step-indicator">
                {step > s.id ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  s.id
                )}
              </div>
              <div className="step-text">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form content */}
      <div className="setup-container">
        <div className="setup-card">
          <div className="setup-header">
            <h2>{stepsList[step - 1].title}</h2>
            <p>{stepsList[step - 1].desc}</p>
          </div>

          {error && <div className="setup-error">{error}</div>}

          <form onSubmit={step === 6 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            
            {step === 1 && (
              <div className="step-content setup-form-grid">
                <div className="setup-form-group full-width">
                  <label>Full Name</label>
                  <input type="text" className="setup-input" value={personal.fullName} onChange={e => setPersonal({...personal, fullName: e.target.value})} required placeholder="Enter your full name"/>
                </div>
                <div className="setup-form-group full-width">
                  <label>Phone Number</label>
                  <input type="tel" className="setup-input" value={personal.phone} onChange={e => setPersonal({...personal, phone: e.target.value})} placeholder="+1 (555) 000-0000"/>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step-content">
                <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem'}}>
                  How familiar are you with business management applications? This helps us tailor your experience.
                </p>
                <div className="setup-modules-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div 
                    className={`module-card ${appKnowledge === 'Newbie' ? 'selected' : ''}`}
                    onClick={() => setAppKnowledge('Newbie')}
                    style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="module-checkbox">
                        {appKnowledge === 'Newbie' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <span style={{fontWeight: 600, fontSize: '1.05rem'}}>Newbie</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '1.75rem', lineHeight: 1.4 }}>
                      I'm new to business management apps and need step-by-step guidance.
                    </span>
                  </div>

                  <div 
                    className={`module-card ${appKnowledge === 'Rookie' ? 'selected' : ''}`}
                    onClick={() => setAppKnowledge('Rookie')}
                    style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="module-checkbox">
                        {appKnowledge === 'Rookie' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <span style={{fontWeight: 600, fontSize: '1.05rem'}}>Rookie</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '1.75rem', lineHeight: 1.4 }}>
                      I have some experience with these tools, but might need occasional help.
                    </span>
                  </div>

                  <div 
                    className={`module-card ${appKnowledge === 'Pro' ? 'selected' : ''}`}
                    onClick={() => setAppKnowledge('Pro')}
                    style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="module-checkbox">
                        {appKnowledge === 'Pro' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <span style={{fontWeight: 600, fontSize: '1.05rem'}}>Pro</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '1.75rem', lineHeight: 1.4 }}>
                      I'm an experienced user and know exactly what I'm doing. No instructions needed.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-content setup-form-grid">
                <div className="setup-form-group full-width">
                  <label>Business Name</label>
                  <input type="text" className="setup-input" value={business.name} onChange={e => setBusiness({...business, name: e.target.value})} required placeholder="Acme Corporation"/>
                </div>
                <div className="setup-form-group">
                  <label>Business Type</label>
                  <select className="setup-input" value={business.type} onChange={e => setBusiness({...business, type: e.target.value})}>
                    <option>Retail</option><option>Wholesale</option><option>E-commerce</option><option>Services</option><option>Manufacturing</option><option>Other</option>
                  </select>
                </div>
                <div className="setup-form-group">
                  <label>Tax/GST Number (Optional)</label>
                  <input type="text" className="setup-input" value={business.gst} onChange={e => setBusiness({...business, gst: e.target.value})} placeholder="e.g. 22AAAAA0000A1Z5"/>
                </div>
                <div className="setup-form-group">
                  <label>Country</label>
                  <select className="setup-input" value={business.country} onChange={e => setBusiness({...business, country: e.target.value, city: ''})}>
                    <option value="">Select Country</option>
                    {Object.keys(COUNTRY_CITIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="setup-form-group">
                  <label>City</label>
                  <input type="text" list="city-options" className="setup-input" value={business.city} onChange={e => setBusiness({...business, city: e.target.value})} placeholder={business.country ? "Select or type a city" : "Select a country first"} />
                  <datalist id="city-options">
                    {(COUNTRY_CITIES[business.country] || []).map(city => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="step-content setup-form-grid">
                <div className="setup-form-group full-width">
                  <label>Number of Employees</label>
                  <select className="setup-input" value={size.employees} onChange={e => setSize({...size, employees: e.target.value})}>
                    <option>Just me (1)</option><option>2–5</option><option>6–10</option><option>11–25</option><option>26-50</option><option>100+</option>
                  </select>
                </div>
                <div className="setup-form-group full-width">
                  <label>Monthly Sales Range</label>
                  <select className="setup-input" value={size.monthlySales} onChange={e => setSize({...size, monthlySales: e.target.value})}>
                    <option>Under ₹50,000</option><option>₹50,000–₹1 lakh</option><option>₹1–5 lakh</option><option>₹5–10 lakh</option><option>₹50 lakh+</option>
                  </select>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="step-content">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                  <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem'}}>Select features you need. You can always change this later in Settings.</p>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (modules.length === MODULES_LIST.length) {
                        setModules([]);
                      } else {
                        setModules(MODULES_LIST.map(m => m.id));
                      }
                    }}
                    style={{background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline'}}
                  >
                    {modules.length === MODULES_LIST.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="setup-modules-grid">
                  {MODULES_LIST.map(mod => {
                    const isSelected = modules.includes(mod.id);
                    return (
                      <div 
                        key={mod.id} 
                        className={`module-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleModule(mod.id)}
                      >
                        <div className="module-checkbox">
                          {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <span style={{fontWeight: isSelected ? 600 : 400, fontSize: '0.9rem'}}>{mod.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="step-content setup-form-grid">
                <div className="setup-form-group">
                  <label>Currency</label>
                  <select className="setup-input" value={preferences.currency} onChange={e => setPreferences({...preferences, currency: e.target.value})}>
                    <option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="INR">INR (₹)</option><option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="setup-form-group">
                  <label>Date Format</label>
                  <select className="setup-input" value={preferences.dateFormat} onChange={e => setPreferences({...preferences, dateFormat: e.target.value})}>
                    <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="setup-form-group full-width">
                  <label>Low Stock Alert Threshold</label>
                  <input type="number" className="setup-input" value={preferences.lowStockThreshold} onChange={e => setPreferences({...preferences, lowStockThreshold: Number(e.target.value)})} min="0"/>
                </div>
              </div>
            )}

            <div className="setup-footer">
              <button 
                type="button" 
                className="setup-btn setup-btn-secondary" 
                onClick={handleBack} 
                disabled={isSubmitting || step === 1}
                style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
              >
                Previous
              </button>
              
              <button type="submit" className="setup-btn setup-btn-primary" disabled={isSubmitting}>
                {submitState || (isSubmitting ? 'Saving...' : step === 6 ? 'Finish Setup' : 'Continue')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessSetup;
