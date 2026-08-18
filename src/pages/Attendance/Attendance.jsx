import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, XCircle, LogIn, LogOut, Calendar, AlertCircle, Check, Users } from 'lucide-react';
import { db } from '../../services/databaseService';
import { formatISO, format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import './Attendance.css';

const Attendance = () => {
  const { currentUser } = useAppContext();
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // UI State
  const [activeTab, setActiveTab] = useState('kiosk'); // 'kiosk' | 'overview'
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (currentUser?.activeBusinessId) {
      loadData(currentUser.activeBusinessId);
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [currentUser?.activeBusinessId]);

  const loadData = async (businessId) => {
    const emps = await db.getCollection('employees', businessId);
    setEmployees(emps);
    const records = await db.getCollection('attendance', businessId);
    setAttendanceRecords(records);
  };

  const todayStr = formatISO(new Date(), { representation: 'date' });

  const handleCheckIn = async (employeeId) => {
    if (!currentUser?.activeBusinessId) return;
    const record = {
      employeeId,
      date: todayStr,
      checkIn: formatISO(new Date()),
      status: 'Present'
    };
    await db.add('attendance', record, currentUser.activeBusinessId);
    setPin('');
    setSelectedEmployee('');
    loadData(currentUser.activeBusinessId);
  };

  const handleCheckOut = async (employeeId) => {
    if (!currentUser?.activeBusinessId) return;
    const record = attendanceRecords.find(r => r.employeeId === employeeId && r.date === todayStr && !r.checkOut);
    if (record) {
      await db.update('attendance', record.id, {
        checkOut: formatISO(new Date())
      }, currentUser.activeBusinessId);
      loadData(currentUser.activeBusinessId);
    }
  };

  const handleUpdateStatus = async (employeeId, status) => {
    if (!currentUser?.activeBusinessId) return;
    const existing = attendanceRecords.find(r => r.employeeId === employeeId && r.date === todayStr);
    
    if (existing) {
      await db.update('attendance', existing.id, { status }, currentUser.activeBusinessId);
    } else {
      await db.add('attendance', {
        employeeId,
        date: todayStr,
        status,
        checkIn: status === 'Present' || status === 'Half-day' ? formatISO(new Date()) : null
      }, currentUser.activeBusinessId);
    }
    loadData(currentUser.activeBusinessId);
  };

  const getTodayRecord = (employeeId) => {
    return attendanceRecords.find(r => r.employeeId === employeeId && r.date === todayStr);
  };

  // Calculate monthly stats for overview
  const monthlyStats = useMemo(() => {
    const stats = {};
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    employees.forEach(emp => {
      stats[emp.id] = { present: 0, absent: 0, halfDay: 0, leave: 0, total: 0 };
    });

    attendanceRecords.forEach(record => {
      if (!record.date) return;
      try {
        const recordDate = parseISO(record.date);
        if (isWithinInterval(recordDate, { start, end })) {
          if (stats[record.employeeId]) {
            stats[record.employeeId].total += 1;
            if (record.status === 'Present') stats[record.employeeId].present += 1;
            else if (record.status === 'Half-day') stats[record.employeeId].halfDay += 1;
            else if (record.status === 'Leave') stats[record.employeeId].leave += 1;
            else if (record.status === 'Absent') stats[record.employeeId].absent += 1;
          }
        }
      } catch (e) {
        // invalid date
      }
    });

    return stats;
  }, [attendanceRecords, employees]);

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-secondary">Track employee working hours and leaves</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-elevated rounded-lg p-1 border border-border">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'kiosk' ? 'bg-primary text-white' : 'text-secondary hover:text-main'}`}
            onClick={() => setActiveTab('kiosk')}
          >
            <Clock size={16} className="inline mr-2"/>
            Kiosk
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-primary text-white' : 'text-secondary hover:text-main'}`}
            onClick={() => setActiveTab('overview')}
          >
            <Users size={16} className="inline mr-2"/>
            Manager Overview
          </button>
        </div>
      </div>

      {activeTab === 'kiosk' && (
        <>
          <div className="flex gap-6 mb-8 flex-wrap">
            <Card className="flex-1 bg-primary-light border-primary">
              <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                <h2 className="text-xl font-medium text-primary mb-2">Good Morning, {employees.find(e => e.id === selectedEmployee)?.name || 'Employee'}</h2>
                <p className="text-sm text-secondary mb-6">Today's Schedule: 09:00 AM — 06:00 PM</p>
                
                <div className="text-4xl font-bold font-mono text-primary-color mb-8">
                  {format(currentTime, 'hh:mm:ss a')}
                </div>

                <div className="flex flex-col gap-4 w-full max-w-[250px]">
                  <select 
                    className="biz-input w-full"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="">Select your profile...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                  
                  <Input 
                    type="password" 
                    placeholder="Enter 4-digit PIN..." 
                    maxLength="4"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="text-center tracking-widest text-lg"
                  />
                  
                  <Button 
                    fullWidth
                    size="lg"
                    onClick={() => handleCheckIn(selectedEmployee)}
                    disabled={!selectedEmployee}
                  >
                    CHECK IN
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="attendance-grid">
            {employees.map(emp => {
              const record = getTodayRecord(emp.id);
              const status = record?.status;
              const isCheckedIn = record && !record.checkOut && (status === 'Present' || status === 'Half-day');
              const isCheckedOut = record && record.checkOut;

              return (
                <Card key={emp.id} className="attendance-card">
                  <CardContent className="p-5 flex flex-col items-center text-center">
                    <div className="employee-avatar-lg mb-3">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-semibold">{emp.name}</h3>
                    <p className="text-xs text-secondary mb-4">{emp.role || 'Employee'}</p>

                    <div className="status-indicator mb-4">
                      {status === 'Leave' ? (
                        <span className="badge-leave"><Calendar size={14}/> On Leave</span>
                      ) : status === 'Absent' ? (
                        <span className="badge-absent"><XCircle size={14}/> Absent</span>
                      ) : isCheckedOut ? (
                        <span className="badge-checkout"><CheckCircle2 size={14}/> Checked Out</span>
                      ) : isCheckedIn ? (
                        <span className="badge-checkin"><Clock size={14}/> Working ({status})</span>
                      ) : (
                        <span className="badge-absent text-tertiary border-tertiary">Not Checked In</span>
                      )}
                    </div>

                    <div className="flex gap-2 w-full">
                      {!record && (
                        <Button 
                          fullWidth 
                          icon={<LogIn size={16}/>} 
                          onClick={() => handleCheckIn(emp.id)}
                        >
                          Check In
                        </Button>
                      )}
                      {isCheckedIn && (
                        <Button 
                          fullWidth 
                          variant="outline"
                          className="text-warning border-warning hover:bg-warning-light"
                          icon={<LogOut size={16}/>} 
                          onClick={() => handleCheckOut(emp.id)}
                        >
                          Check Out
                        </Button>
                      )}
                    </div>
                    
                    {record && record.checkIn && (
                      <div className="text-xs text-tertiary mt-4">
                        In: {format(new Date(record.checkIn), 'hh:mm a')}
                        {record.checkOut && ` | Out: ${format(new Date(record.checkOut), 'hh:mm a')}`}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'overview' && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="biz-table w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Today's Status</th>
                  <th>Check In / Out</th>
                  <th className="text-center">Monthly Attendance</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const record = getTodayRecord(emp.id);
                  const stats = monthlyStats[emp.id];
                  
                  // Calculate percentage (Present = 1, Half-day = 0.5)
                  const totalDays = stats.present + stats.halfDay + stats.absent + stats.leave;
                  const score = stats.present + (stats.halfDay * 0.5) + stats.leave; // Leave usually counts towards allowed paid days, but for simple attendance we can count it or exclude it. Let's count it as 1 for attendance rate.
                  const percentage = totalDays === 0 ? 0 : Math.round((score / totalDays) * 100);

                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-medium">{emp.name}</span>
                          <span className="text-xs text-secondary">{emp.role}</span>
                        </div>
                      </td>
                      <td>
                        <select 
                          className="biz-input py-1 text-sm"
                          value={record?.status || ''}
                          onChange={(e) => handleUpdateStatus(emp.id, e.target.value)}
                        >
                          <option value="">Pending...</option>
                          <option value="Present">Present</option>
                          <option value="Half-day">Half-day</option>
                          <option value="Absent">Absent</option>
                          <option value="Leave">Leave</option>
                        </select>
                      </td>
                      <td>
                        {record?.checkIn ? (
                          <div className="text-sm">
                            <span className="text-success">{format(new Date(record.checkIn), 'hh:mm a')}</span>
                            {record.checkOut ? (
                              <> - <span className="text-secondary">{format(new Date(record.checkOut), 'hh:mm a')}</span></>
                            ) : (
                              <span className="text-tertiary"> (Working)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-tertiary">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col items-center">
                          <div className="w-full bg-elevated rounded-full h-2 mb-1 max-w-[100px] overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${percentage >= 90 ? 'bg-success' : percentage >= 75 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{percentage}% ({stats.present} P, {stats.halfDay} HD, {stats.absent} A)</span>
                        </div>
                      </td>
                      <td>
                        {!record && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(emp.id, 'Present')}>
                            Mark Present
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-secondary">
                      No employees found. Add employees in the Employee Management tab first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Attendance;
