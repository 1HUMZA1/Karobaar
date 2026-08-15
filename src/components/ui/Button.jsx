import React from 'react';
import './Button.css';

export const Button = ({ 
  children, 
  variant = 'primary', // primary, secondary, outline, danger, ghost
  size = 'md', // sm, md, lg
  className = '', 
  fullWidth = false,
  icon,
  ...props 
}) => {
  const btnClass = `biz-btn biz-btn-${variant} biz-btn-${size} ${fullWidth ? 'biz-btn-full' : ''} ${className}`;
  
  return (
    <button className={btnClass} {...props}>
      {icon && <span className="biz-btn-icon">{icon}</span>}
      {children}
    </button>
  );
};
