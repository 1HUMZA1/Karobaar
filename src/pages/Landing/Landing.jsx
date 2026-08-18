import React, { useState, useEffect } from 'react';
import { ArrowRight, BarChart2, Shield, Smartphone, Monitor, Cloud, Users, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();
  const fullText = "The Operating System\nFor Your Business.";
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    document.title = "Karobaar Website";
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 60);
    
    const cursorInterval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);

    return () => {
      clearInterval(typingInterval);
      clearInterval(cursorInterval);
      document.title = "Karobaar"; // Restore default
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 4rem', borderBottom: '1px solid #eaeaea' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#000000', color: '#ffffff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>
            K
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Karobaar</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontWeight: 500 }}>
          <a href="#features" style={{ color: '#666', textDecoration: 'none' }}>Features</a>
          <a href="#platforms" style={{ color: '#666', textDecoration: 'none' }}>Platforms</a>
          <a href="#security" style={{ color: '#666', textDecoration: 'none' }}>Security</a>
        </div>
        <button 
          onClick={() => navigate('/login')}
          style={{ backgroundColor: '#000000', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          Sign In <ArrowRight size={16} />
        </button>
      </nav>

      {/* Hero Section */}
      <header style={{ padding: '6rem 4rem', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '1.5rem', minHeight: '160px' }}>
          {typedText.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index === 0 && typedText.includes('\n') && <br />}
            </React.Fragment>
          ))}
          <span style={{ opacity: cursorVisible ? 1 : 0, fontWeight: 300 }}>|</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem auto', lineHeight: 1.6 }}>
          Manage point-of-sale, inventory, employees, attendance, and financial reports from a single, unified, offline-first platform.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/login')}
            style={{ backgroundColor: '#000000', color: '#ffffff', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Launch Web App
          </button>
          <button style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #e0e0e0', padding: '1rem 2rem', borderRadius: '8px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Monitor size={20} /> Download for Windows
          </button>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" style={{ padding: '5rem 4rem', backgroundColor: '#fafafa', borderTop: '1px solid #eaeaea', borderBottom: '1px solid #eaeaea' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '4rem', letterSpacing: '-1px' }}>Everything you need to grow.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            
            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f0f0f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <ShoppingBag size={24} color="#000" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Lightning Fast POS</h3>
              <p style={{ color: '#666', lineHeight: 1.5 }}>Process sales instantly with our keyboard-optimized point of sale system. Works seamlessly even when your internet connection drops.</p>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f0f0f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Users size={24} color="#000" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Employee Management</h3>
              <p style={{ color: '#666', lineHeight: 1.5 }}>Track attendance with built-in kiosk modes, manage payroll, handle leave requests, and control exact access permissions per role.</p>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f0f0f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <BarChart2 size={24} color="#000" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Financial Analytics</h3>
              <p style={{ color: '#666', lineHeight: 1.5 }}>Automatically calculate net profit, track diverse business expenses, and export one-click CSV reports for accounting.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Security & Architecture */}
      <section id="security" style={{ padding: '6rem 4rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <Shield size={48} color="#000" style={{ margin: '0 auto 1.5rem auto' }} />
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-1px' }}>Enterprise-Grade Architecture.</h2>
        <p style={{ fontSize: '1.125rem', color: '#666', marginBottom: '3rem', lineHeight: 1.6 }}>
          Karobaar is built on Google Cloud infrastructure with strict multi-tenant isolation. Your data is cryptographically separated, entirely private, and backed up in real-time.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 500 }}>
            <Cloud size={24} color="#000" /> Offline-First Sync
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 500 }}>
            <Monitor size={24} color="#000" /> Windows Native
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 500 }}>
            <Smartphone size={24} color="#000" /> Android Native
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#000000', color: '#ffffff', padding: '4rem', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', backgroundColor: '#ffffff', color: '#000000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', margin: '0 auto 2rem auto' }}>
          K
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>Ready to transform your business?</h3>
        <button 
          onClick={() => navigate('/login')}
          style={{ backgroundColor: '#ffffff', color: '#000000', border: 'none', padding: '1rem 3rem', borderRadius: '8px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Get Started For Free
        </button>
        <p style={{ color: '#888', marginTop: '4rem', fontSize: '0.875rem' }}>© {new Date().getFullYear()} Karobaar OS. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default Landing;
