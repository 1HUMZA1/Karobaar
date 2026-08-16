import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button variant="primary" onClick={() => navigate('/pos')}><DollarSign size={16} className="mr-2"/> New Sale (Ctrl+N)</Button>
      <Button variant="outline" onClick={() => navigate('/products')}>+ Add Product</Button>
      <Button variant="outline" onClick={() => navigate('/customers')}>+ Add Customer</Button>
      <Button variant="outline" onClick={() => navigate('/expenses')}>Record Expense</Button>
      <Button variant="outline" onClick={() => navigate('/attendance')}>Mark Attendance</Button>
    </div>
  );
};

export const KPIBar = ({ stats, trends, currencySymbol }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Revenue */}
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow" style={{ background: 'var(--bg-card)' }}>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-text-secondary">Today's Revenue</p>
            <div className="p-2 rounded-lg bg-primary-bg text-primary"><DollarSign size={18}/></div>
          </div>
          <h3 className="text-2xl font-bold mb-2">{currencySymbol}{(stats.todayRevenue || 0).toFixed(2)}</h3>
          <div className={`flex items-center text-sm font-medium ${trends.revTrend.isPositive ? 'text-success' : 'text-danger'}`}>
            {trends.revTrend.isPositive ? <ArrowUpRight size={16} className="mr-1"/> : <ArrowDownRight size={16} className="mr-1"/>}
            {trends.revTrend.value}% vs yesterday
          </div>
        </CardContent>
      </Card>
      
      {/* Orders */}
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow" style={{ background: 'var(--bg-card)' }}>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-text-secondary">Today's Orders</p>
            <div className="p-2 rounded-lg bg-success-bg text-success"><ShoppingBag size={18}/></div>
          </div>
          <h3 className="text-2xl font-bold mb-2">{stats.todayOrders || 0}</h3>
          <div className={`flex items-center text-sm font-medium ${trends.ordTrend.isPositive ? 'text-success' : 'text-danger'}`}>
            {trends.ordTrend.isPositive ? <ArrowUpRight size={16} className="mr-1"/> : <ArrowDownRight size={16} className="mr-1"/>}
            {trends.ordTrend.value}% vs yesterday
          </div>
        </CardContent>
      </Card>

      {/* Profit */}
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow" style={{ background: 'var(--bg-card)' }}>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-text-secondary">Est. Profit</p>
            <div className="p-2 rounded-lg bg-info-bg text-info"><TrendingUp size={18}/></div>
          </div>
          <h3 className="text-2xl font-bold mb-2">{currencySymbol}{(stats.todayProfit || 0).toFixed(2)}</h3>
          <p className="text-sm text-text-muted">Revenue - Expenses</p>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow" style={{ background: 'var(--bg-card)' }}>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-text-secondary">Action Items</p>
            <div className="p-2 rounded-lg bg-danger-bg text-danger"><AlertCircle size={18}/></div>
          </div>
          <h3 className="text-2xl font-bold mb-2">{stats.lowStockCount || 0}</h3>
          <div className={`text-sm font-medium ${stats.lowStockCount > 0 ? 'text-danger' : 'text-success'}`}>
            {stats.lowStockCount > 0 ? 'Items need restock' : 'Inventory healthy'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const SalesGoalWidget = ({ currentSales, target, currencySymbol }) => {
  const percent = target > 0 ? Math.min(100, Math.round((currentSales / target) * 100)) : 0;
  return (
    <Card className="border-none shadow-sm mb-6 flex-1" style={{ background: 'var(--bg-card)' }}>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary mb-1 flex items-center gap-2"><Target size={16}/> Monthly Goal</p>
          <h3 className="text-xl font-bold">{currencySymbol}{currentSales.toLocaleString()} <span className="text-sm text-text-muted font-normal">/ {currencySymbol}{target.toLocaleString()}</span></h3>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-bold text-primary">{percent}%</span>
          <div className="w-32 h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden mt-1">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
