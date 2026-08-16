import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/databaseService';
import { localDb } from '../../services/localDb';
import { useAppContext } from '../../context/AppContext';
import { format, subDays, startOfDay } from 'date-fns';
import { DashboardKPIs } from '../../components/Dashboard/DashboardKPIs';
import { DashboardAnalytics } from '../../components/Dashboard/DashboardAnalytics';
import { DashboardOperations } from '../../components/Dashboard/DashboardOperations';
import { DashboardFeed } from '../../components/Dashboard/DashboardFeed';
import { GettingStartedGuide } from '../../components/Dashboard/GettingStartedGuide';
import { Button } from '../../components/ui/Button';
import { RefreshCw } from 'lucide-react';
import './DashboardPremium.css';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
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
  const showFinance = ['Owner', 'Admin', 'Manager', 'Accountant', 'OWNER'].includes(userRole);
  const showInventory = ['Owner', 'Admin', 'Manager', 'Warehouse', 'OWNER'].includes(userRole);
  const showHR = ['Owner', 'Admin', 'Manager', 'HR', 'OWNER'].includes(userRole);

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
    for (let i = 6; i >= 0; i--) {
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

  // Mask sensitive data for non-finance users
  const maskedStats = showFinance ? stats : {
    ...stats,
    todayRevenue: '***', yesterdayRevenue: '***',
    todayProfit: '***', yesterdayProfit: '***',
    todayExpenses: '***', yesterdayExpenses: '***',
  };

  return (
    <div className="dashboard-container max-w-[1600px] mx-auto animate-fade-in pb-12 px-6 pt-6">
      
      {/* 1. Header Area */}
      <div className="dashboard-header flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <p className="text-text-muted font-medium tracking-wide text-xs mb-2">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
          <h1 className="text-3xl font-bold tracking-tight mb-1 text-text-main">
            {getGreeting()}, {currentUser?.name?.split(' ')[0] || userRole} 👋
          </h1>
          <p className="text-text-secondary text-sm">Here's what's happening with <strong className="text-text-main">{currentBusiness?.businessName || 'your business'}</strong> today.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="business-health-widget bg-[var(--bg-card)] px-4 py-2.5 rounded-xl border border-[var(--border-color)] flex flex-col items-end shadow-sm">
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1">Business Health</span>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${healthScore >= 70 ? 'text-success' : 'text-warning'}`}>
                {healthScore} <span className="text-text-muted font-normal text-xs">/ 100</span>
              </span>
              <span className="text-xs text-text-secondary font-medium bg-[var(--bg-hover)] px-2 py-0.5 rounded-md">{healthLabel}</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-[52px] px-4 bg-[var(--bg-card)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-text-secondary shadow-sm relative overflow-hidden"
            onClick={() => loadDashboardData(currentUser.activeBusinessId)}
            disabled={isRefreshing}
          >
            <div className="flex flex-col items-center gap-1">
              <RefreshCw size={14} className={`text-text-main ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-[9px] uppercase tracking-wider">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </div>
          </Button>
        </div>
      </div>

      <GettingStartedGuide />

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
