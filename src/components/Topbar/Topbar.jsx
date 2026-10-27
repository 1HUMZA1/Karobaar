import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  Bell, 
  User, 
  LogOut, 
  HelpCircle, 
  Settings, 
  Zap, 
  Sparkles,
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  Users,
  CreditCard,
  DollarSign,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  X,
  Target
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/databaseService';
import { localDb } from '../../services/localDb';
import { KarobaarLogo } from '../KarobaarLogo/KarobaarLogo';
import './Topbar.css';

const PAGES_LIST = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, category: 'Pages', hint: 'Overview & metrics' },
  { name: 'New Sale / POS Register', path: '/pos', icon: Zap, category: 'Pages', hint: 'Billing & cashier [F2]' },
  { name: 'Orders & Receipts', path: '/orders', icon: ShoppingCart, category: 'Pages', hint: 'Sales history & invoices' },
  { name: 'Inventory & Products', path: '/products', icon: Package, category: 'Pages', hint: 'Stock & pricing' },
  { name: 'Customers & Khata', path: '/customers', icon: Users, category: 'Pages', hint: 'Ledger & Udhaar' },
  { name: 'Expenses & Cashflow', path: '/expenses', icon: DollarSign, category: 'Pages', hint: 'Petty cash & bills' },
  { name: 'Invoices & Billing', path: '/invoices', icon: FileText, category: 'Pages', hint: 'Tax invoices' },
  { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, category: 'Pages', hint: 'P&L and sales analytics' },
  { name: 'Employees & Payroll', path: '/employees', icon: Users, category: 'Pages', hint: 'Staff & wages' },
  { name: 'Attendance & Timeclock', path: '/attendance', icon: Calendar, category: 'Pages', hint: 'Clock-in & leaves' },
  { name: 'Settings & Workspace', path: '/settings', icon: Settings, category: 'Pages', hint: 'Business profile & rules' },
  { name: 'Customize (AI & Automations)', path: '/settings?tab=customize', icon: Sparkles, category: 'Pages', hint: 'AI Chatbot & workflows' },
  { name: 'Multi-Branch & Outlets', path: '/branches', icon: Layers, category: 'Pages', hint: 'Branch operations' }
];

const Topbar = () => {
  const { toggleSidebar, theme, toggleTheme, userRole, currentUser, currentBusiness, logout, appUiVersion, setAppUiVersion } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('All'); // 'All' | 'Pages' | 'Products' | 'Orders' | 'Actions'
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Assistant Name (Default: Jarvis, or Mr. H / Custom from settings - strictly never 'Customize')
  const [assistantName, setAssistantName] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('karobaar_customize_ai_settings') || '{}');
      const name = saved.assistantName;
      return (!name || name === 'Customize') ? 'Jarvis' : name;
    } catch { return 'Jarvis'; }
  });

  // Auto-migrate any legacy 'Customize' to 'Jarvis' in localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('karobaar_customize_ai_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.assistantName || parsed.assistantName === 'Customize') {
          parsed.assistantName = 'Jarvis';
          localStorage.setItem('karobaar_customize_ai_settings', JSON.stringify(parsed));
          setAssistantName('Jarvis');
        }
      }
    } catch {}

    const handleSettingsUpdate = (e) => {
      const rawName = e?.detail?.assistantName;
      if (rawName && rawName !== 'Customize') {
        setAssistantName(rawName);
      } else {
        try {
          const saved = JSON.parse(localStorage.getItem('karobaar_customize_ai_settings') || '{}');
          const name = saved.assistantName;
          setAssistantName((!name || name === 'Customize') ? 'Jarvis' : name);
        } catch {
          setAssistantName('Jarvis');
        }
      }
    };
    window.addEventListener('karobaar_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('karobaar_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  const handleWakeAiAssistant = () => {
    window.dispatchEvent(new CustomEvent('karobaar_wake_ai_assistant'));
  };

  const profileRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  const searchWords = ['products', 'orders', 'customers', 'pages', 'settings'];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % searchWords.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateCount = () => setPendingCount(localDb.getPendingQueue().length);
    updateCount();
    
    window.addEventListener('karobaar_sync_update', updateCount);
    window.addEventListener('online', updateCount);
    window.addEventListener('offline', updateCount);
    
    return () => {
      window.removeEventListener('karobaar_sync_update', updateCount);
      window.removeEventListener('online', updateCount);
      window.removeEventListener('offline', updateCount);
    };
  }, []);

  // Global Ctrl + K / Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsFocused(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Omni-Search Handler
  const performSearch = async (query, filter) => {
    const q = query.toLowerCase().trim();
    const businessId = currentUser?.activeBusinessId || 'demo-business-1';
    let results = [];

    // 1. Pages & Tabs Matching
    if (filter === 'All' || filter === 'Pages') {
      const pageMatches = PAGES_LIST.filter(p => 
        !q || p.name.toLowerCase().includes(q) || (p.hint && p.hint.toLowerCase().includes(q))
      ).map(p => ({
        id: `page-${p.path}`,
        type: 'Page',
        title: p.name,
        subtitle: p.hint,
        icon: p.icon,
        action: () => navigate(p.path)
      }));
      results.push(...pageMatches);
    }

    // 2. Quick Actions Matching
    if (filter === 'All' || filter === 'Actions') {
      const actions = [
        {
          id: 'act-new-sale',
          type: 'Action',
          title: 'New Sale / POS Register',
          subtitle: 'Open terminal for fast billing [F2]',
          icon: Zap,
          action: () => navigate('/pos')
        },
        {
          id: 'act-theme',
          type: 'Action',
          title: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
          subtitle: 'Toggle monochrome contrast',
          icon: theme === 'light' ? Moon : Sun,
          action: () => toggleTheme()
        },
        {
          id: 'act-legacy',
          type: 'Action',
          title: 'Switch to Legacy Operations Desk',
          subtitle: 'Fast-track high-density workspace',
          icon: Layers,
          action: () => { setAppUiVersion('legacy'); navigate('/dashboard'); }
        },
        {
          id: 'act-premium',
          type: 'Action',
          title: 'Switch to Premium Command Center',
          subtitle: 'Executive analytics and radar KPIs',
          icon: LayoutDashboard,
          action: () => { setAppUiVersion('premium'); navigate('/dashboard'); }
        },
        {
          id: 'act-ai',
          type: 'Action',
          title: 'Open Customize AI Automator',
          subtitle: 'Automate tasks & ask business queries',
          icon: Sparkles,
          action: () => window.dispatchEvent(new CustomEvent('karobaar_open_ai_assistant', { detail: { query: q } }))
        },
        {
          id: 'act-onboard',
          type: 'Action',
          title: 'Run AI Store Setup Wizard',
          subtitle: 'Step-by-step automated store configuration',
          icon: Sparkles,
          action: () => window.dispatchEvent(new CustomEvent('karobaar_start_ai_onboarding'))
        }
      ];

      const matchedActions = actions.filter(a => 
        !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
      );
      results.push(...matchedActions);
    }

    // 3. Products Search
    if ((filter === 'All' || filter === 'Products') && q.length > 0) {
      try {
        const products = await db.getCollection('products', businessId);
        const pMatches = (products || []).filter(p => 
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
        ).slice(0, 6).map(p => ({
          id: `prod-${p.id}`,
          type: 'Product',
          title: p.name,
          subtitle: `₹${p.sellingPrice || p.price || 0} • ${p.stockQuantity || 0} in stock • ${p.category || 'General'}`,
          icon: Package,
          data: p,
          action: () => navigate('/products')
        }));
        results.push(...pMatches);
      } catch (e) {
        console.error('Product search error:', e);
      }
    }

    // 4. Customers & Orders Search
    if ((filter === 'All' || filter === 'Orders') && q.length > 0) {
      try {
        const customers = await db.getCollection('customers', businessId);
        const cMatches = (customers || []).filter(c => 
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
        ).slice(0, 4).map(c => ({
          id: `cust-${c.id}`,
          type: 'Customer',
          title: c.name,
          subtitle: `${c.phone || 'No phone'} • Balance: ₹${(c.outstandingBalance || 0).toFixed(2)}`,
          icon: Users,
          action: () => navigate('/customers')
        }));

        const sales = await db.getCollection('sales', businessId);
        const sMatches = (sales || []).filter(s => 
          (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(q)) ||
          (s.tokenNumber && s.tokenNumber.toLowerCase().includes(q))
        ).slice(0, 3).map(s => ({
          id: `sale-${s.id}`,
          type: 'Order',
          title: s.invoiceNumber || 'Invoice',
          subtitle: `Total: ₹${(s.total || 0).toFixed(2)} • ${s.paymentMethod || 'Cash'} • ${s.status || 'Completed'}`,
          icon: ShoppingCart,
          action: () => navigate('/orders')
        }));

        results.push(...cMatches, ...sMatches);
      } catch (e) {
        console.error('Customer/Order search error:', e);
      }
    }

    setSearchResults(results);
    setSelectedIndex(0);
    setIsSearching(false);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    performSearch(val, searchFilter);
  };

  const handleFilterSelect = (filterName) => {
    setSearchFilter(filterName);
    performSearch(searchQuery, filterName);
  };

  const handleOpenAiAssistant = (queryToPass = '') => {
    setIsFocused(false);
    window.dispatchEvent(new CustomEvent('karobaar_open_ai_assistant', { detail: { query: queryToPass } }));
  };

  const handleExecuteResult = (item) => {
    if (item && item.action) {
      item.action();
    }
    setIsFocused(false);
    setSearchQuery('');
  };

  // Keyboard navigation within dropdown
  const handleKeyDown = (e) => {
    if (!isFocused || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleExecuteResult(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn mobile-menu-btn" onClick={toggleSidebar} aria-label="Toggle navigation">
          <Menu size={20} />
        </button>
        <div 
          className="mobile-logo-header hidden-desktop" 
          style={{ display: 'flex', alignItems: 'center', marginLeft: '10px', cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          <KarobaarLogo size="sm" theme="auto" showTagline={false} />
        </div>
      </div>

      {/* Center Omni-Search Bar */}
      <div className="topbar-center hidden-mobile" ref={searchContainerRef} data-tour="omni-search">
        <div className={`global-search-container relative ${isFocused ? 'is-focused' : ''}`}>
          <Search size={16} className="global-search-icon" style={{ zIndex: 10 }} />
          <input 
            ref={searchInputRef}
            type="text" 
            className="global-search-input"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              setIsFocused(true);
              performSearch(searchQuery, searchFilter);
            }}
            onKeyDown={handleKeyDown}
            placeholder=""
          />
          
          {searchQuery.length === 0 && !isFocused && (
            <div 
              style={{ position: 'absolute', left: '42px', top: '0', bottom: '0', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 10, color: 'var(--text-muted)' }}
            >
              <span className="mr-1">Search</span>
              <span key={wordIndex} className="animate-fade-slide-up font-medium" style={{ color: 'var(--text-main)' }}>
                {searchWords[wordIndex]}...
              </span>
              <span className="ml-2 text-xs opacity-60">(Ctrl+K)</span>
            </div>
          )}

          {searchQuery && (
            <button 
              type="button" 
              onClick={() => { setSearchQuery(''); performSearch('', searchFilter); }}
              className="topbar-search-clear-btn"
            >
              <X size={14} />
            </button>
          )}

          {/* Omni-Search Dropdown Menu */}
          {isFocused && (
            <div className="search-dropdown-menu">
              {/* Category Filter Pills */}
              <div className="search-filter-pills-bar">
                {['All', 'Pages', 'Products', 'Orders', 'Actions'].map(f => (
                  <button 
                    key={f}
                    type="button"
                    className={`search-filter-pill ${searchFilter === f ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleFilterSelect(f); }}
                  >
                    {f}
                  </button>
                ))}

                <button 
                  type="button"
                  className="search-filter-pill search-ai-trigger-pill"
                  onClick={(e) => { e.stopPropagation(); handleOpenAiAssistant(searchQuery); }}
                  title="Ask Customize AI Automator"
                >
                  <Sparkles size={12} />
                  <span>Ask Customize AI</span>
                </button>
              </div>

              {/* Results List */}
              <div className="search-results-list custom-scrollbar">
                {searchResults.length > 0 ? (
                  searchResults.map((item, idx) => {
                    const IconComponent = item.icon || Layers;
                    const isSelected = idx === selectedIndex;

                    return (
                      <div 
                        key={item.id} 
                        className={`search-dropdown-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleExecuteResult(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <div className="search-item-icon">
                          <IconComponent size={16} />
                        </div>
                        <div className="search-item-info">
                          <div className="search-item-title-row">
                            <span className="result-name">{item.title}</span>
                            <span className="result-type-badge">{item.type}</span>
                          </div>
                          {item.subtitle && (
                            <span className="result-sub">{item.subtitle}</span>
                          )}
                        </div>

                        {/* Extra Actions on Product */}
                        {item.type === 'Product' && (
                          <div className="search-product-actions" onClick={e => e.stopPropagation()}>
                            <button 
                              className="search-prod-opt-btn"
                              title="Add to New Sale"
                              onClick={() => {
                                setIsFocused(false);
                                navigate('/pos');
                              }}
                            >
                              <Zap size={12} />
                              <span>Bill in POS</span>
                            </button>
                          </div>
                        )}

                        <ArrowRight size={14} className="search-arrow-icon" />
                      </div>
                    );
                  })
                ) : (
                  <div className="search-dropdown-empty">
                    <p>No results found matching "{searchQuery}" in {searchFilter}</p>
                    <button 
                      className="search-empty-ai-btn"
                      onClick={() => handleOpenAiAssistant(searchQuery)}
                    >
                      <Sparkles size={14} /> Ask Customize AI Assistant
                    </button>
                  </div>
                )}
              </div>

              {/* Dropdown Footer Helper */}
              <div className="search-dropdown-footer">
                <span>Navigate: <kbd>↑</kbd> <kbd>↓</kbd></span>
                <span>Select: <kbd>↵ Enter</kbd></span>
                <span>Close: <kbd>Esc</kbd></span>
                <span className="ml-auto font-bold text-xs" style={{ cursor: 'pointer' }} onClick={() => handleOpenAiAssistant(searchQuery)}>
                  ✨ Automate via Customize AI
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Topbar Right Actions */}
      <div className="topbar-right">
        {/* Dedicated Mr. H / Voice AI Wake Button */}
        <button 
          data-tour="mr-h-btn"
          className="topbar-mr-h-wake-btn"
          onClick={handleWakeAiAssistant}
          title={`Wake ${assistantName} Voice AI Assistant (Press or say "Hey ${assistantName}")`}
        >
          <span className="wake-pulse-dot" />
          <Sparkles size={14} />
          <span>Wake {assistantName}</span>
        </button>

        {/* Live Feature Spotlight & Outlining Tour */}
        <button 
          className="topbar-spotlight-tour-btn hidden-mobile"
          onClick={() => window.dispatchEvent(new CustomEvent('karobaar_start_spotlight_tour', { detail: { stepIndex: 0 } }))}
          title="Start Live Feature Outlining & Walkthrough"
        >
          <Target size={13} />
          <span>Live Guide</span>
        </button>

        {/* 1-Click Fast POS Access */}
        <button 
          className="topbar-quick-sale-btn hidden-mobile"
          onClick={() => navigate('/pos')}
          title="Open POS Register (F2)"
        >
          <Zap size={14} />
          <span>New Sale</span>
          <kbd className="topbar-kbd">F2</kbd>
        </button>

        {/* Sync Indicator */}
        <div className="topbar-sync-status hidden-mobile">
          {!navigator.onLine ? (
            <span className="sync-offline">● Offline</span>
          ) : pendingCount > 0 ? (
            <span className="sync-syncing">↻ Syncing...</span>
          ) : (
            <span className="sync-synced">● Synced</span>
          )}
        </div>

        <button className="icon-btn" data-tour="theme-toggle" onClick={toggleTheme} title="Toggle Theme" aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button className="icon-btn notification-btn" title="Notifications" aria-label="Notifications" onClick={() => navigate('/notifications')}>
          <Bell size={18} />
          <span className="notification-badge">3</span>
        </button>

        <div className="topbar-divider"></div>

        {/* User Profile */}
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
            <span className="user-business">{currentBusiness?.businessName || currentBusiness?.name || 'Business'}</span>
          </div>
          
          {isProfileOpen && (
            <div 
              className="profile-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-dropdown-header">
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{currentUser?.name || 'User'}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{currentUser?.email || ''}</p>
              </div>
              
              <div 
                className="profile-dropdown-item"
                onClick={() => { setIsProfileOpen(false); navigate('/settings?tab=account'); }}
              >
                <User size={16} /> Profile & Account
              </div>

              <div 
                className="profile-dropdown-item"
                onClick={() => { setIsProfileOpen(false); navigate('/settings?tab=customize'); }}
              >
                <Sparkles size={16} /> Customize (AI Settings)
              </div>
              
              <div 
                className="profile-dropdown-item"
                onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
              >
                <Settings size={16} /> All Settings
              </div>
              
              <div className="profile-dropdown-divider"></div>
              
              <div 
                className="profile-dropdown-item"
                style={{ color: 'var(--danger)' }}
                onClick={handleLogout}
              >
                <LogOut size={16} /> Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
