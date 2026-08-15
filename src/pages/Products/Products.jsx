import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, MoreVertical, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import './Products.css';

const Products = () => {
  const { currentUser } = useAppContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    sku: '',
    category: '',
    sellingPrice: '',
    stockQuantity: '',
    minimumStock: '',
    barcode: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await db.getCollection('products');
    setProducts(data);
    setLoading(false);
  };

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
        sellingPrice: parseFloat(newProduct.sellingPrice),
        stockQuantity: parseInt(newProduct.stockQuantity) || 0,
        minimumStock: parseInt(newProduct.minimumStock) || 0,
      };

      await db.add('products', productToSave, currentUser?.businessId);
      
      setIsModalOpen(false);
      setNewProduct({
        name: '', brand: '', sku: '', category: '', sellingPrice: '',
        stockQuantity: '', minimumStock: '', barcode: '', status: 'Active'
      });
      fetchProducts(); // Refresh list
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-secondary">Manage your product catalog and inventory</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>Add Product</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
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
            <div className="loading-state">Loading products...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
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
                      <TableCell>${parseFloat(product.sellingPrice).toFixed(2)}</TableCell>
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
                          <button className="icon-action-btn" title="Edit"><Edit size={16} /></button>
                          <button className="icon-action-btn text-danger" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="7" className="text-center py-8">
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
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setIsModalOpen(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Product</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAddProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Product Name *</label>
                  <Input name="name" value={newProduct.name} onChange={handleInputChange} required placeholder="e.g. Wireless Mouse" />
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
                    <label>Selling Price ($) *</label>
                    <Input type="number" step="0.01" min="0" name="sellingPrice" value={newProduct.sellingPrice} onChange={handleInputChange} required placeholder="0.00" />
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
                    <label>Initial Stock Quantity</label>
                    <Input type="number" min="0" name="stockQuantity" value={newProduct.stockQuantity} onChange={handleInputChange} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Low Stock Threshold</label>
                    <Input type="number" min="0" name="minimumStock" value={newProduct.minimumStock} onChange={handleInputChange} placeholder="10" />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Product'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
