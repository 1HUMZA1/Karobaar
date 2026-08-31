import React from 'react';
import { format, isValid } from 'date-fns';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { ShoppingCart, Package, Users, ChevronRight, FileText, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';

export const MobileDashboard = ({ currentUser, currentBusiness, stats, trends, currencySymbol, chartData, recentOrders }) => {
  const navigate = useNavigate();
  
  const chartObj = {
    labels: chartData?.labels || [],
    datasets: [
      {
        data: chartData?.revenueData || [],
        borderColor: 'var(--primary-color)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
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

  const formatSafeNumber = (num) => {
    if (num === '***') return '***';
    return (Number(num) || 0).toLocaleString();
  };

  const formatSafeDate = (dateStr) => {
    if (!dateStr) return 'Unknown Date';
    const d = new Date(dateStr);
    if (!isValid(d)) return 'Invalid Date';
    return format(d, 'MMM dd, hh:mm a');
  };

  return (
    <div className="mobile-dashboard pb-24">
      <MobileHeader title="Karobaar" rightAction="dashboard" />
      
      <div className="px-4 pt-2">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[var(--text-muted)] text-xs mb-1">Good Morning,</p>
            <h1 className="text-xl font-bold text-[var(--text-main)] mb-1">{currentUser?.name || 'User'}</h1>
          </div>
          <div className="flex items-center gap-2 bg-[var(--bg-card)] px-3 py-1.5 rounded-full border border-[var(--border-color)]">
            <span className="w-2 h-2 rounded-full bg-[var(--success-color)]"></span>
            <span className="text-xs font-semibold truncate max-w-[100px]">{currentBusiness?.name || 'Main Branch'}</span>
          </div>
        </div>

        {/* Primary Stats Card */}
        <div className="bg-[var(--primary-color)] rounded-2xl p-5 text-[var(--bg-primary)] shadow-lg mb-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm opacity-90 font-medium">Today's Revenue</p>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-md font-medium flex items-center gap-1">
              <TrendingUp size={12} />
              {trends?.revTrend?.isPositive ? '+' : ''}{trends?.revTrend?.value || 0}%
            </span>
          </div>
          <h2 className="text-3xl font-extrabold mb-4">{currencySymbol}{formatSafeNumber(stats?.todayRevenue)}</h2>
          
          <div className="h-16 -mx-2 -mb-2 mt-4">
            {(chartData?.labels?.length || 0) > 0 && <Line data={chartObj} options={chartOptions} />}
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <button onClick={() => navigate('/pos')} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--primary-color)] shadow-sm">
              <ShoppingCart size={20}/>
            </div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)]">POS</span>
          </button>
          <button onClick={() => navigate('/products')} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[#3b82f6] shadow-sm">
              <Package size={20}/>
            </div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)]">Items</span>
          </button>
          <button onClick={() => navigate('/customers')} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[#10b981] shadow-sm">
              <Users size={20}/>
            </div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)]">Clients</span>
          </button>
          <button onClick={() => navigate('/reports')} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[#f59e0b] shadow-sm">
              <FileText size={20}/>
            </div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)]">Reports</span>
          </button>
        </div>

        {/* Business Metrics */}
        <h3 className="font-bold text-[var(--text-main)] mb-3">Overview</h3>
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)] flex flex-col justify-between">
            <p className="text-xs text-[var(--text-muted)] mb-2 font-medium">Total Sales</p>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">{stats?.todayOrders || 0}</h3>
              <p className="text-[10px] text-[var(--success-color)] mt-1">+{trends?.ordTrend?.value || 0}% from yesterday</p>
            </div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)] flex flex-col justify-between">
            <p className="text-xs text-[var(--text-muted)] mb-2 font-medium">Net Profit</p>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">{currencySymbol}{formatSafeNumber(stats?.todayProfit)}</h3>
              <p className="text-[10px] text-[var(--success-color)] mt-1">+{trends?.profTrend?.value || 0}% margin</p>
            </div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)] flex flex-col justify-between">
            <p className="text-xs text-[var(--text-muted)] mb-2 font-medium">Total Expenses</p>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">{currencySymbol}{formatSafeNumber(stats?.todayExpenses)}</h3>
              <p className="text-[10px] text-[var(--danger)] mt-1">Today's spend</p>
            </div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)] flex flex-col justify-between">
            <p className="text-xs text-[var(--text-muted)] mb-2 font-medium">Stock Alerts</p>
            <div>
              <h3 className="text-xl font-bold text-[var(--warning-color)] flex items-center gap-1">
                <AlertTriangle size={16} />
                {stats?.lowStockCount || 0}
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Items running low</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-[var(--text-main)]">Recent Transactions</h3>
          <button onClick={() => navigate('/orders')} className="text-xs text-[var(--primary-color)] font-medium">View All</button>
        </div>
        <div className="flex flex-col gap-3">
          {(recentOrders || []).slice(0, 4).map(order => (
            <div key={order?.id || Math.random()} className="flex justify-between items-center bg-[var(--bg-card)] p-3.5 rounded-xl border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center text-[var(--primary-color)]">
                  <Activity size={18}/>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-main)]">INV-{(order?.id || '000000').slice(0,6)}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatSafeDate(order?.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[var(--text-main)]">{currencySymbol}{formatSafeNumber(order?.total)}</p>
                <p className="text-[10px] text-[var(--success-color)] mt-0.5">{order?.paymentMethod || 'Cash'}</p>
              </div>
            </div>
          ))}
          {(!recentOrders || recentOrders.length === 0) && (
            <div className="text-center py-8 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] border-dashed">
              <p className="text-sm text-[var(--text-muted)]">No recent transactions today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
