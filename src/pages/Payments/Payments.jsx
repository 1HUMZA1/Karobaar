import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, Search, DollarSign, Wallet, ArrowRight, UserCheck, 
  CheckCircle2, MessageSquare, Plus, Bell, Building2, Truck, Check, X
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import { format } from 'date-fns';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobilePayments } from './MobilePayments';

const Payments = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' or 'suppliers'
  
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Repayment / Payout Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null); // customer or supplier
  const [payAmount, setPayAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  const loadData = async (businessId) => {
    setLoading(true);
    try {
      if (activeTab === 'customers') {
        const c = await db.getCollection('customers', businessId);
        setCustomers((c || []).filter(cust => (Number(cust.outstandingBalance) || 0) > 0).sort((a, b) => (Number(b.outstandingBalance) || 0) - (Number(a.outstandingBalance) || 0)));
      } else {
        const [suppList, purchList] = await Promise.all([
          db.getCollection('suppliers', businessId),
          db.getCollection('purchases', businessId)
        ]);

        const rawSuppliers = suppList || [];
        const rawPurchases = purchList || [];
        setPurchases(rawPurchases);

        // Group pending PO totals by supplier
        const pendingBySupplier = {};
        rawPurchases.forEach(p => {
          if (p.status === 'Pending' || p.paymentStatus === 'Pending') {
            const suppId = p.supplierId || p.supplierName || 'unknown';
            pendingBySupplier[suppId] = (pendingBySupplier[suppId] || 0) + (Number(p.total) || 0);
          }
        });

        // Compute supplier list with dues
        const enrichedSuppliers = rawSuppliers.map(s => {
          const poDue = pendingBySupplier[s.id] || pendingBySupplier[s.name] || 0;
          const directBalance = Number(s.outstandingBalance || s.pendingBalance || 0);
          const totalDue = poDue > 0 ? poDue : directBalance;
          return {
            ...s,
            totalDue,
            pendingPOCount: rawPurchases.filter(p => (p.supplierId === s.id || p.supplierName === s.name) && (p.status === 'Pending' || p.paymentStatus === 'Pending')).length
          };
        }).filter(s => s.totalDue > 0).sort((a, b) => b.totalDue - a.totalDue);

        setSuppliers(enrichedSuppliers);
      }
    } catch (err) {
      console.error('Error loading khata data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      loadData(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId, activeTab]);

  // Handle Recording Customer Recovery or Supplier Payout
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0 || !selectedEntity) return;

    setProcessing(true);
    try {
      const bizId = currentUser.activeBusinessId;

      if (activeTab === 'customers') {
        // Customer Repayment (Recovery)
        const currentBal = Number(selectedEntity.outstandingBalance) || 0;
        const newBalance = Math.max(0, currentBal - amount);
        
        await db.update('customers', selectedEntity.id, {
          outstandingBalance: newBalance,
          lastPaymentDate: new Date().toISOString()
        }, bizId);

        // Log audit trail
        await db.logAudit(
          'CUSTOMER_REPAYMENT',
          `Collected ${currencySymbol}${amount} from ${selectedEntity.name} via ${paymentMode}. New balance: ${currencySymbol}${newBalance}`,
          currentUser,
          bizId
        );

        alert(`Payment of ${currencySymbol}${amount} recorded successfully from ${selectedEntity.name}!`);
      } else {
        // Supplier Payout
        // 1. Record operating expense
        await db.add('expenses', {
          title: `Supplier Payout: ${selectedEntity.name}`,
          description: `Settlement payment to supplier ${selectedEntity.name}. Notes: ${paymentNotes || 'None'}`,
          category: 'Supplier Payment',
          amount: amount,
          paymentMethod: paymentMode,
          date: new Date().toISOString(),
          recipient: selectedEntity.name
        }, bizId);

        // 2. Mark pending purchase orders as completed/paid if covered
        let remainingPaid = amount;
        const pendingPOs = purchases.filter(p => 
          (p.supplierId === selectedEntity.id || p.supplierName === selectedEntity.name) && 
          (p.status === 'Pending' || p.paymentStatus === 'Pending')
        );

        for (const po of pendingPOs) {
          if (remainingPaid <= 0) break;
          const poTotal = Number(po.total) || 0;
          if (remainingPaid >= poTotal) {
            await db.update('purchases', po.id, {
              status: 'Received',
              paymentStatus: 'Paid'
            }, bizId);
            remainingPaid -= poTotal;
          }
        }

        // 3. Update direct balance if applicable
        if (selectedEntity.outstandingBalance) {
          const updatedSuppBal = Math.max(0, Number(selectedEntity.outstandingBalance) - amount);
          await db.update('suppliers', selectedEntity.id, {
            outstandingBalance: updatedSuppBal
          }, bizId);
        }

        // 4. Log audit trail
        await db.logAudit(
          'SUPPLIER_PAYOUT',
          `Disbursed ${currencySymbol}${amount} payout to supplier ${selectedEntity.name} via ${paymentMode}`,
          currentUser,
          bizId
        );

        alert(`Supplier payout of ${currencySymbol}${amount} to ${selectedEntity.name} recorded successfully!`);
      }

      setIsModalOpen(false);
      setPayAmount('');
      setPaymentNotes('');
      setSelectedEntity(null);
      await loadData(bizId);
    } catch (err) {
      console.error('Failed to log payment:', err);
      alert('Failed to record payment: ' + (err.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleSendReminder = (customer) => {
    const amount = `${currencySymbol}${(customer.outstandingBalance || 0).toLocaleString()}`;
    const text = `Hello ${customer.name},\n\nThis is a friendly reminder from *${currentBusiness?.name || 'our store'}* regarding your pending balance of *${amount}*.\n\nPlease clear the dues at your earliest convenience. Thank you!`;
    const encodedText = encodeURIComponent(text);
    
    if (customer.phone) {
      const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
    } else {
      window.open(`https://web.whatsapp.com/send?text=${encodedText}`, '_blank');
    }
  };

  // Filtered dataset
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.phone && c.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (s.company && s.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm))
    );
  }, [suppliers, searchTerm]);

  const totalCustomerReceivable = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.outstandingBalance) || 0), 0);
  }, [customers]);

  const totalSupplierPayable = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (Number(s.totalDue) || 0), 0);
  }, [suppliers]);

  if (isMobile) {
    return (
      <MobilePayments 
        customers={customers}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currencySymbol={currencySymbol}
        loading={loading}
        totalOutstanding={activeTab === 'customers' ? totalCustomerReceivable : totalSupplierPayable}
        onSendReminder={handleSendReminder}
        onRecordPayment={c => { setSelectedEntity(c); setIsModalOpen(true); }}
      />
    );
  }

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Credit & Khata Ledger
          </h1>
          <p className="text-secondary text-sm">Customer Udhaar recovery tracking and supplier payables settlement</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)] mb-6 gap-2">
        <button 
          className={`pb-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'customers' 
              ? 'border-[var(--text-main)] text-[var(--text-main)] font-bold' 
              : 'border-transparent text-secondary hover:text-[var(--text-main)]'
          }`}
          onClick={() => { setActiveTab('customers'); setSearchTerm(''); }}
        >
          <UserCheck size={16} />
          Customer Khata (Receivables)
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-[var(--text-secondary)] font-mono">
            {customers.length}
          </span>
        </button>

        <button 
          className={`pb-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'suppliers' 
              ? 'border-[var(--text-main)] text-[var(--text-main)] font-bold' 
              : 'border-transparent text-secondary hover:text-[var(--text-main)]'
          }`}
          onClick={() => { setActiveTab('suppliers'); setSearchTerm(''); }}
        >
          <Building2 size={16} />
          Supplier Khata (Payables)
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-[var(--text-secondary)] font-mono">
            {suppliers.length}
          </span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${activeTab === 'customers' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider">
                {activeTab === 'customers' ? 'Total To Collect (Customer Udhaar)' : 'Total To Disburse (Supplier Dues)'}
              </p>
              <h3 className="text-2xl font-bold font-mono text-[var(--text-main)] mt-0.5">
                {currencySymbol}
                {activeTab === 'customers' 
                  ? totalCustomerReceivable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : totalSupplierPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 text-[var(--text-secondary)] flex items-center justify-center font-bold">
              {activeTab === 'customers' ? <UserCheck size={24} /> : <Truck size={24} />}
            </div>
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider">
                {activeTab === 'customers' ? 'Customers with Active Dues' : 'Suppliers with Pending Invoices'}
              </p>
              <h3 className="text-2xl font-bold font-mono text-[var(--text-main)] mt-0.5">
                {activeTab === 'customers' ? customers.length : suppliers.length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card className="border border-[var(--border-color)]">
        <CardHeader className="p-4 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input 
              placeholder={activeTab === 'customers' ? "Search customer by name or phone..." : "Search supplier by name or company..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:border-zinc-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-[var(--text-main)]">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="text-xs text-secondary">
            Showing {activeTab === 'customers' ? filteredCustomers.length : filteredSuppliers.length} records
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {activeTab === 'customers' ? (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-secondary text-xs uppercase">
                    <th className="p-3.5 pl-5">Customer</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5 text-right">Outstanding Udhaar</th>
                    <th className="p-3.5 text-center">Reminders</th>
                    <th className="p-3.5 text-right pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-secondary">Loading Customer Khata...</td>
                    </tr>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map(customer => (
                      <tr key={customer.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                        <td className="p-3.5 pl-5">
                          <div className="font-semibold text-[var(--text-main)]">{customer.name}</div>
                          {customer.address && <div className="text-xs text-secondary truncate max-w-xs">{customer.address}</div>}
                        </td>
                        <td className="p-3.5 font-mono text-xs text-secondary">{customer.phone || '—'}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-amber-400 text-base">
                          {currencySymbol}{(Number(customer.outstandingBalance) || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center">
                          <button 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium text-xs transition-colors border border-emerald-500/20"
                            onClick={() => handleSendReminder(customer)}
                          >
                            <MessageSquare size={13} /> WhatsApp
                          </button>
                        </td>
                        <td className="p-3.5 text-right pr-5">
                          <Button 
                            size="sm" 
                            onClick={() => { setSelectedEntity(customer); setPayAmount(String(customer.outstandingBalance)); setIsModalOpen(true); }}
                            className="h-8 px-3 text-xs"
                          >
                            Record Recovery
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-zinc-500">
                        <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-2 opacity-60" />
                        No outstanding customer Udhaar found. Everyone is paid up!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-secondary text-xs uppercase">
                    <th className="p-3.5 pl-5">Supplier</th>
                    <th className="p-3.5">Company / Contact</th>
                    <th className="p-3.5 text-center">Pending POs</th>
                    <th className="p-3.5 text-right">Amount Payable</th>
                    <th className="p-3.5 text-right pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-secondary">Loading Supplier Khata...</td>
                    </tr>
                  ) : filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map(supplier => (
                      <tr key={supplier.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                        <td className="p-3.5 pl-5">
                          <div className="font-semibold text-[var(--text-main)]">{supplier.name}</div>
                          <div className="text-xs text-secondary font-mono">{supplier.phone || '—'}</div>
                        </td>
                        <td className="p-3.5 text-secondary">{supplier.company || 'Direct Supplier'}</td>
                        <td className="p-3.5 text-center">
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-[var(--text-secondary)] font-mono font-bold">
                            {supplier.pendingPOCount || 1} POs
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-rose-400 text-base">
                          {currencySymbol}{(Number(supplier.totalDue) || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right pr-5">
                          <Button 
                            size="sm" 
                            onClick={() => { setSelectedEntity(supplier); setPayAmount(String(supplier.totalDue)); setIsModalOpen(true); }}
                            className="h-8 px-3 text-xs"
                          >
                            Record Payout
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-zinc-500">
                        <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-2 opacity-60" />
                        No supplier payables pending. All purchase orders settled!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment / Recovery Modal */}
      {isModalOpen && selectedEntity && (
        <div className="biz-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="biz-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="biz-modal-header">
              <h2 className="text-lg font-bold">
                {activeTab === 'customers' ? 'Record Customer Recovery' : 'Record Supplier Payout'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-[var(--text-main)]">
                <X size={20} />
              </button>
            </div>

            <div className="biz-modal-body flex flex-col gap-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <div>
                  <div className="text-xs text-secondary">{activeTab === 'customers' ? 'Customer' : 'Supplier'}</div>
                  <div className="font-bold text-[var(--text-main)] text-base">{selectedEntity.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-secondary">{activeTab === 'customers' ? 'Current Due' : 'Amount Payable'}</div>
                  <div className={`font-mono font-bold text-lg ${activeTab === 'customers' ? 'text-amber-400' : 'text-rose-400'}`}>
                    {currencySymbol}{(Number(selectedEntity.outstandingBalance || selectedEntity.totalDue) || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Payment Amount ({currencySymbol}) *</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  autoFocus
                  className="w-full p-2.5 text-xl font-bold font-mono text-center rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-white focus:outline-none"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. UTR #1092837 or Cash Drawer Settlement"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="biz-modal-footer mt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handlePaymentSubmit} disabled={processing || !payAmount}>
                {processing ? 'Processing...' : activeTab === 'customers' ? 'Confirm Recovery' : 'Disburse Payout'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
