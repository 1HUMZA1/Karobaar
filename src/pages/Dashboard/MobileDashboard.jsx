import React from 'react';
import { format } from 'date-fns';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { ShoppingCart, TrendingUp, Package, Users, ChevronRight, Plus, FileText, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';

export const MobileDashboard = ({ currentUser, currentBusiness, stats, trends, currencySymbol, chartData, recentOrders }) => {
  const navigate = useNavigate();
  
  const chartObj = {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.revenueData,
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

  return (
    <div className="mobile-dashboard pb-24">
      <MobileHeader title="Karobaar" rightAction="dashboard" />
      
      <div className="px-4 pt-2">
        {/* Greeting */}
        <p className="text-[var(--text-muted)] text-xs mb-1">Good Morning,</p>
        <h1 className="text-xl font-bold text-[var(--text-main)] mb-1">{currentUser?.name || 'User'}</h1>
        <p className="text-[var(--text-secondary)] text-xs mb-4">Here's what's happening with your business today.</p>

        {/* Branch Selector (Mock) */}
        <div className="flex items-center justify-between bg-[var(--bg-card)] px-4 py-2.5 rounded-xl border border-[var(--border-color)] mb-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-[var(--success-color)]"></span>
            {currentBusiness?.name || 'Main Branch'}
          </div>
          <ChevronRight size={16} className="text-[var(--text-muted)] rotate-90" />
        </div>

        {/* Today's Revenue Card */}
        <div className="bg-[var(--primary-color)] rounded-2xl p-5 text-[var(--bg-primary)] shadow-lg mb-4 relative overflow-hidden">
          <p className="text-sm opacity-90 mb-1">Today's Revenue</p>
          <div className="flex items-end gap-3 mb-4">
            <h2 className="text-3xl font-extrabold">{currencySymbol}{(stats.todayRevenue || 0).toLocaleString()}</h2>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-md mb-1">
              {trends.revTrend.isPositive ? '+' : ''}{trends.revTrend.value}%
            </span>
          </div>
          <p className="text-xs opacity-70 mb-4">vs Yesterday</p>
          <div className="h-16 -mx-2 -mb-2">
            {chartData.labels.length > 0 ? <Line data={chartObj} options={chartOptions} /> : null}
          </div>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Total Sales</p>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-[var(--text-main)]">{stats.todayOrders || 0}</h3>
              <ChevronRight size={14} className="text-[var(--success-color)]" />
            </div>
            <p className="text-[10px] text-[var(--success-color)] font-medium">+{trends.ordTrend.value}%</p>
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Total Profit</p>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-[var(--text-main)]">{currencySymbol}{(stats.todayProfit || 0).toLocaleString()}</h3>
              <ChevronRight size={14} className="text-[var(--success-color)]" />
            </div>
            <p className="text-[10px] text-[var(--success-color)] font-medium">+{trends.profTrend.value}%</p>
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Orders</p>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-[var(--text-main)]">{stats.todayOrders || 0}</h3>
              <ChevronRight size={14} className="text-[var(--success-color)]" />
            </div>
            <p className="text-[10px] text-[var(--success-color)] font-medium">+{trends.ordTrend.value}%</p>
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Low Stock</p>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-[var(--warning-color)]">{stats.lowStockCount || 0}</h3>
            </div>
            <p className="text-[10px] text-[var(--warning-color)] font-medium">View All</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-[var(--text-main)]">Quick Actions</h3>
          <button className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] px-3 py-1.5 rounded-full">More</button>
        </div>
        <div className="flex justify-between mb-8">
          <button onClick={() => navigate('/pos')} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[#8b5cf6] flex items-center justify-center text-white"><ShoppingCart size={20}/></div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)]">New Sale</span>
          </button>
          <button onClick={() => navigate('/products')} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[#3b82f6] flex items-center justify-center text-white"><Package size={20}/></div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)]">Add Product</span>
          </button>
          <button onClick={() => navigate('/customers')} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[#10b981] flex items-center justify-center text-white"><Users size={20}/></div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)]">Customers</span>
          </button>
          <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[#f59e0b] flex items-center justify-center text-white"><FileText size={20}/></div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)]">Reports</span>
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-[var(--text-main)]">Recent Transactions</h3>
          <button className="text-xs text-[var(--text-muted)]">View All</button>
        </div>
        <div className="flex flex-col gap-3">
          {recentOrders.slice(0, 3).map(order => (
            <div key={order.id} className="flex justify-between items-center bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)]">
                  <Activity size={18}/>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-main)]">INV-{order.id.slice(0,6)}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{format(new Date(order.date), 'MMM dd, hh:mm a')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[var(--text-main)]">{currencySymbol}{order.total.toLocaleString()}</p>
                <p className="text-[10px] text-[var(--success-color)]">{order.paymentMethod || 'Cash'}</p>
              </div>
            </div>
          ))}
          {recentOrders.length === 0 && <p className="text-sm text-center text-[var(--text-muted)] py-4">No recent transactions</p>}
        </div>
      </div>
    </div>
  );
};
