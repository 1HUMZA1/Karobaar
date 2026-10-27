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
  DollarSign, 
  Package, 
  Users, 
  CheckSquare, 
  CalendarOff,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import './Dashboard.css';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DashboardLegacy = ({ onSwitchMode }) => {
  const { userRole, currentUser, currentBusiness, theme } = useAppContext();
  const [activeFeatureTab, setActiveFeatureTab] = useState('ledger'); // 'ledger' | 'pos' | 'stock'
  
  const [stats, setStats] = useState({
    sales: 0,
    orders: 0,
    customers: 0,
    lowStock: 0,
    recentSales: [],
    productsList: [],
    lowStockList: [],
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

        const lowStockItems = products.filter(p => (p.stockQuantity || 0) <= (p.minimumStock || 5));

        const recentSales = [...sales]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 7);

        setStats(prev => ({
          ...prev,
          sales: todaySales,
          orders: todayOrders,
          customers: customers.length,
          lowStock: lowStockItems.length,
          recentSales,
          productsList: products.slice(0, 8),
          lowStockList: lowStockItems.slice(0, 6)
        }));

        // Revenue Chart Data (Last 7 days)
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
          const d = startOfDay(subDays(today, i));
          labels.push(format(d, 'dd MMM'));
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
              label: 'Gross Revenue',
              data,
              borderColor: isDark ? '#ffffff' : '#09090b',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(9, 9, 11, 0.04)',
              borderWidth: 2,
              pointBackgroundColor: isDark ? '#ffffff' : '#09090b',
              pointBorderColor: isDark ? '#09090b' : '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.3,
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
        backgroundColor: isDark ? '#ffffff' : '#09090b',
        titleColor: isDark ? '#09090b' : '#ffffff',
        bodyColor: isDark ? '#09090b' : '#ffffff',
        padding: 8,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          label: (context) => `Revenue: ${currencySymbol}${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
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
      <div className="legacy-root">
        <div className="legacy-header-bar">
          <div className="legacy-brand-group">
            <h1>Good Morning, {currentUser?.name?.split(' ')[0] || userRole}</h1>
            <p>{format(new Date(), 'EEEE, MMMM do, yyyy')} • Shift Operations</p>
          </div>
          <div className="legacy-header-controls">
            <span className="legacy-status-tag">
              <span className="legacy-status-tag-dot"></span>
              Shift Active
            </span>
            <button 
              onClick={() => onSwitchMode && onSwitchMode('premium')} 
              className="legacy-mode-switch-btn"
              title="Switch to Premium Mode"
            >
              <Sparkles size={13} />
              <span>Switch to Premium 💎</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
          <div className="legacy-box p-6 flex flex-col items-center justify-center text-center bg-[#09090b] text-white border-[#09090b]">
            <Clock size={40} className="mb-2 opacity-90" />
            <h3 className="text-lg font-bold mb-1">Today's Attendance</h3>
            <p className="text-zinc-400 mb-5 text-xs">You have not clocked in yet today.</p>
            <button 
              className="w-full h-10 rounded-lg font-bold bg-white text-[#09090b] hover:bg-zinc-100 transition-all cursor-pointer text-sm"
              onClick={() => window.location.href='#/attendance'}
            >
              CLOCK IN NOW
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="legacy-box p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-main">Assigned Tasks</h3>
                  <p className="text-xs text-text-secondary">{stats.pendingTasks} tasks today</p>
                </div>
              </div>
              <button 
                className="text-xs font-bold text-text-main underline cursor-pointer"
                onClick={() => window.location.href='#/tasks'}
              >
                View
              </button>
            </div>

            <div className="legacy-box p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700">
                  <CalendarOff size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-main">Leave Balance</h3>
                  <p className="text-xs text-text-secondary">{stats.leaveBalance} days remaining</p>
                </div>
              </div>
              <button 
                className="text-xs font-bold text-text-main underline cursor-pointer"
                onClick={() => window.location.href='#/leave'}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Management / Executive Desk
  return (
    <div className="legacy-root">
      {/* 1. Header Bar with Mode Switcher */}
      <div className="legacy-header-bar">
        <div className="legacy-brand-group">
          <h1>{currentBusiness?.name || 'SAS CAFETERIA'}</h1>
          <p>Legacy Fast-Track Desk • Instant Business Operations</p>
        </div>
        <div className="legacy-header-controls">
          <span className="legacy-status-tag">
            <span className="legacy-status-tag-dot"></span>
            Operational
          </span>
          <span className="text-xs font-bold text-text-secondary hidden sm:inline">
            {format(new Date(), 'EEE, dd MMM yyyy')}
          </span>
          {/* Transition Button to Switch to Premium Mode */}
          <button 
            onClick={() => onSwitchMode && onSwitchMode('premium')} 
            className="legacy-mode-switch-btn"
            title="Switch layout to Premium Command Center"
          >
            <Sparkles size={13} />
            <span>Switch to Premium Mode 💎</span>
          </button>
        </div>
      </div>

      {/* 2. Fit-to-Page Action Buttons (100% width, No horizontal overflow) */}
      <div className="legacy-actions-strip">
        <button 
          className="legacy-btn primary"
          onClick={() => window.location.href='#/pos'}
          title="Open POS Terminal [F2]"
        >
          <ShoppingBag size={16} />
          <span>+ New Sale</span>
          <span className="legacy-btn-kbd">F2</span>
        </button>

        <button 
          className="legacy-btn secondary"
          onClick={() => window.location.href='#/customers'}
          title="Add Customer & Khata"
        >
          <UserPlus size={16} />
          <span>+ Add Customer</span>
        </button>

        <button 
          className="legacy-btn secondary"
          onClick={() => window.location.href='#/expenses'}
          title="Record Expense Outflow"
        >
          <Receipt size={16} />
          <span>Record Expense</span>
        </button>

        <button 
          className="legacy-btn secondary"
          onClick={() => window.location.href='#/attendance'}
          title="Staff Clock-In"
        >
          <Clock size={16} />
          <span>Mark Attendance</span>
        </button>
      </div>

      {/* 3. Feature Mode Selector Tabs (Unique modular features in Legacy Mode) */}
      <div className="legacy-feature-nav">
        <button 
          className={`legacy-feature-tab ${activeFeatureTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveFeatureTab('ledger')}
        >
          📊 Daily Ledger & Trend
        </button>
        <button 
          className={`legacy-feature-tab ${activeFeatureTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveFeatureTab('pos')}
        >
          ⚡ Fast Catalog Glance
        </button>
        <button 
          className={`legacy-feature-tab ${activeFeatureTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveFeatureTab('stock')}
        >
          📦 Stock Reorder Guard ({stats.lowStock})
        </button>
      </div>

      {/* 4. Fit-to-Page Compact KPI Metric Cards (Strictly Black & White) */}
      <div className="legacy-grid-4">
        {/* KPI 1: Today's Revenue */}
        <div className="legacy-kpi-card">
          <div className="legacy-kpi-top">
            <span className="legacy-kpi-label">Today's Revenue</span>
            <div className="legacy-kpi-icon">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="legacy-kpi-val">
            {currencySymbol}{stats.sales.toFixed(2)}
          </div>
          <div className="legacy-kpi-bottom">
            <span>Gross Inflow</span>
            <span className="legacy-tag">TODAY</span>
          </div>
        </div>

        {/* KPI 2: Today's Orders */}
        <div className="legacy-kpi-card">
          <div className="legacy-kpi-top">
            <span className="legacy-kpi-label">Today's Orders</span>
            <div className="legacy-kpi-icon">
              <ShoppingBag size={15} />
            </div>
          </div>
          <div className="legacy-kpi-val">
            {stats.orders}
          </div>
          <div className="legacy-kpi-bottom">
            <span>Completed Tickets</span>
            <span className="legacy-tag">ORDERS</span>
          </div>
        </div>

        {/* KPI 3: Customer Base */}
        <div className="legacy-kpi-card">
          <div className="legacy-kpi-top">
            <span className="legacy-kpi-label">Customer Base</span>
            <div className="legacy-kpi-icon">
              <Users size={15} />
            </div>
          </div>
          <div className="legacy-kpi-val">
            {stats.customers}
          </div>
          <div className="legacy-kpi-bottom">
            <span>Active Profiles</span>
            <span className="legacy-tag">CLIENTS</span>
          </div>
        </div>

        {/* KPI 4: Stock Alerts */}
        <div className="legacy-kpi-card">
          <div className="legacy-kpi-top">
            <span className="legacy-kpi-label">Stock Monitor</span>
            <div className="legacy-kpi-icon">
              <Package size={15} />
            </div>
          </div>
          <div className="legacy-kpi-val">
            {stats.lowStock}
          </div>
          <div className="legacy-kpi-bottom">
            <span>Critical Items</span>
            <span className="legacy-tag">
              {stats.lowStock > 0 ? 'REORDER' : 'OPTIMAL'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Dynamic Feature Tab View (Completely different from Premium) */}
      {activeFeatureTab === 'ledger' && (
        <div className="legacy-split-grid">
          {/* Revenue Trajectory Chart */}
          <div className="legacy-box">
            <div className="legacy-box-header">
              <h2 className="legacy-box-title">Revenue Trajectory (Last 7 Days)</h2>
              <span className="legacy-box-badge">Trend Analysis</span>
            </div>
            <div className="legacy-box-body" style={{ minHeight: '280px' }}>
              <Line data={revenueData} options={chartOptions} />
            </div>
          </div>

          {/* Recent Sales Stream */}
          <div className="legacy-box">
            <div className="legacy-box-header">
              <h2 className="legacy-box-title">Recent Transactions</h2>
              <span className="legacy-box-badge">Live Stream</span>
            </div>
            <div>
              {stats.recentSales.map(sale => (
                <div key={sale.id} className="legacy-row">
                  <div>
                    <div className="legacy-row-id">
                      {sale.invoiceNumber || (typeof sale.id === 'string' ? sale.id.substring(0, 8).toUpperCase() : 'SALE')}
                    </div>
                    <div className="legacy-row-date">
                      <Clock size={11} /> {format(new Date(sale.date), 'MMM dd, hh:mm a')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="legacy-row-amt">
                      {currencySymbol}{(sale.total || 0).toFixed(2)}
                    </div>
                    <span className="legacy-row-status">
                      {sale.status || 'PAID'}
                    </span>
                  </div>
                </div>
              ))}
              {stats.recentSales.length === 0 && (
                <div className="p-8 text-center text-xs font-bold text-text-secondary">
                  No transactions recorded today.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeFeatureTab === 'pos' && (
        <div className="legacy-box">
          <div className="legacy-box-header">
            <div>
              <h2 className="legacy-box-title">Fast Catalog Glance</h2>
              <p className="text-xs text-text-secondary mt-1">1-Tap product shortcuts for fast billing</p>
            </div>
            <button 
              className="legacy-btn primary"
              style={{ width: 'auto', height: '34px', fontSize: '0.775rem' }}
              onClick={() => window.location.href='#/pos'}
            >
              Open Full POS Register &rarr;
            </button>
          </div>
          <div className="legacy-box-body">
            <div className="legacy-pos-grid">
              {stats.productsList.map(product => (
                <div 
                  key={product.id} 
                  className="legacy-pos-item"
                  onClick={() => window.location.href='#/pos'}
                  title={`Tap to ring up ${product.name}`}
                >
                  <span className="legacy-pos-item-name">{product.name}</span>
                  <span className="legacy-pos-item-price">{currencySymbol}{(product.sellingPrice || product.price || 0).toFixed(2)}</span>
                </div>
              ))}
              {stats.productsList.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs font-bold text-text-secondary">
                  No products found. Add products in the inventory page.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeFeatureTab === 'stock' && (
        <div className="legacy-box">
          <div className="legacy-box-header">
            <div>
              <h2 className="legacy-box-title">Stock Reorder Guard</h2>
              <p className="text-xs text-text-secondary mt-1">Items below minimum stock threshold requiring replenishment</p>
            </div>
            <button 
              className="legacy-btn secondary"
              style={{ width: 'auto', height: '34px', fontSize: '0.775rem' }}
              onClick={() => window.location.href='#/inventory'}
            >
              Open Inventory &rarr;
            </button>
          </div>
          <div className="legacy-box-body p-0">
            <table className="legacy-stock-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Current Stock</th>
                  <th>Min Level</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockList.map(item => (
                  <tr key={item.id}>
                    <td className="font-bold">{item.name}</td>
                    <td className="font-bold">{item.stockQuantity || 0} {item.unit || 'units'}</td>
                    <td>{item.minimumStock || 5} {item.unit || 'units'}</td>
                    <td className="text-right">
                      <button 
                        className="legacy-tag cursor-pointer hover:opacity-80"
                        onClick={() => window.location.href='#/purchases'}
                      >
                        Reorder Now
                      </button>
                    </td>
                  </tr>
                ))}
                {stats.lowStockList.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-xs font-bold text-text-secondary">
                      All products are currently stocked at optimal levels.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLegacy;
