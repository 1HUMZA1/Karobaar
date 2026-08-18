import React, { useState, useEffect } from 'react';
import { Download, Banknote, Calendar } from 'lucide-react';
import { db } from '../../services/databaseService';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import './Payroll.css';

const Payroll = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Mock current month period
  const currentMonth = format(new Date(), 'MMMM yyyy');

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    setLoading(true);
    const data = await db.getCollection('employees');
    setEmployees(data);
    setLoading(false);
  };

  const calculateNetPay = (salary) => {
    const tax = salary * 0.15; // 15% flat tax simulation
    const deductions = 100; // flat health deduction
    return salary - tax - deductions;
  };

  const generatePayslip = (employeeId) => {
    alert(`Generating payslip PDF for employee ID: ${employeeId}`);
  };

  const totalPayroll = employees.reduce((sum, emp) => sum + calculateNetPay(emp.salary || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-secondary">Process salaries and generate payslips</p>
        </div>
        <Button variant="outline" icon={<Calendar size={18} />}>{currentMonth}</Button>
      </div>

      <div className="payroll-stats">
        <Card className="flex-1">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-secondary text-sm">Estimated Monthly Payroll</p>
              <h3 className="text-2xl font-bold text-primary">${totalPayroll.toFixed(2)}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center">
              <Banknote size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">Employee Salaries ({currentMonth})</h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="loading-state">Loading payroll...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Gross Salary</TableHead>
                  <TableHead>Tax (15%)</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length > 0 ? (
                  employees.map(emp => {
                    const gross = emp.salary || 0;
                    const tax = gross * 0.15;
                    const deductions = 100;
                    const net = calculateNetPay(gross);
                    
                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell>{emp.role}</TableCell>
                        <TableCell>${gross.toFixed(2)}</TableCell>
                        <TableCell className="text-danger">-${tax.toFixed(2)}</TableCell>
                        <TableCell className="text-danger">-${deductions.toFixed(2)}</TableCell>
                        <TableCell className="font-bold text-success">${net.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            icon={<Download size={14}/>}
                            onClick={() => generatePayslip(emp.id)}
                          >
                            Payslip
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan="7" className="text-center py-8">
                      No employees found.
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

export default Payroll;
