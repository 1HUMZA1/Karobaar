import React from 'react';
import './Card.css';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`biz-card ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return <div className={`biz-card-header ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }) => {
  return <h3 className={`biz-card-title ${className}`}>{children}</h3>;
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={`biz-card-content ${className}`}>{children}</div>;
};
