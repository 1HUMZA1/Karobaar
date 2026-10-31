import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../services/databaseService';
import { localDb } from '../../services/localDb';
import { initializeDemoData } from '../../services/demoData';
import { useAppContext } from '../../context/AppContext';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { DashboardKPIs } from '../../components/Dashboard/DashboardKPIs';
import { DashboardAnalytics } from '../../components/Dashboard/DashboardAnalytics';
import { DashboardOperations } from '../../components/Dashboard/DashboardOperations';
import { DashboardFeed } from '../../components/Dashboard/DashboardFeed';
import { GettingStartedGuide } from '../../components/Dashboard/GettingStartedGuide';
import { RefreshCw, Zap, Package, Users, Receipt, Sparkles, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileDashboard } from './MobileDashboard';
import './DashboardPremium.css';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

import { BusinessHealthModal, LegacyModeConfirmModal } from '../../components/Dashboard/DashboardModals';

const DATE_RANGE_LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 Days',
  this_month: 'This Month',
  all_time: 'All Time',
  custom: 'Custom Range'
};

const Dashboard = ({ onSwitchMode }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { 
    userRole, 
    currentUser, 
    currentBusiness, 
    exitDemoWorkspace, 
    resetDemoWorkspace,
    requireAuthAndSetup
  } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  const [dateRange, setDateRange] = useState('today');

  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState(() => format(subDays(new Date(), 14), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // Modals state
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showLegacyConfirmModal, setShowLegacyConfirmModal] = useState(false);

  // Raw Database Collections Cached in Memory
  const [rawSales, setRawSales] = useState([]);
  const [rawExpenses, setRawExpenses] = useState([]);
  const [rawPurchases, setRawPurchases] = useState([]);
  const [rawCustomers, setRawCustomers] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [rawAttendance, setRawAttendance] = useState([]);

  // Robust multi-currency resolver
  const currencySymbol = useMemo(() => {
    const c = currentBusiness?.currency || currentBusiness?.settings?.currency || 'USD';
    const map = {
      'AED': 'AED ',
      'USD': '$',
      'INR': '₹',
      'PKR': 'Rs ',
      'EUR': '€',
      'GBP': '£',
      'SAR': 'SAR ',
      'CAD': 'CA$ ',
      'AUD': 'A$ ',
      'QAR': 'QAR ',
      'KWD': 'KWD ',
      'BHD': 'BHD ',
      'OMR': 'OMR ',
      'BDT': 'Tk ',
      'SGD': 'S$ ',
      'MYR': 'RM ',
      'PHP': '₱',
      'TRY': '₺',
      'JPY': '¥',
      'CNY': '¥'
    };
    if (map[c]) return map[c];
    if (c === '$' || c === '₹' || c === '€' || c === '£') return c;
    return c.length <= 4 ? `${c} ` : '$';
  }, [currentBusiness]);

  // Demo Mode detection
  const isDemoMode = Boolean(
    currentBusiness?.isDemo || 
    currentBusiness?.id === 'karobaar-demo-store' || 
    currentUser?.isDemo ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('karobaar_is_demo_mode') === 'true')
  );

  // Role Based Visibility (Normalized to handle both TitleCase 'Owner' and uppercase 'OWNER')
  const normRole = (userRole || 'Owner').toUpperCase();
  const showFinance = isDemoMode || ['OWNER', 'MANAGER', 'ACCOUNTANT', 'ADMIN'].includes(normRole);
  const showInventory = isDemoMode || ['OWNER', 'MANAGER', 'INVENTORY', 'STAFF', 'ADMIN'].includes(normRole);
  const showHR = isDemoMode || ['OWNER', 'MANAGER', 'ADMIN'].includes(normRole);

  // Compute intervals for current and previous comparison window
  const dateIntervals = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    let currentStart = todayStart;
    let currentEnd = todayEnd;
    let prevStart = startOfDay(subDays(todayStart, 1));
    let prevEnd = endOfDay(subDays(todayStart, 1));

    switch (dateRange) {
      case 'yesterday':
        currentStart = startOfDay(subDays(todayStart, 1));
        currentEnd = endOfDay(subDays(todayStart, 1));
        prevStart = startOfDay(subDays(todayStart, 2));
        prevEnd = endOfDay(subDays(todayStart, 2));
        break;
      case '7d':
        currentStart = startOfDay(subDays(todayStart, 6));
        currentEnd = todayEnd;
        prevStart = startOfDay(subDays(todayStart, 13));
        prevEnd = endOfDay(subDays(todayStart, 7));
        break;
      case 'this_month':
        currentStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
        currentEnd = todayEnd;
        const daysIntoMonth = Math.max(1, Math.ceil((todayEnd - currentStart) / (1000 * 60 * 60 * 24)));
        const lastMonthStart = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        prevStart = lastMonthStart;
        prevEnd = endOfDay(new Date(lastMonthStart.getTime() + daysIntoMonth * 24 * 60 * 60 * 1000));
        break;
      case 'all_time':
        currentStart = new Date(0);
        currentEnd = todayEnd;
        prevStart = new Date(0);
        prevEnd = new Date(0);
        break;
      case 'custom':
        currentStart = startOfDay(new Date(customStartDate || subDays(now, 14)));
        currentEnd = endOfDay(new Date(customEndDate || now));
        const diffMs = Math.max(86400000, currentEnd.getTime() - currentStart.getTime());
        prevStart = new Date(currentStart.getTime() - diffMs);
        prevEnd = new Date(currentStart.getTime() - 1);
        break;
      case 'today':
      default:
        currentStart = todayStart;
        currentEnd = todayEnd;
        prevStart = startOfDay(subDays(todayStart, 1));
        prevEnd = endOfDay(subDays(todayStart, 1));
        break;
    }

    return { currentStart, currentEnd, prevStart, prevEnd };
  }, [dateRange, customStartDate, customEndDate]);

  // Comprehensive Metrics Calculation
  const computedMetrics = useMemo(() => {
    const now = new Date();
    const { currentStart, currentEnd, prevStart, prevEnd } = dateIntervals;

    const inCurrent = (rawDate) => {
      if (!rawDate) return false;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;
      return d >= currentStart && d <= currentEnd;
    };

    const inPrev = (rawDate) => {
      if (!rawDate) return false;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;
      return d >= prevStart && d <= prevEnd;
    };

    // Filtered Records
    const currentSales = rawSales.filter(s => inCurrent(s.date || s.createdAt));
    const prevSales = rawSales.filter(s => inPrev(s.date || s.createdAt));
    const currentExp = rawExpenses.filter(e => inCurrent(e.date || e.createdAt));
    const prevExp = rawExpenses.filter(e => inPrev(e.date || e.createdAt));

    // Revenue & Orders
    const currentRevenue = currentSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const prevRevenue = prevSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const currentOrders = currentSales.length;
    const prevOrders = prevSales.length;

    // Cost of Goods Sold (COGS)
    let cogs = 0;
    const prodMap = new Map(rawProducts.map(p => [p.id, p]));
    currentSales.forEach(s => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(it => {
          const p = prodMap.get(it.productId);
          const unitCost = Number(it.costPrice) || Number(it.purchasePrice) || Number(p?.purchasePrice) || (Number(it.price || 0) * 0.65) || 0;
          const safeCost = isNaN(unitCost) ? 0 : unitCost;
          cogs += safeCost * (Number(it.quantity) || 1);
        });
      } else {
        cogs += (Number(s.total) || 0) * 0.65;
      }
    });

    const grossProfit = isNaN(currentRevenue - cogs) ? 0 : Math.max(0, currentRevenue - cogs);
    const grossMargin = currentRevenue > 0 && !isNaN(grossProfit) ? ((grossProfit / currentRevenue) * 100).toFixed(1) : '0';

    const currentTotalExp = currentExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const prevTotalExp = prevExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const netProfit = grossProfit - currentTotalExp;
    const prevNetProfit = (prevRevenue * 0.35) - prevTotalExp;
    const netMargin = currentRevenue > 0 ? ((netProfit / currentRevenue) * 100).toFixed(1) : '0';

    // Payment Method Breakdown
    const paymentBreakdown = { cash: 0, upi: 0, card: 0, udhaar: 0 };
    currentSales.forEach(s => {
      const amt = Number(s.total) || 0;
      const m = (s.paymentMethod || 'Cash').toLowerCase();
      if (m.includes('upi')) paymentBreakdown.upi += amt;
      else if (m.includes('card')) paymentBreakdown.card += amt;
      else if (m.includes('udhaar') || m.includes('credit') || s.balanceDue > 0) paymentBreakdown.udhaar += amt;
      else paymentBreakdown.cash += amt;
    });

    // Receivables (Customer Udhaar)
    let pendingReceivables = 0;
    rawSales.forEach(s => {
      if (s.status === 'Pending' || s.paymentStatus === 'Unpaid' || s.balanceDue > 0) {
        pendingReceivables += (Number(s.balanceDue) || Number(s.total) || 0);
      }
    });

    // Low Stock Products
    const lowStockList = rawProducts.filter(p => (Number(p.stockQuantity) || 0) <= (Number(p.minimumStock) || 5));

    // Trend Percentage Helper
    const calcTrend = (cur, prev) => {
      if (prev === 0) return cur > 0 ? { value: '100', isPositive: true } : { value: '0', isPositive: true };
      const diff = cur - prev;
      return { value: Math.abs((diff / prev) * 100).toFixed(1), isPositive: diff >= 0 };
    };

    const trends = {
      revTrend: calcTrend(currentRevenue, prevRevenue),
      ordTrend: calcTrend(currentOrders, prevOrders),
      profTrend: calcTrend(netProfit, prevNetProfit),
      expTrend: calcTrend(currentTotalExp, prevTotalExp)
    };

    // Health Score (Calibrated accurately for fresh vs operational stores)
    let healthScore = 75;
    let healthLabel = 'Average';
    if (rawSales.length === 0 && rawProducts.length === 0) {
      healthScore = 50;
      healthLabel = 'Setup Pending';
    } else if (rawSales.length === 0) {
      healthScore = 65;
      healthLabel = 'Ready for Sales';
    } else {
      healthScore = Math.min(100, Math.max(0,
        70 + (trends.revTrend.isPositive ? 10 : -5) + (lowStockList.length === 0 ? 10 : -5) + (netProfit > 0 ? 10 : -10)
      ));
      if (healthScore >= 90) healthLabel = 'Excellent';
      else if (healthScore >= 70) healthLabel = 'Good';
      else if (healthScore < 50) healthLabel = 'Needs Attention';
    }

    // Recent Activity Feed
    const recentOrd = [...rawSales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    const formattedSales = rawSales.map(s => ({ ...s, type: 'Sale', amount: s.total, time: new Date(s.date || s.createdAt) }));
    const formattedExp = rawExpenses.map(e => ({ ...e, type: 'Expense', amount: e.amount, time: new Date(e.date || e.createdAt) }));
    const formattedProd = rawProducts.map(p => ({ id: p.id, type: 'Product Added', name: p.name, time: new Date(p.createdAt || Date.now()) }));
    let recentTrx = [...formattedSales, ...formattedExp, ...formattedProd].sort((a, b) => b.time - a.time).slice(0, 10);
    if (!showFinance) recentTrx = recentTrx.filter(t => t.type !== 'Expense');

    // Smart Alerts
    const alerts = [];
    if (showInventory && lowStockList.length > 0) {
      alerts.push({ id: 'stock', title: 'Low Stock Products', description: `${lowStockList.length} products require restocking.`, link: '/inventory' });
    }
    if (showFinance && pendingReceivables > 0) {
      alerts.push({ id: 'recv', title: 'Pending Customer Invoices', description: `${currencySymbol}${pendingReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })} outstanding on Khata.`, link: '/payments' });
    }

    // Dynamic Chart Data based on dateRange
    const chartLabels = [];
    const revData = [];
    const expData = [];
    const profData = [];

    if (dateRange === 'today' || dateRange === 'yesterday') {
      const targetDay = dateRange === 'today' ? startOfDay(now) : startOfDay(subDays(now, 1));
      const hours = [6, 10, 14, 18, 22];
      hours.forEach(h => {
        chartLabels.push(`${h}:00`);
        const slotStart = new Date(targetDay.getTime() + (h - 2) * 60 * 60 * 1000);
        const slotEnd = new Date(targetDay.getTime() + (h + 2) * 60 * 60 * 1000);
        const slotSales = rawSales.filter(s => {
          const t = new Date(s.date || s.createdAt).getTime();
          return t >= slotStart.getTime() && t < slotEnd.getTime();
        });
        const slotExp = rawExpenses.filter(e => {
          const t = new Date(e.date || e.createdAt).getTime();
          return t >= slotStart.getTime() && t < slotEnd.getTime();
        });
        const r = slotSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
        const ex = slotExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        revData.push(r);
        expData.push(ex);
        profData.push(r - ex);
      });
    } else {
      // 7-day or 30-day daily points
      const numDays = dateRange === '7d' ? 7 : dateRange === 'this_month' ? Math.min(30, now.getDate()) : 7;
      for (let i = numDays - 1; i >= 0; i--) {
        const d = startOfDay(subDays(now, i));
        chartLabels.push(format(d, 'MMM dd'));
        const daySales = rawSales.filter(s => startOfDay(new Date(s.date || s.createdAt)).getTime() === d.getTime());
        const dayExp = rawExpenses.filter(e => startOfDay(new Date(e.date || e.createdAt)).getTime() === d.getTime());
        const r = daySales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
        const ex = dayExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        revData.push(r);
        expData.push(ex);
        profData.push(r - ex);
      }
    }

    const chartData = {
      labels: chartLabels,
      revenueData: revData,
      expenseData: expData,
      profitData: profData
    };

    return {
      revenue: currentRevenue,
      todayRevenue: currentRevenue,
      ordersCount: currentOrders,
      todayOrders: currentOrders,
      grossProfit,
      grossMargin,
      netProfit,
      todayProfit: netProfit,
      netMargin,
      expenses: currentTotalExp,
      todayExpenses: currentTotalExp,
      paymentBreakdown,
      receivables: pendingReceivables,
      lowStockCount: lowStockList.length,
      totalCustomers: rawCustomers.length,
      trends,
      healthScore,
      healthLabel,
      recentOrders: recentOrd,
      lowStockProducts: lowStockList.slice(0, 5),
      transactions: recentTrx,
      alerts,
      chartData
    };
  }, [dateIntervals, dateRange, rawSales, rawExpenses, rawProducts, rawCustomers, showFinance, showInventory, currencySymbol]);

  // Load and cache all business data
  const loadDashboardData = useCallback(async (businessId) => {
    if (!businessId) return;
    setIsRefreshing(true);
    try {
      if (businessId === 'demo-business-1') {
        const prodCheck = await db.getCollection('products', businessId);
        if (!prodCheck || prodCheck.length === 0) {
          await initializeDemoData(businessId);
        }
      }

      const [sales, exp, purchases, customers, products, attendance] = await Promise.all([
        db.getCollection('sales', businessId),
        db.getCollection('expenses', businessId),
        db.getCollection('purchases', businessId),
        db.getCollection('customers', businessId),
        db.getCollection('products', businessId),
        db.getCollection('attendance', businessId).catch(() => [])
      ]);

      setRawSales(sales || []);
      setRawExpenses(exp || []);
      setRawPurchases(purchases || []);
      setRawCustomers(customers || []);
      setRawProducts(products || []);
      setRawAttendance(attendance || []);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load from localDb cache + background refresh
  useEffect(() => {
    const bizId = currentUser?.activeBusinessId || currentBusiness?.id;
    if (bizId) {
      try {
        setRawSales(localDb.getAll('sales', bizId) || []);
        setRawExpenses(localDb.getAll('expenses', bizId) || []);
        setRawPurchases(localDb.getAll('purchases', bizId) || []);
        setRawCustomers(localDb.getAll('customers', bizId) || []);
        setRawProducts(localDb.getAll('products', bizId) || []);
        setRawAttendance(localDb.getAll('attendance', bizId) || []);
      } catch (e) {}

      loadDashboardData(bizId);
    }
  }, [currentUser?.activeBusinessId, currentBusiness?.id, loadDashboardData]);

  // Real-time multi-device sync listener (Mobile <-> Tablet <-> Laptop)
  useEffect(() => {
    const handleSync = (e) => {
      const bizId = currentUser?.activeBusinessId || currentBusiness?.id;
      if (bizId && (!e?.detail?.businessId || e.detail.businessId === bizId)) {
        loadDashboardData(bizId);
      }
    };
    window.addEventListener('karobaar_data_synced', handleSync);
    window.addEventListener('karobaar_sync_update', handleSync);
    return () => {
      window.removeEventListener('karobaar_data_synced', handleSync);
      window.removeEventListener('karobaar_sync_update', handleSync);
    };
  }, [currentUser?.activeBusinessId, currentBusiness?.id, loadDashboardData]);

  const handleResetDemo = async () => {
    setIsResettingDemo(true);
    try {
      if (resetDemoWorkspace) {
        await resetDemoWorkspace();
      }
      const bizId = currentBusiness?.id || 'karobaar-demo-store';
      await loadDashboardData(bizId);
    } catch (e) {
      console.error('Reset demo error:', e);
    } finally {
      setTimeout(() => setIsResettingDemo(false), 500);
    }
  };

  const handleExitDemo = async () => {
    if (exitDemoWorkspace) {
      await exitDemoWorkspace();
    }
    navigate('/login');
  };

  // Greeting: Display actual Business Name (e.g. SAS KHALU) or Owner Name (e.g. 1_HUMZA_1)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getResolvedDisplayName = () => {
    if (isDemoMode) {
      return 'Karobaar Demo Store';
    }
    let name = currentBusiness?.name || currentBusiness?.businessName;
    if (!name || name === 'My Business' || name === 'Business') {
      try {
        const d = JSON.parse(localStorage.getItem('karobaar_setup_draft') || '{}');
        if (d.business?.name) name = d.business.name.trim();
        else if (d.personal?.fullName) name = d.personal.fullName.trim();
      } catch (_) {}
    }
    if (!name || name === 'My Business' || name === 'Business') {
      name = currentUser?.name || currentUser?.displayName;
    }
    return (name && name !== 'dev 1' && name !== 'Store Owner') ? name : (currentBusiness?.name || 'Partner');
  };

  const fullGreetingText = `${getGreeting()}, ${getResolvedDisplayName()}`;
  const [greetingTyped, setGreetingTyped] = useState('');

  useEffect(() => {
    const greetedKey = `hasGreeted_${currentBusiness?.id || 'default'}`;
    if (sessionStorage.getItem(greetedKey)) {
      setGreetingTyped(fullGreetingText);
      return;
    }

    let i = 0;
    setGreetingTyped('');
    const intervalId = setInterval(() => {
      setGreetingTyped(fullGreetingText.substring(0, i + 1));
      i++;
      if (i >= fullGreetingText.length) {
        clearInterval(intervalId);
        sessionStorage.setItem(greetedKey, 'true');
      }
    }, 70);

    return () => clearInterval(intervalId);
  }, [fullGreetingText, currentBusiness?.id]);

  const maskedStats = (showFinance || isDemoMode) ? computedMetrics : {
    ...computedMetrics,
    revenue: '***',
    todayRevenue: '***',
    netProfit: '***',
    todayProfit: '***',
    grossProfit: '***',
    expenses: '***',
    todayExpenses: '***',
  };

  if (isMobile) {
    return (
      <MobileDashboard 
        currentUser={currentUser}
        currentBusiness={currentBusiness}
        stats={maskedStats}
        trends={computedMetrics.trends}
        currencySymbol={currencySymbol}
        chartData={computedMetrics.chartData}
        recentOrders={computedMetrics.recentOrders}
        lowStockProducts={computedMetrics.lowStockProducts}
        healthScore={computedMetrics.healthScore}
        healthLabel={computedMetrics.healthLabel}
        onRefresh={() => loadDashboardData(currentUser?.activeBusinessId)}
        isRefreshing={isRefreshing}
      />
    );
  }

  return (
    <div className="dashboard-container max-w-[1600px] mx-auto hidden-mobile pb-28">
      
      {/* 0. Demo Mode Interactive Showcase Banner */}
      {isDemoMode && (
        <div className="demo-showcase-bar">
          <div className="demo-showcase-bar-left">
            <span className="demo-showcase-pill">
              <Sparkles size={13} /> DEMO WORKSPACE
            </span>
            <div className="demo-showcase-info">
              <strong>Karobaar Demo Preview:</strong> Sample retail store. To use live registers and features, first sign in and do setup.
            </div>
          </div>
          <div className="demo-showcase-bar-actions">
            <button
              type="button"
              className="demo-bar-btn demo-btn-reset"
              onClick={handleResetDemo}
              disabled={isResettingDemo}
              title="Reset sample sales and stock"
            >
              <RefreshCw size={13} className={isResettingDemo ? 'animate-spin' : ''} />
              <span>{isResettingDemo ? 'Resetting...' : 'Reset Demo Data'}</span>
            </button>
            <button
              type="button"
              className="demo-bar-btn demo-btn-create"
              onClick={() => navigate('/setup?new=true')}
              title="Create your real business"
            >
              <Zap size={13} />
              <span>Create Real Business</span>
            </button>
            <button
              type="button"
              className="demo-bar-btn demo-btn-exit"
              onClick={handleExitDemo}
              title="Exit demo"
            >
              Exit Demo
            </button>
          </div>
        </div>
      )}

      {/* 1. Header Area - Greeting + Executive Health Dock */}
      <div className="dashboard-header mb-3">
        <div className="dashboard-header-text">
          <p className="text-text-muted font-bold tracking-wide text-[11px] mb-1 text-left">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-1 text-text-main flex items-center flex-wrap text-left">
            <span>{greetingTyped}</span>
            {greetingTyped.length === fullGreetingText.length ? (
              <span className="ml-1.5 inline-block">👋</span>
            ) : (
              <span className="ml-1 animate-pulse border-r-4 border-text-main h-[0.8em] inline-block align-baseline"></span>
            )}
          </h1>
          <p className="text-text-secondary text-xs font-semibold text-left">Here's your live operational performance and financial status.</p>
        </div>
        
        <div className="dashboard-header-actions">
          <div className="executive-health-dock flex items-center gap-3 bg-[var(--bg-card)] px-4 py-2.5 rounded-2xl border border-[var(--border-color)] shadow-sm">
            <div 
              className="flex items-center gap-2.5 cursor-pointer hover:bg-[var(--bg-hover)] p-1.5 px-2 rounded-xl transition-colors"
              onClick={() => setShowHealthModal(true)}
              title="Click to view full Business Health Radar audit & improvement actions"
            >
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-main)]"></span>
                <span className="absolute w-4 h-4 rounded-full bg-[var(--text-main)]/20 animate-ping"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold leading-none mb-1">Business Health</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-text-main leading-none">{computedMetrics.healthScore}<span className="text-text-muted font-medium text-xs">/100</span></span>
                  <span className="text-[10px] font-bold bg-[var(--bg-hover)] text-text-main border border-[var(--border-color)] px-2 py-0.5 rounded-full leading-none">{computedMetrics.healthLabel}</span>
                </div>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-[var(--border-color)] mx-1"></div>

            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-hover)] hover:bg-[#09090b] text-text-secondary hover:text-[#ffffff] transition-all duration-200 text-xs font-bold"
              onClick={() => loadDashboardData(currentUser?.activeBusinessId)}
              disabled={isRefreshing}
              title="Sync & Refresh Dashboard"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#09090b] text-[#ffffff] hover:bg-zinc-800 transition-all duration-200 text-xs font-bold"
              onClick={() => {
                if (requireAuthAndSetup && requireAuthAndSetup('Legacy Operations Desk')) return;
                setShowLegacyConfirmModal(true);
              }}
              title="Switch to Legacy Operations Desk"
            >
              <Sparkles size={12} />
              <span>Legacy Mode ⚡</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date-Range Filter Pill Selector Bar */}
      <div className="flex flex-col gap-1.5 p-2 px-3 mb-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 px-2">
              <Calendar size={13} /> Filter Period:
            </span>
            <div className="flex items-center gap-1">
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7d', label: 'Last 7 Days' },
                { id: 'this_month', label: 'This Month' },
                { id: 'all_time', label: 'All Time' },
                { id: 'custom', label: 'Custom Range' }
              ].map(pill => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setDateRange(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    dateRange === pill.id
                      ? 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs font-semibold text-text-secondary px-2">
            Showing metrics for: <strong className="text-text-main">
              {dateRange === 'custom' 
                ? `${format(new Date(customStartDate), 'MMM dd, yyyy')} – ${format(new Date(customEndDate), 'MMM dd, yyyy')}`
                : DATE_RANGE_LABELS[dateRange]
              }
            </strong>
          </div>
        </div>

        {/* Custom Range Date Pickers */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-[var(--border-color)]">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-text-muted">Start Date:</span>
              <input 
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-hover)] text-text-main text-xs font-bold"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-text-muted">End Date:</span>
              <input 
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-hover)] text-text-main text-xs font-bold"
              />
            </div>
          </div>
        )}
      </div>

      <GettingStartedGuide />

      {/* Operations Quick Command Dock */}
      <div className="operations-command-dock flex flex-wrap items-center justify-between gap-2.5 p-2 px-3 mb-3.5 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-hover)] text-text-main border border-[var(--border-color)] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[var(--text-main)] animate-pulse"></span>
            <span className="uppercase tracking-wider">Register Live</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-text-secondary">
            <span className="text-text-muted">Shift:</span>
            <span className="font-bold text-text-main">
              {new Date().getHours() < 14 ? 'Morning Shift' : new Date().getHours() < 21 ? 'Evening Shift' : 'Night Shift'}
            </span>
            <span className="text-text-muted">•</span>
            <span className="text-text-muted">Register:</span>
            <span className="font-semibold text-text-main">
              {currentBusiness?.branchName || currentBusiness?.settings?.counterName || 'Main Counter'}
            </span>
          </div>
        </div>

        {/* 1-Tap Quick Action Chips */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button 
            onClick={() => {
              if (requireAuthAndSetup && requireAuthAndSetup('POS New Sale Register')) return;
              navigate('/pos');
            }}
            className="cmd-primary-btn flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
            title="Open POS (F2)"
          >
            <Zap size={14} className="fill-current text-text-main" />
            <span>New Sale</span>
            <kbd className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold ml-1">F2</kbd>
          </button>
          
          <button 
            onClick={() => {
              if (requireAuthAndSetup && requireAuthAndSetup('Products & Inventory')) return;
              navigate('/products');
            }}
            className="cmd-ghost-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Package size={13} className="text-text-secondary" />
            <span>+ Product</span>
          </button>

          <button 
            onClick={() => {
              if (requireAuthAndSetup && requireAuthAndSetup('Customers Khata')) return;
              navigate('/customers');
            }}
            className="cmd-ghost-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Users size={13} className="text-text-secondary" />
            <span>+ Customer</span>
          </button>

          <button 
            onClick={() => {
              if (requireAuthAndSetup && requireAuthAndSetup('Expenses & Cashflow')) return;
              navigate('/expenses');
            }}
            className="cmd-ghost-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Receipt size={13} className="text-text-secondary" />
            <span>+ Expense</span>
          </button>
        </div>
      </div>

      {/* 2. Enhanced Clickable KPI Cards */}
      <DashboardKPIs 
        stats={maskedStats} 
        trends={computedMetrics.trends} 
        currencySymbol={currencySymbol} 
        dateRangeLabel={dateRange === 'custom' ? `${format(new Date(customStartDate), 'MMM dd')} – ${format(new Date(customEndDate), 'MMM dd')}` : DATE_RANGE_LABELS[dateRange]}
        sales={rawSales}
        customers={rawCustomers}
        products={rawProducts}
      />

      {/* 3. Analytics & Quick Actions */}
      {showFinance ? (
        <DashboardAnalytics 
          chartData={computedMetrics.chartData} 
          currencySymbol={currencySymbol} 
          stats={maskedStats} 
          trends={computedMetrics.trends} 
          dateRange={dateRange} 
          onDateRangeChange={(newRange) => setDateRange(newRange)} 
        />
      ) : (
        <DashboardAnalytics 
          chartData={{ labels: [], revenueData: [], expenseData: [], profitData: [] }} 
          currencySymbol={currencySymbol} 
          stats={maskedStats} 
          trends={computedMetrics.trends} 
          dateRange={dateRange} 
          onDateRangeChange={(newRange) => setDateRange(newRange)} 
        />
      )}

      {/* 4. Operations (Recent Orders & Inventory) */}
      <DashboardOperations 
        recentOrders={computedMetrics.recentOrders} 
        lowStockProducts={showInventory ? computedMetrics.lowStockProducts : []} 
        currencySymbol={currencySymbol} 
      />

      {/* 5. Feed (Action Items & Recent Activity) */}
      <DashboardFeed 
        alerts={computedMetrics.alerts} 
        transactions={computedMetrics.transactions} 
        currencySymbol={currencySymbol} 
      />

      {/* Modals */}
      <BusinessHealthModal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        healthScore={computedMetrics.healthScore}
        healthLabel={computedMetrics.healthLabel}
        metrics={computedMetrics}
        currencySymbol={currencySymbol}
      />

      <LegacyModeConfirmModal
        isOpen={showLegacyConfirmModal}
        onClose={() => setShowLegacyConfirmModal(false)}
        onConfirm={() => onSwitchMode && onSwitchMode('legacy')}
      />

    </div>
  );
};

export default Dashboard;
