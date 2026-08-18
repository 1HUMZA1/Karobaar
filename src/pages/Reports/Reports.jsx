import React, { useState, useMemo } from 'react';
import { Download, TrendingUp, Users, Box, Banknote, Calendar, BarChart2, Briefcase, FileText, Loader2, ArrowUpRight, ArrowDownRight, PackageX, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import { format, subDays, startOfDay, parseISO, isSameDay } from 'date-fns';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement);

const Reports = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';
  
  const [activeTab, setActiveTab] = useState('sales'); // sales, profit, products, customers, inventory, exports
  const [exporting, setExporting] = useState(null);

  // Fetch all required data for analytics
  const { data: sales = [] } = useCollection('sales', currentUser?.activeBusinessId);
  const { data: expenses = [] } = useCollection('expenses', currentUser?.activeBusinessId);
  const { data: products = [] } = useCollection('products', currentUser?.activeBusinessId);
  const { data: customers = [] } = useCollection('customers', currentUser?.activeBusinessId);
  
  // Valid Sales (Not cancelled/refunded)
  const validSales = useMemo(() => sales.filter(s => s.status !== 'cancelled' && s.status !== 'Refunded' && s.status !== 'Cancelled'), [sales]);

  // --- ALGORITHMS & METRICS ---

  // 1. Sales & Revenue Metrics
  const { totalRevenue, averageOrderValue, salesByDayChart, revenueGrowth } = useMemo(() => {
    let total = 0;
    const last30Days = Array.from({length: 30}, (_, i) => {
      const d = startOfDay(subDays(new Date(), 29 - i));
      return { date: d, label: format(d, 'MMM dd'), amount: 0 };
    });

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    
    let currentMonthRev = 0;
    let lastMonthRev = 0;

    validSales.forEach(s => {
      const amt = s.amountPaid || s.total || 0;
      total += amt;
      
      const sDate = new Date(s.date);
      // Group by day for chart
      const chartDay = last30Days.find(d => isSameDay(d.date, sDate));
      if (chartDay) chartDay.amount += amt;

      // Group by month for growth
      if (sDate.getTime() >= currentMonthStart) currentMonthRev += amt;
      else if (sDate.getTime() >= lastMonthStart && sDate.getTime() < currentMonthStart) lastMonthRev += amt;
    });

    const aov = validSales.length > 0 ? total / validSales.length : 0;
    let growth = 0;
    if (lastMonthRev > 0) growth = ((currentMonthRev - lastMonthRev) / lastMonthRev) * 100;
    else if (currentMonthRev > 0) growth = 100;

    const chartData = {
      labels: last30Days.map(d => d.label),
      datasets: [{
        label: 'Daily Revenue',
        data: last30Days.map(d => d.amount),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    return { totalRevenue: total, averageOrderValue: aov, salesByDayChart: chartData, revenueGrowth: growth };
  }, [validSales]);

  // 2. Profit Metrics
  const { totalExpenses, netProfit, profitMargin, profitChart } = useMemo(() => {
    const totalExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const profit = totalRevenue - totalExp;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    const chartData = {
      labels: ['Revenue', 'Expenses', 'Net Profit'],
      datasets: [{
        label: 'Amount',
        data: [totalRevenue, totalExp, profit],
        backgroundColor: ['#10b981', '#ef4444', profit >= 0 ? '#3b82f6' : '#ef4444']
      }]
    };

    return { totalExpenses: totalExp, netProfit: profit, profitMargin: margin, profitChart: chartData };
  }, [totalRevenue, expenses]);

  // 3. Product & Inventory Metrics
  const { productStats, deadStock, fastMoving } = useMemo(() => {
    // Tally product sales
    const pStats = {};
    products.forEach(p => {
      pStats[p.id] = { ...p, unitsSold: 0, revenueGenerated: 0 };
    });

    validSales.forEach(sale => {
      sale.items?.forEach(item => {
        if (pStats[item.productId]) {
          pStats[item.productId].unitsSold += item.quantity;
          pStats[item.productId].revenueGenerated += (item.quantity * item.price);
        }
      });
    });

    const allProductsArray = Object.values(pStats);
    
    // Sort by units sold
    const sortedBySales = [...allProductsArray].sort((a, b) => b.unitsSold - a.unitsSold);
    
    // Dead stock: High inventory (>10) but 0 units sold
    const dead = allProductsArray.filter(p => p.unitsSold === 0 && p.stockQuantity > 10).sort((a, b) => b.stockQuantity - a.stockQuantity);
    
    // Fast moving: High sales relative to stock
    const fast = sortedBySales.filter(p => p.unitsSold > 5).slice(0, 10);

    return { productStats: sortedBySales, deadStock: dead, fastMoving: fast };
  }, [validSales, products]);

  // 4. Customer Metrics
  const { repeatCustomers, oneTimeCustomers, retentionRate } = useMemo(() => {
    const repeat = customers.filter(c => (c.totalPurchases || 0) > 1).length;
    const oneTime = customers.filter(c => (c.totalPurchases || 0) === 1).length;
    const totalWithPurchases = repeat + oneTime;
    const rate = totalWithPurchases > 0 ? (repeat / totalWithPurchases) * 100 : 0;
    
    return { repeatCustomers: repeat, oneTimeCustomers: oneTime, retentionRate: rate };
  }, [customers]);

  // --- CSV EXPORTS ---
  const downloadCSV = (filename, rows) => {
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (type) => {
    if (!currentUser?.activeBusinessId) return;
    setExporting(type);
    
    try {
      const bid = currentUser.activeBusinessId;
      
      if (type === 'Inventory Report') {
        const rows = [
          ["Product ID", "Name", "Category", "Stock", "Price", "Cost", "Value"],
          ...products.map(p => [p.id, `"${(p.name || '').replace(/"/g, '""')}"`, p.category || '', p.stockQuantity || 0, p.price || 0, p.costPrice || 0, (p.stockQuantity || 0) * (p.price || 0)])
        ];
        downloadCSV(`Inventory_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`, rows);
      } 
      else if (type === 'Expense Report') {
        const rows = [
          ["Date", "Category", "Description", "Amount", "Payment Method"],
          ...expenses.map(e => [e.date, e.category, `"${(e.description || '').replace(/"/g, '""')}"`, e.amount || 0, e.paymentMethod])
        ];
        downloadCSV(`Expenses_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`, rows);
      }
      else if (type.includes('Sales')) {
         if (type === 'Daily Sales') {
            const today = startOfDay(new Date()).getTime();
            const daily = sales.filter(s => startOfDay(new Date(s.date)).getTime() === today);
            const rows = [
              ["Invoice ID", "Date", "Customer", "Total Amount", "Status"],
              ...daily.map(s => [s.invoiceNumber || s.id, s.date, `"${(s.customerName || 'Walk-in').replace(/"/g, '""')}"`, s.total || 0, s.status])
            ];
            downloadCSV(`Daily_Sales_${format(new Date(), 'yyyy-MM-dd')}.csv`, rows);
         } else if (type === 'Weekly Sales') {
            const weekAgo = subDays(new Date(), 7).getTime();
            const weekly = sales.filter(s => new Date(s.date).getTime() >= weekAgo);
            const rows = [
              ["Invoice ID", "Date", "Customer", "Total Amount", "Status"],
              ...weekly.map(s => [s.invoiceNumber || s.id, s.date, `"${(s.customerName || 'Walk-in').replace(/"/g, '""')}"`, s.total || 0, s.status])
            ];
            downloadCSV(`Weekly_Sales_${format(new Date(), 'yyyy-MM-dd')}.csv`, rows);
         }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate report');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Analytics Center</h1>
          <p className="text-secondary">Deep dive into your business metrics and performance</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-[var(--border-color)] overflow-x-auto">
        {['sales', 'profit', 'products', 'customers', 'inventory', 'exports'].map(tab => (
          <button 
            key={tab}
            className={`px-4 py-3 font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        
        {/* SALES TAB */}
        {activeTab === 'sales' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-text-muted text-sm font-semibold uppercase tracking-wider mb-1">Total Lifetime Revenue</p>
                  <h2 className="text-3xl font-black text-text-main">{currencySymbol}{totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-text-muted text-sm font-semibold uppercase tracking-wider mb-1">Average Order Value (AOV)</p>
                  <h2 className="text-3xl font-black text-primary">{currencySymbol}{averageOrderValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-text-muted text-sm font-semibold uppercase tracking-wider mb-1">MoM Growth</p>
                  <h2 className={`text-3xl font-black flex items-center gap-2 ${revenueGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                    {revenueGrowth >= 0 ? <ArrowUpRight size={28}/> : <ArrowDownRight size={28}/>}
                    {Math.abs(revenueGrowth).toFixed(1)}%
                  </h2>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader><h3 className="font-bold text-lg">Revenue (Last 30 Days)</h3></CardHeader>
              <CardContent className="h-[400px]">
                <Line data={salesByDayChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* PROFIT TAB */}
        {activeTab === 'profit' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-text-muted text-sm font-semibold uppercase tracking-wider mb-1">Net Profit</p>
                  <h2 className={`text-3xl font-black ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {currencySymbol}{netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </h2>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-text-muted text-sm font-semibold uppercase tracking-wider mb-1">Profit Margin</p>
                  <h2 className="text-3xl font-black text-text-main">{profitMargin.toFixed(1)}%</h2>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-text-muted text-sm font-semibold uppercase tracking-wider mb-1">Total Expenses</p>
                  <h2 className="text-3xl font-black text-danger">{currencySymbol}{totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><h3 className="font-bold text-lg">Income vs Outflow</h3></CardHeader>
              <CardContent className="h-[400px]">
                <Bar data={profitChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader><h3 className="font-bold text-lg">Top 10 Products by Volume</h3></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] text-text-muted text-sm uppercase tracking-wider">
                        <th className="p-4 font-bold">Rank</th>
                        <th className="p-4 font-bold">Product Name</th>
                        <th className="p-4 font-bold text-right">Units Sold</th>
                        <th className="p-4 font-bold text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productStats.slice(0, 10).map((p, i) => (
                        <tr key={p.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                          <td className="p-4 font-bold text-text-muted">#{i + 1}</td>
                          <td className="p-4 font-medium text-text-main">{p.name}</td>
                          <td className="p-4 text-right font-bold">{p.unitsSold}</td>
                          <td className="p-4 text-right text-success font-bold">{currencySymbol}{p.revenueGenerated.toLocaleString()}</td>
                        </tr>
                      ))}
                      {productStats.length === 0 && <tr><td colSpan="4" className="text-center p-8">No data</td></tr>}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                <div className="w-16 h-16 rounded-full bg-primary-bg text-primary flex items-center justify-center mb-4">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-bold text-text-secondary mb-1">Customer Retention Rate</h3>
                <h1 className="text-5xl font-black text-text-main mb-2">{retentionRate.toFixed(1)}%</h1>
                <p className="text-sm text-text-muted">Percentage of customers who have purchased more than once.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><h3 className="font-bold text-lg">Customer Loyalty Breakdown</h3></CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                {customers.length > 0 ? (
                  <Doughnut 
                    data={{
                      labels: ['Repeat Customers', 'One-time Buyers'],
                      datasets: [{
                        data: [repeatCustomers, oneTimeCustomers],
                        backgroundColor: ['#3b82f6', '#94a3b8'],
                        borderWidth: 0
                      }]
                    }}
                    options={{ maintainAspectRatio: false, cutout: '70%' }}
                  />
                ) : (
                  <p className="text-text-muted">Not enough data</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="font-bold text-lg text-danger flex items-center gap-2"><PackageX size={20}/> Dead Stock Risk</h3>
                  <p className="text-xs text-text-secondary">High stock items with zero sales history.</p>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {deadStock.length > 0 ? deadStock.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 border-b border-[var(--border-color)] last:border-0">
                        <div>
                          <p className="font-bold text-sm">{p.name}</p>
                          <p className="text-xs text-text-muted">{p.category || 'Uncategorized'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-danger text-lg">{p.stockQuantity} <span className="text-xs font-normal">units</span></p>
                        </div>
                      </div>
                    )) : <p className="text-text-muted text-sm text-center py-8">No dead stock detected. Good job!</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-bold text-lg text-warning flex items-center gap-2"><Zap size={20}/> Fast Moving</h3>
                  <p className="text-xs text-text-secondary">Products selling rapidly.</p>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {fastMoving.length > 0 ? fastMoving.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 border-b border-[var(--border-color)] last:border-0">
                        <div>
                          <p className="font-bold text-sm">{p.name}</p>
                          <p className="text-xs text-text-muted">{p.category || 'Uncategorized'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-success text-lg">{p.unitsSold} <span className="text-xs font-normal">sold</span></p>
                        </div>
                      </div>
                    )) : <p className="text-text-muted text-sm text-center py-8">Not enough data to determine fast movers.</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* EXPORTS TAB */}
        {activeTab === 'exports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sales Exports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp size={20} className="text-primary"/> Sales Exports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" icon={exporting === 'Daily Sales' ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>} onClick={() => handleExport('Daily Sales')} disabled={exporting}>Daily Sales (CSV)</Button>
                  <Button variant="outline" size="sm" icon={exporting === 'Weekly Sales' ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>} onClick={() => handleExport('Weekly Sales')} disabled={exporting}>Weekly Sales (CSV)</Button>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Exports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Box size={20} className="text-warning"/> Inventory Exports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" icon={exporting === 'Inventory Report' ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>} onClick={() => handleExport('Inventory Report')} disabled={exporting}>Full Stock Report (CSV)</Button>
                </div>
              </CardContent>
            </Card>

            {/* Expense Exports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase size={20} className="text-danger"/> Financial Exports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" icon={exporting === 'Expense Report' ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>} onClick={() => handleExport('Expense Report')} disabled={exporting}>Expense Report (CSV)</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;
