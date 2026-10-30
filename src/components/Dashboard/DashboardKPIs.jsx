import React, { useState } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, Layers, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { PaymentMethodModal, UdhaarBreakdownModal, StockHealthModal } from './DashboardModals';

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

export const DashboardKPIs = ({ 
  stats = {}, 
  trends = {}, 
  currencySymbol = '₹', 
  dateRangeLabel = 'Today',
  sales = [],
  customers = [],
  products = []
}) => {
  const navigate = useNavigate();
  const { requireAuthAndSetup } = useAppContext();

  // Modals state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showUdhaarModal, setShowUdhaarModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  // Metrics resolution (supports both dynamic range and legacy props)
  const isRevenueMasked = stats.revenue === '***';
  const isProfitMasked = stats.netProfit === '***';
  const isExpensesMasked = stats.expenses === '***';

  const revenue = typeof stats.revenue === 'number' && !isNaN(stats.revenue) ? stats.revenue : (stats.todayRevenue || 0);
  const orders = typeof stats.ordersCount === 'number' && !isNaN(stats.ordersCount) ? stats.ordersCount : (stats.todayOrders || 0);
  const grossProfit = typeof stats.grossProfit === 'number' && !isNaN(stats.grossProfit) ? stats.grossProfit : (stats.todayProfit || 0);
  const netProfit = typeof stats.netProfit === 'number' && !isNaN(stats.netProfit) ? stats.netProfit : (stats.todayProfit || 0);
  const expenses = typeof stats.expenses === 'number' && !isNaN(stats.expenses) ? stats.expenses : (stats.todayExpenses || 0);
  const cogs = typeof stats.cogs === 'number' ? stats.cogs : Math.max(0, revenue - grossProfit);
  
  const avgOrderValue = orders > 0 && typeof revenue === 'number' && !isNaN(revenue) 
    ? (revenue / orders).toFixed(0) 
    : '0';
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

  // Trend formatting helper
  const formatTrendBadge = (trend) => {
    if (!trend || trend.value === '0' || trend.value === undefined) {
      return <span className="text-text-muted text-[11px] font-semibold">No prior data</span>;
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--bg-hover)] text-text-main border border-[var(--border-color)]">
        {trend.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {trend.value}%
      </span>
    );
  };

  return (
    <div className="space-y-3 mb-3.5">
      {/* 4 Core Clickable KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Revenue */}
        <div 
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Sales Orders')) return; navigate('/orders'); }}
          className="kpi-card bg-[var(--bg-card)] rounded-xl p-3.5 sm:p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] cursor-pointer group"
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
          <h3 className="text-2xl font-extrabold tracking-tight mb-2 text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {isRevenueMasked ? '******' : `${currencySymbol}${(revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </h3>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold">
              {formatTrendBadge(trends.revTrend)}
              <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs prev.</span>
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] px-2.5 py-0.5 rounded-full">
              Avg Ticket: {isRevenueMasked ? '***' : `${currencySymbol}${avgOrderValue}`}
            </span>
          </div>
        </div>
        
        {/* 2. Orders */}
        <div 
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Sales Orders')) return; navigate('/orders'); }}
          className="kpi-card bg-[var(--bg-card)] rounded-xl p-3.5 sm:p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] cursor-pointer group"
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
          <h3 className="text-2xl font-extrabold tracking-tight mb-2 text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {orders || 0}
          </h3>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold">
              {formatTrendBadge(trends.ordTrend)}
              <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs prev.</span>
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] border border-[var(--border-color)] px-2.5 py-0.5 rounded-full">
              {orders > 0 ? `${orders} Completed` : 'No orders'}
            </span>
          </div>
        </div>

        {/* 3. Gross & Net Profit */}
        <div 
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Profit & Loss Reports')) return; if (!isProfitMasked) navigate('/reports'); }}
          className={`kpi-card bg-[var(--bg-card)] rounded-xl p-3.5 sm:p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] group ${isProfitMasked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
          title={isProfitMasked ? "Restricted: Financial reports are restricted for this role" : "Click to view Profit & Loss Reports"}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="kpi-icon-box group-hover:scale-105 transition-transform">
              {isProfitMasked ? <Lock size={18} /> : <TrendingUp size={18} strokeWidth={2.5} />}
            </div>
            {!isProfitMasked && <Sparkline color="var(--text-secondary)" trend={trends.profTrend?.isPositive ? 1 : -1} />}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">{dateRangeLabel} Net Profit</p>
            <span className="text-[10px] text-text-muted font-bold group-hover:text-text-main transition-colors">
              {isProfitMasked ? 'Restricted' : 'P&L Report →'}
            </span>
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight mb-2 text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {isProfitMasked ? '******' : `${currencySymbol}${(netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </h3>
          <p className="text-[11px] font-semibold text-text-muted mb-2">
            {isProfitMasked ? (
              <span className="text-text-muted italic">Confidential to Management</span>
            ) : (
              <>
                Gross: <span className="text-text-main font-bold">{currencySymbol}{isNaN(Number(grossProfit)) ? '0.00' : Number(grossProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> ({isNaN(Number(grossMargin)) ? '0.0' : grossMargin}%)
              </>
            )}
          </p>
          <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold">
              {!isProfitMasked && formatTrendBadge(trends.profTrend)}
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] px-2.5 py-0.5 rounded-full">
              {isProfitMasked ? 'Locked' : `Net Margin: ${netMargin}%`}
            </span>
          </div>
        </div>

        {/* 4. Operating Expenses */}
        <div 
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Operating Expenses')) return; if (!isExpensesMasked) navigate('/expenses'); }}
          className={`kpi-card bg-[var(--bg-card)] rounded-xl p-3.5 sm:p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] group ${isExpensesMasked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
          title={isExpensesMasked ? "Restricted: Operating expenses are restricted for this role" : "Click to view Operating Expenses & Ledger"}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="kpi-icon-box group-hover:scale-105 transition-transform">
              {isExpensesMasked ? <Lock size={18} /> : <CreditCard size={18} strokeWidth={2.5} />}
            </div>
            {!isExpensesMasked && <Sparkline color="var(--text-muted)" trend={!trends.expTrend?.isPositive ? 1 : -1} />}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">{dateRangeLabel} Expenses</p>
            <span className="text-[10px] text-text-muted font-bold group-hover:text-text-main transition-colors">
              {isExpensesMasked ? 'Restricted' : 'Ledger →'}
            </span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight mb-2 text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {isExpensesMasked ? '******' : `${currencySymbol}${(expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </h3>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold">
              {!isExpensesMasked && formatTrendBadge(trends.expTrend)}
              <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs prev.</span>
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] px-2.5 py-0.5 rounded-full">
              {isExpensesMasked ? 'Locked' : `Ratio: ${expenseRatio}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Operational Strip: Payment Summary + Receivables & Low Stock Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Payment Methods Breakdown - Clickable Tender Pills */}
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Wallet size={13} /> Payment Tender Breakdown
            </span>
            <span className="text-xs font-bold text-text-main">{currencySymbol}{totalTender.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            {['Cash', 'UPI', 'Card', 'Udhaar'].map((m) => {
              const key = m.toLowerCase();
              const val = payments[key] || 0;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedPaymentMethod(m)}
                  className="p-2 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--text-main)] hover:text-[var(--bg-main)] transition-all text-center group cursor-pointer border border-transparent hover:border-[var(--border-color)]"
                  title={`Click to view all ${m} transactions`}
                >
                  <span className="text-[10px] text-text-muted group-hover:text-[var(--bg-main)]/80 block font-semibold">{m}</span>
                  <span className="text-xs font-extrabold text-text-main group-hover:text-[var(--bg-main)] block">
                    {currencySymbol}{val.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-muted group-hover:text-[var(--bg-main)]/80 font-bold">{getPct(val)}%</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Udhaar (Receivables) - Clickable Drilldown */}
        <div 
          data-test="udhaar-card"
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Khata & Udhaar')) return; setShowUdhaarModal(true); }}
          className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-[var(--text-main)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group"
          title="Click to view all customer Khata balances"
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

        {/* Inventory Restock Alert - Clickable Drilldown */}
        <div 
          data-test="stock-card"
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Stock Management')) return; setShowStockModal(true); }}
          className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-[var(--text-main)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group"
          title="Click to audit low-stock items and reorder recommendations"
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

      {/* Modals */}
      <PaymentMethodModal
        isOpen={Boolean(selectedPaymentMethod)}
        onClose={() => setSelectedPaymentMethod(null)}
        methodName={selectedPaymentMethod || 'Cash'}
        sales={sales}
        currencySymbol={currencySymbol}
        dateRangeLabel={dateRangeLabel}
      />

      <UdhaarBreakdownModal
        isOpen={showUdhaarModal}
        onClose={() => setShowUdhaarModal(false)}
        customers={customers}
        currencySymbol={currencySymbol}
      />

      <StockHealthModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        products={products}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};
