import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, MoreVertical, X, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import { TableSkeleton } from '../../components/ui/Skeleton';
import './Products.css';

const Products = () => {
  const { currentUser, userRole } = useAppContext();
  const canManageProducts = ['OWNER', 'MANAGER', 'INVENTORY'].includes(userRole);
  
  const { data: products, loading, isRevalidating, mutate, refetch } = useCollection('products', currentUser?.activeBusinessId, {
    sortBy: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Pagination
  const [displayLimit, setDisplayLimit] = useState(50);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', brand: '', sku: '', category: '', purchasePrice: '', sellingPrice: '',
    stockQuantity: '', minimumStock: '', barcode: '', status: 'Active', imageUrl: ''
  });

  const openEditModal = (product) => {
    setNewProduct(product);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeAndResetModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setNewProduct({
      name: '', brand: '', sku: '', category: '', purchasePrice: '', sellingPrice: '',
      stockQuantity: '', minimumStock: '', barcode: '', status: 'Active', imageUrl: ''
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Debounce search
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku || !newProduct.sellingPrice) {
      alert("Please fill out Name, SKU, and Price.");
      return;
    }

    setIsSaving(true);
    try {
      const productToSave = {
        ...newProduct,
        purchasePrice: parseFloat(newProduct.purchasePrice) || 0,
        sellingPrice: parseFloat(newProduct.sellingPrice),
        stockQuantity: parseInt(newProduct.stockQuantity) || 0,
        minimumStock: parseInt(newProduct.minimumStock) || 0,
        createdAt: newProduct.createdAt || new Date().toISOString()
      };

      if (isEditing) {
        mutate(products.map(p => p.id === newProduct.id ? productToSave : p), false);
        await db.update('products', newProduct.id, productToSave);
      } else {
        const optimisticProduct = { id: 'temp-' + Date.now(), ...productToSave };
        mutate([optimisticProduct, ...products], false);
        await db.add('products', productToSave, currentUser?.activeBusinessId);
      }
      
      closeAndResetModal();
      refetch(); // Ensure background sync is correct
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product.");
      refetch(); // Revert optimistic UI on failure
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      mutate(products.filter(p => p.id !== id), false);
      await db.delete('products', id, currentUser?.activeBusinessId);
      refetch();
    } catch (err) {
      console.error(err);
      refetch();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(debouncedSearchTerm))
  ).slice(0, displayLimit);

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;
    if (bottom && displayLimit < products.length) {
      setDisplayLimit(prev => prev + 50);
    }
  };

  return (
    <div className="page-container" onScroll={handleScroll} style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Products
          </h1>
          <p className="text-secondary">Manage your product catalog and inventory</p>
        </div>
        {canManageProducts && (
          <Button icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>Add Product</Button>
        )}
      </div>

      <Card>
        <CardHeader style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div className="search-filter-container">
            <Input 
              placeholder="Search products by name, SKU, barcode..." 
              icon={<Search size={18} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="product-search"
            />
            <Button variant="outline" icon={<Filter size={18} />}>Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price (Buy/Sell)</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="product-name-cell">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-secondary">{product.brand}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="text-xs text-secondary">Buy: ${parseFloat(product.purchasePrice || 0).toFixed(2)}</span>
                          <span className="font-medium">Sell: ${parseFloat(product.sellingPrice || 0).toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-success font-medium">
                          +${(parseFloat(product.sellingPrice || 0) - parseFloat(product.purchasePrice || 0)).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`stock-badge ${product.stockQuantity <= product.minimumStock ? 'low-stock' : 'in-stock'}`}>
                          {product.stockQuantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`status-badge ${product.status === 'Active' ? 'active' : 'inactive'}`}>
                          {product.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          {canManageProducts && (
                            <>
                              <button className="icon-action-btn" title="Edit" onClick={() => openEditModal(product)}><Edit size={16} /></button>
                              <button className="icon-action-btn text-danger" title="Delete" onClick={() => handleDeleteProduct(product.id)}><Trash2 size={16} /></button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="7" className="text-center py-12 text-slate-500">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {displayLimit < products.length && (
            <div className="text-center p-4 text-sm text-slate-500">
              Scroll down to load more...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && closeAndResetModal()}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="modal-close" onClick={closeAndResetModal}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAddProduct}>
              <div className="modal-body">
                <div className="form-row" style={{ alignItems: 'flex-start', display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: '0 0 auto', margin: 0 }}>
                    <label>Image</label>
                    <div 
                      style={{ 
                        width: '96px', 
                        height: '96px', 
                        borderRadius: '8px', 
                        border: '2px dashed var(--border-color)', 
                        backgroundColor: 'var(--bg-tertiary)', 
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
                          <ImageIcon size={20} style={{ marginBottom: '4px' }} />
                          <span style={{ fontSize: '10px', fontWeight: 500 }}>Upload</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={handleImageUpload} />
                    </div>
                  </div>
                  
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label>Product Name *</label>
                    <Input name="name" value={newProduct.name} onChange={handleInputChange} required placeholder="e.g. Wireless Mouse" />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>SKU *</label>
                    <Input name="sku" value={newProduct.sku} onChange={handleInputChange} required placeholder="e.g. WM-001" />
                  </div>
                  <div className="form-group">
                    <label>Barcode</label>
                    <Input name="barcode" value={newProduct.barcode} onChange={handleInputChange} placeholder="Scan or enter barcode" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <Input name="category" value={newProduct.category} onChange={handleInputChange} placeholder="e.g. Electronics" />
                  </div>
                  <div className="form-group">
                    <label>Brand</label>
                    <Input name="brand" value={newProduct.brand} onChange={handleInputChange} placeholder="e.g. Logitech" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Purchase Price ($)</label>
                    <Input type="number" step="0.01" min="0" name="purchasePrice" value={newProduct.purchasePrice} onChange={handleInputChange} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label>Selling Price ($) *</label>
                    <Input type="number" step="0.01" min="0" name="sellingPrice" value={newProduct.sellingPrice} onChange={handleInputChange} required placeholder="0.00" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Stock Quantity</label>
                    <Input type="number" min="0" name="stockQuantity" value={newProduct.stockQuantity} onChange={handleInputChange} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select 
                      name="status" 
                      value={newProduct.status} 
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Low Stock Threshold</label>
                    <Input type="number" min="0" name="minimumStock" value={newProduct.minimumStock} onChange={handleInputChange} placeholder="10" />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button variant="outline" type="button" onClick={closeAndResetModal}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Save Product')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

