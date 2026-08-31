import React, { useState } from 'react';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { Search, SlidersHorizontal, Plus, Minus, ArrowRight } from 'lucide-react';
import './MobilePOS.css';

export const MobilePOS = ({ 
  products, searchTerm, setSearchTerm, cart, addToCart, removeFromCart, updateQuantity, 
  subtotal, total, handleCheckout, processing, currencySymbol, clearCart
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))].slice(0, 5);

  const displayProducts = products.filter(p => 
    (activeCategory === 'All' || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())))
  ).slice(0, 50);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mobile-pos-page">
      <MobileHeader title="New Sale" leftIcon="back" rightIcon="more" />
      
      <div className="px-4 py-2 sticky top-0 bg-[var(--bg-card)] z-30 shadow-sm">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input 
              type="text" 
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary-color)]" 
              placeholder="Search products or scan barcode..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)]">
            <SlidersHorizontal size={18} />
          </button>
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

      <div className="px-4 py-3 flex flex-col gap-3 pb-72">
        {displayProducts.map(product => {
          const cartItem = cart.find(i => i.productId === product.id);
          const qty = cartItem ? cartItem.quantity : 0;
          return (
            <div key={product.id} className="flex items-center gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 p-1">
                {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-contain mix-blend-multiply" alt={product.name}/> : <div className="text-[10px] text-[var(--text-muted)]">No Img</div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[var(--text-main)] truncate">{product.name}</h3>
                <p className="text-[10px] text-[var(--text-muted)] mb-0.5">{product.sku || 'No SKU'}</p>
                <p className="text-[13px] font-bold text-[var(--primary-color)]">{currencySymbol}{(product.sellingPrice || product.price || 0).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {qty === 0 ? (
                  <button onClick={() => addToCart(product)} className="w-7 h-7 rounded-full bg-[var(--bg-hover)] border border-[var(--primary-color)] flex items-center justify-center text-[var(--primary-color)]">
                    <Plus size={16} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-[var(--bg-hover)] rounded-full px-1 py-1 border border-[var(--border-color)]">
                    <button onClick={() => updateQuantity(product.id, qty - 1)} className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-main)]">
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{qty}</span>
                    <button onClick={() => updateQuantity(product.id, qty + 1)} className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--primary-color)]">
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed Cart Panel */}
      <div className="fixed bottom-16 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-color)] p-4 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-[var(--text-main)]">Cart <span className="text-xs font-normal text-[var(--text-muted)] ml-1">({totalItems} items)</span></h3>
          <button onClick={clearCart} className="text-xs font-bold text-[var(--danger)]">Clear Cart</button>
        </div>
        
        <div className="flex justify-between items-end mb-4">
          <span className="text-sm font-bold text-[var(--text-main)]">Total</span>
          <span className="text-2xl font-extrabold text-[var(--text-main)]">{currencySymbol}{total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
        </div>

        <button 
          onClick={handleCheckout}
          disabled={cart.length === 0 || processing}
          className="w-full bg-[var(--primary-color)] text-[var(--bg-primary)] h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-[0.98]"
        >
          {processing ? 'Processing...' : 'Proceed to Checkout'}
          {!processing && <ArrowRight size={20} />}
        </button>
      </div>
    </div>
  );
};
