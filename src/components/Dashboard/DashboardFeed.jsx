import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, TableBody, TableRow, TableCell } from '../ui/Table';
import { Activity, Bell, Calendar, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const TransactionFeed = ({ transactions = [], currencySymbol }) => {
  const navigate = useNavigate();
  return (
    <Card className="border-none shadow-sm h-full" style={{ background: 'var(--bg-card)' }}>
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border-color">
        <div className="flex justify-between items-center w-full">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity size={18} className="text-primary"/> Recent Transactions
          </CardTitle>
          <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate('/orders')}>View All</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableBody>
            {transactions.slice(0, 5).map(trx => (
              <TableRow key={trx.id} className="hover:bg-[var(--bg-hover)] transition-colors border-b border-border-color last:border-0">
                <TableCell className="w-12 py-3 px-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trx.type === 'Sale' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>
                    {trx.type === 'Sale' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-text-main text-sm">
                      {trx.type === 'Sale' ? (trx.invoiceNumber || `Sale #${trx.id.substring(0, 5)}`) : (trx.category || 'Expense')}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <Clock size={10}/> {format(new Date(trx.date), 'MMM dd, hh:mm a')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 hidden md:table-cell">
                  <span className="text-sm text-text-secondary">{trx.customerName || trx.supplierName || trx.description || '-'}</span>
                </TableCell>
                <TableCell className="text-right py-3 px-4">
                  <div className="flex flex-col items-end">
                    <span className={`font-bold text-sm ${trx.type === 'Sale' ? 'text-success' : 'text-text-main'}`}>
                      {trx.type === 'Sale' ? '+' : '-'}{currencySymbol}{(trx.amount || 0).toFixed(2)}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider mt-0.5 px-2 py-0.5 rounded ${trx.status === 'Paid' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
                      {trx.status || 'Completed'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan="4" className="text-center py-8 text-text-muted">
                  No recent transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export const SmartAlerts = ({ alerts = [] }) => {
  const navigate = useNavigate();
  return (
    <Card className="border-none shadow-sm flex-1" style={{ background: 'var(--bg-card)' }}>
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border-color">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-warning">
          <Bell size={18}/> Attention Required
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[var(--border-color)]">
          {alerts.length > 0 ? alerts.map((alert, i) => (
            <div key={i} className="p-4 flex items-start gap-3 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors" onClick={() => navigate(alert.link)}>
              <div className="mt-0.5 text-warning"><AlertCircle size={16}/></div>
              <div>
                <p className="text-sm font-semibold text-text-main">{alert.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{alert.description}</p>
              </div>
            </div>
          )) : (
            <div className="p-6 flex items-center gap-3 text-success">
              <CheckCircle size={20}/>
              <p className="text-sm font-medium">You're all caught up! No urgent alerts.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
