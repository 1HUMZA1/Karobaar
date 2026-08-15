import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Edit, Trash2, Truck, X } from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import './Suppliers.css';

const Suppliers = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      fetchSuppliers(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId]);

  const fetchSuppliers = async (businessId) => {
    setLoading(true);
    const data = await db.getCollection('suppliers', businessId);
    setSuppliers(data);
    setLoading(false);
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!currentUser?.activeBusinessId) return;

    setSaving(true);
    try {
      const newSupplier = {
        ...formData,
        status: 'Active',
        outstandingBalance: 0
      };

      await db.add('suppliers', newSupplier, currentUser.activeBusinessId);
      await fetchSuppliers(currentUser.activeBusinessId);
      setIsModalOpen(false);
      setFormData({
        company: '',
        name: '',
        email: '',
        phone: '',
        address: ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to add supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await db.delete('suppliers', id, currentUser.activeBusinessId);
      await fetchSuppliers(currentUser.activeBusinessId);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.company && s.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
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
            <div className="loading-state">Loading suppliers...</div>
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
                    <TableCell colSpan="6" className="text-center py-8">
                      No suppliers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
