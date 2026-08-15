import React from 'react';
import './Input.css';

export const Input = ({ 
  label, 
  error, 
  className = '', 
  fullWidth = true,
  icon,
  ...props 
}) => {
  return (
    <div className={`biz-input-wrapper ${fullWidth ? 'full-width' : ''} ${className}`}>
      {label && <label className="biz-input-label">{label}</label>}
      <div className="biz-input-container">
        {icon && <span className="biz-input-icon">{icon}</span>}
        <input 
          className={`biz-input ${error ? 'error' : ''} ${icon ? 'has-icon' : ''}`}
          {...props} 
        />
      </div>
      {error && <span className="biz-input-error-text">{error}</span>}
    </div>
  );
};
