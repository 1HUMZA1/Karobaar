import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, LogIn, LogOut } from 'lucide-react';
import { db } from '../../services/databaseService';
import { formatISO, format } from 'date-fns';
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
  const [selectedEmployee, setSelectedEmployee] = useState('');

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
    // In a real app we fetch today's records. For demo, we just hold them in state or mock DB.
    const records = await db.getCollection('attendance', businessId);
    setAttendanceRecords(records);
  };

  const handleCheckIn = async (employeeId) => {
    if (!currentUser?.activeBusinessId) return;
    const record = {
      employeeId,
      date: formatISO(new Date(), { representation: 'date' }),
      checkIn: formatISO(new Date()),
      status: 'Present'
    };
    await db.add('attendance', record, currentUser.activeBusinessId);
    loadData(currentUser.activeBusinessId);
  };

  const handleCheckOut = async (employeeId) => {
    if (!currentUser?.activeBusinessId) return;
    const today = formatISO(new Date(), { representation: 'date' });
    const record = attendanceRecords.find(r => r.employeeId === employeeId && r.date === today && !r.checkOut);
    if (record) {
      await db.update('attendance', record.id, {
        checkOut: formatISO(new Date())
      }, currentUser.activeBusinessId);
      loadData(currentUser.activeBusinessId);
    }
  };

  const getTodayRecord = (employeeId) => {
    const today = formatISO(new Date(), { representation: 'date' });
    return attendanceRecords.find(r => r.employeeId === employeeId && r.date === today);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-secondary">Track employee working hours</p>
        </div>
      </div>

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
          const isCheckedIn = record && !record.checkOut;
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
                  {isCheckedOut ? (
                    <span className="badge-checkout"><CheckCircle2 size={14}/> Checked Out</span>
                  ) : isCheckedIn ? (
                    <span className="badge-checkin"><Clock size={14}/> Working</span>
                  ) : (
                    <span className="badge-absent"><XCircle size={14}/> Not Checked In</span>
                  )}
                </div>

                <div className="flex gap-2 w-full">
                  {!isCheckedIn && !isCheckedOut && (
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
                
                {record && (
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
    </div>
  );
};

export default Attendance;
