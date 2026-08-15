import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import './Inventory.css';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const data = await db.getCollection('products');
    setInventory(data);
    setLoading(false);
  };

  const totalItems = inventory.reduce((sum, item) => sum + item.stockQuantity, 0);
  const lowStock = inventory.filter(item => item.stockQuantity > 0 && item.stockQuantity <= item.minimumStock).length;
  const outOfStock = inventory.filter(item => item.stockQuantity === 0).length;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-secondary">Track and manage your stock levels</p>
        </div>
        <Button icon={<RefreshCw size={18} />} onClick={fetchInventory}>Refresh Stock</Button>
      </div>

      <div className="inventory-stats-grid">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="stat-icon bg-primary-light text-primary">
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
            <div className="stat-icon bg-warning-light text-warning">
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
            <div className="stat-icon bg-danger-light text-danger">
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
            <div className="p-8 text-center text-secondary">Loading inventory...</div>
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
                {inventory.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-secondary">{item.sku}</TableCell>
                    <TableCell>
                      <span className="font-bold">{item.stockQuantity}</span>
                    </TableCell>
                    <TableCell className="text-secondary">{item.minimumStock}</TableCell>
                    <TableCell>
                      {item.stockQuantity === 0 ? (
                        <span className="stock-status danger">Out of Stock</span>
                      ) : item.stockQuantity <= item.minimumStock ? (
                        <span className="stock-status warning">Low Stock</span>
                      ) : (
                        <span className="stock-status success">In Stock</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" icon={<ArrowUpFromLine size={14} />}>
                        Adjust Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
