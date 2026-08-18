import React, { useState, useEffect, useMemo } from 'react';
import { Bell, AlertCircle, ShoppingBag, Users, BarChart2, CloudOff, Info } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import { localDb } from '../../services/localDb';
import { subDays } from 'date-fns';

const Notifications = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const bid = currentUser?.activeBusinessId;

  const { data: products } = useCollection('products', bid);
  const { data: sales } = useCollection('sales', bid);
  const { data: employees } = useCollection('employees', bid);

  const [clearedIds, setClearedIds] = useState([]);

  // Generate dynamic notifications based on real data
  const notifications = useMemo(() => {
    if (!currentBusiness) return [];
    
    let notifs = [];
    let idCounter = 1;

    // 1. Sync Failed
    const pendingQueue = localDb.getPendingQueue();
    const failedSyncs = pendingQueue.filter(q => q.data?._syncStatus === 'failed');
    if (failedSyncs.length > 0) {
      notifs.push({
        id: `sync-${idCounter++}`,
        type: 'sync-failed',
        title: 'Sync failed ☁️',
        message: `${failedSyncs.length} updates could not be synced to the cloud. Check your internet connection.`,
        time: 'Just now'
      });
    }

    // 2. Products Out of Stock & Low Stock
    const lowStockThreshold = currentBusiness?.settings?.lowStockThreshold || 5;
    products.forEach(p => {
      const stock = Number(p.stockQuantity) || 0;
      if (stock === 0) {
        notifs.push({
          id: `oos-${p.id}`,
          type: 'out-of-stock',
          title: 'Product out of stock 🔴',
          message: `"${p.name}" has completely run out of stock.`,
          time: 'Needs attention'
        });
      } else if (stock <= lowStockThreshold) {
        notifs.push({
          id: `low-${p.id}`,
          type: 'low-stock',
          title: 'Low stock 🟠',
          message: `"${p.name}" is running low (Only ${stock} left).`,
          time: 'Needs attention'
        });
      }
    });

    // 3. Failed Payments
    const failedSales = sales.filter(s => s.status === 'failed' || s.paymentStatus === 'failed');
    if (failedSales.length > 0) {
      notifs.push({
        id: `failed-payment-${failedSales[0].id}`,
        type: 'failed-payment',
        title: 'Failed payment ⚠️',
        message: `A payment of ${currentBusiness?.settings?.currency || '$'}${failedSales[0].total} failed for Invoice #${failedSales[0].invoiceNumber || 'Unknown'}.`,
        time: 'Recent'
      });
    }

    // 4. Most Recent Sale Completed
    const completedSales = sales.filter(s => s.status !== 'cancelled' && s.status !== 'failed');
    completedSales.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    if (completedSales.length > 0) {
      notifs.push({
        id: `sale-${completedSales[0].id}`,
        type: 'sale-completed',
        title: 'Sale completed 💰',
        message: `Successfully processed a sale for ${currentBusiness?.settings?.currency || '$'}${completedSales[0].total}.`,
        time: 'Recent'
      });
    }

    // 5. Weekly Sales Summary
    const weekAgo = subDays(new Date(), 7).getTime();
    const weeklySales = completedSales.filter(s => new Date(s.date || s.createdAt).getTime() >= weekAgo);
    const weeklyTotal = weeklySales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    if (weeklySales.length > 0) {
      notifs.push({
        id: `weekly-summary`,
        type: 'weekly-summary',
        title: 'Weekly sales summary 📊',
        message: `You processed ${weeklySales.length} sales this week, totaling ${currentBusiness?.settings?.currency || '$'}${weeklyTotal.toFixed(2)}.`,
        time: 'This week'
      });
    }

    // 6. Most Recent Employee Added
    if (employees.length > 0) {
      const sortedEmp = [...employees].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      notifs.push({
        id: `emp-${sortedEmp[0].id}`,
        type: 'new-employee',
        title: 'New employee added 👤',
        message: `${sortedEmp[0].name} was successfully onboarded as a ${sortedEmp[0].role}.`,
        time: 'Recent'
      });
    }

    // Fallback if absolutely empty
    if (notifs.length === 0) {
      notifs.push({
        id: 'welcome',
        type: 'info',
        title: 'Welcome to Karobaar',
        message: 'Your notification center is ready. Alerts will appear here.',
        time: 'Just now'
      });
    }

    return notifs.filter(n => !clearedIds.includes(n.id));
  }, [products, sales, employees, currentBusiness, clearedIds]);

  const markAllRead = () => {
    setClearedIds([...clearedIds, ...notifications.map(n => n.id)]);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'out-of-stock': return <AlertCircle size={20} className="text-danger" />;
      case 'low-stock': return <AlertCircle size={20} className="text-warning" />;
      case 'sale-completed': return <ShoppingBag size={20} className="text-success" />;
      case 'new-employee': return <Users size={20} className="text-info" />;
      case 'weekly-summary': return <BarChart2 size={20} className="text-primary" />;
      case 'failed-payment': return <AlertCircle size={20} className="text-danger" />;
      case 'sync-failed': return <CloudOff size={20} className="text-danger" />;
      default: return <Info size={20} className="text-secondary" />;
    }
  };

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-secondary">System alerts and updates</p>
        </div>
        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Clear all
          </Button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '800px' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Bell size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p>You're all caught up!</p>
          </div>
        ) : (
          notifications.map(notif => (
            <Card key={notif.id} style={{ borderLeft: notif.type.includes('stock') || notif.type.includes('failed') ? '4px solid var(--danger-color)' : notif.type === 'sale-completed' ? '4px solid var(--success-color)' : '4px solid var(--primary-color)' }}>
              <CardContent style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ marginTop: '0.25rem' }}>{getIcon(notif.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>
                      {notif.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{notif.time}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{notif.message}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
