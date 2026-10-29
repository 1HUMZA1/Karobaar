import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  BarChart2, 
  Shield, 
  Smartphone, 
  Monitor, 
  Cloud, 
  Users, 
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Download,
  ExternalLink,
  X,
  Layers,
  Cpu,
  RefreshCw,
  Globe,
  Lock,
  Zap,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

/**
 * High-performance 3D Tilt Card Component
 * Uses direct DOM manipulation & GPU-accelerated CSS transforms
 * for silky-smooth 60/120 FPS interaction with 0 React re-renders while moving.
 */
const TiltCard = ({
  children,
  className = '',
  style = {},
  maxTilt = 10,
  scale = 1.025,
  perspective = 1000,
  glare = true,
  onClick,
  ...props
}) => {
  const cardRef = useRef(null);
  const glareRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const percentX = (x - centerX) / centerX;
    const percentY = (y - centerY) / centerY;

    const tiltX = -percentY * maxTilt;
    const tiltY = percentX * maxTilt;

    card.style.transform = `perspective(${perspective}px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;
    card.style.transition = 'transform 0.08s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease';

    if (glare && glareRef.current) {
      glareRef.current.style.opacity = '1';
      glareRef.current.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 80%)`;
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    card.style.transition = 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.55s cubic-bezier(0.16, 1, 0.3, 1)';
    card.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;

    if (glare && glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-card ${className}`}
      style={{
        ...style,
        position: 'relative',
        transformStyle: 'preserve-3d',
        willChange: 'transform'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      {...props}
    >
      {glare && (
        <div
          ref={glareRef}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            zIndex: 10
          }}
        />
      )}
      {children}
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const fullText = "The Operating System\nFor Your Business.";
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [showWindowsModal, setShowWindowsModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [heroActiveTab, setHeroActiveTab] = useState('pos'); // 'pos' or 'dashboard'

  useEffect(() => {
    document.title = "Karobaar — The Operating System For Your Business";
    
    // Check if user has an active session
    try {
      const session = localStorage.getItem('karobaar_session_user');
      if (session) {
        setIsLoggedIn(true);
      }
    } catch (_) {}

    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 55);
    
    const cursorInterval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);

    return () => {
      clearInterval(typingInterval);
      clearInterval(cursorInterval);
      document.title = "Karobaar";
    };
  }, []);

  // Smooth scroll helper that NEVER modifies window.location.hash (prevents HashRouter crash)
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLaunchApp = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleDownloadWindows = () => {
    setShowWindowsModal(true);
  };

  const triggerMockDownload = () => {
    // Generate a downloadable desktop configuration / setup launcher
    const content = `[Karobaar Desktop Application]\nVersion=2.0.0\nChannel=Stable\nEnvironment=Production\nOfflineSync=Enabled\nHardwarePrint=Ready\nTimestamp=${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Karobaar-Windows-v2.0.0-Launcher.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#09090b', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      
      {/* 1. Header Navigation */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.25rem 3rem', 
        borderBottom: '1px solid #e4e4e7',
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 100
      }}>
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          title="Karobaar Home"
        >
          <div style={{ 
            width: '36px', 
            height: '36px', 
            backgroundColor: '#09090b', 
            color: '#ffffff', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 800, 
            fontSize: '1.25rem',
            letterSpacing: '-0.02em',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            K
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#09090b' }}>
            Karobaar
          </span>
        </div>

        {/* Section Navigation Buttons (No # hrefs to prevent HashRouter collisions) */}
        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={() => scrollToSection('features')} 
            style={{ background: 'none', border: 'none', color: '#52525b', fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', transition: 'color 0.15s ease' }}
          >
            Features
          </button>
          <button 
            type="button"
            onClick={() => scrollToSection('platforms')} 
            style={{ background: 'none', border: 'none', color: '#52525b', fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', transition: 'color 0.15s ease' }}
          >
            Platforms
          </button>
          <button 
            type="button"
            onClick={() => scrollToSection('ai')} 
            style={{ background: 'none', border: 'none', color: '#52525b', fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', transition: 'color 0.15s ease' }}
          >
            Jarvis AI
          </button>
          <button 
            type="button"
            onClick={() => scrollToSection('security')} 
            style={{ background: 'none', border: 'none', color: '#52525b', fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', transition: 'color 0.15s ease' }}
          >
            Security
          </button>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            type="button"
            onClick={handleLaunchApp}
            style={{ 
              backgroundColor: '#09090b', 
              color: '#ffffff', 
              border: 'none', 
              padding: '0.65rem 1.25rem', 
              borderRadius: '8px', 
              fontWeight: 700, 
              fontSize: '0.88rem',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.15s ease'
            }}
          >
            {isLoggedIn ? 'Open Dashboard' : 'Sign In'} <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header style={{ padding: '5.5rem 2rem 3rem', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '6px 14px', 
          borderRadius: '9999px', 
          backgroundColor: '#f4f4f5', 
          border: '1px solid #e4e4e7',
          fontSize: '0.82rem',
          fontWeight: 700,
          color: '#18181b',
          marginBottom: '2rem'
        }}>
          <Sparkles size={14} color="#09090b" />
          <span>Karobaar 2.0 with Autonomous Jarvis Voice AI</span>
        </div>

        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 6vw, 4.25rem)', 
          fontWeight: 800, 
          lineHeight: 1.1, 
          letterSpacing: '-0.04em', 
          marginBottom: '1.5rem', 
          minHeight: '140px',
          color: '#09090b'
        }}>
          {typedText.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index === 0 && typedText.includes('\n') && <br />}
            </React.Fragment>
          ))}
          <span style={{ opacity: cursorVisible ? 1 : 0, fontWeight: 300, color: '#71717a' }}>|</span>
        </h1>

        <p style={{ 
          fontSize: '1.2rem', 
          color: '#52525b', 
          marginBottom: '2.5rem', 
          maxWidth: '680px', 
          margin: '0 auto 2.5rem auto', 
          lineHeight: 1.6,
          fontWeight: 450
        }}>
          Complete POS billing, real-time inventory tracking, staff payroll, internal tasks, and autonomous voice AI for cafes, supermarkets, and retail stores.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
          <button 
            type="button"
            onClick={handleLaunchApp}
            style={{ 
              backgroundColor: '#09090b', 
              color: '#ffffff', 
              border: 'none', 
              padding: '0.875rem 2rem', 
              borderRadius: '10px', 
              fontSize: '1.05rem', 
              fontWeight: 700, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
            }}
          >
            Launch Web App <ArrowRight size={18} />
          </button>

          <button 
            type="button"
            onClick={handleDownloadWindows}
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#09090b', 
              border: '1px solid #d4d4d8', 
              padding: '0.875rem 1.75rem', 
              borderRadius: '10px', 
              fontSize: '1.05rem', 
              fontWeight: 600, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.65rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <Monitor size={18} /> Download for Windows
          </button>
        </div>

        {/* 🌟 HEROIC APP SHOWCASE: 3D Tilted Flagship Preview Window */}
        <div style={{ position: 'relative', maxWidth: '1160px', margin: '0 auto', padding: '0 0.5rem' }}>
          
          {/* Ambient Lighting Halo */}
          <div className="hero-glow-backdrop" />

          {/* 3D Tilted App Frame Container */}
          <TiltCard
            maxTilt={4}
            scale={1.01}
            perspective={1400}
            glare={true}
            style={{
              borderRadius: '20px',
              border: '1.5px solid #e4e4e7',
              backgroundColor: '#ffffff',
              boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.16), 0 10px 30px -5px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            {/* Desktop Chrome Topbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.25rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              userSelect: 'none'
            }}>
              {/* Traffic Light Dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              </div>

              {/* View Switcher Tabs (POS vs Dashboard) */}
              <div style={{ 
                display: 'inline-flex', 
                backgroundColor: '#e2e8f0', 
                padding: '3px', 
                borderRadius: '9px',
                gap: '4px'
              }}>
                <button
                  type="button"
                  className={`hero-tab-btn ${heroActiveTab === 'pos' ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setHeroActiveTab('pos'); }}
                >
                  <ShoppingBag size={14} /> POS Cashier
                </button>
                <button
                  type="button"
                  className={`hero-tab-btn ${heroActiveTab === 'dashboard' ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setHeroActiveTab('dashboard'); }}
                >
                  <BarChart2 size={14} /> Store Analytics
                </button>
              </div>

              {/* Status Indicator & Launch Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
                  <span className="live-pulse-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                  <span style={{ display: 'inline-block' }}>Live Terminal Active</span>
                </div>
                <button
                  type="button"
                  onClick={handleLaunchApp}
                  style={{
                    backgroundColor: '#09090b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Open App <ExternalLink size={11} />
                </button>
              </div>
            </div>

            {/* Application Screen Preview */}
            <div className="hero-preview-container" style={{ position: 'relative', overflow: 'hidden' }} onClick={handleLaunchApp}>
              <img
                src={heroActiveTab === 'pos' ? '/hero_pos.png' : '/hero_dashboard.png'}
                alt="Karobaar App Interface"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  transition: 'opacity 0.25s ease'
                }}
              />

              {/* Floating Bottom Hover Callout */}
              <div className="hero-preview-overlay">
                <div style={{
                  backgroundColor: 'rgba(9, 9, 11, 0.88)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>
                    Experience Karobaar live in your browser
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleLaunchApp(); }}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#09090b',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    Launch Now <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </header>

      {/* 3. Features Section (#features) with Smooth 3D Tilted Boxes */}
      <section id="features" style={{ padding: '4rem 2rem 4.5rem', backgroundColor: '#fafafa', borderTop: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px 0', color: '#09090b' }}>
              Everything your business needs to grow.
            </h2>
            <p className="text-balanced" style={{ fontSize: '1.05rem', color: '#71717a', maxWidth: '780px', margin: '0 auto', lineHeight: 1.5 }}>
              Built for speed, keyboard efficiency, and seamless multi-device store operations.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            
            {/* Card 1: Lightning Fast POS */}
            <TiltCard 
              maxTilt={9} 
              scale={1.025} 
              perspective={1000}
              style={{ backgroundColor: '#ffffff', padding: '1.6rem 1.75rem', borderRadius: '18px', border: '1px solid #e4e4e7', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
            >
              <div className="tilt-parallax-icon" style={{ width: '42px', height: '42px', backgroundColor: '#f4f4f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <ShoppingBag size={22} color="#09090b" />
              </div>
              <h3 className="tilt-parallax-title" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.45rem', color: '#09090b' }}>
                Lightning Fast POS
              </h3>
              <p className="tilt-parallax-text text-balanced" style={{ color: '#52525b', lineHeight: 1.5, fontSize: '0.9rem', margin: 0 }}>
                Instant keyboard billing, barcode scanner input, WhatsApp receipts, and offline mode.
              </p>
            </TiltCard>

            {/* Card 2: Live Inventory Guard */}
            <TiltCard 
              maxTilt={9} 
              scale={1.025} 
              perspective={1000}
              style={{ backgroundColor: '#ffffff', padding: '1.6rem 1.75rem', borderRadius: '18px', border: '1px solid #e4e4e7', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
            >
              <div className="tilt-parallax-icon" style={{ width: '42px', height: '42px', backgroundColor: '#f4f4f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Layers size={22} color="#09090b" />
              </div>
              <h3 className="tilt-parallax-title" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.45rem', color: '#09090b' }}>
                Live Inventory Guard
              </h3>
              <p className="tilt-parallax-text text-balanced" style={{ color: '#52525b', lineHeight: 1.5, fontSize: '0.9rem', margin: 0 }}>
                Automatic low-stock alerts, purchase orders, supplier ledgers, and multi-warehouse sync.
              </p>
            </TiltCard>

            {/* Card 3: Staff & Internal Tasks */}
            <TiltCard 
              maxTilt={9} 
              scale={1.025} 
              perspective={1000}
              style={{ backgroundColor: '#ffffff', padding: '1.6rem 1.75rem', borderRadius: '18px', border: '1px solid #e4e4e7', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
            >
              <div className="tilt-parallax-icon" style={{ width: '42px', height: '42px', backgroundColor: '#f4f4f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Users size={22} color="#09090b" />
              </div>
              <h3 className="tilt-parallax-title" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.45rem', color: '#09090b' }}>
                Staff & Internal Tasks
              </h3>
              <p className="tilt-parallax-text text-balanced" style={{ color: '#52525b', lineHeight: 1.5, fontSize: '0.9rem', margin: 0 }}>
                Internal task assignments, attendance kiosk mode, role permissions, and shift reports.
              </p>
            </TiltCard>

            {/* Card 4: Financial Reports & GST */}
            <TiltCard 
              maxTilt={9} 
              scale={1.025} 
              perspective={1000}
              style={{ backgroundColor: '#ffffff', padding: '1.6rem 1.75rem', borderRadius: '18px', border: '1px solid #e4e4e7', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
            >
              <div className="tilt-parallax-icon" style={{ width: '42px', height: '42px', backgroundColor: '#f4f4f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <BarChart2 size={22} color="#09090b" />
              </div>
              <h3 className="tilt-parallax-title" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.45rem', color: '#09090b' }}>
                Financial Reports & GST
              </h3>
              <p className="tilt-parallax-text text-balanced" style={{ color: '#52525b', lineHeight: 1.5, fontSize: '0.9rem', margin: 0 }}>
                Real-time gross profit, expense categorization, daily register closure, and one-click export.
              </p>
            </TiltCard>

            {/* Card 5: Jarvis Voice Co-Pilot */}
            <TiltCard 
              maxTilt={9} 
              scale={1.025} 
              perspective={1000}
              style={{ backgroundColor: '#ffffff', padding: '1.6rem 1.75rem', borderRadius: '18px', border: '1px solid #e4e4e7', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
            >
              <div className="tilt-parallax-icon" style={{ width: '42px', height: '42px', backgroundColor: '#f4f4f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Cpu size={22} color="#09090b" />
              </div>
              <h3 className="tilt-parallax-title" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.45rem', color: '#09090b' }}>
                Jarvis Voice Co-Pilot
              </h3>
              <p className="tilt-parallax-text text-balanced" style={{ color: '#52525b', lineHeight: 1.5, fontSize: '0.9rem', margin: 0 }}>
                Hands-free voice commands for live sales, inventory queries, and instant task creation.
              </p>
            </TiltCard>

            {/* Card 6: Multi-Terminal Sync */}
            <TiltCard 
              maxTilt={9} 
              scale={1.025} 
              perspective={1000}
              style={{ backgroundColor: '#ffffff', padding: '1.6rem 1.75rem', borderRadius: '18px', border: '1px solid #e4e4e7', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
            >
              <div className="tilt-parallax-icon" style={{ width: '42px', height: '42px', backgroundColor: '#f4f4f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <RefreshCw size={22} color="#09090b" />
              </div>
              <h3 className="tilt-parallax-title" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.45rem', color: '#09090b' }}>
                Multi-Terminal Sync
              </h3>
              <p className="tilt-parallax-text text-balanced" style={{ color: '#52525b', lineHeight: 1.5, fontSize: '0.9rem', margin: 0 }}>
                Simultaneous multi-counter sync between desktop PC counters, mobile tablets, and laptops.
              </p>
            </TiltCard>

          </div>
        </div>
      </section>

      {/* 4. Platforms Section (#platforms) with Smooth 3D Tilted Boxes */}
      <section id="platforms" style={{ padding: '4.5rem 2rem 4rem', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.85rem', color: '#09090b' }}>
          Available on every screen you use.
        </h2>
        <p className="text-balanced" style={{ fontSize: '1.05rem', color: '#71717a', maxWidth: '680px', margin: '0 auto 2.5rem auto', lineHeight: 1.5 }}>
          Run Karobaar natively on your desktop counter, in your browser, or on mobile registers.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
          
          {/* Platform 1: Windows Desktop */}
          <TiltCard 
            maxTilt={9} 
            scale={1.025} 
            perspective={1000}
            style={{ border: '1.5px solid #e4e4e7', borderRadius: '18px', padding: '1.6rem 1.75rem', background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
          >
            <div className="tilt-parallax-icon" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.85rem' }}>
              <Monitor size={26} color="#09090b" />
              <h3 className="tilt-parallax-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Windows Desktop
              </h3>
            </div>
            <p className="tilt-parallax-text text-balanced" style={{ color: '#52525b', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Full standalone app for Windows 10 & 11. Direct ESC/POS thermal printing, barcode scanners, and persistent offline storage.
            </p>
            <button 
              type="button"
              className="tilt-parallax-btn"
              onClick={handleDownloadWindows}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #09090b', background: '#09090b', color: '#ffffff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
            >
              <Download size={14} /> Download Installer
            </button>
          </TiltCard>

          {/* Platform 2: Cloud Web PWA */}
          <TiltCard 
            maxTilt={9} 
            scale={1.025} 
            perspective={1000}
            style={{ border: '1.5px solid #e4e4e7', borderRadius: '18px', padding: '1.6rem 1.75rem', background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
          >
            <div className="tilt-parallax-icon" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.85rem' }}>
              <Globe size={26} color="#09090b" />
              <h3 className="tilt-parallax-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Cloud Web PWA
              </h3>
            </div>
            <p className="tilt-parallax-text text-balanced" style={{ color: '#52525b', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Access your store dashboard from any browser (Chrome, Edge, Safari). Zero setup needed with automatic background updates.
            </p>
            <button 
              type="button"
              className="tilt-parallax-btn"
              onClick={handleLaunchApp}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e4e4e7', background: '#f4f4f5', color: '#09090b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
            >
              <ExternalLink size={14} /> Launch in Browser
            </button>
          </TiltCard>

          {/* Platform 3: Android & Mobile */}
          <TiltCard 
            maxTilt={9} 
            scale={1.025} 
            perspective={1000}
            style={{ border: '1.5px solid #e4e4e7', borderRadius: '18px', padding: '1.6rem 1.75rem', background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
          >
            <div className="tilt-parallax-icon" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.85rem' }}>
              <Smartphone size={26} color="#09090b" />
              <h3 className="tilt-parallax-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Android & Mobile
              </h3>
            </div>
            <p className="tilt-parallax-text text-balanced" style={{ color: '#52525b', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Optimized touch interface for tablets and smartphones. Camera barcode scanning, mobile orders, and remote monitoring.
            </p>
            <button 
              type="button"
              className="tilt-parallax-btn"
              onClick={handleLaunchApp}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e4e4e7', background: '#f4f4f5', color: '#09090b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
            >
              <Smartphone size={14} /> Open Mobile App
            </button>
          </TiltCard>

        </div>
      </section>

      {/* 5. Jarvis AI Section (#ai) with Smooth 3D Tilted Showcase */}
      <section id="ai" style={{ padding: '5.5rem 2rem', backgroundColor: '#09090b', color: '#ffffff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          <TiltCard
            maxTilt={6}
            scale={1.02}
            perspective={1200}
            style={{
              padding: '3rem 2rem',
              borderRadius: '24px',
              backgroundColor: 'rgba(24, 24, 27, 0.65)',
              border: '1px solid #27272a',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '5px 14px', 
              borderRadius: '9999px', 
              backgroundColor: '#18181b', 
              border: '1px solid #3f3f46',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#fafafa',
              marginBottom: '1.5rem'
            }}>
              <Sparkles size={14} /> Autonomous Business Intelligence
            </div>

            <h2 className="tilt-parallax-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: '#ffffff' }}>
              Meet Jarvis — Your AI Store Co-Pilot
            </h2>

            <p className="tilt-parallax-text" style={{ fontSize: '1.15rem', color: '#a1a1aa', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto 2.5rem auto' }}>
              Jarvis reads your live store inventory, calculates daily profit, alerts you when supplies run low, and even executes actions by voice.
            </p>

            <div className="tilt-parallax-btn" style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button 
                type="button"
                onClick={handleLaunchApp}
                style={{ 
                  backgroundColor: '#ffffff', 
                  color: '#09090b', 
                  border: 'none', 
                  padding: '0.875rem 2rem', 
                  borderRadius: '10px', 
                  fontWeight: 700, 
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(255, 255, 255, 0.15)'
                }}
              >
                Try Jarvis AI Live <ArrowRight size={16} />
              </button>
            </div>
          </TiltCard>

        </div>
      </section>

      {/* 6. Security Section (#security) with Smooth 3D Tilted Feature Pills */}
      <section id="security" style={{ padding: '6rem 2rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <Shield size={44} color="#09090b" style={{ margin: '0 auto 1.25rem auto' }} />
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '1.25rem', letterSpacing: '-0.03em', color: '#09090b' }}>
          Enterprise Architecture & Security.
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#52525b', marginBottom: '3rem', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto 3rem auto' }}>
          Karobaar uses cryptographic multi-tenant separation. Your sales records, customers, and financials are private, encrypted in transit and at rest, and synced across devices in real-time.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <TiltCard maxTilt={8} scale={1.04} className="security-pill-card">
            <CheckCircle2 size={18} color="#10b981" /> 
            <span>Offline-First Storage</span>
          </TiltCard>

          <TiltCard maxTilt={8} scale={1.04} className="security-pill-card">
            <CheckCircle2 size={18} color="#10b981" /> 
            <span>Encrypted Backups</span>
          </TiltCard>

          <TiltCard maxTilt={8} scale={1.04} className="security-pill-card">
            <CheckCircle2 size={18} color="#10b981" /> 
            <span>Multi-Role Access Control</span>
          </TiltCard>
        </div>
      </section>

      {/* 7. Footer */}
      <footer style={{ backgroundColor: '#09090b', color: '#ffffff', padding: '4rem 2rem 2.5rem', textAlign: 'center', borderTop: '1px solid #27272a' }}>
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ 
            width: '44px', 
            height: '44px', 
            backgroundColor: '#ffffff', 
            color: '#09090b', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 800, 
            fontSize: '1.5rem', 
            margin: '0 auto 1.5rem auto',
            cursor: 'pointer'
          }}
          title="Back to Top"
        >
          K
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#ffffff' }}>
          Ready to transform your business?
        </h3>
        <button 
          type="button"
          onClick={handleLaunchApp}
          style={{ backgroundColor: '#ffffff', color: '#09090b', border: 'none', padding: '0.875rem 2.5rem', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: '2.5rem' }}
        >
          {isLoggedIn ? 'Go to Dashboard' : 'Get Started For Free'}
        </button>

        <div style={{ borderTop: '1px solid #27272a', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1000px', margin: '0 auto', fontSize: '0.82rem', color: '#71717a', flexWrap: 'wrap', gap: '1rem' }}>
          <span>© {new Date().getFullYear()} Karobaar OS. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <button type="button" onClick={() => scrollToSection('features')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.82rem' }}>Features</button>
            <button type="button" onClick={() => scrollToSection('platforms')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.82rem' }}>Platforms</button>
            <button type="button" onClick={() => scrollToSection('security')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.82rem' }}>Security</button>
          </div>
        </div>
      </footer>

      {/* Windows Download Modal */}
      {showWindowsModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(9, 9, 11, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.25rem'
          }}
          onClick={() => setShowWindowsModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e4e4e7',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={22} color="#09090b" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Karobaar for Windows</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowWindowsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: '#52525b', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Run Karobaar natively on your Windows counter. Includes automatic ESC/POS thermal printer detection, barcode scanner support, and offline-first database.
            </p>

            <div style={{ backgroundColor: '#f4f4f5', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#71717a' }}>Version:</span>
                <span style={{ fontWeight: 700, color: '#09090b' }}>v2.0.0 (64-bit)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#71717a' }}>System:</span>
                <span style={{ fontWeight: 600, color: '#09090b' }}>Windows 10 / 11</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#71717a' }}>Offline Database:</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>Supported</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                type="button"
                onClick={triggerMockDownload}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#09090b',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Download size={16} /> Download Launcher (.bat)
              </button>

              <button 
                type="button"
                onClick={() => { setShowWindowsModal(false); handleLaunchApp(); }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#f4f4f5',
                  color: '#09090b',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  border: '1px solid #e4e4e7',
                  cursor: 'pointer'
                }}
              >
                Use Cloud Web Version Instead
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Landing;
