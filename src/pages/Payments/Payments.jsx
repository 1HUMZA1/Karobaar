import React, { useState, useEffect } from 'react';
import { CreditCard, Search, DollarSign, Wallet, ArrowRight, UserCheck, CheckCircle2, MessageSquare, Plus, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import { format } from 'date-fns';

const Payments = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' or 'suppliers'
  
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Repayment Modal
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      loadData(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId, activeTab]);

  const loadData = async (businessId) => {
    setLoading(true);
    try {
      if (activeTab === 'customers') {
        const c = await db.getCollection('customers', businessId);
        // Only get customers who have an outstanding balance > 0
        setCustomers(c.filter(cust => cust.outstandingBalance > 0).sort((a, b) => b.outstandingBalance - a.outstandingBalance));
      } else {
        // Supplier logic (placeholder for purchases)
        setCustomers([]); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRepayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(repayAmount);
    if (!amount || amount <= 0 || !selectedEntity) return;

    setProcessing(true);
    try {
      if (activeTab === 'customers') {
        const newBalance = Math.max(0, (selectedEntity.outstandingBalance || 0) - amount);
        
        await db.update('customers', selectedEntity.id, {
          outstandingBalance: newBalance
        }, currentUser.activeBusinessId);
        
        // Refresh
        await loadData(currentUser.activeBusinessId);
      }
      setIsRepayModalOpen(false);
      setRepayAmount('');
      setSelectedEntity(null);
    } catch (err) {
      console.error('Failed to log repayment', err);
      alert('Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendReminder = (customer) => {
    const amount = `${currencySymbol}${customer.outstandingBalance.toLocaleString()}`;
    const text = `Hello ${customer.name},\n\nThis is a friendly reminder from *${currentBusiness?.name || 'our store'}* regarding your pending balance of *${amount}*.\n\nPlease clear the dues at your earliest convenience. Thank you!`;
    const encodedText = encodeURIComponent(text);
    
    // If phone number exists, open WhatsApp directly
    if (customer.phone) {
      // Remove any non-numeric characters for wa.me
      const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
    } else {
      // Otherwise just open WhatsApp Web to select a contact
      window.open(`https://web.whatsapp.com/send?text=${encodedText}`, '_blank');
    }
  };

  const filteredData = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  );

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Credit / Udhaar
          </h1>
          <p className="text-secondary">Manage customer Khata and track pending balances</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          className={`px-6 py-2 rounded-full font-bold transition-colors ${activeTab === 'customers' ? 'bg-primary text-white' : 'bg-[var(--bg-card)] text-text-secondary border border-[var(--border-color)]'}`}
          onClick={() => setActiveTab('customers')}
        >
          Customer Khata (Receivable)
        </button>
        <button 
          className={`px-6 py-2 rounded-full font-bold transition-colors opacity-50 cursor-not-allowed ${activeTab === 'suppliers' ? 'bg-primary text-white' : 'bg-[var(--bg-card)] text-text-secondary border border-[var(--border-color)]'}`}
          title="Supplier credit tracking coming soon"
        >
          Supplier Khata (Payable)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-bg text-warning flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-muted uppercase">Total To Collect</p>
              <p className="text-2xl font-bold text-text-main">{currencySymbol}{totalOutstanding.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger-bg text-danger flex items-center justify-center">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-muted uppercase">Customers with Dues</p>
              <p className="text-2xl font-bold text-text-main">{customers.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Input 
            placeholder="Search by name or phone..." 
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-text-muted text-sm uppercase tracking-wider">
                  <th className="py-4 px-4 font-bold">Customer</th>
                  <th className="py-4 px-4 font-bold text-right">Outstanding Amount</th>
                  <th className="py-4 px-4 font-bold text-center">Reminders</th>
                  <th className="py-4 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-text-muted">Loading khata...</td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map(customer => (
                    <tr key={customer.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                      <td className="py-4 px-4">
                        <div className="font-bold text-text-main">{customer.name}</div>
                        <div className="text-xs text-text-secondary mt-0.5">{customer.phone || 'No phone'}</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-lg text-danger">{currencySymbol}{customer.outstandingBalance.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#25D366]/10 text-[#075E54] hover:bg-[#25D366]/20 font-semibold text-xs transition-colors"
                          onClick={() => handleSendReminder(customer)}
                        >
                          <MessageSquare size={14} /> WhatsApp
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button size="sm" onClick={() => { setSelectedEntity(customer); setIsRepayModalOpen(true); }}>
                          Record Payment
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 size={48} className="text-success opacity-50" />
                        <p>No outstanding balances found! Everyone is paid up.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isRepayModalOpen && selectedEntity && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl p-6 shadow-xl animate-slide-up">
            <h2 className="text-xl font-bold mb-1">Record Repayment</h2>
            <p className="text-sm text-text-secondary mb-6">For {selectedEntity.name}</p>
            
            <div className="bg-danger-bg text-danger p-3 rounded-lg mb-4 flex justify-between items-center">
              <span className="text-sm font-bold uppercase">Current Due</span>
              <span className="font-black text-xl">{currencySymbol}{selectedEntity.outstandingBalance.toLocaleString()}</span>
            </div>

            <form onSubmit={handleRepayment} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount Paid ({currencySymbol})</label>
                <input 
                  type="number"
                  required
                  autoFocus
                  max={selectedEntity.outstandingBalance}
                  className="w-full p-3 text-lg font-bold rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]"
                  value={repayAmount}
                  onChange={e => setRepayAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
                <Button type="button" variant="outline" onClick={() => setIsRepayModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={processing || !repayAmount}>
                  {processing ? 'Saving...' : 'Save Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
