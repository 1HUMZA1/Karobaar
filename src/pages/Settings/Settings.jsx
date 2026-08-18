import React, { useState, useEffect } from 'react';
import { Save, Building, Users, BellRing, Shield, LayoutGrid, Settings2, Palette, Database, User, LogOut } from 'lucide-react';
import { db } from '../../services/databaseService';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
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
  const [taxId, setTaxId] = useState('');
  
  // Preferences State
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  
  // Tax & Invoice Settings
  const [taxRate, setTaxRate] = useState(0);
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [invoiceFooter, setInvoiceFooter] = useState('Thank you for your business!');

  // Notification Settings
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyNewSale, setNotifyNewSale] = useState(true);
  const [notifyDailyReport, setNotifyDailyReport] = useState(false);

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
      setTaxRate(currentBusiness.settings?.taxRate || 0);
      setTaxId(currentBusiness.settings?.taxId || '');
      setInvoicePrefix(currentBusiness.settings?.invoicePrefix || 'INV-');
      setInvoiceFooter(currentBusiness.settings?.invoiceFooter || 'Thank you for your business!');
      
      setNotifyLowStock(currentBusiness.settings?.notifyLowStock ?? true);
      setNotifyNewSale(currentBusiness.settings?.notifyNewSale ?? true);
      setNotifyDailyReport(currentBusiness.settings?.notifyDailyReport ?? false);

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
          taxRate: Number(taxRate),
          taxId,
          invoicePrefix,
          invoiceFooter,
          notifyLowStock,
          notifyNewSale,
          notifyDailyReport,
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
  
  const handleExportData = () => {
    alert("Exporting all business data to a secure zip file... (Functionality coming soon)");
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Logout failed", err);
      }
    }
  };

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-secondary">Configure your business preferences</p>
        </div>
        <Button icon={<Save size={18} />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="settings-layout" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div className="settings-sidebar" style={{ minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <button className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
            <Building size={18} /> Business Profile
          </button>
          <button className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>
            <Palette size={18} /> Appearance & Theme
          </button>
          <button className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
            <Settings2 size={18} /> Preferences & Tax
          </button>
          <button className={`settings-tab ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>
            <Settings2 size={18} /> Invoice Settings
          </button>
          <button className={`settings-tab ${activeTab === 'features' ? 'active' : ''}`} onClick={() => setActiveTab('features')}>
            <LayoutGrid size={18} /> Features & Modules
          </button>
          <button className={`settings-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={18} /> Users & Roles
          </button>
          <button className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <BellRing size={18} /> Notifications
          </button>
          <button className={`settings-tab ${activeTab === 'backup' ? 'active' : ''}`} onClick={() => setActiveTab('backup')}>
            <Database size={18} /> Data Backup
          </button>
          <button className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
            <User size={18} /> Account
          </button>
        </div>

        <div className="settings-content" style={{ flex: 1 }}>
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Company Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="block text-sm font-medium">Business Type</label>
                  <select 
                    style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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
                <Input label="Business Email" type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
                <Input label="Phone Number" defaultValue="+1 234 567 8900" />
                <Input label="Address" defaultValue="123 Commerce St, Business City" />
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
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', overflow: 'hidden' }}>
                          {t === 'light' && <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff' }}></div>}
                          {t === 'dark' && <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }}></div>}
                        </div>
                        <span className="font-semibold" style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)]">
                  <label className="text-sm font-semibold mb-2 block text-text-main">Application UI Version</label>
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
                          if (window.confirm("Warning: You are about to change the entire Dashboard layout to the older version. Are you sure?")) {
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
                <CardTitle>Global Preferences & Tax/GST</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="text-sm font-medium">Currency</label>
                  <select 
                    style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    value={currency} 
                    onChange={e => setCurrency(e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="text-sm font-medium">Date Format</label>
                  <select 
                    style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    value={dateFormat} 
                    onChange={e => setDateFormat(e.target.value)}
                  >
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <Input label="Low Stock Alert Threshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
                <hr style={{ margin: '1rem 0', borderColor: 'var(--border-color)' }} />
                <h4 className="font-medium">Tax / GST Settings</h4>
                <Input label="Tax ID / GST Number" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="e.g. 27AADCB2230M1Z2" />
                <Input label="Default Tax Rate (%)" type="number" step="0.1" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </CardContent>
            </Card>
          )}

          {activeTab === 'invoices' && (
            <Card>
              <CardHeader>
                <CardTitle>Invoice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Invoice Prefix" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="INV-" />
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="text-sm font-medium">Invoice Footer Message</label>
                  <textarea 
                    rows="3"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    value={invoiceFooter} 
                    onChange={e => setInvoiceFooter(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'features' && (
            <Card>
              <CardHeader>
                <CardTitle>Features & Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary mb-6">Enable or disable modules to customize your application experience.</p>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem'}}>
                  {MODULES_LIST.map(mod => (
                    <label key={mod.id} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'var(--bg-card)'}}>
                      <input type="checkbox" checked={!!enabledModules[mod.id]} onChange={() => toggleModule(mod.id)} style={{ width: '16px', height: '16px' }} />
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
                <CardTitle>User & Role Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary mb-4">Configure access levels for employees.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <h4 className="font-medium">Owner (Administrator)</h4>
                      <p className="text-xs text-secondary">Full access to all modules and settings.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <h4 className="font-medium">Manager</h4>
                      <p className="text-xs text-secondary">Can approve leave, view reports, manage inventory.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <h4 className="font-medium">Staff</h4>
                      <p className="text-xs text-secondary">POS and basic inventory access only.</p>
                    </div>
                  </div>
                  <Button variant="outline" style={{ alignSelf: 'flex-start' }}>+ Create Custom Role</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label style={{display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'}}>
                  <input type="checkbox" checked={notifyLowStock} onChange={(e) => setNotifyLowStock(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <div>
                    <span className="font-medium block">Low Stock Alerts</span>
                    <span className="text-xs text-secondary">Get notified when products drop below threshold.</span>
                  </div>
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'}}>
                  <input type="checkbox" checked={notifyNewSale} onChange={(e) => setNotifyNewSale(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <div>
                    <span className="font-medium block">New Sale Alerts</span>
                    <span className="text-xs text-secondary">Receive a ping for every successful transaction.</span>
                  </div>
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'}}>
                  <input type="checkbox" checked={notifyDailyReport} onChange={(e) => setNotifyDailyReport(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <div>
                    <span className="font-medium block">Daily Email Reports</span>
                    <span className="text-xs text-secondary">Receive an end-of-day summary email.</span>
                  </div>
                </label>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'backup' && (
            <Card>
              <CardHeader>
                <CardTitle>Data Backup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-secondary">
                  Your data is automatically synced securely to the cloud. However, you can export a manual backup of all your raw data to your local machine at any time.
                </p>
                <Button onClick={handleExportData}>Export Full Backup (.zip)</Button>
                
                <hr style={{ margin: '2rem 0', borderColor: 'var(--border-color)' }} />
                <h4 className="font-medium text-danger">Danger Zone</h4>
                <p className="text-sm text-secondary">
                  Resetting the database will permanently delete all local modifications and restore the original demo datasets.
                </p>
                <Button variant="outline" style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={handleResetData}>
                  Factory Reset Local Data
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold">{currentUser?.name || 'User'}</h4>
                    <p className="text-sm text-secondary">{currentUser?.email || currentUser?.phone || 'No email provided'}</p>
                  </div>
                </div>
                <hr style={{ borderColor: 'var(--border-color)' }} />
                <Button variant="outline" style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={handleLogout}>
                  Log Out
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
