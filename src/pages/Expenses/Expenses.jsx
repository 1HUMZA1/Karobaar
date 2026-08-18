import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Receipt, ArrowRightLeft, DollarSign, Wallet, Landmark, Smartphone, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { db } from '../../services/databaseService';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import './Expenses.css';

const DEFAULT_ACCOUNTS = [
  { id: 'acc-cash', name: 'Main Cash Drawer', type: 'Cash', balance: 0 },
  { id: 'acc-bank', name: 'Primary Bank Account', type: 'Bank', balance: 0 }
];

const Expenses = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, accounts, ledger, expenses
  
  const { data: expenses, mutate: mutateExpenses, refetch: refetchExpenses } = useCollection('expenses', currentUser?.activeBusinessId, { sortBy: (a, b) => new Date(b.date) - new Date(a.date) });
  const { data: sales } = useCollection('sales', currentUser?.activeBusinessId);
  const { data: dbAccounts, mutate: mutateAccounts, refetch: refetchAccounts } = useCollection('accounts', currentUser?.activeBusinessId);
  const { data: transfers, mutate: mutateTransfers, refetch: refetchTransfers } = useCollection('transfers', currentUser?.activeBusinessId, { sortBy: (a, b) => new Date(b.date) - new Date(a.date) });

  const [accounts, setAccounts] = useState([]);
  
  useEffect(() => {
    if (dbAccounts && dbAccounts.length > 0) {
      setAccounts(dbAccounts);
    } else if (dbAccounts && dbAccounts.length === 0) {
      // Seed default accounts
      const seed = async () => {
        const accs = [];
        for (const acc of DEFAULT_ACCOUNTS) {
          const added = await db.add('accounts', { ...acc, createdAt: new Date().toISOString() }, currentUser?.activeBusinessId);
          accs.push({ ...acc, id: added.id });
        }
        setAccounts(accs);
        refetchAccounts();
      };
      if (currentUser?.activeBusinessId) seed();
    }
  }, [dbAccounts, currentUser?.activeBusinessId, refetchAccounts]);

  // Unified Ledger Generation
  const [ledger, setLedger] = useState([]);
  useEffect(() => {
    const unified = [];
    
    // Add Sales (Income)
    sales?.forEach(s => {
      if (s.status !== 'cancelled' && s.status !== 'Refunded') {
        unified.push({
          id: s.id,
          date: s.date,
          type: 'Income',
          description: `Sale #${s.invoiceNumber}`,
          amount: s.amountPaid || s.total,
          source: 'Sales'
        });
      }
    });

    // Add Expenses (Outflow)
    expenses?.forEach(e => {
      unified.push({
        id: e.id,
        date: e.date,
        type: 'Expense',
        description: e.description,
        category: e.category,
        amount: e.amount,
        isRecurring: e.isRecurring
      });
    });

    // Add Transfers
    transfers?.forEach(t => {
      unified.push({
        id: t.id,
        date: t.date,
        type: 'Transfer',
        description: `Transfer: ${t.fromAccountName} → ${t.toAccountName}`,
        amount: t.amount
      });
    });

    unified.sort((a, b) => new Date(b.date) - new Date(a.date));
    setLedger(unified);
  }, [sales, expenses, transfers]);

  // Calculations
  const totalRevenue = sales?.filter(s => s.status !== 'cancelled' && s.status !== 'Refunded').reduce((sum, s) => sum + (s.amountPaid || s.total || 0), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const netProfit = totalRevenue - totalExpenses;
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0) + netProfit; // Simplified balance calculation for demo

  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [accForm, setAccForm] = useState({ name: '', type: 'Bank', initialBalance: 0 });
  const [transferForm, setTransferForm] = useState({ fromId: '', toId: '', amount: '' });
  const [expenseForm, setExpenseForm] = useState({ description: '', category: 'Operations', amount: '', accountId: '', date: format(new Date(), 'yyyy-MM-dd'), isRecurring: false });
  const [saving, setSaving] = useState(false);

  const getAccountIcon = (type) => {
    switch (type) {
      case 'Bank': return <Building2 size={24} className="text-blue-500" />;
      case 'UPI': return <Smartphone size={24} className="text-purple-500" />;
      case 'Cash': return <Wallet size={24} className="text-emerald-500" />;
      default: return <Landmark size={24} className="text-slate-500" />;
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.add('accounts', {
        name: accForm.name,
        type: accForm.type,
        balance: parseFloat(accForm.initialBalance) || 0,
        createdAt: new Date().toISOString()
      }, currentUser.activeBusinessId);
      setIsAccountModalOpen(false);
      setAccForm({ name: '', type: 'Bank', initialBalance: 0 });
      refetchAccounts();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (transferForm.fromId === transferForm.toId) return alert("Cannot transfer to the same account");
    const amount = parseFloat(transferForm.amount);
    if (!amount || amount <= 0) return;

    setSaving(true);
    try {
      const fromAcc = accounts.find(a => a.id === transferForm.fromId);
      const toAcc = accounts.find(a => a.id === transferForm.toId);

      await db.update('accounts', fromAcc.id, { balance: (fromAcc.balance || 0) - amount }, currentUser.activeBusinessId);
      await db.update('accounts', toAcc.id, { balance: (toAcc.balance || 0) + amount }, currentUser.activeBusinessId);

      await db.add('transfers', {
        fromAccountId: fromAcc.id,
        fromAccountName: fromAcc.name,
        toAccountId: toAcc.id,
        toAccountName: toAcc.name,
        amount,
        date: new Date().toISOString()
      }, currentUser.activeBusinessId);

      setIsTransferModalOpen(false);
      setTransferForm({ fromId: '', toId: '', amount: '' });
      refetchAccounts();
      refetchTransfers();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const amount = parseFloat(expenseForm.amount);
      await db.add('expenses', {
        ...expenseForm,
        amount,
      }, currentUser.activeBusinessId);
      
      // Deduct from selected account if any
      if (expenseForm.accountId) {
        const acc = accounts.find(a => a.id === expenseForm.accountId);
        if (acc) {
          await db.update('accounts', acc.id, { balance: (acc.balance || 0) - amount }, currentUser.activeBusinessId);
        }
      }

      setIsExpenseModalOpen(false);
      setExpenseForm({ description: '', category: 'Operations', amount: '', accountId: '', date: format(new Date(), 'yyyy-MM-dd'), isRecurring: false });
      refetchExpenses();
      refetchAccounts();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Finance & Banking
          </h1>
          <p className="text-secondary">Complete overview of accounts, expenses, and cash flow</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<ArrowRightLeft size={18} />} onClick={() => setIsTransferModalOpen(true)}>Transfer</Button>
          <Button icon={<Plus size={18} />} onClick={() => setIsExpenseModalOpen(true)}>Record Expense</Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-[var(--border-color)] overflow-x-auto">
        {['dashboard', 'accounts', 'ledger', 'expenses'].map(tab => (
          <button 
            key={tab}
            className={`px-4 py-3 font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-primary text-white border-none shadow-md">
                <CardContent className="p-6">
                  <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Total Network Balance</p>
                  <h2 className="text-3xl font-black">{currencySymbol}{totalBalance.toLocaleString()}</h2>
                  <p className="text-sm mt-4 text-white/90 flex items-center gap-2">
                    <Landmark size={16}/> Across {accounts.length} active accounts
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <p className="text-text-muted text-sm font-semibold uppercase tracking-wider mb-1">Cash In (Income)</p>
                    <h2 className="text-2xl font-bold text-success">{currencySymbol}{totalRevenue.toLocaleString()}</h2>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success-bg text-success flex items-center justify-center">
                    <TrendingUp size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <p className="text-text-muted text-sm font-semibold uppercase tracking-wider mb-1">Cash Out (Expenses)</p>
                    <h2 className="text-2xl font-bold text-danger">{currencySymbol}{totalExpenses.toLocaleString()}</h2>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-danger-bg text-danger flex items-center justify-center">
                    <TrendingDown size={24} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><h3 className="font-bold text-lg">Quick Accounts Overview</h3></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {accounts.map(acc => (
                    <div key={acc.id} className="p-4 border border-[var(--border-color)] rounded-xl flex items-center gap-4 bg-[var(--bg-elevated)]">
                      <div className="p-2 bg-[var(--bg-card)] rounded-lg shadow-sm">
                        {getAccountIcon(acc.type)}
                      </div>
                      <div>
                        <p className="font-bold text-text-main line-clamp-1">{acc.name}</p>
                        <p className="text-sm font-semibold text-text-secondary">{currencySymbol}{(acc.balance || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Bank & Cash Accounts</h2>
              <Button size="sm" icon={<Plus size={16}/>} onClick={() => setIsAccountModalOpen(true)}>Add Account</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map(acc => (
                <Card key={acc.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        {getAccountIcon(acc.type)}
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{acc.name}</h3>
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{acc.type} Account</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[var(--border-color)]">
                      <p className="text-sm text-text-secondary mb-1">Available Balance</p>
                      <p className="text-2xl font-black text-text-main">{currencySymbol}{(acc.balance || 0).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Unified Transaction Ledger</h3>
                <Input placeholder="Search ledger..." icon={<Search size={16}/>} className="max-w-xs" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-text-muted text-sm uppercase tracking-wider">
                      <th className="p-4 font-bold">Date</th>
                      <th className="p-4 font-bold">Description</th>
                      <th className="p-4 font-bold">Type</th>
                      <th className="p-4 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.slice(0, 50).map((txn, i) => (
                      <tr key={`${txn.id}-${i}`} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                        <td className="p-4 whitespace-nowrap text-text-secondary text-sm">{format(new Date(txn.date), 'MMM dd, yyyy HH:mm')}</td>
                        <td className="p-4 font-medium text-text-main">{txn.description}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            txn.type === 'Income' ? 'bg-success-bg text-success' : 
                            txn.type === 'Expense' ? 'bg-danger-bg text-danger' : 
                            'bg-primary-bg text-primary'
                          }`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className={`p-4 text-right font-bold ${
                          txn.type === 'Income' ? 'text-success' : 
                          txn.type === 'Expense' ? 'text-danger' : 
                          'text-text-main'
                        }`}>
                          {txn.type === 'Expense' ? '-' : txn.type === 'Income' ? '+' : ''}{currencySymbol}{txn.amount?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {ledger.length === 0 && (
                      <tr><td colSpan="4" className="text-center p-8 text-text-muted">No transactions found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'expenses' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Expense Management</h3>
                <Button size="sm" icon={<Plus size={16}/>} onClick={() => setIsExpenseModalOpen(true)}>Record Expense</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-text-muted text-sm uppercase tracking-wider">
                      <th className="p-4 font-bold">Date</th>
                      <th className="p-4 font-bold">Description</th>
                      <th className="p-4 font-bold">Category</th>
                      <th className="p-4 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses?.map(exp => (
                      <tr key={exp.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                        <td className="p-4 whitespace-nowrap text-text-secondary text-sm">{format(new Date(exp.date), 'MMM dd, yyyy')}</td>
                        <td className="p-4">
                          <div className="font-medium text-text-main flex items-center gap-2">
                            {exp.description}
                            {exp.isRecurring && <span className="text-[10px] bg-primary-bg text-primary px-1.5 py-0.5 rounded uppercase font-bold">Recurring</span>}
                          </div>
                        </td>
                        <td className="p-4"><span className="text-xs bg-[var(--bg-elevated)] border border-[var(--border-color)] px-2 py-1 rounded-md">{exp.category}</span></td>
                        <td className="p-4 text-right font-bold text-danger">{currencySymbol}{exp.amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!expenses || expenses.length === 0) && (
                      <tr><td colSpan="4" className="text-center p-8 text-text-muted">No expenses recorded yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl p-6 shadow-xl animate-slide-up">
            <h2 className="text-xl font-bold mb-4">Add Account</h2>
            <form onSubmit={handleAddAccount} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Account Name</label>
                <Input required value={accForm.name} onChange={e => setAccForm({...accForm, name: e.target.value})} placeholder="e.g. HDFC Current Acc" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]" value={accForm.type} onChange={e => setAccForm({...accForm, type: e.target.value})}>
                  <option value="Bank">Bank Account</option>
                  <option value="Cash">Cash Drawer</option>
                  <option value="UPI">UPI / Digital Wallet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Opening Balance ({currencySymbol})</label>
                <Input type="number" required value={accForm.initialBalance} onChange={e => setAccForm({...accForm, initialBalance: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
                <Button type="button" variant="outline" onClick={() => setIsAccountModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Account'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl p-6 shadow-xl animate-slide-up">
            <h2 className="text-xl font-bold mb-4">Internal Transfer</h2>
            <form onSubmit={handleTransfer} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">From Account</label>
                <select required className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]" value={transferForm.fromId} onChange={e => setTransferForm({...transferForm, fromId: e.target.value})}>
                  <option value="">Select source account...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({currencySymbol}{a.balance})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To Account</label>
                <select required className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]" value={transferForm.toId} onChange={e => setTransferForm({...transferForm, toId: e.target.value})}>
                  <option value="">Select destination account...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount ({currencySymbol})</label>
                <Input type="number" required min="1" value={transferForm.amount} onChange={e => setTransferForm({...transferForm, amount: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
                <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving || !transferForm.fromId || !transferForm.toId}>{saving ? 'Processing...' : 'Transfer Funds'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl p-6 shadow-xl animate-slide-up">
            <h2 className="text-xl font-bold mb-4">Record Expense</h2>
            <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <Input required value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="e.g. Monthly Rent" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount ({currencySymbol}) *</label>
                  <Input type="number" required min="0" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                    <option value="Operations">Operations</option>
                    <option value="Rent">Rent</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Inventory">Inventory Purchases</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Paid From Account</label>
                  <select className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]" value={expenseForm.accountId} onChange={e => setExpenseForm({...expenseForm, accountId: e.target.value})}>
                    <option value="">None / External</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-primary" checked={expenseForm.isRecurring} onChange={e => setExpenseForm({...expenseForm, isRecurring: e.target.checked})} />
                    <span className="text-sm font-medium">Mark as Recurring Expense</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
                <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Record Expense'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
