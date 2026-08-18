import React from 'react';
import { Download, TrendingUp, Users, Box, Banknote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const Reports = () => {
  const handleExport = (type) => {
    alert(`Exporting ${type} report to CSV...`);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-secondary">Generate and export business insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp size={20} className="text-primary"/> Sales & Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-secondary mb-4">Export detailed transaction history, tax reports, and revenue summaries.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={() => handleExport('Sales')}>Sales CSV</Button>
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={() => handleExport('Tax')}>Tax Report</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Box size={20} className="text-warning"/> Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-secondary mb-4">Export current stock levels, valuation, and low stock warnings.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={() => handleExport('Inventory')}>Stock Levels CSV</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users size={20} className="text-info"/> Customers & CRM</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-secondary mb-4">Export customer directory, purchase history, and outstanding balances.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={() => handleExport('Customers')}>Customer Directory</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Banknote size={20} className="text-success"/> HR & Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-secondary mb-4">Export employee list, attendance logs, and payroll summaries.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={() => handleExport('Payroll')}>Payroll Summary</Button>
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={() => handleExport('Attendance')}>Attendance Log</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
