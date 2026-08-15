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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const userRole = currentUser?.role || 'Guest';

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('karobaar-theme', theme);
  }, [theme]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is logged into Google. Now check Karobaar profile.
        try {
          const users = await db.getRawCollection('users');
          const karobaarUser = users.find(u => u.firebaseUid === firebaseUser.uid);

          if (karobaarUser) {
            // Existing user
            setCurrentUser(karobaarUser);
            setIsAuthenticated(true);
          } else {
            // Authenticated via Google, but NO Karobaar profile yet.
            // We set a temporary currentUser without a businessId to force them to /setup
            setCurrentUser({
              firebaseUid: firebaseUser.uid,
              name: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              isPendingSetup: true
            });
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error("Error loading Karobaar profile:", error);
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else {
        // User is logged out
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Method to refresh user profile from local database without requiring a hard reload
  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      const users = await db.getRawCollection('users');
      const karobaarUser = users.find(u => u.firebaseUid === auth.currentUser.uid);
      if (karobaarUser) {
        setCurrentUser(karobaarUser);
      }
    }
  };

  const logout = async () => {
    setIsAuthLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      isAuthLoading,
      isAuthenticated,
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
