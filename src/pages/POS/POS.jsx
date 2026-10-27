import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  CreditCard, 
  Banknote, 
  User, 
  Printer, 
  Trash2, 
  Package, 
  ArrowRight,
  LayoutGrid,
  List,
  Clock,
  QrCode,
  Split,
  PackagePlus,
  UserPlus,
  Check,
  Tag,
  Utensils,
  ShoppingBag,
  Truck,
  Keyboard,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { db } from '../../services/databaseService';
import { salesService } from '../../services/salesService';
import { initializeDemoData } from '../../services/demoData';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobilePOS } from './MobilePOS';
import { UPIModal } from './UPIModal';
import { HeldOrdersModal } from './HeldOrdersModal';
import { CustomItemModal } from './CustomItemModal';
import { QuickCustomerModal } from './QuickCustomerModal';
import './POS.css';

const POS = () => {
  const isMobile = useIsMobile();
  const { currentUser, currentBusiness } = useAppContext();
  const searchInputRef = useRef(null);

  // Core Data
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('karobaar_pos_view_mode') || 'table');

  // Cart & Order State
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [orderType, setOrderType] = useState('Takeaway'); // Dine-in, Takeaway, Delivery
  const [orderNotes, setOrderNotes] = useState('');
  const [tokenNumber, setTokenNumber] = useState(() => `T-${Math.floor(100 + Math.random() * 900)}`);

  // Discount
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' | 'percent'
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate] = useState(10); // 10% demo tax

  // Payment Details
  const [amountPaid, setAmountPaid] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [cashTendered, setCashTendered] = useState('');
  const [splitDetails, setSplitDetails] = useState({ cash: '', upi: '', card: '' });

  // Held Orders
  const [heldOrders, setHeldOrders] = useState([]);

  // Modals & UI Controls
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isUPIModalOpen, setIsUPIModalOpen] = useState(false);
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  // Load Data & Held Orders
  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      loadData(currentUser.activeBusinessId);
      loadHeldOrders(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId]);

  const loadData = async (businessId) => {
    let p = await db.getCollection('products', businessId);
    if ((!p || p.length === 0) && businessId === 'demo-business-1') {
      await initializeDemoData(businessId);
      p = await db.getCollection('products', businessId);
    }
    const c = await db.getCollection('customers', businessId);
    const e = await db.getCollection('employees', businessId);
    setProducts((p || []).filter(prod => prod.status !== 'Inactive'));
    setCustomers(c || []);
    setEmployees((e || []).filter(emp => emp.status === 'Active'));
  };

  const loadHeldOrders = (businessId) => {
    try {
      const stored = localStorage.getItem(`karobaar_held_orders_${businessId}`);
      if (stored) {
        setHeldOrders(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading held orders:', e);
    }
  };

  const saveHeldOrders = (orders, businessId) => {
    setHeldOrders(orders);
    if (businessId) {
      localStorage.setItem(`karobaar_held_orders_${businessId}`, JSON.stringify(orders));
    }
  };

  // View Mode Persistence
  const toggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('karobaar_pos_view_mode', mode);
  };

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Keyboard Shortcuts (F2: Search, F4: Hold, F8: Discount, F9: Checkout, Esc: Clear)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input unless it's a specific function key
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        showToast('Search focused (F2)');
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleHoldOrder();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0 && !processing) {
          handleCheckout();
        }
      } else if (e.key === 'Escape') {
        if (isInvoiceModalOpen) setIsInvoiceModalOpen(false);
        else if (isUPIModalOpen) setIsUPIModalOpen(false);
        else if (isHeldOrdersModalOpen) setIsHeldOrdersModalOpen(false);
        else if (isCustomItemModalOpen) setIsCustomItemModalOpen(false);
        else if (isQuickCustomerModalOpen) setIsQuickCustomerModalOpen(false);
        else if (isShortcutsModalOpen) setIsShortcutsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Extract Categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // Filter Products
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const s = searchTerm.toLowerCase().trim();
    const matchesSearch = !s || 
      p.name.toLowerCase().includes(s) || 
      (p.sku && p.sku.toLowerCase().includes(s)) ||
      (p.barcode && p.barcode.includes(s));
    return matchesCategory && matchesSearch;
  });

  // Barcode Instant Add on Enter
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      const exactMatch = products.find(p => 
        (p.barcode && p.barcode.toLowerCase() === query) ||
        (p.sku && p.sku.toLowerCase() === query) ||
        p.name.toLowerCase() === query
      );

      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm('');
        showToast(`Added: ${exactMatch.name}`);
      }
    }
  };

  // Add to Cart
  const addToCart = (product) => {
    if (!product.isCustom && product.stockQuantity <= 0) {
      alert('Out of stock!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (!product.isCustom && existing.quantity >= product.stockQuantity) {
          showToast(`Stock limit reached for ${product.name}`);
          return prev;
        }
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        price: parseFloat(product.sellingPrice || product.price || 0), 
        quantity: 1, 
        stock: product.stockQuantity || 9999,
        imageUrl: product.imageUrl || null,
        isCustom: !!product.isCustom,
        category: product.category || 'General'
      }];
    });
  };

  // Add Custom / Open Item
  const handleAddCustomItem = (customItem) => {
    setCart(prev => [...prev, {
      productId: customItem.id,
      name: customItem.name,
      price: customItem.price,
      quantity: customItem.quantity,
      stock: 9999,
      isCustom: true,
      category: customItem.category
    }]);
    showToast(`Added custom item: ${customItem.name}`);
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQ = item.quantity + delta;
        if (newQ < 1) return item;
        if (!item.isCustom && newQ > item.stock) {
          showToast(`Only ${item.stock} in stock`);
          return item;
        }
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from the current cart?')) {
      setCart([]);
      setDiscountValue(0);
      setAmountPaid('');
      setDueDate('');
      setCashTendered('');
      setOrderNotes('');
      setSplitDetails({ cash: '', upi: '', card: '' });
      showToast('Cart cleared');
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  
  // Calculate discount based on type
  const calculatedDiscount = discountType === 'percent'
    ? (subtotal * Math.min(100, Math.max(0, parseFloat(discountValue) || 0))) / 100
    : Math.min(subtotal, Math.max(0, parseFloat(discountValue) || 0));

  const total = Math.max(0, subtotal + taxAmount - calculatedDiscount);

  // Cash change calculation
  const parsedCashTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, parsedCashTendered - total);

  // Split payment sum calculation
  const splitCash = parseFloat(splitDetails.cash) || 0;
  const splitUpi = parseFloat(splitDetails.upi) || 0;
  const splitCard = parseFloat(splitDetails.card) || 0;
  const splitTotalAllocated = splitCash + splitUpi + splitCard;
  const splitRemaining = Math.max(0, total - splitTotalAllocated);

  // Hold / Park Order
  const handleHoldOrder = () => {
    if (cart.length === 0) {
      showToast('Cannot hold an empty cart');
      return;
    }

    const customerObj = customers.find(c => c.id === selectedCustomer);
    const orderTag = prompt('Enter a note or table for this held order:', orderNotes || (customerObj ? customerObj.name : `Order #${heldOrders.length + 1}`));
    if (orderTag === null) return; // cancelled

    const newHeldOrder = {
      id: `HOLD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      note: orderTag.trim() || `Order #${heldOrders.length + 1}`,
      customerName: customerObj ? customerObj.name : null,
      selectedCustomer,
      selectedEmployee,
      cart: [...cart],
      discountType,
      discountValue,
      orderType,
      orderNotes,
      total
    };

    const updated = [newHeldOrder, ...heldOrders];
    saveHeldOrders(updated, currentUser?.activeBusinessId);

    // Reset current active cart
    setCart([]);
    setDiscountValue(0);
    setAmountPaid('');
    setDueDate('');
    setCashTendered('');
    setOrderNotes('');
    setSplitDetails({ cash: '', upi: '', card: '' });
    showToast(`Order parked (${updated.length} held)`);
  };

  // Resume Held Order
  const handleResumeOrder = (order) => {
    if (cart.length > 0) {
      if (!window.confirm('Active cart has items. Replace with this held order?')) return;
    }

    setCart(order.cart || []);
    setSelectedCustomer(order.selectedCustomer || '');
    setSelectedEmployee(order.selectedEmployee || '');
    setDiscountType(order.discountType || 'fixed');
    setDiscountValue(order.discountValue || 0);
    setOrderType(order.orderType || 'Takeaway');
    setOrderNotes(order.orderNotes || '');

    // Remove from held orders
    const updated = heldOrders.filter(h => h.id !== order.id);
    saveHeldOrders(updated, currentUser?.activeBusinessId);
    setIsHeldOrdersModalOpen(false);
    showToast('Held order restored to cart');
  };

  // Discard Held Order
  const handleDeleteHeldOrder = (orderId) => {
    if (window.confirm('Discard this held order?')) {
      const updated = heldOrders.filter(h => h.id !== orderId);
      saveHeldOrders(updated, currentUser?.activeBusinessId);
      showToast('Held order removed');
    }
  };

  // Customer created quick-handler
  const handleCustomerCreated = (newCust) => {
    setCustomers(prev => [newCust, ...prev]);
    setSelectedCustomer(newCust.id);
    showToast(`Customer added: ${newCust.name}`);
  };

  // Live AI Assistant POS Automation Engine (Voice commands & Omni-Search)
  const executeAiPosAction = (actionDetail) => {
    if (!actionDetail) return;
    const { action, product, productName, quantity, discount, clear, hold, paymentMethod: payMethod, checkout, customerName, orderType: oType } = actionDetail;

    if (clear) {
      setCart([]);
      setDiscountValue(0);
      showToast('POS cart cleared by Jarvis AI');
      return;
    }

    if (discount !== undefined && discount !== null) {
      setDiscountValue(Number(discount) || 0);
      showToast(`Discount ₹${discount} applied by Jarvis AI`);
      return;
    }

    if (hold) {
      handleHoldOrder();
      return;
    }

    if (payMethod) {
      setPaymentMethod(payMethod);
      showToast(`Payment method set to ${payMethod}`);
    }

    if (oType) {
      setOrderType(oType);
      showToast(`Order type set to ${oType}`);
    }

    if (customerName) {
      const matchedCust = customers.find(c => (c.name || '').toLowerCase().includes(customerName.toLowerCase()));
      if (matchedCust) {
        setSelectedCustomer(matchedCust.id);
        showToast(`Customer linked: ${matchedCust.name}`);
      }
    }

    if (action === 'add_item' || (!action && (product || productName))) {
      let target = product;
      if (!target && productName) {
        const q = productName.toLowerCase().trim();
        target = products.find(p => 
          (p.name && p.name.toLowerCase() === q) || 
          (p.name && p.name.toLowerCase().includes(q))
        );
      }

      if (target) {
        const qty = Number(quantity) || 1;
        for (let i = 0; i < qty; i++) {
          addToCart(target);
        }
        showToast(`AI added ${qty}x ${target.name} to cart`);
      } else {
        showToast(`Product not found in catalog`);
      }
    }

    if (checkout) {
      setTimeout(() => {
        if (cart.length > 0 && !processing) {
          handleCheckout();
        } else {
          showToast('Checkout ready. Add items to cart to finalize bill.');
        }
      }, 150);
      return;
    }
  };

  useEffect(() => {
    // 1. Process any pending AI action queued during navigation
    try {
      const pendingRaw = sessionStorage.getItem('pending_ai_pos_action');
      if (pendingRaw) {
        sessionStorage.removeItem('pending_ai_pos_action');
        const pending = JSON.parse(pendingRaw);
        if (pending && Date.now() - (pending.timestamp || 0) < 10000) {
          executeAiPosAction(pending);
        }
      }
    } catch (e) {
      console.error('Pending AI POS error:', e);
    }

    // 2. Real-time event listener for live voice assistant
    const handleAiEvent = (e) => {
      if (e.detail) {
        executeAiPosAction(e.detail);
      }
    };

    window.addEventListener('karobaar_ai_pos_action', handleAiEvent);
    return () => window.removeEventListener('karobaar_ai_pos_action', handleAiEvent);
  }, [products]);

  // Checkout Handler
  const handleCheckout = async () => {
    if (cart.length === 0 || !currentUser?.activeBusinessId) return;
    
    if (paymentMethod === 'Udhaar' && !selectedCustomer) {
      alert('Please select a customer first to provide Udhaar / Credit.');
      return;
    }

    if (paymentMethod === 'Split' && splitRemaining > 0.01) {
      alert(`Split payment incomplete. Still remaining: ${currencySymbol}${splitRemaining.toFixed(2)}`);
      return;
    }

    if (paymentMethod === 'UPI') {
      setIsUPIModalOpen(true);
      return;
    }

    await finalizeCheckout();
  };

  const finalizeCheckout = async () => {
    setProcessing(true);
    try {
      let finalAmountPaid = total;
      let balanceDue = 0;

      if (paymentMethod === 'Udhaar') {
        finalAmountPaid = parseFloat(amountPaid) || 0;
        balanceDue = Math.max(0, total - finalAmountPaid);
      }

      const emp = employees.find(e => e.id === selectedEmployee);
      await salesService.createSale({
        items: cart,
        customerId: selectedCustomer || null,
        employeeId: selectedEmployee || null,
        employeeName: emp ? emp.name : 'Admin',
        paymentMethod,
        subtotal,
        tax: taxAmount,
        discount: calculatedDiscount,
        discountType,
        discountValue,
        total,
        amountPaid: finalAmountPaid,
        balanceDue,
        dueDate: paymentMethod === 'Udhaar' && dueDate ? dueDate : null,
        businessId: currentUser.activeBusinessId,
        notes: orderNotes,
        orderType,
        tokenNumber,
        splitDetails: paymentMethod === 'Split' ? splitDetails : null
      });

      setSuccess(true);
      setCart([]);
      setSelectedCustomer('');
      setSelectedEmployee('');
      setDiscountValue(0);
      setAmountPaid('');
      setDueDate('');
      setCashTendered('');
      setOrderNotes('');
      setSplitDetails({ cash: '', upi: '', card: '' });
      setPaymentMethod('Cash');
      setTokenNumber(`T-${Math.floor(100 + Math.random() * 900)}`);
      setIsUPIModalOpen(false);
      
      loadData(currentUser.activeBusinessId); // refresh inventory counts
      showToast('Sale recorded successfully!');
      setTimeout(() => setSuccess(false), 3500);
    } catch (error) {
      console.error(error);
      alert('Checkout failed. Please check connection or details.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    setIsInvoiceModalOpen(true);
  };

  const executePrint = () => {
    setIsInvoiceModalOpen(false);
    const selectedCustObj = customers.find(c => c.id === selectedCustomer);
    const selectedEmpObj = employees.find(e => e.id === selectedEmployee);

    const printContent = `
      <html>
        <head>
          <title>Receipt - ${currentBusiness?.name || 'Karobaar'}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 15px; color: #000; width: 300px; margin: 0 auto; background: #fff; }
            .header { text-align: center; margin-bottom: 12px; border-bottom: 2px dashed #000; padding-bottom: 12px; }
            .header h2 { margin: 0 0 4px 0; font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 0; font-size: 11px; color: #222; }
            .meta { margin-bottom: 12px; font-size: 11px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .badge { display: inline-block; padding: 2px 6px; border: 1px solid #000; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            th { text-align: left; padding: 4px 0; border-bottom: 1px solid #000; font-size: 11px; text-transform: uppercase; }
            td { padding: 6px 0; font-size: 11px; border-bottom: 1px dashed #ddd; vertical-align: top; }
            .text-right { text-align: right; }
            .totals { border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; font-weight: bold; }
            .total-row.grand-total { font-size: 16px; margin-top: 8px; padding-top: 8px; border-top: 2px dashed #000; }
            .footer { text-align: center; margin-top: 15px; font-size: 11px; border-top: 2px dashed #000; padding-top: 12px; font-weight: bold; }
            .barcode { text-align: center; margin-top: 10px; font-family: monospace; font-size: 12px; letter-spacing: 3px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${currentBusiness?.name || 'KAROBAAR'}</h2>
            <p>Official Sales Receipt</p>
            ${currentBusiness?.phone || currentUser?.phone ? `<p style="margin-top: 4px; font-weight: bold;">Ph: ${currentBusiness?.phone || currentUser?.phone}</p>` : ''}
            <div class="badge">Token: ${tokenNumber} • ${orderType}</div>
          </div>
          
          <div class="meta">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
              <span>${new Date().toLocaleTimeString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span><strong>Pay Mode:</strong> ${paymentMethod}</span>
              <span><strong>Cashier:</strong> ${selectedEmpObj ? selectedEmpObj.name : 'Admin'}</span>
            </div>
            ${selectedCustObj ? `<div style="margin-top: 3px;"><strong>Customer:</strong> ${selectedCustObj.name} (${selectedCustObj.phone || 'No phone'})</div>` : ''}
            ${orderNotes ? `<div style="margin-top: 3px; font-style: italic;"><strong>Note:</strong> ${orderNotes}</div>` : ''}
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
                  <td>${item.name}${item.isCustom ? ' *' : ''}</td>
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
            ${calculatedDiscount > 0 ? `
            <div class="total-row">
              <span>Discount ${discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
              <span>-${currencySymbol}${calculatedDiscount.toFixed(2)}</span>
            </div>` : ''}
            <div class="total-row grand-total">
              <span>TOTAL</span>
              <span>${currencySymbol}${total.toFixed(2)}</span>
            </div>
            ${paymentMethod === 'Cash' && parsedCashTendered > 0 ? `
              <div class="total-row" style="margin-top: 6px; font-weight: normal;">
                <span>Cash Tendered:</span>
                <span>${currencySymbol}${parsedCashTendered.toFixed(2)}</span>
              </div>
              <div class="total-row" style="font-weight: bold;">
                <span>Change Returned:</span>
                <span>${currencySymbol}${changeDue.toFixed(2)}</span>
              </div>
            ` : ''}
            ${paymentMethod === 'Split' ? `
              <div class="total-row" style="margin-top: 6px; font-weight: normal;">
                <span>Split: Cash ${currencySymbol}${splitCash} | UPI ${currencySymbol}${splitUpi} | Card ${currencySymbol}${splitCard}</span>
              </div>
            ` : ''}
          </div>

          <div class="barcode">
            *${tokenNumber}*
          </div>

          <div class="footer">
            <p style="margin: 0 0 4px 0;">Thank you for your business!</p>
            <p style="margin: 0;">Visit Again</p>
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

  if (isMobile) {
    return (
      <MobilePOS 
        products={products}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        cart={cart}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        subtotal={subtotal}
        total={total}
        handleCheckout={handleCheckout}
        processing={processing}
        currencySymbol={currencySymbol}
        clearCart={clearCart}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        customers={customers}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        discount={calculatedDiscount}
        setDiscount={setDiscountValue}
        success={success}
      />
    );
  }

  const selectedCustObj = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="pos-container hidden-mobile">
      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="pos-toast-banner">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left side: Products Catalog & Actions */}
      <div className="pos-products-section">
        {/* Top Action Bar */}
        <div className="pos-catalog-header">
          {/* Search & Barcode Input */}
          <div className="pos-search-wrapper">
            <Search size={18} className="pos-search-icon" />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Search product, SKU, or scan barcode (Press Enter to add)... [F2]" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pos-search-input"
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="pos-clear-search-btn"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="pos-header-actions">
            {/* View Mode Toggle */}
            <div className="pos-view-toggle">
              <button 
                className={`pos-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => toggleViewMode('table')}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button 
                className={`pos-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => toggleViewMode('grid')}
                title="Touch POS Grid View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {/* + Custom Item Button */}
            <button 
              className="pos-action-btn"
              onClick={() => setIsCustomItemModalOpen(true)}
              title="Add Custom Unlisted Item"
            >
              <PackagePlus size={16} />
              <span>+ Custom Item</span>
            </button>

            {/* Park / Hold Order Button */}
            <button 
              className="pos-action-btn"
              onClick={handleHoldOrder}
              disabled={cart.length === 0}
              title="Park Current Order (F4)"
              style={{ opacity: cart.length === 0 ? 0.6 : 1 }}
            >
              <Clock size={16} />
              <span>Hold Bill</span>
            </button>

            {/* Parked Orders Count Badge */}
            {heldOrders.length > 0 && (
              <button 
                className="pos-action-btn pos-parked-badge-btn"
                onClick={() => setIsHeldOrdersModalOpen(true)}
                title="View Parked Orders"
              >
                <span>Parked ({heldOrders.length})</span>
              </button>
            )}

            {/* Keyboard Shortcuts Hint */}
            <button 
              className="pos-action-btn pos-icon-only-btn"
              onClick={() => setIsShortcutsModalOpen(true)}
              title="Keyboard Shortcuts"
            >
              <Keyboard size={16} />
            </button>
          </div>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="pos-category-bar custom-scrollbar">
          {categories.map(cat => {
            const count = cat === 'All' 
              ? products.length 
              : products.filter(p => p.category === cat).length;
            const isActive = activeCategory === cat;

            return (
              <button 
                key={cat} 
                className={`pos-category-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span>{cat}</span>
                <span className="pos-category-count">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Product Catalog Display (Table or Grid) */}
        <div className="pos-catalog-body custom-scrollbar">
          {products.length === 0 ? (
            <div className="pos-empty-catalog">
              <div className="pos-empty-icon-wrap">
                <ShoppingCart size={32} />
              </div>
              <h3>No products found</h3>
              <p>Add products in Inventory to start billing, or use <strong>+ Custom Item</strong> above.</p>
              <button 
                className="pos-action-btn"
                style={{ marginTop: '16px' }}
                onClick={() => setIsCustomItemModalOpen(true)}
              >
                <PackagePlus size={16} /> Add Custom Item
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="pos-empty-catalog">
              <p>No products match "{searchTerm}" {activeCategory !== 'All' ? `in ${activeCategory}` : ''}</p>
              <button 
                className="pos-action-btn"
                style={{ marginTop: '12px' }}
                onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}
              >
                <RotateCcw size={14} /> Reset Filters
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW */
            <div className="pos-table-card">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th className="w-2/5">Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th className="text-center w-40">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => {
                    const cartItem = cart.find(item => item.productId === product.id);
                    const quantityInCart = cartItem ? cartItem.quantity : 0;
                    const availableStock = Math.max(0, product.stockQuantity - quantityInCart);

                    return (
                      <tr key={product.id} className={availableStock <= 0 ? 'out-of-stock-row' : ''}>
                        <td>
                          <div className="pos-product-col">
                            <div className="pos-thumb-box">
                              {product.imageUrl && product.imageUrl.trim() !== '' ? (
                                <img src={product.imageUrl} alt={product.name} />
                              ) : (
                                <Package size={20} className="text-muted" />
                              )}
                            </div>
                            <div className="pos-name-col">
                              <span className="pos-prod-name">{product.name}</span>
                              <span className="pos-prod-sku">{product.sku || 'No SKU'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="pos-prod-category">{product.category || 'General'}</span>
                        </td>
                        <td>
                          <div className="pos-price-val">
                            <span className="currency">{currencySymbol}</span>
                            <span className="amount">{product.sellingPrice || product.price || 0}</span>
                          </div>
                        </td>
                        <td>
                          <div className="pos-stock-badge-col">
                            {(() => {
                              const threshold = currentBusiness?.settings?.lowStockThreshold || 10;
                              const isLow = availableStock > 0 && availableStock <= threshold;
                              const isOut = availableStock <= 0;
                              return (
                                <span className={`pos-stock-tag ${isOut ? 'out' : isLow ? 'low' : 'in'}`}>
                                  {isOut ? 'Out of stock' : isLow ? `Low (${availableStock})` : `In Stock (${availableStock})`}
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                        <td>
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
                                disabled={availableStock <= 0}
                                onClick={() => { if (availableStock > 0) addToCart(product); }}
                              >
                                <Plus size={14} strokeWidth={3} />
                              </button>
                            </div>
                          ) : availableStock > 0 ? (
                            <button 
                              className="pos-add-btn"
                              onClick={() => addToCart(product)}
                            >
                              <ShoppingCart size={15} strokeWidth={2.5} /> 
                              <span>Add</span>
                            </button>
                          ) : (
                            <div className="pos-unavailable-btn">
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
          ) : (
            /* TOUCH GRID VIEW */
            <div className="pos-touch-grid">
              {filteredProducts.map(product => {
                const cartItem = cart.find(item => item.productId === product.id);
                const quantityInCart = cartItem ? cartItem.quantity : 0;
                const availableStock = Math.max(0, product.stockQuantity - quantityInCart);
                const isOut = availableStock <= 0;

                return (
                  <div 
                    key={product.id}
                    className={`pos-grid-card ${quantityInCart > 0 ? 'in-cart' : ''} ${isOut ? 'is-out' : ''}`}
                    onClick={() => { if (!isOut && quantityInCart === 0) addToCart(product); }}
                  >
                    <div className="pos-grid-thumb">
                      {product.imageUrl && product.imageUrl.trim() !== '' ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        <Package size={28} className="text-muted" />
                      )}
                      <span className="pos-grid-cat-tag">{product.category || 'General'}</span>
                    </div>

                    <div className="pos-grid-info">
                      <h4 className="pos-grid-title" title={product.name}>{product.name}</h4>
                      <div className="pos-grid-meta">
                        <div className="pos-grid-price">
                          {currencySymbol}{product.sellingPrice || product.price || 0}
                        </div>
                        <span className={`pos-stock-tag ${isOut ? 'out' : availableStock <= 10 ? 'low' : 'in'}`}>
                          {isOut ? 'Out' : `${availableStock} left`}
                        </span>
                      </div>
                    </div>

                    {/* Actions on Card */}
                    <div className="pos-grid-actions" onClick={e => e.stopPropagation()}>
                      {quantityInCart > 0 ? (
                        <div className="pos-qty-toggle" style={{ width: '100%', height: '34px' }}>
                          <button 
                            className="pos-qty-btn"
                            onClick={() => { if (quantityInCart === 1) removeFromCart(product.id); else updateQuantity(product.id, -1); }}
                          >
                            <Minus size={13} strokeWidth={3} />
                          </button>
                          <div className="pos-qty-val" style={{ fontSize: '13px' }}>
                            {quantityInCart}
                          </div>
                          <button 
                            className="pos-qty-btn"
                            disabled={availableStock <= 0}
                            onClick={() => { if (availableStock > 0) addToCart(product); }}
                          >
                            <Plus size={13} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="pos-add-btn" 
                          style={{ width: '100%', height: '34px', fontSize: '13px' }}
                          disabled={isOut}
                          onClick={() => addToCart(product)}
                        >
                          <Plus size={15} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Cart & Checkout Section */}
      <div className="pos-cart-section">
        {/* Cart Header */}
        <div className="pos-cart-header">
          <div className="pos-cart-title-row">
            <div className="pos-cart-title">
              <span>Current Order</span>
              <span className="pos-cart-token">{tokenNumber}</span>
              {cart.length > 0 && (
                <span className="pos-cart-count-pill">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
              )}
            </div>

            <button 
              className="pos-cart-clear-btn"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              Clear
            </button>
          </div>

          {/* Order Type Selector Pills (Dine-in / Takeaway / Delivery) */}
          <div className="pos-order-type-bar">
            <button 
              className={`pos-order-type-btn ${orderType === 'Takeaway' ? 'active' : ''}`}
              onClick={() => setOrderType('Takeaway')}
            >
              <ShoppingBag size={14} /> Takeaway
            </button>
            <button 
              className={`pos-order-type-btn ${orderType === 'Dine-in' ? 'active' : ''}`}
              onClick={() => setOrderType('Dine-in')}
            >
              <Utensils size={14} /> Dine-in
            </button>
            <button 
              className={`pos-order-type-btn ${orderType === 'Delivery' ? 'active' : ''}`}
              onClick={() => setOrderType('Delivery')}
            >
              <Truck size={14} /> Delivery
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="pos-cart-items custom-scrollbar">
          {cart.length === 0 ? (
            <div className="pos-empty-cart">
              <ShoppingCart size={42} strokeWidth={1.5} className="pos-empty-cart-icon" />
              <p className="pos-empty-cart-title">Cart is empty</p>
              <p className="pos-empty-cart-sub">Select products from the left or scan a barcode to begin.</p>
            </div>
          ) : (
            <div className="pos-cart-list">
              {cart.map(item => (
                <div key={item.productId} className="pos-cart-row">
                  {/* Item Image / Icon */}
                  <div className="pos-cart-row-thumb">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} />
                    ) : (
                      <Package size={20} className="text-muted" />
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="pos-cart-row-details">
                    <div className="pos-cart-row-top">
                      <div className="pos-cart-row-name">
                        <span>{item.name}</span>
                        {item.isCustom && <span className="pos-custom-badge">Custom</span>}
                      </div>
                      <span className="pos-cart-row-total">
                        {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <div className="pos-cart-row-unit-price">
                      {currencySymbol}{item.price.toFixed(2)} each
                    </div>

                    {/* Quantity & Delete Controls */}
                    <div className="pos-cart-row-bottom">
                      <div className="pos-qty-toggle" style={{ width: '100px', height: '30px' }}>
                        <button 
                          className="pos-qty-btn"
                          onClick={() => { if (item.quantity === 1) removeFromCart(item.productId); else updateQuantity(item.productId, -1); }}
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <div className="pos-qty-val" style={{ fontSize: '12px' }}>
                          {item.quantity}
                        </div>
                        <button 
                          className="pos-qty-btn"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>

                      {/* Quick multipliers */}
                      <button 
                        className="pos-quick-mult-btn"
                        onClick={() => updateQuantity(item.productId, 5)}
                        title="Add 5 more"
                      >
                        +5
                      </button>

                      <button 
                        className="pos-cart-del-btn"
                        onClick={() => removeFromCart(item.productId)}
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Bottom / Checkout Panel */}
        <div className="pos-checkout-panel">
          {/* Order Note / Table # */}
          <div className="pos-order-note-row">
            <input 
              type="text"
              placeholder="Table # or Order note (e.g. Table 4, Less spicy)..."
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              className="pos-order-note-input"
            />
          </div>

          {/* Customer & Rep Dropdowns */}
          <div className="pos-actors-row">
            <div className="pos-actor-col">
              <div className="pos-customer-select-wrap">
                <select 
                  value={selectedCustomer} 
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="pos-select"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="pos-quick-add-cust-btn"
                  onClick={() => setIsQuickCustomerModalOpen(true)}
                  title="Add new customer"
                >
                  <UserPlus size={14} />
                </button>
              </div>

              {selectedCustObj && (selectedCustObj.outstandingBalance > 0) && (
                <div className="pos-cust-balance-hint">
                  Khata Due: {currencySymbol}{selectedCustObj.outstandingBalance.toFixed(2)}
                </div>
              )}
            </div>

            <div className="pos-actor-col">
              <select 
                value={selectedEmployee} 
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="pos-select"
              >
                <option value="">Rep: Admin</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
              </select>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="pos-pricing-summary">
            <div className="pos-summary-row">
              <span>Subtotal</span>
              <span className="font-bold">{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>

            <div className="pos-summary-row">
              <span>Tax ({taxRate}%)</span>
              <span className="font-bold">{currencySymbol}{taxAmount.toFixed(2)}</span>
            </div>

            {/* Discount Control Row */}
            <div className="pos-discount-control-row">
              <div className="pos-discount-label-col">
                <span className="pos-discount-title">Discount</span>
                <div className="pos-discount-toggle">
                  <button 
                    className={`pos-disc-toggle-btn ${discountType === 'fixed' ? 'active' : ''}`}
                    onClick={() => setDiscountType('fixed')}
                  >
                    {currencySymbol}
                  </button>
                  <button 
                    className={`pos-disc-toggle-btn ${discountType === 'percent' ? 'active' : ''}`}
                    onClick={() => setDiscountType('percent')}
                  >
                    %
                  </button>
                </div>
              </div>

              <div className="pos-discount-inputs">
                <input 
                  type="number" 
                  value={discountValue} 
                  onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="pos-discount-input"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Quick Discount Presets */}
            <div className="pos-discount-presets">
              {[5, 10, 15, 20].map(pct => (
                <button 
                  key={pct}
                  className="pos-discount-preset-btn"
                  onClick={() => { setDiscountType('percent'); setDiscountValue(pct); }}
                >
                  {pct}%
                </button>
              ))}
              {discountValue > 0 && (
                <button 
                  className="pos-discount-preset-btn clear"
                  onClick={() => setDiscountValue(0)}
                >
                  Reset
                </button>
              )}
            </div>

            {calculatedDiscount > 0 && (
              <div className="pos-summary-row text-discount">
                <span>Discount Applied</span>
                <span>-{currencySymbol}{calculatedDiscount.toFixed(2)}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pos-grand-total-row">
              <span className="pos-total-label">Payable Total</span>
              <span className="pos-total-val">{currencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="pos-payment-methods">
            <button 
              className={`pos-pay-btn ${paymentMethod === 'Cash' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('Cash')}
            >
              <Banknote size={15} /> Cash
            </button>
            <button 
              className={`pos-pay-btn ${paymentMethod === 'Card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('Card')}
            >
              <CreditCard size={15} /> Card
            </button>
            <button 
              className={`pos-pay-btn ${paymentMethod === 'UPI' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('UPI')}
            >
              <QrCode size={15} /> UPI / QR
            </button>
            <button 
              className={`pos-pay-btn ${paymentMethod === 'Split' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('Split')}
            >
              <Split size={15} /> Split
            </button>
            <button 
              className={`pos-pay-btn ${paymentMethod === 'Udhaar' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('Udhaar')}
            >
              <User size={15} /> Udhaar
            </button>
          </div>

          {/* Conditional Payment Controls */}
          {/* 1. Cash Tendered & Change Due */}
          {paymentMethod === 'Cash' && cart.length > 0 && (
            <div className="pos-payment-subpanel">
              <div className="pos-subpanel-row">
                <span className="pos-subpanel-title">Cash Tendered</span>
                <input 
                  type="number" 
                  value={cashTendered} 
                  onChange={e => setCashTendered(e.target.value)}
                  placeholder={total.toFixed(0)}
                  className="pos-subpanel-input"
                  min="0"
                />
              </div>
              <div className="pos-cash-presets">
                <button className="pos-cash-preset-btn" onClick={() => setCashTendered(total.toFixed(0))}>Exact</button>
                <button className="pos-cash-preset-btn" onClick={() => setCashTendered('500')}>₹500</button>
                <button className="pos-cash-preset-btn" onClick={() => setCashTendered('1000')}>₹1000</button>
                <button className="pos-cash-preset-btn" onClick={() => setCashTendered('2000')}>₹2000</button>
              </div>
              {parsedCashTendered > 0 && (
                <div className="pos-change-due-row">
                  <span>Change to Return:</span>
                  <span className="pos-change-val">{currencySymbol}{changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* 2. Split Payment Inputs */}
          {paymentMethod === 'Split' && (
            <div className="pos-payment-subpanel">
              <div className="pos-subpanel-row">
                <span className="pos-subpanel-title">Cash Portion</span>
                <input 
                  type="number" 
                  value={splitDetails.cash} 
                  onChange={e => setSplitDetails(prev => ({ ...prev, cash: e.target.value }))}
                  placeholder="0.00"
                  className="pos-subpanel-input"
                />
              </div>
              <div className="pos-subpanel-row">
                <span className="pos-subpanel-title">UPI Portion</span>
                <input 
                  type="number" 
                  value={splitDetails.upi} 
                  onChange={e => setSplitDetails(prev => ({ ...prev, upi: e.target.value }))}
                  placeholder="0.00"
                  className="pos-subpanel-input"
                />
              </div>
              <div className="pos-subpanel-row">
                <span className="pos-subpanel-title">Card Portion</span>
                <input 
                  type="number" 
                  value={splitDetails.card} 
                  onChange={e => setSplitDetails(prev => ({ ...prev, card: e.target.value }))}
                  placeholder="0.00"
                  className="pos-subpanel-input"
                />
              </div>
              <div className="pos-split-status-row">
                <span>Remaining: {currencySymbol}{splitRemaining.toFixed(2)}</span>
                <button 
                  className="pos-quick-fill-btn"
                  onClick={() => setSplitDetails(prev => ({ ...prev, upi: Math.max(0, total - (parseFloat(prev.cash) || 0) - (parseFloat(prev.card) || 0)).toFixed(2) }))}
                >
                  Balance to UPI
                </button>
              </div>
            </div>
          )}

          {/* 3. Udhaar Controls */}
          {paymentMethod === 'Udhaar' && (
            <div className="pos-payment-subpanel">
              <div className="pos-subpanel-row">
                <span className="pos-subpanel-title">Advance Paid</span>
                <input 
                  type="number" 
                  value={amountPaid} 
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="pos-subpanel-input"
                  min="0"
                />
              </div>
              <div className="pos-subpanel-row">
                <span className="pos-subpanel-title">Due Date</span>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                  className="pos-subpanel-input"
                />
              </div>
              <div className="pos-change-due-row">
                <span>Balance to Khata:</span>
                <span className="pos-change-val">{currencySymbol}{Math.max(0, total - (parseFloat(amountPaid) || 0)).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Primary Checkout Actions */}
          <div className="pos-checkout-actions">
            <button 
              className="pos-checkout-btn"
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
            >
              {processing ? 'Processing Sale...' : success ? 'Sale Completed!' : (
                <>Checkout ({currencySymbol}{total.toFixed(2)}) <ArrowRight size={18} /></>
              )}
            </button>
            
            <button 
              className="pos-print-btn"
              onClick={handlePrint}
              disabled={cart.length === 0 || processing}
            >
              <Printer size={17} /> Print Bill
            </button>
          </div>

          {success && (
            <div className="pos-success-banner">
              Sale recorded successfully!
            </div>
          )}
        </div>
      </div>

      {/* UPI / QR Payment Modal */}
      <UPIModal 
        isOpen={isUPIModalOpen}
        onClose={() => setIsUPIModalOpen(false)}
        onConfirm={finalizeCheckout}
        total={total}
        currencySymbol={currencySymbol}
        businessName={currentBusiness?.name || 'Karobaar'}
        businessId={currentUser?.activeBusinessId}
      />

      {/* Held Orders Modal */}
      <HeldOrdersModal 
        isOpen={isHeldOrdersModalOpen}
        onClose={() => setIsHeldOrdersModalOpen(false)}
        heldOrders={heldOrders}
        onResumeOrder={handleResumeOrder}
        onDeleteOrder={handleDeleteHeldOrder}
        currencySymbol={currencySymbol}
      />

      {/* Custom Item Modal */}
      <CustomItemModal 
        isOpen={isCustomItemModalOpen}
        onClose={() => setIsCustomItemModalOpen(false)}
        onAddCustomItem={handleAddCustomItem}
        currencySymbol={currencySymbol}
      />

      {/* Quick Customer Modal */}
      <QuickCustomerModal 
        isOpen={isQuickCustomerModalOpen}
        onClose={() => setIsQuickCustomerModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
        businessId={currentUser?.activeBusinessId}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      {isShortcutsModalOpen && (
        <div className="biz-modal-overlay" onClick={() => setIsShortcutsModalOpen(false)} style={{ zIndex: 1100 }}>
          <div 
            className="biz-modal-content" 
            style={{ maxWidth: '420px', padding: '24px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: '14px', border: '1px solid var(--border-color)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Keyboard size={20} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>POS Keyboard Shortcuts</h3>
              </div>
              <button onClick={() => setIsShortcutsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="pos-shortcut-row">
                <kbd className="pos-kbd">F2</kbd>
                <span>Focus search bar & barcode reader</span>
              </div>
              <div className="pos-shortcut-row">
                <kbd className="pos-kbd">Enter</kbd>
                <span>Auto-add matched barcode / SKU to cart</span>
              </div>
              <div className="pos-shortcut-row">
                <kbd className="pos-kbd">F4</kbd>
                <span>Park / Hold current bill</span>
              </div>
              <div className="pos-shortcut-row">
                <kbd className="pos-kbd">F9</kbd>
                <span>Quick Checkout / Finalize Sale</span>
              </div>
              <div className="pos-shortcut-row">
                <kbd className="pos-kbd">Esc</kbd>
                <span>Close any open modal or preview</span>
              </div>
            </div>
            <button 
              onClick={() => setIsShortcutsModalOpen(false)}
              style={{ marginTop: '20px', width: '100%', height: '38px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--text-main)', color: 'var(--bg-card)', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal Preview Popup */}
      {isInvoiceModalOpen && (
        <div className="biz-modal-overlay" onClick={() => setIsInvoiceModalOpen(false)} style={{ zIndex: 1100 }}>
          <div className="biz-modal-content" style={{ maxWidth: '420px', width: '92%', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>Thermal Receipt Preview</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontFamily: "'Courier New', Courier, monospace", padding: "16px", color: "#000", background: "#fff", border: "1px solid #000", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontSize: '12px' }}>
              <div style={{ textAlign: "center", marginBottom: "12px", borderBottom: "2px dashed #000", paddingBottom: "12px" }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>{currentBusiness?.name || 'KAROBAAR'}</h2>
                <p style={{ margin: 0, fontSize: "11px", color: "#333" }}>Official Sales Receipt</p>
                {currentBusiness?.phone || currentUser?.phone ? <p style={{ margin: "4px 0 0 0", fontWeight: "bold", fontSize: "11px" }}>Ph: {currentBusiness?.phone || currentUser?.phone}</p> : null}
                <div style={{ display: "inline-block", padding: "2px 6px", border: "1px solid #000", fontSize: "10px", fontWeight: "bold", marginTop: "6px" }}>
                  Token: {tokenNumber} • {orderType}
                </div>
              </div>
              
              <div style={{ marginBottom: "12px", fontSize: "11px", borderBottom: "2px dashed #000", paddingBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span><strong>Date:</strong> {new Date().toLocaleDateString()}</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span><strong>Pay:</strong> {paymentMethod}</span>
                  <span><strong>Cashier:</strong> {employees.find(e => e.id === selectedEmployee)?.name || 'Admin'}</span>
                </div>
                {selectedCustObj ? <div style={{ marginTop: "3px" }}><strong>Customer:</strong> {selectedCustObj.name}</div> : null}
                {orderNotes ? <div style={{ marginTop: "3px", fontStyle: "italic" }}><strong>Note:</strong> {orderNotes}</div> : null}
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "4px 0", borderBottom: "1px solid #000", fontSize: "11px", textTransform: "uppercase" }}>Item</th>
                    <th style={{ textAlign: "left", padding: "4px 0", borderBottom: "1px solid #000", fontSize: "11px", textTransform: "uppercase" }}>Qty</th>
                    <th style={{ textAlign: "right", padding: "4px 0", borderBottom: "1px solid #000", fontSize: "11px", textTransform: "uppercase" }}>Price</th>
                    <th style={{ textAlign: "right", padding: "4px 0", borderBottom: "1px solid #000", fontSize: "11px", textTransform: "uppercase" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.productId}>
                      <td style={{ padding: "6px 0", fontSize: "11px", borderBottom: "1px dashed #ddd", verticalAlign: "top" }}>{item.name}{item.isCustom ? ' *' : ''}</td>
                      <td style={{ padding: "6px 0", fontSize: "11px", borderBottom: "1px dashed #ddd", verticalAlign: "top" }}>{item.quantity}</td>
                      <td style={{ padding: "6px 0", fontSize: "11px", borderBottom: "1px dashed #ddd", verticalAlign: "top", textAlign: "right" }}>{currencySymbol}{item.price.toFixed(2)}</td>
                      <td style={{ padding: "6px 0", fontSize: "11px", borderBottom: "1px dashed #ddd", verticalAlign: "top", textAlign: "right" }}>{currencySymbol}${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: "2px solid #000", paddingTop: "8px", margin: "8px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px", fontWeight: "bold" }}>
                  <span>Subtotal</span>
                  <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px", fontWeight: "bold" }}>
                  <span>Tax ({taxRate}%)</span>
                  <span>{currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px", fontWeight: "bold" }}>
                    <span>Discount {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
                    <span>-{currencySymbol}{calculatedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", marginTop: "8px", paddingTop: "8px", borderTop: "2px dashed #000", fontWeight: "bold" }}>
                  <span>TOTAL</span>
                  <span>{currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: "14px", fontSize: "11px", borderTop: "2px dashed #000", paddingTop: "10px", fontWeight: "bold" }}>
                <p style={{ margin: "0 0 3px 0" }}>Thank you for buying</p>
                <p style={{ margin: 0 }}>Visit again..!!</p>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button 
                onClick={() => setIsInvoiceModalOpen(false)}
                style={{ flex: 1, height: "42px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-card)", color: "var(--text-main)", fontWeight: "bold", cursor: "pointer" }}
              >
                Close
              </button>
              <button 
                onClick={executePrint}
                style={{ flex: 2, height: "42px", borderRadius: "8px", border: "none", backgroundColor: "var(--text-main)", color: "var(--bg-card)", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Printer size={18} /> Print Thermal Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
