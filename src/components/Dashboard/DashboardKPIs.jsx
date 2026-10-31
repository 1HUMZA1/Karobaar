import React, { useState } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  AlertTriangle, 
  Layers, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { PaymentMethodModal, UdhaarBreakdownModal, StockHealthModal } from './DashboardModals';

const MinimalTrendIndicator = ({ isUp, hasData }) => {
  if (!hasData) {
    return (
      <div className="flex items-center gap-1.5 opacity-40">
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
        <span className="w-5 h-0.5 bg-text-muted rounded-full"></span>
      </div>
    );
  }
  return (
    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path 
        d={isUp ? "M2 16 L12 10 L22 13 L38 3" : "M2 4 L12 10 L22 7 L38 17"} 
        stroke="currentColor" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {isUp ? (
        <path d="M38 3 L38 9 M38 3 L32 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      ) : (
        <path d="M38 17 L38 11 M38 17 L32 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
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

  // Metrics resolution
  const isRevenueMasked = stats.revenue === '***';
  const isProfitMasked = stats.netProfit === '***';
  const isExpensesMasked = stats.expenses === '***';

  const revenue = typeof stats.revenue === 'number' && !isNaN(stats.revenue) ? stats.revenue : (stats.todayRevenue || 0);
  const orders = typeof stats.ordersCount === 'number' && !isNaN(stats.ordersCount) ? stats.ordersCount : (stats.todayOrders || 0);
  const netProfit = typeof stats.netProfit === 'number' && !isNaN(stats.netProfit) ? stats.netProfit : (stats.todayProfit || 0);
  const expenses = typeof stats.expenses === 'number' && !isNaN(stats.expenses) ? stats.expenses : (stats.todayExpenses || 0);
  
  const avgOrderValue = orders > 0 && typeof revenue === 'number' && !isNaN(revenue) 
    ? (revenue / orders).toFixed(2) 
    : '0.00';
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
  const renderTrendBadge = (trend) => {
    if (!trend || trend.value === '0' || trend.value === undefined) {
      return (
        <span className="text-text-muted text-xs font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-text-muted/40 inline-block"></span>
          No prior period
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--bg-hover)] text-text-main border border-[var(--border-color)]">
        {trend.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {trend.value}%
      </span>
    );
  };

  return (
    <div className="space-y-6 mb-7">
      
      {/* 4 Core Primary KPI Cards - Spacious Luxury Layout with Generous Breathing Room */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        
        {/* 1. Revenue / Sales */}
        <div 
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Sales Orders')) return; navigate('/orders'); }}
          className="kpi-card bg-[var(--bg-card)] rounded-2xl p-5 sm:p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] cursor-pointer group flex flex-col justify-between min-h-[178px]"
          title="Click to view all Orders & Sales"
        >
          <div>
            <div className="flex justify-between items-center mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-text-main group-hover:scale-105 transition-transform">
                <DollarSign size={20} strokeWidth={2.5} />
              </div>
              <div className="text-text-main">
                <MinimalTrendIndicator isUp={trends.revTrend?.isPositive} hasData={revenue > 0} />
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{dateRangeLabel} Sales</p>
              <span className="text-[11px] text-text-muted font-bold group-hover:text-text-main transition-colors flex items-center gap-1">
                Orders <ArrowRight size={11} />
              </span>
            </div>
            
            <h3 className="text-3xl font-extrabold tracking-tight text-text-main my-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {isRevenueMasked ? '******' : `${currencySymbol}${(revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h3>
          </div>

          <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold shrink-0">
              {renderTrendBadge(trends.revTrend)}
            </div>
            <span className="text-xs font-semibold text-text-secondary bg-[var(--bg-hover)] px-3 py-1 rounded-full border border-[var(--border-color)] shrink-0">
              Avg Ticket: {isRevenueMasked ? '***' : `${currencySymbol}${avgOrderValue}`}
            </span>
          </div>
        </div>
        
        {/* 2. Total Orders */}
        <div 
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Sales Orders')) return; navigate('/orders'); }}
          className="kpi-card bg-[var(--bg-card)] rounded-2xl p-5 sm:p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] cursor-pointer group flex flex-col justify-between min-h-[178px]"
          title="Click to view Order History"
        >
          <div>
            <div className="flex justify-between items-center mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-text-main group-hover:scale-105 transition-transform">
                <ShoppingBag size={20} strokeWidth={2.5} />
              </div>
              <div className="text-text-main">
                <MinimalTrendIndicator isUp={trends.ordTrend?.isPositive} hasData={orders > 0} />
              </div>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{dateRangeLabel} Orders</p>
              <span className="text-[11px] text-text-muted font-bold group-hover:text-text-main transition-colors flex items-center gap-1">
                Details <ArrowRight size={11} />
              </span>
            </div>

            <h3 className="text-3xl font-extrabold tracking-tight text-text-main my-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {orders || 0}
            </h3>
          </div>

          <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold shrink-0">
              {renderTrendBadge(trends.ordTrend)}
            </div>
            <span className="text-xs font-semibold text-text-secondary bg-[var(--bg-hover)] border border-[var(--border-color)] px-3 py-1 rounded-full shrink-0">
              {orders > 0 ? `${orders} completed` : 'No orders yet'}
            </span>
          </div>
        </div>

        {/* 3. Net Profit */}
        <div 
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Profit & Loss Reports')) return; if (!isProfitMasked) navigate('/reports'); }}
          className={`kpi-card bg-[var(--bg-card)] rounded-2xl p-5 sm:p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] group flex flex-col justify-between min-h-[178px] ${isProfitMasked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
          title={isProfitMasked ? "Restricted: Financial reports are restricted for this role" : "Click to view Profit & Loss Reports"}
        >
          <div>
            <div className="flex justify-between items-center mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-text-main group-hover:scale-105 transition-transform">
                {isProfitMasked ? <Lock size={20} /> : <TrendingUp size={20} strokeWidth={2.5} />}
              </div>
              <div className="text-text-main">
                <MinimalTrendIndicator isUp={trends.profTrend?.isPositive} hasData={netProfit > 0} />
              </div>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{dateRangeLabel} Net Profit</p>
              <span className="text-[11px] text-text-muted font-bold group-hover:text-text-main transition-colors flex items-center gap-1">
                {isProfitMasked ? 'Locked' : <>P&L <ArrowRight size={11} /></>}
              </span>
            </div>

            <h3 className="text-3xl font-extrabold tracking-tight text-text-main my-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {isProfitMasked ? '******' : `${currencySymbol}${(netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h3>
          </div>

          <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold shrink-0">
              {!isProfitMasked && renderTrendBadge(trends.profTrend)}
            </div>
            <span className="text-xs font-semibold text-text-secondary bg-[var(--bg-hover)] border border-[var(--border-color)] px-3 py-1 rounded-full shrink-0">
              {isProfitMasked ? 'Locked' : `Net Margin: ${netMargin}%`}
            </span>
          </div>
        </div>

        {/* 4. Operating Expenses */}
        <div 
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Operating Expenses')) return; if (!isExpensesMasked) navigate('/expenses'); }}
          className={`kpi-card bg-[var(--bg-card)] rounded-2xl p-5 sm:p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[var(--border-color)] group flex flex-col justify-between min-h-[178px] ${isExpensesMasked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
          title={isExpensesMasked ? "Restricted: Operating expenses are restricted for this role" : "Click to view Operating Expenses & Ledger"}
        >
          <div>
            <div className="flex justify-between items-center mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-text-main group-hover:scale-105 transition-transform">
                {isExpensesMasked ? <Lock size={20} /> : <CreditCard size={20} strokeWidth={2.5} />}
              </div>
              <div className="text-text-main">
                <MinimalTrendIndicator isUp={!trends.expTrend?.isPositive} hasData={expenses > 0} />
              </div>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{dateRangeLabel} Expenses</p>
              <span className="text-[11px] text-text-muted font-bold group-hover:text-text-main transition-colors flex items-center gap-1">
                {isExpensesMasked ? 'Locked' : <>Ledger <ArrowRight size={11} /></>}
              </span>
            </div>

            <h3 className="text-3xl font-extrabold tracking-tight text-text-main my-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {isExpensesMasked ? '******' : `${currencySymbol}${(expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h3>
          </div>

          <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-1 font-bold shrink-0">
              {!isExpensesMasked && renderTrendBadge(trends.expTrend)}
            </div>
            <span className="text-xs font-semibold text-text-secondary bg-[var(--bg-hover)] border border-[var(--border-color)] px-3 py-1 rounded-full shrink-0">
              {isExpensesMasked ? 'Locked' : `Expense Ratio: ${expenseRatio}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Operational Hub: Symmetrical 3-Card Deck with Luxurious Spacing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        
        {/* A. Payment Tender Breakdown */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-text-main">
                <Wallet size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Payment Tender Breakdown
              </span>
            </div>
            <span className="text-xs font-extrabold text-text-main bg-[var(--bg-hover)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">
              {currencySymbol}{totalTender.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden flex my-2.5">
            {totalTender > 0 ? (
              <>
                <div style={{ width: `${getPct(payments.cash)}%` }} className="bg-text-main transition-all duration-300"></div>
                <div style={{ width: `${getPct(payments.upi)}%` }} className="bg-zinc-400 transition-all duration-300"></div>
                <div style={{ width: `${getPct(payments.card)}%` }} className="bg-zinc-600 transition-all duration-300"></div>
                <div style={{ width: `${getPct(payments.udhaar)}%` }} className="bg-zinc-800 transition-all duration-300"></div>
              </>
            ) : (
              <div className="w-full h-full bg-text-muted/20"></div>
            )}
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
                  className="py-2.5 px-1.5 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--text-main)] hover:text-[var(--bg-card)] transition-all text-center group cursor-pointer border border-[var(--border-color)]"
                  title={`Audit all ${m} transactions`}
                >
                  <span className="text-[10.5px] text-text-muted group-hover:text-[var(--bg-card)] block font-semibold">{m}</span>
                  <span className="text-xs sm:text-sm font-extrabold text-text-main group-hover:text-[var(--bg-card)] block my-0.5">
                    {currencySymbol}{Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] text-text-muted group-hover:text-[var(--bg-card)] font-bold">{getPct(val)}%</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* B. Customer Udhaar (Khata & Receivables) */}
        <div 
          data-test="udhaar-card"
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Khata & Udhaar')) return; setShowUdhaarModal(true); }}
          className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-[var(--text-main)] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group min-h-[160px]"
          title="Click to view all customer Khata balances"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-text-main">
                <Layers size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Pending Udhaar (Khata)
              </span>
            </div>
            <span className="text-xs font-bold text-text-muted group-hover:text-text-main transition-colors bg-[var(--bg-hover)] px-3 py-1 rounded-xl border border-[var(--border-color)]">
              Manage →
            </span>
          </div>

          <div className="my-2">
            <h4 className="text-3xl font-extrabold text-text-main">
              {currencySymbol}{(stats.receivables || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </div>

          <div className="flex items-center justify-between text-xs pt-2.5 border-t border-[var(--border-light)]">
            <span className="text-xs text-text-secondary font-medium">
              {(stats.receivables || 0) > 0 ? 'Outstanding from customers' : 'All customer dues are settled'}
            </span>
            <span className="text-[11px] font-bold text-text-muted bg-[var(--bg-hover)] px-2.5 py-0.5 rounded-full border border-[var(--border-color)]">
              Ledger
            </span>
          </div>
        </div>

        {/* C. Stock Health & Restock Recommendations */}
        <div 
          data-test="stock-card"
          onClick={() => { if (requireAuthAndSetup && requireAuthAndSetup('Stock Management')) return; setShowStockModal(true); }}
          className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-[var(--text-main)] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group min-h-[160px]"
          title="Click to audit low-stock items and reorder recommendations"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-text-main">
                <AlertTriangle size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Stock Health & Inventory
              </span>
            </div>
            <span className="text-xs font-bold text-text-muted group-hover:text-text-main transition-colors bg-[var(--bg-hover)] px-3 py-1 rounded-xl border border-[var(--border-color)]">
              Audit →
            </span>
          </div>

          <div className="my-2">
            <h4 className="text-3xl font-extrabold text-text-main">
              {stats.lowStockCount || 0} <span className="text-base font-semibold text-text-muted">items low</span>
            </h4>
          </div>

          <div className="flex items-center justify-between text-xs pt-2.5 border-t border-[var(--border-light)]">
            <span className="text-xs text-text-secondary font-medium">
              {(stats.lowStockCount || 0) > 0 ? 'Requires restocking soon' : 'All items well stocked'}
            </span>
            <span className="text-[11px] font-bold text-text-muted bg-[var(--bg-hover)] px-2.5 py-0.5 rounded-full border border-[var(--border-color)]">
              Inventory
            </span>
          </div>
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
