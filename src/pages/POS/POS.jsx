import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, CreditCard, Banknote, User } from 'lucide-react';
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
  
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      loadData(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId]);

  const loadData = async (businessId) => {
    const p = await db.getCollection('products', businessId);
    const c = await db.getCollection('customers', businessId);
    setProducts(p.filter(prod => prod.status === 'Active'));
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
      return [...prev, { productId: product.id, name: product.name, price: product.sellingPrice, quantity: 1, stock: product.stockQuantity }];
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

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - discount;

  const handleCheckout = async () => {
    if (cart.length === 0 || !currentUser?.activeBusinessId) return;
    setProcessing(true);
    try {
      await salesService.createSale({
        items: cart,
        customerId: selectedCustomer || null,
        paymentMethod,
        subtotal,
        tax: taxAmount,
        discount,
        total,
        businessId: currentUser.activeBusinessId
      });
      setSuccess(true);
      setCart([]);
      setSelectedCustomer('');
      setDiscount(0);
      loadData(currentUser.activeBusinessId); // refresh stock
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="pos-container animate-fade-in">
      {/* Left side: Products Grid */}
      <div className="pos-products-section">
        <div className="pos-search-bar">
          <Input 
            placeholder="Search by name, SKU or barcode..." 
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="pos-products-grid">
          {filteredProducts.map(product => (
            <Card 
              key={product.id} 
              className={`pos-product-card ${product.stockQuantity <= 0 ? 'out-of-stock' : ''}`}
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-4 flex flex-col h-full justify-between gap-2 cursor-pointer">
                <div>
                  <h4 className="font-semibold text-sm line-clamp-2">{product.name}</h4>
                  <p className="text-xs text-secondary">{product.sku}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-primary">{currencySymbol}{product.sellingPrice}</span>
                  <span className={`text-xs font-medium ${product.stockQuantity > 0 ? 'text-success' : 'text-danger'}`}>
                    {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right side: Cart & Checkout */}
      <div className="pos-cart-section">
        <Card className="h-full flex flex-col">
          <div className="pos-cart-header">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ShoppingCart size={20} /> Current Order
            </h3>
          </div>
          
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={48} className="text-tertiary mb-4" />
                <p className="text-secondary">Cart is empty</p>
                <p className="text-xs text-tertiary">Select products to add</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="cart-item">
                  <div className="cart-item-info">
                    <h5 className="font-medium text-sm">{item.name}</h5>
                    <span className="text-xs text-secondary">{currencySymbol}{item.price}</span>
                  </div>
                  <div className="cart-item-actions">
                    <div className="qty-controls">
                      <button onClick={() => updateQuantity(item.productId, -1)}><Minus size={14}/></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)}><Plus size={14}/></button>
                    </div>
                    <span className="font-medium ml-2 w-16 text-right">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                    <button className="remove-btn ml-2" onClick={() => removeFromCart(item.productId)}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pos-cart-summary">
            <div className="pos-customer-select">
              <User size={16} className="text-secondary" />
              <select 
                value={selectedCustomer} 
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="biz-select flex-1"
              >
                <option value="">Walk-in Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="summary-row">
              <span className="text-secondary">Subtotal</span>
              <span>{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="text-secondary">Tax ({taxRate}%)</span>
              <span>{currencySymbol}{taxAmount.toFixed(2)}</span>
            </div>
            <div className="summary-row discount-row">
              <span className="text-secondary">Discount ({currencySymbol})</span>
              <input 
                type="number" 
                value={discount} 
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="discount-input"
                min="0"
                max={subtotal}
              />
            </div>
            
            <div className="summary-total">
              <span>Total</span>
              <span className="text-2xl">{currencySymbol}{Math.max(0, total).toFixed(2)}</span>
            </div>

            <div className="payment-methods">
              <button 
                className={`payment-btn ${paymentMethod === 'Cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Cash')}
              >
                <Banknote size={18} /> Cash
              </button>
              <button 
                className={`payment-btn ${paymentMethod === 'Card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Card')}
              >
                <CreditCard size={18} /> Card
              </button>
            </div>

            <Button 
              size="lg" 
              fullWidth 
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
              className="mt-4"
            >
              {processing ? 'Processing...' : success ? 'Sale Completed!' : 'Complete Sale'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default POS;
