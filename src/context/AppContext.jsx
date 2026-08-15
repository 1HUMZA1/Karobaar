import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Keep userRole for backwards compatibility with existing components during transition
  const userRole = currentUser?.role || 'Guest';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('karobaar-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const login = (userData) => {
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
      login,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
