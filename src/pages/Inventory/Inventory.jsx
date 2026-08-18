import React, { useState } from 'react';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, RefreshCw, PackagePlus, X, Plus, Trash2, Edit, Image as ImageIcon, Upload } from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import { TableSkeleton } from '../../components/ui/Skeleton';
import './Inventory.css';

const PRODUCT_RECOMMENDATIONS = {
  'Retail': ['T-Shirt', 'Jeans', 'Sneakers', 'Handbag', 'Sunglasses'],
  'Wholesale': ['Bulk Rice', 'Steel Pipes', 'Cotton Rolls', 'Pallet of Water'],
  'E-commerce': ['Wireless Mouse', 'Phone Case', 'USB Cable', 'Bluetooth Speaker'],
  'Services': ['Consultation Hour', 'Premium Service', 'Basic Maintenance'],
  'Manufacturing': ['Raw Plastic', 'Metal Screws', 'Wood Planks'],
  'Cafeteria / Restaurant': ['Espresso', 'Cappuccino', 'Sandwich', 'Pastry', 'Burger', 'French Fries'],
  'Other': ['General Item', 'Custom Product']
};

const Inventory = () => {
  const { currentUser, currentBusiness, userRole } = useAppContext();
  const canManageInventory = ['OWNER', 'MANAGER', 'INVENTORY'].includes(userRole);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  
  const [newProduct, setNewProduct] = useState({ 
    name: '', sku: '', stockQuantity: 0, minimumStock: 5, purchasePrice: 0, sellingPrice: 0, imageUrl: '',
    barcode: '', category: '', brand: '', status: 'Active',
    isBundle: false, requiresSerial: false, warrantyPeriod: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustReason, setAdjustReason] = useState('Count Error');
  const [adjustQuantity, setAdjustQuantity] = useState(0);

  const [receiveItems, setReceiveItems] = useState([{ id: Date.now(), productId: '', quantity: 1, batchNumber: '', expiryDate: '', serialNumbers: '', notes: '' }]);

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const { data: inventory, loading, isRevalidating, refetch } = useCollection('products', currentUser?.activeBusinessId, {
    sortBy: (a, b) => (a.stockQuantity || 0) - (b.stockQuantity || 0)
  });

  const totalItems = inventory.reduce((sum, item) => sum + (item.stockQuantity || 0), 0);
  const stockValuation = inventory.reduce((sum, item) => sum + ((item.stockQuantity || 0) * (item.purchasePrice || 0)), 0);
  const lowStock = inventory.filter(item => (item.stockQuantity || 0) > 0 && (item.stockQuantity || 0) <= (item.minimumStock || 0)).length;
  const outOfStock = inventory.filter(item => (item.stockQuantity || 0) === 0).length;

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Inventory Management
            
          </h1>
          <p className="text-secondary">Track and manage your stock levels</p>
        </div>
        {canManageInventory && (
          <div className="flex gap-2">
            <Button variant="outline" icon={<RefreshCw size={18} className={isRevalidating ? "animate-spin" : ""} />} onClick={refetch} disabled={isRevalidating} className="bg-[var(--bg-card)]">
              Refresh
            </Button>
            <Button variant="outline" icon={<Plus size={18} />} onClick={() => setIsAddModalOpen(true)} className="bg-[var(--bg-card)]">
              Add Product
            </Button>
            <Button icon={<PackagePlus size={18} />} onClick={() => setIsReceiveModalOpen(true)}>
              Receive Stock
            </Button>
          </div>
        )}
      </div>

      <div className="inventory-stats-grid mb-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="stat-icon bg-primary/10 text-primary p-3 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-secondary">Total Stock Items</p>
              <h3 className="text-2xl font-bold">{totalItems}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="stat-icon bg-success/10 text-success p-3 rounded-xl">
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>$</span>
            </div>
            <div>
              <p className="text-sm text-secondary">Stock Valuation</p>
              <h3 className="text-2xl font-bold">${stockValuation.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="stat-icon bg-warning/10 text-warning p-3 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-secondary">Low Stock Products</p>
              <h3 className="text-2xl font-bold">{lowStock}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="stat-icon bg-danger/10 text-danger p-3 rounded-xl">
              <ArrowDownToLine size={24} />
            </div>
            <div>
              <p className="text-sm text-secondary">Out of Stock</p>
              <h3 className="text-2xl font-bold">{outOfStock}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">Current Stock Levels</h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length > 0 ? (
                  inventory.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-3">
                          {item.imageUrl ? (
                            <div className="rounded-lg overflow-hidden border border-[var(--border-color)] bg-slate-100 flex-shrink-0" style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}>
                              <img src={item.imageUrl} alt={item.name} className="object-cover" style={{ width: '100%', height: '100%' }} />
                            </div>
                          ) : (
                            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0 text-text-muted" style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}>
                              <Package size={18} />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            <div className="flex gap-1 mt-1">
                              {item.isBundle && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">BUNDLE</span>}
                              {item.requiresSerial && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">SERIALIZED</span>}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-secondary">{item.sku}</TableCell>
                      <TableCell>
                        <span className="font-bold">{item.stockQuantity}</span>
                      </TableCell>
                      <TableCell className="text-secondary">{item.minimumStock}</TableCell>
                      <TableCell>
                        {item.stockQuantity === 0 ? (
                          <span className="stock-status danger font-semibold text-danger bg-danger/10 px-2 py-1 rounded">Out of Stock</span>
                        ) : item.stockQuantity <= item.minimumStock ? (
                          <span className="stock-status warning font-semibold text-warning bg-warning/10 px-2 py-1 rounded">Low Stock</span>
                        ) : (
                          <span className="stock-status success font-semibold text-success bg-success/10 px-2 py-1 rounded">In Stock</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canManageInventory && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                icon={<Edit size={14} />} 
                                onClick={() => { setEditingProduct(item); setIsEditModalOpen(true); }}
                              >
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" icon={<ArrowUpFromLine size={14} />} onClick={() => { setAdjustingProduct(item); setAdjustQuantity(item.stockQuantity || 0); setAdjustReason('Count Error'); setIsAdjustModalOpen(true); }}>
                                Adjust
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-12 text-slate-500">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="biz-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="biz-modal-content" onClick={e => e.stopPropagation()}>
            <div className="biz-modal-header">
              <h2>Add New Product</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="biz-modal-body flex flex-col gap-6">
              
              <div className="flex gap-6 items-start">
                <div 
                  style={{ 
                    width: '128px', 
                    height: '128px', 
                    minWidth: '128px',
                    borderRadius: '16px',
                    border: '2px dashed var(--border-color)',
                    backgroundColor: 'var(--bg-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                >
                  {newProduct.imageUrl ? (
                    <img src={newProduct.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon size={24} style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '12px', fontWeight: 500 }}>Add Image</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={(e) => handleImageUpload(e, setNewProduct)} />
                </div>
                
                <div className="flex-1">
                  <label className="block text-base font-medium mb-1">Product Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg mb-3 shadow-sm" 
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="e.g. Premium T-Shirt"
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                />
                <div className="flex flex-wrap gap-2.5">
                  {(PRODUCT_RECOMMENDATIONS[currentBusiness?.type] || PRODUCT_RECOMMENDATIONS['Cafeteria / Restaurant']).map(s => (
                    <span 
                      key={s} 
                      onClick={() => setNewProduct({...newProduct, name: s})}
                      className="text-sm px-3 py-1.5 rounded-full transition-all font-medium cursor-pointer shadow-sm flex items-center gap-1 hover:bg-[var(--bg-hover)]"
                      style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                    >
                      <Plus size={14} /> {s}
                    </span>
                  ))}
                </div>
              </div>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-base font-medium mb-1">SKU</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={newProduct.sku}
                    onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                    placeholder="e.g. TSH-001"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-1">Barcode</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={newProduct.barcode}
                    onChange={e => setNewProduct({...newProduct, barcode: e.target.value})}
                    placeholder="Scan or enter"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-base font-medium mb-1">Category</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-1">Brand</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={newProduct.brand}
                    onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-base font-medium mb-1">Purchase Price</label>
                  <input 
                    type="number" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={newProduct.purchasePrice}
                    onChange={e => setNewProduct({...newProduct, purchasePrice: parseFloat(e.target.value) || 0})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-1">Selling Price</label>
                  <input 
                    type="number" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={newProduct.sellingPrice}
                    onChange={e => setNewProduct({...newProduct, sellingPrice: parseFloat(e.target.value) || 0})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-base font-medium mb-1">Status</label>
                  <select 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm"
                    value={newProduct.status}
                    onChange={e => setNewProduct({...newProduct, status: e.target.value})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-base font-medium mb-1">Initial Stock</label>
                  <input 
                    type="number" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={newProduct.stockQuantity}
                    onChange={e => setNewProduct({...newProduct, stockQuantity: parseInt(e.target.value) || 0})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-1">Min Stock Alert</label>
                  <input 
                    type="number" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={newProduct.minimumStock}
                    onChange={e => setNewProduct({...newProduct, minimumStock: parseInt(e.target.value) || 0})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 pt-4 border-t border-[var(--border-color)]">
                <h4 className="text-sm font-semibold text-secondary">Advanced Settings</h4>
                <div className="flex flex-wrap gap-6">
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="checkbox" checked={newProduct.isBundle} onChange={(e) => setNewProduct({...newProduct, isBundle: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                    <span className="font-medium">Is Bundle Product</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="checkbox" checked={newProduct.requiresSerial} onChange={(e) => setNewProduct({...newProduct, requiresSerial: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                    <span className="font-medium">Track Serial Numbers</span>
                  </label>
                </div>
                {newProduct.requiresSerial && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Warranty Period (Months)</label>
                    <input 
                      type="number" 
                      className="w-full max-w-[200px] p-2 rounded-lg focus:outline-none transition-colors text-base shadow-sm" 
                      value={newProduct.warrantyPeriod}
                      onChange={e => setNewProduct({...newProduct, warrantyPeriod: e.target.value})}
                      placeholder="e.g. 12"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="biz-modal-footer">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!newProduct.name) return alert('Product name is required');
                try {
                  await db.add('products', { ...newProduct, businessId: currentUser.activeBusinessId });
                  setIsAddModalOpen(false);
                  setNewProduct({ 
                    name: '', sku: '', stockQuantity: 0, minimumStock: 5, purchasePrice: 0, sellingPrice: 0, imageUrl: '',
                    barcode: '', category: '', brand: '', status: 'Active'
                  });
                  // Refetch manually in background to sync state, UI will load from cache instantly.
                  setTimeout(() => refetch(), 100);
                } catch (e) {
                  console.error(e);
                  alert('Failed to add product');
                }
              }}>Save Product</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="biz-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="biz-modal-content" onClick={e => e.stopPropagation()}>
            <div className="biz-modal-header">
              <h2>Edit Product</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="biz-modal-body flex flex-col gap-6">
              <div className="flex gap-6 items-start">
                <div 
                  style={{ 
                    width: '128px', 
                    height: '128px', 
                    minWidth: '128px',
                    borderRadius: '16px',
                    border: '2px dashed var(--border-color)',
                    backgroundColor: 'var(--bg-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                >
                  {editingProduct.imageUrl ? (
                    <img src={editingProduct.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon size={24} style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '12px', fontWeight: 500 }}>Add Image</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={(e) => handleImageUpload(e, setEditingProduct)} />
                </div>
                
                <div className="flex-1">
                  <label className="block text-base font-medium mb-1">Product Name</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg mb-3 shadow-sm" 
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-base font-medium mb-1">SKU</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={editingProduct.sku}
                    onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-1">Barcode</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={editingProduct.barcode || ''}
                    onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})}
                    placeholder="Scan or enter"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-base font-medium mb-1">Category</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={editingProduct.category || ''}
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-1">Brand</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={editingProduct.brand || ''}
                    onChange={e => setEditingProduct({...editingProduct, brand: e.target.value})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-base font-medium mb-1">Purchase Price</label>
                  <input 
                    type="number" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={editingProduct.purchasePrice || ''}
                    onChange={e => setEditingProduct({...editingProduct, purchasePrice: parseFloat(e.target.value) || 0})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-1">Selling Price</label>
                  <input 
                    type="number" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={editingProduct.sellingPrice || ''}
                    onChange={e => setEditingProduct({...editingProduct, sellingPrice: parseFloat(e.target.value) || 0})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-base font-medium mb-1">Status</label>
                  <select 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm"
                    value={editingProduct.status || 'Active'}
                    onChange={e => setEditingProduct({...editingProduct, status: e.target.value})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-base font-medium mb-1">Current Stock</label>
                  <input 
                    type="number" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={editingProduct.stockQuantity}
                    onChange={e => setEditingProduct({...editingProduct, stockQuantity: parseInt(e.target.value) || 0})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-1">Min Stock Alert</label>
                  <input 
                    type="number" 
                    className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                    value={editingProduct.minimumStock}
                    onChange={e => setEditingProduct({...editingProduct, minimumStock: parseInt(e.target.value) || 0})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 pt-4 border-t border-[var(--border-color)]">
                <h4 className="text-sm font-semibold text-secondary">Advanced Settings</h4>
                <div className="flex flex-wrap gap-6">
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="checkbox" checked={editingProduct.isBundle || false} onChange={(e) => setEditingProduct({...editingProduct, isBundle: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                    <span className="font-medium">Is Bundle Product</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="checkbox" checked={editingProduct.requiresSerial || false} onChange={(e) => setEditingProduct({...editingProduct, requiresSerial: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                    <span className="font-medium">Track Serial Numbers</span>
                  </label>
                </div>
                {editingProduct.requiresSerial && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Warranty Period (Months)</label>
                    <input 
                      type="number" 
                      className="w-full max-w-[200px] p-2 rounded-lg focus:outline-none transition-colors text-base shadow-sm" 
                      value={editingProduct.warrantyPeriod || ''}
                      onChange={e => setEditingProduct({...editingProduct, warrantyPeriod: e.target.value})}
                      placeholder="e.g. 12"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="biz-modal-footer">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!editingProduct.name) return alert('Product name is required');
                try {
                  await db.update('products', editingProduct.id, editingProduct);
                  setIsEditModalOpen(false);
                  setTimeout(() => refetch(), 100);
                } catch (e) {
                  console.error(e);
                  alert('Failed to update product');
                }
              }}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Stock Modal */}
      {isReceiveModalOpen && (
        <div className="biz-modal-overlay" onClick={() => setIsReceiveModalOpen(false)}>
          <div className="biz-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="biz-modal-header">
              <h2>Receive New Stock</h2>
              <button onClick={() => setIsReceiveModalOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="biz-modal-body flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-2">
              {receiveItems.map((item, index) => (
                <div key={item.id} className="p-4 rounded-xl relative" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  {receiveItems.length > 1 && (
                    <button 
                      className="absolute top-4 right-4 text-danger opacity-70 hover:opacity-100"
                      onClick={() => setReceiveItems(prev => prev.filter(i => i.id !== item.id))}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <h4 className="text-sm font-semibold mb-3 text-secondary">Item #{index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-4">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium mb-1">Select Product</label>
                      <select 
                        className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm"
                        value={item.productId}
                        onChange={e => {
                          const newItems = [...receiveItems];
                          newItems[index].productId = e.target.value;
                          setReceiveItems(newItems);
                        }}
                        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                      >
                        <option value="">-- Choose Product --</option>
                        {inventory.map(invItem => (
                          <option key={invItem.id} value={invItem.id}>{invItem.name} (Current: {invItem.stockQuantity})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantity</label>
                      <input 
                        type="number" 
                        min="1" 
                        className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                        value={item.quantity}
                        onChange={e => {
                          const newItems = [...receiveItems];
                          newItems[index].quantity = parseInt(e.target.value) || 0;
                          setReceiveItems(newItems);
                        }}
                        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                      />
                    </div>
                  </div>
                  
                  {item.productId && inventory.find(p => p.id === item.productId)?.requiresSerial ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Serial Numbers (comma separated)</label>
                      <textarea 
                        className="w-full p-3 rounded-xl focus:outline-none transition-colors text-base shadow-sm" 
                        rows="2" 
                        value={item.serialNumbers}
                        onChange={e => {
                          const newItems = [...receiveItems];
                          newItems[index].serialNumbers = e.target.value;
                          setReceiveItems(newItems);
                        }}
                        placeholder="e.g. SN-12345, SN-67890"
                        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                      ></textarea>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Batch Number (Optional)</label>
                      <input 
                        type="text" 
                        className="w-full p-2.5 rounded-lg focus:outline-none transition-colors text-sm shadow-sm" 
                        value={item.batchNumber}
                        onChange={e => {
                          const newItems = [...receiveItems];
                          newItems[index].batchNumber = e.target.value;
                          setReceiveItems(newItems);
                        }}
                        placeholder="e.g. BATCH-2023-A"
                        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Expiry Date (Optional)</label>
                      <input 
                        type="date" 
                        className="w-full p-2.5 rounded-lg focus:outline-none transition-colors text-sm shadow-sm" 
                        value={item.expiryDate}
                        onChange={e => {
                          const newItems = [...receiveItems];
                          newItems[index].expiryDate = e.target.value;
                          setReceiveItems(newItems);
                        }}
                        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                    <textarea 
                      className="w-full p-3 rounded-xl focus:outline-none transition-colors text-base shadow-sm" 
                      rows="1" 
                      value={item.notes}
                      onChange={e => {
                        const newItems = [...receiveItems];
                        newItems[index].notes = e.target.value;
                        setReceiveItems(newItems);
                      }}
                      placeholder="e.g. Restock from Supplier A"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                    ></textarea>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={<Plus size={16} />}
                  onClick={() => setReceiveItems(prev => [...prev, { id: Date.now(), productId: '', quantity: 1, notes: '' }])}
                >
                  Add Another Item
                </Button>
              </div>
            </div>
            <div className="biz-modal-footer mt-4">
              <Button variant="outline" onClick={() => setIsReceiveModalOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                const validItems = receiveItems.filter(i => i.productId && i.quantity > 0);
                if (validItems.length === 0) return alert('No valid items to receive.');
                
                try {
                  for (const item of validItems) {
                    const prod = inventory.find(p => p.id === item.productId);
                    if (prod) {
                      const updateData = {
                        stockQuantity: (prod.stockQuantity || 0) + item.quantity
                      };
                      if (item.batchNumber) updateData.batchNumber = item.batchNumber;
                      if (item.expiryDate) updateData.expiryDate = item.expiryDate;
                      if (item.serialNumbers) {
                        const newSerials = item.serialNumbers.split(',').map(s => s.trim()).filter(Boolean);
                        updateData.serialNumbers = [...(prod.serialNumbers || []), ...newSerials];
                      }
                      await db.update('products', prod.id, updateData);
                    }
                  }
                  setIsReceiveModalOpen(false);
                  setReceiveItems([{ id: Date.now(), productId: '', quantity: 1, batchNumber: '', expiryDate: '', serialNumbers: '', notes: '' }]);
                  refetch();
                } catch (e) {
                  console.error(e);
                  alert('Failed to receive stock');
                }
              }}>Confirm Receipt</Button>
            </div>
          </div>
        </div>
      )}
      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="biz-modal-overlay" onClick={() => setIsAdjustModalOpen(false)}>
          <div className="biz-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="biz-modal-header">
              <h2>Adjust Stock: {adjustingProduct.name}</h2>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="biz-modal-body flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Current Stock</label>
                <div className="p-3 rounded-xl bg-slate-100 font-bold text-lg text-slate-500">
                  {adjustingProduct.stockQuantity || 0}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Stock Quantity</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm" 
                  value={adjustQuantity}
                  onChange={e => setAdjustQuantity(parseInt(e.target.value) || 0)}
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Adjustment</label>
                <select 
                  className="w-full p-3 rounded-xl focus:outline-none transition-colors text-lg shadow-sm"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                >
                  <option value="Count Error">Count Error</option>
                  <option value="Damaged">Damaged / Broken</option>
                  <option value="Expired">Expired</option>
                  <option value="Theft">Theft / Loss</option>
                  <option value="Internal Use">Internal Use</option>
                </select>
              </div>
            </div>
            <div className="biz-modal-footer">
              <Button variant="outline" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                try {
                  await db.update('products', adjustingProduct.id, {
                    stockQuantity: adjustQuantity
                  });
                  // Optionally log the adjustment reason somewhere (e.g. an adjustments collection)
                  setIsAdjustModalOpen(false);
                  refetch();
                } catch (e) {
                  console.error(e);
                  alert('Failed to adjust stock');
                }
              }}>Confirm Adjustment</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;

