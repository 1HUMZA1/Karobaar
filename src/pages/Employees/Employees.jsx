import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Edit, Trash2, UserPlus, X } from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import './Employees.css';

const Employees = () => {
  const { currentUser } = useAppContext();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Employee',
    department: 'General'
  });

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      fetchEmployees(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId]);

  const fetchEmployees = async (businessId) => {
    setLoading(true);
    const data = await db.getCollection('employees', businessId);
    setEmployees(data);
    setLoading(false);
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!currentUser?.activeBusinessId) return;

    setSaving(true);
    try {
      const newEmployee = {
        ...formData,
        status: 'Active',
        joinedAt: new Date().toISOString()
      };

      await db.add('employees', newEmployee, currentUser.activeBusinessId);
      await fetchEmployees(currentUser.activeBusinessId);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', role: 'Employee', department: 'General' });
    } catch (err) {
      console.error(err);
      alert('Failed to add employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this employee?")) return;
    try {
      await db.delete('employees', id, currentUser.activeBusinessId);
      await fetchEmployees(currentUser.activeBusinessId);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.role && e.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (e.department && e.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Employee Directory</h1>
          <p className="text-secondary">Manage your team members and roles</p>
        </div>
        <Button icon={<UserPlus size={18} />} onClick={() => setIsModalOpen(true)}>Add Employee</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Input 
            placeholder="Search by name, role, or department..." 
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="employee-search"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="loading-state">Loading employees...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(employee => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="employee-avatar">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{employee.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm text-secondary">
                          <span className="flex items-center gap-1"><Mail size={12}/> {employee.email || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{employee.department || 'N/A'}</TableCell>
                      <TableCell>
                        <span className="role-badge">{employee.role || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`status-badge ${employee.status === 'Active' ? 'active' : 'inactive'}`}>
                          {employee.status || 'Active'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          <button className="icon-action-btn"><Edit size={16} /></button>
                          <button className="icon-action-btn text-danger" onClick={() => handleDelete(employee.id)}><Trash2 size={16} /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-8">
                      No employees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddEmployee} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <Input 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Jane Smith"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <Input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="e.g. jane@example.com"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  className="karobaar-input"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Sales Staff">Sales Staff</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Accountant">Accountant</option>
                  <option value="HR">HR</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <Input 
                  value={formData.department} 
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g. Sales, Logistics..."
                />
              </div>
              
              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Employee'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
