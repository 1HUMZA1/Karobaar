import React from 'react';
import { X, Play, Trash2, Clock, ShoppingCart } from 'lucide-react';

export const HeldOrdersModal = ({ 
  isOpen, 
  onClose, 
  heldOrders = [], 
  onResumeOrder, 
  onDeleteOrder, 
  currencySymbol = '₹' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="biz-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="biz-modal-content" 
        style={{ maxWidth: '520px', width: '92%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--text-main)" />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>
              Parked / Held Orders ({heldOrders.length})
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
          {heldOrders.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ShoppingCart size={36} strokeWidth={1.5} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>No Parked Orders</p>
              <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>When a customer steps away, use "Hold Bill" to park their cart here.</p>
            </div>
          ) : (
            heldOrders.map((order, idx) => {
              const itemCount = (order.cart || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
              const timeString = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div 
                  key={order.id || idx}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-body)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                          {order.note ? order.note : `Order #${idx + 1}`}
                        </span>
                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          {timeString}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {order.customerName ? `Customer: ${order.customerName}` : 'Walk-in Customer'} • {itemCount} items
                      </div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                      {currencySymbol}{(order.total || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* Items preview */}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(order.cart || []).map(i => `${i.name} (x${i.quantity})`).join(', ')}
                  </div>

                  {/* Action buttons strictly monochrome */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button 
                      onClick={() => onDeleteOrder(order.id)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={13} /> Discard
                    </button>
                    <button 
                      onClick={() => onResumeOrder(order)}
                      style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--text-main)', color: 'var(--bg-card)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Play size={13} fill="currentColor" /> Resume Order
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
