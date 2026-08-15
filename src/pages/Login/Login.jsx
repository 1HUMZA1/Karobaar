import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import './Login.css';

const DEMO_ROLES = [
  { role: 'Owner', email: 'owner@karobaar.demo', name: 'Zaid Owner' },
  { role: 'Admin', email: 'admin@karobaar.demo', name: 'Ali Admin' },
  { role: 'Manager', email: 'manager@karobaar.demo', name: 'Omar Manager' },
  { role: 'Sales Staff', email: 'sales@karobaar.demo', name: 'Tariq Sales' },
  { role: 'Cashier', email: 'cashier@karobaar.demo', name: 'Bilal Cashier' },
  { role: 'Warehouse', email: 'warehouse@karobaar.demo', name: 'Hamza Warehouse' },
  { role: 'Accountant', email: 'accountant@karobaar.demo', name: 'Faisal Accountant' },
  { role: 'HR', email: 'hr@karobaar.demo', name: 'Sara HR' },
  { role: 'Employee', email: 'employee@karobaar.demo', name: 'Ahmed Staff' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleManualLogin = (e) => {
    e.preventDefault();
    // For demo purposes, just log them in as Employee if they type something random
    login({ role: 'Employee', email: email || 'employee@karobaar.demo', name: 'Demo User' });
    navigate('/dashboard');
  };

  const handleDemoLogin = (demoAccount) => {
    login(demoAccount);
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="login-logo">
          <span className="logo-icon-box">K</span>
          Karobaar
        </div>
        <h2 className="login-title">Sign in to your account</h2>
        <p className="login-subtitle">Welcome back to the ultimate business OS</p>
      </div>

      <div className="login-card">
        <form onSubmit={handleManualLogin}>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your password"
            />
          </div>

          <div className="form-actions">
            <div className="remember-me">
              <input type="checkbox" id="remember-me" />
              <label htmlFor="remember-me">Remember me</label>
            </div>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <Button type="submit" className="login-submit-btn w-full">
            Sign In
          </Button>
        </form>

        <div className="divider">
          <span className="divider-text">Or use a demo account</span>
        </div>

        <div className="demo-roles-grid">
          {DEMO_ROLES.map((demo) => (
            <Button
              key={demo.role}
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin(demo)}
              className="demo-btn"
            >
              {demo.role}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
