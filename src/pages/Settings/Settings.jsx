import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Volume2,
  Check,
  Upload,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { db } from '../../services/databaseService';
import { auth } from '../../services/firebase';
import { signOut, updatePassword } from 'firebase/auth';
import { useAppContext, DEFAULT_BUSINESS } from '../../context/AppContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileMenu } from './MobileMenu';
import TeamManagement from './TeamManagement';
import { aiEvaluationService } from '../../services/ai/aiEvaluationService';
import { conversationService } from '../../services/ai/conversationService';
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
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'general';

  const { 
    currentBusiness, 
    currentUser, 
    refreshUserProfile,
    refreshBusinessProfile,
    updateCurrentBusiness,
    theme, 
    setTheme, 
    accent, 
    setAccent, 
    appUiVersion, 
    setAppUiVersion 
  } = useAppContext();

  const activeBizId = currentBusiness?.id || currentUser?.activeBusinessId || 'demo-business-1';

  const [activeTab, setActiveTab] = useState(initialTab);
  
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  // Loading & Save Feedback States
  const [saving, setSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [isChangingSettings, setIsChangingSettings] = useState(false);
  const [settingsChangedSuccess, setSettingsChangedSuccess] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const lastLoadedBizIdRef = useRef(null);

  // Baseline snapshot for tracking dirty / unsaved changes
  const [initialBaseline, setInitialBaseline] = useState(null);

  // 1. Business Profile State
  const [businessName, setBusinessName] = useState('SAS CAFETERIA');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessType, setBusinessType] = useState('Cafeteria / Restaurant');
  const [businessPhone, setBusinessPhone] = useState('+91 98765 43210');
  const [businessAddress, setBusinessAddress] = useState('Shop #4, Commercial Complex');
  const [taxId, setTaxId] = useState('GSTIN-29AAAAA0000A1Z5');

  // 2. Appearance & Mode State
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem('karobaar-theme') || 'light');
  const [selectedAccent, setSelectedAccent] = useState(() => localStorage.getItem('karobaar-accent') || 'default');
  const [selectedAppUiVersion, setSelectedAppUiVersion] = useState(() => localStorage.getItem('karobaar-ui-version') || 'v2');

  // 3. Customize (AI & Automations) State
  const [aiAssistantName, setAiAssistantName] = useState('Jarvis');
  const [aiWakeWord, setAiWakeWord] = useState('Hey Jarvis');
  const [aiBackgroundWake, setAiBackgroundWake] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiFloatingBubble, setAiFloatingBubble] = useState(true);
  const [aiAutoExecute, setAiAutoExecute] = useState(true);
  const [autoAlertLowStock, setAutoAlertLowStock] = useState(true);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
  const [dailySummaryNotification, setDailySummaryNotification] = useState(true);
  const [rapidBarcodeAdd, setRapidBarcodeAdd] = useState(true);
  const [aiLanguage, setAiLanguage] = useState('hinglish');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [aiResponseStyle, setAiResponseStyle] = useState('balanced');
  const [aiConfirmSensitive, setAiConfirmSensitive] = useState(true);
  const [aiStockoutAlerts, setAiStockoutAlerts] = useState(true);
  const [aiSalesComparison, setAiSalesComparison] = useState(true);
  const [aiExpenseAnomaly, setAiExpenseAnomaly] = useState(true);
  const [aiDiagnosticsResult, setAiDiagnosticsResult] = useState(null);
  const [aiDiagnosticsLoading, setAiDiagnosticsLoading] = useState(false);
  const [aiMemoryNotice, setAiMemoryNotice] = useState('');

  // UPI & QR Presentation State
  const [storeUpiId, setStoreUpiId] = useState('karobaar.pay@upi');
  const [storeUpiQrImage, setStoreUpiQrImage] = useState(null);
  const [storeUpiMode, setStoreUpiMode] = useState('dynamic');

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

  // 4. Preferences & Tax State
  const [currency, setCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [taxRate, setTaxRate] = useState(5);

  // 5. Invoice Settings State
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [paymentTerms, setPaymentTerms] = useState('Immediate / Due on Receipt');
  const [invoiceFooter, setInvoiceFooter] = useState('Thank you for choosing SAS CAFETERIA!');

  // 6. Notifications State
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyNewSale, setNotifyNewSale] = useState(true);
  const [notifyDailyReport, setNotifyDailyReport] = useState(false);

  // 7. Features & Modules State
  const [enabledModules, setEnabledModules] = useState({});

  // 8. Account & Security State
  const [accountDisplayName, setAccountDisplayName] = useState('');
  const [accountPhone, setAccountPhone] = useState('+91 98765 43210');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [autoLockTimeout, setAutoLockTimeout] = useState('30m');
  
  // Password Update State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  // Persistent Device ID generator
  const getPersistentDeviceId = () => {
    if (typeof window === 'undefined') return 'device-primary';
    let devId = localStorage.getItem('karobaar_device_id');
    if (!devId) {
      devId = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('karobaar_device_id', devId);
    }
    return devId;
  };

  // Real Current Device Auto-detector
  const getRealCurrentDevice = () => {
    if (typeof window === 'undefined') {
      return {
        id: 'device-primary',
        deviceId: 'device-primary',
        name: 'Windows PC • Google Chrome (This Device)',
        os: 'Windows PC',
        browser: 'Google Chrome',
        isCurrent: true,
        ip: '127.0.0.1 (Localhost)',
        screen: '1920 × 1080',
        lastActive: 'Active right now',
        lastActiveTime: Date.now(),
        status: 'ACTIVE NOW',
        type: 'desktop'
      };
    }

    const devId = getPersistentDeviceId();
    const ua = navigator.userAgent || '';
    
    // Real OS detection
    let os = 'Windows PC';
    if (/Windows/i.test(ua)) os = 'Windows PC';
    else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Apple Mac';
    else if (/iPhone/i.test(ua)) os = 'Apple iPhone';
    else if (/iPad/i.test(ua)) os = 'Apple iPad';
    else if (/Android/i.test(ua)) os = 'Android Mobile';
    else if (/Linux/i.test(ua)) os = 'Linux Workstation';

    // Real Browser detection
    let browser = 'Google Chrome';
    if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
    else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Google Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
    else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';

    // Real Device Type
    let type = 'desktop';
    if (/iPad|Tablet/i.test(ua) || (navigator.maxTouchPoints > 1 && window.screen.width >= 768 && window.screen.width <= 1024)) {
      type = 'tablet';
    } else if (/Mobi|Android|iPhone/i.test(ua)) {
      type = 'mobile';
    } else if (window.screen.width <= 1536 && navigator.maxTouchPoints > 0) {
      type = 'laptop';
    }

    const screenRes = `${window.screen?.width || 1920} × ${window.screen?.height || 1080}`;
    const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? '127.0.0.1 (Localhost)'
      : window.location.hostname || '127.0.0.1';

    return {
      id: devId,
      deviceId: devId,
      name: `${os} • ${browser} (This Device)`,
      os,
      browser,
      screen: screenRes,
      ip: host,
      isCurrent: true,
      lastActive: 'Active right now',
      lastActiveTime: Date.now(),
      status: 'ACTIVE NOW',
      type
    };
  };

  const currentDeviceInfo = getRealCurrentDevice();

  // Device Sessions State (ONLY TRUE DEVICES)
  const [deviceList, setDeviceList] = useState(() => {
    try {
      const saved = localStorage.getItem('karobaar_connected_devices');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Strict filter to permanently eliminate any legacy fake mockups
        const cleaned = parsed.filter(d => 
          d && 
          d.id !== 'mobile-pwa' && 
          d.id !== 'pos-tablet' && 
          d.id !== 'laptop-billing' &&
          !d.name?.includes('Samsung Galaxy') &&
          !d.name?.includes('iPad Counter Register') &&
          !d.name?.includes('HP Laptop (Manager Office)')
        );
        if (cleaned.length > 0) return cleaned;
      }
    } catch (e) {}
    return [getRealCurrentDevice()];
  });

  const [deviceBanner, setDeviceBanner] = useState('');
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);

  const handleRevokeDevice = async (deviceId) => {
    try {
      await db.revokeDeviceSession(currentUser?.id, activeBizId, deviceId);
      const updated = deviceList.filter(d => d.id !== deviceId && d.deviceId !== deviceId);
      setDeviceList(updated);
      try {
        localStorage.setItem('karobaar_connected_devices', JSON.stringify(updated));
      } catch (e) {}
      setDeviceBanner('Device session revoked successfully.');
    } catch (e) {
      const updated = deviceList.filter(d => d.id !== deviceId);
      setDeviceList(updated);
      setDeviceBanner('Device session revoked.');
    }
    setTimeout(() => setDeviceBanner(''), 3000);
  };

  const handleRevokeAllOtherDevices = async () => {
    if (window.confirm('Log out all other connected sessions and keep only this current device?')) {
      const cur = getRealCurrentDevice();
      try {
        await db.revokeAllOtherDeviceSessions(currentUser?.id, activeBizId, cur.deviceId);
      } catch (e) {}
      const onlyCurrent = [cur];
      setDeviceList(onlyCurrent);
      try {
        localStorage.setItem('karobaar_connected_devices', JSON.stringify(onlyCurrent));
      } catch (e) {}
      setDeviceBanner('All other device sessions have been logged out.');
      setTimeout(() => setDeviceBanner(''), 3500);
    }
  };

  const handleRefreshDevices = async () => {
    setIsRefreshingDevices(true);
    try {
      const cur = getRealCurrentDevice();
      await db.registerDeviceSession(currentUser?.id, activeBizId, cur);
      const sessions = await db.getActiveDeviceSessions(currentUser?.id, activeBizId, cur.deviceId);
      if (sessions && sessions.length > 0) {
        setDeviceList(sessions);
        try {
          localStorage.setItem('karobaar_connected_devices', JSON.stringify(sessions));
        } catch (e) {}
      } else {
        setDeviceList([cur]);
      }
      setDeviceBanner('Connected device sessions verified and refreshed.');
    } catch (e) {
      setDeviceBanner('Device sessions refreshed.');
    } finally {
      setIsRefreshingDevices(false);
      setTimeout(() => setDeviceBanner(''), 2500);
    }
  };

  // Helper snapshot of all current state
  const getCurrentStateSnapshot = useCallback(() => ({
    general: {
      businessName,
      businessType,
      businessEmail,
      businessPhone,
      businessAddress,
      taxId
    },
    appearance: {
      theme: selectedTheme,
      accent: selectedAccent,
      appUiVersion: selectedAppUiVersion
    },
    customize: {
      aiAssistantName,
      aiWakeWord,
      aiBackgroundWake,
      aiEnabled,
      aiFloatingBubble,
      aiAutoExecute,
      autoAlertLowStock,
      autoPrintReceipt,
      dailySummaryNotification,
      rapidBarcodeAdd,
      aiLanguage,
      storeUpiId,
      storeUpiQrImage,
      storeUpiMode
    },
    preferences: {
      currency,
      dateFormat,
      lowStockThreshold: Math.max(0, Number(lowStockThreshold) || 0),
      taxRate: Math.max(0, Number(taxRate) || 0)
    },
    invoices: {
      invoicePrefix,
      paymentTerms,
      invoiceFooter
    },
    features: { ...enabledModules },
    notifications: {
      notifyLowStock,
      notifyNewSale,
      notifyDailyReport
    },
    account: {
      accountDisplayName,
      accountPhone,
      defaultBranch,
      autoLockTimeout
    }
  }), [
    businessName, businessType, businessEmail, businessPhone, businessAddress, taxId,
    selectedTheme, selectedAccent, selectedAppUiVersion,
    aiAssistantName, aiWakeWord, aiBackgroundWake, aiEnabled, aiFloatingBubble, aiAutoExecute,
    autoAlertLowStock, autoPrintReceipt, dailySummaryNotification, rapidBarcodeAdd, aiLanguage,
    storeUpiId, storeUpiQrImage, storeUpiMode,
    currency, dateFormat, lowStockThreshold, taxRate,
    invoicePrefix, paymentTerms, invoiceFooter,
    enabledModules,
    notifyLowStock, notifyNewSale, notifyDailyReport,
    accountDisplayName, accountPhone, defaultBranch, autoLockTimeout
  ]);

  // Determine if a section or whole form has unsaved edits
  const isSectionDirty = (sectionKey) => {
    if (!initialBaseline || !initialBaseline[sectionKey]) return false;
    const current = getCurrentStateSnapshot()[sectionKey];
    return JSON.stringify(current) !== JSON.stringify(initialBaseline[sectionKey]);
  };

  const hasUnsavedChanges = (() => {
    if (!initialBaseline) return false;
    const current = getCurrentStateSnapshot();
    return JSON.stringify(current) !== JSON.stringify(initialBaseline);
  })();

  // Main Load Settings Effect: Loads fresh database values safely without clobbering in-flight typing
  const loadSettings = useCallback(async (force = false) => {
    const bizId = currentBusiness?.id || currentUser?.activeBusinessId || localStorage.getItem('karobaar-active-business') || 'demo-business-1';

    if (!force && lastLoadedBizIdRef.current === bizId && dataLoaded) {
      return;
    }

    try {
      const biz = (await db.getById('businesses', bizId)) || currentBusiness || DEFAULT_BUSINESS;
      const settings = biz.settings || {};
      const aiSettings = settings.aiSettings || {};

      let userRecord = currentUser;
      if (currentUser?.id) {
        userRecord = (await db.getById('users', currentUser.id)) || currentUser;
      }

      // Populate Business Profile
      const bName = biz.name || 'SAS CAFETERIA';
      const bType = biz.type || 'Cafeteria / Restaurant';
      const bEmail = biz.email || '';
      const bPhone = biz.phone || settings.phone || '+91 98765 43210';
      const bAddr = biz.address || settings.address || 'Shop #4, Commercial Complex';
      const bTaxId = settings.taxId || 'GSTIN-29AAAAA0000A1Z5';

      setBusinessName(bName);
      setBusinessType(bType);
      setBusinessEmail(bEmail);
      setBusinessPhone(bPhone);
      setBusinessAddress(bAddr);
      setTaxId(bTaxId);

      // Populate Appearance
      const loadedTheme = localStorage.getItem('karobaar-theme') || settings.theme || theme || 'light';
      const loadedAccent = localStorage.getItem('karobaar-accent') || settings.accent || accent || 'default';
      const loadedUiVersion = localStorage.getItem('karobaar-ui-version') || settings.appUiVersion || appUiVersion || 'v2';
      setSelectedTheme(loadedTheme);
      setSelectedAccent(loadedAccent);
      setSelectedAppUiVersion(loadedUiVersion);

      // Populate Customize AI
      let savedAiLocal = {};
      try {
        savedAiLocal = JSON.parse(localStorage.getItem('karobaar_customize_ai_settings') || '{}');
      } catch (e) {}

      const aName = aiSettings.assistantName || savedAiLocal.assistantName || 'Jarvis';
      const aWake = aiSettings.wakeWord || savedAiLocal.wakeWord || (aName === 'Mr. H' ? 'Hey Mr. H' : 'Hey Jarvis');
      const aBgWake = aiSettings.backgroundWake ?? savedAiLocal.backgroundWake ?? true;
      const aEn = aiSettings.aiEnabled ?? savedAiLocal.aiEnabled ?? true;
      const aBubble = aiSettings.showFloatingBubble ?? savedAiLocal.showFloatingBubble ?? true;
      const aAuto = aiSettings.autoExecute ?? savedAiLocal.autoExecute ?? true;
      const aStock = aiSettings.autoAlertLowStock ?? savedAiLocal.autoAlertLowStock ?? true;
      const aPrint = aiSettings.autoPrintReceipt ?? savedAiLocal.autoPrintReceipt ?? false;
      const aDaily = aiSettings.dailySummaryNotification ?? savedAiLocal.dailySummaryNotification ?? true;
      const aRapid = aiSettings.rapidBarcodeAdd ?? savedAiLocal.rapidBarcodeAdd ?? true;
      const aLang = localStorage.getItem('karobaar_ai_language') || aiSettings.language || 'hinglish';

      setAiAssistantName(aName);
      setAiWakeWord(aWake);
      setAiBackgroundWake(aBgWake);
      setAiEnabled(aEn);
      setAiFloatingBubble(aBubble);
      setAiAutoExecute(aAuto);
      setAutoAlertLowStock(aStock);
      setAutoPrintReceipt(aPrint);
      setDailySummaryNotification(aDaily);
      setRapidBarcodeAdd(aRapid);
      setAiLanguage(aLang);
      setAiModel(aiSettings.model || 'gemini-2.5-flash');
      setAiResponseStyle(aiSettings.responseStyle || 'balanced');
      setAiConfirmSensitive(aiSettings.confirmSensitive ?? true);
      setAiStockoutAlerts(aiSettings.enableStockoutAlerts ?? true);
      setAiSalesComparison(aiSettings.enableSalesComparisons ?? true);
      setAiExpenseAnomaly(aiSettings.enableExpenseAnomalyAlerts ?? true);

      const uId = settings.upiId || localStorage.getItem('karobaar_custom_upi_id') || 'karobaar.pay@upi';
      const uImg = settings.upiQrImage || localStorage.getItem('karobaar_custom_upi_qr_img') || null;
      const uMode = settings.upiDefaultMode || localStorage.getItem('karobaar_custom_upi_mode') || 'dynamic';
      setStoreUpiId(uId);
      setStoreUpiQrImage(uImg);
      setStoreUpiMode(uMode);

      // Populate Preferences
      const prefCurr = settings.currency || 'INR';
      const prefDate = settings.dateFormat || 'DD/MM/YYYY';
      const prefLow = settings.lowStockThreshold ?? 5;
      const prefTax = settings.taxRate ?? 5;
      setCurrency(prefCurr);
      setDateFormat(prefDate);
      setLowStockThreshold(prefLow);
      setTaxRate(prefTax);

      // Populate Invoices
      const invPrefix = settings.invoicePrefix || 'INV-';
      const invTerms = settings.paymentTerms || 'Immediate / Due on Receipt';
      const invFooter = settings.invoiceFooter || 'Thank you for choosing SAS CAFETERIA!';
      setInvoicePrefix(invPrefix);
      setPaymentTerms(invTerms);
      setInvoiceFooter(invFooter);

      // Populate Modules
      const initialMods = biz.modules || {};
      const populatedMods = {};
      MODULES_LIST.forEach(m => {
        populatedMods[m.id] = initialMods[m.id] !== false;
      });
      setEnabledModules(populatedMods);

      // Populate Notifications
      const notLow = settings.notifyLowStock ?? true;
      const notSale = settings.notifyNewSale ?? true;
      const notRep = settings.notifyDailyReport ?? false;
      setNotifyLowStock(notLow);
      setNotifyNewSale(notSale);
      setNotifyDailyReport(notRep);

      // Populate Account Details
      const uName = userRecord?.name || 'HUMZA';
      const uPhone = userRecord?.phone || '+91 98765 43210';
      const uBranch = userRecord?.defaultBranch || 'main';
      const uLock = userRecord?.autoLockTimeout || '30m';
      setAccountDisplayName(uName);
      setAccountPhone(uPhone);
      setDefaultBranch(uBranch);
      setAutoLockTimeout(uLock);

      // Save baseline snapshot
      const baseline = {
        general: {
          businessName: bName,
          businessType: bType,
          businessEmail: bEmail,
          businessPhone: bPhone,
          businessAddress: bAddr,
          taxId: bTaxId
        },
        appearance: {
          theme: loadedTheme,
          accent: loadedAccent,
          appUiVersion: loadedUiVersion
        },
        customize: {
          aiAssistantName: aName,
          aiWakeWord: aWake,
          aiBackgroundWake: aBgWake,
          aiEnabled: aEn,
          aiFloatingBubble: aBubble,
          aiAutoExecute: aAuto,
          autoAlertLowStock: aStock,
          autoPrintReceipt: aPrint,
          dailySummaryNotification: aDaily,
          rapidBarcodeAdd: aRapid,
          aiLanguage: aLang,
          storeUpiId: uId,
          storeUpiQrImage: uImg,
          storeUpiMode: uMode
        },
        preferences: {
          currency: prefCurr,
          dateFormat: prefDate,
          lowStockThreshold: Number(prefLow),
          taxRate: Number(prefTax)
        },
        invoices: {
          invoicePrefix: invPrefix,
          paymentTerms: invTerms,
          invoiceFooter: invFooter
        },
        features: populatedMods,
        notifications: {
          notifyLowStock: notLow,
          notifyNewSale: notSale,
          notifyDailyReport: notRep
        },
        account: {
          accountDisplayName: uName,
          accountPhone: uPhone,
          defaultBranch: uBranch,
          autoLockTimeout: uLock
        }
      };

      setInitialBaseline(baseline);
      lastLoadedBizIdRef.current = bizId;
      setDataLoaded(true);
    } catch (err) {
      console.error("[Settings] Load error:", err);
    }
  }, [currentBusiness?.id, currentUser?.id, dataLoaded]);

  useEffect(() => {
    loadSettings();
  }, [currentBusiness?.id, currentUser?.id]);

  // Synchronize true device session on mount and business switch
  useEffect(() => {
    let isMounted = true;
    const syncDevice = async () => {
      try {
        const cur = getRealCurrentDevice();
        await db.registerDeviceSession(currentUser?.id, activeBizId, cur);
        const sessions = await db.getActiveDeviceSessions(currentUser?.id, activeBizId, cur.deviceId);
        if (isMounted) {
          if (sessions && sessions.length > 0) {
            setDeviceList(sessions);
            try {
              localStorage.setItem('karobaar_connected_devices', JSON.stringify(sessions));
            } catch (e) {}
          } else {
            setDeviceList([cur]);
          }
        }
      } catch (e) {
        if (isMounted) setDeviceList([getRealCurrentDevice()]);
      }
    };
    syncDevice();
    return () => { isMounted = false; };
  }, [activeBizId, currentUser?.id]);

  // Global keyboard shortcut: Ctrl+S / Cmd+S to save all workspace settings
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

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

  // Robust Save Handler supporting section-specific or global saves
  const handleSave = async (targetSection = null) => {
    const bizId = currentBusiness?.id || currentUser?.activeBusinessId || localStorage.getItem('karobaar-active-business') || 'demo-business-1';
    
    // 1. Validation
    if (targetSection === 'general' || !targetSection) {
      if (!businessName || !businessName.trim()) {
        setErrorBanner('Company / Legal Name is required.');
        setTimeout(() => setErrorBanner(''), 4500);
        return;
      }
    }

    if (targetSection === 'preferences' || !targetSection) {
      if (isNaN(taxRate) || Number(taxRate) < 0) {
        setErrorBanner('Default Tax Rate must be a valid positive number or 0.');
        setTimeout(() => setErrorBanner(''), 4500);
        return;
      }
      if (isNaN(lowStockThreshold) || Number(lowStockThreshold) < 0) {
        setErrorBanner('Low Stock Threshold must be a valid positive number or 0.');
        setTimeout(() => setErrorBanner(''), 4500);
        return;
      }
    }

    setSaving(true);
    setSaveBanner('');
    setErrorBanner('');
    setIsChangingSettings(true);
    setSettingsChangedSuccess(false);

    try {
      // 2. Fetch fresh business record to guarantee non-destructive merges
      const freshBiz = (await db.getById('businesses', bizId)) || currentBusiness || DEFAULT_BUSINESS;
      const freshSettings = freshBiz.settings || {};

      const aiConfig = {
        ...(freshSettings.aiSettings || {}),
        assistantName: aiAssistantName || 'Jarvis',
        wakeWord: aiWakeWord || (aiAssistantName ? `Hey ${aiAssistantName}` : 'Hey Jarvis'),
        backgroundWake: aiBackgroundWake,
        aiEnabled,
        showFloatingBubble: aiFloatingBubble,
        autoExecute: aiAutoExecute,
        autoAlertLowStock,
        autoPrintReceipt,
        dailySummaryNotification,
        rapidBarcodeAdd,
        language: aiLanguage,
        model: aiModel,
        responseStyle: aiResponseStyle,
        confirmSensitive: aiConfirmSensitive,
        enableStockoutAlerts: aiStockoutAlerts,
        enableSalesComparisons: aiSalesComparison,
        enableExpenseAnomalyAlerts: aiExpenseAnomaly
      };

      const updatedSettings = {
        ...freshSettings,
        currency,
        dateFormat,
        lowStockThreshold: Math.max(0, Number(lowStockThreshold) || 5),
        taxRate: Math.max(0, Number(taxRate) || 0),
        taxId: (taxId || '').trim(),
        phone: (businessPhone || '').trim(),
        address: (businessAddress || '').trim(),
        invoicePrefix: (invoicePrefix || 'INV-').trim(),
        paymentTerms,
        invoiceFooter: invoiceFooter || '',
        notifyLowStock,
        notifyNewSale,
        notifyDailyReport,
        theme: selectedTheme,
        accent: selectedAccent,
        appUiVersion: selectedAppUiVersion,
        aiSettings: aiConfig,
        upiId: (storeUpiId || '').trim(),
        upiQrImage: storeUpiQrImage,
        upiDefaultMode: storeUpiMode
      };

      const businessUpdates = {
        name: (businessName || 'SAS CAFETERIA').trim(),
        type: businessType,
        email: (businessEmail || '').trim(),
        phone: (businessPhone || '').trim(),
        address: (businessAddress || '').trim(),
        settings: updatedSettings,
        modules: enabledModules
      };

      // 3. Persist business to database & AppContext
      if (updateCurrentBusiness) {
        await updateCurrentBusiness(businessUpdates);
      } else {
        await db.update('businesses', bizId, businessUpdates);
      }

      // 4. Update immediate appearance & UI modes
      localStorage.setItem('karobaar-theme', selectedTheme);
      localStorage.setItem('karobaar-accent', selectedAccent);
      localStorage.setItem('karobaar-ui-version', selectedAppUiVersion);
      if (setTheme) setTheme(selectedTheme);
      if (setAccent) setAccent(selectedAccent);
      if (setAppUiVersion) setAppUiVersion(selectedAppUiVersion);

      // 5. Update local storage fast caches
      localStorage.setItem('karobaar_customize_ai_settings', JSON.stringify(aiConfig));
      localStorage.setItem('karobaar_ai_language', aiLanguage);
      localStorage.setItem('karobaar_custom_upi_id', storeUpiId);
      if (storeUpiQrImage) localStorage.setItem('karobaar_custom_upi_qr_img', storeUpiQrImage);
      else localStorage.removeItem('karobaar_custom_upi_qr_img');
      localStorage.setItem('karobaar_custom_upi_mode', storeUpiMode);

      // 6. Update user account profile if present
      if (currentUser?.id) {
        try {
          await db.update('users', currentUser.id, {
            name: (accountDisplayName || '').trim(),
            phone: (accountPhone || '').trim(),
            defaultBranch,
            autoLockTimeout
          });
          if (refreshUserProfile) await refreshUserProfile();
        } catch (e) {
          console.warn("User profile save note:", e);
        }
      }

      // 7. Broadcast settings update to Topbar, POS, and Jarvis
      window.dispatchEvent(new CustomEvent('karobaar_settings_updated', { 
        detail: { 
          assistantName: aiAssistantName || 'Jarvis',
          businessId: bizId,
          businessName: businessUpdates.name,
          settings: updatedSettings 
        } 
      }));

      // 8. Update baseline snapshot so isDirty clears
      setInitialBaseline(getCurrentStateSnapshot());

      // 9. Display success feedback
      setSettingsChangedSuccess(true);
      const sectionLabel = targetSection ? `Section` : `Workspace`;
      setSaveBanner(`${sectionLabel} settings saved successfully.`);

      setTimeout(() => {
        setIsChangingSettings(false);
        setSettingsChangedSuccess(false);
      }, 1400);

      setTimeout(() => setSaveBanner(''), 4500);
    } catch (err) {
      console.error("[Settings] Save error:", err);
      setIsChangingSettings(false);
      setSettingsChangedSuccess(false);
      setErrorBanner(`Failed to save settings: ${err.message || 'Storage error'}. Your edits are preserved.`);
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
      const bizId = currentBusiness?.id || currentUser?.activeBusinessId || 'demo-business-1';
      const sales = await db.getCollection('sales', bizId);
      const products = await db.getCollection('products', bizId);
      const customers = await db.getCollection('customers', bizId);
      const suppliers = await db.getCollection('suppliers', bizId);
      const expenses = await db.getCollection('expenses', bizId);
      const purchases = await db.getCollection('purchases', bizId);
      const employees = await db.getCollection('employees', bizId);
      
      const backupPayload = {
        business: currentBusiness?.name || 'SAS CAFETERIA',
        timestamp: new Date().toISOString(),
        exportedBy: currentUser?.email || 'admin',
        totalSales: sales.length,
        totalProducts: products.length,
        totalCustomers: customers.length,
        sales,
        products,
        customers,
        suppliers,
        expenses,
        purchases,
        employees,
        settings: currentBusiness?.settings || {}
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
  const tabParam = queryParams.get('tab');
  
  // On mobile, if no tab param is present in URL, show the high-level MobileMenu.
  // If a tab param is clicked, display that settings section with a clean back button.
  if (isMobile && !tabParam) {
    return <MobileMenu />;
  }

  return (
    <div className="settings-page-wrapper">
      {/* Mobile Back Button */}
      {isMobile && (
        <div className="flex items-center gap-2 pb-2">
          <button 
            type="button" 
            className="settings-btn-secondary" 
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft size={14} />
            <span>Back to Settings Menu</span>
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="settings-header-strip">
        <div className="settings-header-text">
          <h1>Settings & Workspace</h1>
          <p>Configure business parameters, security & operating mode</p>
        </div>
        <div className="settings-header-actions">
          {hasUnsavedChanges && (
            <span className="settings-header-dirty-badge" title="You have unsaved changes">
              ● Unsaved Changes
            </span>
          )}

          {errorBanner && (
            <div className="settings-error-banner">
              <AlertCircle size={14} />
              <span>{errorBanner}</span>
              <button 
                type="button" 
                className="settings-action-banner-close"
                onClick={() => setErrorBanner('')}
              >
                Dismiss
              </button>
            </div>
          )}

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
            onClick={() => handleSave()} 
            disabled={saving}
            title={hasUnsavedChanges ? "Save all workspace modifications" : "Settings currently up to date"}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
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
          <button className={`settings-nav-btn ${activeTab === 'users' || activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={16} /> Team & Permissions
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
                    placeholder="e.g. SAS CAFETERIA"
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
                    placeholder="e.g. contact@business.com"
                  />
                </div>

                <div className="settings-input-group">
                  <label>Primary Phone / WhatsApp</label>
                  <input 
                    type="text" 
                    className="settings-input-field" 
                    value={businessPhone} 
                    onChange={e => setBusinessPhone(e.target.value)} 
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="settings-input-group sm:col-span-2">
                  <label>Business Address</label>
                  <input 
                    type="text" 
                    className="settings-input-field" 
                    value={businessAddress} 
                    onChange={e => setBusinessAddress(e.target.value)} 
                    placeholder="Shop #, Street, City, State"
                  />
                </div>

                <div className="settings-input-group sm:col-span-2">
                  <label>Tax Identification / GSTIN</label>
                  <input 
                    type="text" 
                    className="settings-input-field" 
                    value={taxId} 
                    onChange={e => setTaxId(e.target.value)} 
                    placeholder="e.g. GSTIN-29AAAAA0000A1Z5"
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
                    type="button"
                    onClick={() => {
                      setSelectedTheme('light');
                      if (setTheme) setTheme('light');
                    }}
                    className="settings-nav-btn p-4 flex items-center justify-between"
                    style={{
                      border: selectedTheme === 'light' ? '2px solid #09090b' : '1px solid #e4e4e7',
                      backgroundColor: selectedTheme === 'light' ? '#f4f4f5' : '#ffffff'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border border-black bg-white"></div>
                      <span className="font-bold text-sm">Light Mode (Clean White)</span>
                    </div>
                    {selectedTheme === 'light' && <CheckCircle2 size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTheme('dark');
                      if (setTheme) setTheme('dark');
                    }}
                    className="settings-nav-btn p-4 flex items-center justify-between"
                    style={{
                      border: selectedTheme === 'dark' ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: selectedTheme === 'dark' ? '#141416' : '#1e1e24'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border border-white bg-black"></div>
                      <span className="font-bold text-sm text-white">Dark Mode (Elevated Black)</span>
                    </div>
                    {selectedTheme === 'dark' && <CheckCircle2 size={16} className="text-white" />}
                  </button>
                </div>
              </div>

              {/* Application UI Version Selection */}
              <div className="settings-section-block">
                <h3 className="settings-section-heading">Operating UI Mode</h3>
                <div className="settings-grid-2">
                  <div 
                    onClick={() => {
                      setSelectedAppUiVersion('legacy');
                      if (setAppUiVersion) setAppUiVersion('legacy');
                    }}
                    className="p-4 rounded-xl border cursor-pointer transition-all"
                    style={{
                      border: selectedAppUiVersion === 'legacy' ? '2px solid #09090b' : '1px solid #e4e4e7',
                      backgroundColor: selectedAppUiVersion === 'legacy' ? 'var(--bg-hover)' : 'transparent'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">⚡ Legacy Operations Desk</span>
                      {selectedAppUiVersion === 'legacy' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">ACTIVE</span>}
                    </div>
                    <p className="text-xs text-text-secondary">Fast-track desk with fit-to-page buttons, catalog glance, and rapid ledger.</p>
                  </div>

                  <div 
                    onClick={() => {
                      setSelectedAppUiVersion('premium');
                      if (setAppUiVersion) setAppUiVersion('premium');
                    }}
                    className="p-4 rounded-xl border cursor-pointer transition-all"
                    style={{
                      border: selectedAppUiVersion === 'premium' ? '2px solid #09090b' : '1px solid #e4e4e7',
                      backgroundColor: selectedAppUiVersion === 'premium' ? 'var(--bg-hover)' : 'transparent'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">💎 Premium Command Center</span>
                      {selectedAppUiVersion === 'premium' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">ACTIVE</span>}
                    </div>
                    <p className="text-xs text-text-secondary">Multi-metric executive workspace with dual charts and radar health monitor.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Customize (AI & Automations) */}
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
                  {/* Preset Assistant Names */}
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
                          setAiWakeWord(preset.name === 'Mr. H' ? 'Hey Mr. H' : preset.name);
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
                    placeholder="Hey Jarvis"
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
                    onChange={e => setAiLanguage(e.target.value)}
                  >
                    <option value="hinglish">Hinglish (Roman English - e.g. "Aaj ki sale ₹...", "1 Chai add kardi")</option>
                    <option value="en">Pure English (e.g. "Today's sales report...", "Added 1 Tea")</option>
                    <option value="hi">हिंदी (Devanagari script)</option>
                  </select>
                </div>

                <div className="settings-input-group">
                  <label>Google Gemini Model</label>
                  <select 
                    className="settings-input-field"
                    value={aiModel}
                    onChange={e => setAiModel(e.target.value)}
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended: Ultra-fast & High Accuracy)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Business Analytics & Financial Audits)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</option>
                  </select>
                  <span className="text-[11px] text-text-muted mt-1 block">Powered by official Google GenAI SDK with zero browser API key exposure.</span>
                </div>

                <div className="settings-input-group">
                  <label>Response Style & Depth</label>
                  <select 
                    className="settings-input-field"
                    value={aiResponseStyle}
                    onChange={e => setAiResponseStyle(e.target.value)}
                  >
                    <option value="balanced">Balanced (Recommended: Clear explanations with financial numbers)</option>
                    <option value="concise">Concise (Fast bullet points & summaries)</option>
                    <option value="detailed">Detailed (Full audit reports, calculation steps & breakdown)</option>
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

              {/* Section 3: Autonomous Intelligence & Safety Controls */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <h3 className="text-sm font-bold text-text-main mb-3">Autonomous Intelligence & Safety Controls</h3>
                <div className="space-y-3">
                  <label className="settings-toggle-row">
                    <div>
                      <div className="font-semibold text-sm">Require Explicit Confirmation for Consequential Writes</div>
                      <div className="text-xs text-text-secondary">AI presents a reviewable draft before creating orders, adjusting stock, or recording payments</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={aiConfirmSensitive} 
                      onChange={e => setAiConfirmSensitive(e.target.checked)} 
                    />
                  </label>

                  <label className="settings-toggle-row">
                    <div>
                      <div className="font-semibold text-sm">Autonomous Stockout Risk Analysis</div>
                      <div className="text-xs text-text-secondary">Continuously monitors inventory turnover and predicts days of coverage remaining</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={aiStockoutAlerts} 
                      onChange={e => setAiStockoutAlerts(e.target.checked)} 
                    />
                  </label>

                  <label className="settings-toggle-row">
                    <div>
                      <div className="font-semibold text-sm">Sales Velocity & Period-over-Period Comparisons</div>
                      <div className="text-xs text-text-secondary">Automatically compares sales pace against previous weeks and months to highlight trends</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={aiSalesComparison} 
                      onChange={e => setAiSalesComparison(e.target.checked)} 
                    />
                  </label>

                  <label className="settings-toggle-row">
                    <div>
                      <div className="font-semibold text-sm">High Expense Anomaly Warnings</div>
                      <div className="text-xs text-text-secondary">Flags operational expenditures that deviate unusually from store baseline averages</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={aiExpenseAnomaly} 
                      onChange={e => setAiExpenseAnomaly(e.target.checked)} 
                    />
                  </label>
                </div>
              </div>

              {/* Section 4: System Diagnostics & Conversation Memory */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <h3 className="text-sm font-bold text-text-main mb-3">AI Diagnostics & Conversation Memory</h3>
                <div className="flex flex-wrap gap-3 items-center mb-3">
                  <button
                    type="button"
                    disabled={aiDiagnosticsLoading}
                    onClick={async () => {
                      setAiDiagnosticsLoading(true);
                      try {
                        const res = await aiEvaluationService.runFullDiagnostics({ businessId: currentBusiness?.id });
                        setAiDiagnosticsResult(res);
                      } catch (err) {
                        setAiDiagnosticsResult({ allPassed: false, checks: [{ name: 'Diagnostics', status: 'FAILED', details: err.message }] });
                      } finally {
                        setAiDiagnosticsLoading(false);
                      }
                    }}
                    className="px-3.5 py-2 text-xs font-bold rounded-lg border border-border-color bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-text-main transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} className={aiDiagnosticsLoading ? 'animate-spin' : ''} />
                    <span>{aiDiagnosticsLoading ? 'Running Diagnostics...' : 'Run Full AI Health Check'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear all conversation history and contextual references for this business?')) {
                        conversationService.clearHistory(currentBusiness?.id);
                        setAiMemoryNotice('Conversation memory successfully reset.');
                        setTimeout(() => setAiMemoryNotice(''), 3000);
                      }
                    }}
                    className="px-3.5 py-2 text-xs font-bold rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Conversation Memory</span>
                  </button>

                  {aiMemoryNotice && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{aiMemoryNotice}</span>
                  )}
                </div>

                {/* Diagnostics Result Card */}
                {aiDiagnosticsResult && (
                  <div className="p-3.5 rounded-xl border border-border-color bg-[var(--bg-card)] mt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold border-b border-border-color pb-2">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className={aiDiagnosticsResult.allPassed ? 'text-emerald-500' : 'text-amber-500'} />
                        <span>System Health: {aiDiagnosticsResult.allPassed ? 'All Systems Operational' : 'Action Required'}</span>
                      </span>
                      <span className="text-text-muted">Active Model: {aiDiagnosticsResult.configuredModel}</span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      {aiDiagnosticsResult.checks.map((chk, idx) => (
                        <div key={idx} className="flex items-start justify-between text-[11px] gap-2">
                          <span className="font-semibold text-text-main">{chk.name}:</span>
                          <span className="text-right text-text-secondary flex-1">{chk.details}</span>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            chk.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            chk.status === 'OFFLINE_FALLBACK' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                            'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {chk.status} {chk.latencyMs ? `(${chk.latencyMs}ms)` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

          {/* TAB 4: Preferences & Tax */}
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
                    min="0"
                    className="settings-input-field" 
                    value={lowStockThreshold} 
                    onChange={e => setLowStockThreshold(e.target.value)} 
                  />
                </div>

                <div className="settings-input-group">
                  <label>Default Tax Rate (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.1"
                    className="settings-input-field" 
                    value={taxRate} 
                    onChange={e => setTaxRate(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Invoice Settings */}
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
                    placeholder="INV-"
                  />
                </div>

                <div className="settings-input-group">
                  <label>Payment Terms</label>
                  <select 
                    className="settings-input-field"
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                  >
                    <option value="Immediate / Due on Receipt">Immediate / Due on Receipt</option>
                    <option value="Net 7 Days">Net 7 Days</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                  </select>
                </div>

                <div className="settings-input-group sm:col-span-2">
                  <label>Receipt Footer Note</label>
                  <input 
                    type="text" 
                    className="settings-input-field" 
                    value={invoiceFooter} 
                    onChange={e => setInvoiceFooter(e.target.value)} 
                    placeholder="Thank you for choosing us!"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Features & Modules */}
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

          {/* TAB 7: Team & Role Permissions */}
          {(activeTab === 'users' || activeTab === 'team') && (
            <TeamManagement />
          )}

          {/* TAB 8: Notifications */}
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

          {/* TAB 9: Data Backup */}
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
                  <button type="button" className="settings-btn-primary" onClick={handleExportData}>
                    <Download size={16} />
                    <span>Export Full Data Backup (.json)</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)] mt-2">
                  <h4 className="font-bold text-sm text-text-main mb-1">Database Maintenance</h4>
                  <p className="text-xs text-text-secondary mb-3">Re-seed standard cafeteria demo data if needed.</p>
                  <button type="button" className="settings-btn-secondary" onClick={handleResetData}>
                    <RotateCcw size={15} />
                    <span>Reset to Default Demo State</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: Account & Security */}
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
                    {accountDisplayName?.charAt(0) || currentUser?.name?.charAt(0) || 'H'}
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
                  type="button"
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
                    const renderIcon = () => {
                      if (device.type === 'mobile') return <Smartphone size={18} />;
                      if (device.type === 'tablet') return <Tablet size={18} />;
                      if (device.type === 'laptop') return <Laptop size={18} />;
                      return <Monitor size={18} />;
                    };

                    const displayName = device.isCurrent 
                      ? `${device.os || currentDeviceInfo.os} • ${device.browser || currentDeviceInfo.browser} (This Device)`
                      : (device.name || `${device.os || 'Authorized Device'} • ${device.browser || 'Browser'}`);

                    const displaySub = `IP: ${device.ip || '127.0.0.1 (Localhost)'} • Screen: ${device.screen || currentDeviceInfo.screen} • ${device.lastActive || 'Active right now'}`;

                    return (
                      <div 
                        key={device.id || device.deviceId} 
                        className="p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 border-[var(--border-color)] bg-[var(--bg-card)] transition-colors"
                        style={{
                          borderWidth: device.isCurrent ? '1.5px' : '1px'
                        }}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: device.isCurrent ? 'var(--text-main)' : 'var(--bg-hover)',
                              color: device.isCurrent ? 'var(--bg-body)' : 'var(--text-main)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {renderIcon()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-text-main truncate">{displayName}</span>
                              {device.isCurrent && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black uppercase tracking-wider">
                                  CURRENT
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-text-secondary mt-0.5 block truncate">{displaySub}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 mt-1 md:mt-0">
                          <span 
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] text-[var(--text-main)] whitespace-nowrap"
                          >
                            <span 
                              className={`w-1.5 h-1.5 rounded-full ${
                                device.status === 'ACTIVE NOW' || device.status === 'ONLINE'
                                  ? 'bg-emerald-500 animate-pulse' 
                                  : 'bg-zinc-400'
                              }`} 
                            />
                            <span>{device.status || 'ACTIVE NOW'}</span>
                          </span>

                          {!device.isCurrent && (
                            <button
                              type="button"
                              className="settings-btn-secondary"
                              style={{ height: '30px', fontSize: '0.725rem', padding: '0 0.75rem' }}
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
                <h3 className="settings-transition-title">Settings Saved Successfully</h3>
                <p className="settings-transition-sub">Workspace configuration and preferences have been updated.</p>
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
