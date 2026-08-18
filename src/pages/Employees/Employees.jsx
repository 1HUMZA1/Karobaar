import React, { useState, useEffect } from 'react';
import { 
  Search, Mail, Phone, Edit, Trash2, UserPlus, X, 
  Users, UserCheck, UserX, Clock, CheckCircle, FileText, Briefcase, User
} from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { format, startOfDay } from 'date-fns';
import './Employees.css';

const Employees = () => {
  const { currentUser, userRole } = useAppContext();
  
  const { data: employees, loading, isRevalidating, mutate, refetch } = useCollection('employees', currentUser?.activeBusinessId, {
    sortBy: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  });

  const { data: attendanceList, refetch: refetchAttendance } = useCollection('attendance', currentUser?.activeBusinessId);
  const { data: salesList } = useCollection('sales', currentUser?.activeBusinessId);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', dob: '', gender: 'Other', address: '',
    employeeId: '', department: 'General', jobTitle: '', role: 'STAFF', joiningDate: '', employmentType: 'Full Time',
    salary: '', salaryType: 'Monthly', commissionRate: '', salesTarget: '',
    shift: 'Morning', leaveBalance: '12',
    emergencyName: '', emergencyRel: '', emergencyPhone: '',
    status: 'Active'
  });

  // Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Debounce search
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const getInitialForm = () => ({
    name: '', email: '', phone: '', dob: '', gender: 'Other', address: '',
    employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`, department: '', jobTitle: '', role: 'STAFF', 
    joiningDate: format(new Date(), 'yyyy-MM-dd'), employmentType: 'Full Time',
    salary: '', salaryType: 'Monthly', commissionRate: '', salesTarget: '',
    shift: 'Morning', leaveBalance: '12',
    emergencyName: '', emergencyRel: '', emergencyPhone: '',
    status: 'Active'
  });

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(getInitialForm());
    setIsModalOpen(true);
  };

  const openEditModal = (emp) => {
    setIsEditing(true);
    setFormData({
      ...getInitialForm(),
      ...emp,
      salary: emp.salary || '',
      commissionRate: emp.commissionRate || '',
      salesTarget: emp.salesTarget || '',
      shift: emp.shift || 'Morning',
      leaveBalance: emp.leaveBalance || '12',
      joiningDate: emp.joiningDate ? format(new Date(emp.joiningDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    });
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!currentUser?.activeBusinessId) return;

    if (!formData.name?.trim()) return alert('Name is required');
    if (!formData.employeeId?.trim()) return alert('Employee ID is required');
    if (!formData.role?.trim()) return alert('System Role is required');
    if (!formData.salary) return alert('Salary is required');
    if (!formData.phone?.trim()) return alert('Contact Number is required');
    if (!formData.email?.trim()) return alert('Email is required');
    if (!formData.joiningDate) return alert('Joining Date is required');

    setSaving(true);
    try {
      const employeeData = {
        ...formData,
        salary: parseFloat(formData.salary) || 0,
        commissionRate: parseFloat(formData.commissionRate) || 0,
        salesTarget: parseFloat(formData.salesTarget) || 0,
        leaveBalance: parseInt(formData.leaveBalance, 10) || 0,
        updatedAt: new Date().toISOString()
      };

      if (isEditing && formData.id) {
        mutate(employees.map(emp => emp.id === formData.id ? { ...emp, ...employeeData } : emp));
        await db.update('employees', formData.id, employeeData, currentUser.activeBusinessId);
      } else {
        employeeData.createdAt = new Date().toISOString();
        const optimisticEmp = { id: 'temp-' + Date.now(), ...employeeData };
        mutate([optimisticEmp, ...employees]);
        await db.add('employees', employeeData, currentUser.activeBusinessId);
        
        // If an email is provided, trigger the default mail client to send an invitation
        if (formData.email) {
          const subject = encodeURIComponent(`Job Offer: ${formData.role}`);
          const body = encodeURIComponent(`Hi ${formData.name},\n\nWe are pleased to formally offer you the position of ${formData.role} in the ${formData.department || 'General'} department.\n\nYour joining date is scheduled for ${formData.joiningDate}.\n\nPlease reply to this email to accept the position.\n\nBest regards,\nManagement`);
          window.location.href = `mailto:${formData.email}?subject=${subject}&body=${body}`;
        }
      }
      
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to save employee');
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    if (!window.confirm(`Are you sure you want to mark this employee as ${newStatus}?`)) return;
    try {
      mutate(employees.map(e => e.id === id ? { ...e, status: newStatus } : e));
      await db.update('employees', id, { status: newStatus }, currentUser.activeBusinessId);
      if (selectedEmployee?.id === id) {
        setSelectedEmployee({...selectedEmployee, status: newStatus});
      }
      refetch();
    } catch (err) {
      console.error(err);
      refetch();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("WARNING: This will permanently delete the employee. Are you sure?")) return;
    try {
      mutate(employees.filter(e => e.id !== id));
      await db.delete('employees', id, currentUser.activeBusinessId);
      setDetailsModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      refetch();
    }
  };

  const openDetails = (emp) => {
    setSelectedEmployee(emp);
    setActiveTab('overview');
    setDetailsModalOpen(true);
  };

  const markQuickAttendance = async (empId, status) => {
    try {
      const attRecord = {
        employeeId: empId,
        date: new Date().toISOString(),
        status: status,
        markedBy: currentUser.uid
      };
      await db.add('attendance', attRecord, currentUser.activeBusinessId);
      alert(`Marked ${status} successfully.`);
      refetchAttendance();
    } catch (err) {
      console.error(err);
      alert('Failed to mark attendance.');
    }
  };

  // Calculations
  const todayTime = startOfDay(new Date()).getTime();
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const todayAttendance = attendanceList.filter(a => startOfDay(new Date(a.date)).getTime() === todayTime);
  const presentToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
  const onLeaveToday = employees.filter(e => e.status === 'On Leave').length + todayAttendance.filter(a => a.status === 'On Leave').length;

  const filteredEmployees = employees.filter(e => {
    const matchSearch = e.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                        e.employeeId?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                        e.role?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchDept = filterDept ? e.department === filterDept : true;
    const matchRole = filterRole ? e.role === filterRole : true;
    return matchSearch && matchDept && matchRole;
  }).slice(0, displayLimit);

  const uniqueDepts = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const uniqueRoles = [...new Set(employees.map(e => e.role).filter(Boolean))];

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;
    if (bottom && displayLimit < employees.length) {
      setDisplayLimit(prev => prev + 50);
    }
  };

  return (
    <div className="page-container" onScroll={handleScroll} style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Employee Directory
            {isRevalidating && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>}
          </h1>
          <p className="text-secondary">Manage employees, roles, permissions and attendance.</p>
        </div>
        {(userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'ADMIN') && (
          <Button icon={<UserPlus size={18} />} onClick={openAddModal}>Add Employee</Button>
        )}
      </div>

      <div className="employee-grid">
        <Card>
          <CardContent className="employee-summary-card">
            <div className="summary-info">
              <p className="summary-label">Total Employees</p>
              <h3 className="summary-value">{employees.length}</h3>
            </div>
            <div className="summary-icon bg-primary/10 text-primary p-3 rounded-xl"><Users size={24} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="employee-summary-card">
            <div className="summary-info">
              <p className="summary-label">Active Staff</p>
              <h3 className="summary-value">{activeEmployees}</h3>
            </div>
            <div className="summary-icon bg-success/10 text-success p-3 rounded-xl"><UserCheck size={24} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="employee-summary-card">
            <div className="summary-info">
              <p className="summary-label">Present Today</p>
              <h3 className="summary-value">{presentToday}</h3>
            </div>
            <div className="summary-icon bg-info/10 text-info p-3 rounded-xl"><CheckCircle size={24} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="employee-summary-card">
            <div className="summary-info">
              <p className="summary-label">On Leave</p>
              <h3 className="summary-value">{onLeaveToday}</h3>
            </div>
            <div className="summary-icon bg-warning/10 text-warning p-3 rounded-xl"><UserX size={24} /></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <Input 
              placeholder="Search by name, role, or ID..." 
              icon={<Search size={18} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <select className="karobaar-input" value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-card)'}}>
              <option value="">All Departments</option>
              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="karobaar-input" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-card)'}}>
              <option value="">All Roles</option>
              {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {(filterDept || filterRole || searchTerm) && (
              <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterDept(''); setFilterRole(''); }}>Clear</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableSkeleton rows={8} cols={7} /></div>
          ) : employees.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', textAlign: 'center' }}>
              <div style={{ width: '4rem', height: '4rem', backgroundColor: 'var(--bg-elevated)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">No employees yet</h3>
              <p className="text-secondary max-w-sm mb-6">Add your first employee to start managing your team, tracking attendance, and processing payroll.</p>
              <Button onClick={openAddModal}>+ Add Employee</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map(emp => (
                    <TableRow key={emp.id} className="cursor-pointer hover:bg-bg-hover" onClick={(e) => {
                      if (e.target.closest('button')) return;
                      openDetails(emp);
                    }}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`employee-avatar ${emp.status !== 'Active' ? 'inactive' : ''}`}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold">{emp.name}</span>
                            <span className="text-xs text-text-muted">{emp.employeeId}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm text-secondary">
                          <span className="flex items-center gap-1"><Phone size={12}/> {emp.phone || '-'}</span>
                          <span className="flex items-center gap-1"><Mail size={12}/> {emp.email || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{emp.department || '-'}</TableCell>
                      <TableCell><span className="role-badge">{emp.role}</span></TableCell>
                      <TableCell className="text-secondary text-sm">{emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM dd, yyyy') : '-'}</TableCell>
                      <TableCell>
                        <span className={`status-badge ${emp.status?.toLowerCase().replace(' ', '-')}`}>
                          {emp.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(emp)}>Edit</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan="7" className="text-center py-12 text-slate-500">No employees match your search.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {displayLimit < employees.length && (
                <div className="text-center p-4 text-sm text-slate-500">
                  Scroll down to load more...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="emp-modal-overlay">
          <div className="emp-modal-content animate-slide-up">
            <div className="emp-modal-header">
              <h2 className="text-xl font-bold">{isEditing ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveEmployee} className="flex flex-col flex-1 overflow-hidden">
              <div className="emp-modal-body space-y-6">
                
                <div>
                  <h3 className="form-section-title"><User size={16} className="inline mr-2"/> Personal Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Jane Smith" />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="jane@example.com" />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 8900" />
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <Input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="form-section-title"><Briefcase size={16} className="inline mr-2"/> Employment Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Employee ID *</label>
                      <Input required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Department</label>
                      <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Sales" />
                    </div>
                    <div className="form-group">
                      <label>System Role *</label>
                      <select className="karobaar-input" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                        <option value="OWNER">OWNER</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="STAFF">STAFF</option>
                        <option value="ACCOUNTANT">ACCOUNTANT</option>
                        <option value="SALES">SALES</option>
                        <option value="INVENTORY">INVENTORY</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Employment Type</label>
                      <select className="karobaar-input" value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Intern">Intern</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Shift Preference</label>
                      <select className="karobaar-input" value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                        <option value="Morning">Morning</option>
                        <option value="Evening">Evening</option>
                        <option value="Night">Night</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Leave Balance (Days)</label>
                      <Input type="number" value={formData.leaveBalance} onChange={e => setFormData({...formData, leaveBalance: e.target.value})} placeholder="e.g. 12" />
                    </div>
                    <div className="form-group">
                      <label>Joining Date</label>
                      <Input type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select className="karobaar-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="form-section-title"><FileText size={16} className="inline mr-2"/> Compensation & Performance</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Base Salary</label>
                      <Input type="number" step="0.01" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="0.00" />
                    </div>
                    <div className="form-group">
                      <label>Salary Type</label>
                      <select className="karobaar-input" value={formData.salaryType} onChange={e => setFormData({...formData, salaryType: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                        <option value="Monthly">Monthly</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Daily">Daily</option>
                        <option value="Hourly">Hourly</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Commission Rate (%)</label>
                      <Input type="number" step="0.1" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: e.target.value})} placeholder="e.g. 5" />
                    </div>
                    <div className="form-group">
                      <label>Monthly Sales Target</label>
                      <Input type="number" step="0.01" value={formData.salesTarget} onChange={e => setFormData({...formData, salesTarget: e.target.value})} placeholder="e.g. 50000" />
                    </div>
                  </div>
                </div>

              </div>
              <div className="emp-modal-footer">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Employee')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModalOpen && selectedEmployee && (
        <div className="emp-modal-overlay">
          <div className="emp-modal-content animate-slide-up">
            <div className="emp-modal-header">
              <div className="flex items-center gap-4">
                <div className={`employee-avatar ${selectedEmployee.status !== 'Active' ? 'inactive' : ''}`} style={{ width: 48, height: 48, fontSize: '1.5rem' }}>
                  {selectedEmployee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {selectedEmployee.name}
                    <span className={`status-badge ${selectedEmployee.status?.toLowerCase().replace(' ', '-')}`}>
                      {selectedEmployee.status}
                    </span>
                  </h2>
                  <p className="text-secondary">{selectedEmployee.role} • {selectedEmployee.department}</p>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setDetailsModalOpen(false)}><X size={20}/></button>
            </div>
            
            <div className="px-6 pt-4 border-b border-border-color">
              <div className="tabs-container mb-0 border-none">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>Attendance</button>
                <button className={`tab-btn ${activeTab === 'salary' ? 'active' : ''}`} onClick={() => setActiveTab('salary')}>Salary & Leaves</button>
                <button className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>Performance & Sales</button>
              </div>
            </div>

            <div className="emp-modal-body">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-bg-card border border-border-color rounded-lg">
                      <h4 className="text-sm font-semibold text-secondary mb-3 uppercase tracking-wider">Contact Info</h4>
                      <p className="text-sm mb-2"><Phone size={14} className="inline mr-2 text-text-muted"/> {selectedEmployee.phone || '-'}</p>
                      <p className="text-sm mb-2"><Mail size={14} className="inline mr-2 text-text-muted"/> {selectedEmployee.email || '-'}</p>
                    </div>
                    <div className="p-4 bg-bg-card border border-border-color rounded-lg">
                      <h4 className="text-sm font-semibold text-secondary mb-3 uppercase tracking-wider">Employment</h4>
                      <p className="text-sm mb-2"><span className="text-text-muted w-24 inline-block">ID:</span> {selectedEmployee.employeeId}</p>
                      <p className="text-sm mb-2"><span className="text-text-muted w-24 inline-block">Type:</span> {selectedEmployee.employmentType}</p>
                      <p className="text-sm mb-2"><span className="text-text-muted w-24 inline-block">Joined:</span> {selectedEmployee.joiningDate ? format(new Date(selectedEmployee.joiningDate), 'MMM dd, yyyy') : '-'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border-color">
                    <Button onClick={() => { setDetailsModalOpen(false); openEditModal(selectedEmployee); }} icon={<Edit size={16}/>}>Edit Profile</Button>
                    <Button variant="outline" onClick={() => handleDeactivate(selectedEmployee.id, selectedEmployee.status)}>
                      {selectedEmployee.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button variant="outline" className="text-danger border-danger hover:bg-danger-bg" onClick={() => handleDelete(selectedEmployee.id)}>
                      <Trash2 size={16}/> Delete
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div>
                  <div className="flex gap-2 mb-6">
                    <Button size="sm" onClick={() => markQuickAttendance(selectedEmployee.id, 'Present')}>Mark Present</Button>
                    <Button size="sm" variant="outline" onClick={() => markQuickAttendance(selectedEmployee.id, 'Absent')}>Mark Absent</Button>
                    <Button size="sm" variant="outline" onClick={() => markQuickAttendance(selectedEmployee.id, 'Half Day')}>Half Day</Button>
                  </div>
                  <h4 className="font-semibold mb-3">Recent Attendance</h4>
                  <div className="border border-border-color rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceList.filter(a => a.employeeId === selectedEmployee.id).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map(att => (
                          <TableRow key={att.id}>
                            <TableCell>{format(new Date(att.date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>
                              <span className={`status-badge ${att.status === 'Present' ? 'active' : 'inactive'}`}>{att.status}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {activeTab === 'salary' && (
                <div className="space-y-4">
                  <div className="p-4 bg-bg-card border border-border-color rounded-lg">
                    <h4 className="text-sm font-semibold text-secondary mb-3 uppercase tracking-wider">Compensation</h4>
                    <div className="text-3xl font-bold text-main mb-1">
                      {selectedEmployee.salary ? Number(selectedEmployee.salary).toLocaleString() : '0'}
                    </div>
                    <p className="text-secondary mb-4">Paid {selectedEmployee.salaryType || 'Monthly'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-bg-card border border-border-color rounded-lg">
                      <h4 className="text-sm font-semibold text-secondary mb-1">Shift Preference</h4>
                      <p className="text-lg font-bold">{selectedEmployee.shift || 'Morning'}</p>
                    </div>
                    <div className="p-4 bg-bg-card border border-border-color rounded-lg">
                      <h4 className="text-sm font-semibold text-secondary mb-1">Leave Balance</h4>
                      <p className="text-lg font-bold">{selectedEmployee.leaveBalance || 0} Days</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-6">
                  {(() => {
                    const employeeSales = salesList?.filter(s => s.employeeId === selectedEmployee.id && s.status !== 'cancelled' && s.status !== 'Refunded') || [];
                    const revenueGenerated = employeeSales.reduce((sum, s) => sum + (s.total || 0), 0);
                    const commissionRate = selectedEmployee.commissionRate || 0;
                    const commissionEarned = (revenueGenerated * commissionRate) / 100;
                    const target = selectedEmployee.salesTarget || 0;
                    const progress = target > 0 ? Math.min(100, (revenueGenerated / target) * 100) : 0;

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                            <h4 className="text-sm font-semibold text-primary mb-1">Revenue Generated</h4>
                            <p className="text-2xl font-black text-primary">{revenueGenerated.toLocaleString()}</p>
                          </div>
                          <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                            <h4 className="text-sm font-semibold text-success mb-1">Commission Earned</h4>
                            <p className="text-2xl font-black text-success">{commissionEarned.toLocaleString()}</p>
                            <p className="text-xs text-success/80 mt-1">At {commissionRate}% rate</p>
                          </div>
                        </div>

                        {target > 0 && (
                          <div className="p-4 bg-bg-card border border-border-color rounded-lg">
                            <div className="flex justify-between items-end mb-2">
                              <h4 className="text-sm font-semibold text-secondary">Sales Target Progress</h4>
                              <span className="font-bold">{progress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-border-color rounded-full h-2 mb-2">
                              <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-xs text-text-muted">{revenueGenerated.toLocaleString()} / {target.toLocaleString()} generated</p>
                          </div>
                        )}

                        <div>
                          <h4 className="font-semibold mb-3">Recent Sales Activity</h4>
                          <div className="border border-border-color rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Invoice</TableHead>
                                  <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {employeeSales.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map(s => (
                                  <TableRow key={s.id}>
                                    <TableCell>{format(new Date(s.date), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell>{s.invoiceNumber || '-'}</TableCell>
                                    <TableCell className="text-right font-bold text-success">{s.total?.toLocaleString()}</TableCell>
                                  </TableRow>
                                ))}
                                {employeeSales.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan="3" className="text-center py-4 text-text-muted">No sales generated yet.</TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Employees;
