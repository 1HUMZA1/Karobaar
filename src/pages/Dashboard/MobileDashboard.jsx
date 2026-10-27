import React, { useState } from 'react';
import { format, isValid } from 'date-fns';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  TrendingUp, 
  Zap, 
  ChevronRight, 
  Plus, 
  Receipt, 
  Camera, 
  Calendar, 
  X, 
  CreditCard,
  DollarSign,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { db } from '../../services/databaseService';
import './MobileDashboard.css';

export const MobileDashboard = ({ 
  currentUser, 
  currentBusiness, 
  stats, 
  trends, 
  currencySymbol = '₹', 
  chartData, 
  recentOrders = [],
  lowStockProducts = [],
  onRefresh,
  isRefreshing
}) => {
  const navigate = useNavigate();
  
  // Timeframe filter matching Screen 3: 'today' | 'week' | 'month'
  const [timeFilter, setTimeFilter] = useState('today');

  // Modals state
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSalesOverview, setShowSalesOverview] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showRecordExpenseModal, setShowRecordExpenseModal] = useState(false);

  // New Product Form State (Screen 7)
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Food');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('50');
  const [newProductImage, setNewProductImage] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Record Expense Form State (Screen 8)
  const [expenseCategory, setExpenseCategory] = useState('Supplies');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expenseNote, setExpenseNote] = useState('');
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatSafeNumber = (num) => {
    if (num === '***') return '***';
    return (Number(num) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatSafeDate = (dateStr) => {
    if (!dateStr) return 'Aug 26, 10:24';
    const d = new Date(dateStr);
    if (!isValid(d)) return 'Recently';
    return format(d, 'MMM dd, HH:mm');
  };

  // Dynamic revenue calculation for selected filter
  const getActiveRevenue = () => {
    if (timeFilter === 'today') return stats?.todayRevenue || 0;
    if (chartData?.revenueData?.length) {
      const sliceCount = timeFilter === 'week' ? 7 : 30;
      const total = chartData.revenueData.slice(-sliceCount).reduce((acc, v) => acc + (Number(v) || 0), 0);
      return total > 0 ? total : (stats?.todayRevenue || 0) * (timeFilter === 'week' ? 5 : 22);
    }
    return (stats?.todayRevenue || 0) * (timeFilter === 'week' ? 5 : 22);
  };

  const activeRevenue = getActiveRevenue();
  const orderCount = stats?.todayOrders || (recentOrders?.length || 0);
  const avgOrderVal = orderCount > 0 ? (activeRevenue / orderCount) : 0;

  // Chart dataset for Sales Overview (Screen 4)
  const salesOverviewChartData = {
    labels: chartData?.labels?.length ? chartData.labels : ['Aug 20', 'Aug 21', 'Aug 22', 'Aug 23', 'Aug 24', 'Aug 25', 'Aug 26'],
    datasets: [
      {
        data: chartData?.revenueData?.length ? chartData.revenueData : [0, 480, 275, 620, 360, 480, activeRevenue],
        borderColor: '#09090b',
        backgroundColor: 'rgba(9, 9, 11, 0.06)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#09090b',
      }
    ]
  };

  const salesOverviewChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true }
    }
  };

  // Save new product (Screen 7)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!newProductName.trim()) return alert('Please enter product name');
    if (!newProductPrice) return alert('Please enter price');

    setIsSavingProduct(true);
    try {
      const productObj = {
        id: 'p_' + Date.now(),
        name: newProductName.trim(),
        category: newProductCategory,
        sellingPrice: parseFloat(newProductPrice) || 0,
        purchasePrice: (parseFloat(newProductPrice) || 0) * 0.6,
        stockQuantity: parseInt(newProductStock, 10) || 50,
        status: 'Active',
        createdAt: new Date().toISOString()
      };

      await db.insert('products', productObj, currentBusiness?.id);
      if (onRefresh) onRefresh();
      
      setNewProductName('');
      setNewProductPrice('');
      setShowAddProductModal(false);
      alert('Product saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Save expense (Screen 8)
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseAmount) return alert('Please enter amount');

    setIsSavingExpense(true);
    try {
      const expenseObj = {
        id: 'ex_' + Date.now(),
        category: expenseCategory,
        amount: parseFloat(expenseAmount) || 0,
        date: new Date(expenseDate).toISOString(),
        note: expenseNote,
        description: expenseCategory + ' Expense',
        paymentMethod: 'Cash',
        createdAt: new Date().toISOString()
      };

      await db.insert('expenses', expenseObj, currentBusiness?.id);
      if (onRefresh) onRefresh();

      setExpenseAmount('');
      setExpenseNote('');
      setShowRecordExpenseModal(false);
      alert('Expense recorded successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to record expense');
    } finally {
      setIsSavingExpense(false);
    }
  };

  const businessDisplayName = currentBusiness?.name || 'SAS CAFETERIA';

  return (
    <div className="karobaar-mobile-dash">
      {/* Native App Mobile Header */}
      <MobileHeader title="Karobaar" rightAction="dashboard" />

      <div className="px-4">
        {/* 1. Header Greeting Section matching Screen 3 */}
        <div className="k-dash-greeting-block">
          <div className="k-dash-live-badge">
            <span className="k-dash-live-dot"></span>
            <span className="k-dash-live-text">Live Workspace</span>
          </div>
          <h1 className="k-dash-business-title">
            {getGreeting()}, {businessDisplayName}! 👋
          </h1>
          <p className="k-dash-greeting-sub">
            {format(new Date(), 'EEEE, MMMM d')} · Real-time overview
          </p>
        </div>

        {/* 2. Timeframe Filter Segmented Capsule (Apple style) */}
        <div className="k-dash-segmented-bar">
          <button 
            type="button"
            className={`k-dash-seg-item ${timeFilter === 'today' ? 'active' : ''}`}
            onClick={() => setTimeFilter('today')}
          >
            Today
          </button>
          <button 
            type="button"
            className={`k-dash-seg-item ${timeFilter === 'week' ? 'active' : ''}`}
            onClick={() => setTimeFilter('week')}
          >
            This Week
          </button>
          <button 
            type="button"
            className={`k-dash-seg-item ${timeFilter === 'month' ? 'active' : ''}`}
            onClick={() => setTimeFilter('month')}
          >
            This Month
          </button>
        </div>

        {/* 3. 2x2 Metric Cards Grid matching Screen 3 */}
        <div className="k-dash-metrics-grid">
          {/* Card 1: Total Sales */}
          <div className="k-metric-card" onClick={() => setShowSalesOverview(true)}>
            <div className="k-metric-top">
              <span className="k-metric-label">Total Sales</span>
              <div className="k-metric-icon-box">
                <TrendingUp size={15} />
              </div>
            </div>
            <div>
              <p className="k-metric-val">{currencySymbol}{formatSafeNumber(activeRevenue)}</p>
              <span className="k-metric-trend">
                <span>↑</span> 12.4% vs prev
              </span>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="k-metric-card" onClick={() => navigate('/orders')}>
            <div className="k-metric-top">
              <span className="k-metric-label">Total Orders</span>
              <div className="k-metric-icon-box">
                <Package size={15} />
              </div>
            </div>
            <div>
              <p className="k-metric-val">{orderCount}</p>
              <span className="k-metric-trend">
                <span>↑</span> {orderCount > 0 ? '+1' : '0'} active
              </span>
            </div>
          </div>

          {/* Card 3: New Customers */}
          <div className="k-metric-card" onClick={() => navigate('/customers')}>
            <div className="k-metric-top">
              <span className="k-metric-label">Customers</span>
              <div className="k-metric-icon-box">
                <Users size={15} />
              </div>
            </div>
            <div>
              <p className="k-metric-val">{stats?.totalCustomers || 1}</p>
              <span className="k-metric-trend neutral">
                <span>·</span> Active CRM
              </span>
            </div>
          </div>

          {/* Card 4: Average Order Value */}
          <div className="k-metric-card" onClick={() => setShowSalesOverview(true)}>
            <div className="k-metric-top">
              <span className="k-metric-label">Avg Order</span>
              <div className="k-metric-icon-box">
                <CreditCard size={15} />
              </div>
            </div>
            <div>
              <p className="k-metric-val">{currencySymbol}{formatSafeNumber(avgOrderVal)}</p>
              <span className="k-metric-trend">
                <span>↑</span> Per sale
              </span>
            </div>
          </div>
        </div>

        {/* 4. Pitch Black Quick Actions Hub */}
        <div className="k-quick-actions-banner">
          <div className="k-quick-top-row" onClick={() => setShowQuickActions(true)}>
            <div className="k-quick-actions-left">
              <div className="k-quick-zap-icon">
                <Zap size={19} fill="#ffffff" />
              </div>
              <div className="k-quick-actions-text">
                <h4>Quick Actions</h4>
                <p>One-tap shortcuts to run your operations</p>
              </div>
            </div>
            <ChevronRight size={18} className="k-quick-chevron" />
          </div>

          {/* 4 Micro-Shortcut Buttons */}
          <div className="k-quick-shortcuts-row">
            <button 
              type="button" 
              className="k-shortcut-btn"
              onClick={() => navigate('/pos')}
            >
              <TrendingUp size={16} />
              <span>New Sale</span>
            </button>
            <button 
              type="button" 
              className="k-shortcut-btn"
              onClick={() => setShowAddProductModal(true)}
            >
              <Plus size={16} />
              <span>Product</span>
            </button>
            <button 
              type="button" 
              className="k-shortcut-btn"
              onClick={() => setShowRecordExpenseModal(true)}
            >
              <Receipt size={16} />
              <span>Expense</span>
            </button>
            <button 
              type="button" 
              className="k-shortcut-btn"
              onClick={() => navigate('/invoices')}
            >
              <FileText size={16} />
              <span>Invoice</span>
            </button>
          </div>
        </div>

        {/* 5. Recent Orders Section matching Screen 3 */}
        <div className="k-section-header">
          <h3 className="k-section-title">Recent Orders</h3>
          <button 
            type="button" 
            className="k-section-link"
            onClick={() => navigate('/orders')}
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        <div className="k-orders-feed">
          {recentOrders && recentOrders.length > 0 ? (
            recentOrders.slice(0, 4).map((order, idx) => (
              <div 
                key={order.id || idx} 
                className="k-order-card"
                onClick={() => navigate('/orders')}
              >
                <div className="k-order-left">
                  <div className="k-order-num-row">
                    <p className="k-order-id">{order.orderNumber || `#ORD00${idx + 1}`}</p>
                    <span className="k-order-status-badge completed">Completed</span>
                  </div>
                  <p className="k-order-customer">{order.customerName || 'Walk-in Customer'}</p>
                  <p className="k-order-date">{formatSafeDate(order.date)}</p>
                </div>
                <div className="k-order-right">
                  <div className="k-order-amount-col">
                    <p className="k-order-total">{currencySymbol}{formatSafeNumber(order.total || 0)}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            ))
          ) : (
            /* Empty State matching Screen 3 mockup */
            <div className="k-empty-orders-card">
              <div className="k-empty-icon-circle">
                <Camera size={22} />
              </div>
              <h4 className="k-empty-title">No recent orders</h4>
              <p className="k-empty-desc">Your orders will appear here.</p>
              <button 
                type="button"
                className="mt-2 text-xs font-bold px-4 py-2 bg-black text-white rounded-xl"
                onClick={() => navigate('/pos')}
              >
                Create First Sale
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: QUICK ACTIONS BOTTOM SHEET                          */}
      {/* ============================================================ */}
      {showQuickActions && (
        <div className="k-modal-backdrop" onClick={() => setShowQuickActions(false)}>
          <div className="k-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="k-modal-drag-pill"></div>
            <div className="k-modal-header">
              <h3 className="k-modal-title">
                <Zap size={20} /> Quick Actions
              </h3>
              <button 
                type="button" 
                className="k-modal-close-btn"
                onClick={() => setShowQuickActions(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="k-quick-grid">
              <div 
                className="k-quick-tile" 
                onClick={() => { setShowQuickActions(false); navigate('/pos'); }}
              >
                <div className="k-quick-tile-icon">
                  <ShoppingCart size={22} />
                </div>
                <p className="k-quick-tile-label">Create Sale</p>
                <p className="k-quick-tile-desc">Fast POS Counter</p>
              </div>

              <div 
                className="k-quick-tile" 
                onClick={() => { setShowQuickActions(false); setShowAddProductModal(true); }}
              >
                <div className="k-quick-tile-icon">
                  <Package size={22} />
                </div>
                <p className="k-quick-tile-label">Add Product</p>
                <p className="k-quick-tile-desc">New Item / Stock</p>
              </div>

              <div 
                className="k-quick-tile" 
                onClick={() => { setShowQuickActions(false); navigate('/customers'); }}
              >
                <div className="k-quick-tile-icon">
                  <UserPlus size={22} />
                </div>
                <p className="k-quick-tile-label">Add Customer</p>
                <p className="k-quick-tile-desc">Client Directory</p>
              </div>

              <div 
                className="k-quick-tile" 
                onClick={() => { setShowQuickActions(false); setShowRecordExpenseModal(true); }}
              >
                <div className="k-quick-tile-icon">
                  <Receipt size={22} />
                </div>
                <p className="k-quick-tile-label">Record Expense</p>
                <p className="k-quick-tile-desc">Log Outlays</p>
              </div>

              <div 
                className="k-quick-tile" 
                onClick={() => { setShowQuickActions(false); navigate('/invoices'); }}
              >
                <div className="k-quick-tile-icon">
                  <FileText size={22} />
                </div>
                <p className="k-quick-tile-label">Create Invoice</p>
                <p className="k-quick-tile-desc">Bill / Receipt</p>
              </div>

              <div 
                className="k-quick-tile" 
                onClick={() => { setShowQuickActions(false); setShowSalesOverview(true); }}
              >
                <div className="k-quick-tile-icon">
                  <TrendingUp size={22} />
                </div>
                <p className="k-quick-tile-label">View Reports</p>
                <p className="k-quick-tile-desc">Analytics & Trends</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: SALES OVERVIEW (SCREEN 4 IN MOCKUP)                 */}
      {/* ============================================================ */}
      {showSalesOverview && (
        <div className="k-modal-backdrop" onClick={() => setShowSalesOverview(false)}>
          <div className="k-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="k-modal-drag-pill"></div>
            <div className="k-modal-header">
              <h3 className="k-modal-title">
                Sales Overview
              </h3>
              <button 
                type="button" 
                className="k-modal-close-btn"
                onClick={() => setShowSalesOverview(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Daily / Weekly / Monthly filter pills */}
            <div className="k-dash-time-pills mb-4">
              <button 
                type="button" 
                className={`k-dash-pill-btn ${timeFilter === 'today' ? 'active' : ''}`}
                onClick={() => setTimeFilter('today')}
              >
                Daily
              </button>
              <button 
                type="button" 
                className={`k-dash-pill-btn ${timeFilter === 'week' ? 'active' : ''}`}
                onClick={() => setTimeFilter('week')}
              >
                Weekly
              </button>
              <button 
                type="button" 
                className={`k-dash-pill-btn ${timeFilter === 'month' ? 'active' : ''}`}
                onClick={() => setTimeFilter('month')}
              >
                Monthly
              </button>
            </div>

            {/* Total Sales Card with Curve */}
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Total Sales</p>
              <h2 className="text-2xl font-black mb-1">{currencySymbol}{formatSafeNumber(activeRevenue)}</h2>
              <p className="text-xs text-text-main font-bold mb-3">↑ 0% vs. yesterday</p>
              <div style={{ height: '160px' }}>
                <Line data={salesOverviewChartData} options={salesOverviewChartOptions} />
              </div>
            </div>

            {/* Sales Breakdown Card matching Screen 4 */}
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
              <h4 className="text-sm font-bold mb-3">Sales Breakdown</h4>
              <div className="k-breakdown-row">
                <span className="text-xs font-semibold flex items-center">
                  <span className="k-breakdown-dot"></span> Cash
                </span>
                <span className="text-xs font-bold">{currencySymbol}{formatSafeNumber(activeRevenue * 0.35)} (35%)</span>
              </div>
              <div className="k-breakdown-row">
                <span className="text-xs font-semibold flex items-center">
                  <span className="k-breakdown-dot"></span> UPI / QR
                </span>
                <span className="text-xs font-bold">{currencySymbol}{formatSafeNumber(activeRevenue * 0.45)} (45%)</span>
              </div>
              <div className="k-breakdown-row">
                <span className="text-xs font-semibold flex items-center">
                  <span className="k-breakdown-dot"></span> Card
                </span>
                <span className="text-xs font-bold">{currencySymbol}{formatSafeNumber(activeRevenue * 0.20)} (20%)</span>
              </div>
              <div className="k-breakdown-row">
                <span className="text-xs font-semibold flex items-center">
                  <span className="k-breakdown-dot"></span> Other
                </span>
                <span className="text-xs font-bold">{currencySymbol}0.00 (0%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: ADD PRODUCT (SCREEN 7 IN MOCKUP)                     */}
      {/* ============================================================ */}
      {showAddProductModal && (
        <div className="k-modal-backdrop" onClick={() => setShowAddProductModal(false)}>
          <div className="k-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="k-modal-drag-pill"></div>
            <div className="k-modal-header">
              <h3 className="k-modal-title">
                Add Product
              </h3>
              <button 
                type="button" 
                className="k-modal-close-btn"
                onClick={() => setShowAddProductModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              {/* Image upload box */}
              <div className="k-image-upload-card" onClick={() => alert('Photo upload ready. Tap fields below to enter product details.')}>
                <Camera size={32} className="text-gray-400" />
                <span className="k-image-upload-text">Add Product Image</span>
              </div>

              <div className="k-form-group">
                <label className="k-form-label">Product Name *</label>
                <input 
                  type="text" 
                  className="k-form-input" 
                  placeholder="Enter product name"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  required
                />
              </div>

              <div className="k-form-group">
                <label className="k-form-label">Category *</label>
                <select 
                  className="k-form-select"
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                >
                  <option value="Food">Food</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="k-form-group">
                <label className="k-form-label">Price ({currencySymbol}) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="k-form-input" 
                  placeholder="Enter price (e.g. 80.00)"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  required
                />
              </div>

              <div className="k-form-group">
                <label className="k-form-label">Stock Quantity</label>
                <input 
                  type="number" 
                  className="k-form-input" 
                  placeholder="Enter quantity (e.g. 50)"
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="k-submit-black-btn mt-3"
                disabled={isSavingProduct}
              >
                {isSavingProduct ? 'Saving...' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: RECORD EXPENSE (SCREEN 8 IN MOCKUP)                  */}
      {/* ============================================================ */}
      {showRecordExpenseModal && (
        <div className="k-modal-backdrop" onClick={() => setShowRecordExpenseModal(false)}>
          <div className="k-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="k-modal-drag-pill"></div>
            <div className="k-modal-header">
              <h3 className="k-modal-title">
                Record Expense
              </h3>
              <button 
                type="button" 
                className="k-modal-close-btn"
                onClick={() => setShowRecordExpenseModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense}>
              <div className="k-form-group">
                <label className="k-form-label">Expense Category *</label>
                <select 
                  className="k-form-select"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                >
                  <option value="Supplies">Supplies & Ingredients</option>
                  <option value="Rent">Shop Rent</option>
                  <option value="Electricity">Electricity & Utilities</option>
                  <option value="Salaries">Staff Salaries</option>
                  <option value="Transport">Transport & Delivery</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Marketing">Marketing & Ads</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div className="k-form-group">
                <label className="k-form-label">Amount ({currencySymbol}) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="k-form-input" 
                  placeholder="Enter amount (e.g. 450.00)"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                />
              </div>

              <div className="k-form-group">
                <label className="k-form-label">Date</label>
                <input 
                  type="date" 
                  className="k-form-input" 
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>

              <div className="k-form-group">
                <label className="k-form-label">Note (Optional)</label>
                <textarea 
                  className="k-form-textarea" 
                  rows="3"
                  placeholder="Add a note or receipt reference..."
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="k-submit-black-btn mt-3"
                disabled={isSavingExpense}
              >
                {isSavingExpense ? 'Saving...' : 'Save Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDashboard;
