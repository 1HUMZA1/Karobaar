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
  const searchWords = ['products', 'customers', 'orders', 'invoices'];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % searchWords.length);
    }, 3000); // 3s matches the CSS animation duration
    return () => clearInterval(interval);
  }, []);

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
        <div className="global-search-container relative">
          <Search size={16} className="global-search-icon" style={{ zIndex: 10 }} />
          <input 
            ref={searchInputRef}
            type="text" 
            className="global-search-input"
            value={searchQuery}
            onChange={handleSearch}
            style={{ position: 'relative', zIndex: 5 }}
          />
          
          {searchQuery.length === 0 && (
            <div 
              style={{ position: 'absolute', left: '42px', top: '0', bottom: '0', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 10, color: '#94a3b8' }}
            >
              <span className="mr-1">Search</span>
              <span key={wordIndex} className="animate-fade-slide-up font-medium" style={{ color: '#475569' }}>
                {searchWords[wordIndex]}...
              </span>
            </div>
          )}

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
              className="absolute right-0 w-64 bg-[var(--bg-card)] rounded-xl shadow-xl py-2 border border-[var(--border-color)] z-[100]"
              style={{ top: 'calc(100% + 8px)' }}
              onClick={(e) => e.stopPropagation()} // Prevent clicking inside from closing it immediately
            >
              <div className="px-4 py-3 border-b border-[var(--border-color)] mb-1 bg-[var(--bg-card)] rounded-t-xl">
                <p className="text-sm font-semibold text-[var(--text-main)] truncate">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">{currentUser?.email || ''}</p>
              </div>
              
              <div 
                className="px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors flex items-center gap-2 hover:text-[var(--text-main)]"
                onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
              >
                <User size={16} className="text-[var(--text-muted)]"/> Profile
              </div>
              
              <div 
                className="px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors flex items-center gap-2 hover:text-[var(--text-main)]"
                onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
              >
                <Settings size={16} className="text-[var(--text-muted)]"/> Business Settings
              </div>
              
              <div 
                className="px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors flex items-center gap-2 hover:text-[var(--text-main)]"
                onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
              >
                <HelpCircle size={16} className="text-[var(--text-muted)]"/> Help & Support
              </div>
              
              <div className="border-t border-[var(--border-color)] my-1"></div>
              
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
