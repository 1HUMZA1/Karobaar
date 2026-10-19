import React, { useState } from 'react';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { Search, ChevronRight, FileText, Download, Eye } from 'lucide-react';

export const MobileInvoices = ({ invoices, customers, searchTerm, setSearchTerm, currencySymbol, loading }) => {
  const [activeStatus, setActiveStatus] = useState('All');
  
  const statuses = ['All', 'Paid', 'Pending', 'Overdue'];

  const filteredInvoices = invoices.filter(inv => 
    (activeStatus === 'All' || inv.status === activeStatus) &&
    (inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customers[inv.customerId] || '').toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 50);

  return (
    <div className="mobile-page pb-20">
      <MobileHeader 
        title="Invoices" 
        rightIcon="plus" 
        rightOnClick={() => alert('Invoice Generation module is currently in development.')}
      />
      
      <div className="px-4 py-2 sticky top-0 bg-[var(--bg-card)] z-30 shadow-sm border-b border-[var(--border-color)]">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input 
              type="text" 
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary-color)]" 
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {statuses.map(status => (
            <button 
              key={status} 
              onClick={() => setActiveStatus(status)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeStatus === status ? 'bg-[var(--primary-color)] text-[var(--bg-primary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-color)]'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">
        {loading ? (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading invoices...</p>
        ) : filteredInvoices.length > 0 ? (
          filteredInvoices.map(invoice => (
            <div key={invoice.id} className="flex items-center gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl active:scale-[0.98] transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex-shrink-0 flex items-center justify-center text-[var(--primary-color)]">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="text-sm font-bold text-[var(--text-main)] truncate">{customers[invoice.customerId] || 'Walk-in Customer'}</h3>
                  <span className="text-xs font-bold text-[var(--primary-color)]">{currencySymbol}{(invoice.amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)]">
                  <span>{invoice.invoiceNumber}</span>
                  <span>{new Date(invoice.date).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '6px', 
                    fontSize: '10px', 
                    fontWeight: '600',
                    backgroundColor: invoice.status === 'Paid' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                    color: invoice.status === 'Paid' ? '#16a34a' : '#ca8a04'
                  }}>
                    {invoice.status || 'Pending'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 flex-shrink-0 border-l border-[var(--border-color)] pl-3">
                <button className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)] active:bg-[var(--primary-color)] active:text-[var(--bg-primary)] transition-colors">
                  <Eye size={14} />
                </button>
                <button className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)] active:bg-[var(--primary-color)] active:text-[var(--bg-primary)] transition-colors">
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">No invoices found</p>
        )}
      </div>
    </div>
  );
};
