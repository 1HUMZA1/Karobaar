import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Eye, Download, Printer, X, Check, Trash2, Calendar, User, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { db } from '../../services/databaseService';
import { salesService } from '../../services/salesService';
import { useAppContext } from '../../context/AppContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileInvoices } from './MobileInvoices';

const Invoices = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const isMobile = useIsMobile();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState({});
  const [customerList, setCustomerList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);

  // New Invoice Form State
  const [newInvoiceData, setNewInvoiceData] = useState({
    customerId: '',
    customerName: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'Net 15',
    status: 'Pending',
    notes: 'Payment due upon receipt or as specified in terms.',
    items: [
      { id: Date.now(), productId: '', name: '', quantity: 1, unitPrice: 0, total: 0 }
    ],
    taxRate: 5,
    discount: 0
  });

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  useEffect(() => {
    loadData();
  }, [currentUser?.activeBusinessId]);

  const loadData = async () => {
    if (!currentUser?.activeBusinessId) return;
    setLoading(true);
    try {
      const [invs, custs, prods] = await Promise.all([
        db.getCollection('invoices', currentUser.activeBusinessId),
        db.getCollection('customers', currentUser.activeBusinessId),
        db.getCollection('products', currentUser.activeBusinessId)
      ]);
      
      const custMap = {};
      (custs || []).forEach(c => { custMap[c.id] = c.name; });
      
      setCustomers(custMap);
      setCustomerList(custs || []);
      setProductList((prods || []).filter(p => p.status !== 'Inactive'));
      setInvoices((invs || []).sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    const invNum = (inv.invoiceNumber || inv.id || '').toLowerCase();
    const client = (customers[inv.customerId] || inv.customerName || '').toLowerCase();
    return invNum.includes(term) || client.includes(term);
  });

  const formatMoney = (amount) => {
    return `${currencySymbol}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Create Invoice Item Management
  const handleAddItem = () => {
    setNewInvoiceData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: Date.now() + Math.random(), productId: '', name: '', quantity: 1, unitPrice: 0, total: 0 }
      ]
    }));
  };

  const handleRemoveItem = (idx) => {
    setNewInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleItemProductChange = (idx, prodId) => {
    const prod = productList.find(p => p.id === prodId);
    setNewInvoiceData(prev => {
      const items = [...prev.items];
      if (prod) {
        const price = Number(prod.sellingPrice || prod.price || 0);
        const qty = items[idx].quantity || 1;
        items[idx] = {
          ...items[idx],
          productId: prod.id,
          name: prod.name,
          unitPrice: price,
          total: price * qty
        };
      } else {
        items[idx] = {
          ...items[idx],
          productId: '',
          name: '',
          unitPrice: 0,
          total: 0
        };
      }
      return { ...prev, items };
    });
  };

  const handleItemQtyChange = (idx, qtyVal) => {
    const qty = Math.max(1, parseFloat(qtyVal) || 1);
    setNewInvoiceData(prev => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        quantity: qty,
        total: (items[idx].unitPrice || 0) * qty
      };
      return { ...prev, items };
    });
  };

  const handleItemPriceChange = (idx, priceVal) => {
    const price = Math.max(0, parseFloat(priceVal) || 0);
    setNewInvoiceData(prev => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        unitPrice: price,
        total: price * (items[idx].quantity || 1)
      };
      return { ...prev, items };
    });
  };

  const invoiceSubtotal = newInvoiceData.items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  const invoiceTax = (invoiceSubtotal * (Number(newInvoiceData.taxRate) || 0)) / 100;
  const invoiceTotal = Math.max(0, invoiceSubtotal + invoiceTax - (Number(newInvoiceData.discount) || 0));

  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.activeBusinessId) return;

    const validItems = newInvoiceData.items.filter(it => (it.name || it.productId) && it.total > 0);
    if (validItems.length === 0) {
      alert('Please add at least one line item with a price to generate the invoice.');
      return;
    }

    setSavingInvoice(true);
    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const isPaid = newInvoiceData.status === 'Paid';

      const invoicePayload = {
        invoiceNumber,
        customerId: newInvoiceData.customerId || null,
        customerName: newInvoiceData.customerName || customers[newInvoiceData.customerId] || 'Walk-in Customer',
        date: new Date().toISOString(),
        dueDate: newInvoiceData.dueDate,
        subtotal: invoiceSubtotal,
        tax: invoiceTax,
        discount: Number(newInvoiceData.discount) || 0,
        amount: invoiceTotal,
        amountPaid: isPaid ? invoiceTotal : 0,
        balanceDue: isPaid ? 0 : invoiceTotal,
        status: isPaid ? 'Paid' : 'Pending',
        paymentMethod: newInvoiceData.paymentMethod,
        notes: newInvoiceData.notes,
        items: validItems
      };

      // Also record as a Sale in salesService to ensure sales and inventory updates stay consistent!
      await salesService.createSale({
        items: validItems.map(it => ({
          productId: it.productId,
          name: it.name,
          quantity: it.quantity,
          price: it.unitPrice,
          total: it.total
        })),
        customerId: newInvoiceData.customerId || null,
        employeeId: currentUser.id,
        employeeName: currentUser.name || 'Owner',
        paymentMethod: newInvoiceData.paymentMethod,
        subtotal: invoiceSubtotal,
        tax: invoiceTax,
        discount: Number(newInvoiceData.discount) || 0,
        total: invoiceTotal,
        amountPaid: isPaid ? invoiceTotal : 0,
        balanceDue: isPaid ? 0 : invoiceTotal,
        dueDate: newInvoiceData.dueDate,
        businessId: currentUser.activeBusinessId,
        notes: newInvoiceData.notes,
        orderType: 'Invoice'
      });

      await loadData();
      setIsCreateModalOpen(false);
      setNewInvoiceData({
        customerId: '',
        customerName: '',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: 'Net 15',
        status: 'Pending',
        notes: 'Payment due upon receipt.',
        items: [{ id: Date.now(), productId: '', name: '', quantity: 1, unitPrice: 0, total: 0 }],
        taxRate: 5,
        discount: 0
      });
      alert(`Invoice ${invoiceNumber} created and saved successfully!`);
    } catch (err) {
      console.error(err);
      alert('Failed to create invoice: ' + err.message);
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleOpenView = (inv) => {
    setSelectedInvoice(inv);
    setIsViewModalOpen(true);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (isMobile) {
    return (
      <MobileInvoices 
        invoices={invoices}
        customers={customers}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        currencySymbol={currencySymbol}
        loading={loading}
      />
    );
  }

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Invoices & Billing
          </h1>
          <p className="text-secondary">Generate and manage official billing invoices and receipts</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setIsCreateModalOpen(true)}>
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Input 
            placeholder="Search invoice # or customer..." 
            icon={<Search size={18} />}
            className="w-full max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="text-xs font-bold text-text-muted">
            Total Invoices: {filteredInvoices.length}
          </span>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan="7" className="text-center py-12 text-slate-500">Loading invoices...</TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="7" className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={48} className="text-slate-300" />
                      <p className="font-semibold text-text-main">{searchTerm ? 'No invoices match your search.' : 'No invoices generated yet.'}</p>
                      <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                        Create First Invoice
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map(invoice => (
                  <TableRow key={invoice.id} className="hover:bg-[var(--bg-hover)] cursor-pointer" onClick={() => handleOpenView(invoice)}>
                    <TableCell className="font-extrabold text-text-main">#{invoice.invoiceNumber || invoice.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium text-text-secondary">{customers[invoice.customerId] || invoice.customerName || 'Walk-in Customer'}</TableCell>
                    <TableCell className="text-xs text-text-muted">{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs text-text-muted">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="text-right font-extrabold text-text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(invoice.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        invoice.status === 'Paid' 
                          ? 'bg-[var(--success-light)] text-[var(--success-color)]' 
                          : 'bg-[var(--warning-light)] text-[var(--warning-color)]'
                      }`}>
                        {invoice.status || 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          icon={<Eye size={15} />} 
                          title="View & Print Invoice" 
                          onClick={() => handleOpenView(invoice)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CREATE INVOICE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)] mb-4">
              <div>
                <h3 className="text-xl font-extrabold text-text-main flex items-center gap-2">
                  <FileText size={20} /> Create Official Invoice
                </h3>
                <p className="text-xs text-text-secondary">Generate and bill line items to customers</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-[var(--bg-hover)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Customer */}
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase block mb-1">Customer / Client</label>
                  <select 
                    value={newInvoiceData.customerId}
                    onChange={(e) => {
                      const c = customerList.find(cust => cust.id === e.target.value);
                      setNewInvoiceData(prev => ({
                        ...prev,
                        customerId: e.target.value,
                        customerName: c ? c.name : ''
                      }));
                    }}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-text-main text-sm font-semibold"
                  >
                    <option value="">Walk-in Customer</option>
                    {customerList.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase block mb-1">Due Date</label>
                  <input 
                    type="date"
                    value={newInvoiceData.dueDate}
                    onChange={(e) => setNewInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-text-main text-sm font-semibold"
                  />
                </div>

                {/* Payment Status */}
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase block mb-1">Status</label>
                  <select 
                    value={newInvoiceData.status}
                    onChange={(e) => setNewInvoiceData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-text-main text-sm font-semibold"
                  >
                    <option value="Pending">Pending / Unpaid</option>
                    <option value="Paid">Mark as Paid</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Line Items</label>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="text-xs font-bold text-text-main flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Add Product
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto p-1">
                  {newInvoiceData.items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)]">
                      <div className="col-span-5">
                        <select 
                          value={item.productId}
                          onChange={(e) => handleItemProductChange(idx, e.target.value)}
                          className="w-full p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-text-main font-semibold"
                        >
                          <option value="">Select Catalog Product...</option>
                          {productList.map(p => (
                            <option key={p.id} value={p.id}>{p.name} - {formatMoney(p.sellingPrice || p.price)}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                          placeholder="Qty"
                          className="w-full p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-center text-text-main font-bold"
                        />
                      </div>

                      <div className="col-span-2">
                        <input 
                          type="number" 
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                          placeholder="Price"
                          className="w-full p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-right text-text-main font-bold"
                        />
                      </div>

                      <div className="col-span-2 text-right font-extrabold text-xs text-text-main">
                        {formatMoney(item.total)}
                      </div>

                      <div className="col-span-1 text-center">
                        {newInvoiceData.items.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItem(idx)}
                            className="text-text-muted hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] space-y-2">
                <div className="flex justify-between text-xs font-semibold text-text-secondary">
                  <span>Subtotal:</span>
                  <span className="font-bold text-text-main">{formatMoney(invoiceSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                  <span>Tax Rate (%):</span>
                  <input 
                    type="number" 
                    value={newInvoiceData.taxRate}
                    onChange={(e) => setNewInvoiceData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-16 p-1 text-center rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-text-main"
                  />
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                  <span>Discount ({currencySymbol}):</span>
                  <input 
                    type="number" 
                    value={newInvoiceData.discount}
                    onChange={(e) => setNewInvoiceData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    className="w-20 p-1 text-right rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-text-main"
                  />
                </div>
                <div className="flex justify-between text-base font-extrabold text-text-main pt-2 border-t border-[var(--border-color)]">
                  <span>Grand Total:</span>
                  <span>{formatMoney(invoiceTotal)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingInvoice}>
                  {savingInvoice ? 'Saving...' : 'Save & Issue Invoice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW & PRINT INVOICE MODAL */}
      {isViewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl printable-invoice-box">
            <div className="flex justify-between items-start pb-4 border-b border-[var(--border-color)] mb-4">
              <div>
                <h2 className="text-2xl font-black text-text-main tracking-tight">{currentBusiness?.name || 'Karobaar Store'}</h2>
                <p className="text-xs text-text-secondary">{currentBusiness?.address || '123 Commercial Plaza'}</p>
                <p className="text-xs text-text-secondary">{currentBusiness?.phone || '+91 98765 00000'}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider bg-[var(--bg-hover)] text-text-main border border-[var(--border-color)]">
                  {selectedInvoice.status || 'Pending'}
                </span>
                <p className="text-sm font-extrabold text-text-main mt-2">#{selectedInvoice.invoiceNumber || selectedInvoice.id}</p>
                <p className="text-xs text-text-muted">Date: {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                {selectedInvoice.dueDate && (
                  <p className="text-xs text-text-muted">Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            {/* Billed To */}
            <div className="mb-4 p-3 rounded-xl bg-[var(--bg-hover)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Billed To</span>
              <p className="text-sm font-extrabold text-text-main">{customers[selectedInvoice.customerId] || selectedInvoice.customerName || 'Walk-in Customer'}</p>
            </div>

            {/* Items */}
            <div className="mb-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="py-2 font-bold text-text-muted uppercase">Item</th>
                    <th className="py-2 text-center font-bold text-text-muted uppercase">Qty</th>
                    <th className="py-2 text-right font-bold text-text-muted uppercase">Price</th>
                    <th className="py-2 text-right font-bold text-text-muted uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {(selectedInvoice.items && selectedInvoice.items.length > 0) ? (
                    selectedInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 font-bold text-text-main">{it.name || it.productName || `Item #${idx+1}`}</td>
                        <td className="py-2 text-center text-text-secondary">{it.quantity || 1}</td>
                        <td className="py-2 text-right text-text-secondary">{formatMoney(it.price || it.unitPrice || (it.total / (it.quantity || 1)))}</td>
                        <td className="py-2 text-right font-bold text-text-main">{formatMoney(it.total || ((it.quantity || 1) * (it.price || 0)))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2 font-bold text-text-main">Standard Store Order</td>
                      <td className="py-2 text-center text-text-secondary">1</td>
                      <td className="py-2 text-right text-text-secondary">{formatMoney(selectedInvoice.amount)}</td>
                      <td className="py-2 text-right font-bold text-text-main">{formatMoney(selectedInvoice.amount)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-[var(--bg-hover)] space-y-1 text-xs">
              <div className="flex justify-between text-text-secondary font-semibold">
                <span>Total Amount:</span>
                <span className="text-text-main font-extrabold">{formatMoney(selectedInvoice.amount)}</span>
              </div>
              <div className="flex justify-between text-text-secondary font-semibold">
                <span>Amount Paid:</span>
                <span className="text-text-main font-bold">{formatMoney(selectedInvoice.amountPaid || (selectedInvoice.status === 'Paid' ? selectedInvoice.amount : 0))}</span>
              </div>
              <div className="flex justify-between text-text-main font-extrabold text-sm pt-2 border-t border-[var(--border-color)]">
                <span>Balance Due:</span>
                <span>{formatMoney(selectedInvoice.balanceDue || (selectedInvoice.status === 'Paid' ? 0 : selectedInvoice.amount))}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 print:hidden">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
              <Button icon={<Printer size={16} />} onClick={handlePrintInvoice}>
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
