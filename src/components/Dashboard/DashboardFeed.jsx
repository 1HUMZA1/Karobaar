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
      <div className="bg-[var(--bg-card)] rounded-xl shadow-md flex flex-col h-[400px]">
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <Bell size={18} className="text-warning"/> Action Items
          </h2>
          {alerts.length > 0 && (
            <span className="bg-warning text-[10px] font-bold text-black px-2 py-0.5 rounded-full shadow-sm">
              {alerts.length} NEW
            </span>
          )}
        </div>
        
        <div className="flex-1 flex flex-col gap-1 px-4 pb-4 overflow-y-auto">
          {alerts.length > 0 ? (
            alerts.map((alert, i) => (
              <div 
                key={i} 
                onClick={() => navigate(alert.link)}
                className="p-4 rounded-lg flex items-start gap-4 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
              >
                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full shadow-sm ${alert.id === 'stock' ? 'bg-danger' : 'bg-warning'}`}></div>
                <div>
                  <p className="text-sm font-bold text-text-main leading-tight mb-1">{alert.title}</p>
                  <p className="text-xs text-text-secondary">{alert.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 h-full flex flex-col items-center justify-center text-text-muted">
              <div className="w-16 h-16 rounded-full bg-[var(--success-light)] text-[var(--success-color)] flex items-center justify-center mb-4">
                <CheckCircle size={24} />
              </div>
              <p className="text-sm font-semibold text-text-main">You're all caught up!</p>
              <p className="text-xs mt-1">No urgent action items.</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed (Right 2/3) */}
      <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-xl shadow-md flex flex-col h-[400px]">
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <Activity size={18} className="text-primary"/> Activity Feed
          </h2>
          <button 
            onClick={() => navigate('/reports')}
            className="text-xs font-semibold text-text-secondary hover:text-text-main flex items-center gap-1 transition-colors bg-[var(--bg-elevated)] px-3 py-1.5 rounded-full"
          >
            View Report <ArrowRight size={14}/>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
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
            <div className="h-full py-12 flex flex-col items-center justify-center text-text-muted">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
                <Activity size={24} className="opacity-40" />
              </div>
              <p className="text-sm font-semibold text-text-main">No recent activity</p>
              <p className="text-xs mt-1">Your business activities will show up here.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
