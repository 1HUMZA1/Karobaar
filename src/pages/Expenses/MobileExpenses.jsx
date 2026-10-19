import React, { useState } from 'react';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { Search, Plus, ArrowRightLeft, Landmark, Receipt, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const MobileExpenses = ({ 
  accounts, expenses, searchTerm, setSearchTerm, activeTab, setActiveTab,
  currencySymbol, loading, onAddAccount, onTransfer, onAddExpense
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const displayExpenses = expenses.filter(e => 
    (activeCategory === 'All' || e.category === activeCategory) &&
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50);

  const categories = ['All', ...new Set(expenses.map(e => e.category).filter(Boolean))].slice(0, 5);

  return (
    <div className="mobile-page pb-20">
      <MobileHeader 
        title="Finance & Banking" 
        rightIcon="plus" 
        rightOnClick={() => activeTab === 'accounts' ? onAddAccount() : onAddExpense()}
      />
      
      <div className="flex bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <button 
          className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${activeTab === 'accounts' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-[var(--text-secondary)]'}`}
          onClick={() => setActiveTab('accounts')}
        >
          Accounts
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${activeTab === 'expenses' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-[var(--text-secondary)]'}`}
          onClick={() => setActiveTab('expenses')}
        >
          Expenses
        </button>
      </div>

      {activeTab === 'accounts' ? (
        <div className="px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-[var(--text-secondary)]">Your Accounts</h2>
            <Button variant="outline" size="sm" icon={<ArrowRightLeft size={14}/>} onClick={onTransfer}>
              Transfer
            </Button>
          </div>
          
          {loading ? (
            <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading accounts...</p>
          ) : accounts.length > 0 ? (
            accounts.map(acc => (
              <div key={acc.id} className="flex items-center gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-hover)] border border-[var(--border-color)] flex-shrink-0 flex items-center justify-center text-[var(--primary-color)]">
                  <Landmark size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-main)] truncate mb-0.5">{acc.name}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{acc.type}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-extrabold text-[var(--text-main)]">{currencySymbol}{(acc.balance || 0).toLocaleString()}</span>
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 px-2 py-0.5 bg-[var(--bg-hover)] rounded-md">Active</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-[var(--text-muted)] text-sm py-8">No accounts found</p>
          )}
        </div>
      ) : (
        <>
          <div className="px-4 py-2 sticky top-0 bg-[var(--bg-card)] z-30 shadow-sm border-b border-[var(--border-color)]">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary-color)]" 
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-[var(--primary-color)] text-[var(--bg-primary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-color)]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 flex flex-col gap-3">
            {loading ? (
              <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading expenses...</p>
            ) : displayExpenses.length > 0 ? (
              displayExpenses.map(exp => (
                <div key={exp.id} className="flex items-center gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-hover)] flex-shrink-0 flex items-center justify-center text-[var(--danger)]">
                    <Receipt size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[var(--text-main)] truncate mb-0.5">{exp.description}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                      <span>{new Date(exp.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{exp.category}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-bold text-[var(--danger)]">-{currencySymbol}{(exp.amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-[var(--text-muted)] text-sm py-8">No expenses found</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
