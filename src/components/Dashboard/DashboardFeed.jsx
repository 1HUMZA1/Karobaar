import React from 'react';
import { Bell, Activity, ArrowRight, CheckCircle, Clock, TrendingUp, TrendingDown, Package, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const DashboardFeed = ({ alerts = [], transactions = [], currencySymbol }) => {
  const navigate = useNavigate();

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'Sale': return <TrendingUp size={14} className="text-success" />;
      case 'Expense': return <TrendingDown size={14} className="text-danger" />;
      case 'Product Added': return <Package size={14} className="text-info" />;
      default: return <FileText size={14} className="text-text-muted" />;
    }
  };

  const getTransactionBg = (type) => {
    switch(type) {
      case 'Sale': return 'bg-success-bg';
      case 'Expense': return 'bg-danger-bg';
      case 'Product Added': return 'bg-info-bg';
      default: return 'bg-[var(--bg-elevated)]';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Action Items (Left 1/3) */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm flex flex-col h-[400px]">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
            <Bell size={16} className="text-warning"/> Action Items
          </h2>
          {alerts.length > 0 && (
            <span className="bg-warning text-[10px] font-bold text-black px-2 py-0.5 rounded-full">
              {alerts.length} NEW
            </span>
          )}
        </div>
        
        <div className="flex-1 divide-y divide-[var(--border-color)] overflow-y-auto">
          {alerts.length > 0 ? (
            alerts.map((alert, i) => (
              <div 
                key={i} 
                onClick={() => navigate(alert.link)}
                className="p-5 flex items-start gap-4 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
              >
                <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${alert.id === 'stock' ? 'bg-danger' : 'bg-warning'}`}></div>
                <div>
                  <p className="text-sm font-semibold text-text-main leading-tight mb-1">{alert.title}</p>
                  <p className="text-xs text-text-secondary">{alert.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 h-full flex flex-col items-center justify-center text-text-muted">
              <CheckCircle size={32} className="mb-3 text-success opacity-50"/>
              <p className="text-sm font-medium text-text-main">You're all caught up!</p>
              <p className="text-xs mt-1">No urgent action items.</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed (Right 2/3) */}
      <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm flex flex-col h-[400px]">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
            <Activity size={16} className="text-primary"/> Activity Feed
          </h2>
          <button 
            onClick={() => navigate('/reports')}
            className="text-xs font-semibold text-text-secondary hover:text-text-main flex items-center gap-1 transition-colors"
          >
            View Report <ArrowRight size={14}/>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {transactions.length > 0 ? (
            <div className="relative before:absolute before:inset-y-0 before:left-[35px] before:w-px before:bg-[var(--border-color)]">
              {transactions.map((trx, idx) => (
                <div key={idx} className="relative flex items-start gap-4 p-3 hover:bg-[var(--bg-hover)] rounded-lg transition-colors group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-[3px] border-[var(--bg-card)] group-hover:border-[var(--bg-hover)] transition-colors ${getTransactionBg(trx.type)}`}>
                    {getTransactionIcon(trx.type)}
                  </div>
                  <div className="flex-1 min-w-0 pt-1 flex justify-between items-start gap-4">
                    <div>
                      <p className="text-sm font-semibold text-text-main truncate">
                        {trx.type === 'Sale' ? `Sale Completed: ${trx.invoiceNumber || '#' + trx.id?.substring(0,6)}` 
                        : trx.type === 'Expense' ? `Expense Recorded: ${trx.category || 'General'}` 
                        : `Product Added: ${trx.name}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-text-muted flex items-center gap-1">
                          <Clock size={10}/> {format(new Date(trx.time), 'MMM dd, hh:mm a')}
                        </span>
                        {trx.customerName && <span className="text-[11px] text-text-secondary border-l border-[var(--border-color)] pl-2">{trx.customerName}</span>}
                      </div>
                    </div>
                    {trx.amount > 0 && (
                      <div className={`text-sm font-bold flex-shrink-0 ${trx.type === 'Sale' ? 'text-success' : 'text-text-main'}`}>
                        {trx.type === 'Sale' ? '+' : '-'}{currencySymbol}{trx.amount.toLocaleString(undefined, {minimumFractionDigits:2})}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              No recent activity found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
