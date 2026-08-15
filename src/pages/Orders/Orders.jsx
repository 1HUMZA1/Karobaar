import React, { useState, useEffect } from 'react';
import { Search, Eye, Download, Printer } from 'lucide-react';
import { db } from '../../services/databaseService';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await db.getCollection('sales');
    // Sort by newest first
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    setOrders(sorted);
    setLoading(false);
  };

  const filteredOrders = orders.filter(o => 
    o.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Orders & Invoices</h1>
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
            <div className="loading-state">Loading orders...</div>
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
                    <TableCell colSpan="7" className="text-center py-8">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
