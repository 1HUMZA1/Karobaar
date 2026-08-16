import React from 'react';
import { Package, AlertCircle, ShoppingCart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const DashboardOperations = ({ recentOrders = [], lowStockProducts = [], currencySymbol }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      
      {/* Recent Orders (Left 2/3) */}
      <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm flex flex-col">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
            <ShoppingCart size={16} className="text-primary"/> Recent Orders
          </h2>
          <button 
            onClick={() => navigate('/orders')}
            className="text-xs font-semibold text-primary hover:text-primary-light flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight size={14}/>
          </button>
        </div>
        
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Order ID</th>
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Amount</th>
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {recentOrders.length > 0 ? (
                recentOrders.slice(0, 5).map(order => (
                  <tr key={order.id} className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer" onClick={() => navigate(`/orders`)}>
                    <td className="p-4 text-sm font-medium text-text-main">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-4 text-sm text-text-secondary truncate max-w-[150px]">{order.customerName || 'Walk-in Customer'}</td>
                    <td className="p-4 text-sm text-text-muted">{format(new Date(order.date), 'MMM dd, HH:mm')}</td>
                    <td className="p-4 text-sm font-semibold text-text-main text-right">{currencySymbol}{(order.total || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                        ${order.status === 'Completed' || order.status === 'Paid' ? 'bg-success-bg text-success' 
                        : order.status === 'Pending' ? 'bg-warning-bg text-warning' 
                        : 'bg-[var(--bg-elevated)] text-text-secondary'}`}
                      >
                        {order.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-text-muted text-sm">No recent orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Health (Right 1/3) */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm flex flex-col">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
            <AlertCircle size={16} className="text-danger"/> Inventory Alerts
          </h2>
          <button 
            onClick={() => navigate('/inventory')}
            className="text-xs font-semibold text-text-secondary hover:text-text-main transition-colors"
          >
            Manage
          </button>
        </div>
        
        <div className="flex-1 divide-y divide-[var(--border-color)] overflow-y-auto max-h-[300px]">
          {lowStockProducts.length > 0 ? (
            lowStockProducts.map(product => (
              <div key={product.id} className="p-4 hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-danger-bg text-danger flex items-center justify-center flex-shrink-0">
                    <Package size={14}/>
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-text-main truncate" title={product.name}>{product.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">Threshold: {product.minimumStock || 5}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-bold text-danger">{product.stockQuantity}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">In Stock</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-text-muted flex flex-col items-center">
              <Package size={24} className="mb-3 opacity-20"/>
              <p className="text-sm font-medium">Inventory is healthy.</p>
              <p className="text-xs mt-1">No low stock alerts right now.</p>
            </div>
          )}
        </div>
        
        {lowStockProducts.length > 0 && (
          <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-elevated)] text-center">
            <button onClick={() => navigate('/purchases')} className="text-xs font-semibold text-danger hover:text-red-400 transition-colors w-full py-1">
              Create Purchase Order
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
