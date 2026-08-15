import React, { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle, PackageOpen } from 'lucide-react';
import { db } from '../../services/databaseService';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './Purchases.css';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    const data = await db.getCollection('purchases');
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    setPurchases(sorted);
    setLoading(false);
  };

  const handleReceiveStock = async (purchaseId) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase || purchase.status === 'Received') return;
    
    // Simulate updating inventory
    const products = await db.getCollection('products');
    for (const item of purchase.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        await db.update('products', product.id, {
          stockQuantity: product.stockQuantity + item.quantity
        });
      }
    }

    // Update purchase status
    await db.update('purchases', purchaseId, { status: 'Received' });
    fetchPurchases();
    alert('Stock received and inventory updated successfully!');
  };

  const filteredPurchases = purchases.filter(p => 
    p.poNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-secondary">Manage supplier orders and receive stock</p>
        </div>
        <Button icon={<Plus size={18} />}>Create PO</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Input 
            placeholder="Search by PO number..." 
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
                      <TableCell>{purchase.supplierName}</TableCell>
                      <TableCell className="font-bold">${purchase.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`status-badge ${purchase.status === 'Received' ? 'success' : 'warning'}`}>
                          {purchase.status}
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
    </div>
  );
};

export default Purchases;
