import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Edit, Trash2, Truck, X } from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import { TableSkeleton } from '../../components/ui/Skeleton';
import './Suppliers.css';

const Suppliers = () => {
  const { currentUser, currentBusiness } = useAppContext();
  
  const { data: suppliers, loading, isRevalidating, mutate, refetch } = useCollection('suppliers', currentUser?.activeBusinessId, {
    sortBy: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company: '', name: '', email: '', phone: '', address: ''
  });

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  // Debounce search
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!currentUser?.activeBusinessId) return;

    setSaving(true);
    try {
      const newSupplier = {
        ...formData,
        status: 'Active',
        outstandingBalance: 0,
        createdAt: new Date().toISOString()
      };

      const optimisticSupplier = { id: 'temp-' + Date.now(), ...newSupplier };
      mutate([optimisticSupplier, ...suppliers]);

      await db.add('suppliers', newSupplier, currentUser.activeBusinessId);
      
      setIsModalOpen(false);
      setFormData({ company: '', name: '', email: '', phone: '', address: '' });
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to add supplier');
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      mutate(suppliers.filter(s => s.id !== id));
      await db.delete('suppliers', id, currentUser.activeBusinessId);
      refetch();
    } catch (err) {
      console.error(err);
      refetch();
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    (s.name && s.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) || 
    (s.company && s.company.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
  ).slice(0, displayLimit);

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;
    if (bottom && displayLimit < suppliers.length) {
      setDisplayLimit(prev => prev + 50);
    }
  };

  return (
    <div className="page-container animate-fade-in" onScroll={handleScroll} style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Suppliers
            {isRevalidating && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>}
          </h1>
          <p className="text-secondary">Manage your vendors and supply chain partners</p>
        </div>
        <Button icon={<Truck size={18} />} onClick={() => setIsModalOpen(true)}>Add Supplier</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Input 
            placeholder="Search by name, company, or email..." 
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="supplier-search"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Outstanding Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map(supplier => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.company || 'N/A'}</TableCell>
                      <TableCell>{supplier.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm text-secondary">
                          <span className="flex items-center gap-1"><Mail size={12}/> {supplier.email || 'N/A'}</span>
                          <span className="flex items-center gap-1"><Phone size={12}/> {supplier.phone || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${supplier.outstandingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                          {currencySymbol}{(supplier.outstandingBalance || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`status-badge ${supplier.status === 'Active' ? 'active' : 'inactive'}`}>
                          {supplier.status || 'Active'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          <button className="icon-action-btn"><Edit size={16} /></button>
                          <button className="icon-action-btn text-danger" onClick={() => handleDelete(supplier.id)}><Trash2 size={16} /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-12 text-slate-500">
                      No suppliers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {displayLimit < suppliers.length && (
            <div className="text-center p-4 text-sm text-slate-500">
              Scroll down to load more...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h2>Add New Supplier</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddSupplier} className="modal-form">
              <div className="form-group">
                <label>Company Name *</label>
                <Input 
                  required 
                  value={formData.company} 
                  onChange={e => setFormData({...formData, company: e.target.value})}
                  placeholder="e.g. ABC Distributors"
                />
              </div>
              <div className="form-group">
                <label>Contact Person *</label>
                <Input 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. John Smith"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <Input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="e.g. sales@abcdistributors.com"
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
                  {saving ? 'Saving...' : 'Add Supplier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
