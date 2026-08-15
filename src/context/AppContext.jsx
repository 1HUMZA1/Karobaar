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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Authentication & Global State
  // Authentication & Global State
  const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'authenticated', 'unauthenticated', 'pending_onboarding'
  const [currentUser, setCurrentUser] = useState(null);

  const userRole = currentUser?.role || 'Guest';

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('karobaar-theme', theme);
  }, [theme]);

  // Firebase Auth Listener
  useEffect(() => {
    console.log("[AUTH] Firebase initializing");
    console.log("[AUTH] Loading...");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log(`[AUTH] Authenticated UID: ${firebaseUser.uid}`);
        
        // User is authenticated via Google/GitHub/Email
        try {
          const karobaarUser = await db.getUserByFirebaseUid(firebaseUser.uid);
          
          if (karobaarUser) {
            console.log("[AUTH] User profile loaded");
          } else {
            console.log("[AUTH] No existing user profile found");
          }

          if (karobaarUser && karobaarUser.memberships && karobaarUser.memberships.length > 0) {
            console.log("[AUTH] Business membership loaded");
            console.log(`[AUTH] Active business: ${karobaarUser.memberships[0]}`);
            console.log("[AUTH] Navigating to dashboard (Setting authenticated state)");
            
            // Fully set up user with at least one business
            setCurrentUser({
              ...karobaarUser,
              activeBusinessId: karobaarUser.memberships[0] // Default to first for now
            });
            setAuthStatus('authenticated');
          } else {
            console.log("[AUTH] No business memberships found. Navigating to onboarding.");
            // User exists but has no business memberships, or user doesn't exist yet
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
          setCurrentUser(null);
          setAuthStatus('unauthenticated');
        }
      } else {
        console.log("[AUTH] Unauthenticated user");
        setCurrentUser(null);
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
      const karobaarUser = await db.getUserByFirebaseUid(auth.currentUser.uid);
      if (karobaarUser && karobaarUser.memberships && karobaarUser.memberships.length > 0) {
        setCurrentUser({
          ...karobaarUser,
          activeBusinessId: karobaarUser.memberships[0]
        });
        setAuthStatus('authenticated');
      } else {
        setAuthStatus('pending_onboarding');
      }
    }
  };

  const logout = async () => {
    setAuthStatus('loading');
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setAuthStatus('unauthenticated');
    } catch (error) {
      console.error("Logout Error:", error);
      setAuthStatus('unauthenticated');
    }
  };

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      authStatus,
      currentUser,
      userRole,
      refreshUserProfile,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
