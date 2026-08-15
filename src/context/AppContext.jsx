import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/databaseService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('karobaar-theme');
    return saved || 'light';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('karobaar-auth') === 'true';
  });
  
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('karobaar-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const userRole = currentUser?.role || 'Guest';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('karobaar-theme', theme);
  }, [theme]);

  // Ensure default admin exists
  useEffect(() => {
    const initializeAdmin = async () => {
      const users = await db.getCollection('users');
      if (users.length === 0) {
        await db.add('users', {
          email: 'admin@karobaar.com',
          password: 'admin', // Very simple default
          name: 'Super Admin',
          role: 'Owner'
        });
      }
    };
    initializeAdmin();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const authenticate = async (email, password, rememberMe) => {
    const users = await db.getCollection('users');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Don't store password in session state
      const { password: _, ...userData } = user;
      setCurrentUser(userData);
      setIsAuthenticated(true);
      
      if (rememberMe) {
        localStorage.setItem('karobaar-user', JSON.stringify(userData));
        localStorage.setItem('karobaar-auth', 'true');
      } else {
        sessionStorage.setItem('karobaar-user', JSON.stringify(userData));
        sessionStorage.setItem('karobaar-auth', 'true');
      }
      return { success: true };
    }
    return { success: false, message: 'Invalid email or password' };
  };

  const register = async (email, password, name) => {
    const users = await db.getCollection('users');
    if (users.some(u => u.email === email)) {
      return { success: false, message: 'Email already exists' };
    }
    
    // Default new registrations to Employee to prevent unauthorized Owner access
    const newUser = await db.add('users', {
      email,
      password,
      name,
      role: 'Employee' 
    });
    
    const { password: _, ...userData } = newUser;
    setCurrentUser(userData);
    setIsAuthenticated(true);
    
    localStorage.setItem('karobaar-user', JSON.stringify(userData));
    localStorage.setItem('karobaar-auth', 'true');
    
    return { success: true };
  };

  const login = (userData) => {
    // For manual override or Google Login
    setCurrentUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('karobaar-user', JSON.stringify(userData));
    localStorage.setItem('karobaar-auth', 'true');
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('karobaar-user');
    localStorage.removeItem('karobaar-auth');
    sessionStorage.removeItem('karobaar-user');
    sessionStorage.removeItem('karobaar-auth');
  };

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      isAuthenticated,
      currentUser,
      userRole,
      authenticate,
      register,
      login,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
