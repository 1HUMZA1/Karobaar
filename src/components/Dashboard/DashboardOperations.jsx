import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Package, AlertCircle, Users, Clock, Receipt, UserCircle, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InventoryHealth = ({ lowStockProducts = [] }) => {
  const navigate = useNavigate();
  return (
    <Card className="border-none shadow-sm h-full" style={{ background: 'var(--bg-card)' }}>
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border-color">
        <div className="flex justify-between items-center w-full">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-danger">
            <AlertCircle size={18}/> Low Stock Alerts
          </CardTitle>
          <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate('/inventory')}>View All</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[var(--border-color)]">
          {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-hover)] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-danger-bg text-danger flex items-center justify-center">
                  <Package size={16}/>
                </div>
                <div>
                  <p className="font-semibold text-sm truncate max-w-[120px]" title={p.name}>{p.name}</p>
                  <p className="text-xs font-bold text-danger">{p.stockQuantity} remaining</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-auto" onClick={() => navigate('/purchases')}>Restock</Button>
            </div>
          )) : (
            <div className="p-8 text-center text-text-muted flex flex-col items-center">
              <Package size={24} className="mb-2 opacity-50"/>
              <p className="text-sm">Inventory levels are healthy.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const CustomerInsights = ({ totalCustomers, recentCustomers = [] }) => {
  return (
    <Card className="border-none shadow-sm h-full" style={{ background: 'var(--bg-card)' }}>
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border-color">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users size={18} className="text-primary"/> Customer Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-text-secondary">Total Customers</p>
            <h3 className="text-2xl font-bold">{totalCustomers}</h3>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">New This Week</p>
            <h3 className="text-xl font-bold text-success">+{recentCustomers.length}</h3>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Newest Signups</h4>
          {recentCustomers.slice(0, 3).map(c => (
            <div key={c.id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-[var(--bg-hover)]">
              <div className="flex items-center gap-2">
                <UserCircle size={16} className="text-text-muted"/>
                <span className="font-medium">{c.name}</span>
              </div>
              <span className="text-xs text-text-muted">{new Date(c.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          ))}
          {recentCustomers.length === 0 && <p className="text-sm text-text-muted italic">No recent customers.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export const TeamAttendance = ({ totalEmployees, presentCount }) => {
  const navigate = useNavigate();
  const absent = totalEmployees - presentCount;
  
  return (
    <Card className="border-none shadow-sm h-full flex flex-col" style={{ background: 'var(--bg-card)' }}>
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border-color">
        <div className="flex justify-between items-center w-full">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock size={18} className="text-info"/> Team Today
          </CardTitle>
          <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate('/attendance')}>View All</Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">{totalEmployees} <span className="text-sm font-normal text-text-secondary">Staff</span></h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-success">Present ({presentCount})</span>
              <span className="font-bold">{totalEmployees > 0 ? Math.round((presentCount/totalEmployees)*100) : 0}%</span>
            </div>
            <div className="w-full h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: `${totalEmployees > 0 ? (presentCount/totalEmployees)*100 : 0}%` }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-danger">Absent ({absent})</span>
              <span className="font-bold">{totalEmployees > 0 ? Math.round((absent/totalEmployees)*100) : 0}%</span>
            </div>
            <div className="w-full h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <div className="h-full bg-danger rounded-full" style={{ width: `${totalEmployees > 0 ? (absent/totalEmployees)*100 : 0}%` }}></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ExpenseOverview = ({ expenses = [], currencySymbol }) => {
  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  // Aggregate by category
  const categories = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    categories[cat] = (categories[cat] || 0) + (e.amount || 0);
  });
  
  const sortedCategories = Object.entries(categories).sort((a,b) => b[1] - a[1]).slice(0, 4);

  return (
    <Card className="border-none shadow-sm h-full" style={{ background: 'var(--bg-card)' }}>
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border-color">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Receipt size={18} className="text-danger"/> Expense Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6">
          <p className="text-sm text-text-secondary">Total (Today)</p>
          <h3 className="text-2xl font-bold text-danger">{currencySymbol}{total.toFixed(2)}</h3>
        </div>
        <div className="space-y-3">
          {sortedCategories.map(([cat, amount], i) => (
            <div key={cat} className="flex justify-between items-center text-sm">
              <span className="font-medium flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${i===0 ? 'bg-danger' : i===1 ? 'bg-warning' : 'bg-primary'}`}></span>
                {cat}
              </span>
              <span className="font-semibold">{currencySymbol}{amount.toFixed(2)}</span>
            </div>
          ))}
          {sortedCategories.length === 0 && <p className="text-sm text-text-muted italic">No expenses recorded today.</p>}
        </div>
      </CardContent>
    </Card>
  );
};
