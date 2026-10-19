import React, { useState } from 'react';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { Search, Wallet, UserCheck, MessageSquare, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const MobilePayments = ({ 
  customers, searchTerm, setSearchTerm, activeTab, setActiveTab,
  currencySymbol, loading, totalOutstanding, onSendReminder, onRecordPayment
}) => {
  const filteredData = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  ).slice(0, 50);

  return (
    <div className="mobile-page pb-20">
      <MobileHeader title="Credit / Udhaar" />
      
      <div className="flex bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <button 
          className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${activeTab === 'customers' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-[var(--text-secondary)]'}`}
          onClick={() => setActiveTab('customers')}
        >
          Customer Khata
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${activeTab === 'suppliers' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-[var(--text-secondary)]'}`}
          onClick={() => setActiveTab('suppliers')}
        >
          Supplier Khata
        </button>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3 bg-[var(--bg-card)]">
        <div className="p-3 bg-[var(--warning)]/10 rounded-xl border border-[var(--warning)]/20 flex flex-col items-center text-center">
          <Wallet size={20} className="text-[var(--warning)] mb-1" />
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">To Collect</span>
          <span className="text-lg font-black text-[var(--text-main)]">{currencySymbol}{totalOutstanding.toLocaleString()}</span>
        </div>
        <div className="p-3 bg-[var(--danger)]/10 rounded-xl border border-[var(--danger)]/20 flex flex-col items-center text-center">
          <UserCheck size={20} className="text-[var(--danger)] mb-1" />
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Dues Count</span>
          <span className="text-lg font-black text-[var(--text-main)]">{customers.length}</span>
        </div>
      </div>

      <div className="px-4 py-2 sticky top-0 bg-[var(--bg-card)] z-30 shadow-sm border-b border-[var(--border-color)]">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
          <input 
            type="text" 
            className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary-color)]" 
            placeholder="Search name or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">
        {loading ? (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading khata...</p>
        ) : filteredData.length > 0 ? (
          filteredData.map(customer => (
            <div key={customer.id} className="flex flex-col gap-2 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary-color)] text-[var(--bg-primary)] flex items-center justify-center font-bold">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-main)] truncate">{customer.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{customer.phone || 'No phone'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-0.5">Due Amount</p>
                  <p className="text-lg font-black text-[var(--danger)]">{currencySymbol}{customer.outstandingBalance.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[var(--border-color)]">
                <button 
                  onClick={() => onSendReminder(customer)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#25D366]/10 text-[#075E54] font-semibold text-xs active:scale-95 transition-transform"
                >
                  <MessageSquare size={14} /> WhatsApp
                </button>
                <button 
                  onClick={() => onRecordPayment(customer)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--primary-color)] text-[var(--bg-primary)] font-semibold text-xs active:scale-95 transition-transform"
                >
                  Record Payment
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 flex flex-col items-center">
            <CheckCircle2 size={40} className="text-[var(--success-color)] opacity-50 mb-2" />
            <p className="text-sm text-[var(--text-muted)]">No outstanding balances!</p>
          </div>
        )}
      </div>
    </div>
  );
};
