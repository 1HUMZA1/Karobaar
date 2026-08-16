import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import { format, subDays, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Line } from 'react-chartjs-2';
import { Clock, CheckSquare, CalendarOff, DollarSign, ShoppingBag, Users, Package, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow } from '../../components/ui/Table';
import { GettingStartedGuide } from '../../components/Dashboard/GettingStartedGuide';
import './Dashboard.css';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DashboardLegacy = () => {
  const { userRole, currentUser, currentBusiness } = useAppContext();
  
  const [stats, setStats] = useState({
    sales: 0,
    orders: 0,
    customers: 0,
    lowStock: 0,
    recentSales: [],
    pendingTasks: 3,
    leaveBalance: 12
  });

  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: []
  });

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.activeBusinessId) return;

      try {
        const sales = await db.getCollection('sales', currentUser.activeBusinessId);
        const customers = await db.getCollection('customers', currentUser.activeBusinessId);
        const products = await db.getCollection('products', currentUser.activeBusinessId);
        
        const today = startOfDay(new Date());
        let todaySales = 0;
        let todayOrders = 0;
        
        sales.forEach(sale => {
          const saleDate = startOfDay(new Date(sale.date));
          if (saleDate.getTime() === today.getTime()) {
            todaySales += (sale.total || 0);
            todayOrders++;
          }
        });

        const lowStock = products.filter(p => (p.stockQuantity || 0) <= (p.minimumStock || 5)).length;

        const recentSales = [...sales]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

        setStats(prev => ({
          ...prev,
          sales: todaySales,
          orders: todayOrders,
          customers: customers.length,
          lowStock,
          recentSales
        }));

        // Revenue Chart Data (Last 7 days)
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
          const d = startOfDay(subDays(today, i));
          labels.push(format(d, 'MMM dd'));
          const dayTotal = sales
            .filter(s => startOfDay(new Date(s.date)).getTime() === d.getTime())
            .reduce((sum, s) => sum + (s.total || 0), 0);
          data.push(dayTotal);
        }

        setRevenueData({
          labels,
          datasets: [
            {
              label: 'Revenue',
              data,
              borderColor: 'var(--primary)',
              backgroundColor: 'var(--primary-bg)',
              fill: true,
              tension: 0.4,
            }
          ]
        });

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'var(--border-color)' },
        ticks: { callback: (value) => `${currencySymbol}${value}` }
      },
      x: {
        grid: { display: false }
      }
    }
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
          <h1 className="text-2xl font-bold">Dashboard (Legacy)</h1>
          <p className="text-secondary">Here's what's happening with your business today.</p>
        </div>
      </div>

      <div className="mb-6 bg-[var(--bg-card)] p-4 rounded-xl shadow-sm border border-[var(--border-color)]">
        <h3 className="text-sm font-semibold text-secondary mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => window.location.href='#/pos'}>+ New Sale</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href='#/products'}>+ Add Product</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href='#/customers'}>+ Add Customer</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href='#/expenses'}>Record Expense</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href='#/attendance'}>Mark Attendance</Button>
        </div>
      </div>

      <GettingStartedGuide />

      {/* KPI Cards */}
      <div className="dashboard-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="kpi-card p-5 flex justify-between items-center">
            <div className="kpi-info">
              <p className="kpi-label text-sm font-medium text-text-secondary mb-1">Total Revenue</p>
              <h3 className="kpi-value text-2xl font-bold text-text-main">{currencySymbol}{stats.sales.toFixed(2)}</h3>
            </div>
            <div className="kpi-icon bg-primary-bg text-primary p-3 rounded-xl">
              <DollarSign size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="kpi-card p-5 flex justify-between items-center">
            <div className="kpi-info">
              <p className="kpi-label text-sm font-medium text-text-secondary mb-1">Total Orders</p>
              <h3 className="kpi-value text-2xl font-bold text-text-main">{stats.orders}</h3>
            </div>
            <div className="kpi-icon bg-success-bg text-success p-3 rounded-xl">
              <ShoppingBag size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="kpi-card p-5 flex justify-between items-center">
            <div className="kpi-info">
              <p className="kpi-label text-sm font-medium text-text-secondary mb-1">Total Customers</p>
              <h3 className="kpi-value text-2xl font-bold text-text-main">{stats.customers}</h3>
            </div>
            <div className="kpi-icon bg-info-bg text-info p-3 rounded-xl">
              <Users size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="kpi-card p-5 flex justify-between items-center">
            <div className="kpi-info">
              <p className="kpi-label text-sm font-medium text-text-secondary mb-1">Low Stock Alerts</p>
              <h3 className="kpi-value text-2xl font-bold text-text-main">{stats.lowStock}</h3>
              {stats.lowStock > 0 && <p className="kpi-trend negative flex items-center text-xs text-danger mt-1"><AlertCircle size={14} className="mr-1"/> Requires attention</p>}
            </div>
            <div className="kpi-icon bg-warning-bg text-warning p-3 rounded-xl">
              <Package size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="dashboard-charts-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="chart-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="chart-container relative h-[320px]">
            <Line data={revenueData} options={chartOptions} />
          </CardContent>
        </Card>

        <Card className="recent-orders-card">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableBody>
                {stats.recentSales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-text-main">{sale.invoiceNumber || sale.id.substring(0, 8)}</span>
                        <span className="text-xs text-text-secondary flex items-center gap-1">
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
                    <TableCell colSpan="2" className="text-center py-4 text-text-secondary">
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

export default DashboardLegacy;
