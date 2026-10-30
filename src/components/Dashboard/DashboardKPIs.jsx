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
      {/* 4 Core Clickable KPI Cards - Balanced, non-overflowing Apple/Linear layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Revenue */}
        <div 
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Sales Orders')) return; navigate('/orders'); }}
          className="kpi-card bg-[var(--bg-card)] rounded-2xl p-4 sm:p-4.5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] cursor-pointer group flex flex-col justify-between min-h-[168px]"
          title="Click to view all Orders & Sales"
        >
          <div>
            <div className="flex justify-between items-start mb-2.5">
              <div className="kpi-icon-box group-hover:scale-105 transition-transform">
                <DollarSign size={18} strokeWidth={2.5} />
              </div>
              <Sparkline color="var(--text-main)" trend={trends.revTrend?.isPositive ? 1 : -1} />
            </div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{dateRangeLabel} Sales</p>
              <span className="text-[10px] text-text-muted font-bold group-hover:text-text-main transition-colors">View Orders →</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {isRevenueMasked ? '******' : `${currencySymbol}${(revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h3>
          </div>
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold shrink-0">
              {formatTrendBadge(trends.revTrend)}
              <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs prev.</span>
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] px-2.5 py-0.5 rounded-full border border-[var(--border-color)] shrink-0 whitespace-nowrap">
              Avg: {isRevenueMasked ? '***' : `${currencySymbol}${avgOrderValue}`}
            </span>
          </div>
        </div>
        
        {/* 2. Orders */}
        <div 
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Sales Orders')) return; navigate('/orders'); }}
          className="kpi-card bg-[var(--bg-card)] rounded-2xl p-4 sm:p-4.5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] cursor-pointer group flex flex-col justify-between min-h-[168px]"
          title="Click to view Order History"
        >
          <div>
            <div className="flex justify-between items-start mb-2.5">
              <div className="kpi-icon-box group-hover:scale-105 transition-transform">
                <ShoppingBag size={18} strokeWidth={2.5} />
              </div>
              <Sparkline color="var(--text-main)" trend={trends.ordTrend?.isPositive ? 1 : -1} />
            </div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{dateRangeLabel} Orders</p>
              <span className="text-[10px] text-text-muted font-bold group-hover:text-text-main transition-colors">Details →</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {orders || 0}
            </h3>
          </div>
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold shrink-0">
              {formatTrendBadge(trends.ordTrend)}
              <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs prev.</span>
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] border border-[var(--border-color)] px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
              {orders > 0 ? `${orders} Completed` : 'No orders'}
            </span>
          </div>
        </div>

        {/* 3. Gross & Net Profit - Symmetrically proportioned without clipping */}
        <div 
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Profit & Loss Reports')) return; if (!isProfitMasked) navigate('/reports'); }}
          className={`kpi-card bg-[var(--bg-card)] rounded-2xl p-4 sm:p-4.5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] group flex flex-col justify-between min-h-[168px] ${isProfitMasked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
          title={isProfitMasked ? "Restricted: Financial reports are restricted for this role" : "Click to view Profit & Loss Reports"}
        >
          <div>
            <div className="flex justify-between items-start mb-2.5">
              <div className="kpi-icon-box group-hover:scale-105 transition-transform">
                {isProfitMasked ? <Lock size={18} /> : <TrendingUp size={18} strokeWidth={2.5} />}
              </div>
              {!isProfitMasked && <Sparkline color="var(--text-secondary)" trend={trends.profTrend?.isPositive ? 1 : -1} />}
            </div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{dateRangeLabel} Net Profit</p>
              <span className="text-[10px] text-text-muted font-bold group-hover:text-text-main transition-colors">
                {isProfitMasked ? 'Restricted' : 'P&L Report →'}
              </span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {isProfitMasked ? '******' : `${currencySymbol}${(netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h3>
          </div>
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold shrink-0">
              {!isProfitMasked && formatTrendBadge(trends.profTrend)}
              <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs prev.</span>
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] border border-[var(--border-color)] px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
              {isProfitMasked ? 'Locked' : `Margin: ${netMargin}%`}
            </span>
          </div>
        </div>

        {/* 4. Operating Expenses */}
        <div 
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Operating Expenses')) return; if (!isExpensesMasked) navigate('/expenses'); }}
          className={`kpi-card bg-[var(--bg-card)] rounded-2xl p-4 sm:p-4.5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] group flex flex-col justify-between min-h-[168px] ${isExpensesMasked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
          title={isExpensesMasked ? "Restricted: Operating expenses are restricted for this role" : "Click to view Operating Expenses & Ledger"}
        >
          <div>
            <div className="flex justify-between items-start mb-2.5">
              <div className="kpi-icon-box group-hover:scale-105 transition-transform">
                {isExpensesMasked ? <Lock size={18} /> : <CreditCard size={18} strokeWidth={2.5} />}
              </div>
              {!isExpensesMasked && <Sparkline color="var(--text-muted)" trend={!trends.expTrend?.isPositive ? 1 : -1} />}
            </div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{dateRangeLabel} Expenses</p>
              <span className="text-[10px] text-text-muted font-bold group-hover:text-text-main transition-colors">
                {isExpensesMasked ? 'Restricted' : 'Ledger →'}
              </span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {isExpensesMasked ? '******' : `${currencySymbol}${(expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h3>
          </div>
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold shrink-0">
              {!isExpensesMasked && formatTrendBadge(trends.expTrend)}
              <span className="text-text-muted text-[11px] font-medium hidden sm:inline">vs prev.</span>
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-[var(--bg-hover)] border border-[var(--border-color)] px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
              {isExpensesMasked ? 'Locked' : `Ratio: ${expenseRatio}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Operational Strip: Payment Summary + Receivables & Low Stock Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3.5">
        {/* Payment Methods Breakdown - Clickable Tender Pills */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-col justify-between min-h-[112px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Wallet size={13} /> Payment Tender Breakdown
            </span>
            <span className="text-xs font-bold text-text-main bg-[var(--bg-hover)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">
              {currencySymbol}{totalTender.toLocaleString()}
            </span>
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
                  className="p-2 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--text-main)] hover:text-[var(--bg-card)] transition-all text-center group cursor-pointer border border-[var(--border-color)]"
                  title={`Click to view all ${m} transactions`}
                >
                  <span className="text-[10px] text-text-muted group-hover:text-[var(--bg-card)] block font-semibold">{m}</span>
                  <span className="text-xs font-extrabold text-text-main group-hover:text-[var(--bg-card)] block my-0.5">
                    {currencySymbol}{val.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-muted group-hover:text-[var(--bg-card)] font-bold">{getPct(val)}%</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Udhaar (Receivables) - Clickable Drilldown */}
        <div 
          data-test="udhaar-card"
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Khata & Udhaar')) return; setShowUdhaarModal(true); }}
          className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-[var(--text-main)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group min-h-[112px]"
          title="Click to view all customer Khata balances"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-text-main group-hover:scale-105 transition-transform shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Pending Udhaar (Khata)</p>
              <h4 className="text-xl font-extrabold text-text-main mt-0.5">{currencySymbol}{(stats.receivables || 0).toLocaleString()}</h4>
              <p className="text-[10.5px] text-text-secondary mt-0.5">Outstanding from customers</p>
            </div>
          </div>
          <span className="text-xs font-bold text-text-muted group-hover:text-text-main transition-colors bg-[var(--bg-hover)] px-2.5 py-1 rounded-lg border border-[var(--border-color)] shrink-0 ml-2">Manage →</span>
        </div>

        {/* Inventory Restock Alert - Clickable Drilldown */}
        <div 
          data-test="stock-card"
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Stock Management')) return; setShowStockModal(true); }}
          className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-[var(--text-main)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group min-h-[112px]"
          title="Click to audit low-stock items and reorder recommendations"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-text-main group-hover:scale-105 transition-transform shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Stock Health</p>
              <h4 className="text-xl font-extrabold text-text-main mt-0.5">
                {stats.lowStockCount || 0} <span className="text-xs font-medium text-text-muted">products</span>
              </h4>
              <p className="text-[10.5px] text-text-secondary mt-0.5">
                {(stats.lowStockCount || 0) > 0 ? 'Requires reordering soon' : 'All items well stocked'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-text-muted group-hover:text-text-main transition-colors bg-[var(--bg-hover)] px-2.5 py-1 rounded-lg border border-[var(--border-color)] shrink-0 ml-2">Audit →</span>
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
