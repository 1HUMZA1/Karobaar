import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';

const Invoices = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUser?.activeBusinessId]);

  const loadData = async () => {
    if (!currentUser?.activeBusinessId) return;
    setLoading(true);
    try {
      const invs = await db.getCollection('invoices', currentUser.activeBusinessId);
      const custs = await db.getCollection('customers', currentUser.activeBusinessId);
      
      const custMap = {};
      custs.forEach(c => custMap[c.id] = c.name);
      
      setCustomers(custMap);
      setInvoices(invs.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customers[inv.customerId] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currency = currentBusiness?.settings?.currency || 'USD';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
  };

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Invoices
          </h1>
          <p className="text-secondary">Generate and manage billing invoices</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => alert('Invoice Generation module is currently in development.')}>Create Invoice</Button>
      </div>

      <Card>
        <CardHeader style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Input 
            placeholder="Search invoices..." 
            icon={<Search size={18} />}
            className="w-full max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan="6" className="text-center py-12 text-slate-500">Loading invoices...</TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="6" className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={48} className="text-slate-300" />
                      <p>{searchTerm ? 'No invoices match your search.' : 'No invoices generated yet.'}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{customers[invoice.customerId] || 'Walk-in Customer'}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: '500',
                        backgroundColor: invoice.status === 'Paid' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                        color: invoice.status === 'Paid' ? '#16a34a' : '#ca8a04'
                      }}>
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" icon={<Eye size={16} />} title="View" />
                        <Button variant="outline" size="sm" icon={<Download size={16} />} title="Download" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;
