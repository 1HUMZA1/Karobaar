import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import { format, subDays, startOfDay } from 'date-fns';
import { QuickActions, KPIBar, SalesGoalWidget } from '../../components/Dashboard/DashboardKPIs';
import { RevenueAnalytics, ProfitCenter, TopProducts } from '../../components/Dashboard/DashboardAnalytics';
import { InventoryHealth, CustomerInsights, TeamAttendance, ExpenseOverview } from '../../components/Dashboard/DashboardOperations';
import { TransactionFeed, SmartAlerts } from '../../components/Dashboard/DashboardFeed';
import { CustomizeDashboardModal } from '../../components/Dashboard/CustomizeDashboardModal';
import { Button } from '../../components/ui/Button';
import { RefreshCw, LayoutTemplate } from 'lucide-react';
import './Dashboard.css';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const { theme, userRole, currentUser, currentBusiness } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [layout, setLayout] = useState({
    showKPIs: true,
    showAnalytics: true,
    showTransactions: true,
    showInventory: true,
    showCustomers: true,
    showAttendance: true,
    showExpenses: true
  });
  
  // Master State
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState({ labels: [], revenueData: [], expenseData: [] });
  const [topProducts, setTopProducts] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      loadDashboardData(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId]);

  const loadDashboardData = async (businessId) => {
    setLoading(true);
    try {
      const [sales, exp, purchases, customers, products, attendance] = await Promise.all([
        db.getCollection('sales', businessId),
        db.getCollection('expenses', businessId),
        db.getCollection('purchases', businessId),
        db.getCollection('customers', businessId),
        db.getCollection('products', businessId),
        db.getCollection('attendance', businessId).catch(() => [])
      ]);

      const today = startOfDay(new Date());
      const yesterday = startOfDay(subDays(today, 1));
      
      let todayRev = 0, yesterdayRev = 0, todayOrd = 0, yesterdayOrd = 0;
      let pendingReceivables = 0, pendingPayables = 0, todayExp = 0;
      
      const productSales = {};

      sales.forEach(s => {
        const saleDate = startOfDay(new Date(s.date));
        if (saleDate.getTime() === today.getTime()) { todayRev += (s.total || 0); todayOrd++; } 
        else if (saleDate.getTime() === yesterday.getTime()) { yesterdayRev += (s.total || 0); yesterdayOrd++; }
        
        if (s.status === 'Pending' || s.paymentStatus === 'Unpaid' || s.balanceDue > 0) {
          pendingReceivables += (s.balanceDue || s.total || 0);
        }

        // Aggregate product sales
        (s.items || []).forEach(item => {
          if (!productSales[item.id]) productSales[item.id] = { id: item.id, name: item.name, soldCount: 0, revenue: 0 };
          productSales[item.id].soldCount += (item.quantity || 1);
          productSales[item.id].revenue += ((item.price * item.quantity) || 0);
        });
      });

      exp.forEach(e => {
        const expDate = startOfDay(new Date(e.date));
        if (expDate.getTime() === today.getTime()) todayExp += (e.amount || 0);
      });

      purchases.forEach(p => {
        if (p.status === 'Pending' || p.paymentStatus === 'Unpaid' || p.balanceDue > 0) {
          pendingPayables += (p.balanceDue || p.totalAmount || 0);
        }
      });

      const lowStockList = products.filter(p => (p.stockQuantity || 0) <= (p.minimumStock || 5));
      const todayAttendance = attendance.filter(a => startOfDay(new Date(a.date)).getTime() === today.getTime() && a.status === 'Present');

      // Top Products
      const topProdArray = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(p => {
          const invProd = products.find(x => x.id === p.id);
          return { ...p, stockQuantity: invProd ? invProd.stockQuantity : 0 };
        });

      // Recent Customers
      const recentCust = [...customers].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

      // Transactions
      const formattedSales = sales.map(s => ({ ...s, type: 'Sale', amount: s.total, time: new Date(s.date) }));
      const formattedExp = exp.map(e => ({ ...e, type: 'Expense', amount: e.amount, time: new Date(e.date) }));
      const recentTrx = [...formattedSales, ...formattedExp].sort((a, b) => b.time - a.time).slice(0, 10);

      // Smart Alerts
      const generatedAlerts = [];
      if (lowStockList.length > 0) generatedAlerts.push({ title: 'Low Stock Items', description: `${lowStockList.length} products require restocking.`, link: '/inventory' });
      if (pendingReceivables > 0) generatedAlerts.push({ title: 'Pending Receivables', description: `${currencySymbol}${pendingReceivables.toFixed(2)} is outstanding from customers.`, link: '/orders' });
      if (pendingPayables > 0) generatedAlerts.push({ title: 'Pending Payables', description: `${currencySymbol}${pendingPayables.toFixed(2)} needs to be paid to suppliers.`, link: '/purchases' });

      setStats({
        todayRevenue: todayRev, yesterdayRevenue: yesterdayRev,
        todayOrders: todayOrd, yesterdayOrders: yesterdayOrd,
        todayExpenses: todayExp, todayProfit: todayRev - todayExp,
        totalCustomers: customers.length, totalEmployees: 12, // Mock total employees for now
        lowStockCount: lowStockList.length, lowStockProducts: lowStockList.slice(0, 5),
        receivables: pendingReceivables, payables: pendingPayables,
        employeesPresent: todayAttendance.length
      });
      
      setTopProducts(topProdArray);
      setRecentCustomers(recentCust);
      setTransactions(recentTrx);
      setExpenses(exp.filter(e => startOfDay(new Date(e.date)).getTime() === today.getTime()));
      setAlerts(generatedAlerts);

      // Chart Data
      const labels = []; const revData = []; const expData = [];
      for (let i = 6; i >= 0; i--) {
        const d = startOfDay(subDays(today, i));
        labels.push(format(d, 'EEE'));
        revData.push(sales.filter(s => startOfDay(new Date(s.date)).getTime() === d.getTime()).reduce((sum, s) => sum + (s.total || 0), 0));
        expData.push(exp.filter(e => startOfDay(new Date(e.date)).getTime() === d.getTime()).reduce((sum, e) => sum + (e.amount || 0), 0));
      }
      setChartData({ labels, revenueData: revData, expenseData: expData });

    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (today, yesterday) => {
    if (yesterday === 0) return today > 0 ? { value: 100, isPositive: true } : { value: 0, isPositive: true };
    const diff = today - yesterday;
    return { value: Math.abs((diff / yesterday) * 100).toFixed(1), isPositive: diff >= 0 };
  };

  const revTrend = calculateTrend(stats.todayRevenue, stats.yesterdayRevenue);
  const ordTrend = calculateTrend(stats.todayOrders, stats.yesterdayOrders);

  const chartObj = {
    labels: chartData.labels,
    datasets: [
      { label: 'Revenue', data: chartData.revenueData, borderColor: theme === 'dark' ? '#ffffff' : '#000000', backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', fill: true, tension: 0.4 },
      { label: 'Expenses', data: chartData.expenseData, borderColor: theme === 'dark' ? '#737373' : '#888888', borderDash: [5, 5], fill: false, tension: 0.4 }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: theme === 'dark' ? '#94a3b8' : '#64748b' } },
      y: { grid: { color: theme === 'dark' ? '#334155' : '#e2e8f0', drawBorder: false }, ticks: { color: theme === 'dark' ? '#94a3b8' : '#64748b' } }
    }
  };

  // Health Score Calculation
  const healthScore = Math.min(100, Math.max(0, 
    70 + (revTrend.isPositive ? 10 : -10) + (stats.lowStockCount === 0 ? 10 : -5) + (stats.receivables === 0 ? 10 : -5)
  ));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        <p className="text-text-muted animate-pulse">Syncing business command center...</p>
      </div>
    );
  }

  // Role Based Visibility
  const showFinance = ['Owner', 'Admin', 'Manager', 'Accountant', 'OWNER'].includes(userRole);
  const showInventory = ['Owner', 'Admin', 'Manager', 'Warehouse', 'OWNER'].includes(userRole);
  const showHR = ['Owner', 'Admin', 'Manager', 'HR', 'OWNER'].includes(userRole);

  return (
    <div className="page-container max-w-[1600px] mx-auto animate-fade-in pb-12">
      
      {/* Welcome Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <p className="text-text-secondary font-medium tracking-wide uppercase text-sm mb-1">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Good Morning, {currentUser?.name?.split(' ')[0] || userRole} 👋</h1>
          <p className="text-text-secondary mt-1">Here is what's happening with <strong className="text-text-main">{currentBusiness?.businessName || 'your business'}</strong> today.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[var(--bg-card)] px-4 py-2 rounded-xl shadow-sm border border-border-color">
          <div className="text-right">
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Business Health</p>
            <div className="flex items-center justify-end gap-2">
              <div className="w-24 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${healthScore}%` }}></div>
              </div>
              <span className="font-bold text-success text-sm">{healthScore}%</span>
            </div>
          </div>
          <div className="w-px h-8 bg-border-color"></div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => loadDashboardData(currentUser.activeBusinessId)} title="Refresh Data"><RefreshCw size={16}/></Button>
            <Button variant="outline" size="sm" title="Customize Dashboard" onClick={() => setIsCustomizeModalOpen(true)}><LayoutTemplate size={16}/></Button>
          </div>
        </div>
      </div>

      <QuickActions />

      {layout.showKPIs && (
        <KPIBar stats={stats} trends={{revTrend, ordTrend}} currencySymbol={currencySymbol} />
      )}

      {layout.showAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <RevenueAnalytics chartObj={chartObj} chartOptions={chartOptions} />
          </div>
          <div className="flex flex-col gap-6">
            <SalesGoalWidget currentSales={stats.todayRevenue} target={100000} currencySymbol={currencySymbol} />
            {showFinance && <ProfitCenter stats={stats} currencySymbol={currencySymbol} />}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {layout.showTransactions && <TransactionFeed transactions={transactions} currencySymbol={currencySymbol} />}
        {showInventory && layout.showInventory && <InventoryHealth lowStockProducts={stats.lowStockProducts} />}
        {layout.showCustomers && <CustomerInsights totalCustomers={stats.totalCustomers} recentCustomers={recentCustomers} />}
        <div className="flex flex-col gap-6">
          <SmartAlerts alerts={alerts} />
          {showHR && layout.showAttendance && currentBusiness?.modules?.attendance && (
            <TeamAttendance totalEmployees={stats.totalEmployees} presentCount={stats.employeesPresent} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {layout.showAnalytics && <TopProducts topProducts={topProducts} currencySymbol={currencySymbol} />}
        </div>
        {showFinance && layout.showExpenses && (
          <div>
            <ExpenseOverview expenses={expenses} currencySymbol={currencySymbol} />
          </div>
        )}
      </div>

      <CustomizeDashboardModal 
        isOpen={isCustomizeModalOpen} 
        onClose={() => setIsCustomizeModalOpen(false)} 
        layout={layout} 
        onSave={(newLayout) => setLayout(newLayout)} 
      />
    </div>
  );
};

export default Dashboard;
