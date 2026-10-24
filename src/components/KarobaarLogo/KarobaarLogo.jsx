import React from 'react';
import './KarobaarLogo.css';

/**
 * Karobaar Brand Logo
 * Features the signature 3-bar ascending growth chart symbol
 * Tagline: "Turn Work Into Growth."
 */
export const KarobaarLogo = ({ 
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  theme = 'dark', // 'dark' (black symbol/text on light bg) | 'light' (white symbol/text on dark bg)
  showTagline = false,
  showText = true,
  layout = 'horizontal', // 'horizontal' | 'vertical'
  className = ''
}) => {
  const isLight = theme === 'light';
  const fillColor = isLight ? '#ffffff' : '#09090b';
  const taglineColor = isLight ? 'rgba(255, 255, 255, 0.75)' : '#71717a';

  return (
    <div className={`karobaar-brand-logo ${size} ${layout} ${className}`}>
      <svg 
        className="karobaar-bars-icon" 
        viewBox="0 0 28 28" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Karobaar Logo"
      >
        {/* Left short bar */}
        <rect x="2" y="14" width="6" height="12" rx="3" fill={fillColor} />
        {/* Middle medium bar */}
        <rect x="11" y="7" width="6" height="19" rx="3" fill={fillColor} />
        {/* Right tall bar */}
        <rect x="20" y="2" width="6" height="24" rx="3" fill={fillColor} />
      </svg>
      
      {showText && (
        <div className="karobaar-text-group">
          <span className="karobaar-brand-name" style={{ color: fillColor }}>
            Karobaar
          </span>
          {showTagline && (
            <span className="karobaar-brand-tagline" style={{ color: taglineColor }}>
              Turn Work Into Growth.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KarobaarLogo;
