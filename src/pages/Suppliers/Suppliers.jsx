import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Edit, Trash2, Truck } from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './Suppliers.css';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const data = await db.getCollection('suppliers');
    setSuppliers(data);
    setLoading(false);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-secondary">Manage your vendors and supply chain partners</p>
        </div>
        <Button icon={<Truck size={18} />}>Add Supplier</Button>
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
                      <TableCell className="font-medium">{supplier.company}</TableCell>
                      <TableCell>{supplier.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm text-secondary">
                          <span className="flex items-center gap-1"><Mail size={12}/> {supplier.email}</span>
                          <span className="flex items-center gap-1"><Phone size={12}/> {supplier.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${supplier.outstandingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                          ${(supplier.outstandingBalance || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`status-badge ${supplier.status === 'Active' ? 'active' : 'inactive'}`}>
                          {supplier.status}
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
    </div>
  );
};

export default Suppliers;
