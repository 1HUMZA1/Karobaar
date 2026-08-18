import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, CreditCard, Banknote, User, Printer, Trash2, Package, ArrowRight } from 'lucide-react';
import { db } from '../../services/databaseService';
import { salesService } from '../../services/salesService';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import './POS.css';

const POS = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discount, setDiscount] = useState(0);
  const [taxRate] = useState(10); // 10% demo tax
  
  const [amountPaid, setAmountPaid] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      loadData(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId]);

  const loadData = async (businessId) => {
    const p = await db.getCollection('products', businessId);
    const c = await db.getCollection('customers', businessId);
    setProducts(p.filter(prod => prod.status !== 'Inactive'));
    setCustomers(c);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const addToCart = (product) => {
    if (product.stockQuantity <= 0) {
      alert('Out of stock!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        price: parseFloat(product.sellingPrice || product.price || 0), 
        quantity: 1, 
        stock: product.stockQuantity 
      }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQ = item.quantity + delta;
        if (newQ < 1 || newQ > item.stock) return item;
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    if (window.confirm('Clear all items from the cart?')) {
      setCart([]);
      setDiscount(0);
      setAmountPaid('');
      setDueDate('');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - discount;

  const handleCheckout = async () => {
    if (cart.length === 0 || !currentUser?.activeBusinessId) return;
    
    if (paymentMethod === 'Udhaar' && !selectedCustomer) {
      alert('Please select a customer first to give Udhaar/Credit.');
      return;
    }
    
    setProcessing(true);
    try {
      const finalAmountPaid = paymentMethod === 'Udhaar' ? (parseFloat(amountPaid) || 0) : total;
      const balanceDue = paymentMethod === 'Udhaar' ? Math.max(0, total - finalAmountPaid) : 0;
      
      await salesService.createSale({
        items: cart,
        customerId: selectedCustomer || null,
        paymentMethod,
        subtotal,
        tax: taxAmount,
        discount,
        total,
        amountPaid: finalAmountPaid,
        balanceDue,
        dueDate: paymentMethod === 'Udhaar' && dueDate ? dueDate : null,
        businessId: currentUser.activeBusinessId
      });
      setSuccess(true);
      setCart([]);
      setSelectedCustomer('');
      setDiscount(0);
      setAmountPaid('');
      setDueDate('');
      setPaymentMethod('Cash');
      loadData(currentUser.activeBusinessId); // refresh stock
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    setIsInvoiceModalOpen(true);
  };

  const executePrint = () => {
    setIsInvoiceModalOpen(false);
    const printContent = `
      <html>
        <head>
          <title>Receipt - ${currentBusiness?.name || 'Karobaar'}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; width: 320px; margin: 0 auto; background: #fff; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
            .header h2 { margin: 0 0 5px 0; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 0; font-size: 12px; color: #333; }
            .meta { margin-bottom: 15px; font-size: 12px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th { text-align: left; padding: 5px 0; border-bottom: 1px solid #000; font-size: 12px; text-transform: uppercase; }
            td { padding: 8px 0; font-size: 12px; border-bottom: 1px dashed #eee; vertical-align: top; }
            .text-right { text-align: right; }
            .totals { border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; font-weight: bold; }
            .total-row.grand-total { font-size: 18px; margin-top: 10px; padding-top: 10px; border-top: 2px dashed #000; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; border-top: 2px dashed #000; padding-top: 15px; font-weight: bold; }
            .barcode { text-align: center; margin-top: 15px; font-family: monospace; font-size: 12px; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${currentBusiness?.name || 'KAROBAAR'}</h2>
            <p>Official Receipt</p>
            ${currentBusiness?.phone || currentUser?.phone ? `<p style="margin-top: 4px; font-weight: bold;">Ph: ${currentBusiness?.phone || currentUser?.phone}</p>` : ''}
          </div>
          
          <div class="meta">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
              <span>${new Date().toLocaleTimeString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span><strong>Pay:</strong> ${paymentMethod}</span>
              <span><strong>Cashier:</strong> Admin</span>
            </div>
            ${selectedCustomer ? `<div style="margin-top: 4px;"><strong>Customer:</strong> ${selectedCustomer}</div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td class="text-right">${currencySymbol}${item.price.toFixed(2)}</td>
                  <td class="text-right">${currencySymbol}${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${currencySymbol}${subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax (${taxRate}%)</span>
              <span>${currencySymbol}${taxAmount.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `
            <div class="total-row">
              <span>Discount</span>
              <span>-${currencySymbol}${discount.toFixed(2)}</span>
            </div>` : ''}
            <div class="total-row grand-total">
              <span>TOTAL</span>
              <span>${currencySymbol}${Math.max(0, total).toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for buying</p>
            <p>Visit again..!!</p>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    iframe.contentDocument.open();
    iframe.contentDocument.write(printContent);
    iframe.contentDocument.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };

  return (
    <div className="pos-container">
      {/* Left side: Products Grid */}
      <div className="pos-products-section">
        <div className="pos-search-bar py-4 px-2 mt-2">
          <Input 
            placeholder="Search by name, SKU or barcode..." 
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={products.length === 0 || filteredProducts.length === 0 ? "flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 h-full" : "flex-1 overflow-y-auto px-2 pb-6"}>
          {products.length === 0 ? (
            <div className="w-full max-w-md flex flex-col items-center justify-center text-center opacity-40 hover:opacity-80 transition-opacity duration-300 mx-auto -mt-24">
              <div className="w-16 h-16 bg-[var(--bg-hover)] rounded-full flex items-center justify-center mb-6 shadow-sm">
                <ShoppingCart size={28} className="text-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-text-secondary mb-3">Ready for your first sale?</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Add products from the <strong>Stock / Inventory</strong> tab to get started. <br/>
                They will appear here so you can easily add them to your current order.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-text-muted">
              <p>No products found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="w-full bg-[var(--bg-card)] rounded-xl overflow-hidden shadow-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-sm text-gray-500">
                    <th className="py-4 px-6 font-semibold w-2/5">Product</th>
                    <th className="py-4 px-6 font-semibold">Category</th>
                    <th className="py-4 px-6 font-semibold">Price</th>
                    <th className="py-4 px-6 font-semibold">Stock</th>
                    <th className="py-4 px-6 font-semibold text-center w-48">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map(product => {
                    const cartItem = cart.find(item => item.productId === product.id);
                    const quantityInCart = cartItem ? cartItem.quantity : 0;
                    const availableStock = Math.max(0, product.stockQuantity - quantityInCart);

                    return (
                      <tr key={product.id} className={`hover:bg-[var(--bg-hover)] transition-colors ${availableStock <= 0 ? 'opacity-60 grayscale' : ''}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div 
                              className="bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 p-1 rounded-sm shadow-sm flex-shrink-0"
                              style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}
                            >
                              {product.imageUrl && product.imageUrl.trim() !== '' ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                              ) : (
                                <ShoppingCart size={20} className="text-gray-300" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-text-main leading-snug line-clamp-2">{product.name}</span>
                              <span className="text-xs text-text-tertiary mt-0.5">{product.sku || 'No SKU'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-text-secondary">{product.category || 'Uncategorized'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-baseline">
                            <span className="text-xs text-text-secondary font-bold mr-1">{currencySymbol}</span>
                            <span className="font-bold text-text-main text-base tracking-tight">{product.sellingPrice || product.price || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold" style={{ color: availableStock > 0 ? '#000000' : '#888888' }}>
                              {availableStock > 0 ? 'In Stock' : 'Out of stock'}
                            </span>
                            <span className="text-[10px] text-text-tertiary font-bold mt-0.5">
                              ({availableStock})
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {/* Action Button/Toggle */}
                          {quantityInCart > 0 ? (
                            <div className="pos-qty-toggle">
                              <button 
                                className="pos-qty-btn"
                                onClick={() => { if (quantityInCart === 1) removeFromCart(product.id); else updateQuantity(product.id, -1); }}
                              >
                                <Minus size={14} strokeWidth={3} />
                              </button>
                              
                              <div className="pos-qty-val">
                                {quantityInCart}
                              </div>
                              
                              <button 
                                className="pos-qty-btn"
                                style={{ opacity: availableStock > 0 ? 1 : 0.5, cursor: availableStock > 0 ? 'pointer' : 'not-allowed' }}
                                onClick={() => { if(availableStock > 0) addToCart(product); }}
                              >
                                <Plus size={14} strokeWidth={3} />
                              </button>
                            </div>
                          ) : availableStock > 0 ? (
                            <button 
                              className="pos-add-btn"
                              onClick={() => addToCart(product)}
                            >
                              <ShoppingCart size={16} strokeWidth={2.5} /> 
                              <span>Add to Cart</span>
                            </button>
                          ) : (
                            <div className="pos-unavailable-btn">
                              <ShoppingCart size={16} strokeWidth={2.5} /> 
                              <span>Unavailable</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Right side: Cart & Checkout */}
      <div className="pos-cart-section" style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          {/* Cart Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Cart <ShoppingCart size={20} color="var(--text-muted)" />
            </h3>
            {cart.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', backgroundColor: 'var(--text-main)', color: 'var(--bg-card)', fontSize: '10px', fontWeight: '900', borderRadius: '50%', marginLeft: '4px' }}>
                {cart.length}
              </span>
            )}
            <button 
              style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none' }}
              onClick={clearCart}
            >
              Clear all
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="custom-scrollbar">
            {cart.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', opacity: 0.5 }}>
                <ShoppingCart size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>Your cart is empty</p>
                <p style={{ fontSize: '12px', marginTop: '4px', textAlign: 'center', maxWidth: '200px' }}>Add products from the left to start a sale.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {cart.map(item => (
                  <div key={item.productId} style={{ display: 'flex', gap: '16px' }}>
                    {/* Item Image */}
                    <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Package size={24} color="var(--border-color)" />
                      )}
                    </div>
                    
                    {/* Item Details */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0, paddingRight: '8px' }}>{item.name}</h4>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                          {currencySymbol}{item.price * item.quantity}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '12px' }}>
                        {currencySymbol}{item.price}
                      </span>
                      
                      {/* Quantity & Delete Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
                        <div style={{ height: '32px', display: 'flex', alignItems: 'center', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                          <button 
                            style={{ width: '32px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-color)' }}
                            onClick={() => updateQuantity(item.productId, -1)}
                          >
                            <Minus size={14} strokeWidth={3} color="var(--text-main)" />
                          </button>
                          <div style={{ width: '32px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            {item.quantity}
                          </div>
                          <button 
                            style={{ width: '32px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border-color)' }}
                            onClick={() => updateQuantity(item.productId, 1)}
                          >
                            <Plus size={14} strokeWidth={3} color="var(--text-main)" />
                          </button>
                        </div>
                        
                        <button 
                          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-secondary)' }}
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'var(--bg-body)', borderTop: '1px solid var(--border-color)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Subtotal</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Tax ({taxRate}%)</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{currencySymbol}{taxAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Discount</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>{currencySymbol}</span>
                <input 
                  type="number" 
                  value={discount} 
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  style={{ width: '80px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-main)', outline: 'none' }}
                  min="0"
                  max={subtotal}
                />
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)' }}>Total</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)' }}>{currencySymbol}{Math.max(0, total).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '40px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: paymentMethod === 'Cash' ? 'none' : '1px solid var(--border-color)', backgroundColor: paymentMethod === 'Cash' ? 'var(--text-main)' : 'var(--bg-card)', color: paymentMethod === 'Cash' ? 'var(--bg-body)' : 'var(--text-secondary)' }}
                onClick={() => setPaymentMethod('Cash')}
              >
                <Banknote size={16} /> Cash
              </button>
              <button 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '40px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: paymentMethod === 'Card' ? 'none' : '1px solid var(--border-color)', backgroundColor: paymentMethod === 'Card' ? 'var(--text-main)' : 'var(--bg-card)', color: paymentMethod === 'Card' ? 'var(--bg-body)' : 'var(--text-secondary)' }}
                onClick={() => setPaymentMethod('Card')}
              >
                <CreditCard size={16} /> Card
              </button>
              <button 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '40px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: paymentMethod === 'Udhaar' ? 'none' : '1px solid var(--border-color)', backgroundColor: paymentMethod === 'Udhaar' ? 'var(--danger)' : 'var(--bg-card)', color: paymentMethod === 'Udhaar' ? 'var(--danger-bg)' : 'var(--text-secondary)' }}
                onClick={() => setPaymentMethod('Udhaar')}
              >
                <User size={16} /> Udhaar
              </button>
            </div>

            {paymentMethod === 'Udhaar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', backgroundColor: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Advance Paid</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: '8px', fontSize: '12px' }}>{currencySymbol}</span>
                    <input 
                      type="number" 
                      value={amountPaid} 
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="0.00"
                      style={{ width: '80px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-main)', outline: 'none', fontSize: '12px' }}
                      min="0"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Due Date</span>
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', color: 'var(--text-main)', outline: 'none', fontSize: '12px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--danger)' }}>Balance Pending</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--danger)' }}>
                    {currencySymbol}{Math.max(0, total - (parseFloat(amountPaid) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                style={{ width: '100%', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', backgroundColor: cart.length === 0 ? 'var(--bg-elevated)' : 'var(--text-main)', color: cart.length === 0 ? 'var(--text-muted)' : 'var(--bg-body)', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', border: 'none' }}
                onClick={handleCheckout}
                disabled={cart.length === 0 || processing}
              >
                {processing ? 'Processing...' : success ? 'Sale Saved!' : (
                  <>Checkout <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>
                )}
              </button>
              
              <button 
                style={{ width: '100%', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: cart.length === 0 ? 'var(--text-muted)' : 'var(--text-main)', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
                onClick={handlePrint}
                disabled={cart.length === 0 || processing}
              >
                <Printer size={18} style={{ marginRight: '8px' }} /> Print Bill
              </button>
            </div>

            {success && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--text-main)', color: 'var(--bg-body)', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Sale has been recorded successfully!
              </div>
            )}
          </div>
      </div>

      {/* Invoice Modal Popup */}
      {isInvoiceModalOpen && (
        <div className="biz-modal-overlay" onClick={() => setIsInvoiceModalOpen(false)}>
          <div className="biz-modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="biz-modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h2 className="text-xl font-bold">Invoice Preview</h2>
            </div>
            <div className="biz-modal-body flex flex-col gap-4">
              <div style={{ fontFamily: "'Courier New', Courier, monospace", padding: "20px", color: "#000", background: "#fff", border: "1px solid var(--border-color)", borderRadius: "8px", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ textAlign: "center", marginBottom: "15px", borderBottom: "2px dashed #000", paddingBottom: "15px" }}>
                  <h2 style={{ margin: "0 0 5px 0", fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>{currentBusiness?.name || 'KAROBAAR'}</h2>
                  <p style={{ margin: 0, fontSize: "12px", color: "#333" }}>Official Receipt</p>
                  {currentBusiness?.phone || currentUser?.phone ? <p style={{ margin: "4px 0 0 0", fontWeight: "bold", fontSize: "12px" }}>Ph: {currentBusiness?.phone || currentUser?.phone}</p> : null}
                </div>
                
                <div style={{ marginBottom: "15px", fontSize: "12px", borderBottom: "2px dashed #000", paddingBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span><strong>Date:</strong> {new Date().toLocaleDateString()}</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span><strong>Pay:</strong> {paymentMethod}</span>
                    <span><strong>Cashier:</strong> Admin</span>
                  </div>
                  {selectedCustomer ? <div style={{ marginTop: "4px" }}><strong>Customer:</strong> {selectedCustomer}</div> : null}
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "5px 0", borderBottom: "1px solid #000", fontSize: "12px", textTransform: "uppercase" }}>Item</th>
                      <th style={{ textAlign: "left", padding: "5px 0", borderBottom: "1px solid #000", fontSize: "12px", textTransform: "uppercase" }}>Qty</th>
                      <th style={{ textAlign: "right", padding: "5px 0", borderBottom: "1px solid #000", fontSize: "12px", textTransform: "uppercase" }}>Price</th>
                      <th style={{ textAlign: "right", padding: "5px 0", borderBottom: "1px solid #000", fontSize: "12px", textTransform: "uppercase" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.productId}>
                        <td style={{ padding: "8px 0", fontSize: "12px", borderBottom: "1px dashed #eee", verticalAlign: "top" }}>{item.name}</td>
                        <td style={{ padding: "8px 0", fontSize: "12px", borderBottom: "1px dashed #eee", verticalAlign: "top" }}>{item.quantity}</td>
                        <td style={{ padding: "8px 0", fontSize: "12px", borderBottom: "1px dashed #eee", verticalAlign: "top", textAlign: "right" }}>{currencySymbol}{item.price.toFixed(2)}</td>
                        <td style={{ padding: "8px 0", fontSize: "12px", borderBottom: "1px dashed #eee", verticalAlign: "top", textAlign: "right" }}>{currencySymbol}{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderTop: "2px solid #000", paddingTop: "10px", margin: "10px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                    <span>Subtotal</span>
                    <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                    <span>Tax ({taxRate}%)</span>
                    <span>{currencySymbol}{taxAmount.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                      <span>Discount</span>
                      <span>-{currencySymbol}{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", marginTop: "10px", paddingTop: "10px", borderTop: "2px dashed #000", fontWeight: "bold" }}>
                    <span>TOTAL</span>
                    <span>{currencySymbol}{Math.max(0, total).toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", borderTop: "2px dashed #000", paddingTop: "15px", fontWeight: "bold" }}>
                  <p style={{ margin: "0 0 5px 0" }}>Thank you for buying</p>
                  <p style={{ margin: 0 }}>Visit again..!!</p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 flex items-center justify-center gap-2" onClick={executePrint}>
                  <Printer size={18} /> Print Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
