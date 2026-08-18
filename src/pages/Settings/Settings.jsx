import React, { useState, useEffect } from 'react';
import { Save, Building, Users, BellRing, Shield, LayoutGrid, Settings2, Palette } from 'lucide-react';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import '../Dashboard/DashboardPremium.css'; // provides layout utilities
import './Settings.css';

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

const Settings = () => {
  const { currentBusiness, currentUser, refreshUserProfile, theme, setTheme, accent, setAccent, appUiVersion, setAppUiVersion } = useAppContext();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessType, setBusinessType] = useState('Retail');
  
  // Preferences State
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  // Modules State
  const [enabledModules, setEnabledModules] = useState({});

  useEffect(() => {
    if (currentBusiness) {
      setBusinessName(currentBusiness.name || '');
      setBusinessEmail(currentBusiness.email || '');
      setBusinessType(currentBusiness.type || 'Retail');
      setCurrency(currentBusiness.settings?.currency || 'USD');
      setDateFormat(currentBusiness.settings?.dateFormat || 'DD/MM/YYYY');
      setLowStockThreshold(currentBusiness.settings?.lowStockThreshold || 5);
      setEnabledModules(currentBusiness.modules || {});
    }
  }, [currentBusiness]);

  const toggleModule = (modId) => {
    setEnabledModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const handleSave = async () => {
    if (!currentUser?.activeBusinessId) return;
    setSaving(true);
    try {
      await db.update('businesses', currentUser.activeBusinessId, {
        name: businessName,
        email: businessEmail,
        type: businessType,
        settings: {
          ...currentBusiness.settings,
          currency,
          dateFormat,
          lowStockThreshold: Number(lowStockThreshold),
          theme: theme,
          accent: accent,
          appUiVersion: appUiVersion
        },
        modules: enabledModules
      });

      await refreshUserProfile();
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all data? This will erase all your current records and restore the initial demo data.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-secondary">Configure your business preferences</p>
        </div>
        <Button icon={<Save size={18} />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          <button 
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Building size={18} /> Business Profile
          </button>
          <button 
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette size={18} /> Appearance
          </button>
          <button 
            className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Settings2 size={18} /> Preferences
          </button>
          <button 
            className={`settings-tab ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            <LayoutGrid size={18} /> Features & Modules
          </button>
          <button 
            className={`settings-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} /> Users & Roles
          </button>
          <button 
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <BellRing size={18} /> Notifications
          </button>
          <button 
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} /> Security
          </button>
          <button 
            className={`settings-tab text-danger ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                  label="Company Name" 
                  value={businessName} 
                  onChange={(e) => setBusinessName(e.target.value)} 
                />
                <div className="form-group">
                  <label className="block text-sm font-medium mb-1">Business Type</label>
                  <select 
                    className="w-full p-2.5 rounded-lg focus:outline-none transition-colors"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                    value={businessType} 
                    onChange={e => setBusinessType(e.target.value)}
                  >
                    <option>Retail</option>
                    <option>Wholesale</option>
                    <option>E-commerce</option>
                    <option>Services</option>
                    <option>Manufacturing</option>
                    <option>Cafeteria / Restaurant</option>
                    <option>Other</option>
                  </select>
                </div>
                <Input 
                  label="Business Email" 
                  type="email" 
                  value={businessEmail} 
                  onChange={(e) => setBusinessEmail(e.target.value)} 
                />
                <Input label="Phone Number" defaultValue="+1 234 567 8900" />
                <Input label="Address" defaultValue="123 Commerce St, Business City" />
                <Input label="Tax ID / VAT" defaultValue="TAX-8923472" />
              </CardContent>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance & Themes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="form-group">
                  <label className="text-sm font-semibold mb-2 block" style={{color: 'var(--text-main)'}}>Base Theme</label>
                  <p className="text-xs text-secondary mb-4">Choose between light and dark mode.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                    {['light', 'dark'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`capitalize p-4 rounded-2xl transition-all flex flex-col items-center gap-3`}
                        style={{ 
                          border: `1px solid ${theme === t ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          backgroundColor: theme === t ? 'var(--bg-hover)' : 'var(--bg-card)',
                          padding: '1rem',
                          borderRadius: '1rem',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          border: '1px solid var(--border-color)', 
                          boxShadow: 'var(--shadow-sm)', 
                          display: 'flex', 
                          overflow: 'hidden' 
                        }}>
                          {t === 'light' && <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff' }}></div>}
                          {t === 'dark' && <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }}></div>}
                        </div>
                        <span className="font-semibold" style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-[var(--border-color)] form-group">
                  <label className="text-sm font-semibold mb-2 block" style={{color: 'var(--text-main)'}}>Accent Color</label>
                  <p className="text-xs text-secondary mb-4">Choose the primary brand color for buttons, active states, and highlights.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                    {[
                      { id: 'default', label: 'Emerald', hex: '#16a34a' },
                      { id: 'ocean', label: 'Ocean', hex: '#0ea5e9' },
                      { id: 'midnight', label: 'Midnight', hex: '#6366f1' },
                      { id: 'coffee', label: 'Coffee', hex: '#f59e0b' }
                    ].map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAccent(a.id)}
                        className={`capitalize transition-all flex flex-col items-center gap-3`}
                        style={{ 
                          border: `1px solid ${accent === a.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          backgroundColor: accent === a.id ? 'var(--bg-hover)' : 'var(--bg-card)',
                          padding: '1rem',
                          borderRadius: '1rem',
                          cursor: 'pointer'
                        }}
                      >
                        <div 
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            backgroundColor: a.hex, 
                            border: '2px solid var(--bg-card)', 
                            outline: accent === a.id ? `2px solid ${a.hex}` : '2px solid transparent',
                            boxShadow: 'var(--shadow-md)'
                          }}
                        ></div>
                        <span className="font-semibold" style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)]">
                  <label className="text-sm font-semibold mb-2 block text-text-main">Application UI Version</label>
                  <p className="text-xs text-text-secondary mb-3">
                    Switch between the classic basic dashboard and the new high-density premium command center.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    <label className={`flex-1 flex items-start p-4 rounded-xl border-2 cursor-pointer transition-colors ${appUiVersion === 'premium' ? 'bg-[var(--bg-hover)]' : ''}`} style={{ borderColor: appUiVersion === 'premium' ? 'var(--primary-color)' : 'var(--border-color)' }}>
                      <input 
                        type="radio" 
                        name="uiVersion" 
                        className="mt-1 mr-3"
                        checked={appUiVersion === 'premium'}
                        onChange={() => setAppUiVersion('premium')}
                      />
                      <div>
                        <span className="font-semibold block text-text-main">Premium Dashboard</span>
                        <span className="text-xs text-text-secondary">Density-optimized command center.</span>
                      </div>
                    </label>

                    <label className={`flex-1 flex items-start p-4 rounded-xl border-2 cursor-pointer transition-colors ${appUiVersion === 'legacy' ? 'bg-[var(--bg-hover)]' : ''}`} style={{ borderColor: appUiVersion === 'legacy' ? 'var(--primary-color)' : 'var(--border-color)' }}>
                      <input 
                        type="radio" 
                        name="uiVersion" 
                        className="mt-1 mr-3"
                        checked={appUiVersion === 'legacy'}
                        onChange={() => {
                          if (window.confirm("Warning: You are about to change the entire Dashboard layout to the older version. The Legacy UI may lack some modern analytics features. Are you sure?")) {
                            setAppUiVersion('legacy');
                          }
                        }}
                      />
                      <div>
                        <span className="font-semibold block text-text-main">Legacy Dashboard</span>
                        <span className="text-xs text-text-secondary">Simpler layout with standard grid blocks.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle>Global Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="form-group">
                  <label>Currency</label>
                  <select 
                    className="karobaar-input"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
                    value={currency} 
                    onChange={e => setCurrency(e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Format</label>
                  <select 
                    className="karobaar-input"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
                    value={dateFormat} 
                    onChange={e => setDateFormat(e.target.value)}
                  >
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <Input 
                  label="Low Stock Alert Threshold" 
                  type="number" 
                  value={lowStockThreshold} 
                  onChange={(e) => setLowStockThreshold(e.target.value)} 
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'features' && (
            <Card>
              <CardHeader>
                <CardTitle>Features & Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary mb-6">Enable or disable modules to customize your application experience. Your navigation menu will update automatically.</p>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem'}}>
                  {MODULES_LIST.map(mod => (
                    <label key={mod.id} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', background: 'var(--bg-card)'}}>
                      <input 
                        type="checkbox" 
                        checked={!!enabledModules[mod.id]} 
                        onChange={() => toggleModule(mod.id)} 
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span className="font-medium">{mod.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>Role Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary mb-4">Configure access levels for employees.</p>
                <div className="role-list">
                  <div className="role-item">
                    <div>
                      <h4 className="font-medium">Administrator</h4>
                      <p className="text-xs text-secondary">Full access to all modules</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="role-item">
                    <div>
                      <h4 className="font-medium">Manager</h4>
                      <p className="text-xs text-secondary">Can approve leave, view reports</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="role-item">
                    <div>
                      <h4 className="font-medium">Cashier</h4>
                      <p className="text-xs text-secondary">POS and basic inventory access only</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {(activeTab === 'notifications' || activeTab === 'security') && (
            <Card>
              <CardContent className="p-8 text-center text-secondary">
                Configuration options for {activeTab} will appear here.
              </CardContent>
            </Card>
          )}

          {activeTab === 'advanced' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-danger">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-secondary">
                  Resetting the database will permanently delete all local modifications and restore the original demo datasets (Products, Customers, Sales, etc.).
                </p>
                <Button variant="outline" className="text-danger border-danger hover:bg-danger hover:text-white" onClick={handleResetData}>
                  Reset Demo Data
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
