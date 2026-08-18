import React from 'react';
import { Package, AlertCircle, ShoppingCart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const DashboardOperations = ({ recentOrders = [], lowStockProducts = [], currencySymbol }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      
      {/* Recent Orders (Left 2/3) */}
      <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-xl overflow-hidden shadow-md flex flex-col">
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary"/> Recent Orders
          </h2>
          <button 
            onClick={() => navigate('/orders')}
            className="text-xs font-semibold text-primary hover:text-primary-light flex items-center gap-1 transition-colors bg-[var(--primary-light)] px-3 py-1.5 rounded-full"
          >
            View All <ArrowRight size={14}/>
          </button>
        </div>
        
        <div className="flex-1 overflow-x-auto px-4 pb-4">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Order ID</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Amount</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {recentOrders.length > 0 ? (
                recentOrders.slice(0, 5).map(order => (
                  <tr key={order.id} className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer rounded-lg overflow-hidden group" onClick={() => navigate(`/orders`)}>
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
                  <td colSpan="5">
                    <div className="py-12 flex flex-col items-center justify-center text-text-muted">
                      <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
                        <ShoppingCart size={24} className="opacity-40" />
                      </div>
                      <p className="text-sm font-medium">No recent orders yet.</p>
                      <p className="text-xs mt-1">Your new orders will appear here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Health (Right 1/3) */}
      <div className="bg-[var(--bg-card)] rounded-xl overflow-hidden shadow-md flex flex-col">
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <AlertCircle size={18} className="text-warning"/> Reorder Suggestions
          </h2>
          <button 
            onClick={() => navigate('/inventory')}
            className="text-xs font-semibold text-text-secondary hover:text-text-main transition-colors bg-[var(--bg-elevated)] px-3 py-1.5 rounded-full"
          >
            Manage
          </button>
        </div>
        
        <div className="flex-1 flex flex-col gap-1 p-4 pt-0 overflow-y-auto max-h-[300px]">
          {lowStockProducts.length > 0 ? (
            lowStockProducts.map(product => {
              const suggestedQuantity = Math.max(10, (product.minimumStock || 5) * 2 - (product.stockQuantity || 0));
              return (
                <div key={product.id} className="p-3 hover:bg-[var(--bg-hover)] rounded-lg transition-colors flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-warning-bg text-warning flex items-center justify-center flex-shrink-0">
                      <Package size={14}/>
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-text-main truncate" title={product.name}>{product.name}</p>
                      <p className="text-xs font-bold text-text-main mt-0.5">Suggest Reorder: {suggestedQuantity}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-bold text-danger">{product.stockQuantity}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">In Stock</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-text-muted h-full">
              <div className="w-16 h-16 rounded-full bg-[var(--success-light)] text-[var(--success-color)] flex items-center justify-center mb-4">
                <Package size={24} />
              </div>
              <p className="text-sm font-semibold text-text-main">Inventory is healthy</p>
              <p className="text-xs mt-1 text-center max-w-[200px]">No low stock alerts right now. You're fully stocked!</p>
            </div>
          )}
        </div>
        
        {lowStockProducts.length > 0 && (
          <div className="p-4 bg-[var(--bg-elevated)] text-center mt-auto">
            <button onClick={() => navigate('/purchases')} className="text-sm font-bold text-[var(--danger-color)] hover:opacity-80 transition-opacity w-full py-2 bg-[var(--danger-light)] rounded-lg">
              Create Purchase Order
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
