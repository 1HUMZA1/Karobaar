import React, { useState } from 'react';
import { Download, TrendingUp, Users, Box, Banknote, Calendar, BarChart2, Briefcase, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import { format, subDays, startOfDay } from 'date-fns';

const Reports = () => {
  const { currentUser } = useAppContext();
  const [exporting, setExporting] = useState(null);

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
        const products = await db.getCollection('products', bid);
        const rows = [
          ["Product ID", "Name", "Category", "Stock", "Price", "Cost", "Value"],
          ...products.map(p => [p.id, `"${(p.name || '').replace(/"/g, '""')}"`, p.category || '', p.stockQuantity || 0, p.price || 0, p.costPrice || 0, (p.stockQuantity || 0) * (p.price || 0)])
        ];
        downloadCSV(`Inventory_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`, rows);
      } 
      else if (type === 'Expense Report') {
        const expenses = await db.getCollection('expenses', bid);
        const rows = [
          ["Date", "Category", "Description", "Amount", "Payment Method"],
          ...expenses.map(e => [e.date, e.category, `"${(e.description || '').replace(/"/g, '""')}"`, e.amount || 0, e.paymentMethod])
        ];
        downloadCSV(`Expenses_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`, rows);
      }
      else if (type.includes('Sales') || type === 'Profit/Loss') {
         const sales = await db.getCollection('sales', bid);
         
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
         } else if (type === 'Monthly Sales') {
            const monthAgo = subDays(new Date(), 30).getTime();
            const monthly = sales.filter(s => new Date(s.date).getTime() >= monthAgo);
            const rows = [
              ["Invoice ID", "Date", "Customer", "Total Amount", "Status"],
              ...monthly.map(s => [s.invoiceNumber || s.id, s.date, `"${(s.customerName || 'Walk-in').replace(/"/g, '""')}"`, s.total || 0, s.status])
            ];
            downloadCSV(`Monthly_Sales_${format(new Date(), 'yyyy-MM-dd')}.csv`, rows);
         } else if (type === 'Profit/Loss') {
            const expenses = await db.getCollection('expenses', bid);
            const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
            const totalExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
            const rows = [
              ["Metric", "Amount"],
              ["Total Revenue", totalRevenue],
              ["Total Expenses", totalExp],
              ["Net Profit", totalRevenue - totalExp]
            ];
            downloadCSV(`Profit_Loss_${format(new Date(), 'yyyy-MM-dd')}.csv`, rows);
         }
      }
      else if (type === 'Employee Performance') {
         const employees = await db.getCollection('employees', bid);
         const rows = [
           ["Employee ID", "Name", "Role", "Salary"],
           ...employees.map(e => [e.id, `"${(e.name || '').replace(/"/g, '""')}"`, e.role, e.salary || 0])
         ];
         downloadCSV(`Employee_Performance_${format(new Date(), 'yyyy-MM-dd')}.csv`, rows);
      }
      else if (type === 'Product Performance') {
         const products = await db.getCollection('products', bid);
         const rows = [
           ["Product ID", "Name", "Category", "Stock"],
           ...products.map(p => [p.id, `"${(p.name || '').replace(/"/g, '""')}"`, p.category || '', p.stockQuantity || 0])
         ];
         downloadCSV(`Product_Performance_${format(new Date(), 'yyyy-MM-dd')}.csv`, rows);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate report');
    } finally {
      setExporting(null);
    }
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
              <Button variant="outline" size="sm" icon={exporting === 'Daily Sales' ? <Loader2 size={14} className="animate-spin"/> : <Calendar size={14}/>} onClick={() => handleExport('Daily Sales')} disabled={exporting}>Daily Sales</Button>
              <Button variant="outline" size="sm" icon={exporting === 'Weekly Sales' ? <Loader2 size={14} className="animate-spin"/> : <Calendar size={14}/>} onClick={() => handleExport('Weekly Sales')} disabled={exporting}>Weekly Sales</Button>
              <Button variant="outline" size="sm" icon={exporting === 'Monthly Sales' ? <Loader2 size={14} className="animate-spin"/> : <Calendar size={14}/>} onClick={() => handleExport('Monthly Sales')} disabled={exporting}>Monthly Sales</Button>
              <Button variant="outline" size="sm" icon={exporting === 'Profit/Loss' ? <Loader2 size={14} className="animate-spin"/> : <Banknote size={14}/>} onClick={() => handleExport('Profit/Loss')} disabled={exporting}>Profit/Loss</Button>
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
              <Button variant="outline" size="sm" icon={exporting === 'Product Performance' ? <Loader2 size={14} className="animate-spin"/> : <Box size={14}/>} onClick={() => handleExport('Product Performance')} disabled={exporting}>Product Performance</Button>
              <Button variant="outline" size="sm" icon={exporting === 'Employee Performance' ? <Loader2 size={14} className="animate-spin"/> : <Users size={14}/>} onClick={() => handleExport('Employee Performance')} disabled={exporting}>Employee Performance</Button>
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
              <Button variant="outline" size="sm" icon={exporting === 'Inventory Report' ? <Loader2 size={14} className="animate-spin"/> : <FileText size={14}/>} onClick={() => handleExport('Inventory Report')} disabled={exporting}>Inventory Report</Button>
              <Button variant="outline" size="sm" icon={exporting === 'Expense Report' ? <Loader2 size={14} className="animate-spin"/> : <FileText size={14}/>} onClick={() => handleExport('Expense Report')} disabled={exporting}>Expense Report</Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Reports;
