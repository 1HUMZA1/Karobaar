import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Line } from 'react-chartjs-2';
import { 
  Activity, 
  Zap, 
  DollarSign, 
  Package, 
  Users, 
  Receipt, 
  FileText, 
  Settings, 
  Edit2, 
  X, 
  Check, 
  BarChart3,
  TrendingUp,
  Percent
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../ui/Button.css';

const ALL_AVAILABLE_ACTIONS = [
  { id: 'pos', label: 'New Sale', icon: <Zap size={16} />, path: '/pos', primary: true, shortcut: 'F2' },
  { id: 'products', label: 'Add Product', icon: <Package size={16} />, path: '/products', primary: false },
  { id: 'customers', label: 'Add Customer', icon: <Users size={16} />, path: '/customers', primary: false },
  { id: 'expenses', label: 'Record Expense', icon: <Receipt size={16} />, path: '/expenses', primary: false },
  { id: 'invoices', label: 'Create Invoice', icon: <FileText size={16} />, path: '/invoices', primary: false },
  { id: 'reports', label: 'P&L Reports', icon: <BarChart3 size={16} />, path: '/reports', primary: false },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} />, path: '/settings', primary: false },
  { id: 'orders', label: 'All Orders', icon: <Activity size={16} />, path: '/orders', primary: false },
  { id: 'suppliers', label: 'Suppliers', icon: <Users size={16} />, path: '/suppliers', primary: false }
];

export const DashboardAnalytics = ({ 
  chartData = { labels: [], revenueData: [], expenseData: [], profitData: [] }, 
  currencySymbol = '₹', 
  stats = {}, 
  trends = {},
  dateRange = 'today',
  onDateRangeChange
}) => {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedActionIds, setSelectedActionIds] = useState(() => {
    try {
      const saved = localStorage.getItem('karobaar-quick-actions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 4) return parsed;
      }
    } catch (_) {}
    return ['pos', 'products', 'customers', 'expenses', 'invoices', 'reports'];
  });
  
  const [tempActionIds, setTempActionIds] = useState([]);

  const openEditModal = () => {
    setTempActionIds([...selectedActionIds]);
    setIsEditModalOpen(true);
  };

  const toggleAction = (id) => {
    if (tempActionIds.includes(id)) {
      if (tempActionIds.length > 2) {
        setTempActionIds(prev => prev.filter(a => a !== id));
      }
    } else {
      setTempActionIds(prev => [...prev, id]);
    }
  };

  const saveActions = () => {
    setSelectedActionIds(tempActionIds);
    try {
      localStorage.setItem('karobaar-quick-actions', JSON.stringify(tempActionIds));
    } catch (_) {}
    setIsEditModalOpen(false);
  };

  const cancelActions = () => {
    setIsEditModalOpen(false);
  };

  // Check if all chart data values are zero to handle rendering cleanly
  const hasNonZeroData = (chartData.revenueData || []).some(v => v > 0) ||
                         (chartData.expenseData || []).some(v => v > 0) ||
                         (chartData.profitData || []).some(v => v > 0);

  const chartObj = {
    labels: chartData.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: chartData.revenueData || [],
        borderColor: 'var(--text-main, #000000)',
        backgroundColor: 'rgba(120, 120, 120, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: hasNonZeroData ? 1 : 0,
        pointHoverRadius: 5,
      },
      {
        label: 'Expenses',
        data: chartData.expenseData || [],
        borderColor: '#71717a',
        backgroundColor: 'transparent',
        borderDash: [5, 4],
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'Profit',
        data: chartData.profitData || [],
        borderColor: '#a1a1aa',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
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
    layout: {
      padding: {
        left: 10,
        right: 14,
        top: 10,
        bottom: 8
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#141414',
        titleColor: '#F5F5F5',
        bodyColor: '#a3a3a3',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${currencySymbol}${Number(context.parsed.y || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { 
          color: 'var(--text-muted, #71717a)', 
          font: { size: 11, family: 'Inter' }, 
          padding: 6 
        },
        border: { display: false }
      },
      y: { 
        beginAtZero: true,
        suggestedMax: 100, // Prevents fractional ticks like $0.2, $0.4 when revenue is $0
        grid: { color: 'rgba(120, 120, 120, 0.08)', drawBorder: false }, 
        ticks: { 
          precision: 0,
          color: 'var(--text-muted, #71717a)', 
          font: { size: 11, family: 'Inter' },
          padding: 10,
          callback: (value) => `${currencySymbol}${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`
        },
        border: { display: false }
      }
    }
  };

  const quickActions = ALL_AVAILABLE_ACTIONS.filter(action => selectedActionIds.includes(action.id));

  // Resolved business metrics for Store Vitality (Zero Redundancy with row above)
  const revenueVal = typeof stats.revenue === 'number' ? stats.revenue : (stats.todayRevenue || 0);
  const ordersVal = typeof stats.ordersCount === 'number' ? stats.ordersCount : (stats.todayOrders || 0);
  const avgOrderVal = ordersVal > 0 && revenueVal > 0 ? (revenueVal / ordersVal).toFixed(2) : '0.00';
  const grossMarginVal = stats.grossMargin !== undefined && stats.grossMargin !== 'NaN' ? stats.grossMargin : '0';
  const totalCustomersVal = stats.totalCustomers || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      
      {/* 1. Revenue Overview Chart (2 Columns) */}
      <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="p-5 sm:p-6 flex flex-wrap justify-between items-center gap-3.5 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-text-main">
              <Activity size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-text-main leading-tight">Revenue & Profit Overview</h2>
              <p className="text-[11px] text-text-muted font-medium">Live operational trend</p>
            </div>
          </div>

          {/* Clean Visual Legend */}
          <div className="flex items-center gap-3.5 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-text-main">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-main)]"></span> Revenue
            </span>
            <span className="flex items-center gap-1.5 text-text-muted">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-[#71717a]"></span> Expenses
            </span>
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a1a1aa]"></span> Profit
            </span>
          </div>
        </div>
        
        <div className="p-5 sm:p-6 flex-1 relative min-h-[340px]">
          {chartData.labels && chartData.labels.length > 0 ? (
            <Line data={chartObj} options={chartOptions} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted text-xs">
              <Activity size={24} className="opacity-30 mb-2" />
              <span>No chart interval records for this period</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Quick Actions (1 Column, Balanced Grid) */}
      <div className="lg:col-span-1 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm flex flex-col justify-between p-5 sm:p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-text-main">
              <Zap size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-text-main leading-tight">Quick Actions</h2>
              <p className="text-[11px] text-text-muted font-medium">1-tap operations</p>
            </div>
          </div>
          <button 
            onClick={openEditModal}
            className="text-text-muted hover:text-text-main transition-colors bg-[var(--bg-hover)] p-1.5 rounded-lg border border-[var(--border-color)] hover:border-text-muted"
            title="Customize Quick Actions"
          >
            <Edit2 size={13} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 flex-1">
          {quickActions.slice(0, 6).map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 group text-center cursor-pointer ${
                action.primary 
                  ? 'bg-[#09090b] text-[#ffffff] border-[#27272a] shadow-sm hover:bg-zinc-800 col-span-2 flex-row gap-2 py-2.5' 
                  : 'bg-[var(--bg-hover)] text-text-main border-[var(--border-color)] hover:border-[var(--text-main)] hover:bg-[var(--bg-card)] hover:-translate-y-0.5'
              }`}
            >
              <div className="text-text-main group-hover:scale-110 transition-transform flex items-center gap-1.5">
                {action.icon}
                {action.shortcut && (
                  <kbd className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-bold">{action.shortcut}</kbd>
                )}
              </div>
              <span className={`text-[11px] font-bold ${action.primary ? 'text-white' : 'text-text-main mt-1.5'}`}>
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Store Vitality & Health (1 Column, Zero Redundancy) */}
      <div className="lg:col-span-1 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm flex flex-col justify-between p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-text-main">
            <TrendingUp size={16} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-text-main leading-tight">Store Vitality</h2>
            <p className="text-[11px] text-text-muted font-medium">Efficiency & customer base</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between gap-3.5">
          {/* A. Total Registered Customers */}
          <div 
            onClick={() => navigate('/customers')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-[var(--text-main)] transition-all cursor-pointer group"
            title="Click to view all Customers"
          >
            <div>
              <p className="text-[10.5px] text-text-muted font-bold uppercase tracking-wider">Total Customers</p>
              <h4 className="text-lg font-extrabold text-text-main mt-0.5">{totalCustomersVal.toLocaleString()}</h4>
              <p className="text-[10px] text-text-secondary">Registered customer accounts</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-text-main group-hover:scale-105 transition-transform">
              <Users size={16} />
            </div>
          </div>

          {/* B. Average Order Value (AOV) */}
          <div 
            onClick={() => navigate('/orders')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-[var(--text-main)] transition-all cursor-pointer group"
            title="Click to view Orders breakdown"
          >
            <div>
              <p className="text-[10.5px] text-text-muted font-bold uppercase tracking-wider">Avg Ticket Size (AOV)</p>
              <h4 className="text-lg font-extrabold text-text-main mt-0.5">
                {stats.revenue === '***' ? '***' : `${currencySymbol}${avgOrderVal}`}
              </h4>
              <p className="text-[10px] text-text-secondary">Average spend per sale</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-text-main group-hover:scale-105 transition-transform">
              <DollarSign size={16} />
            </div>
          </div>

          {/* C. Gross Profit Margin */}
          <div 
            onClick={() => navigate('/reports')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-[var(--text-main)] transition-all cursor-pointer group"
            title="Click to view Profit & Loss Reports"
          >
            <div>
              <p className="text-[10.5px] text-text-muted font-bold uppercase tracking-wider">Gross Margin</p>
              <h4 className="text-lg font-extrabold text-text-main mt-0.5">
                {stats.netProfit === '***' ? '***' : `${grossMarginVal}%`}
              </h4>
              <p className="text-[10px] text-text-secondary">Product markup efficiency</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-text-main group-hover:scale-105 transition-transform">
              <Percent size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Customize Quick Actions */}
      {isEditModalOpen && document.body && createPortal(
        <div className="biz-modal-overlay">
          <div className="biz-modal-content">
            <div className="biz-modal-header">
              <h2 className="text-base font-bold text-text-main">Customize Quick Actions</h2>
              <button className="text-text-muted hover:text-text-main" onClick={cancelActions}>
                <X size={18} />
              </button>
            </div>
            
            <div className="biz-modal-body space-y-3">
              <p className="text-xs text-text-muted">Select the tools you use most frequently on your dashboard.</p>
              
              <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
                {ALL_AVAILABLE_ACTIONS.map(action => (
                  <div 
                    key={action.id} 
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      tempActionIds.includes(action.id) 
                        ? 'bg-[var(--bg-hover)] border-[var(--text-main)] text-text-main font-bold' 
                        : 'bg-transparent border-[var(--border-color)] text-text-secondary hover:bg-[var(--bg-hover)]'
                    }`}
                    onClick={() => toggleAction(action.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="text-text-main">
                        {action.icon}
                      </div>
                      <span className="text-xs font-semibold">
                        {action.label}
                      </span>
                    </div>
                    {tempActionIds.includes(action.id) && (
                      <Check size={16} className="text-text-main" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="biz-modal-footer flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
              <button 
                onClick={cancelActions}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-text-main border border-[var(--border-color)]"
              >
                Cancel
              </button>
              <button 
                onClick={saveActions}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#09090b] text-[#ffffff] hover:bg-zinc-800"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
