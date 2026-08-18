import React from 'react';
import { Download, TrendingUp, Users, Box, Banknote, Calendar, BarChart2, Briefcase, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const Reports = () => {
  const handleExport = (type) => {
    alert(`Generating ${type}... (PDF/Excel export functionality coming soon)`);
  };

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-secondary">Generate and export business insights</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Sales & Profit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp size={20} className="text-primary"/> Sales & Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-secondary mb-4" style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>Export revenue summaries and profit/loss statements.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button variant="outline" size="sm" icon={<Calendar size={14}/>} onClick={() => handleExport('Daily Sales')}>Daily Sales</Button>
              <Button variant="outline" size="sm" icon={<Calendar size={14}/>} onClick={() => handleExport('Weekly Sales')}>Weekly Sales</Button>
              <Button variant="outline" size="sm" icon={<Calendar size={14}/>} onClick={() => handleExport('Monthly Sales')}>Monthly Sales</Button>
              <Button variant="outline" size="sm" icon={<Banknote size={14}/>} onClick={() => handleExport('Profit/Loss')}>Profit/Loss</Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart2 size={20} className="text-info"/> Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-secondary mb-4" style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>Analyze product movement and staff productivity.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button variant="outline" size="sm" icon={<Box size={14}/>} onClick={() => handleExport('Product Performance')}>Product Performance</Button>
              <Button variant="outline" size="sm" icon={<Users size={14}/>} onClick={() => handleExport('Employee Performance')}>Employee Performance</Button>
            </div>
          </CardContent>
        </Card>

        {/* Operations & Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase size={20} className="text-warning"/> Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-secondary mb-4" style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>Export current stock levels and business expenses.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button variant="outline" size="sm" icon={<FileText size={14}/>} onClick={() => handleExport('Inventory Report')}>Inventory Report</Button>
              <Button variant="outline" size="sm" icon={<FileText size={14}/>} onClick={() => handleExport('Expense Report')}>Expense Report</Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Reports;
