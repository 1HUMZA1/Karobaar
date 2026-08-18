import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Line } from 'react-chartjs-2';
import { Activity, Zap, DollarSign, Package, Users, Receipt, FileText, Settings, Edit2, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../ui/Button.css';

const ALL_AVAILABLE_ACTIONS = [
  { id: 'pos', label: 'New Sale', icon: <DollarSign size={16} />, path: '/pos', primary: true },
  { id: 'products', label: 'Add Product', icon: <Package size={16} />, path: '/products', primary: false },
  { id: 'customers', label: 'Add Customer', icon: <Users size={16} />, path: '/customers', primary: false },
  { id: 'expenses', label: 'Record Expense', icon: <Receipt size={16} />, path: '/expenses', primary: false },
  { id: 'invoices', label: 'Create Invoice', icon: <FileText size={16} />, path: '/invoices', primary: false },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} />, path: '/settings', primary: false },
  { id: 'orders', label: 'Orders', icon: <Activity size={16} />, path: '/orders', primary: false },
  { id: 'suppliers', label: 'Suppliers', icon: <Users size={16} />, path: '/suppliers', primary: false },
  { id: 'reports', label: 'Reports', icon: <FileText size={16} />, path: '/reports', primary: false },
];

export const DashboardAnalytics = ({ chartData, currencySymbol, stats = {}, trends = {} }) => {
  const navigate = useNavigate();
  const [range, setRange] = useState('7D');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedActionIds, setSelectedActionIds] = useState(() => {
    const saved = localStorage.getItem('karobaar-quick-actions');
    if (saved) return JSON.parse(saved);
    return ['pos', 'products', 'customers', 'expenses', 'invoices', 'settings'];
  });
  
  // Temporary state for the modal
  const [tempActionIds, setTempActionIds] = useState([]);

  const openEditModal = () => {
    setTempActionIds([...selectedActionIds]);
    setIsEditModalOpen(true);
  };

  const toggleAction = (id) => {
    if (tempActionIds.includes(id)) {
      setTempActionIds(prev => prev.filter(a => a !== id));
    } else {
      setTempActionIds(prev => [...prev, id]);
    }
  };

  const saveActions = () => {
    setSelectedActionIds(tempActionIds);
    localStorage.setItem('karobaar-quick-actions', JSON.stringify(tempActionIds));
    setIsEditModalOpen(false);
  };

  const cancelActions = () => {
    setIsEditModalOpen(false);
  };

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

  const quickActions = ALL_AVAILABLE_ACTIONS.filter(action => selectedActionIds.includes(action.id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
      
      {/* Revenue Overview Chart */}
      <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-xl overflow-hidden shadow-md flex flex-col">
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <Activity size={18} className="text-primary"/> Revenue Overview
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
      <div className="lg:col-span-1 bg-[var(--bg-card)] rounded-xl shadow-md flex flex-col">
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <Zap size={18} className="text-warning"/> Quick Actions
          </h2>
          <button 
            onClick={openEditModal}
            className="text-text-muted hover:text-text-main transition-colors bg-[var(--bg-elevated)] p-1.5 rounded-md border border-[var(--border-color)] hover:border-text-muted"
            title="Edit Quick Actions"
          >
            <Edit2 size={14} />
          </button>
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
      <div className="lg:col-span-1 bg-[var(--bg-card)] rounded-xl shadow-md flex flex-col">
        <div className="p-6">
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <Activity size={18} className="text-info"/> Business Status
          </h2>
        </div>
        <div className="p-6 pt-0 flex-1 flex flex-col gap-3">
          <div className="flex justify-between items-center bg-[var(--bg-hover)] p-4 rounded-xl transition-colors hover:bg-[var(--bg-tertiary)]">
            <div>
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Pending Receivables</p>
              <p className="text-base font-bold text-text-main">{stats.receivables === '***' ? '***' : `${currencySymbol}${Number(stats.receivables || 0).toLocaleString()}`}</p>
            </div>
            <div className="p-2.5 bg-[var(--warning-light)] text-[var(--warning-color)] rounded-lg">
              <DollarSign size={18} />
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-[var(--bg-hover)] p-4 rounded-xl transition-colors hover:bg-[var(--bg-tertiary)]">
            <div>
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Total Customers</p>
              <p className="text-base font-bold text-text-main">{stats.totalCustomers || 0}</p>
            </div>
            <div className="p-2.5 bg-[var(--info-light)] text-[var(--info-color)] rounded-lg">
              <Users size={18} />
            </div>
          </div>

          <div className="flex justify-between items-center bg-[var(--bg-hover)] p-4 rounded-xl transition-colors hover:bg-[var(--bg-tertiary)]">
            <div>
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Low Stock Items</p>
              <p className={`text-base font-bold ${(stats.lowStockCount || 0) > 0 ? 'text-danger' : 'text-success'}`}>
                {stats.lowStockCount || 0}
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${(stats.lowStockCount || 0) > 0 ? 'bg-[var(--danger-light)] text-[var(--danger-color)]' : 'bg-[var(--success-light)] text-[var(--success-color)]'}`}>
              <Package size={18} />
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && document.body && createPortal(
        <div className="biz-modal-overlay">
          <div className="biz-modal-content">
            <div className="biz-modal-header">
              <h2>Edit Quick Actions</h2>
              <button className="text-text-muted hover:text-text-main" onClick={cancelActions}>
                <X size={20} />
              </button>
            </div>
            
            <div className="biz-modal-body space-y-4">
              <p className="text-sm text-text-muted">Select the features you want to appear in your Quick Actions panel.</p>
              
              <div className="flex flex-col gap-1">
                {ALL_AVAILABLE_ACTIONS.map(action => (
                  <div 
                    key={action.id} 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${tempActionIds.includes(action.id) ? 'bg-[var(--primary-light)] text-[var(--primary-color)] font-medium' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => toggleAction(action.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={tempActionIds.includes(action.id) ? 'text-[var(--primary-color)]' : 'text-[var(--text-tertiary)]'}>
                        {action.icon}
                      </div>
                      <span style={{ fontWeight: tempActionIds.includes(action.id) ? 600 : 500 }}>
                        {action.label}
                      </span>
                    </div>
                    {tempActionIds.includes(action.id) && (
                      <Check size={18} style={{ color: 'var(--primary-color)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="biz-modal-footer">
              <button 
                onClick={cancelActions}
                className="biz-btn biz-btn-ghost"
              >
                Cancel
              </button>
              <button 
                onClick={saveActions}
                className="biz-btn biz-btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
