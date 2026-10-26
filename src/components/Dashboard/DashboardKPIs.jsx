import React from 'react';
import { DollarSign, ShoppingBag, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Sparkline = ({ color, trend }) => {
  // A simple pseudo-sparkline for visual flair
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

export const DashboardKPIs = ({ stats, trends, currencySymbol }) => {
  const avgOrderValue = stats.todayOrders > 0 ? (stats.todayRevenue / stats.todayOrders).toFixed(0) : '0';
  const marginPct = stats.todayRevenue > 0 ? Math.round((stats.todayProfit / stats.todayRevenue) * 100) : 0;
  const expenseRatio = stats.todayRevenue > 0 ? Math.round((stats.todayExpenses / stats.todayRevenue) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Today's Revenue */}
      <div className="kpi-card bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)]">
        <div className="flex justify-between items-start mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#09090b] text-[#ffffff] flex items-center justify-center shadow-sm">
            <DollarSign size={18} strokeWidth={2.5} />
          </div>
          <Sparkline color="var(--text-main)" trend={trends.revTrend.isPositive ? 1 : -1} />
        </div>
        <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Today's Revenue</p>
        <h3 className="text-3xl font-extrabold tracking-tight mb-4 text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {currencySymbol}{(stats.todayRevenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </h3>
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-light)] text-xs">
          <div className="flex items-center gap-1 font-bold">
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${trends.revTrend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {trends.revTrend.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {trends.revTrend.value}%
            </span>
            <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs yest.</span>
          </div>
          <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] px-2.5 py-0.5 rounded-full">
            Avg Ticket: {currencySymbol}{avgOrderValue}
          </span>
        </div>
      </div>
      
      {/* 2. Today's Orders */}
      <div className="kpi-card bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)]">
        <div className="flex justify-between items-start mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#09090b] text-[#ffffff] flex items-center justify-center shadow-sm">
            <ShoppingBag size={18} strokeWidth={2.5} />
          </div>
          <Sparkline color="var(--text-main)" trend={trends.ordTrend.isPositive ? 1 : -1} />
        </div>
        <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Today's Orders</p>
        <h3 className="text-3xl font-extrabold tracking-tight mb-4 text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {stats.todayOrders || 0}
        </h3>
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-light)] text-xs">
          <div className="flex items-center gap-1 font-bold">
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${trends.ordTrend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {trends.ordTrend.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {trends.ordTrend.value}%
            </span>
            <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs yest.</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            100% Fulfilled
          </span>
        </div>
      </div>

      {/* 3. Estimated Profit */}
      <div className="kpi-card bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)]">
        <div className="flex justify-between items-start mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#09090b] text-[#ffffff] flex items-center justify-center shadow-sm">
            <TrendingUp size={18} strokeWidth={2.5} />
          </div>
          <Sparkline color="var(--text-secondary)" trend={trends.profTrend.isPositive ? 1 : -1} />
        </div>
        <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Estimated Profit</p>
        <h3 className="text-3xl font-extrabold tracking-tight mb-4 text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {currencySymbol}{(stats.todayProfit || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </h3>
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-light)] text-xs">
          <div className="flex items-center gap-1 font-bold">
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${trends.profTrend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {trends.profTrend.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {trends.profTrend.value}%
            </span>
            <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs yest.</span>
          </div>
          <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] px-2.5 py-0.5 rounded-full">
            Margin: {marginPct}%
          </span>
        </div>
      </div>

      {/* 4. Expenses */}
      <div className="kpi-card bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)]">
        <div className="flex justify-between items-start mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#09090b] text-[#ffffff] flex items-center justify-center shadow-sm">
            <CreditCard size={18} strokeWidth={2.5} />
          </div>
          <Sparkline color="var(--text-muted)" trend={!trends.expTrend.isPositive ? 1 : -1} />
        </div>
        <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Expenses</p>
        <h3 className="text-3xl font-extrabold tracking-tight mb-4 text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {currencySymbol}{(stats.todayExpenses || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </h3>
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-light)] text-xs">
          <div className="flex items-center gap-1 font-bold">
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${!trends.expTrend.isPositive ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {!trends.expTrend.isPositive ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
              {trends.expTrend.value}%
            </span>
            <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs yest.</span>
          </div>
          <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] px-2.5 py-0.5 rounded-full">
            Ratio: {expenseRatio}%
          </span>
        </div>
      </div>
    </div>
  );
};
