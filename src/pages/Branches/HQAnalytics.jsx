import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Building2, TrendingUp, DollarSign, Package } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const HQAnalytics = () => {
  const { userBusinesses, currentBusiness } = useAppContext();
  const [branchData, setBranchData] = useState([]);
  const [loading, setLoading] = useState(true);

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  useEffect(() => {
    const fetchHQData = async () => {
      setLoading(true);
      try {
        const data = await Promise.all(
          userBusinesses.map(async (biz) => {
            const sales = await db.getCollection('sales', biz.id).catch(() => []);
            const products = await db.getCollection('products', biz.id).catch(() => []);
            const employees = await db.getCollection('employees', biz.id).catch(() => []);

            const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
            const totalStockValuation = products.reduce((sum, p) => sum + ((p.purchasePrice || 0) * (p.stockQuantity || 0)), 0);

            return {
              id: biz.id,
              name: biz.name,
              totalRevenue,
              salesCount: sales.length,
              stockValuation: totalStockValuation,
              employeeCount: employees.length
            };
          })
        );
        
        setBranchData(data);
      } catch (err) {
        console.error("Failed to load HQ Data", err);
      } finally {
        setLoading(false);
      }
    };

    if (userBusinesses.length > 0) {
      fetchHQData();
    }
  }, [userBusinesses]);

  const chartData = {
    labels: branchData.map(b => b.name),
    datasets: [
      {
        label: 'Total Revenue',
        data: branchData.map(b => b.totalRevenue),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const networkRevenue = branchData.reduce((sum, b) => sum + b.totalRevenue, 0);
  const networkStock = branchData.reduce((sum, b) => sum + b.stockValuation, 0);
  const networkEmployees = branchData.reduce((sum, b) => sum + b.employeeCount, 0);

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Headquarters Analytics
          </h1>
          <p className="text-secondary">Compare performance across all your branches</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">Loading HQ Data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary-light)] text-[var(--primary-color)] flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-sm text-text-muted font-semibold uppercase tracking-wider">Network Revenue</p>
                  <p className="text-2xl font-bold text-text-main">{currencySymbol}{networkRevenue.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-sm text-text-muted font-semibold uppercase tracking-wider">Network Stock Value</p>
                  <p className="text-2xl font-bold text-text-main">{currencySymbol}{networkStock.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <div>
                  <p className="text-sm text-text-muted font-semibold uppercase tracking-wider">Total Branches</p>
                  <p className="text-2xl font-bold text-text-main">{branchData.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-lg font-bold">Revenue by Branch</h2>
            </CardHeader>
            <CardContent>
              <div style={{ height: '400px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold">Branch Performance Matrix</h2>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="p-4 font-semibold text-text-muted">Branch Name</th>
                      <th className="p-4 font-semibold text-text-muted text-right">Sales Count</th>
                      <th className="p-4 font-semibold text-text-muted text-right">Total Revenue</th>
                      <th className="p-4 font-semibold text-text-muted text-right">Stock Valuation</th>
                      <th className="p-4 font-semibold text-text-muted text-right">Employees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchData.map(branch => (
                      <tr key={branch.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                        <td className="p-4 font-bold text-text-main">{branch.name}</td>
                        <td className="p-4 text-right">{branch.salesCount}</td>
                        <td className="p-4 text-right font-bold text-primary">{currencySymbol}{branch.totalRevenue.toLocaleString()}</td>
                        <td className="p-4 text-right">{currencySymbol}{branch.stockValuation.toLocaleString()}</td>
                        <td className="p-4 text-right">{branch.employeeCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default HQAnalytics;
