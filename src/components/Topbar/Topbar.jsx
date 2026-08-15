import React from 'react';
import { Menu, Search, Sun, Moon, Bell, User, LogOut } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/databaseService';
import './Topbar.css';

const Topbar = () => {
  const { toggleSidebar, theme, toggleTheme, userRole, currentUser, logout } = useAppContext();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const navigate = useNavigate();

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
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        
        <div className="search-container relative">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search products, customers..." 
            className="search-input"
            value={searchQuery}
            onChange={handleSearch}
          />
          {searchQuery.length > 2 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50 overflow-hidden">
              {searchResults.length > 0 ? (
                searchResults.map(res => (
                  <div 
                    key={`${res._type}-${res.id}`} 
                    className="p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm"
                    onClick={() => handleResultClick(res._path)}
                  >
                    <span className="font-semibold text-primary">{res._type}:</span> {res.name}
                  </div>
                ))
              ) : (
                <div className="p-3 text-sm text-slate-500">No results found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        
        <button className="icon-btn notification-btn" title="Notifications" onClick={() => navigate('/notifications')}>
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        <div className="user-profile group relative cursor-pointer">
          <div className="avatar">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="User" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="user-info">
            <span className="user-name">{currentUser?.name || 'User'}</span>
            <span className="user-role">{userRole}</span>
          </div>
          
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-md shadow-lg py-1 hidden group-hover:block border border-gray-100 dark:border-dark-border z-50">
            <div 
              className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-bg flex items-center gap-2 cursor-pointer transition-colors"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Sign Out
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
