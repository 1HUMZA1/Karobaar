import React, { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle, PackageOpen, X } from 'lucide-react';
import { db } from '../../services/databaseService';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import './Purchases.css';

const Purchases = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    total: '',
    notes: ''
  });

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      fetchPurchases(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId]);

  const fetchPurchases = async (businessId) => {
    setLoading(true);
    const data = await db.getCollection('purchases', businessId);
    const supps = await db.getCollection('suppliers', businessId);
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    setPurchases(sorted);
    setSuppliers(supps);
    setLoading(false);
  };

  const handleReceiveStock = async (purchaseId) => {
    if (!currentUser?.activeBusinessId) return;
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase || purchase.status === 'Received') return;
    
    // Simulate updating inventory
    const products = await db.getCollection('products', currentUser.activeBusinessId);
    if (purchase.items && purchase.items.length > 0) {
      for (const item of purchase.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await db.update('products', product.id, {
            stockQuantity: product.stockQuantity + item.quantity
          }, currentUser.activeBusinessId);
        }
      }
    }

    // Update purchase status
    await db.update('purchases', purchaseId, { status: 'Received' }, currentUser.activeBusinessId);
    fetchPurchases(currentUser.activeBusinessId);
    alert('Stock received and inventory updated successfully!');
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!currentUser?.activeBusinessId) return;

    setSaving(true);
    try {
      const supplier = suppliers.find(s => s.id === formData.supplierId);
      const newPO = {
        poNumber: `PO-${Date.now().toString().slice(-6)}`,
        supplierId: formData.supplierId,
        supplierName: supplier ? supplier.name : 'Unknown',
        total: parseFloat(formData.total),
        notes: formData.notes,
        status: 'Pending',
        date: new Date().toISOString(),
        items: [] // Empty items for simple demo
      };

      await db.add('purchases', newPO, currentUser.activeBusinessId);
      await fetchPurchases(currentUser.activeBusinessId);
      setIsModalOpen(false);
      setFormData({ supplierId: '', total: '', notes: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to create PO');
    } finally {
      setSaving(false);
    }
  };

  const filteredPurchases = purchases.filter(p => 
    (p.poNumber && p.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.supplierName && p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-secondary">Manage supplier orders and receive stock</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>Create PO</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Input 
            placeholder="Search by PO number or supplier..." 
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="purchase-search"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="loading-state">Loading purchases...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map(purchase => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium text-primary">{purchase.poNumber}</TableCell>
                      <TableCell>{format(new Date(purchase.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{purchase.supplierName || 'Unknown'}</TableCell>
                      <TableCell className="font-bold">{currencySymbol}{(purchase.total || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`status-badge ${purchase.status === 'Received' ? 'success' : 'warning'}`}>
                          {purchase.status || 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          {purchase.status === 'Pending' ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              icon={<PackageOpen size={14}/>}
                              onClick={() => handleReceiveStock(purchase.id)}
                            >
                              Receive
                            </Button>
                          ) : (
                            <span className="text-success flex items-center gap-1 text-sm"><CheckCircle size={14}/> Received</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-8">
                      No purchases found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add PO Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h2>Create Purchase Order</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreatePO} className="modal-form">
              <div className="form-group">
                <label>Supplier *</label>
                <select 
                  required
                  className="karobaar-input"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
                  value={formData.supplierId}
                  onChange={e => setFormData({...formData, supplierId: e.target.value})}
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.company || 'N/A'})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Total Amount ({currencySymbol}) *</label>
                <Input 
                  required 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total} 
                  onChange={e => setFormData({...formData, total: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  className="karobaar-input"
                  style={{ width: '100%', minHeight: '80px', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Optional notes"
                />
              </div>
              
              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creating...' : 'Create PO'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
