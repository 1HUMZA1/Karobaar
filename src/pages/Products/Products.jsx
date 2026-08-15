import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { db } from '../../services/databaseService';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await db.getCollection('products');
    setProducts(data);
    setLoading(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm)
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-secondary">Manage your product catalog and inventory</p>
        </div>
        <Button icon={<Plus size={18} />}>Add Product</Button>
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
                      <TableCell>${product.sellingPrice}</TableCell>
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
                          <button className="icon-action-btn"><Edit size={16} /></button>
                          <button className="icon-action-btn text-danger"><Trash2 size={16} /></button>
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
    </div>
  );
};

export default Products;
