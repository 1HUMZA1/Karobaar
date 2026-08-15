import React, { useState } from 'react';
import { Bell, AlertCircle, ShoppingBag, Truck } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';

const initialNotifications = [
  { id: 1, type: 'alert', title: 'Low Stock Alert', message: 'Product "Wireless Keyboard" is below minimum stock level.', time: '10 mins ago', read: false },
  { id: 2, type: 'order', title: 'New Online Order', message: 'Order #ORD-8821 received for $120.50', time: '1 hour ago', read: false },
  { id: 3, type: 'supply', title: 'Stock Received', message: 'PO-2023-002 has been received and added to inventory.', time: '2 hours ago', read: true },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type) => {
    switch(type) {
      case 'alert': return <AlertCircle size={20} className="text-warning" />;
      case 'order': return <ShoppingBag size={20} className="text-primary" />;
      case 'supply': return <Truck size={20} className="text-success" />;
      default: return <Bell size={20} className="text-secondary" />;
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-secondary">System alerts and updates</p>
        </div>
        <button className="text-sm font-medium text-primary hover:underline" onClick={markAllRead}>
          Mark all as read
        </button>
      </div>

      <div className="flex flex-col gap-3 max-w-3xl">
        {notifications.map(notif => (
          <Card key={notif.id} className={notif.read ? 'opacity-75' : 'border-l-4 border-l-primary'}>
            <CardContent className="p-4 flex gap-4 items-start">
              <div className="mt-1">{getIcon(notif.type)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`font-semibold ${notif.read ? 'text-secondary' : 'text-primary-color'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-xs text-secondary">{notif.time}</span>
                </div>
                <p className="text-sm text-secondary">{notif.message}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
