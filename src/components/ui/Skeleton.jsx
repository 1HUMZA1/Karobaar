import React from 'react';

/**
 * Reusable Skeleton loader components for eliminating full-page loading states.
 */

export const Skeleton = ({ className = '', style = {} }) => {
  return (
    <div 
      className={`bg-[var(--border-color)] rounded ${className}`}
      style={style}
    ></div>
  );
};

export const TableSkeleton = ({ className = '' }) => {
  return (
    <div className={`w-full p-8 flex justify-center items-center text-text-muted text-sm ${className}`}>
      Loading...
    </div>
  );
};

export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`p-6 flex justify-center items-center text-text-muted text-sm ${className}`}>
      Loading...
    </div>
  );
};
