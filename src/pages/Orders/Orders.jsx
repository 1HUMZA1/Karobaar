import React, { useState, useEffect } from 'react';
import { Search, Eye, Download, Printer, X, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { useCollection } from '../../hooks/useCollection';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useAppContext } from '../../context/AppContext';
import { salesService } from '../../services/salesService';
import './Orders.css';

const Orders = () => {
  const { currentUser, currentBusiness } = useAppContext();
  
  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : currentBusiness?.settings?.currency === 'EUR' ? '€' : '$';
  
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  
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
    switch(status) {
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'Refunded': return 'danger';
      case 'Cancelled': return 'danger';
      default: return '';
    }
  };

  const handleRefund = async (orderId) => {
    if (!window.confirm("Are you sure you want to refund this sale? This will restore inventory and update customer totals.")) return;
    try {
      await salesService.refundSale(orderId, currentUser.activeBusinessId);
      alert("Sale refunded successfully.");
      refetch();
    } catch (e) {
      console.error(e);
      alert("Failed to refund sale: " + e.message);
    }
  };

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;
    if (bottom && displayLimit < orders.length) {
      setDisplayLimit(prev => prev + 50);
    }
  };

  return (
    <div className="page-container" onScroll={handleScroll} style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Orders & Invoices
            
          </h1>
          <p className="text-secondary">View and manage all sales transactions</p>
        </div>
      </div>

      <Card>
        <CardHeader style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
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
                      <TableCell className="font-bold">{currencySymbol}{order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`status-badge ${getStatusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          <button className="icon-action-btn" title="View Receipt" onClick={() => setSelectedOrderForInvoice(order)}><Eye size={16} /></button>
                          <button className="icon-action-btn" title="Print Receipt" onClick={() => setSelectedOrderForInvoice(order)}><Printer size={16} /></button>
                          {order.status !== 'Refunded' && (
                            <button className="icon-action-btn text-danger" title="Refund Sale" onClick={() => handleRefund(order.id)}><RotateCcw size={16} /></button>
                          )}
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

      {/* Invoice Modal Popup for Orders History */}
      {selectedOrderForInvoice && (
        <div className="biz-modal-overlay" onClick={() => setSelectedOrderForInvoice(null)}>
          <div className="biz-modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="biz-modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h2 className="text-xl font-bold">Invoice Preview</h2>
            </div>
            <div className="biz-modal-body flex flex-col gap-4">
              <div style={{ fontFamily: "'Courier New', Courier, monospace", padding: "20px", color: "#000", background: "#fff", border: "1px solid var(--border-color)", borderRadius: "8px", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ textAlign: "center", marginBottom: "15px", borderBottom: "2px dashed #000", paddingBottom: "15px" }}>
                  <h2 style={{ margin: "0 0 5px 0", fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>{currentBusiness?.name || 'KAROBAAR'}</h2>
                  <p style={{ margin: 0, fontSize: "12px", color: "#333" }}>Official Receipt</p>
                  {currentBusiness?.phone || currentUser?.phone ? <p style={{ margin: "4px 0 0 0", fontWeight: "bold", fontSize: "12px" }}>Ph: {currentBusiness?.phone || currentUser?.phone}</p> : null}
                </div>
                
                <div style={{ marginBottom: "15px", fontSize: "12px", borderBottom: "2px dashed #000", paddingBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span><strong>Date:</strong> {new Date(selectedOrderForInvoice.date).toLocaleDateString()}</span>
                    <span>{new Date(selectedOrderForInvoice.date).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span><strong>Pay:</strong> {selectedOrderForInvoice.paymentMethod || 'Cash'}</span>
                    <span><strong>Receipt #:</strong> {selectedOrderForInvoice.invoiceNumber}</span>
                  </div>
                  {selectedOrderForInvoice.customerId ? <div style={{ marginTop: "4px" }}><strong>Customer ID:</strong> {selectedOrderForInvoice.customerId}</div> : null}
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "5px 0", borderBottom: "1px solid #000", fontSize: "12px", textTransform: "uppercase" }}>Item</th>
                      <th style={{ textAlign: "left", padding: "5px 0", borderBottom: "1px solid #000", fontSize: "12px", textTransform: "uppercase" }}>Qty</th>
                      <th style={{ textAlign: "right", padding: "5px 0", borderBottom: "1px solid #000", fontSize: "12px", textTransform: "uppercase" }}>Price</th>
                      <th style={{ textAlign: "right", padding: "5px 0", borderBottom: "1px solid #000", fontSize: "12px", textTransform: "uppercase" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrderForInvoice.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: "8px 0", fontSize: "12px", borderBottom: "1px dashed #eee", verticalAlign: "top" }}>{item.name}</td>
                        <td style={{ padding: "8px 0", fontSize: "12px", borderBottom: "1px dashed #eee", verticalAlign: "top" }}>{item.quantity}</td>
                        <td style={{ padding: "8px 0", fontSize: "12px", borderBottom: "1px dashed #eee", verticalAlign: "top", textAlign: "right" }}>{currencySymbol}{Number(item.price).toFixed(2)}</td>
                        <td style={{ padding: "8px 0", fontSize: "12px", borderBottom: "1px dashed #eee", verticalAlign: "top", textAlign: "right" }}>{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderTop: "2px solid #000", paddingTop: "10px", margin: "10px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                    <span>Subtotal</span>
                    <span>{currencySymbol}{(selectedOrderForInvoice.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                    <span>Tax</span>
                    <span>{currencySymbol}{(selectedOrderForInvoice.tax || 0).toFixed(2)}</span>
                  </div>
                  {selectedOrderForInvoice.discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                      <span>Discount</span>
                      <span>-{currencySymbol}{selectedOrderForInvoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", marginTop: "10px", paddingTop: "10px", borderTop: "2px dashed #000", fontWeight: "bold" }}>
                    <span>TOTAL</span>
                    <span>{currencySymbol}{(selectedOrderForInvoice.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", borderTop: "2px dashed #000", paddingTop: "15px", fontWeight: "bold" }}>
                  <p style={{ margin: "0 0 5px 0" }}>Thank you for buying</p>
                  <p style={{ margin: 0 }}>Visit again..!!</p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 flex items-center justify-center gap-2" onClick={() => {
                  setSelectedOrderForInvoice(null);
                  const printContent = `
                    <html>
                      <head>
                        <title>Receipt - ${currentBusiness?.name || 'Karobaar'}</title>
                        <style>
                          body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; width: 320px; margin: 0 auto; background: #fff; }
                          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
                          .header h2 { margin: 0 0 5px 0; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                          .header p { margin: 0; font-size: 12px; color: #333; }
                          .meta { margin-bottom: 15px; font-size: 12px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
                          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                          th { text-align: left; padding: 5px 0; border-bottom: 1px solid #000; font-size: 12px; text-transform: uppercase; }
                          td { padding: 8px 0; font-size: 12px; border-bottom: 1px dashed #eee; vertical-align: top; }
                          .text-right { text-align: right; }
                          .totals { border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
                          .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; font-weight: bold; }
                          .total-row.grand-total { font-size: 18px; margin-top: 10px; padding-top: 10px; border-top: 2px dashed #000; }
                          .footer { text-align: center; margin-top: 20px; font-size: 12px; border-top: 2px dashed #000; padding-top: 15px; font-weight: bold; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h2>${currentBusiness?.name || 'KAROBAAR'}</h2>
                          <p>Official Receipt</p>
                          ${currentBusiness?.phone || currentUser?.phone ? `<p style="margin-top: 4px; font-weight: bold;">Ph: ${currentBusiness?.phone || currentUser?.phone}</p>` : ''}
                        </div>
                        
                        <div class="meta">
                          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span><strong>Date:</strong> ${new Date(selectedOrderForInvoice.date).toLocaleDateString()}</span>
                            <span>${new Date(selectedOrderForInvoice.date).toLocaleTimeString()}</span>
                          </div>
                          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span><strong>Pay:</strong> ${selectedOrderForInvoice.paymentMethod || 'Cash'}</span>
                            <span><strong>Receipt #:</strong> ${selectedOrderForInvoice.invoiceNumber}</span>
                          </div>
                          ${selectedOrderForInvoice.customerId ? `<div style="margin-top: 4px;"><strong>Customer:</strong> ${selectedOrderForInvoice.customerId}</div>` : ''}
                        </div>

                        <table>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Qty</th>
                              <th class="text-right">Price</th>
                              <th class="text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${(selectedOrderForInvoice.items || []).map(item => `
                              <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td class="text-right">${currencySymbol}${Number(item.price).toFixed(2)}</td>
                                <td class="text-right">${currencySymbol}${(Number(item.price) * item.quantity).toFixed(2)}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>

                        <div class="totals">
                          <div class="total-row">
                            <span>Subtotal</span>
                            <span>${currencySymbol}${(selectedOrderForInvoice.subtotal || 0).toFixed(2)}</span>
                          </div>
                          <div class="total-row">
                            <span>Tax</span>
                            <span>${currencySymbol}${(selectedOrderForInvoice.tax || 0).toFixed(2)}</span>
                          </div>
                          ${selectedOrderForInvoice.discount > 0 ? `
                          <div class="total-row">
                            <span>Discount</span>
                            <span>-${currencySymbol}${selectedOrderForInvoice.discount.toFixed(2)}</span>
                          </div>` : ''}
                          <div class="total-row grand-total">
                            <span>TOTAL</span>
                            <span>${currencySymbol}${(selectedOrderForInvoice.total || 0).toFixed(2)}</span>
                          </div>
                        </div>

                        <div class="footer">
                          <p>Thank you for buying</p>
                          <p>Visit again..!!</p>
                        </div>
                      </body>
                    </html>
                  `;
                  const iframe = document.createElement('iframe');
                  iframe.style.display = 'none';
                  document.body.appendChild(iframe);

                  iframe.contentDocument.open();
                  iframe.contentDocument.write(printContent);
                  iframe.contentDocument.close();

                  setTimeout(() => {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    setTimeout(() => {
                      document.body.removeChild(iframe);
                    }, 1000);
                  }, 250);
                }}>
                  <Printer size={18} /> Print Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

