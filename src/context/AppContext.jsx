import { isDebugBuild, DEFAULT_DEBUG_USER, DEFAULT_DEBUG_BUSINESS } from '../utils/buildMode';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from '../services/databaseService';
import { localDb } from '../services/localDb';
import { initializeDemoData, DEMO_SHOWCASE_BUSINESS, DEMO_SHOWCASE_USER, resetDemoWorkspace } from '../services/demoData';
import { hasPermission, normalizeRole } from '../utils/permissions';

const AppContext = createContext();

export { DEMO_SHOWCASE_BUSINESS, DEMO_SHOWCASE_USER, resetDemoWorkspace };

export const DEFAULT_BUSINESS = {
  id: 'biz-default',
  name: 'My Store',
  currency: 'INR',
  category: 'General Store & Services',
  address: '',
  phone: '',
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
  id: 'user-default',
  name: 'Store Owner',
  email: 'owner@karobaar.app',
  role: 'Owner',
  activeBusinessId: 'biz-default',
  memberships: ['biz-default'],
  onboardingCompleted: true
};

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('karobaar-theme') || 'light');
  const [accent, setAccent] = useState(() => localStorage.getItem('karobaar-accent') || 'default');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appUiVersion, setAppUiVersion] = useState(() => localStorage.getItem('karobaar-ui-version') || 'v2');
  
  // Sign Out Warning Modal State
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const requestSignOut = useCallback(() => setIsSignOutModalOpen(true), []);
  const closeSignOutModal = useCallback(() => setIsSignOutModalOpen(false), []);

  // Demo Restriction Modal State
  const [isDemoRestrictedModalOpen, setIsDemoRestrictedModalOpen] = useState(false);
  const [demoRestrictedFeatureName, setDemoRestrictedFeatureName] = useState('');

  // Session State: In debug builds, automatically bypass login and go straight to dashboard
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      if (isDebugBuild()) {
        try { localStorage.removeItem('karobaar_explicit_logout'); } catch (_) {}
      }
      const wasLoggedOut = !isDebugBuild() && localStorage.getItem('karobaar_explicit_logout') === 'true';
      if (wasLoggedOut) return null;
      const u = localStorage.getItem('karobaar_session_user');
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed?.name !== 'SAS Cafeteria Owner' && !parsed?.email?.includes('sascafeteria')) {
          return parsed;
        }
      }
      if (isDebugBuild()) {
        try { localStorage.setItem('karobaar_session_user', JSON.stringify(DEFAULT_DEBUG_USER)); } catch (_) {}
        return DEFAULT_DEBUG_USER;
      }
      return null;
    } catch (e) { 
      return isDebugBuild() ? DEFAULT_DEBUG_USER : null; 
    }
  });

  const [currentBusiness, setCurrentBusiness] = useState(() => {
    try {
      const wasLoggedOut = !isDebugBuild() && localStorage.getItem('karobaar_explicit_logout') === 'true';
      if (wasLoggedOut) return null;
      const b = localStorage.getItem('karobaar_session_business');
      if (b) {
        const parsed = JSON.parse(b);
        if (parsed?.name && !parsed.name.toLowerCase().includes('cafeteria')) {
          return parsed;
        }
      }
      // Auto-heal from localDb
      const activeBizId = localStorage.getItem('karobaar-active-business');
      const allLocal = localDb.getAll('businesses') || [];
      if (activeBizId) {
        const found = allLocal.find(x => x && x.id === activeBizId && !String(x.id).startsWith('demo-'));
        if (found) {
          localStorage.setItem('karobaar_session_business', JSON.stringify(found));
          return found;
        }
      }
      const sasBiz = allLocal.find(x => x && (x.id === 'biz-sas-and-sons' || x.name === 'SAS AND SONS'));
      if (sasBiz) {
        localStorage.setItem('karobaar_session_business', JSON.stringify(sasBiz));
        localStorage.setItem('karobaar-active-business', sasBiz.id);
        return sasBiz;
      }
      const realBiz = allLocal.find(x => x && !String(x.id).startsWith('demo-') && !String(x.id).includes('demo') && x.name && x.name !== 'My Business' && x.name !== 'My Store');
      if (realBiz) {
        localStorage.setItem('karobaar_session_business', JSON.stringify(realBiz));
        localStorage.setItem('karobaar-active-business', realBiz.id);
        return realBiz;
      }
      if (isDebugBuild()) {
        try {
          localStorage.setItem('karobaar_session_business', JSON.stringify(DEFAULT_DEBUG_BUSINESS));
          localStorage.setItem('karobaar-active-business', DEFAULT_DEBUG_BUSINESS.id);
        } catch (_) {}
        return DEFAULT_DEBUG_BUSINESS;
      }
      return null;
    } catch (e) { 
      return isDebugBuild() ? DEFAULT_DEBUG_BUSINESS : null; 
    }
  });

  const [userBusinesses, setUserBusinesses] = useState(() => {
    try {
      const wasLoggedOut = !isDebugBuild() && localStorage.getItem('karobaar_explicit_logout') === 'true';
      if (wasLoggedOut) return [];
      const bs = localStorage.getItem('karobaar_session_businesses');
      if (bs) {
        const parsed = JSON.parse(bs);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const allLocal = localDb.getAll('businesses') || [];
      const real = allLocal.filter(x => x && !String(x.id).startsWith('demo-') && !String(x.id).includes('demo') && x.name && x.name !== 'My Business' && x.name !== 'My Store');
      if (real.length > 0) {
        localStorage.setItem('karobaar_session_businesses', JSON.stringify(real));
        return real;
      }
      if (isDebugBuild()) {
        try { localStorage.setItem('karobaar_session_businesses', JSON.stringify([DEFAULT_DEBUG_BUSINESS])); } catch (_) {}
        return [DEFAULT_DEBUG_BUSINESS];
      }
      return [];
    } catch (e) { 
      return isDebugBuild() ? [DEFAULT_DEBUG_BUSINESS] : []; 
    }
  });

  const [authStatus, setAuthStatus] = useState(() => {
    if (isDebugBuild()) {
      return 'authenticated';
    }
    try {
      const wasLoggedOut = localStorage.getItem('karobaar_explicit_logout') === 'true';
      if (wasLoggedOut) return 'unauthenticated';
      const u = localStorage.getItem('karobaar_session_user');
      return u ? 'authenticated' : 'unauthenticated';
    } catch (e) { return 'unauthenticated'; }
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

  // Helper: Instantly launches the dedicated DEMO SHOWCASE workspace
  const launchDemoWorkspace = async (role = 'Owner') => {
    const businessId = 'karobaar-demo-store';
    try {
      await initializeDemoData(businessId);
    } catch (e) {}

    const demoUser = {
      ...DEMO_SHOWCASE_USER,
      name: `Karobaar Demo (${role})`,
      role: role,
      email: `${role.toLowerCase().replace(/\s+/g, '')}@karobaar-demo.app`
    };

    try {
      localStorage.removeItem('karobaar_explicit_logout');
      localStorage.setItem('karobaar_session_user', JSON.stringify(demoUser));
      localStorage.setItem('karobaar_session_business', JSON.stringify(DEMO_SHOWCASE_BUSINESS));
      localStorage.setItem('karobaar_session_businesses', JSON.stringify([DEMO_SHOWCASE_BUSINESS]));
      localStorage.setItem('karobaar-active-business', businessId);
      localStorage.setItem('karobaar_is_demo_mode', 'true');
    } catch (e) {}

    setCurrentUser(demoUser);
    setCurrentBusiness(DEMO_SHOWCASE_BUSINESS);
    setUserBusinesses([DEMO_SHOWCASE_BUSINESS]);
    setAuthStatus('authenticated');
  };

  const exitDemoWorkspace = async () => {
    try {
      localStorage.removeItem('karobaar_is_demo_mode');
      localStorage.removeItem('karobaar_session_user');
      localStorage.removeItem('karobaar_session_business');
      localStorage.removeItem('karobaar_session_businesses');
      localStorage.setItem('karobaar_explicit_logout', 'true');
    } catch (e) {}
    setCurrentUser(null);
    setCurrentBusiness(null);
    setUserBusinesses([]);
    setAuthStatus('unauthenticated');
  };

  // Demo Mode check & Guard: blocks operations in preview demo mode
  const isDemoMode = Boolean(
    (typeof localStorage !== 'undefined' && localStorage.getItem('karobaar_is_demo_mode') === 'true') ||
    currentBusiness?.isDemo ||
    currentBusiness?.id === 'karobaar-demo-store' ||
    currentUser?.isDemo ||
    currentUser?.email === 'demo@karobaar.app'
  );

  const requireAuthAndSetup = useCallback((featureName = 'this feature') => {
    const isDemo = Boolean(
      (typeof localStorage !== 'undefined' && localStorage.getItem('karobaar_is_demo_mode') === 'true') ||
      currentBusiness?.isDemo ||
      currentBusiness?.id === 'karobaar-demo-store' ||
      currentUser?.isDemo ||
      currentUser?.email === 'demo@karobaar.app'
    );

    if (isDemo) {
      setDemoRestrictedFeatureName(featureName);
      setIsDemoRestrictedModalOpen(true);
      return true; // blocked
    }
    return false; // allowed
  }, [currentBusiness, currentUser]);

  const closeDemoRestrictedModal = useCallback(() => {
    setIsDemoRestrictedModalOpen(false);
    setDemoRestrictedFeatureName('');
  }, []);

  // Helper: Instantly provisions and logs into a clean, ready-to-use business workspace
  const launchReadyToUseWorkspace = async (customUser = null, customBiz = null) => {
    const user = customUser || DEFAULT_USER;
    const biz = customBiz || DEFAULT_BUSINESS;
    const businessId = biz.id || 'biz-default';

    try {
      localStorage.removeItem('karobaar_explicit_logout');
      localStorage.setItem('karobaar_session_user', JSON.stringify(user));
      localStorage.setItem('karobaar_session_business', JSON.stringify(biz));
      localStorage.setItem('karobaar_session_businesses', JSON.stringify([biz]));
      localStorage.setItem('karobaar-active-business', businessId);
    } catch (e) {}

    setCurrentUser(user);
    setCurrentBusiness(biz);
    setUserBusinesses([biz]);
    setAuthStatus('authenticated');
  };

  
  // Automatically activate 1-second real-time multi-device sync whenever business changes
  useEffect(() => {
    if (currentBusiness?.id && !String(currentBusiness.id).startsWith('demo-')) {
      db.startRealtimeSync(currentBusiness.id);
    }
  }, [currentBusiness?.id]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthError('');
      if (firebaseUser) {
        console.log(`[AUTH] Authenticated UID: ${firebaseUser.uid}`);
        try {
          const karobaarUser = await db.getUserByFirebaseUid(firebaseUser.uid);
          
          // Check all businesses for this user across cloud and local storage
          const businessesData = await db.getBusinessesForUser(firebaseUser.uid, firebaseUser.email);

          if (businessesData && businessesData.length > 0) {
            // RETURNING USER: Load their real data saved from last time!
            setUserBusinesses(businessesData);
            
            let activeId = localStorage.getItem('karobaar-active-business') || karobaarUser?.activeBusinessId || businessesData[0].id;
            const activeBusinessData = businessesData.find(b => b.id === activeId) || businessesData[0];
            if (activeBusinessData) {
              setCurrentBusiness(activeBusinessData);
              const resolvedOwnerName = karobaarUser?.name || activeBusinessData.ownerName || (currentUser?.name && currentUser.name !== 'dev 1' && currentUser.name !== 'Store Owner' ? currentUser.name : null) || firebaseUser.displayName || 'Business Owner';
              const userObj = {
                ...(karobaarUser || {}),
                id: firebaseUser.uid,
                name: resolvedOwnerName,
                displayName: resolvedOwnerName,
                email: firebaseUser.email || karobaarUser?.email || '',
                phone: karobaarUser?.phone || activeBusinessData.phone || '',
                role: karobaarUser?.role || 'Owner',
                activeBusinessId: activeBusinessData.id,
                memberships: businessesData.map(b => b.id),
                onboardingCompleted: true
              };
              setCurrentUser(userObj);
              try {
                localStorage.setItem('karobaar_session_user', JSON.stringify(userObj));
                localStorage.setItem('karobaar_session_business', JSON.stringify(activeBusinessData));
                localStorage.setItem('karobaar_session_businesses', JSON.stringify(businessesData));
                localStorage.setItem('karobaar-active-business', activeBusinessData.id);
                localStorage.setItem(`karobaar_onboarding_completed_${firebaseUser.email.toLowerCase()}`, 'true');
              } catch (e) {}

              // Start 1-second real-time sync with cloud (Mobile <-> Tablet <-> PC)
              db.startRealtimeSync(activeBusinessData.id);
              setAuthStatus('authenticated');
            } else {
              setAuthStatus('pending_onboarding');
            }
          } else {
            // Check if there is an active or local business before treating as brand-new!
            const allLocal = localDb.getAll('businesses') || [];
            let realBiz = allLocal.find(b => b && !String(b.id).startsWith('demo-') && !String(b.id).includes('demo') && b.name && b.name !== 'My Business' && b.name !== 'My Store');
            
            // Also check session business or setup draft
            if (!realBiz) {
              try {
                const draftStr = localStorage.getItem('karobaar_setup_draft');
                if (draftStr) {
                  const d = JSON.parse(draftStr);
                  if (d.business && d.business.name) {
                    realBiz = {
                      id: localStorage.getItem('karobaar-active-business') || ('biz_' + Date.now()),
                      name: d.business.name.trim(),
                      businessName: d.business.name.trim(),
                      type: d.business.type || 'Wholesale',
                      country: d.business.country || 'India',
                      city: d.business.city || '',
                      ownerName: d.personal?.fullName || 'Business Owner',
                      phone: d.personal?.phone || '',
                      email: firebaseUser.email || d.personal?.email || '',
                      currency: d.preferences?.currency || 'INR'
                    };
                  }
                }
                if (!realBiz) {
                  const savedBizStr = localStorage.getItem('karobaar_session_business');
                  if (savedBizStr) {
                    const sb = JSON.parse(savedBizStr);
                    if (sb && sb.name && !String(sb.id).startsWith('demo-')) {
                      realBiz = sb;
                    }
                  }
                }
              } catch (_) {}
            }

            if (realBiz) {
              // Auto-adopt this real business for the authenticated user!
              realBiz.ownerId = firebaseUser.uid;
              if (firebaseUser.email) realBiz.ownerEmail = firebaseUser.email;
              localDb.save('businesses', realBiz.id, realBiz);
              setCurrentBusiness(realBiz);
              setUserBusinesses([realBiz]);
              const resolvedOwnerName = karobaarUser?.name || realBiz.ownerName || (currentUser?.name && currentUser.name !== 'dev 1' ? currentUser.name : null) || firebaseUser.displayName || 'Business Owner';
              const userObj = {
                ...(karobaarUser || {}),
                id: firebaseUser.uid,
                name: resolvedOwnerName,
                displayName: resolvedOwnerName,
                email: firebaseUser.email || karobaarUser?.email || '',
                phone: karobaarUser?.phone || realBiz.phone || '',
                role: 'Owner',
                activeBusinessId: realBiz.id,
                memberships: [realBiz.id],
                onboardingCompleted: true
              };
              setCurrentUser(userObj);
              try {
                localStorage.setItem('karobaar_session_user', JSON.stringify(userObj));
                localStorage.setItem('karobaar_session_business', JSON.stringify(realBiz));
                localStorage.setItem('karobaar_session_businesses', JSON.stringify([realBiz]));
                localStorage.setItem('karobaar-active-business', realBiz.id);
                if (firebaseUser.email) {
                  localStorage.setItem(`karobaar_onboarding_completed_${firebaseUser.email.toLowerCase()}`, 'true');
                }
              } catch (e) {}
              db.startRealtimeSync(realBiz.id);
              setAuthStatus('authenticated');
            } else {
              // NEW USER: route to setup page!
              const pendingUser = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Business Owner',
                email: firebaseUser.email,
                role: 'Owner',
                memberships: [],
                onboardingCompleted: false
              };
              setCurrentUser(pendingUser);
              setCurrentBusiness(null);
              setUserBusinesses([]);
              try {
                localStorage.setItem('karobaar_session_user', JSON.stringify(pendingUser));
                localStorage.removeItem('karobaar_session_business');
                localStorage.removeItem('karobaar_session_businesses');
                localStorage.removeItem('karobaar-active-business');
                localStorage.removeItem(`karobaar_onboarding_completed_${firebaseUser.email.toLowerCase()}`);
              } catch (e) {}
              setAuthStatus('pending_onboarding');
            }
          }
        } catch (error) {
          console.warn("[AUTH] Cloud profile check note:", error);
          if (isDebugBuild()) {
            if (!currentUser) setCurrentUser(DEFAULT_DEBUG_USER);
            if (!currentBusiness) setCurrentBusiness(DEFAULT_DEBUG_BUSINESS);
            setUserBusinesses([DEFAULT_DEBUG_BUSINESS]);
            setAuthStatus('authenticated');
          } else {
            setAuthStatus('pending_onboarding');
          }
        }
      } else {
        if (isDebugBuild()) {
          // Never log out or ask to sign in during debug builds
          if (!currentUser) setCurrentUser(DEFAULT_DEBUG_USER);
          if (!currentBusiness) setCurrentBusiness(DEFAULT_DEBUG_BUSINESS);
          setUserBusinesses([DEFAULT_DEBUG_BUSINESS]);
          setAuthStatus('authenticated');
          return;
        }
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
              }
              setAuthStatus('authenticated');
            } catch (e) {
              setAuthStatus('unauthenticated');
            }
          } else {
            // Auto-heal check if business exists locally
            const allLocal = localDb.getAll('businesses') || [];
            const realBiz = allLocal.find(b => b && !String(b.id).startsWith('demo-') && !String(b.id).includes('demo') && b.name && b.name !== 'My Business' && b.name !== 'My Store');
            if (realBiz) {
              setCurrentBusiness(realBiz);
              setUserBusinesses([realBiz]);
              const fallbackUser = {
                id: realBiz.ownerId || 'owner-' + realBiz.id,
                name: realBiz.ownerName || 'Business Owner',
                email: realBiz.email || realBiz.ownerEmail || 'owner@karobaar.local',
                phone: realBiz.phone || '',
                role: 'Owner',
                activeBusinessId: realBiz.id,
                memberships: [realBiz.id],
                onboardingCompleted: true
              };
              setCurrentUser(fallbackUser);
              try {
                localStorage.setItem('karobaar_session_user', JSON.stringify(fallbackUser));
                localStorage.setItem('karobaar_session_business', JSON.stringify(realBiz));
                localStorage.setItem('karobaar_session_businesses', JSON.stringify([realBiz]));
                localStorage.setItem('karobaar-active-business', realBiz.id);
              } catch (e) {}
              setAuthStatus('authenticated');
            } else {
              setAuthStatus('unauthenticated');
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Periodic Auto-heal to guarantee real business data is ALWAYS mounted and never lost
  useEffect(() => {
    const healSession = () => {
      try {
        const wasLoggedOut = localStorage.getItem('karobaar_explicit_logout') === 'true';
        if (wasLoggedOut) return;

        const allLocal = localDb.getAll('businesses') || [];
        const realBusinesses = allLocal.filter(b => b && !String(b.id).startsWith('demo-') && !String(b.id).includes('demo') && b.name && b.name !== 'My Business' && b.name !== 'My Store');
        
        let candidate = null;
        const activeBizId = localStorage.getItem('karobaar-active-business');
        if (activeBizId) {
          candidate = allLocal.find(b => b && b.id === activeBizId && !String(b.id).startsWith('demo-'));
        }
        if (!candidate && realBusinesses.length > 0) {
          candidate = realBusinesses[realBusinesses.length - 1];
        }

        if (candidate) {
          if (!currentBusiness || currentBusiness.id !== candidate.id || !currentBusiness.name || currentBusiness.name === 'My Business') {
            setCurrentBusiness(candidate);
            localStorage.setItem('karobaar_session_business', JSON.stringify(candidate));
            localStorage.setItem('karobaar-active-business', candidate.id);
          }
          if (!userBusinesses || userBusinesses.length === 0) {
            setUserBusinesses(realBusinesses.length > 0 ? realBusinesses : [candidate]);
            localStorage.setItem('karobaar_session_businesses', JSON.stringify(realBusinesses.length > 0 ? realBusinesses : [candidate]));
          }

          // Heal user name & phone
          const allUsers = localDb.getAll('users') || [];
          const realUser = allUsers.find(u => u && !String(u.id).startsWith('demo-') && u.name && u.name !== 'Store Owner' && u.name !== 'dev 1');
          let draftOwner = null;
          try {
            const d = JSON.parse(localStorage.getItem('karobaar_setup_draft') || '{}');
            if (d.personal?.fullName) draftOwner = d.personal.fullName.trim();
          } catch (_) {}
          const resolvedName = draftOwner || realUser?.name || candidate.ownerName;
          if (resolvedName && (!currentUser?.name || currentUser.name === 'Store Owner' || currentUser.name === 'dev 1' || currentUser.name === 'User' || currentUser.name === 'Business Owner')) {
            setCurrentUser(prev => ({
              ...(prev || {}),
              name: resolvedName,
              displayName: resolvedName,
              phone: prev?.phone || realUser?.phone || candidate.phone || '',
              activeBusinessId: candidate.id
            }));
            try {
              const savedUser = JSON.parse(localStorage.getItem('karobaar_session_user') || '{}');
              localStorage.setItem('karobaar_session_user', JSON.stringify({
                ...savedUser,
                name: resolvedName,
                displayName: resolvedName,
                phone: savedUser.phone || realUser?.phone || candidate.phone || '',
                activeBusinessId: candidate.id
              }));
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('[Auto-heal session note]', e);
      }
    };

    healSession();
  }, [currentBusiness?.id]);

  const toggleTheme = (forcedMode) => {
    const currentDomTheme = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) 
      || theme 
      || 'light';

    let next;
    if (forcedMode === 'dark' || forcedMode === 'light') {
      next = forcedMode;
    } else {
      next = currentDomTheme === 'dark' ? 'light' : 'dark';
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
    setIsSignOutModalOpen(false);
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
      isSignOutModalOpen,
      requestSignOut,
      closeSignOutModal,
      isDemoMode,
      isDemoRestrictedModalOpen,
      demoRestrictedFeatureName,
      requireAuthAndSetup,
      closeDemoRestrictedModal,
      switchBranch,
      createNewBusiness,
      joinBusinessWithCode,
      hasUserPermission,
      refreshUserProfile,
      refreshBusinessProfile,
      updateCurrentBusiness,
      launchReadyToUseWorkspace,
      launchDemoWorkspace,
      exitDemoWorkspace,
      resetDemoWorkspace,
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
