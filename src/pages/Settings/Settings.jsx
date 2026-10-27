import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Save, 
  Building, 
  Users, 
  BellRing, 
  Shield, 
  LayoutGrid, 
  Settings2, 
  Palette, 
  Database, 
  User, 
  LogOut,
  Key,
  Smartphone,
  CheckCircle2,
  Download,
  RotateCcw,
  Sparkles,
  Bot,
  CheckSquare,
  Square,
  Monitor,
  Laptop,
  Tablet,
  ShieldCheck,
  RefreshCw,
  Target,
  Volume2
} from 'lucide-react';
import { db } from '../../services/databaseService';
import { auth } from '../../services/firebase';
import { signOut, updatePassword } from 'firebase/auth';
import { useAppContext } from '../../context/AppContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileMenu } from './MobileMenu';
import './Settings.css';

const MODULES_LIST = [
  { id: 'sales', label: 'Sales & Invoicing' },
  { id: 'pos', label: 'POS Terminal' },
  { id: 'inventory', label: 'Inventory & Stock' },
  { id: 'purchases', label: 'Purchases & Restock' },
  { id: 'customers', label: 'Customers & Khata' },
  { id: 'suppliers', label: 'Suppliers Directory' },
  { id: 'employees', label: 'Employee Staff' },
  { id: 'attendance', label: 'Daily Attendance' },
  { id: 'leave', label: 'Leave Approvals' },
  { id: 'payroll', label: 'Payroll & Salaries' },
  { id: 'expenses', label: 'Expenses & Petty Cash' },
  { id: 'payments', label: 'Khata Payments' },
  { id: 'accounting', label: 'Accounting & Tax' },
  { id: 'reports', label: 'Analytics & Reports' },
  { id: 'tasks', label: 'Tasks & Follow-ups' },
  { id: 'notifications', label: 'System Notifications' }
];

const Settings = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'general';

  const { 
    currentBusiness, 
    currentUser, 
    refreshUserProfile, 
    theme, 
    setTheme, 
    accent, 
    setAccent, 
    appUiVersion, 
    setAppUiVersion 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState(initialTab);
  
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const [saving, setSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState('');
  
  // Loading Transition Overlay State
  const [isChangingSettings, setIsChangingSettings] = useState(false);
  const [settingsChangedSuccess, setSettingsChangedSuccess] = useState(false);

  // Customize (AI & Automations) State - Default Mr. H
  const [aiAssistantName, setAiAssistantName] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('karobaar_customize_ai_settings') || '{}');
      return saved.assistantName || 'Jarvis';
    } catch { return 'Mr. H'; }
  });
  const [aiWakeWord, setAiWakeWord] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('karobaar_customize_ai_settings') || '{}');
      return saved.wakeWord || 'Jarvis';
    } catch { return 'Hey Mr. H'; }
  });
  const [aiBackgroundWake, setAiBackgroundWake] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('karobaar_customize_ai_settings') || '{}');
      return saved.backgroundWake !== false;
    } catch { return true; }
  });
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiFloatingBubble, setAiFloatingBubble] = useState(true);
  const [aiAutoExecute, setAiAutoExecute] = useState(true);
  const [autoAlertLowStock, setAutoAlertLowStock] = useState(true);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
  const [dailySummaryNotification, setDailySummaryNotification] = useState(true);
  const [rapidBarcodeAdd, setRapidBarcodeAdd] = useState(true);
  const [aiLanguage, setAiLanguage] = useState(() => localStorage.getItem('karobaar_ai_language') || 'hinglish');

  // Store Custom UPI ID & Google Pay QR Image State
  const [storeUpiId, setStoreUpiId] = useState(() => {
    return currentBusiness?.settings?.upiId || localStorage.getItem('karobaar_custom_upi_id') || 'karobaar.pay@upi';
  });
  const [storeUpiQrImage, setStoreUpiQrImage] = useState(() => {
    return currentBusiness?.settings?.upiQrImage || localStorage.getItem('karobaar_custom_upi_qr_img') || null;
  });
  const [storeUpiMode, setStoreUpiMode] = useState(() => {
    return currentBusiness?.settings?.upiDefaultMode || localStorage.getItem('karobaar_custom_upi_mode') || 'dynamic';
  });

  const handleSettingsQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setStoreUpiQrImage(event.target.result);
      setStoreUpiMode('custom_image');
    };
    reader.readAsDataURL(file);
  };

  // Business Profile State
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessType, setBusinessType] = useState('Cafeteria / Restaurant');
  const [businessPhone, setBusinessPhone] = useState('+91 98765 43210');
  const [businessAddress, setBusinessAddress] = useState('Shop #4, Commercial Complex');
  const [taxId, setTaxId] = useState('GSTIN-29AAAAA0000A1Z5');
  
  // Preferences State
  const [currency, setCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  
  // Tax & Invoice Settings
  const [taxRate, setTaxRate] = useState(5);
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [invoiceFooter, setInvoiceFooter] = useState('Thank you for choosing SAS CAFETERIA!');

  // Notification Settings
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyNewSale, setNotifyNewSale] = useState(true);
  const [notifyDailyReport, setNotifyDailyReport] = useState(false);

  // Modules State
  const [enabledModules, setEnabledModules] = useState({});

  // Account Tab Extended Features
  const [accountDisplayName, setAccountDisplayName] = useState('');
  const [accountPhone, setAccountPhone] = useState('+91 98765 43210');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [autoLockTimeout, setAutoLockTimeout] = useState('30m');
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  // Device Sessions State
  const [deviceList, setDeviceList] = useState(() => {
    try {
      const saved = localStorage.getItem('karobaar_connected_devices');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'current-session',
        name: 'This Device (Current Session)',
        isCurrent: true,
        ip: '127.0.0.1 (Localhost)',
        lastActive: 'Active right now',
        status: 'ACTIVE NOW',
        type: 'desktop'
      },
      {
        id: 'mobile-pwa',
        name: 'Samsung Galaxy / Android Terminal',
        isCurrent: false,
        ip: '192.168.1.104 (Local Wi-Fi)',
        lastActive: 'Synced 12 mins ago',
        status: 'ONLINE',
        type: 'mobile'
      },
      {
        id: 'pos-tablet',
        name: 'iPad Counter Register (Cafeteria POS)',
        isCurrent: false,
        ip: '192.168.1.112 (Store Wi-Fi)',
        lastActive: 'Active 1 hour ago',
        status: 'STANDBY',
        type: 'tablet'
      },
      {
        id: 'laptop-billing',
        name: 'HP Laptop (Manager Office)',
        isCurrent: false,
        ip: '192.168.1.108 (Office LAN)',
        lastActive: 'Yesterday, 8:40 PM',
        status: 'OFFLINE',
        type: 'laptop'
      }
    ];
  });

  const [deviceBanner, setDeviceBanner] = useState('');
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);

  // Auto-detect current device info
  const currentDeviceInfo = (() => {
    if (typeof window === 'undefined') return { os: 'Windows PC', browser: 'Google Chrome', screen: '1920 × 1080' };
    const ua = navigator.userAgent;
    let os = 'Windows PC';
    if (ua.indexOf('Win') !== -1) os = 'Windows PC';
    else if (ua.indexOf('Mac') !== -1) os = 'Apple Mac';
    else if (ua.indexOf('Android') !== -1) os = 'Android Mobile';
    else if (ua.indexOf('iPhone') !== -1) os = 'Apple iPhone';
    else if (ua.indexOf('iPad') !== -1) os = 'Apple iPad';
    else if (ua.indexOf('Linux') !== -1) os = 'Linux Workstation';

    let browser = 'Google Chrome';
    if (ua.indexOf('Edg') !== -1) browser = 'Microsoft Edge';
    else if (ua.indexOf('Chrome') !== -1) browser = 'Google Chrome';
    else if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) browser = 'Apple Safari';
    else if (ua.indexOf('Firefox') !== -1) browser = 'Mozilla Firefox';

    return {
      os,
      browser,
      screen: `${window.screen.width} × ${window.screen.height}`
    };
  })();

  const handleRevokeDevice = (deviceId) => {
    const updated = deviceList.filter(d => d.id !== deviceId);
    setDeviceList(updated);
    try {
      localStorage.setItem('karobaar_connected_devices', JSON.stringify(updated));
    } catch (e) {}
    setDeviceBanner('Device session revoked successfully.');
    setTimeout(() => setDeviceBanner(''), 3000);
  };

  const handleRevokeAllOtherDevices = () => {
    if (window.confirm('Log out all other connected sessions and keep only this current device?')) {
      const onlyCurrent = deviceList.filter(d => d.isCurrent);
      setDeviceList(onlyCurrent);
      try {
        localStorage.setItem('karobaar_connected_devices', JSON.stringify(onlyCurrent));
      } catch (e) {}
      setDeviceBanner('All other device sessions have been logged out.');
      setTimeout(() => setDeviceBanner(''), 3500);
    }
  };

  const handleRefreshDevices = () => {
    setIsRefreshingDevices(true);
    setTimeout(() => {
      setIsRefreshingDevices(false);
      setDeviceBanner('Device session list refreshed.');
      setTimeout(() => setDeviceBanner(''), 2500);
    }, 400);
  };

  useEffect(() => {
    if (currentBusiness) {
      setBusinessName(currentBusiness.name || '');
      setBusinessEmail(currentBusiness.email || '');
      setBusinessType(currentBusiness.type || 'Cafeteria / Restaurant');
      setCurrency(currentBusiness.settings?.currency || 'INR');
      setDateFormat(currentBusiness.settings?.dateFormat || 'DD/MM/YYYY');
      setLowStockThreshold(currentBusiness.settings?.lowStockThreshold || 5);
      setTaxRate(currentBusiness.settings?.taxRate ?? 5);
      setTaxId(currentBusiness.settings?.taxId || 'GSTIN-29AAAAA0000A1Z5');
      setInvoicePrefix(currentBusiness.settings?.invoicePrefix || 'INV-');
      setInvoiceFooter(currentBusiness.settings?.invoiceFooter || 'Thank you for choosing SAS CAFETERIA!');
      
      setNotifyLowStock(currentBusiness.settings?.notifyLowStock ?? true);
      setNotifyNewSale(currentBusiness.settings?.notifyNewSale ?? true);
      setNotifyDailyReport(currentBusiness.settings?.notifyDailyReport ?? false);

      setEnabledModules(currentBusiness.modules || {});
    }

    if (currentUser) {
      setAccountDisplayName(currentUser.name || 'HUMZA');
      setAccountPhone(currentUser.phone || '+91 98765 43210');
    }
  }, [currentBusiness, currentUser]);

  const toggleModule = (modId) => {
    setEnabledModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const handleSelectAllModules = () => {
    const allEnabled = {};
    MODULES_LIST.forEach(m => {
      allEnabled[m.id] = true;
    });
    setEnabledModules(allEnabled);
  };

  const handleDeselectAllModules = () => {
    const allDisabled = {};
    MODULES_LIST.forEach(m => {
      allDisabled[m.id] = false;
    });
    setEnabledModules(allDisabled);
  };

  const handleSave = async () => {
    if (!currentUser?.activeBusinessId) return;
    setSaving(true);
    setSaveBanner('');
    setIsChangingSettings(true);
    setSettingsChangedSuccess(false);

    try {
      const aiConfig = {
        assistantName: aiAssistantName || 'Jarvis',
        wakeWord: aiWakeWord || (aiAssistantName || 'Jarvis'),
        backgroundWake: aiBackgroundWake,
        aiEnabled,
        showFloatingBubble: aiFloatingBubble,
        autoExecute: aiAutoExecute,
        autoAlertLowStock,
        autoPrintReceipt,
        dailySummaryNotification,
        rapidBarcodeAdd
      };
      localStorage.setItem('karobaar_customize_ai_settings', JSON.stringify(aiConfig));
      window.dispatchEvent(new CustomEvent('karobaar_settings_updated', { detail: { assistantName: aiAssistantName || 'Jarvis' } }));
      localStorage.setItem('karobaar_ai_language', aiLanguage);
      localStorage.setItem('karobaar_custom_upi_id', storeUpiId);
      if (storeUpiQrImage) localStorage.setItem('karobaar_custom_upi_qr_img', storeUpiQrImage);
      else localStorage.removeItem('karobaar_custom_upi_qr_img');
      localStorage.setItem('karobaar_custom_upi_mode', storeUpiMode);

      await db.update('businesses', currentUser.activeBusinessId, {
        name: businessName,
        email: businessEmail,
        type: businessType,
        settings: {
          ...currentBusiness?.settings,
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
          theme,
          accent: 'monochrome',
          appUiVersion,
          aiSettings: aiConfig,
          upiId: storeUpiId,
          upiQrImage: storeUpiQrImage,
          upiDefaultMode: storeUpiMode
        },
        modules: enabledModules
      });

      // Update user local session
      if (currentUser?.id) {
        try {
          await db.update('users', currentUser.id, {
            name: accountDisplayName,
            phone: accountPhone
          });
        } catch (e) {}
      }

      await refreshUserProfile();
      
      // Stage 2: Success state on loading screen with action
      setSettingsChangedSuccess(true);
      setSaveBanner('This settings has been changed');

      setTimeout(() => {
        setIsChangingSettings(false);
        setSettingsChangedSuccess(false);
      }, 2000);

      setTimeout(() => setSaveBanner(''), 5000);
    } catch (err) {
      console.error(err);
      setIsChangingSettings(false);
      setSaveBanner('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus('');
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus('Passwords do not match.');
      return;
    }
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }
      setPasswordStatus('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordStatus(err.message || 'Password update completed.');
    }
  };

  const handleExportData = async () => {
    try {
      const sales = await db.getCollection('sales', currentUser?.activeBusinessId);
      const products = await db.getCollection('products', currentUser?.activeBusinessId);
      const customers = await db.getCollection('customers', currentUser?.activeBusinessId);
      
      const backupPayload = {
        business: currentBusiness?.name || 'SAS CAFETERIA',
        timestamp: new Date().toISOString(),
        exportedBy: currentUser?.email || 'admin',
        totalSales: sales.length,
        totalProducts: products.length,
        totalCustomers: customers.length,
        sales,
        products,
        customers
      };

      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `karobaar_data_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to compile backup JSON.");
    }
  };

  const handleResetData = () => {
    if (window.confirm("Warning: Resetting local data will restore the standard cafeteria records. Continue?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out of Karobaar?")) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Logout failed", err);
      }
    }
  };

  const isMobile = useIsMobile();
  if (isMobile) {
    return <MobileMenu />;
  }

  return (
    <div className="settings-page-wrapper">
      {/* Header Bar */}
      <div className="settings-header-strip">
        <div className="settings-header-text">
          <h1>Settings & Workspace</h1>
          <p>Configure business parameters, security & operating mode</p>
        </div>
        <div className="settings-header-actions">
          {saveBanner && (
            <div className="settings-action-banner">
              <CheckCircle2 size={15} />
              <span>{saveBanner}</span>
              <button 
                type="button" 
                className="settings-action-banner-close"
                onClick={() => setSaveBanner('')}
              >
                Dismiss
              </button>
            </div>
          )}
          <button 
            className="settings-btn-primary"
            onClick={handleSave} 
            disabled={saving}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="settings-main-layout">
        {/* Sidebar Navigation */}
        <div className="settings-nav-card">
          <button className={`settings-nav-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
            <Building size={16} /> Business Profile
          </button>
          <button className={`settings-nav-btn ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>
            <Palette size={16} /> Appearance & Mode
          </button>
          <button className={`settings-nav-btn ${activeTab === 'customize' ? 'active' : ''}`} onClick={() => setActiveTab('customize')}>
            <Sparkles size={16} /> Customize (AI & Automations)
          </button>
          <button className={`settings-nav-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
            <Settings2 size={16} /> Preferences & Tax
          </button>
          <button className={`settings-nav-btn ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>
            <Settings2 size={16} /> Invoice Settings
          </button>
          <button className={`settings-nav-btn ${activeTab === 'features' ? 'active' : ''}`} onClick={() => setActiveTab('features')}>
            <LayoutGrid size={16} /> Features & Modules
          </button>
          <button className={`settings-nav-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={16} /> Users & Roles
          </button>
          <button className={`settings-nav-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <BellRing size={16} /> Notifications
          </button>
          <button className={`settings-nav-btn ${activeTab === 'backup' ? 'active' : ''}`} onClick={() => setActiveTab('backup')}>
            <Database size={16} /> Data Backup
          </button>
          <button className={`settings-nav-btn ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
            <User size={16} /> Account & Security
          </button>
        </div>

        {/* Settings Content Pane */}
        <div>
          {/* TAB 1: Business Profile */}
          {activeTab === 'general' && (
            <div className="settings-content-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Business Information</h2>
                  <p className="settings-card-subtitle">General identity and contact details for official receipts</p>
                </div>
              </div>

              <div className="settings-grid-2">
                <div className="settings-input-group">
                  <label>Company / Legal Name</label>
                  <input 
                    type="text" 
                    className="settings-input-field" 
                    value={businessName} 
                    onChange={e => setBusinessName(e.target.value)} 
                  />
                </div>

                <div className="settings-input-group">
                  <label>Business Type</label>
                  <select 
                    className="settings-input-field"
                    value={businessType} 
                    onChange={e => setBusinessType(e.target.value)}
                  >
                    <option>Cafeteria / Restaurant</option>
                    <option>Retail Store</option>
                    <option>Wholesale & Distribution</option>
                    <option>Grocery & Supermarket</option>
                    <option>Services & Agency</option>
                  </select>
                </div>

                <div className="settings-input-group">
                  <label>Official Business Email</label>
                  <input 
                    type="email" 
                    className="settings-input-field" 
                    value={businessEmail} 
                    onChange={e => setBusinessEmail(e.target.value)} 
                  />
                </div>

                <div className="settings-input-group">
                  <label>Primary Phone / WhatsApp</label>
                  <input 
                    type="text" 
                    className="settings-input-field" 
                    value={businessPhone} 
                    onChange={e => setBusinessPhone(e.target.value)} 
                  />
                </div>

                <div className="settings-input-group sm:col-span-2">
                  <label>Business Address</label>
                  <input 
                    type="text" 
                    className="settings-input-field" 
                    value={businessAddress} 
                    onChange={e => setBusinessAddress(e.target.value)} 
                  />
                </div>

                <div className="settings-input-group sm:col-span-2">
                  <label>Tax Identification / GSTIN</label>
                  <input 
                    type="text" 
                    className="settings-input-field" 
                    value={taxId} 
                    onChange={e => setTaxId(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Appearance & Mode */}
          {activeTab === 'appearance' && (
            <div className="settings-content-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Appearance & Operating Mode</h2>
                  <p className="settings-card-subtitle">Choose between theme contrast and dashboard UI edition</p>
                </div>
              </div>

              {/* Theme Selection */}
              <div className="settings-section-block">
                <h3 className="settings-section-heading">Theme Contrast (Strictly Black & White)</h3>
                <div className="settings-grid-2">
                  <button
                    onClick={() => setTheme('light')}
                    className="settings-nav-btn p-4 flex items-center justify-between"
                    style={{
                      border: theme === 'light' ? '2px solid #09090b' : '1px solid #e4e4e7',
                      backgroundColor: theme === 'light' ? '#f4f4f5' : '#ffffff'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border border-black bg-white"></div>
                      <span className="font-bold text-sm">Light Mode (Clean White)</span>
                    </div>
                    {theme === 'light' && <CheckCircle2 size={16} />}
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className="settings-nav-btn p-4 flex items-center justify-between"
                    style={{
                      border: theme === 'dark' ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: theme === 'dark' ? '#141416' : '#1e1e24'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border border-white bg-black"></div>
                      <span className="font-bold text-sm text-white">Dark Mode (Elevated Black)</span>
                    </div>
                    {theme === 'dark' && <CheckCircle2 size={16} className="text-white" />}
                  </button>
                </div>
              </div>

              {/* Application UI Version Selection */}
              <div className="settings-section-block">
                <h3 className="settings-section-heading">Operating UI Mode</h3>
                <div className="settings-grid-2">
                  <div 
                    onClick={() => setAppUiVersion('legacy')}
                    className="p-4 rounded-xl border cursor-pointer transition-all"
                    style={{
                      border: appUiVersion === 'legacy' ? '2px solid #09090b' : '1px solid #e4e4e7',
                      backgroundColor: appUiVersion === 'legacy' ? 'var(--bg-hover)' : 'transparent'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">⚡ Legacy Operations Desk</span>
                      {appUiVersion === 'legacy' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">ACTIVE</span>}
                    </div>
                    <p className="text-xs text-text-secondary">Fast-track desk with fit-to-page buttons, catalog glance, and rapid ledger.</p>
                  </div>

                  <div 
                    onClick={() => setAppUiVersion('premium')}
                    className="p-4 rounded-xl border cursor-pointer transition-all"
                    style={{
                      border: appUiVersion === 'premium' ? '2px solid #09090b' : '1px solid #e4e4e7',
                      backgroundColor: appUiVersion === 'premium' ? 'var(--bg-hover)' : 'transparent'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">💎 Premium Command Center</span>
                      {appUiVersion === 'premium' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">ACTIVE</span>}
                    </div>
                    <p className="text-xs text-text-secondary">Multi-metric executive workspace with dual charts and radar health monitor.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Customize (AI & Automations) */}
          {activeTab === 'customize' && (
            <div className="settings-content-card">
              <div className="settings-card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="settings-card-title">Customize (AI & Automations)</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                      AI AGENT
                    </span>
                  </div>
                  <p className="settings-card-subtitle">
                    Configure the in-app AI assistant, automated operations, and trigger rules
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    onClick={() => window.dispatchEvent(new CustomEvent('karobaar_start_ai_onboarding'))}
                    className="settings-btn-primary"
                    style={{ height: '36px', fontSize: '0.8rem', padding: '0 1rem' }}
                    title="Launch step-by-step AI store setup"
                  >
                    <Bot size={14} />
                    <span>Run AI Setup Wizard</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => window.dispatchEvent(new CustomEvent('karobaar_start_spotlight_tour', { detail: { stepIndex: 0 } }))}
                    className="settings-btn-primary"
                    style={{ height: '36px', fontSize: '0.8rem', padding: '0 1rem' }}
                    title="Start Live Feature Outlining & Spotlight Tour"
                  >
                    <Target size={14} />
                    <span>Live Feature Spotlight</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => window.dispatchEvent(new CustomEvent('karobaar_wake_ai_assistant'))}
                    className="settings-btn-primary"
                    style={{ height: '36px', fontSize: '0.8rem', padding: '0 1rem' }}
                    title="Wake assistant in live voice mode"
                  >
                    <Sparkles size={14} />
                    <span>Wake {aiAssistantName || 'Jarvis'}</span>
                  </button>
                </div>
              </div>

              {/* Section 1: AI Assistant Parameters */}
              <div className="settings-grid-2" style={{ marginBottom: '1.5rem' }}>
                <div className="settings-input-group">
                  <label>Assistant Name (Wake Identity)</label>
                  <input 
                    type="text" 
                    className="settings-input-field" 
                    value={aiAssistantName} 
                    onChange={e => {
                      setAiAssistantName(e.target.value);
                      setAiWakeWord(`Hey ${e.target.value}`);
                    }}
                    placeholder="Mr. H"
                  />
                  {/* Preset Assistant Names - Single Identity Active */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {[
                      { name: 'Jarvis', badge: 'Default' },
                      { name: 'Mr. H', badge: 'Preset' },
                      { name: 'Customize', badge: 'Classic' }
                    ].map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setAiAssistantName(preset.name);
                          setAiWakeWord(preset.name);
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg border font-bold transition-all flex items-center gap-1.5 ${
                          (aiAssistantName || 'Jarvis') === preset.name
                            ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-sm'
                            : 'bg-transparent text-text-secondary border-border-color hover:text-text-main hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        <span>{preset.name}</span>
                        <span className="opacity-70 text-[10px]">({preset.badge})</span>
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-text-muted mt-1.5 block">
                    ⚡ <strong>Single Active Identity:</strong> Only the currently selected name will wake the assistant via voice at any given time.
                  </span>
                </div>

                <div className="settings-input-group">
                  <label>Voice Wake-Up Call Phrase</label>
                  <input 
                    type="text" 
                    className="settings-input-field" 
                    value={aiWakeWord} 
                    onChange={e => setAiWakeWord(e.target.value)}
                    placeholder="Hey Mr. H"
                  />
                  <span className="text-[11px] text-text-muted mt-1 block">Say this phrase aloud anytime to wake the AI hands-free.</span>
                </div>

                <div className="settings-input-group">
                  <label>Automation Mode</label>
                  <select 
                    className="settings-input-field"
                    value={aiAutoExecute ? 'auto' : 'confirm'}
                    onChange={e => setAiAutoExecute(e.target.value === 'auto')}
                  >
                    <option value="auto">Auto-Execute Commands (Recommended)</option>
                    <option value="confirm">Ask Confirmation Before Executing</option>
                  </select>
                </div>

                <div className="settings-input-group">
                  <label>Voice & Chat Language (Hinglish / Roman English)</label>
                  <select 
                    className="settings-input-field"
                    value={aiLanguage}
                    onChange={e => {
                      setAiLanguage(e.target.value);
                      localStorage.setItem('karobaar_ai_language', e.target.value);
                    }}
                  >
                    <option value="hinglish">Hinglish (Roman English - e.g. "Aaj ki sale ₹...", "1 Chai add kardi")</option>
                    <option value="en">Pure English (e.g. "Today's sales report...", "Added 1 Tea")</option>
                    <option value="hi">हिंदी (Devanagari script)</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Automated Business Triggers */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <h3 className="text-sm font-bold text-text-main mb-3">Automated Business Triggers</h3>
                <div className="space-y-3">
                  <label className="settings-toggle-row">
                    <div>
                      <div className="font-semibold text-sm">Hands-Free Voice Wake-Up ("{aiAssistantName || 'Jarvis'}")</div>
                      <div className="text-xs text-text-secondary">AI listens continuously in the background for your voice wake call and triggers live conversation</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={aiBackgroundWake} 
                      onChange={e => setAiBackgroundWake(e.target.checked)} 
                    />
                  </label>

                  <label className="settings-toggle-row">
                    <div>
                      <div className="font-semibold text-sm">Floating AI Launcher Bubble</div>
                      <div className="text-xs text-text-secondary">Display the quick-action Customize AI button on the bottom right of the screen</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={aiFloatingBubble} 
                      onChange={e => setAiFloatingBubble(e.target.checked)} 
                    />
                  </label>

                  <label className="settings-toggle-row">
                    <div>
                      <div className="font-semibold text-sm">Automatic Low-Stock Re-Order Alerts</div>
                      <div className="text-xs text-text-secondary">AI actively audits inventory and notifies when items fall below threshold</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={autoAlertLowStock} 
                      onChange={e => setAutoAlertLowStock(e.target.checked)} 
                    />
                  </label>

                  <label className="settings-toggle-row">
                    <div>
                      <div className="font-semibold text-sm">Auto-Print Thermal Receipt on POS Checkout</div>
                      <div className="text-xs text-text-secondary">Immediately triggers receipt print dialogue upon recording a sale</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={autoPrintReceipt} 
                      onChange={e => setAutoPrintReceipt(e.target.checked)} 
                    />
                  </label>

                  <label className="settings-toggle-row">
                    <div>
                      <div className="font-semibold text-sm">Daily Evening Sales Summary Notification</div>
                      <div className="text-xs text-text-secondary">Summarizes total revenue, transactions count, and top-selling items at closing</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={dailySummaryNotification} 
                      onChange={e => setDailySummaryNotification(e.target.checked)} 
                    />
                  </label>

                  <label className="settings-toggle-row">
                    <div>
                      <div className="font-semibold text-sm">POS Barcode Rapid-Add on Enter</div>
                      <div className="text-xs text-text-secondary">Auto-adds matched barcode items into current cart immediately without clicking</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={rapidBarcodeAdd} 
                      onChange={e => setRapidBarcodeAdd(e.target.checked)} 
                    />
                  </label>
                </div>
              </div>

              {/* Section: Custom UPI ID & Google Pay QR Code */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <h3 className="text-sm font-bold text-text-main mb-1">Custom UPI ID & Google Pay QR Code</h3>
                <p className="text-xs text-text-secondary mb-3">Configure your merchant UPI ID and upload your Google Pay or store standee QR code for instant POS billing</p>
                
                <div className="settings-grid-2" style={{ marginBottom: '12px' }}>
                  <div className="settings-input-group">
                    <label>Store / Google Pay UPI ID</label>
                    <input 
                      type="text" 
                      className="settings-input-field" 
                      value={storeUpiId} 
                      onChange={e => setStoreUpiId(e.target.value)}
                      placeholder="e.g. yourbusiness@okaxis, 9876543210@paytm"
                    />
                  </div>

                  <div className="settings-input-group">
                    <label>Default QR Presentation in POS</label>
                    <select 
                      className="settings-input-field"
                      value={storeUpiMode}
                      onChange={e => setStoreUpiMode(e.target.value)}
                    >
                      <option value="dynamic">Dynamic QR (Auto-encodes exact bill amount)</option>
                      <option value="custom_image">Uploaded Shop QR Image (Google Pay Standee)</option>
                    </select>
                  </div>
                </div>

                {/* Upload QR Image Box */}
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1.5">Shop Standee QR Code Image</label>
                  <input 
                    type="file" 
                    id="settings-qr-upload" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleSettingsQrUpload}
                  />

                  {storeUpiQrImage ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border-color bg-[var(--bg-body)]">
                      <div className="w-14 h-14 rounded-md border border-border-color bg-white flex items-center justify-center overflow-hidden shrink-0">
                        <img src={storeUpiQrImage} alt="Shop QR" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-text-main">Custom Google Pay / Standee QR Active</div>
                        <div className="text-[11px] text-text-secondary">Used in POS Checkout when customer scans to pay</div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => document.getElementById('settings-qr-upload')?.click()}
                          className="settings-btn-secondary"
                          style={{ height: '30px', fontSize: '11px', padding: '0 8px' }}
                        >
                          Replace
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setStoreUpiQrImage(null)}
                          className="settings-btn-secondary"
                          style={{ height: '30px', fontSize: '11px', padding: '0 8px', color: 'var(--danger)' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => document.getElementById('settings-qr-upload')?.click()}
                      className="border-2 border-dashed border-border-color rounded-lg p-4 text-center cursor-pointer bg-[var(--bg-body)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <Upload size={20} className="mx-auto text-text-muted mb-1" />
                      <div className="text-xs font-bold text-text-main">Click to upload your Google Pay or Shop QR Code image</div>
                      <div className="text-[11px] text-text-muted mt-0.5">PNG, JPG, or WEBP (Standee or Screenshot)</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Pre-configured AI Workflows */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <h3 className="text-sm font-bold text-text-main mb-3">Pre-Configured Automation Workflows</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: "📊 Today's Total Sales", desc: "Instantly sums all transactions recorded today and calculates revenue", prompt: "Show today sales summary" },
                    { title: "⚠️ Low Stock Re-Order Audit", desc: "Scans catalog for items at or below minimum threshold", prompt: "Which items are low in stock?" },
                    { title: "👥 Outstanding Khata Ledger", desc: "Filters all customers who have pending credit or balance due", prompt: "Show customers with pending dues" },
                    { title: "⚡ Switch to Legacy Operations Desk", desc: "Instantly reconfigures workspace to fast-track legacy view", prompt: "Switch to legacy operations desk" }
                  ].map((wf, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border-color bg-[var(--bg-body)] flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-xs text-text-main mb-1">{wf.title}</div>
                        <div className="text-[11px] text-text-secondary leading-snug">{wf.desc}</div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('karobaar_open_ai_assistant', { detail: { query: wf.prompt } }))}
                        className="mt-3 text-xs font-bold py-1.5 px-3 rounded border border-border-color bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-text-main inline-flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={12} /> Run Automation
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Preferences & Tax */}
          {activeTab === 'preferences' && (
            <div className="settings-content-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Preferences & Financial Defaults</h2>
                  <p className="settings-card-subtitle">Configure currency, date formats, and tax calculation</p>
                </div>
              </div>

              <div className="settings-grid-2">
                <div className="settings-input-group">
                  <label>Primary Currency</label>
                  <select 
                    className="settings-input-field"
                    value={currency} 
                    onChange={e => setCurrency(e.target.value)}
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="AED">UAE Dirham (AED)</option>
                    <option value="SAR">Saudi Riyal (SAR)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>

                <div className="settings-input-group">
                  <label>Display Date Format</label>
                  <select 
                    className="settings-input-field"
                    value={dateFormat} 
                    onChange={e => setDateFormat(e.target.value)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="settings-input-group">
                  <label>Low Stock Alert Threshold (Units)</label>
                  <input 
                    type="number" 
                    className="settings-input-field" 
                    value={lowStockThreshold} 
                    onChange={e => setLowStockThreshold(e.target.value)} 
                  />
                </div>

                <div className="settings-input-group">
                  <label>Default Tax Rate (%)</label>
                  <input 
                    type="number" 
                    className="settings-input-field" 
                    value={taxRate} 
                    onChange={e => setTaxRate(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Invoice Settings */}
          {activeTab === 'invoices' && (
            <div className="settings-content-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Invoice & Receipt Configuration</h2>
                  <p className="settings-card-subtitle">Customize billing prefixes and printed footer text</p>
                </div>
              </div>

              <div className="settings-grid-2">
                <div className="settings-input-group">
                  <label>Invoice Number Prefix</label>
                  <input 
                    type="text" 
                    className="settings-input-field" 
                    value={invoicePrefix} 
                    onChange={e => setInvoicePrefix(e.target.value)} 
                  />
                </div>

                <div className="settings-input-group">
                  <label>Payment Terms</label>
                  <select className="settings-input-field">
                    <option>Immediate / Due on Receipt</option>
                    <option>Net 7 Days</option>
                    <option>Net 15 Days</option>
                    <option>Net 30 Days</option>
                  </select>
                </div>

                <div className="settings-input-group sm:col-span-2">
                  <label>Receipt Footer Note</label>
                  <input 
                    type="text" 
                    className="settings-input-field" 
                    value={invoiceFooter} 
                    onChange={e => setInvoiceFooter(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Features & Modules */}
          {activeTab === 'features' && (
            <div className="settings-content-card">
              <div className="settings-card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="settings-card-title">Features & Modules Manager</h2>
                  <p className="settings-card-subtitle">
                    Turn active modules on or off for this branch • ({MODULES_LIST.filter(m => enabledModules[m.id] !== false).length} of {MODULES_LIST.length} Active)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleSelectAllModules}
                    className="settings-btn-primary"
                    style={{ height: '34px', fontSize: '0.75rem', padding: '0 0.85rem' }}
                    title="Enable all modules"
                  >
                    <CheckSquare size={14} />
                    <span>Select All</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleDeselectAllModules}
                    className="settings-btn-primary"
                    style={{ height: '34px', fontSize: '0.75rem', padding: '0 0.85rem' }}
                    title="Disable all modules"
                  >
                    <Square size={14} />
                    <span>Deselect All</span>
                  </button>
                </div>
              </div>

              <div className="settings-modules-grid">
                {MODULES_LIST.map(mod => {
                  const isChecked = enabledModules[mod.id] !== false;
                  return (
                    <label key={mod.id} className="settings-module-item">
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => toggleModule(mod.id)} 
                      />
                      <span>{mod.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: Users & Roles */}
          {activeTab === 'users' && (
            <div className="settings-content-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Users & Access Controls</h2>
                  <p className="settings-card-subtitle">Manage role authorizations and staff permissions</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-3.5 border rounded-xl flex items-center justify-between border-[var(--border-color)]">
                  <div>
                    <h4 className="font-bold text-sm text-text-main">Owner / Administrator</h4>
                    <p className="text-xs text-text-secondary">Unrestricted access to all finances, inventory, and branch configs.</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">FULL ACCESS</span>
                </div>

                <div className="p-3.5 border rounded-xl flex items-center justify-between border-[var(--border-color)]">
                  <div>
                    <h4 className="font-bold text-sm text-text-main">Manager / Supervisor</h4>
                    <p className="text-xs text-text-secondary">Can review reports, manage stock, and authorize daily transactions.</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-black dark:border-white">OPERATIONAL</span>
                </div>

                <div className="p-3.5 border rounded-xl flex items-center justify-between border-[var(--border-color)]">
                  <div>
                    <h4 className="font-bold text-sm text-text-main">Cashier / Floor Staff</h4>
                    <p className="text-xs text-text-secondary">Restricted to POS terminal, customer khata lookup, and attendance.</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-black dark:border-white">TERMINAL ONLY</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Notifications */}
          {activeTab === 'notifications' && (
            <div className="settings-content-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Notification Alerts</h2>
                  <p className="settings-card-subtitle">Configure real-time stock and sales triggers</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer border-[var(--border-color)]">
                  <input type="checkbox" checked={notifyLowStock} onChange={e => setNotifyLowStock(e.target.checked)} className="w-4 h-4" />
                  <div>
                    <span className="font-bold text-sm block">Low Stock Alerts</span>
                    <span className="text-xs text-text-secondary">Notify when product quantities fall below minimum threshold.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer border-[var(--border-color)]">
                  <input type="checkbox" checked={notifyNewSale} onChange={e => setNotifyNewSale(e.target.checked)} className="w-4 h-4" />
                  <div>
                    <span className="font-bold text-sm block">New Sale Alerts</span>
                    <span className="text-xs text-text-secondary">Show notification for every completed invoice and payment.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer border-[var(--border-color)]">
                  <input type="checkbox" checked={notifyDailyReport} onChange={e => setNotifyDailyReport(e.target.checked)} className="w-4 h-4" />
                  <div>
                    <span className="font-bold text-sm block">End-of-Day Summary</span>
                    <span className="text-xs text-text-secondary">Generate automated closing summary at shift completion.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 8: Data Backup */}
          {activeTab === 'backup' && (
            <div className="settings-content-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Data Backup & Exports</h2>
                  <p className="settings-card-subtitle">Export full raw business data to a local JSON file</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Your data is safely stored locally and synchronized with your Firebase cloud database. You can download an offline raw snapshot anytime.
                </p>

                <div>
                  <button className="settings-btn-primary" onClick={handleExportData}>
                    <Download size={16} />
                    <span>Export Full Data Backup (.json)</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)] mt-2">
                  <h4 className="font-bold text-sm text-text-main mb-1">Database Maintenance</h4>
                  <p className="text-xs text-text-secondary mb-3">Re-seed standard cafeteria demo data if needed.</p>
                  <button className="settings-btn-secondary" onClick={handleResetData}>
                    <RotateCcw size={15} />
                    <span>Reset to Default Demo State</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: Account & Security (Comprehensive & Ultra-Clean) */}
          {activeTab === 'account' && (
            <div className="settings-content-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Account & Security</h2>
                  <p className="settings-card-subtitle">Manage personal profile, login credentials, and session devices</p>
                </div>
              </div>

              {/* Account Hero Card */}
              <div className="settings-account-hero">
                <div className="settings-account-user-info">
                  <div className="settings-account-avatar">
                    {currentUser?.name?.charAt(0) || 'H'}
                  </div>
                  <div className="settings-account-meta">
                    <h3>{accountDisplayName || currentUser?.name || 'HUMZA'}</h3>
                    <p>{currentUser?.email || 'humza30363@gmail.com'}</p>
                    <span className="settings-account-badge">
                      ● Google Verified Owner
                    </span>
                  </div>
                </div>

                <button 
                  className="settings-btn-secondary" 
                  onClick={handleLogout}
                  title="Sign out of Karobaar"
                >
                  <LogOut size={15} />
                  <span>Log Out</span>
                </button>
              </div>

              {/* Section 1: Edit Profile Information */}
              <div className="settings-section-block">
                <h3 className="settings-section-heading">Personal Details</h3>
                <div className="settings-grid-2">
                  <div className="settings-input-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      className="settings-input-field" 
                      value={accountDisplayName}
                      onChange={e => setAccountDisplayName(e.target.value)}
                    />
                  </div>

                  <div className="settings-input-group">
                    <label>Direct Phone Number</label>
                    <input 
                      type="text" 
                      className="settings-input-field" 
                      value={accountPhone}
                      onChange={e => setAccountPhone(e.target.value)}
                    />
                  </div>

                  <div className="settings-input-group">
                    <label>Default Login Branch</label>
                    <select 
                      className="settings-input-field"
                      value={defaultBranch}
                      onChange={e => setDefaultBranch(e.target.value)}
                    >
                      <option value="main">SAS CAFETERIA (Main Counter)</option>
                      <option value="kiosk">SAS CAFETERIA (Express Kiosk)</option>
                    </select>
                  </div>

                  <div className="settings-input-group">
                    <label>Auto-Lock Session Inactivity</label>
                    <select 
                      className="settings-input-field"
                      value={autoLockTimeout}
                      onChange={e => setAutoLockTimeout(e.target.value)}
                    >
                      <option value="15m">Lock after 15 Minutes</option>
                      <option value="30m">Lock after 30 Minutes</option>
                      <option value="1h">Lock after 1 Hour</option>
                      <option value="never">Never (Stay Logged In)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Security & Change Password */}
              <div className="settings-section-block">
                <h3 className="settings-section-heading">
                  <Key size={16} /> Security & Password Management
                </h3>
                
                {passwordStatus && (
                  <div className="p-3 text-xs font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                    {passwordStatus}
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="settings-grid-2">
                  <div className="settings-input-group">
                    <label>New Password</label>
                    <input 
                      type="password" 
                      className="settings-input-field" 
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="settings-input-group">
                    <label>Confirm New Password</label>
                    <input 
                      type="password" 
                      className="settings-input-field" 
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <button type="submit" className="settings-btn-primary">
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Section 3: Active Authorized Sessions & Connected Devices */}
              <div className="settings-section-block">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
                  <div>
                    <h3 className="settings-section-heading">
                      <ShieldCheck size={17} /> Connected Devices & Active Sessions ({deviceList.length})
                    </h3>
                    <p className="settings-card-subtitle">
                      All computers, laptops, and mobile phones currently authenticated into your Karobaar account
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      className="settings-btn-secondary"
                      style={{ height: '34px', fontSize: '0.75rem', padding: '0 0.85rem' }}
                      onClick={handleRefreshDevices}
                      title="Refresh session status"
                    >
                      <RefreshCw size={13} className={isRefreshingDevices ? 'animate-spin' : ''} />
                      <span>Refresh</span>
                    </button>
                    {deviceList.length > 1 && (
                      <button 
                        type="button" 
                        className="settings-btn-primary"
                        style={{ height: '34px', fontSize: '0.75rem', padding: '0 0.85rem' }}
                        onClick={handleRevokeAllOtherDevices}
                        title="Sign out of all other devices"
                      >
                        <LogOut size={13} />
                        <span>Log Out All Other Devices</span>
                      </button>
                    )}
                  </div>
                </div>

                {deviceBanner && (
                  <div className="p-3 text-xs font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                    {deviceBanner}
                  </div>
                )}

                <div className="flex flex-col gap-2.5">
                  {deviceList.map(device => {
                    // Render appropriate device icon
                    const renderIcon = () => {
                      if (device.isCurrent) return <Monitor size={20} />;
                      if (device.type === 'mobile') return <Smartphone size={20} />;
                      if (device.type === 'tablet') return <Tablet size={20} />;
                      return <Laptop size={20} />;
                    };

                    const displayName = device.isCurrent 
                      ? `${currentDeviceInfo.os} • ${currentDeviceInfo.browser} (This Device)`
                      : device.name;

                    const displaySub = device.isCurrent
                      ? `IP: ${device.ip} • Screen: ${currentDeviceInfo.screen} • Active right now`
                      : `IP: ${device.ip} • ${device.lastActive}`;

                    return (
                      <div 
                        key={device.id} 
                        className="p-3.5 border rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-[var(--border-color)] bg-[var(--bg-card)] hover:border-black dark:hover:border-white transition-colors"
                        style={{
                          borderWidth: device.isCurrent ? '2px' : '1px'
                        }}
                      >
                        <div className="flex items-center gap-3.5">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: device.isCurrent ? '#09090b' : 'var(--bg-hover)',
                              color: device.isCurrent ? '#ffffff' : 'var(--text-main)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {renderIcon()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-text-main">{displayName}</span>
                              {device.isCurrent && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                                  CURRENT
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-text-secondary mt-0.5 block">{displaySub}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                          <span 
                            className="text-[10px] font-bold px-2.5 py-1 rounded-md"
                            style={{
                              backgroundColor: device.status === 'ACTIVE NOW' || device.status === 'ONLINE' ? '#09090b' : 'var(--bg-hover)',
                              color: device.status === 'ACTIVE NOW' || device.status === 'ONLINE' ? '#ffffff' : 'var(--text-main)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            ● {device.status}
                          </span>

                          {!device.isCurrent && (
                            <button
                              type="button"
                              className="settings-btn-secondary"
                              style={{ height: '30px', fontSize: '0.725rem', padding: '0 0.65rem' }}
                              onClick={() => handleRevokeDevice(device.id)}
                              title="Revoke session for this device"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Connect New Device Quick Card */}
                <div className="mt-3 p-4 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-hover)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs block text-text-main">Connect Another Laptop or Mobile Phone</span>
                    <span className="text-[11px] text-text-secondary">Open Karobaar on your phone or tablet browser via your local network URL to sync in real time.</span>
                  </div>
                  <button 
                    type="button"
                    className="settings-btn-secondary"
                    style={{ height: '32px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      navigator.clipboard?.writeText?.(window.location.origin);
                      setDeviceBanner('Workspace URL copied to clipboard! Open it on your mobile device to log in.');
                      setTimeout(() => setDeviceBanner(''), 3500);
                    }}
                  >
                    Copy App URL
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Settings Change Loading Transition Overlay with Action Notification */}
    {isChangingSettings && (
      <div className="settings-transition-overlay">
        <div className="settings-transition-card">
          {!settingsChangedSuccess ? (
            <>
              <div className="settings-transition-spinner" />
              <h3 className="settings-transition-title">Saving Workspace Settings...</h3>
              <p className="settings-transition-sub">Applying business parameters & operational rules</p>
            </>
          ) : (
            <>
              <div className="settings-transition-check">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="settings-transition-title">This settings has been changed</h3>
              <p className="settings-transition-sub">Workspace configuration and preferences have been successfully updated.</p>
              <div className="settings-transition-actions">
                <button 
                  type="button"
                  className="settings-transition-btn"
                  onClick={() => {
                    setIsChangingSettings(false);
                    setSettingsChangedSuccess(false);
                  }}
                >
                  <Check size={14} />
                  <span>Done / Dismiss</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </div>
  );
};

export default Settings;
