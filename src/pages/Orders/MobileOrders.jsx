import React, { useState } from 'react';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { Search, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import './MobileOrders.css';

export const MobileOrders = ({ orders, searchTerm, setSearchTerm, currencySymbol, loading, onOrderClick }) => {
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Pending', 'Processing', 'Completed', 'Cancelled'];

  const filteredOrders = orders.filter(o => 
    (activeTab === 'All' || (o.status || 'Completed') === activeTab) &&
    (o.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'text-[var(--success-color)] bg-[#ecfdf5]';
      case 'Pending': return 'text-[#d97706] bg-[#fffbeb]';
      case 'Processing': return 'text-[#2563eb] bg-[#eff6ff]';
      case 'Cancelled': case 'Refunded': return 'text-[var(--danger)] bg-[#fef2f2]';
      default: return 'text-[var(--success-color)] bg-[#ecfdf5]';
    }
  };

  return (
    <div className="mobile-orders-page pb-20">
      <MobileHeader title="Orders" rightIcon="search" />
      
      <div className="sticky top-0 bg-[var(--bg-card)] z-30 shadow-sm border-b border-[var(--border-color)]">
        <div className="px-4 py-2 flex gap-2 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-[var(--primary-color)] text-[var(--bg-primary)]' : 'bg-transparent text-[var(--text-secondary)]'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {loading ? (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading orders...</p>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)] active:scale-[0.98] transition-transform" onClick={() => onOrderClick && onOrderClick(order)}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-bold text-[var(--text-main)]">#{order.invoiceNumber || order.id.slice(0,8)}</h3>
                <p className="text-[10px] text-[var(--text-muted)]">{format(new Date(order.date), 'dd MMM, hh:mm a')}</p>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">{order.customerName || 'Walk-in Customer'}</p>
                <p className="text-sm font-bold text-[var(--text-main)]">{currencySymbol}{(order.total || 0).toLocaleString()}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${getStatusColor(order.status || 'Completed')}`}
                >
                  {order.status || 'Completed'}
                </span>
                <p className="text-[10px] font-semibold text-[var(--text-muted)]">{order.paymentMethod || 'Cash'}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">No orders found</p>
        )}
      </div>
    </div>
  );
};
