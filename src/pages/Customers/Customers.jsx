import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Edit, Trash2, UserPlus, DollarSign, X } from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import './Customers.css';

const Customers = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      fetchCustomers(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId]);

  const fetchCustomers = async (businessId) => {
    setLoading(true);
    const data = await db.getCollection('customers', businessId);
    setCustomers(data);
    setLoading(false);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!currentUser?.activeBusinessId) return;
    
    setSaving(true);
    try {
      const newCustomer = {
        ...formData,
        totalPurchases: 0,
        totalSpending: 0,
        outstandingBalance: 0,
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      
      await db.add('customers', newCustomer, currentUser.activeBusinessId);
      await fetchCustomers(currentUser.activeBusinessId);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to add customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await db.delete('customers', id, currentUser.activeBusinessId);
      await fetchCustomers(currentUser.activeBusinessId);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-secondary">Manage your clients and their purchase history</p>
        </div>
        <Button icon={<UserPlus size={18} />} onClick={() => setIsModalOpen(true)}>Add Customer</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
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
            <div className="loading-state">Loading customers...</div>
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
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="customer-avatar">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{customer.name}</span>
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
                          <button className="icon-action-btn" title="Edit"><Edit size={16} /></button>
                          <button className="icon-action-btn text-danger" title="Delete" onClick={() => handleDelete(customer.id)}><Trash2 size={16} /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-8">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h2>Add New Customer</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddCustomer} className="modal-form">
              <div className="form-group">
                <label>Customer Name *</label>
                <Input 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. John Doe"
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
                <label>Address</label>
                <textarea 
                  className="karobaar-input"
                  style={{ width: '100%', minHeight: '80px', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="Full Address"
                />
              </div>
              
              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Customer'}
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
