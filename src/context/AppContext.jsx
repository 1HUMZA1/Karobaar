import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ebusiness-theme');
    return saved || 'light';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState('Admin'); // Demo default

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ebusiness-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      userRole,
      setUserRole
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
