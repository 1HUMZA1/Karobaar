import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import { format, subDays, startOfDay } from 'date-fns';
import { Line } from 'react-chartjs-2';
import { 
  ShoppingBag, 
  UserPlus, 
  Receipt, 
  Clock, 
  ArrowUpRight, 
  DollarSign, 
  Package, 
  Users, 
  CheckSquare, 
  CalendarOff,
  AlertCircle
} from 'lucide-react';
import { GettingStartedGuide } from '../../components/Dashboard/GettingStartedGuide';
import './Dashboard.css';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DashboardLegacy = () => {
  const { userRole, currentUser, currentBusiness, theme } = useAppContext();
  
  const [stats, setStats] = useState({
    sales: 0,
    orders: 0,
    customers: 0,
    lowStock: 0,
    recentSales: [],
    pendingTasks: 3,
    leaveBalance: 12
  });

  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: []
  });

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.activeBusinessId) return;

      try {
        const sales = await db.getCollection('sales', currentUser.activeBusinessId);
        const customers = await db.getCollection('customers', currentUser.activeBusinessId);
        const products = await db.getCollection('products', currentUser.activeBusinessId);
        
        const today = startOfDay(new Date());
        let todaySales = 0;
        let todayOrders = 0;
        
        sales.forEach(sale => {
          const saleDate = startOfDay(new Date(sale.date));
          if (saleDate.getTime() === today.getTime()) {
            todaySales += (sale.total || 0);
            todayOrders++;
          }
        });

        const lowStock = products.filter(p => (p.stockQuantity || 0) <= (p.minimumStock || 5)).length;

        const recentSales = [...sales]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 6);

        setStats(prev => ({
          ...prev,
          sales: todaySales,
          orders: todayOrders,
          customers: customers.length,
          lowStock,
          recentSales
        }));

        // Revenue Chart Data (Last 7 days)
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
          const d = startOfDay(subDays(today, i));
          labels.push(format(d, 'MMM dd'));
          const dayTotal = sales
            .filter(s => startOfDay(new Date(s.date)).getTime() === d.getTime())
            .reduce((sum, s) => sum + (s.total || 0), 0);
          data.push(dayTotal);
        }

        const isDark = theme === 'dark';
        setRevenueData({
          labels,
          datasets: [
            {
              label: 'Daily Revenue',
              data,
              borderColor: isDark ? '#ffffff' : '#09090b',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(9, 9, 11, 0.04)',
              borderWidth: 2.5,
              pointBackgroundColor: isDark ? '#ffffff' : '#09090b',
              pointBorderColor: isDark ? '#09090b' : '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.35,
            }
          ]
        });

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchDashboardData();
  }, [currentUser, theme]);

  const isDark = theme === 'dark';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1e1e24' : '#09090b',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `Revenue: ${currencySymbol}${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' },
        ticks: { 
          color: isDark ? '#a1a1aa' : '#71717a',
          callback: (value) => `${currencySymbol}${value}` 
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: isDark ? '#a1a1aa' : '#71717a' }
      }
    }
  };

  const isStaffRole = ['Employee', 'Sales Staff', 'Cashier', 'Warehouse'].includes(userRole);

  if (isStaffRole) {
    return (
      <div className="legacy-dashboard-container">
        <div className="legacy-header-strip">
          <div className="legacy-header-title">
            <h1>Good Morning, {currentUser?.name?.split(' ')[0] || userRole}</h1>
            <p>{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
          </div>
          <div className="legacy-header-meta">
            <span className="legacy-status-badge">
              <span className="legacy-status-dot"></span>
              Shift Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          <div className="legacy-card p-6 flex flex-col items-center justify-center text-center bg-[#09090b] text-white border-[#09090b]">
            <Clock size={44} className="mb-3 opacity-90" />
            <h3 className="text-xl font-bold mb-1">Today's Attendance</h3>
            <p className="text-zinc-400 mb-6 text-sm">You have not clocked in yet today.</p>
            <button 
              className="w-full py-3 px-6 rounded-xl font-bold bg-white text-[#09090b] hover:bg-zinc-100 transition-all shadow-md cursor-pointer"
              onClick={() => window.location.href='#/attendance'}
            >
              CLOCK IN NOW
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="legacy-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                  <CheckSquare size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-main">Assigned Tasks</h3>
                  <p className="text-xs text-text-secondary">{stats.pendingTasks} pending tasks today</p>
                </div>
              </div>
              <button 
                className="text-xs font-bold text-text-main hover:underline cursor-pointer"
                onClick={() => window.location.href='#/tasks'}
              >
                View &rarr;
              </button>
            </div>

            <div className="legacy-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                  <CalendarOff size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-main">Leave Balance</h3>
                  <p className="text-xs text-text-secondary">{stats.leaveBalance} days remaining</p>
                </div>
              </div>
              <button 
                className="text-xs font-bold text-text-main hover:underline cursor-pointer"
                onClick={() => window.location.href='#/leave'}
              >
                Apply &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Management / Executive Workspace
  return (
    <div className="legacy-dashboard-container">
      {/* 1. Executive Status Header */}
      <div className="legacy-header-strip">
        <div className="legacy-header-title">
          <h1>{currentBusiness?.name || 'Business Executive Desk'}</h1>
          <p>Real-time overview & operations command center</p>
        </div>
        <div className="legacy-header-meta">
          <span className="legacy-status-badge">
            <span className="legacy-status-dot"></span>
            Operational
          </span>
          <span className="legacy-date-badge">
            {format(new Date(), 'EEEE, dd MMM yyyy')}
          </span>
        </div>
      </div>

      {/* 2. Completely Redesigned, Different Buttons (Executive Action Dock) */}
      <div className="legacy-actions-wrapper">
        <div className="flex items-center justify-between">
          <span className="legacy-actions-label">Operations Launchpad</span>
          <span className="text-xs text-text-secondary font-medium hidden sm:inline">Tap to launch module</span>
        </div>
        <div className="legacy-actions-deck">
          {/* Button 1: Primary New Sale */}
          <div 
            className="legacy-action-tile primary"
            onClick={() => window.location.href='#/pos'}
            role="button"
            tabIndex={0}
          >
            <div className="legacy-action-tile-icon">
              <ShoppingBag size={20} />
            </div>
            <div className="legacy-action-tile-content">
              <span className="legacy-action-tile-title">+ New Sale</span>
              <span className="legacy-action-tile-subtitle">Terminal & POS Register</span>
            </div>
            <span className="legacy-action-tile-badge">F2</span>
          </div>

          {/* Button 2: Add Customer */}
          <div 
            className="legacy-action-tile"
            onClick={() => window.location.href='#/customers'}
            role="button"
            tabIndex={0}
          >
            <div className="legacy-action-tile-icon">
              <UserPlus size={20} />
            </div>
            <div className="legacy-action-tile-content">
              <span className="legacy-action-tile-title">+ Add Customer</span>
              <span className="legacy-action-tile-subtitle">Client Directory & Khata</span>
            </div>
            <ArrowUpRight size={16} className="opacity-40" />
          </div>

          {/* Button 3: Record Expense */}
          <div 
            className="legacy-action-tile"
            onClick={() => window.location.href='#/expenses'}
            role="button"
            tabIndex={0}
          >
            <div className="legacy-action-tile-icon">
              <Receipt size={20} />
            </div>
            <div className="legacy-action-tile-content">
              <span className="legacy-action-tile-title">Record Expense</span>
              <span className="legacy-action-tile-subtitle">Cash & Bank Outflow</span>
            </div>
            <ArrowUpRight size={16} className="opacity-40" />
          </div>

          {/* Button 4: Mark Attendance */}
          <div 
            className="legacy-action-tile"
            onClick={() => window.location.href='#/attendance'}
            role="button"
            tabIndex={0}
          >
            <div className="legacy-action-tile-icon">
              <Clock size={20} />
            </div>
            <div className="legacy-action-tile-content">
              <span className="legacy-action-tile-title">Mark Attendance</span>
              <span className="legacy-action-tile-subtitle">Staff Shift Clock-In</span>
            </div>
            <ArrowUpRight size={16} className="opacity-40" />
          </div>
        </div>
      </div>

      <GettingStartedGuide />

      {/* 3. Distinct Architectural Metric Cards (Strictly Black & White) */}
      <div className="legacy-metrics-grid">
        {/* KPI 1: Total Revenue */}
        <div className="legacy-metric-card">
          <div className="legacy-metric-header">
            <span className="legacy-metric-label">Today's Revenue</span>
            <div className="legacy-metric-icon-box">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="legacy-metric-value">
            {currencySymbol}{stats.sales.toFixed(2)}
          </div>
          <div className="legacy-metric-footer">
            <span>Gross Sales</span>
            <span className="legacy-metric-pill">Today</span>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="legacy-metric-card">
          <div className="legacy-metric-header">
            <span className="legacy-metric-label">Today's Orders</span>
            <div className="legacy-metric-icon-box">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="legacy-metric-value">
            {stats.orders}
          </div>
          <div className="legacy-metric-footer">
            <span>Completed Tickets</span>
            <span className="legacy-metric-pill">Volume</span>
          </div>
        </div>

        {/* KPI 3: Total Customers */}
        <div className="legacy-metric-card">
          <div className="legacy-metric-header">
            <span className="legacy-metric-label">Customer Base</span>
            <div className="legacy-metric-icon-box">
              <Users size={18} />
            </div>
          </div>
          <div className="legacy-metric-value">
            {stats.customers}
          </div>
          <div className="legacy-metric-footer">
            <span>Profiles Active</span>
            <span className="legacy-metric-pill">Verified</span>
          </div>
        </div>

        {/* KPI 4: Low Stock Alerts */}
        <div className="legacy-metric-card">
          <div className="legacy-metric-header">
            <span className="legacy-metric-label">Stock Monitor</span>
            <div className="legacy-metric-icon-box">
              <Package size={18} />
            </div>
          </div>
          <div className="legacy-metric-value">
            {stats.lowStock}
          </div>
          <div className="legacy-metric-footer">
            <span>Critical Items</span>
            {stats.lowStock > 0 ? (
              <span className="legacy-metric-pill alert flex items-center gap-1">
                <AlertCircle size={10} /> Reorder
              </span>
            ) : (
              <span className="legacy-metric-pill">Optimal</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Executive Workspace (Monochrome Trend Chart & Ledger Stream) */}
      <div className="legacy-workspace-grid">
        {/* Left: 7-Day Revenue Trajectory Chart */}
        <div className="legacy-card">
          <div className="legacy-card-header">
            <h2 className="legacy-card-title">Revenue Trajectory (Last 7 Days)</h2>
            <span className="legacy-card-badge">Trend Analysis</span>
          </div>
          <div className="legacy-card-body" style={{ minHeight: '320px', position: 'relative' }}>
            <Line data={revenueData} options={chartOptions} />
          </div>
        </div>

        {/* Right: Recent Transactions Stream */}
        <div className="legacy-card">
          <div className="legacy-card-header">
            <h2 className="legacy-card-title">Recent Transactions</h2>
            <span className="legacy-card-badge">Live Stream</span>
          </div>
          <div className="legacy-ledger-list">
            {stats.recentSales.map(sale => (
              <div key={sale.id} className="legacy-ledger-item">
                <div className="legacy-ledger-left">
                  <span className="legacy-ledger-id">
                    {sale.invoiceNumber || (typeof sale.id === 'string' ? sale.id.substring(0, 8).toUpperCase() : 'SALE')}
                  </span>
                  <span className="legacy-ledger-time">
                    <Clock size={11} /> {format(new Date(sale.date), 'MMM dd, hh:mm a')}
                  </span>
                </div>
                <div className="legacy-ledger-right">
                  <span className="legacy-ledger-amount">
                    {currencySymbol}{(sale.total || 0).toFixed(2)}
                  </span>
                  <span className="legacy-ledger-pill">
                    {sale.status || 'PAID'}
                  </span>
                </div>
              </div>
            ))}
            {stats.recentSales.length === 0 && (
              <div className="legacy-ledger-empty">
                No recent transactions recorded today.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLegacy;
