import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingBag, Users, Package, 
  TrendingUp, TrendingDown, Clock, AlertCircle
} from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
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
import { format } from 'date-fns';
import { useAppContext } from '../../context/AppContext';
import './Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler
);

const Dashboard = () => {
  const { theme } = useAppContext();
  const [stats, setStats] = useState({
    sales: 0, orders: 0, customers: 0, lowStock: 0, recentSales: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const salesData = await db.getCollection('sales');
    const customersData = await db.getCollection('customers');
    const productsData = await db.getCollection('products');

    const totalRevenue = salesData.reduce((sum, s) => sum + s.total, 0);
    const lowStockCount = productsData.filter(p => p.stockQuantity <= p.minimumStock).length;
    
    // Get 5 most recent sales
    const recent = [...salesData].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    setStats({
      sales: totalRevenue,
      orders: salesData.length,
      customers: customersData.length,
      lowStock: lowStockCount,
      recentSales: recent
    });
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
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue',
        data: [1200, 1900, 1500, 2200, 1800, 2800, 2400],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

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
          <Button size="sm" onClick={() => window.location.href='/pos'}>+ New Sale</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href='/products'}>+ Add Product</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href='/customers'}>+ Add Customer</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href='/expenses'}>Record Expense</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href='/attendance'}>Mark Attendance</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-info">
              <p className="kpi-label">Total Revenue</p>
              <h3 className="kpi-value">${stats.sales.toFixed(2)}</h3>
              <p className="kpi-trend positive"><TrendingUp size={14}/> +12.5% from last month</p>
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
              <p className="kpi-trend positive"><TrendingUp size={14}/> +5.2% from last month</p>
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
              <p className="kpi-trend"><TrendingUp size={14} className="text-success"/> +2 new this week</p>
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
              <p className="kpi-trend negative"><AlertCircle size={14}/> Requires attention</p>
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
            <CardTitle>Revenue Overview</CardTitle>
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
                        <span className="font-medium">{sale.invoiceNumber}</span>
                        <span className="text-xs text-secondary flex items-center gap-1">
                          <Clock size={12}/> {format(new Date(sale.date), 'MMM dd, hh:mm a')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-primary">${sale.total.toFixed(2)}</span>
                        <span className="text-xs text-success">{sale.status}</span>
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
