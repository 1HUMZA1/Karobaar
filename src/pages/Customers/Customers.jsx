import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Edit, Trash2, UserPlus, DollarSign, X } from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { CustomerProfile } from './CustomerProfile';
import './Customers.css';

const Customers = () => {
  const { currentUser, currentBusiness } = useAppContext();
  
  const { data: customers, loading, isRevalidating, mutate, refetch } = useCollection('customers', currentUser?.activeBusinessId, {
    sortBy: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', customerType: 'Retail', notes: ''
  });

  const openEditModal = (customer, e) => {
    e.stopPropagation();
    setFormData({
      ...customer,
      customerType: customer.customerType || 'Retail',
      notes: customer.notes || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeAndResetModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setFormData({ name: '', email: '', phone: '', address: '', customerType: 'Retail', notes: '' });
  };

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  // Debounce search
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!currentUser?.activeBusinessId) return;
    
    setSaving(true);
    try {
      const customerData = {
        ...formData,
        totalPurchases: formData.totalPurchases || 0,
        totalSpending: formData.totalSpending || 0,
        outstandingBalance: formData.outstandingBalance || 0,
        status: formData.status || 'Active',
        createdAt: formData.createdAt || new Date().toISOString()
      };
      
      if (isEditing) {
        mutate(customers.map(c => c.id === formData.id ? customerData : c), false);
        await db.update('customers', formData.id, customerData);
        if (selectedCustomer?.id === formData.id) setSelectedCustomer(customerData);
      } else {
        const optimisticCustomer = { id: 'temp-' + Date.now(), ...customerData };
        mutate([optimisticCustomer, ...customers], false);
        await db.add('customers', customerData, currentUser.activeBusinessId);
      }
      
      closeAndResetModal();
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to add customer');
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      mutate(customers.filter(c => c.id !== id));
      await db.delete('customers', id, currentUser.activeBusinessId);
      refetch();
    } catch (err) {
      console.error(err);
      refetch();
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(debouncedSearchTerm))
  ).slice(0, displayLimit);

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;
    if (bottom && displayLimit < customers.length) {
      setDisplayLimit(prev => prev + 50);
    }
  };

  if (selectedCustomer) {
    return (
      <div className="page-container" style={{ height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>
        <CustomerProfile 
          customer={selectedCustomer} 
          onBack={() => setSelectedCustomer(null)}
          businessId={currentUser.activeBusinessId}
          currencySymbol={currencySymbol}
        />
      </div>
    );
  }

  return (
    <div className="page-container" onScroll={handleScroll} style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Customers
            
          </h1>
          <p className="text-secondary">Manage your clients and their purchase history</p>
        </div>
        <Button icon={<UserPlus size={18} />} onClick={() => setIsModalOpen(true)}>Add Customer</Button>
      </div>

      <Card>
        <CardHeader style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Input 
            placeholder="Search by name, email, or phone..." 
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="customer-search"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Total Purchases</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => (
                    <TableRow 
                      key={customer.id} 
                      className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="customer-avatar">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium block">{customer.name}</span>
                            {customer.customerType && (
                              <span className="text-[10px] uppercase font-bold text-text-muted mt-0.5 block">{customer.customerType}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm text-secondary">
                          <span className="flex items-center gap-1"><Mail size={12}/> {customer.email || 'N/A'}</span>
                          <span className="flex items-center gap-1"><Phone size={12}/> {customer.phone || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{customer.totalPurchases || 0} orders</TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">
                          {currencySymbol}{(customer.totalSpending || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${customer.outstandingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                          {currencySymbol}{(customer.outstandingBalance || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          <button className="icon-action-btn" title="Edit" onClick={() => openEditModal(customer)}><Edit size={16} /></button>
                          <button className="icon-action-btn text-danger" title="Delete" onClick={() => handleDelete(customer.id)}><Trash2 size={16} /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-12 text-slate-500">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {displayLimit < customers.length && (
            <div className="text-center p-4 text-sm text-slate-500">
              Scroll down to load more...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button className="close-btn" onClick={closeAndResetModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddCustomer} className="modal-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group md:col-span-2">
                  <label>Customer Name *</label>
                  <Input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <Input 
                    required 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. +1 234 567 8900"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <Input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g. john@example.com"
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label>Customer Type</label>
                  <select 
                    className="karobaar-input"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', outline: 'none' }}
                    value={formData.customerType}
                    onChange={e => setFormData({...formData, customerType: e.target.value})}
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="VIP">VIP</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                <div className="form-group md:col-span-2">
                  <label>Address</label>
                  <textarea 
                    className="karobaar-input"
                    style={{ width: '100%', minHeight: '60px', padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', outline: 'none' }}
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Full Address"
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label>CRM Notes (Optional)</label>
                  <textarea 
                    className="karobaar-input"
                    style={{ width: '100%', minHeight: '60px', padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', outline: 'none' }}
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Internal notes about this customer"
                  />
                </div>
              </div>
              
              <div className="modal-actions mt-4">
                <Button type="button" variant="outline" onClick={closeAndResetModal}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Customer')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
