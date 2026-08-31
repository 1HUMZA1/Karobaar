import React from 'react';
import { Menu, Bell, User, ArrowLeft, Search, SlidersHorizontal, Plus } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import './MobileHeader.css';

export const MobileHeader = ({ title, leftIcon = 'menu', onLeftClick, rightAction, rightIcon, rightOnClick }) => {
  const { toggleSidebar, currentUser } = useAppContext();
  const navigate = useNavigate();
  
  const handleLeft = () => {
    if (onLeftClick) onLeftClick();
    else if (leftIcon === 'back') navigate(-1);
    else toggleSidebar();
  };
  
  return (
    <div className="mobile-header hidden-desktop">
      <button className="mobile-header-btn" onClick={handleLeft}>
        {leftIcon === 'back' ? <ArrowLeft size={22} /> : <Menu size={22} />}
      </button>
      
      <div className="mobile-header-title">
        {title === 'Karobaar' ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--primary-color)] text-[var(--bg-primary)] flex items-center justify-center font-extrabold text-sm tracking-tighter">K</div>
            <span className="font-extrabold text-xl tracking-tight text-[var(--text-main)]">Karobaar</span>
          </div>
        ) : (
          <span className="font-bold text-lg text-[var(--text-main)]">{title}</span>
        )}
      </div>
      
      <div className="mobile-header-right">
        {rightAction === 'dashboard' ? (
          <div className="flex items-center gap-3">
            <button className="mobile-header-btn relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[var(--danger)] rounded-full border border-[var(--bg-card)]"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[var(--bg-hover)] overflow-hidden border border-[var(--border-color)]">
              {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" /> : <User size={16} className="m-2 text-[var(--text-muted)]"/>}
            </div>
          </div>
        ) : rightIcon ? (
          <button className={`mobile-header-btn right-custom-btn ${rightIcon === 'plus' ? 'plus-btn' : ''}`} onClick={rightOnClick}>
            {rightIcon === 'plus' && <Plus size={20} />}
            {rightIcon === 'filter' && <SlidersHorizontal size={20} />}
            {rightIcon === 'search' && <Search size={20} />}
          </button>
        ) : <div style={{width: 32}}></div>}
      </div>
    </div>
  );
};
