import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/databaseService';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('karobaar-theme');
    return saved || 'light';
  });

  const [accent, setAccent] = useState(() => {
    const saved = localStorage.getItem('karobaar-accent');
    return saved || 'default';
  });

  const [appUiVersion, setAppUiVersion] = useState(() => {
    const saved = localStorage.getItem('karobaar-ui-version');
    return saved || 'premium';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Authentication & Global State
  const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'authenticated', 'unauthenticated', 'pending_onboarding'
  const [authError, setAuthError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [userBusinesses, setUserBusinesses] = useState([]);

  const userRole = currentUser?.role || 'Guest';

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
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

  // Apply Business Theme/Settings if available
  useEffect(() => {
    if (currentBusiness?.settings?.theme) {
      setTheme(currentBusiness.settings.theme);
    }
    if (currentBusiness?.settings?.accent) {
      setAccent(currentBusiness.settings.accent);
    }
    if (currentBusiness?.settings?.appUiVersion) {
      setAppUiVersion(currentBusiness.settings.appUiVersion);
    }
  }, [currentBusiness]);

  // Firebase Auth Listener
  useEffect(() => {
    console.log("[AUTH] Firebase initializing");
    console.log("[AUTH] Loading...");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthError(''); // Clear previous errors
      if (firebaseUser) {
        console.log(`[AUTH] Authenticated UID: ${firebaseUser.uid}`);
        
        try {
          const karobaarUser = await db.getUserByFirebaseUid(firebaseUser.uid);
          
          if (karobaarUser && karobaarUser.memberships && karobaarUser.memberships.length > 0) {
            console.log(`[AUTH] Active business ID: ${karobaarUser.memberships[0]}`);
            
            // Fetch all businesses user belongs to
            const bizPromises = karobaarUser.memberships.map(id => db.getById('businesses', id));
            const businessesData = (await Promise.all(bizPromises)).filter(Boolean);
            setUserBusinesses(businessesData);
            
            // Prefer currently saved active business, else first
            let activeId = localStorage.getItem('karobaar-active-business') || karobaarUser.memberships[0];
            if (!karobaarUser.memberships.includes(activeId)) {
              activeId = karobaarUser.memberships[0];
            }

            const activeBusinessData = businessesData.find(b => b.id === activeId) || businessesData[0];
            setCurrentBusiness(activeBusinessData);
            
            setCurrentUser({
              ...karobaarUser,
              activeBusinessId: activeBusinessData.id
            });
            setAuthStatus('authenticated');
          } else {
            console.log("[AUTH] No business memberships found. Navigating to onboarding.");
            setCurrentBusiness(null);
            setUserBusinesses([]);
            setCurrentUser({
              ...karobaarUser,
              firebaseUid: firebaseUser.uid,
              name: firebaseUser.displayName || karobaarUser?.name,
              email: firebaseUser.email || karobaarUser?.email,
              photoURL: firebaseUser.photoURL || karobaarUser?.photoURL
            });
            setAuthStatus('pending_onboarding');
          }
        } catch (error) {
          console.error("[AUTH] Error loading Karobaar profile:", error);
          setAuthError(error.message || "Failed to load account data. Please check your connection.");
          setCurrentUser(null);
          setCurrentBusiness(null);
          setUserBusinesses([]);
          setAuthStatus('unauthenticated');
        }
      } else {
        console.log("[AUTH] Unauthenticated user");
        setCurrentUser(null);
        setCurrentBusiness(null);
        setUserBusinesses([]);
        setAuthStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
      // Force reload to completely clear all caches for the new branch context
      window.location.hash = '#/dashboard';
      window.location.reload();
    }
  };

  // Method to refresh user profile from local database without requiring a hard reload
  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      console.log("[AUTH] Refreshing user profile...");
      const karobaarUser = await db.getUserByFirebaseUid(auth.currentUser.uid);
      
      if (karobaarUser && karobaarUser.onboardingCompleted && karobaarUser.memberships?.length > 0) {
        console.log("[AUTH] User onboarded. Local data found.");
        
        const bizPromises = karobaarUser.memberships.map(id => db.getById('businesses', id));
        const businessesData = (await Promise.all(bizPromises)).filter(Boolean);
        setUserBusinesses(businessesData);

        let activeId = currentUser?.activeBusinessId || karobaarUser.memberships[0];
        if (!karobaarUser.memberships.includes(activeId)) {
          activeId = karobaarUser.memberships[0];
        }

        const activeBusinessData = businessesData.find(b => b.id === activeId) || businessesData[0];
        setCurrentBusiness(activeBusinessData);

        setCurrentUser({
          ...karobaarUser,
          activeBusinessId: activeBusinessData.id
        });
        setAuthStatus('authenticated');
      } else {
        console.log("[AUTH] User not onboarded.");
        setAuthStatus('pending_onboarding');
      }
    }
  };

  const logout = async () => {
    setAuthStatus('loading');
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setCurrentBusiness(null);
      setAuthStatus('unauthenticated');
    } catch (error) {
      console.error("Logout Error:", error);
      setAuthStatus('unauthenticated');
    }
  };

  return (
    <AppContext.Provider value={{
      theme,
      setTheme,
      accent,
      setAccent,
      toggleTheme,
      appUiVersion,
      setAppUiVersion,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      authStatus,
      authError,
      currentUser,
      currentBusiness,
      userBusinesses,
      switchBranch,
      userRole,
      refreshUserProfile,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
