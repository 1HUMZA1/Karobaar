import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Receipt, X } from 'lucide-react';
import { db } from '../../services/databaseService';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import { TableSkeleton } from '../../components/ui/Skeleton';
import './Expenses.css';

const Expenses = () => {
  const { currentUser, currentBusiness } = useAppContext();
  
  const { data: expenses, loading, isRevalidating, mutate, refetch } = useCollection('expenses', currentUser?.activeBusinessId, {
    sortBy: (a, b) => new Date(b.date) - new Date(a.date)
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: 'General',
    amount: '',
    paymentMethod: 'Cash',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  // Debounce search
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!currentUser?.activeBusinessId) return;

    setSaving(true);
    try {
      const newExpense = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      const optimisticExpense = { id: 'temp-' + Date.now(), ...newExpense };
      mutate([optimisticExpense, ...expenses]);

      await db.add('expenses', newExpense, currentUser.activeBusinessId);
      
      setIsModalOpen(false);
      setFormData({
        description: '',
        category: 'General',
        amount: '',
        paymentMethod: 'Cash',
        date: format(new Date(), 'yyyy-MM-dd')
      });
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to add expense');
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      mutate(expenses.filter(e => e.id !== id));
      await db.delete('expenses', id, currentUser.activeBusinessId);
      refetch();
    } catch (err) {
      console.error(err);
      refetch();
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
    e.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  ).slice(0, displayLimit);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;
    if (bottom && displayLimit < expenses.length) {
      setDisplayLimit(prev => prev + 50);
    }
  };

  return (
    <div className="page-container" onScroll={handleScroll} style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Expenses
            {isRevalidating && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>}
          </h1>
          <p className="text-secondary">Track operational costs and business expenses</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>Record Expense</Button>
      </div>

      <div className="expense-stats mb-6">
        <Card className="flex-1">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-secondary text-sm">Total Expenses (All Time)</p>
              <h3 className="text-2xl font-bold text-danger">{currencySymbol}{totalExpenses.toFixed(2)}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center">
              <Receipt size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Input 
            placeholder="Search by description or category..." 
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="expense-search"
          />
          <Button variant="outline" icon={<Filter size={18} />}>Filter</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <span className="category-badge">{expense.category}</span>
                      </TableCell>
                      <TableCell className="font-bold text-danger">
                        {currencySymbol}{parseFloat(expense.amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>{expense.paymentMethod}</TableCell>
                      <TableCell>
                        <button className="icon-action-btn text-danger" onClick={() => handleDelete(expense.id)}><Trash2 size={16} /></button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-12 text-slate-500">
                      No expenses found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {displayLimit < expenses.length && (
            <div className="text-center p-4 text-sm text-slate-500">
              Scroll down to load more...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h2>Record Expense</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddExpense} className="modal-form">
              <div className="form-group">
                <label>Description *</label>
                <Input 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="What was this expense for?"
                />
              </div>
              <div className="form-group">
                <label>Amount ({currencySymbol}) *</label>
                <Input 
                  required 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  className="karobaar-input"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="General">General</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Rent">Rent</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select 
                  className="karobaar-input"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
                  value={formData.paymentMethod}
                  onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <Input 
                  required 
                  type="date"
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              
              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Record Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;

