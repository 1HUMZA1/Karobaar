import React, { useState, useEffect } from 'react';
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
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();
  const fullText = "The Operating System\nFor Your Business.";
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [showWindowsModal, setShowWindowsModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  const triggerDownloadWindowsZip = () => {
    const a = document.createElement('a');
    a.href = './downloads/Karobaar-Windows-Flutter-App.zip';
    a.download = 'Karobaar-Windows-Flutter-App.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const triggerDownloadAndroidApk = () => {
    const a = document.createElement('a');
    a.href = './downloads/Karobaar-Android-App.apk';
    a.download = 'Karobaar-Android-App.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const triggerMockDownload = () => {
    // Generate a downloadable desktop configuration / setup launcher
    const content = `@echo off\r\nstart "" "https://1HUMZA1.github.io/Karobaar/docs/#/dashboard"\r\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Launch-Karobaar-Web.bat';
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
      <header style={{ padding: '6rem 2rem 5rem', textAlign: 'center', maxWidth: '960px', margin: '0 auto' }}>
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

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
      </header>

      {/* 3. Features Section */}
      <section id="features" style={{ padding: '5rem 2rem', backgroundColor: '#fafafa', borderTop: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px 0', color: '#09090b' }}>
              Everything your business needs to grow.
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#71717a', maxWidth: '600px', margin: '0 auto' }}>
              Built for speed, keyboard efficiency, and seamless multi-device store operations.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            
            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f4f4f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <ShoppingBag size={24} color="#09090b" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#09090b' }}>Lightning Fast POS</h3>
              <p style={{ color: '#52525b', lineHeight: 1.55, fontSize: '0.92rem', margin: 0 }}>
                Instant keyboard-optimized billing, barcode scanner input, WhatsApp receipts, and held orders. Works 100% offline.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f4f4f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Layers size={24} color="#09090b" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#09090b' }}>Live Inventory Guard</h3>
              <p style={{ color: '#52525b', lineHeight: 1.55, fontSize: '0.92rem', margin: 0 }}>
                Automatic low-stock warnings, purchase order dispatch, supplier ledger tracking, and multi-warehouse management.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f4f4f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Users size={24} color="#09090b" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#09090b' }}>Staff & Internal Tasks</h3>
              <p style={{ color: '#52525b', lineHeight: 1.55, fontSize: '0.92rem', margin: 0 }}>
                Internal task assignment, attendance kiosk mode, role permissions (Cashier, Manager, Admin), and shift reconciliation.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f4f4f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <BarChart2 size={24} color="#09090b" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#09090b' }}>Financial Reports & GST</h3>
              <p style={{ color: '#52525b', lineHeight: 1.55, fontSize: '0.92rem', margin: 0 }}>
                Real-time gross profit calculation, expense categorization, daily register closure summaries, and one-click export.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f4f4f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Cpu size={24} color="#09090b" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#09090b' }}>Jarvis Voice Co-Pilot</h3>
              <p style={{ color: '#52525b', lineHeight: 1.55, fontSize: '0.92rem', margin: 0 }}>
                Speak natural commands: "Hey Jarvis, what were today's sales?" or "Create task: Restock milk tomorrow".
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f4f4f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <RefreshCw size={24} color="#09090b" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#09090b' }}>Multi-Terminal Sync</h3>
              <p style={{ color: '#52525b', lineHeight: 1.55, fontSize: '0.92rem', margin: 0 }}>
                Operate multiple cash registers simultaneously with instant cloud synchronization between PC, laptops, and mobile registers.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Platforms Section (#platforms) */}
      <section id="platforms" style={{ padding: '6rem 2rem', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem', color: '#09090b' }}>
          Available on every screen you use.
        </h2>
        <p style={{ fontSize: '1.05rem', color: '#71717a', maxWidth: '640px', margin: '0 auto 3.5rem auto' }}>
          Run Karobaar natively on your desktop counter, in your browser, or on mobile registers.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', textAlign: 'left' }}>
          
          <div style={{ border: '1.5px solid #e4e4e7', borderRadius: '18px', padding: '2rem', background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <Monitor size={28} color="#09090b" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Windows Desktop</h3>
            </div>
            <p style={{ color: '#52525b', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Full standalone app for Windows 10 & 11. Direct ESC/POS thermal receipt printing, USB barcode scanners, and persistent offline database.
            </p>
            <button 
              type="button"
              onClick={handleDownloadWindows}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #09090b', background: '#09090b', color: '#ffffff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} /> Download Installer
            </button>
          </div>

          <div style={{ border: '1.5px solid #e4e4e7', borderRadius: '18px', padding: '2rem', background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <Globe size={28} color="#09090b" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Cloud Web PWA</h3>
            </div>
            <p style={{ color: '#52525b', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Access your store dashboard from any browser (Chrome, Edge, Safari). Zero installation needed, automatic background updates.
            </p>
            <button 
              type="button"
              onClick={handleLaunchApp}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e4e4e7', background: '#f4f4f5', color: '#09090b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={14} /> Launch in Browser
            </button>
          </div>

          <div style={{ border: '1.5px solid #e4e4e7', borderRadius: '18px', padding: '2rem', background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <Smartphone size={28} color="#09090b" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Android & Mobile</h3>
            </div>
            <p style={{ color: '#52525b', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Optimized touch interface for tablets and smartphones. Camera barcode scanning, mobile orders, and remote owner monitoring.
            </p>
            <button 
              type="button"
              onClick={handleLaunchApp}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e4e4e7', background: '#f4f4f5', color: '#09090b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Smartphone size={14} /> Open Mobile App
            </button>
          </div>

        </div>
      </section>

      {/* 5. Jarvis AI Section (#ai) */}
      <section id="ai" style={{ padding: '5rem 2rem', backgroundColor: '#09090b', color: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '5px 14px', 
            borderRadius: '9999px', 
            backgroundColor: '#18181b', 
            border: '1px solid #27272a',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#fafafa',
            marginBottom: '1.5rem'
          }}>
            <Sparkles size={14} /> Autonomous Business Intelligence
          </div>

          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: '#ffffff' }}>
            Meet Jarvis — Your AI Store Co-Pilot
          </h2>

          <p style={{ fontSize: '1.15rem', color: '#a1a1aa', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto 2.5rem auto' }}>
            Jarvis reads your live store inventory, calculates daily profit, alerts you when supplies run low, and even executes actions by voice.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
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
                gap: '8px'
              }}
            >
              Try Jarvis AI Live <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Security Section (#security) */}
      <section id="security" style={{ padding: '6rem 2rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <Shield size={44} color="#09090b" style={{ margin: '0 auto 1.25rem auto' }} />
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '1.25rem', letterSpacing: '-0.03em', color: '#09090b' }}>
          Enterprise Architecture & Security.
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#52525b', marginBottom: '3rem', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto 3rem auto' }}>
          Karobaar uses cryptographic multi-tenant separation. Your sales records, customers, and financials are private, encrypted in transit and at rest, and synced across devices in real-time.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, color: '#18181b' }}>
            <CheckCircle2 size={18} color="#10b981" /> Offline-First Storage
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, color: '#18181b' }}>
            <CheckCircle2 size={18} color="#10b981" /> Encrypted Backups
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, color: '#18181b' }}>
            <CheckCircle2 size={18} color="#10b981" /> Multi-Role Access Control
          </div>
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
                onClick={triggerDownloadWindowsZip}
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
                <Download size={16} /> Download Windows App (.zip)
              </button>

              <button 
                type="button"
                onClick={triggerDownloadAndroidApk}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#18181b',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Download size={16} /> Download Android App (.apk)
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
