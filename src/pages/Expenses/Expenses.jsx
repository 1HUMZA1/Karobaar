import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Receipt } from 'lucide-react';
import { db } from '../../services/databaseService';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './Expenses.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    const data = await db.getCollection('expenses');
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    setExpenses(sorted);
    setLoading(false);
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-secondary">Track operational costs and business expenses</p>
        </div>
        <Button icon={<Plus size={18} />}>Record Expense</Button>
      </div>

      <div className="expense-stats">
        <Card className="flex-1">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-secondary text-sm">Total Expenses (All Time)</p>
              <h3 className="text-2xl font-bold text-danger">${totalExpenses.toFixed(2)}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-danger-light text-danger flex items-center justify-center">
              <Receipt size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Input 
            placeholder="Search by description or category..." 
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="expense-search"
          />
          <Button variant="outline" icon={<Filter size={18} />}>Filter</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="loading-state">Loading expenses...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <span className="category-badge">{expense.category}</span>
                      </TableCell>
                      <TableCell className="font-bold text-danger">
                        ${expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{expense.paymentMethod}</TableCell>
                      <TableCell>
                        <button className="icon-action-btn text-danger"><Trash2 size={16} /></button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-8">
                      No expenses found.
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

export default Expenses;
