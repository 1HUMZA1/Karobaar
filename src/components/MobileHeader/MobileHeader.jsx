import React from 'react';
import { Menu, Bell, User, ArrowLeft, Search, SlidersHorizontal, Plus } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { KarobaarLogo } from '../KarobaarLogo/KarobaarLogo';
import './MobileHeader.css';

export const MobileHeader = ({ 
  title, 
  leftIcon = 'menu', 
  onLeftClick, 
  rightAction, 
  rightIcon, 
  rightOnClick,
  subtitle
}) => {
  const { toggleSidebar, currentUser, currentBusiness } = useAppContext();
  const navigate = useNavigate();
  
  const handleLeft = () => {
    if (onLeftClick) onLeftClick();
    else if (leftIcon === 'back') navigate(-1);
    else toggleSidebar();
  };
  
  return (
    <header className="k-mobile-top-header hidden-desktop">
      {/* Left Action Button */}
      <button 
        type="button"
        className="k-header-circle-btn" 
        onClick={handleLeft}
        aria-label={leftIcon === 'back' ? 'Back' : 'Menu'}
      >
        {leftIcon === 'back' ? <ArrowLeft size={19} /> : <Menu size={19} />}
      </button>
      
      {/* Center Title or Brand Logo */}
      <div className="k-header-center-info">
        {title === 'Karobaar' ? (
          <div className="k-header-brand-badge">
            <KarobaarLogo size="sm" theme="auto" layout="horizontal" showTagline={false} />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="k-header-title-text">{title}</span>
            {subtitle && <span className="k-header-subtitle-text">{subtitle}</span>}
          </div>
        )}
      </div>
      
      {/* Right Action Button */}
      <div className="k-header-right-actions">
        {rightAction === 'dashboard' ? (
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              className="k-header-circle-btn relative"
              onClick={() => navigate('/notifications')}
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="k-header-dot-badge"></span>
            </button>
            <button 
              type="button"
              className="k-header-avatar-btn"
              onClick={() => navigate('/more')}
              aria-label="Profile"
            >
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold">
                  {(currentUser?.name || currentBusiness?.name || 'K').slice(0, 1).toUpperCase()}
                </span>
              )}
            </button>
          </div>
        ) : rightIcon ? (
          <button 
            type="button"
            className={`k-header-circle-btn ${rightIcon === 'plus' ? 'k-plus-action' : ''}`} 
            onClick={rightOnClick}
            aria-label={rightIcon}
          >
            {rightIcon === 'plus' && <Plus size={18} />}
            {rightIcon === 'filter' && <SlidersHorizontal size={18} />}
            {rightIcon === 'search' && <Search size={18} />}
          </button>
        ) : (
          <div style={{ width: 38 }}></div>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;
