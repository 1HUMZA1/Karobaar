import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Activity, Zap, DollarSign, Package, Users, Receipt, FileText, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardAnalytics = ({ chartData, currencySymbol, stats = {}, trends = {} }) => {
  const navigate = useNavigate();
  const [range, setRange] = useState('7D');

  const chartObj = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Revenue',
        data: chartData.revenueData,
        borderColor: '#22c55e', // Success Green
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'Expenses',
        data: chartData.expenseData,
        borderColor: '#ef4444', // Danger Red
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'Profit',
        data: chartData.profitData,
        borderColor: '#3b82f6', // Info Blue
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#141414',
        titleColor: '#F5F5F5',
        bodyColor: '#a3a3a3',
        borderColor: '#252525',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${currencySymbol}${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: '#666666', font: { size: 11, family: 'Inter' } },
        border: { display: false }
      },
      y: { 
        grid: { color: '#252525', drawBorder: false }, 
        ticks: { 
          color: '#666666', 
          font: { size: 11, family: 'Inter' },
          callback: (value) => `${currencySymbol}${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`
        },
        border: { display: false }
      }
    }
  };

  const quickActions = [
    { label: 'New Sale', icon: <DollarSign size={16} />, path: '/pos', primary: true },
    { label: 'Add Product', icon: <Package size={16} />, path: '/products', primary: false },
    { label: 'Add Customer', icon: <Users size={16} />, path: '/customers', primary: false },
    { label: 'Record Expense', icon: <Receipt size={16} />, path: '/expenses', primary: false },
    { label: 'Create Invoice', icon: <FileText size={16} />, path: '/invoices', primary: false },
    { label: 'Settings', icon: <Settings size={16} />, path: '/settings', primary: false },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
      
      {/* Revenue Overview Chart */}
      <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm flex flex-col">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
            <Activity size={16} className="text-primary"/> Revenue Overview
          </h2>
          <div className="flex bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg p-0.5">
            {['7D', '30D', '1Y'].map(r => (
              <button 
                key={r}
                onClick={() => setRange(r)}
                className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${
                  range === r 
                    ? 'bg-[var(--bg-hover)] text-text-main shadow-sm' 
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-5 flex-1 relative min-h-[300px]">
          {chartData.labels.length > 0 ? (
            <Line data={chartObj} options={chartOptions} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
              No chart data available.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="lg:col-span-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm flex flex-col">
        <div className="p-5 border-b border-[var(--border-color)]">
          <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
            <Zap size={16} className="text-warning"/> Quick Actions
          </h2>
        </div>
        <div className="p-5 flex-1 quick-actions-grid">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className={`quick-action-btn ${action.primary ? 'quick-action-primary' : ''}`}
            >
              <div className="quick-action-icon">
                {action.icon}
              </div>
              <span className="quick-action-label text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Business Insights / Status */}
      <div className="lg:col-span-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm flex flex-col">
        <div className="p-5 border-b border-[var(--border-color)]">
          <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
            <Activity size={16} className="text-info"/> Business Status
          </h2>
        </div>
        <div className="p-5 flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-color)]">
            <div>
              <p className="text-xs text-text-secondary font-medium">Pending Receivables</p>
              <p className="text-sm font-bold text-text-main mt-0.5">{stats.receivables === '***' ? '***' : `${currencySymbol}${Number(stats.receivables || 0).toLocaleString()}`}</p>
            </div>
            <div className="p-2 bg-[var(--warning-light)] text-[var(--warning-color)] rounded-md">
              <DollarSign size={16} />
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-color)]">
            <div>
              <p className="text-xs text-text-secondary font-medium">Total Customers</p>
              <p className="text-sm font-bold text-text-main mt-0.5">{stats.totalCustomers || 0}</p>
            </div>
            <div className="p-2 bg-[var(--info-light)] text-[var(--info-color)] rounded-md">
              <Users size={16} />
            </div>
          </div>

          <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-color)]">
            <div>
              <p className="text-xs text-text-secondary font-medium">Low Stock Items</p>
              <p className={`text-sm font-bold mt-0.5 ${(stats.lowStockCount || 0) > 0 ? 'text-danger' : 'text-success'}`}>
                {stats.lowStockCount || 0}
              </p>
            </div>
            <div className={`p-2 rounded-md ${(stats.lowStockCount || 0) > 0 ? 'bg-[var(--danger-light)] text-[var(--danger-color)]' : 'bg-[var(--success-light)] text-[var(--success-color)]'}`}>
              <Package size={16} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
