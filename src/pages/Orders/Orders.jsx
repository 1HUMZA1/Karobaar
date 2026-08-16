import React, { useState, useEffect } from 'react';
import { Search, Eye, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { useCollection } from '../../hooks/useCollection';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useAppContext } from '../../context/AppContext';
import './Orders.css';

const Orders = () => {
  const { currentUser } = useAppContext();
  
  // Use SWR Hook instead of blocking fetch
  const { data: orders, loading, isRevalidating } = useCollection('sales', currentUser?.activeBusinessId, {
    sortBy: (a, b) => new Date(b.date) - new Date(a.date)
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Pagination
  const [displayLimit, setDisplayLimit] = useState(50);

  // Debounce search
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const filteredOrders = orders.filter(o => 
    o.invoiceNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  ).slice(0, displayLimit);

  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  };

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;
    if (bottom && displayLimit < orders.length) {
      setDisplayLimit(prev => prev + 50);
    }
  };

  return (
    <div className="page-container animate-fade-in" onScroll={handleScroll} style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Orders & Invoices
            {isRevalidating && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>}
          </h1>
          <p className="text-secondary">View and manage all sales transactions</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Input 
            placeholder="Search by invoice number..." 
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="order-search"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={10} cols={7} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-primary">{order.invoiceNumber}</TableCell>
                      <TableCell>{format(new Date(order.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{order.customerId ? order.customerId : 'Walk-in'}</TableCell>
                      <TableCell>{order.paymentMethod}</TableCell>
                      <TableCell className="font-bold">${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`status-badge ${getStatusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          <button className="icon-action-btn" title="View"><Eye size={16} /></button>
                          <button className="icon-action-btn" title="Download PDF" onClick={() => alert('PDF generation initiated.')}><Download size={16} /></button>
                          <button className="icon-action-btn" title="Print" onClick={() => window.print()}><Printer size={16} /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="7" className="text-center py-12 text-slate-500">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {displayLimit < orders.length && (
            <div className="text-center p-4 text-sm text-slate-500">
              Scroll down to load more...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;

