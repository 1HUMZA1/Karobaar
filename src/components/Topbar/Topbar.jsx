import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Sun, Moon, Bell, User, LogOut, HelpCircle, Settings } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/databaseService';
import { localDb } from '../../services/localDb';
import './Topbar.css';

const Topbar = () => {
  const { toggleSidebar, theme, toggleTheme, userRole, currentUser, currentBusiness, logout } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const searchInputRef = useRef(null);

  useEffect(() => {
    const updateCount = () => setPendingCount(localDb.getPendingQueue().length);
    updateCount(); // Initial count
    
    window.addEventListener('karobaar_sync_update', updateCount);
    window.addEventListener('online', updateCount);
    window.addEventListener('offline', updateCount);
    
    return () => {
      window.removeEventListener('karobaar_sync_update', updateCount);
      window.removeEventListener('online', updateCount);
      window.removeEventListener('offline', updateCount);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close profile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 2) {
      setIsSearching(true);
      // Mock global search across a few collections
      const products = await db.getCollection('products');
      const customers = await db.getCollection('customers');
      
      const pRes = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).map(p => ({...p, _type: 'Product', _path: '/products'}));
      const cRes = customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).map(c => ({...c, _type: 'Customer', _path: '/customers'}));
      
      setSearchResults([...pRes, ...cRes].slice(0, 5));
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleResultClick = (path) => {
    navigate(path);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
      </div>

      <div className="topbar-center hidden-mobile">
        <div className="global-search-container">
          <Search size={16} className="global-search-icon" />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search products, customers, orders..." 
            className="global-search-input"
            value={searchQuery}
            onChange={handleSearch}
          />
          <div className="search-shortcut hidden-mobile">
            <kbd>Ctrl</kbd> + <kbd>K</kbd>
          </div>
          {searchQuery.length > 2 && (
            <div className="search-dropdown-menu">
              {searchResults.length > 0 ? (
                searchResults.map(res => (
                  <div 
                    key={`${res._type}-${res.id}`} 
                    className="search-dropdown-item"
                    onClick={() => handleResultClick(res._path)}
                  >
                    <span className="result-type">{res._type}</span>
                    <span className="result-name">{res.name}</span>
                  </div>
                ))
              ) : (
                <div className="search-dropdown-empty">No results found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        {/* Sync Indicator */}
        <div className="topbar-sync-status hidden-mobile">
          {!navigator.onLine ? (
            <span className="sync-offline">● Offline</span>
          ) : pendingCount > 0 ? (
            <span className="sync-syncing">↻ Syncing...</span>
          ) : (
            <span className="sync-synced">● Synced just now</span>
          )}
        </div>

        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        
        <button className="icon-btn" title="Help">
          <HelpCircle size={18} />
        </button>

        <button className="icon-btn notification-btn" title="Notifications" onClick={() => navigate('/notifications')}>
          <Bell size={18} />
          <span className="notification-badge">3</span>
        </button>

        <div className="topbar-divider"></div>

        <div className="user-profile-trigger" ref={profileRef} onClick={() => setIsProfileOpen(!isProfileOpen)}>
          <div className="user-avatar">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="User" />
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="user-info hidden-mobile">
            <span className="user-name">{currentUser?.name || 'User'}</span>
            <span className="user-business">{currentBusiness?.businessName || 'Business'}</span>
          </div>
          
          {isProfileOpen && (
            <div 
              className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl py-2 border border-slate-200 dark:border-slate-700 z-[100]"
              onClick={(e) => e.stopPropagation()} // Prevent clicking inside from closing it immediately
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 mb-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.email || ''}</p>
              </div>
              
              <div 
                className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors flex items-center gap-2"
                onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
              >
                <User size={16} className="text-slate-400"/> Profile
              </div>
              
              <div 
                className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors flex items-center gap-2"
                onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
              >
                <Settings size={16} className="text-slate-400"/> Business Settings
              </div>
              
              <div 
                className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors flex items-center gap-2"
                onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
              >
                <HelpCircle size={16} className="text-slate-400"/> Help & Support
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
              
              <div 
                className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 cursor-pointer transition-colors"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
