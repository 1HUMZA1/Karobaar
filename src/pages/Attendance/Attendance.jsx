import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, LogIn, LogOut } from 'lucide-react';
import { db } from '../../services/databaseService';
import { formatISO, format } from 'date-fns';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import './Attendance.css';

const Attendance = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    const emps = await db.getCollection('employees');
    setEmployees(emps);
    // In a real app we fetch today's records. For demo, we just hold them in state or mock DB.
    const records = await db.getCollection('attendance');
    setAttendanceRecords(records);
  };

  const handleCheckIn = async (employeeId) => {
    const record = {
      employeeId,
      date: formatISO(new Date(), { representation: 'date' }),
      checkIn: formatISO(new Date()),
      status: 'Present'
    };
    await db.add('attendance', record);
    loadData();
  };

  const handleCheckOut = async (employeeId) => {
    const today = formatISO(new Date(), { representation: 'date' });
    const record = attendanceRecords.find(r => r.employeeId === employeeId && r.date === today && !r.checkOut);
    if (record) {
      await db.update('attendance', record.id, {
        checkOut: formatISO(new Date())
      });
      loadData();
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
          <p className="text-secondary">Track employee check-ins and check-outs</p>
        </div>
        <div className="current-time-display text-xl font-mono bg-bg-secondary px-4 py-2 rounded-md shadow-sm border border-border-color">
          {format(currentTime, 'hh:mm:ss a')}
        </div>
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
                  {emp.name.charAt(0)}
                </div>
                <h3 className="font-semibold">{emp.name}</h3>
                <p className="text-xs text-secondary mb-4">{emp.role}</p>

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
