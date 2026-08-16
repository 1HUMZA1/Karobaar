import React, { useState, useEffect } from 'react';
import { 
  Search, Mail, Phone, Edit, Trash2, UserPlus, X, 
  Users, UserCheck, UserX, Clock, CheckCircle, FileText, Briefcase
} from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { format, startOfDay } from 'date-fns';
import './Employees.css';

const Employees = () => {
  const { currentUser, userRole } = useAppContext();
  const [employees, setEmployees] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', dob: '', gender: 'Other', address: '',
    employeeId: '', department: 'General', jobTitle: '', role: 'STAFF', joiningDate: '', employmentType: 'Full Time',
    salary: '', salaryType: 'Monthly',
    emergencyName: '', emergencyRel: '', emergencyPhone: '',
    status: 'Active'
  });

  // Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      fetchData(currentUser.activeBusinessId);
    }
  }, [currentUser?.activeBusinessId]);

  const fetchData = async (businessId) => {
    setLoading(true);
    try {
      const [empData, attData] = await Promise.all([
        db.getCollection('employees', businessId),
        db.getCollection('attendance', businessId).catch(() => [])
      ]);
      setEmployees(empData || []);
      setAttendanceList(attData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getInitialForm = () => ({
    name: '', email: '', phone: '', dob: '', gender: 'Other', address: '',
    employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`, department: '', jobTitle: '', role: 'STAFF', 
    joiningDate: format(new Date(), 'yyyy-MM-dd'), employmentType: 'Full Time',
    salary: '', salaryType: 'Monthly',
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
      joiningDate: emp.joiningDate ? format(new Date(emp.joiningDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    });
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!currentUser?.activeBusinessId) return;

    setSaving(true);
    try {
      const employeeData = {
        ...formData,
        salary: parseFloat(formData.salary) || 0,
        updatedAt: new Date().toISOString()
      };

      if (isEditing && formData.id) {
        await db.update('employees', formData.id, employeeData, currentUser.activeBusinessId);
      } else {
        employeeData.createdAt = new Date().toISOString();
        await db.add('employees', employeeData, currentUser.activeBusinessId);
      }
      
      await fetchData(currentUser.activeBusinessId);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    if (!window.confirm(`Are you sure you want to mark this employee as ${newStatus}?`)) return;
    try {
      await db.update('employees', id, { status: newStatus }, currentUser.activeBusinessId);
      await fetchData(currentUser.activeBusinessId);
      if (selectedEmployee?.id === id) {
        setSelectedEmployee({...selectedEmployee, status: newStatus});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("WARNING: This will permanently delete the employee. Are you sure?")) return;
    try {
      await db.delete('employees', id, currentUser.activeBusinessId);
      await fetchData(currentUser.activeBusinessId);
      setDetailsModalOpen(false);
    } catch (err) {
      console.error(err);
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
      await fetchData(currentUser.activeBusinessId);
      alert(`Marked ${status} successfully.`);
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
    const matchSearch = e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        e.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        e.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterDept ? e.department === filterDept : true;
    const matchRole = filterRole ? e.role === filterRole : true;
    return matchSearch && matchDept && matchRole;
  });

  const uniqueDepts = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const uniqueRoles = [...new Set(employees.map(e => e.role).filter(Boolean))];

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Employee Directory</h1>
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
            <div className="summary-icon bg-primary-bg text-primary"><Users size={24} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="employee-summary-card">
            <div className="summary-info">
              <p className="summary-label">Active Staff</p>
              <h3 className="summary-value">{activeEmployees}</h3>
            </div>
            <div className="summary-icon bg-success-bg text-success"><UserCheck size={24} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="employee-summary-card">
            <div className="summary-info">
              <p className="summary-label">Present Today</p>
              <h3 className="summary-value">{presentToday}</h3>
            </div>
            <div className="summary-icon bg-info-bg text-info"><CheckCircle size={24} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="employee-summary-card">
            <div className="summary-info">
              <p className="summary-label">On Leave</p>
              <h3 className="summary-value">{onLeaveToday}</h3>
            </div>
            <div className="summary-icon bg-warning-bg text-warning"><UserX size={24} /></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-border-color pb-4">
          <div className="flex-1 w-full max-w-md">
            <Input 
              placeholder="Search by name, role, or ID..." 
              icon={<Search size={18} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
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
            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
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
                      <TableCell colSpan="7" className="text-center py-8 text-secondary">No employees match your search.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
                  <h3 className="form-section-title"><FileText size={16} className="inline mr-2"/> Salary Information</h3>
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
                <button className={`tab-btn ${activeTab === 'salary' ? 'active' : ''}`} onClick={() => setActiveTab('salary')}>Salary</button>
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
                <div className="p-4 bg-bg-card border border-border-color rounded-lg">
                  <h4 className="text-sm font-semibold text-secondary mb-3 uppercase tracking-wider">Compensation</h4>
                  <div className="text-3xl font-bold text-main mb-1">
                    {selectedEmployee.salary ? Number(selectedEmployee.salary).toLocaleString() : '0'}
                  </div>
                  <p className="text-secondary mb-4">Paid {selectedEmployee.salaryType || 'Monthly'}</p>
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
