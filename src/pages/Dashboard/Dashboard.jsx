import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingBag, Users, Package, 
  TrendingUp, TrendingDown, Clock, AlertCircle, CalendarOff, CheckSquare
} from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, subDays, startOfDay } from 'date-fns';
import { useAppContext } from '../../context/AppContext';
import './Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler
);

const Dashboard = () => {
  const { theme, userRole, currentUser, currentBusiness } = useAppContext();
  const [stats, setStats] = useState({
    sales: 0, orders: 0, customers: 0, lowStock: 0, recentSales: [],
    pendingTasks: 0, leaveBalance: 12
  });
  
  const [chartData, setChartData] = useState({ labels: [], data: [] });

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      loadDashboardData(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId]);

  const loadDashboardData = async (businessId) => {
    try {
      const salesData = await db.getCollection('sales', businessId);
      const customersData = await db.getCollection('customers', businessId);
      const productsData = await db.getCollection('products', businessId);

      // Filter for today
      const today = startOfDay(new Date());
      const todaysSales = salesData.filter(s => startOfDay(new Date(s.date)).getTime() === today.getTime());
      
      const totalRevenue = salesData.reduce((sum, s) => sum + s.total, 0);
      const lowStockCount = productsData.filter(p => p.stockQuantity <= (p.minimumStock || 0)).length;
      
      // Get 5 most recent sales
      const recent = [...salesData].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      setStats({
        sales: totalRevenue,
        orders: salesData.length,
        customers: customersData.length,
        lowStock: lowStockCount,
        recentSales: recent,
        pendingTasks: 0,
        leaveBalance: 0
      });

      // Chart Data for last 7 days
      const labels = [];
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const d = startOfDay(subDays(today, i));
        labels.push(format(d, 'EEE'));
        const dayRevenue = salesData
          .filter(s => startOfDay(new Date(s.date)).getTime() === d.getTime())
          .reduce((sum, s) => sum + s.total, 0);
        data.push(dayRevenue);
      }
      setChartData({ labels, data });

    } catch (err) {
      console.error("Dashboard Error:", err);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false, drawBorder: false }, ticks: { color: theme === 'dark' ? '#94a3b8' : '#64748b' } },
      y: { grid: { color: theme === 'dark' ? '#334155' : '#e2e8f0', drawBorder: false }, ticks: { color: theme === 'dark' ? '#94a3b8' : '#64748b' } }
    }
  };

  const revenueData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Revenue',
        data: chartData.data,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const isStaffRole = ['Employee', 'Sales Staff', 'Cashier', 'Warehouse'].includes(userRole);

  if (isStaffRole) {
    return (
      <div className="page-container animate-fade-in">
        <div className="page-header mb-8">
          <div>
            <h1 className="text-3xl font-bold">Good Morning, {currentUser?.name?.split(' ')[0] || userRole}!</h1>
            <p className="text-secondary mt-1">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-md">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <Clock size={48} className="mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">Today's Attendance</h3>
              <p className="text-primary-light mb-6">You have not checked in yet today.</p>
              <Button 
                className="w-full bg-white text-primary hover:bg-gray-100 font-bold"
                size="lg"
                onClick={() => window.location.href='#/attendance'}
              >
                CHECK IN NOW
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="flex-1">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-blue-50 dark:bg-slate-800 rounded-full text-blue-500">
                  <CheckSquare size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Tasks</h3>
                  <p className="text-secondary">{stats.pendingTasks} pending tasks for today</p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-primary" onClick={() => window.location.href='#/tasks'}>View Tasks &rarr;</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-green-50 dark:bg-slate-800 rounded-full text-green-500">
                  <CalendarOff size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leave Balance</h3>
                  <p className="text-secondary">{stats.leaveBalance} days remaining</p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-success" onClick={() => window.location.href='#/leave'}>Request Leave &rarr;</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Management / Admin Dashboard
  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-secondary">Here's what's happening with your business today.</p>
        </div>
      </div>

      <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-secondary mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => window.location.href='#/pos'}>+ New Sale</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href='#/products'}>+ Add Product</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href='#/customers'}>+ Add Customer</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href='#/expenses'}>Record Expense</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href='#/attendance'}>Mark Attendance</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-info">
              <p className="kpi-label">Total Revenue</p>
              <h3 className="kpi-value">{currencySymbol}{stats.sales.toFixed(2)}</h3>
            </div>
            <div className="kpi-icon bg-primary-light text-primary">
              <DollarSign size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-info">
              <p className="kpi-label">Total Orders</p>
              <h3 className="kpi-value">{stats.orders}</h3>
            </div>
            <div className="kpi-icon bg-success-light text-success">
              <ShoppingBag size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-info">
              <p className="kpi-label">Total Customers</p>
              <h3 className="kpi-value">{stats.customers}</h3>
            </div>
            <div className="kpi-icon bg-info-light text-info">
              <Users size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-info">
              <p className="kpi-label">Low Stock Alerts</p>
              <h3 className="kpi-value">{stats.lowStock}</h3>
              {stats.lowStock > 0 && <p className="kpi-trend negative"><AlertCircle size={14}/> Requires attention</p>}
            </div>
            <div className="kpi-icon bg-warning-light text-warning">
              <Package size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="dashboard-charts-grid">
        <Card className="chart-card">
          <CardHeader>
            <CardTitle>Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="chart-container">
            <Line data={revenueData} options={chartOptions} />
          </CardContent>
        </Card>

        <Card className="recent-orders-card">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {stats.recentSales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{sale.invoiceNumber || sale.id.substring(0, 8)}</span>
                        <span className="text-xs text-secondary flex items-center gap-1">
                          <Clock size={12}/> {format(new Date(sale.date), 'MMM dd, hh:mm a')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-primary">{currencySymbol}{sale.total.toFixed(2)}</span>
                        <span className="text-xs text-success">{sale.status || 'Completed'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {stats.recentSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan="2" className="text-center py-4 text-secondary">
                      No recent transactions
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
