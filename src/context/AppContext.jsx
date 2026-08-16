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
            
            // Fetch the actual business document
            const businessData = await db.getById('businesses', karobaarUser.memberships[0]);
            setCurrentBusiness(businessData);
            
            setCurrentUser({
              ...karobaarUser,
              activeBusinessId: karobaarUser.memberships[0]
            });
            setAuthStatus('authenticated');
          } else {
            console.log("[AUTH] No business memberships found. Navigating to onboarding.");
            setCurrentBusiness(null);
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
          setAuthStatus('unauthenticated');
        }
      } else {
        console.log("[AUTH] Unauthenticated user");
        setCurrentUser(null);
        setCurrentBusiness(null);
        setAuthStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Method to refresh user profile from local database without requiring a hard reload
  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      console.log("[AUTH] Refreshing user profile...");
      const karobaarUser = await db.getUserByFirebaseUid(auth.currentUser.uid);
      
      if (karobaarUser && karobaarUser.onboardingCompleted && karobaarUser.memberships?.length > 0) {
        console.log("[AUTH] User onboarded. Local data found.");
        
        // Fetch the actual business document
        const businessData = await db.getById('businesses', karobaarUser.memberships[0]);
        setCurrentBusiness(businessData);

        setCurrentUser({
          ...karobaarUser,
          activeBusinessId: karobaarUser.memberships[0]
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
      userRole,
      refreshUserProfile,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
