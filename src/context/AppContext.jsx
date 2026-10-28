import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from '../services/databaseService';
import { localDb } from '../services/localDb';
import { initializeDemoData } from '../services/demoData';
import { hasPermission, normalizeRole } from '../utils/permissions';

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
          // Keep active session alive from localStorage
          const savedUser = localStorage.getItem('karobaar_session_user');
          const savedBiz = localStorage.getItem('karobaar_session_business');
          if (savedUser) {
            try {
              setCurrentUser(JSON.parse(savedUser));
              if (savedBiz) {
                setCurrentBusiness(JSON.parse(savedBiz));
              } else {
                setCurrentBusiness(DEFAULT_BUSINESS);
              }
              setAuthStatus('authenticated');
            } catch (e) {
              launchReadyToUseWorkspace();
            }
          } else {
            launchReadyToUseWorkspace();
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = (forcedMode) => {
    let next;
    if (forcedMode === 'dark' || forcedMode === 'light') {
      next = forcedMode;
    } else {
      next = theme === 'dark' ? 'light' : 'dark';
    }

    // 1. Synchronously update DOM attributes & classes for 0ms visual responsiveness
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }

    // 2. Persist to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('karobaar-theme', next);
    }

    // 3. Update React theme state
    setTheme(next);

    // 4. Update current business settings in memory & DB
    if (currentBusiness?.id) {
      setCurrentBusiness(prev => prev ? ({
        ...prev,
        settings: {
          ...(prev.settings || {}),
          theme: next
        }
      }) : prev);

      db.update('businesses', currentBusiness.id, {
        settings: {
          ...(currentBusiness.settings || {}),
          theme: next
        }
      }).catch(() => {});
    }

    // 5. Broadcast custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('karobaar_theme_changed', { detail: { theme: next } }));
    }
  };
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const switchBranch = async (businessId) => {
    const newBiz = userBusinesses.find(b => b.id === businessId);
    if (newBiz && currentUser) {
      localStorage.setItem('karobaar-active-business', businessId);
      
      // Resolve user's role in the target business
      let resolvedRole = 'Owner';
      let resolvedPermissions = [];
      try {
        if (newBiz.ownerId && newBiz.ownerId !== currentUser.id) {
          const memberRecord = await db.getById('members', currentUser.id, businessId);
          if (memberRecord) {
            resolvedRole = memberRecord.role || 'Cashier';
            resolvedPermissions = memberRecord.permissions || [];
          } else {
            resolvedRole = 'Cashier';
          }
        }
      } catch (e) {}

      const updatedUser = {
        ...currentUser,
        activeBusinessId: businessId,
        role: resolvedRole,
        permissions: resolvedPermissions
      };

      setCurrentBusiness(newBiz);
      setCurrentUser(updatedUser);

      try {
        localStorage.setItem('karobaar_session_user', JSON.stringify(updatedUser));
        localStorage.setItem('karobaar_session_business', JSON.stringify(newBiz));
      } catch (e) {}

      window.location.hash = '#/dashboard';
      window.location.reload();
    }
  };

  const createNewBusiness = async (businessData) => {
    try {
      const created = await db.createNewBusiness(businessData, currentUser);
      const updatedBusinesses = [...userBusinesses, created];
      setUserBusinesses(updatedBusinesses);
      try {
        localStorage.setItem('karobaar_session_businesses', JSON.stringify(updatedBusinesses));
      } catch (e) {}
      await switchBranch(created.id);
      return created;
    } catch (e) {
      console.error("Create business error:", e);
      throw e;
    }
  };

  const joinBusinessWithCode = async (inviteCode) => {
    try {
      const result = await db.acceptInvitation(inviteCode, currentUser);
      if (result && result.businessId) {
        const joinedBiz = await db.getById('businesses', result.businessId);
        if (joinedBiz) {
          const updatedBusinesses = [...userBusinesses.filter(b => b.id !== joinedBiz.id), joinedBiz];
          setUserBusinesses(updatedBusinesses);
          try {
            localStorage.setItem('karobaar_session_businesses', JSON.stringify(updatedBusinesses));
          } catch (e) {}
          await switchBranch(joinedBiz.id);
          return joinedBiz;
        }
      }
      return result;
    } catch (e) {
      console.error("Join business error:", e);
      throw e;
    }
  };

  const hasUserPermission = useCallback((permissionKey) => {
    return hasPermission(currentUser, permissionKey, currentUser?.permissions);
  }, [currentUser]);

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

  const refreshBusinessProfile = useCallback(async (businessId = null) => {
    const targetId = businessId || currentBusiness?.id || currentUser?.activeBusinessId || localStorage.getItem('karobaar-active-business') || 'demo-business-1';
    try {
      const freshBiz = await db.getById('businesses', targetId);
      if (freshBiz) {
        setCurrentBusiness(freshBiz);
        setUserBusinesses(prev => {
          const list = prev || [];
          const idx = list.findIndex(b => b.id === targetId);
          if (idx !== -1) {
            const next = [...list];
            next[idx] = freshBiz;
            return next;
          }
          return [...list, freshBiz];
        });
        try {
          localStorage.setItem('karobaar_session_business', JSON.stringify(freshBiz));
          localStorage.setItem('karobaar-active-business', targetId);
        } catch (e) {}
        return freshBiz;
      }
    } catch (e) {
      console.warn("Failed to refresh business profile:", e);
    }
    return currentBusiness;
  }, [currentBusiness, currentUser]);

  const updateCurrentBusiness = useCallback(async (updates) => {
    const targetId = currentBusiness?.id || currentUser?.activeBusinessId || localStorage.getItem('karobaar-active-business') || 'demo-business-1';
    try {
      const existing = (await db.getById('businesses', targetId)) || currentBusiness || {};
      const merged = {
        ...existing,
        ...updates,
        settings: {
          ...(existing.settings || {}),
          ...(updates.settings || {})
        },
        modules: {
          ...(existing.modules || {}),
          ...(updates.modules || {})
        },
        updatedAt: new Date().toISOString()
      };
      
      await db.update('businesses', targetId, merged);
      
      setCurrentBusiness(merged);
      setUserBusinesses(prev => {
        const list = prev || [];
        const idx = list.findIndex(b => b.id === targetId);
        if (idx !== -1) {
          const next = [...list];
          next[idx] = merged;
          return next;
        }
        return [...list, merged];
      });

      try {
        localStorage.setItem('karobaar_session_business', JSON.stringify(merged));
        localStorage.setItem('karobaar-active-business', targetId);
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('karobaar_business_updated', { detail: { business: merged } }));
      return merged;
    } catch (e) {
      console.error("Failed to update current business:", e);
      throw e;
    }
  }, [currentBusiness, currentUser]);

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
      createNewBusiness,
      joinBusinessWithCode,
      hasUserPermission,
      refreshUserProfile,
      refreshBusinessProfile,
      updateCurrentBusiness,
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
