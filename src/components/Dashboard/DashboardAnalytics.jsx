import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Line, Bar } from 'react-chartjs-2';
import { Activity, Wallet, TrendingUp, BarChart3, Package, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAppContext } from '../../context/AppContext';

export const RevenueAnalytics = ({ chartObj, chartOptions }) => {
  const [range, setRange] = useState('7D');
  return (
    <Card className="border-none shadow-sm h-full" style={{ background: 'var(--bg-card)' }}>
      <CardHeader className="pb-0 pt-6 px-6 border-none">
        <div className="flex justify-between items-center w-full">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity size={18} className="text-primary"/> Revenue Analytics
          </CardTitle>
          <div className="flex gap-2">
            {['7D', '30D', '3M', '1Y'].map(r => (
              <button 
                key={r}
                onClick={() => setRange(r)}
                className={`text-xs font-semibold px-2 py-1 rounded ${range === r ? 'bg-primary text-primary-text' : 'text-text-muted hover:bg-[var(--bg-hover)]'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="chart-container px-6 pb-6 pt-4 h-64 relative">
        <Line data={chartObj} options={{...chartOptions, maintainAspectRatio: false}} />
      </CardContent>
    </Card>
  );
};

export const ProfitCenter = ({ stats, currencySymbol }) => {
  const cogs = (stats.todayRevenue || 0) * 0.45; // Simulated COGS if not strictly tracked per product yet
  const grossProfit = (stats.todayRevenue || 0) - cogs;
  const netProfit = grossProfit - (stats.todayExpenses || 0);

  return (
    <Card className="border-none shadow-sm flex-1" style={{ background: 'var(--bg-card)' }}>
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border-color">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Wallet size={18} className="text-success"/> Profit & Loss
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Revenue</span>
            <span className="font-semibold">{currencySymbol}{(stats.todayRevenue || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Cost of Goods (Est.)</span>
            <span className="font-semibold text-danger">-{currencySymbol}{cogs.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-border-color">
            <span className="font-bold">Gross Profit</span>
            <span className="font-bold text-primary">{currencySymbol}{grossProfit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-text-secondary">
            <span>Operating Expenses</span>
            <span className="text-danger">-{currencySymbol}{(stats.todayExpenses || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t-2 border-border-color">
            <span className="font-bold text-lg">Net Profit</span>
            <span className="font-bold text-success text-xl">{currencySymbol}{netProfit.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const TopProducts = ({ topProducts = [], currencySymbol }) => {
  return (
    <Card className="border-none shadow-sm col-span-1 md:col-span-2 lg:col-span-1" style={{ background: 'var(--bg-card)' }}>
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border-color">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp size={18} className="text-warning"/> Top Selling Products
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[var(--border-color)]">
          {topProducts.length > 0 ? topProducts.map((p, i) => (
            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-hover)] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary-bg text-primary flex items-center justify-center font-bold text-sm">
                  #{i + 1}
                </div>
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-text-muted">{p.soldCount} units sold</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-success">{currencySymbol}{(p.revenue || 0).toFixed(2)}</p>
                <p className="text-xs text-text-muted">{p.stockQuantity} in stock</p>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-text-muted flex flex-col items-center">
              <Package size={24} className="mb-2 opacity-50"/>
              <p className="text-sm">Not enough sales data yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
