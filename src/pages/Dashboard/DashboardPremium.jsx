import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/databaseService';
import { localDb } from '../../services/localDb';
import { initializeDemoData } from '../../services/demoData';
import { useAppContext } from '../../context/AppContext';
import { format, subDays, startOfDay } from 'date-fns';
import { DashboardKPIs } from '../../components/Dashboard/DashboardKPIs';
import { DashboardAnalytics } from '../../components/Dashboard/DashboardAnalytics';
import { DashboardOperations } from '../../components/Dashboard/DashboardOperations';
import { DashboardFeed } from '../../components/Dashboard/DashboardFeed';
import { GettingStartedGuide } from '../../components/Dashboard/GettingStartedGuide';
import { Button } from '../../components/ui/Button';
import { RefreshCw, Zap, Package, Users, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileDashboard } from './MobileDashboard';
import './DashboardPremium.css';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const Dashboard = ({ onSwitchMode }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { userRole, currentUser, currentBusiness } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Master State with defaults
  const [stats, setStats] = useState({
    todayRevenue: 0, yesterdayRevenue: 0, todayOrders: 0, yesterdayOrders: 0,
    todayExpenses: 0, yesterdayExpenses: 0, todayProfit: 0, yesterdayProfit: 0,
    totalCustomers: 0, lowStockCount: 0, receivables: 0
  });
  const [chartData, setChartData] = useState({ labels: [], revenueData: [], expenseData: [], profitData: [] });
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  // Role Based Visibility
  const showFinance = ['OWNER', 'MANAGER', 'ACCOUNTANT'].includes(userRole);
  const showInventory = ['OWNER', 'MANAGER', 'INVENTORY'].includes(userRole);
  const showHR = ['OWNER', 'MANAGER'].includes(userRole);

  const calculateAndSetData = useCallback((sales, exp, purchases, customers, products, attendance) => {
    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(today, 1));
    
    let todayRev = 0, yesterdayRev = 0, todayOrd = 0, yesterdayOrd = 0;
    let todayExp = 0, yesterdayExp = 0;
    let pendingReceivables = 0;
    
    sales.forEach(s => {
      const saleDate = startOfDay(new Date(s.date));
      if (saleDate.getTime() === today.getTime()) { todayRev += (s.total || 0); todayOrd++; } 
      else if (saleDate.getTime() === yesterday.getTime()) { yesterdayRev += (s.total || 0); yesterdayOrd++; }
      
      if (s.status === 'Pending' || s.paymentStatus === 'Unpaid' || s.balanceDue > 0) {
        pendingReceivables += (s.balanceDue || s.total || 0);
      }
    });

    exp.forEach(e => {
      const expDate = startOfDay(new Date(e.date));
      if (expDate.getTime() === today.getTime()) todayExp += (e.amount || 0);
      else if (expDate.getTime() === yesterday.getTime()) yesterdayExp += (e.amount || 0);
    });

    const todayProfit = todayRev - todayExp;
    const yesterdayProfit = yesterdayRev - yesterdayExp;

    const lowStockList = products.filter(p => (p.stockQuantity || 0) <= (p.minimumStock || 5));

    // Recent Orders (Sales)
    const recentOrd = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    
    // Transactions (Activity Feed)
    const formattedSales = sales.map(s => ({ ...s, type: 'Sale', amount: s.total, time: new Date(s.date) }));
    const formattedExp = exp.map(e => ({ ...e, type: 'Expense', amount: e.amount, time: new Date(e.date) }));
    const formattedProd = products.map(p => ({ id: p.id, type: 'Product Added', name: p.name, time: new Date(p.createdAt || Date.now()) }));
    
    let recentTrx = [...formattedSales, ...formattedExp, ...formattedProd].sort((a, b) => b.time - a.time).slice(0, 10);
    if (!showFinance) recentTrx = recentTrx.filter(t => t.type !== 'Expense'); 

    // Smart Alerts (Action Items)
    const generatedAlerts = [];
    if (showInventory && lowStockList.length > 0) generatedAlerts.push({ id: 'stock', title: 'Low Stock Products', description: `${lowStockList.length} products require restocking.`, link: '/inventory' });
    if (showFinance && pendingReceivables > 0) generatedAlerts.push({ id: 'recv', title: 'Pending Invoices', description: `${currencySymbol}${pendingReceivables.toFixed(2)} outstanding from customers.`, link: '/orders' });
    
    setStats({
      todayRevenue: todayRev, yesterdayRevenue: yesterdayRev,
      todayOrders: todayOrd, yesterdayOrders: yesterdayOrd,
      todayExpenses: todayExp, yesterdayExpenses: yesterdayExp,
      todayProfit: todayProfit, yesterdayProfit: yesterdayProfit,
      totalCustomers: customers.length, 
      lowStockCount: lowStockList.length, 
      receivables: pendingReceivables
    });
    
    setRecentCustomers([...customers].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5));
    setRecentOrders(recentOrd);
    setLowStockProducts(lowStockList.slice(0, 5));
    setTransactions(recentTrx);
    setAlerts(generatedAlerts);

    // Chart Data
    const labels = []; const revData = []; const expData = []; const profData = [];
    // Plot from 7 days ago down to yesterday (i=1), so we only show fully completed days (decided at midnight)
    for (let i = 7; i >= 1; i--) {
      const d = startOfDay(subDays(today, i));
      labels.push(format(d, 'MMM dd'));
      const dayRev = sales.filter(s => startOfDay(new Date(s.date)).getTime() === d.getTime()).reduce((sum, s) => sum + (s.total || 0), 0);
      const dayExp = exp.filter(e => startOfDay(new Date(e.date)).getTime() === d.getTime()).reduce((sum, e) => sum + (e.amount || 0), 0);
      
      revData.push(dayRev);
      expData.push(dayExp);
      profData.push(dayRev - dayExp);
    }
    setChartData({ labels, revenueData: revData, expenseData: expData, profitData: profData });
  }, [showFinance, showInventory, currencySymbol]);

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      // 1. Instantly populate UI from local cache
      try {
        const cachedSales = localDb.getAll('sales', currentUser.activeBusinessId) || [];
        const cachedExp = localDb.getAll('expenses', currentUser.activeBusinessId) || [];
        const cachedPurchases = localDb.getAll('purchases', currentUser.activeBusinessId) || [];
        const cachedCustomers = localDb.getAll('customers', currentUser.activeBusinessId) || [];
        const cachedProducts = localDb.getAll('products', currentUser.activeBusinessId) || [];
        const cachedAttendance = localDb.getAll('attendance', currentUser.activeBusinessId) || [];
        
        calculateAndSetData(cachedSales, cachedExp, cachedPurchases, cachedCustomers, cachedProducts, cachedAttendance);
      } catch (e) {
        // Ignore cache miss
      }

      // 2. Fetch fresh data in background
      loadDashboardData(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId, calculateAndSetData]);

  const loadDashboardData = async (businessId) => {
    setIsRefreshing(true);
    try {
      if (businessId === 'demo-business-1') {
        const prodCheck = await db.getCollection('products', businessId);
        if (!prodCheck || prodCheck.length === 0) {
          await initializeDemoData(businessId);
        }
      }

      // Fetch in parallel
      const [sales, exp, purchases, customers, products, attendance] = await Promise.all([
        db.getCollection('sales', businessId),
        db.getCollection('expenses', businessId),
        db.getCollection('purchases', businessId),
        db.getCollection('customers', businessId),
        db.getCollection('products', businessId),
        db.getCollection('attendance', businessId).catch(() => [])
      ]);

      calculateAndSetData(sales, exp, purchases, customers, products, attendance);
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const fullGreetingText = `${getGreeting()}, ${currentBusiness?.name || 'Business'}`;
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

  const calculateTrend = (today, yesterday) => {
    if (yesterday === 0) return today > 0 ? { value: 100, isPositive: true } : { value: 0, isPositive: true };
    const diff = today - yesterday;
    return { value: Math.abs((diff / yesterday) * 100).toFixed(1), isPositive: diff >= 0 };
  };

  const trends = {
    revTrend: calculateTrend(stats.todayRevenue, stats.yesterdayRevenue),
    ordTrend: calculateTrend(stats.todayOrders, stats.yesterdayOrders),
    profTrend: calculateTrend(stats.todayProfit, stats.yesterdayProfit),
    expTrend: calculateTrend(stats.todayExpenses, stats.yesterdayExpenses)
  };

  const healthScore = Math.min(100, Math.max(0, 
    75 + (trends.revTrend.isPositive ? 10 : -5) + (stats.lowStockCount === 0 ? 10 : -5) + (stats.todayProfit > 0 ? 10 : -10)
  ));
  
  let healthLabel = 'Average';
  if (healthScore >= 90) healthLabel = 'Excellent';
  else if (healthScore >= 70) healthLabel = 'Good';
  else if (healthScore < 50) healthLabel = 'Needs Attention';

  const maskedStats = showFinance ? stats : {
    ...stats,
    todayRevenue: '***', yesterdayRevenue: '***',
    todayProfit: '***', yesterdayProfit: '***',
    todayExpenses: '***', yesterdayExpenses: '***',
  };

  if (isMobile) {
    return (
      <MobileDashboard 
        currentUser={currentUser}
        currentBusiness={currentBusiness}
        stats={maskedStats}
        trends={trends}
        currencySymbol={currencySymbol}
        chartData={chartData}
        recentOrders={recentOrders}
        lowStockProducts={lowStockProducts}
        healthScore={healthScore}
        healthLabel={healthLabel}
        onRefresh={() => loadDashboardData(currentUser?.activeBusinessId)}
        isRefreshing={isRefreshing}
      />
    );
  }

  return (
    <div className="dashboard-container max-w-[1600px] mx-auto hidden-mobile">
      
      {/* 1. Header Area - Strictly Left-Aligned Greeting with Right-Aligned Executive Health Dock */}
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <p className="text-text-muted font-bold tracking-wide text-xs mb-2 text-left">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-text-main flex items-center text-left">
            {greetingTyped}
            {greetingTyped.length === fullGreetingText.length ? (
              <span className="ml-2">👋</span>
            ) : (
              <span className="ml-1 animate-pulse border-r-4 border-text-main h-[0.8em] inline-block align-baseline"></span>
            )}
          </h1>
          <p className="text-text-secondary text-sm font-semibold text-left">Here's what's happening with your operations today.</p>
        </div>
        
        <div className="dashboard-header-actions">
          <div className="executive-health-dock flex items-center gap-3 bg-[var(--bg-card)] px-4 py-2.5 rounded-2xl border border-[var(--border-color)] shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="absolute w-4 h-4 rounded-full bg-emerald-400/30 animate-ping"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold leading-none mb-1">Business Health</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-text-main leading-none">{healthScore}<span className="text-text-muted font-medium text-xs">/100</span></span>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full leading-none">{healthLabel}</span>
                </div>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-[var(--border-color)] mx-1"></div>

            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-hover)] hover:bg-[#09090b] text-text-secondary hover:text-[#ffffff] transition-all duration-200 text-xs font-bold"
              onClick={() => loadDashboardData(currentUser.activeBusinessId)}
              disabled={isRefreshing}
              title="Sync & Refresh Dashboard"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#09090b] text-[#ffffff] hover:bg-zinc-800 transition-all duration-200 text-xs font-bold"
              onClick={() => onSwitchMode && onSwitchMode('legacy')}
              title="Switch to Legacy Mode"
            >
              <Sparkles size={12} />
              <span>Legacy Mode ⚡</span>
            </button>
          </div>
        </div>
      </div>

      <GettingStartedGuide />

      {/* Operations Quick Command Dock */}
      <div className="operations-command-dock flex flex-wrap items-center justify-between gap-3 p-3.5 mb-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="uppercase tracking-wider">Register Live</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-text-secondary">
            <span className="text-text-muted">Shift:</span>
            <span className="font-bold text-text-main">Morning #1</span>
            <span className="text-text-muted">•</span>
            <span className="text-text-muted">Counter:</span>
            <span className="font-semibold text-text-main">Main Counter</span>
          </div>
        </div>

        {/* 1-Tap Quick Action Chips */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button 
            onClick={() => navigate('/pos')}
            className="cmd-primary-btn flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
            title="Open POS (F2)"
          >
            <Zap size={14} className="fill-current text-amber-400" />
            <span>New Sale</span>
            <kbd className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold ml-1">F2</kbd>
          </button>
          
          <button 
            onClick={() => navigate('/products')}
            className="cmd-ghost-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Package size={13} className="text-text-secondary" />
            <span>+ Product</span>
          </button>

          <button 
            onClick={() => navigate('/customers')}
            className="cmd-ghost-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Users size={13} className="text-text-secondary" />
            <span>+ Customer</span>
          </button>

          <button 
            onClick={() => navigate('/expenses')}
            className="cmd-ghost-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Receipt size={13} className="text-text-secondary" />
            <span>+ Expense</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <DashboardKPIs stats={maskedStats} trends={trends} currencySymbol={currencySymbol} />

      {/* 3. Analytics & Quick Actions (Hide analytics chart if not finance) */}
      {showFinance ? (
        <DashboardAnalytics chartData={chartData} currencySymbol={currencySymbol} stats={maskedStats} trends={trends} />
      ) : (
        <DashboardAnalytics chartData={{ labels: [], revenueData: [], expenseData: [], profitData: [] }} currencySymbol={currencySymbol} stats={maskedStats} trends={trends} />
      )}

      {/* 4. Operations (Recent Orders & Inventory) */}
      <DashboardOperations 
        recentOrders={recentOrders} 
        lowStockProducts={showInventory ? lowStockProducts : []} 
        currencySymbol={currencySymbol} 
      />

      {/* 5. Feed (Action Items & Recent Activity) */}
      <DashboardFeed 
        alerts={alerts} 
        transactions={transactions} 
        currencySymbol={currencySymbol} 
      />

    </div>
  );
};

export default Dashboard;
