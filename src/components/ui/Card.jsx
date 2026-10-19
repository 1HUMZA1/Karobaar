import React from 'react';
import './Card.css';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`biz-card ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return <div className={`biz-card-header ${className}`} {...props}>{children}</div>;
};

export const CardTitle = ({ children, className = '', ...props }) => {
  return <h3 className={`biz-card-title ${className}`} {...props}>{children}</h3>;
};

export const CardContent = ({ children, className = '', ...props }) => {
  return <div className={`biz-card-content ${className}`} {...props}>{children}</div>;
};

