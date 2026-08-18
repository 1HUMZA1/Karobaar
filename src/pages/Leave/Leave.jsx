import React, { useState, useEffect } from 'react';
import { Plus, Check, X, CalendarOff } from 'lucide-react';
import { db } from '../../services/databaseService';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import './Leave.css';

const Leave = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    const data = await db.getCollection('leave');
    const sorted = [...data].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    setLeaveRequests(sorted);
    setLoading(false);
  };

  const handleStatusUpdate = async (id, status) => {
    await db.update('leave', id, { status });
    fetchLeaveRequests();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-secondary">Track and approve employee time off</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => alert('Leave Request module is currently in development.')}>Request Leave</Button>
      </div>

      <div className="leave-stats">
        <Card className="flex-1">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning-light text-warning flex items-center justify-center">
              <CalendarOff size={24} />
            </div>
            <div>
              <p className="text-secondary text-sm">Pending Requests</p>
              <h3 className="text-2xl font-bold">
                {leaveRequests.filter(l => l.status === 'Pending').length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">Leave Requests</h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="loading-state">Loading requests...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.length > 0 ? (
                  leaveRequests.map(leave => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">{leave.employeeName}</TableCell>
                      <TableCell>
                        <span className="leave-type-badge">{leave.type}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>{leave.days} Days</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={leave.reason}>
                        {leave.reason}
                      </TableCell>
                      <TableCell>
                        <span className={`status-badge ${leave.status.toLowerCase()}`}>
                          {leave.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          {leave.status === 'Pending' && (
                            <>
                              <button 
                                className="icon-action-btn text-success" 
                                title="Approve"
                                onClick={() => handleStatusUpdate(leave.id, 'Approved')}
                              >
                                <Check size={18} />
                              </button>
                              <button 
                                className="icon-action-btn text-danger" 
                                title="Reject"
                                onClick={() => handleStatusUpdate(leave.id, 'Rejected')}
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="7" className="text-center py-8">
                      No leave requests found.
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

export default Leave;
