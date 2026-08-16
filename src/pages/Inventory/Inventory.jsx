import React, { useState } from 'react';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import { TableSkeleton } from '../../components/ui/Skeleton';
import './Inventory.css';

const Inventory = () => {
  const { currentUser } = useAppContext();
  
  const { data: inventory, loading, isRevalidating, refetch } = useCollection('products', currentUser?.activeBusinessId, {
    sortBy: (a, b) => (a.stockQuantity || 0) - (b.stockQuantity || 0)
  });

  const totalItems = inventory.reduce((sum, item) => sum + (item.stockQuantity || 0), 0);
  const lowStock = inventory.filter(item => (item.stockQuantity || 0) > 0 && (item.stockQuantity || 0) <= (item.minimumStock || 0)).length;
  const outOfStock = inventory.filter(item => (item.stockQuantity || 0) === 0).length;

  return (
    <div className="page-container animate-fade-in" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Inventory Management
            {isRevalidating && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>}
          </h1>
          <p className="text-secondary">Track and manage your stock levels</p>
        </div>
        <Button icon={<RefreshCw size={18} className={isRevalidating ? "animate-spin" : ""} />} onClick={refetch} disabled={isRevalidating}>
          {isRevalidating ? "Syncing..." : "Refresh Stock"}
        </Button>
      </div>

      <div className="inventory-stats-grid mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <TableCell className="font-medium">{item.name}</TableCell>
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
                        <Button variant="outline" size="sm" icon={<ArrowUpFromLine size={14} />}>
                          Adjust
                        </Button>
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
    </div>
  );
};

export default Inventory;

