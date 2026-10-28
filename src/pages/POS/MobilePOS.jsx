import React, { useState } from 'react';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { 
  Search, 
  SlidersHorizontal, 
  Plus, 
  Minus, 
  ArrowRight, 
  X, 
  Banknote, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  User,
  LayoutGrid,
  Utensils,
  Coffee,
  Cookie,
  Tag
} from 'lucide-react';
import './MobilePOS.css';

const getCategoryIcon = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat === 'all') return <LayoutGrid size={13} />;
  if (cat.includes('food') || cat.includes('meal') || cat.includes('burger') || cat.includes('pizza') || cat.includes('snack')) return <Utensils size={13} />;
  if (cat.includes('drink') || cat.includes('coffee') || cat.includes('tea') || cat.includes('beverage')) return <Coffee size={13} />;
  if (cat.includes('bakery') || cat.includes('dessert') || cat.includes('sweet') || cat.includes('donut')) return <Cookie size={13} />;
  if (cat.includes('tech') || cat.includes('electron') || cat.includes('phone') || cat.includes('laptop')) return <Smartphone size={13} />;
  return <Tag size={13} />;
};

export const MobilePOS = ({ 
  products = [], 
  searchTerm = '', 
  setSearchTerm = () => {}, 
  cart = [], 
  addToCart = () => {}, 
  removeFromCart = () => {}, 
  updateQuantity = () => {}, 
  subtotal = 0, 
  total = 0, 
  handleCheckout = () => {}, 
  processing = false, 
  currencySymbol = '₹', 
  clearCart = () => {},
  paymentMethod = 'Cash',
  setPaymentMethod = () => {},
  customers = [],
  selectedCustomer = '',
  setSelectedCustomer = () => {},
  discount = 0,
  setDiscount = () => {},
  success = false
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Dynamic categories
  const defaultCats = ['All', 'Food', 'Drinks', 'Others'];
  const dynamicCats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const combinedCats = Array.from(new Set([...defaultCats, ...dynamicCats])).slice(0, 6);

  const displayProducts = products.filter(p => {
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    const nameMatch = (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const skuMatch = (p.sku || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    return matchesCat && (nameMatch || skuMatch);
  }).slice(0, 60);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const onConfirmSale = async () => {
    await handleCheckout();
    setShowCheckoutModal(false);
  };

  return (
    <div className="mobile-pos-page pb-36">
      <MobileHeader title="New Sale" leftIcon="back" />

      {/* Success Notification Banner */}
      {success && (
        <div className="mx-4 mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Sale completed successfully! Receipt generated in Orders.</span>
        </div>
      )}
      
      {/* Search & Categories Bar */}
      <div className="px-4 py-2 sticky top-0 bg-[var(--bg-card)] z-30 shadow-xs border-b border-[var(--border-color)]">
        <div className="flex gap-2 mb-2.5">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input 
              type="text" 
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-[var(--text-main)] outline-none focus:border-black dark:focus:border-white transition-colors" 
              placeholder="Search products or scan barcode..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <button 
              type="button"
              onClick={() => setSearchTerm('')}
              className="w-9 h-9 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)]"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {combinedCats.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeCategory === cat 
                  ? 'bg-[#09090b] text-white dark:bg-white dark:text-black shadow-xs' 
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]'
              }`}
            >
              <span>{getCategoryIcon(cat)}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid / List */}
      <div className="px-4 py-3 flex flex-col gap-2.5 pb-60">
        {displayProducts.map(product => {
          const cartItem = cart.find(i => i.productId === product.id);
          const qty = cartItem ? cartItem.quantity : 0;
          const price = Number(product.sellingPrice || product.price || 0);

          return (
            <div key={product.id} className="flex items-center gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                {product.imageUrl || product.image ? (
                  <img src={product.imageUrl || product.image} className="w-full h-full object-cover" alt={product.name}/>
                ) : (
                  <div className="text-xs font-bold text-[var(--text-muted)]">
                    {product.name ? product.name.slice(0, 2).toUpperCase() : 'PR'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[var(--text-main)] truncate mb-0.5">{product.name}</h3>
                <p className="text-[11px] text-[var(--text-muted)] truncate mb-0.5">{product.category || 'Food'}</p>
                <p className="text-xs font-bold text-[var(--text-main)]">{currencySymbol}{price.toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {qty === 0 ? (
                  <button 
                    onClick={() => addToCart(product)} 
                    className="w-8 h-8 rounded-full bg-[#09090b] text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs active:scale-95 transition-transform"
                    aria-label="Add item"
                  >
                    <Plus size={16} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-[var(--bg-hover)] rounded-full px-1.5 py-1 border border-[var(--border-color)]">
                    <button 
                      onClick={() => updateQuantity(product.id, qty - 1)} 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-main)] active:scale-90"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-xs font-bold w-4 text-center text-[var(--text-main)]">{qty}</span>
                    <button 
                      onClick={() => updateQuantity(product.id, qty + 1)} 
                      className="w-6 h-6 rounded-full flex items-center justify-center bg-[#09090b] text-white dark:bg-white dark:text-black active:scale-90"
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart Capsule - Apple Pay Style */}
      {totalItems > 0 && !showCheckoutModal && (
        <div className="mobile-floating-capsule animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center gap-3">
            <div className="mobile-capsule-badge">
              {totalItems}
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Subtotal (incl. tax)</p>
              <p className="text-sm font-extrabold text-white" style={{ color: '#ffffff' }}>{currencySymbol}{total.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={clearCart} 
              className="text-[11px] font-semibold px-2 py-1"
              style={{ color: 'rgba(255,255,255,0.7)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Clear
            </button>
            <button 
              type="button"
              onClick={() => setShowCheckoutModal(true)}
              className="mobile-capsule-checkout-btn"
            >
              <span>Checkout</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Checkout Drawer / Modal */}
      {showCheckoutModal && (
        <div className="mobile-checkout-backdrop" onClick={() => setShowCheckoutModal(false)}>
          <div 
            className="mobile-checkout-panel"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
              <h2 className="text-base font-bold text-[var(--text-main)]">Checkout</h2>
              <button 
                type="button" 
                onClick={() => setShowCheckoutModal(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart Items Summary */}
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
              {cart.map(item => (
                <div key={item.productId} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--text-main)]">{item.quantity}x</span>
                    <span className="text-[var(--text-secondary)] truncate max-w-[180px]">{item.name}</span>
                  </div>
                  <span className="font-semibold text-[var(--text-main)]">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Payment Method Selector */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Cash', label: 'Cash', icon: Banknote },
                  { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                  { id: 'Card', label: 'Card', icon: CreditCard }
                ].map(method => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected 
                          ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-xs' 
                          : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-black/40'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer (Optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Customer</label>
              <select
                value={selectedCustomer}
                onChange={e => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)] text-xs font-medium text-[var(--text-main)] outline-none"
              >
                <option value="">Walk-in Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.phone}</option>
                ))}
              </select>
            </div>

            {/* Totals Breakdown */}
            <div className="pt-2 border-t border-[var(--border-color)] flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span>{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Tax (Demo 10%)</span>
                <span>{currencySymbol}{((subtotal * 10) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[var(--text-main)] pt-2 border-t border-[var(--border-color)]">
                <span>Total Amount</span>
                <span>{currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              type="button"
              onClick={onConfirmSale}
              disabled={processing}
              className="w-full py-3.5 rounded-xl bg-[#09090b] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-50"
            >
              {processing ? 'Recording Sale...' : `Confirm & Complete (${currencySymbol}${total.toFixed(2)})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePOS;
