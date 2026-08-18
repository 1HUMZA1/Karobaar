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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Today's Revenue */}
      <div className="kpi-card bg-[var(--bg-card)] rounded-xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-start mb-5">
          <div className="p-3 rounded-full bg-[var(--success-light)] text-[var(--success-color)]"><DollarSign size={20}/></div>
          <Sparkline color={trends.revTrend.isPositive ? '#22c55e' : '#ef4444'} trend={trends.revTrend.isPositive ? 1 : -1} />
        </div>
        <p className="text-sm font-medium text-text-secondary mb-1">Today's Revenue</p>
        <h3 className="text-3xl font-extrabold tracking-tight mb-2 text-text-main">{currencySymbol}{(stats.todayRevenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        <div className={`flex items-center text-xs font-semibold ${trends.revTrend.isPositive ? 'text-success' : 'text-danger'}`}>
          {trends.revTrend.isPositive ? <ArrowUpRight size={14} className="mr-1"/> : <ArrowDownRight size={14} className="mr-1"/>}
          {trends.revTrend.value}% <span className="text-text-muted ml-1 font-medium">vs yesterday</span>
        </div>
      </div>
      
      {/* 2. Today's Orders */}
      <div className="kpi-card bg-[var(--bg-card)] rounded-xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-start mb-5">
          <div className="p-3 rounded-full bg-[var(--primary-light)] text-[var(--primary-color)]"><ShoppingBag size={20}/></div>
          <Sparkline color={trends.ordTrend.isPositive ? '#22c55e' : '#ef4444'} trend={trends.ordTrend.isPositive ? 1 : -1} />
        </div>
        <p className="text-sm font-medium text-text-secondary mb-1">Today's Orders</p>
        <h3 className="text-3xl font-extrabold tracking-tight mb-2 text-text-main">{stats.todayOrders || 0}</h3>
        <div className={`flex items-center text-xs font-semibold ${trends.ordTrend.isPositive ? 'text-success' : 'text-danger'}`}>
          {trends.ordTrend.isPositive ? <ArrowUpRight size={14} className="mr-1"/> : <ArrowDownRight size={14} className="mr-1"/>}
          {trends.ordTrend.value}% <span className="text-text-muted ml-1 font-medium">vs yesterday</span>
        </div>
      </div>

      {/* 3. Estimated Profit */}
      <div className="kpi-card bg-[var(--bg-card)] rounded-xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-start mb-5">
          <div className="p-3 rounded-full bg-[var(--info-light)] text-[var(--info-color)]"><TrendingUp size={20}/></div>
          <Sparkline color={trends.profTrend.isPositive ? '#3b82f6' : '#ef4444'} trend={trends.profTrend.isPositive ? 1 : -1} />
        </div>
        <p className="text-sm font-medium text-text-secondary mb-1">Estimated Profit</p>
        <h3 className="text-3xl font-extrabold tracking-tight mb-2 text-text-main">{currencySymbol}{(stats.todayProfit || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        <div className={`flex items-center text-xs font-semibold ${trends.profTrend.isPositive ? 'text-success' : 'text-danger'}`}>
          {trends.profTrend.isPositive ? <ArrowUpRight size={14} className="mr-1"/> : <ArrowDownRight size={14} className="mr-1"/>}
          {trends.profTrend.value}% <span className="text-text-muted ml-1 font-medium">vs yesterday</span>
        </div>
      </div>

      {/* 4. Expenses */}
      <div className="kpi-card bg-[var(--bg-card)] rounded-xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-start mb-5">
          <div className="p-3 rounded-full bg-[var(--warning-light)] text-[var(--warning-color)]"><CreditCard size={20}/></div>
          <Sparkline color={!trends.expTrend.isPositive ? '#22c55e' : '#f59e0b'} trend={!trends.expTrend.isPositive ? 1 : -1} />
        </div>
        <p className="text-sm font-medium text-text-secondary mb-1">Expenses</p>
        <h3 className="text-3xl font-extrabold tracking-tight mb-2 text-text-main">{currencySymbol}{(stats.todayExpenses || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        <div className={`flex items-center text-xs font-semibold ${!trends.expTrend.isPositive ? 'text-success' : 'text-warning'}`}>
          {!trends.expTrend.isPositive ? <ArrowDownRight size={14} className="mr-1"/> : <ArrowUpRight size={14} className="mr-1"/>}
          {trends.expTrend.value}% <span className="text-text-muted ml-1 font-medium">vs yesterday</span>
        </div>
      </div>
    </div>
  );
};
