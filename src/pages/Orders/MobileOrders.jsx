import React, { useState } from 'react';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { Search, SlidersHorizontal, ChevronRight, CheckCircle2, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { format, isValid } from 'date-fns';
import './MobileOrders.css';

export const MobileOrders = ({ 
  orders = [], 
  searchTerm = '', 
  setSearchTerm = () => {}, 
  currencySymbol = '₹', 
  loading = false, 
  onOrderClick = () => {} 
}) => {
  // Screen 5 tabs: All, Pending, Completed
  const [activeTab, setActiveTab] = useState('All');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const tabs = ['All', 'Pending', 'Completed'];

  const filteredOrders = orders.filter(o => {
    const status = o.status || 'Completed';
    const matchesTab = activeTab === 'All' ? true : status.toLowerCase() === activeTab.toLowerCase();
    const inv = (o.invoiceNumber || o.id || '').toLowerCase();
    const cust = (o.customerName || o.customerId || 'Walk-in Customer').toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = inv.includes(term) || cust.includes(term);
    return matchesTab && matchesSearch;
  });

  const formatDate = (dateVal) => {
    if (!dateVal) return 'Recently';
    const d = new Date(dateVal);
    if (!isValid(d)) return 'Recently';
    return format(d, 'MMM dd, HH:mm');
  };

  const getStatusBadge = (status = 'Completed') => {
    const norm = status.toLowerCase();
    if (norm === 'completed') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          Completed
        </span>
      );
    }
    if (norm === 'pending') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          Pending
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        {status}
      </span>
    );
  };

  return (
    <div className="mobile-orders-page pb-24">
      {/* Screen 5 Top Header with Back arrow & Filter toggle */}
      <MobileHeader 
        title="Orders" 
        leftIcon="back"
        rightIcon="filter" 
        rightOnClick={() => setShowFilterBar(prev => !prev)}
      />
      
      {/* Category Pills Bar matching Screen 5 */}
      <div className="sticky top-0 bg-[var(--bg-card)] z-30 shadow-xs border-b border-[var(--border-color)]">
        {/* Optional Search bar dropdown */}
        {showFilterBar && (
          <div className="px-4 pt-3 pb-2 flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input 
                type="text" 
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-[var(--text-main)] outline-none focus:border-black dark:focus:border-white transition-colors" 
                placeholder="Search by order # or customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')}
                className="px-3 rounded-xl bg-gray-100 dark:bg-zinc-800 text-xs font-semibold text-[var(--text-secondary)]"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* 3 Pill Tabs: All, Pending, Completed matching Screen 5 */}
        <div className="px-4 py-2.5 flex gap-2">
          {tabs.map(tab => {
            const isActive = activeTab === tab;
            return (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-full text-xs font-semibold text-center transition-colors ${
                  isActive 
                    ? 'bg-[#09090b] text-white dark:bg-white dark:text-black shadow-xs' 
                    : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List matching Screen 5 */}
      <div className="px-4 py-3 flex flex-col gap-3">
        {loading ? (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading orders...</p>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(order => {
            const orderNum = order.invoiceNumber || (order.id ? `#${order.id.slice(-6).toUpperCase()}` : '#ORD001');
            const total = Number(order.total || 0);
            const customer = order.customerName || (order.customerId ? `Customer #${order.customerId}` : 'Walk-in Customer');
            const payment = order.paymentMethod || 'Cash';
            const status = order.status || 'Completed';

            return (
              <div 
                key={order.id} 
                className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)] active:scale-[0.99] transition-transform shadow-xs cursor-pointer hover:border-black/30 dark:hover:border-white/30" 
                onClick={() => onOrderClick && onOrderClick(order)}
              >
                {/* Row 1: Order ID on left, Date on right */}
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold text-[var(--text-main)] tracking-tight">
                    {orderNum.startsWith('#') ? orderNum : `#${orderNum}`}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    {formatDate(order.date || order.createdAt)}
                  </span>
                </div>
                
                {/* Row 2: Customer Name on left, Amount on right */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-medium text-[var(--text-secondary)] truncate max-w-[65%]">
                    {customer}
                  </span>
                  <span className="text-base font-bold text-[var(--text-main)]">
                    {currencySymbol}{total.toFixed(2)}
                  </span>
                </div>
                
                {/* Row 3: Status Badge on left, Payment method on right */}
                <div className="flex justify-between items-center pt-2 border-t border-[var(--border-color)]/60">
                  <div>
                    {getStatusBadge(status)}
                  </div>
                  <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                    <span>{payment}</span>
                    <ChevronRight size={14} className="text-[var(--text-muted)]" />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 flex flex-col items-center gap-2">
            <p className="text-sm font-semibold text-[var(--text-main)]">No orders found</p>
            <p className="text-xs text-[var(--text-muted)]">
              {activeTab === 'All' ? 'Start a new sale from the Sales tab' : `No ${activeTab.toLowerCase()} orders right now.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileOrders;
