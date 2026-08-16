import React from 'react';

/**
 * Reusable Skeleton loader components for eliminating full-page loading states.
 */

export const Skeleton = ({ className = '', style = {} }) => {
  return (
    <div 
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`}
      style={style}
    ></div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5, className = '' }) => {
  return (
    <div className={`w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] ${className}`}>
      {/* Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-elevated)] p-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 pr-4">
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, rIndex) => (
          <div key={rIndex} className="flex p-4">
            {Array.from({ length: cols }).map((_, cIndex) => (
              <div key={cIndex} className="flex-1 pr-4 flex items-center">
                {cIndex === 0 ? (
                  <div className="flex items-center gap-3 w-full">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <Skeleton className="h-4 w-1/2" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-8 w-1/2 mb-4" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
};
