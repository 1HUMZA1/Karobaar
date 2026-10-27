import React from 'react';
import './KarobaarLogo.css';

/**
 * Karobaar Brand Logo
 * Features the signature "K" emblem in a minimalist rounded square
 * Tagline: "Turn Work Into Growth."
 */
export const KarobaarLogo = ({ 
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  theme = 'auto', // 'auto' (adapts to dark/light) | 'dark' (black on light) | 'light' (white on dark)
  showTagline = false,
  showText = true,
  layout = 'horizontal', // 'horizontal' | 'vertical'
  className = ''
}) => {
  // Pure monochrome adaptive theme: auto uses CSS var(--text-main) for perfect contrast in both dark & light modes
  const isLight = theme === 'light';
  const fillColor = theme === 'light' 
    ? '#ffffff' 
    : theme === 'dark' 
    ? '#09090b' 
    : 'var(--text-main, #ffffff)';
  const taglineColor = theme === 'light' 
    ? 'rgba(255, 255, 255, 0.75)' 
    : theme === 'dark' 
    ? '#71717a' 
    : 'var(--text-secondary, #a1a1aa)';

  const badgeDimensions = {
    sm: { box: 28, radius: 7, fontSize: '0.95rem', border: 2 },
    md: { box: 38, radius: 9, fontSize: '1.25rem', border: 2.5 },
    lg: { box: 48, radius: 12, fontSize: '1.65rem', border: 3 },
    xl: { box: 64, radius: 16, fontSize: '2.2rem', border: 3.5 }
  }[size] || { box: 38, radius: 9, fontSize: '1.25rem', border: 2.5 };

  return (
    <div className={`karobaar-brand-logo ${size} ${layout} ${className}`}>
      {/* Signature "K" Logo Emblem */}
      <div 
        className="karobaar-k-emblem"
        style={{
          width: `${badgeDimensions.box}px`,
          height: `${badgeDimensions.box}px`,
          borderRadius: `${badgeDimensions.radius}px`,
          border: `${badgeDimensions.border}px solid ${fillColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: fillColor,
          fontWeight: 800,
          fontSize: badgeDimensions.fontSize,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          userSelect: 'none',
          flexShrink: 0,
          boxShadow: isLight ? '0 4px 16px rgba(255,255,255,0.08)' : '0 2px 8px rgba(0,0,0,0.06)'
        }}
        aria-label="Karobaar K Logo"
      >
        K
      </div>
      
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
