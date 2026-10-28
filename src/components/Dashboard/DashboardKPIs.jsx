import React from 'react';
import { DollarSign, ShoppingBag, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sparkline = ({ color, trend }) => {
  const isUp = trend >= 0;
  return (
    <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d={isUp ? "M2 20 L14 12 L24 16 L46 4" : "M2 4 L14 12 L24 8 L46 20"} 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {isUp && (
        <path d="M46 4 L46 10 M46 4 L40 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      )}
      {!isUp && (
        <path d="M46 20 L46 14 M46 20 L40 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      )}
    </svg>
  );
};

export const DashboardKPIs = ({ stats = {}, trends = {}, currencySymbol = '₹', dateRangeLabel = 'Today' }) => {
  const navigate = useNavigate();

  // Metrics resolution (supports both dynamic range and legacy props)
  const revenue = typeof stats.revenue === 'number' && !isNaN(stats.revenue) ? stats.revenue : (stats.todayRevenue || 0);
  const orders = typeof stats.ordersCount === 'number' && !isNaN(stats.ordersCount) ? stats.ordersCount : (stats.todayOrders || 0);
  const grossProfit = typeof stats.grossProfit === 'number' && !isNaN(stats.grossProfit) ? stats.grossProfit : (stats.todayProfit || 0);
  const netProfit = typeof stats.netProfit === 'number' && !isNaN(stats.netProfit) ? stats.netProfit : (stats.todayProfit || 0);
  const expenses = typeof stats.expenses === 'number' && !isNaN(stats.expenses) ? stats.expenses : (stats.todayExpenses || 0);
  
  const avgOrderValue = orders > 0 ? (revenue / orders).toFixed(0) : '0';
  const grossMargin = stats.grossMargin !== undefined && stats.grossMargin !== 'NaN' ? stats.grossMargin : (revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0');
  const netMargin = stats.netMargin !== undefined && stats.netMargin !== 'NaN' ? stats.netMargin : (revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0');
  const expenseRatio = revenue > 0 ? Math.round((expenses / revenue) * 100) : 0;

  const payments = stats.paymentBreakdown || {
    cash: stats.cash || 0,
    upi: stats.upi || 0,
    card: stats.card || 0,
    udhaar: stats.receivables || 0
  };
  const totalTender = (payments.cash || 0) + (payments.upi || 0) + (payments.card || 0) + (payments.udhaar || 0);

  const getPct = (val) => totalTender > 0 ? Math.round(((val || 0) / totalTender) * 100) : 0;

  return (
    <div className="space-y-4 mb-6">
      {/* 4 Core Clickable KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Revenue */}
        <div 
          onClick={() => navigate('/orders')}
          className="kpi-card bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] cursor-pointer group"
          title="Click to view all Orders & Sales"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="kpi-icon-box group-hover:scale-105 transition-transform">
              <DollarSign size={18} strokeWidth={2.5} />
            </div>
            <Sparkline color="var(--text-main)" trend={trends.revTrend?.isPositive ? 1 : -1} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">{dateRangeLabel} Sales</p>
            <span className="text-[10px] text-text-muted font-bold group-hover:text-text-main transition-colors">View Orders →</span>
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight mb-4 text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {currencySymbol}{(revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--bg-hover)] text-text-main border border-[var(--border-color)]">
                {trends.revTrend?.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {trends.revTrend?.value || '0'}%
              </span>
              <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs prev.</span>
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] px-2.5 py-0.5 rounded-full">
              Avg Ticket: {currencySymbol}{avgOrderValue}
            </span>
          </div>
        </div>
        
        {/* 2. Orders */}
        <div 
          onClick={() => navigate('/orders')}
          className="kpi-card bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] cursor-pointer group"
          title="Click to view Order History"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="kpi-icon-box group-hover:scale-105 transition-transform">
              <ShoppingBag size={18} strokeWidth={2.5} />
            </div>
            <Sparkline color="var(--text-main)" trend={trends.ordTrend?.isPositive ? 1 : -1} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">{dateRangeLabel} Orders</p>
            <span className="text-[10px] text-text-muted font-bold group-hover:text-text-main transition-colors">Details →</span>
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight mb-4 text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {orders || 0}
          </h3>
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--bg-hover)] text-text-main border border-[var(--border-color)]">
                {trends.ordTrend?.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {trends.ordTrend?.value || '0'}%
              </span>
              <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs prev.</span>
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] border border-[var(--border-color)] px-2.5 py-0.5 rounded-full">
              100% Fulfilled
            </span>
          </div>
        </div>

        {/* 3. Gross & Net Profit */}
        <div 
          onClick={() => navigate('/reports')}
          className="kpi-card bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] cursor-pointer group"
          title="Click to view Profit & Loss Reports"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="kpi-icon-box group-hover:scale-105 transition-transform">
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
            <Sparkline color="var(--text-secondary)" trend={trends.profTrend?.isPositive ? 1 : -1} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">{dateRangeLabel} Net Profit</p>
            <span className="text-[10px] text-text-muted font-bold group-hover:text-text-main transition-colors">P&L Report →</span>
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight mb-2 text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {currencySymbol}{(netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] font-semibold text-text-muted mb-2">
            Gross: <span className="text-text-main font-bold">{currencySymbol}{isNaN(Number(grossProfit)) ? '0.00' : Number(grossProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> ({isNaN(Number(grossMargin)) ? '0.0' : grossMargin}%)
          </p>
          <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--bg-hover)] text-text-main border border-[var(--border-color)]">
                {trends.profTrend?.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {trends.profTrend?.value || '0'}%
              </span>
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] px-2.5 py-0.5 rounded-full">
              Net Margin: {netMargin}%
            </span>
          </div>
        </div>

        {/* 4. Operating Expenses */}
        <div 
          onClick={() => navigate('/expenses')}
          className="kpi-card bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] cursor-pointer group"
          title="Click to view Operating Expenses & Ledger"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="kpi-icon-box group-hover:scale-105 transition-transform">
              <CreditCard size={18} strokeWidth={2.5} />
            </div>
            <Sparkline color="var(--text-muted)" trend={!trends.expTrend?.isPositive ? 1 : -1} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">{dateRangeLabel} Expenses</p>
            <span className="text-[10px] text-text-muted font-bold group-hover:text-text-main transition-colors">Ledger →</span>
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight mb-4 text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {currencySymbol}{(expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--bg-hover)] text-text-main border border-[var(--border-color)]">
                {!trends.expTrend?.isPositive ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                {trends.expTrend?.value || '0'}%
              </span>
              <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs prev.</span>
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] px-2.5 py-0.5 rounded-full">
              Ratio: {expenseRatio}%
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Operational Strip: Payment Summary + Receivables & Low Stock Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Payment Methods Breakdown */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Wallet size={13} /> Payment Tender Breakdown
            </span>
            <span className="text-xs font-bold text-text-main">{currencySymbol}{totalTender.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-2 rounded-xl bg-[var(--bg-hover)]">
              <span className="text-[10px] text-text-muted block font-semibold">Cash</span>
              <span className="text-xs font-extrabold text-text-main block">{currencySymbol}{(payments.cash || 0).toLocaleString()}</span>
              <span className="text-[10px] text-text-muted font-bold">{getPct(payments.cash)}%</span>
            </div>
            <div className="p-2 rounded-xl bg-[var(--bg-hover)]">
              <span className="text-[10px] text-text-muted block font-semibold">UPI</span>
              <span className="text-xs font-extrabold text-text-main block">{currencySymbol}{(payments.upi || 0).toLocaleString()}</span>
              <span className="text-[10px] text-text-muted font-bold">{getPct(payments.upi)}%</span>
            </div>
            <div className="p-2 rounded-xl bg-[var(--bg-hover)]">
              <span className="text-[10px] text-text-muted block font-semibold">Card</span>
              <span className="text-xs font-extrabold text-text-main block">{currencySymbol}{(payments.card || 0).toLocaleString()}</span>
              <span className="text-[10px] text-text-muted font-bold">{getPct(payments.card)}%</span>
            </div>
            <div className="p-2 rounded-xl bg-[var(--bg-hover)]">
              <span className="text-[10px] text-text-muted block font-semibold">Udhaar</span>
              <span className="text-xs font-extrabold text-text-main block">{currencySymbol}{(payments.udhaar || 0).toLocaleString()}</span>
              <span className="text-[10px] text-text-muted font-bold">{getPct(payments.udhaar)}%</span>
            </div>
          </div>
        </div>

        {/* Customer Udhaar (Receivables) */}
        <div 
          onClick={() => navigate('/payments')}
          className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-[var(--text-main)] transition-all cursor-pointer flex items-center justify-between group"
          title="Click to view Khata / Udhaar records"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center text-text-main group-hover:scale-105 transition-transform">
              <Layers size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Pending Udhaar (Khata)</p>
              <h4 className="text-xl font-extrabold text-text-main">{currencySymbol}{(stats.receivables || 0).toLocaleString()}</h4>
              <p className="text-[10px] text-text-secondary mt-0.5">Outstanding from customers</p>
            </div>
          </div>
          <span className="text-xs font-bold text-text-muted group-hover:text-text-main transition-colors">Manage →</span>
        </div>

        {/* Inventory Restock Alert */}
        <div 
          onClick={() => navigate('/inventory')}
          className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-[var(--text-main)] transition-all cursor-pointer flex items-center justify-between group"
          title="Click to view Inventory & Stock levels"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center text-text-main group-hover:scale-105 transition-transform">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Stock Health</p>
              <h4 className="text-xl font-extrabold text-text-main">
                {stats.lowStockCount || 0} <span className="text-xs font-medium text-text-muted">products</span>
              </h4>
              <p className="text-[10px] text-text-secondary mt-0.5">
                {(stats.lowStockCount || 0) > 0 ? 'Requires reordering soon' : 'All items well stocked'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-text-muted group-hover:text-text-main transition-colors">Audit →</span>
        </div>
      </div>
    </div>
  );
};
