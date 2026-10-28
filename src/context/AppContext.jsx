import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from '../services/databaseService';
import { localDb } from '../services/localDb';
import { initializeDemoData } from '../services/demoData';

const AppContext = createContext();

export const DEFAULT_BUSINESS = {
  id: 'demo-business-1',
  name: 'SAS CAFETERIA',
  currency: 'INR',
  category: 'Cafeteria & Restaurant',
  address: '123 Commercial Plaza, Main Street',
  phone: '+91 98765 00000',
  settings: {
    currency: 'INR',
    theme: 'light',
    taxRate: 5
  },
  modules: {
    pos: true,
    inventory: true,
    orders: true,
    customers: true,
    expenses: true,
    suppliers: true,
    reports: true,
    employees: true,
    invoices: true
  }
};

export const DEFAULT_USER = {
  id: 'demo-user-1',
  name: 'SAS Cafeteria Owner',
  email: 'owner@sascafeteria.com',
  role: 'Owner',
  activeBusinessId: 'demo-business-1',
  memberships: ['demo-business-1'],
  onboardingCompleted: true
};

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('karobaar-theme') || 'light');
  const [accent, setAccent] = useState(() => localStorage.getItem('karobaar-accent') || 'default');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appUiVersion, setAppUiVersion] = useState(() => localStorage.getItem('karobaar-ui-version') || 'v2');
  
  // Instant Launch: Default directly to ready-to-use SAS CAFETERIA workspace
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const wasLoggedOut = localStorage.getItem('karobaar_explicit_logout') === 'true';
      if (wasLoggedOut) return null;
      const u = localStorage.getItem('karobaar_session_user');
      return u ? JSON.parse(u) : DEFAULT_USER;
    } catch (e) { return DEFAULT_USER; }
  });

  const [currentBusiness, setCurrentBusiness] = useState(() => {
    try {
      const wasLoggedOut = localStorage.getItem('karobaar_explicit_logout') === 'true';
      if (wasLoggedOut) return null;
      const b = localStorage.getItem('karobaar_session_business');
      return b ? JSON.parse(b) : DEFAULT_BUSINESS;
    } catch (e) { return DEFAULT_BUSINESS; }
  });

  const [userBusinesses, setUserBusinesses] = useState(() => {
    try {
      const wasLoggedOut = localStorage.getItem('karobaar_explicit_logout') === 'true';
      if (wasLoggedOut) return [];
      const bs = localStorage.getItem('karobaar_session_businesses');
      return bs ? JSON.parse(bs) : [DEFAULT_BUSINESS];
    } catch (e) { return [DEFAULT_BUSINESS]; }
  });

  const [authStatus, setAuthStatus] = useState(() => {
    try {
      const wasLoggedOut = localStorage.getItem('karobaar_explicit_logout') === 'true';
      if (wasLoggedOut) return 'unauthenticated';
      return 'authenticated'; // Instant launch into dashboard!
    } catch (e) { return 'authenticated'; }
  });

  const [authError, setAuthError] = useState('');

  const userRole = currentUser?.role || 'Owner';

  // Seed demo data asynchronously in background without blocking screen render
  useEffect(() => {
    initializeDemoData('demo-business-1').catch(e => console.warn("Background demo init:", e));
  }, []);

  // Apply Theme with high-contrast HTML & Body classes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('karobaar-theme', theme);
  }, [theme]);

  // Apply Accent
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('karobaar-accent', accent);
  }, [accent]);

  // Apply UI Version
  useEffect(() => {
    localStorage.setItem('karobaar-ui-version', appUiVersion);
  }, [appUiVersion]);

  // Apply Business Theme/Settings if available and no local override exists
  useEffect(() => {
    const localTheme = localStorage.getItem('karobaar-theme');
    if (!localTheme && currentBusiness?.settings?.theme) {
      setTheme(currentBusiness.settings.theme);
    }
    if (currentBusiness?.settings?.accent) {
      setAccent(currentBusiness.settings.accent);
    }
    if (currentBusiness?.settings?.appUiVersion) {
      setAppUiVersion(currentBusiness.settings.appUiVersion);
    }
  }, [currentBusiness]);

  // Helper: Instantly provisions and logs into the ready-to-use business workspace
  const launchReadyToUseWorkspace = async () => {
    const businessId = 'demo-business-1';
    try {
      initializeDemoData(businessId).catch(() => {});
    } catch (e) {}

    try {
      localStorage.removeItem('karobaar_explicit_logout');
      localStorage.setItem('karobaar_session_user', JSON.stringify(DEFAULT_USER));
      localStorage.setItem('karobaar_session_business', JSON.stringify(DEFAULT_BUSINESS));
      localStorage.setItem('karobaar_session_businesses', JSON.stringify([DEFAULT_BUSINESS]));
      localStorage.setItem('karobaar-active-business', businessId);
    } catch (e) {}

    setCurrentUser(DEFAULT_USER);
    setCurrentBusiness(DEFAULT_BUSINESS);
    setUserBusinesses([DEFAULT_BUSINESS]);
    setAuthStatus('authenticated');
  };

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthError('');
      if (firebaseUser) {
        console.log(`[AUTH] Authenticated UID: ${firebaseUser.uid}`);
        try {
          const karobaarUser = await db.getUserByFirebaseUid(firebaseUser.uid);
          if (karobaarUser && karobaarUser.memberships && karobaarUser.memberships.length > 0) {
            const bizPromises = karobaarUser.memberships.map(id => db.getById('businesses', id));
            const businessesData = (await Promise.all(bizPromises)).filter(Boolean);
            setUserBusinesses(businessesData);
            
            let activeId = localStorage.getItem('karobaar-active-business') || karobaarUser.memberships[0];
            const activeBusinessData = businessesData.find(b => b.id === activeId) || businessesData[0];
            if (activeBusinessData) {
              setCurrentBusiness(activeBusinessData);
              const userObj = { ...karobaarUser, activeBusinessId: activeBusinessData.id };
              setCurrentUser(userObj);
              try {
                localStorage.setItem('karobaar_session_user', JSON.stringify(userObj));
                localStorage.setItem('karobaar_session_business', JSON.stringify(activeBusinessData));
                localStorage.setItem('karobaar_session_businesses', JSON.stringify(businessesData));
              } catch (e) {}
              setAuthStatus('authenticated');
            } else {
              setAuthStatus('pending_onboarding');
            }
          }
        } catch (error) {
          console.warn("[AUTH] Cloud profile check note:", error);
        }
      } else {
        const wasLoggedOut = localStorage.getItem('karobaar_explicit_logout') === 'true';
        if (wasLoggedOut) {
          setCurrentUser(null);
          setCurrentBusiness(null);
          setUserBusinesses([]);
          setAuthStatus('unauthenticated');
        } else {
          // Keep active session alive
          if (!currentUser || !currentBusiness) {
            launchReadyToUseWorkspace();
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = (forcedMode) => {
    setTheme(prev => {
      const next = (forcedMode === 'dark' || forcedMode === 'light') 
        ? forcedMode 
        : (prev === 'light' ? 'dark' : 'light');
      
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('karobaar-theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }

      if (currentBusiness?.id) {
        db.update('businesses', currentBusiness.id, {
          settings: {
            ...(currentBusiness.settings || {}),
            theme: next
          }
        }).catch(() => {});
      }

      return next;
    });
  };
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const switchBranch = (businessId) => {
    const newBiz = userBusinesses.find(b => b.id === businessId);
    if (newBiz && currentUser) {
      localStorage.setItem('karobaar-active-business', businessId);
      setCurrentBusiness(newBiz);
      setCurrentUser({
        ...currentUser,
        activeBusinessId: businessId
      });
      window.location.hash = '#/dashboard';
      window.location.reload();
    }
  };

  const refreshUserProfile = async () => {
    if (currentUser?.id) {
      try {
        const updated = await db.getById('users', currentUser.id);
        if (updated) {
          setCurrentUser(prev => ({ ...prev, ...updated }));
          try {
            localStorage.setItem('karobaar_session_user', JSON.stringify({ ...currentUser, ...updated }));
          } catch (e) {}
        }
      } catch (e) {}
    }
  };

  const logout = async () => {
    try {
      localStorage.setItem('karobaar_explicit_logout', 'true');
      localStorage.removeItem('karobaar_session_user');
      localStorage.removeItem('karobaar_session_business');
      localStorage.removeItem('karobaar_session_businesses');
      localStorage.removeItem('karobaar-active-business');
    } catch (e) {}
    
    setCurrentUser(null);
    setCurrentBusiness(null);
    setUserBusinesses([]);
    setAuthStatus('unauthenticated');

    try {
      await signOut(auth);
    } catch (e) {}
  };

  return (
    <AppContext.Provider value={{
      theme,
      setTheme,
      accent,
      setAccent,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      toggleTheme,
      currentUser,
      setCurrentUser,
      currentBusiness,
      setCurrentBusiness,
      userBusinesses,
      setUserBusinesses,
      userRole,
      authStatus,
      setAuthStatus,
      authError,
      setAuthError,
      logout,
      switchBranch,
      refreshUserProfile,
      launchReadyToUseWorkspace,
      appUiVersion,
      setAppUiVersion
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
