import React, { useState } from 'react';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { Search, ChevronRight, Phone, Mail } from 'lucide-react';
import './Customers.css';

export const MobileCustomers = ({ customers, searchTerm, setSearchTerm, onAddCustomer, currencySymbol, loading, onCustomerClick }) => {
  const [activeType, setActiveType] = useState('All');
  
  const customerTypes = ['All', ...new Set(customers.map(c => c.customerType).filter(Boolean))].slice(0, 5);

  const displayCustomers = customers.filter(c => 
    (activeType === 'All' || c.customerType === activeType) &&
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm)))
  ).slice(0, 50);

  return (
    <div className="mobile-page pb-20">
      <MobileHeader 
        title="Customers" 
        rightIcon="plus" 
        rightOnClick={onAddCustomer}
      />
      
      <div className="px-4 py-2 sticky top-0 bg-[var(--bg-card)] z-30 shadow-sm border-b border-[var(--border-color)]">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input 
              type="text" 
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary-color)]" 
              placeholder="Search customers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {customerTypes.map(type => (
            <button 
              key={type} 
              onClick={() => setActiveType(type)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeType === type ? 'bg-[var(--primary-color)] text-[var(--bg-primary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-color)]'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">
        {loading ? (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading customers...</p>
        ) : displayCustomers.length > 0 ? (
          displayCustomers.map(customer => (
            <div key={customer.id} className="flex items-center gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl active:scale-[0.98] transition-transform" onClick={() => onCustomerClick(customer)}>
              <div className="w-12 h-12 rounded-full bg-[var(--primary-color)] flex-shrink-0 flex items-center justify-center text-[var(--bg-primary)] font-bold text-lg">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[var(--text-main)] truncate mb-0.5">{customer.name}</h3>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] truncate mb-1">
                  {customer.phone && <span className="flex items-center gap-0.5"><Phone size={10} /> {customer.phone}</span>}
                </div>
                <p className="text-xs font-bold text-[var(--text-main)]">Spent: {currencySymbol}{(customer.totalSpending || 0).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {customer.outstandingBalance > 0 ? (
                  <span className="text-[10px] font-bold text-[var(--danger)]">Owes: {currencySymbol}{customer.outstandingBalance.toLocaleString()}</span>
                ) : (
                  <span className="text-[10px] font-bold text-[var(--success-color)]">Settled</span>
                )}
                <span className="text-[9px] text-[var(--text-muted)] mt-0.5 px-2 py-0.5 bg-[var(--bg-hover)] rounded-md">{customer.customerType || 'Retail'}</span>
                <ChevronRight size={16} className="text-[var(--text-muted)] mt-1" />
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">No customers found</p>
        )}
      </div>
    </div>
  );
};
