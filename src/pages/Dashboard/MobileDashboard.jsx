import React, { useState } from 'react';
import { format, isValid } from 'date-fns';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  RefreshCw, 
  Wallet,
  Receipt,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import './MobileDashboard.css';

export const MobileDashboard = ({ 
  currentUser, 
  currentBusiness, 
  stats, 
  trends, 
  currencySymbol = '$', 
  chartData, 
  recentOrders = [],
  lowStockProducts = [],
  healthScore,
  healthLabel,
  onRefresh,
  isRefreshing
}) => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('today'); // 'today' | '7d' | '30d'

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatSafeNumber = (num) => {
    if (num === '***') return '***';
    return (Number(num) || 0).toLocaleString();
  };

  const formatSafeDate = (dateStr) => {
    if (!dateStr) return 'Just now';
    const d = new Date(dateStr);
    if (!isValid(d)) return 'Recently';
    return format(d, 'MMM dd, h:mm a');
  };

  // Calculate dynamic timeframe revenue
  const getActiveRevenue = () => {
    if (timeframe === 'today') return stats?.todayRevenue;
    if (chartData?.revenueData?.length) {
      const sliceCount = timeframe === '7d' ? 7 : 30;
      const total = chartData.revenueData.slice(-sliceCount).reduce((acc, v) => acc + (Number(v) || 0), 0);
      return total > 0 ? total : stats?.todayRevenue;
    }
    return stats?.todayRevenue;
  };

  const activeRevenueVal = getActiveRevenue();

  // Monochrome chart styling for the hero card
  const chartObj = {
    labels: chartData?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: chartData?.revenueData?.length ? chartData.revenueData : [10, 25, 18, 40, 30, 55, 70],
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } }
  };

  const isTrendPositive = trends?.revTrend?.isPositive !== false;

  return (
    <div className="mobile-dashboard-wrapper">
      <MobileHeader title="Karobaar" rightAction="dashboard" />
      
      <div className="px-4 pt-2">
        {/* 1. Header Info Bar */}
        <div className="mobile-dash-header">
          <div>
            <p className="mobile-dash-greeting">{getGreeting()},</p>
            <h1 className="mobile-dash-username">{currentUser?.name || 'Owner'}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="mobile-dash-status-pill">
              <span className="mobile-dash-dot"></span>
              <span className="mobile-dash-branch-name">{currentBusiness?.name || 'Main Branch'}</span>
            </div>
            {onRefresh && (
              <button 
                onClick={onRefresh} 
                disabled={isRefreshing}
                className="mobile-dash-refresh-btn"
                title="Refresh dashboard data"
                aria-label="Refresh data"
              >
                <RefreshCw size={17} className={isRefreshing ? 'spin-animation' : ''} />
              </button>
            )}
          </div>
        </div>

        {/* 2. Hero Revenue Performance Card */}
        <div className="mobile-hero-card">
          <div className="mobile-hero-top">
            <p className="mobile-hero-label">
              {timeframe === 'today' ? "Today's Revenue" : timeframe === '7d' ? 'Past 7 Days' : 'This Month'}
            </p>
            
            <div className="mobile-time-tabs">
              <button 
                className={`mobile-time-tab ${timeframe === 'today' ? 'active' : ''}`}
                onClick={() => setTimeframe('today')}
              >
                Today
              </button>
              <button 
                className={`mobile-time-tab ${timeframe === '7d' ? 'active' : ''}`}
                onClick={() => setTimeframe('7d')}
              >
                7D
              </button>
              <button 
                className={`mobile-time-tab ${timeframe === '30d' ? 'active' : ''}`}
                onClick={() => setTimeframe('30d')}
              >
                30D
              </button>
            </div>
          </div>

          <div className="mobile-hero-rev-row">
            <h2 className="mobile-hero-value">
              {currencySymbol}{formatSafeNumber(activeRevenueVal)}
            </h2>
            <div className={`mobile-hero-trend-badge ${isTrendPositive ? '' : 'negative'}`}>
              {isTrendPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{isTrendPositive ? '+' : '-'}{trends?.revTrend?.value || 0}%</span>
            </div>
          </div>

          {/* Sparkline Visual */}
          <div className="mobile-hero-chart">
            <Line data={chartObj} options={chartOptions} />
          </div>

          {/* Submetrics Breakdown */}
          <div className="mobile-hero-breakdown">
            <div>
              <p className="mobile-hero-submetric-label">Net Profit</p>
              <p className="mobile-hero-submetric-val">
                {currencySymbol}{formatSafeNumber(stats?.todayProfit)}
              </p>
            </div>
            <div>
              <p className="mobile-hero-submetric-label">Completed Sales</p>
              <p className="mobile-hero-submetric-val">
                {stats?.todayOrders || 0} orders
              </p>
            </div>
          </div>
        </div>

        {/* 3. Primary POS Quick-Launch Button */}
        <button 
          onClick={() => navigate('/pos')} 
          className="mobile-pos-launch-btn"
          aria-label="Open POS terminal"
        >
          <div className="mobile-pos-btn-left">
            <div className="mobile-pos-icon-badge">
              <ShoppingCart size={18} />
            </div>
            <span>New Sale (POS)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="mobile-pos-btn-tag">1-Tap Fast Checkout</span>
            <ArrowRight size={16} />
          </div>
        </button>

        {/* 4. Action Grid (4-Touch Hub) */}
        <div className="mobile-action-grid">
          <button onClick={() => navigate('/products')} className="mobile-action-tile items">
            <div className="mobile-action-icon">
              <Package size={20} />
            </div>
            <span className="mobile-action-label">Products</span>
          </button>
          
          <button onClick={() => navigate('/customers')} className="mobile-action-tile clients">
            <div className="mobile-action-icon">
              <Users size={20} />
            </div>
            <span className="mobile-action-label">Customers</span>
          </button>

          <button onClick={() => navigate('/expenses')} className="mobile-action-tile expenses">
            <div className="mobile-action-icon">
              <Wallet size={20} />
            </div>
            <span className="mobile-action-label">Expenses</span>
          </button>

          <button onClick={() => navigate('/reports')} className="mobile-action-tile reports">
            <div className="mobile-action-icon">
              <FileText size={20} />
            </div>
            <span className="mobile-action-label">Reports</span>
          </button>
        </div>

        {/* 5. Urgent Low Stock Alert Card (if any item low) */}
        {(stats?.lowStockCount || 0) > 0 && (
          <div className="mobile-stock-alert-banner">
            <div className="mobile-stock-alert-left">
              <AlertTriangle size={20} className="mobile-stock-alert-icon" />
              <div>
                <p className="mobile-stock-alert-title">
                  {stats.lowStockCount} {stats.lowStockCount === 1 ? 'item needs' : 'items need'} restocking
                </p>
                <p className="mobile-stock-alert-desc">
                  {lowStockProducts && lowStockProducts.length > 0 
                    ? lowStockProducts.slice(0, 2).map(p => p.name).join(', ') 
                    : 'Inventory running below safe reorder levels'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/products')}
              className="mobile-stock-alert-btn"
            >
              Restock
            </button>
          </div>
        )}

        {/* 6. Business Operations Overview (2x2 Grid) */}
        <div className="mobile-section-header">
          <h3 className="mobile-section-title">Business Overview</h3>
          <button onClick={() => navigate('/reports')} className="mobile-section-link">
            Full Analytics <ArrowRight size={13} />
          </button>
        </div>

        <div className="mobile-metrics-grid">
          <div className="mobile-metric-card">
            <div className="mobile-metric-top">
              <span className="mobile-metric-label">Sales Count</span>
              <Receipt size={16} className="mobile-metric-icon" />
            </div>
            <div>
              <p className="mobile-metric-value">{stats?.todayOrders || 0}</p>
              <p className="mobile-metric-hint">
                +{trends?.ordTrend?.value || 0}% vs yesterday
              </p>
            </div>
          </div>

          <div className="mobile-metric-card">
            <div className="mobile-metric-top">
              <span className="mobile-metric-label">Net Profit</span>
              <TrendingUp size={16} className="mobile-metric-icon text-emerald-500" />
            </div>
            <div>
              <p className="mobile-metric-value">
                {currencySymbol}{formatSafeNumber(stats?.todayProfit)}
              </p>
              <p className="mobile-metric-hint">
                +{trends?.profTrend?.value || 0}% margin
              </p>
            </div>
          </div>

          <div className="mobile-metric-card cursor-pointer" onClick={() => navigate('/expenses')}>
            <div className="mobile-metric-top">
              <span className="mobile-metric-label">Expenses</span>
              <Wallet size={16} className="mobile-metric-icon" />
            </div>
            <div>
              <p className="mobile-metric-value">
                {currencySymbol}{formatSafeNumber(stats?.todayExpenses)}
              </p>
              <p className="mobile-metric-hint danger">
                Today's outlays
              </p>
            </div>
          </div>

          <div className="mobile-metric-card cursor-pointer" onClick={() => navigate('/customers')}>
            <div className="mobile-metric-top">
              <span className="mobile-metric-label">Khata / Dues</span>
              <Users size={16} className="mobile-metric-icon" />
            </div>
            <div>
              <p className="mobile-metric-value">
                {currencySymbol}{formatSafeNumber(stats?.receivables || 0)}
              </p>
              <p className="mobile-metric-hint muted">
                Pending collection
              </p>
            </div>
          </div>
        </div>

        {/* 7. Recent Transactions Feed */}
        <div className="mobile-section-header">
          <h3 className="mobile-section-title">Recent Transactions</h3>
          <button onClick={() => navigate('/orders')} className="mobile-section-link">
            View All <ArrowRight size={13} />
          </button>
        </div>

        <div className="mobile-transactions-list">
          {(recentOrders || []).slice(0, 5).map(order => {
            const method = (order?.paymentMethod || 'Cash').toLowerCase();
            const badgeClass = method.includes('card') ? 'card' : method.includes('unpaid') ? 'unpaid' : 'cash';
            
            return (
              <div 
                key={order?.id || Math.random()} 
                onClick={() => navigate('/orders')}
                className="mobile-tx-item"
              >
                <div className="mobile-tx-left">
                  <div className="mobile-tx-avatar">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="mobile-tx-id">INV-{(order?.id || '000000').slice(0, 6).toUpperCase()}</p>
                    <p className="mobile-tx-time">{formatSafeDate(order?.date)}</p>
                  </div>
                </div>
                <div className="mobile-tx-right">
                  <p className="mobile-tx-amount">+{currencySymbol}{formatSafeNumber(order?.total)}</p>
                  <span className={`mobile-tx-badge ${badgeClass}`}>
                    {order?.paymentMethod || 'Cash'}
                  </span>
                </div>
              </div>
            );
          })}

          {(!recentOrders || recentOrders.length === 0) && (
            <div className="mobile-empty-feed">
              <p className="mobile-empty-text">No transactions recorded yet today</p>
              <button onClick={() => navigate('/pos')} className="mobile-empty-cta">
                + Ring Up First Sale
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 8. Floating POS Quick Action Button (FAB) */}
      <button 
        onClick={() => navigate('/pos')} 
        className="mobile-fab-sale"
        aria-label="Floating New Sale button"
      >
        <ShoppingCart size={18} />
        <span>Sale POS</span>
      </button>
    </div>
  );
};
