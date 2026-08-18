import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, Heart, DollarSign, ListOrdered, Plus, Edit, MessageSquare, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { db } from '../../services/databaseService';
import { format } from 'date-fns';

export const CustomerProfile = ({ customer, onBack, businessId, currencySymbol }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [salesHistory, setSalesHistory] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [followUps, setFollowUps] = useState(customer.followUps || []);
  
  // Follow up modal
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpData, setFollowUpData] = useState({ type: 'Call', notes: '', reminderDate: '' });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const sales = await db.getCollection('sales', businessId);
        const customerSales = sales.filter(s => s.customerId === customer.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        setSalesHistory(customerSales);

        // Calculate favorite products
        const productCounts = {};
        customerSales.forEach(sale => {
          if (sale.items) {
            sale.items.forEach(item => {
              if (item.productId) {
                if (!productCounts[item.productId]) {
                  productCounts[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
                }
                productCounts[item.productId].quantity += item.quantity;
                productCounts[item.productId].revenue += (item.price * item.quantity);
              }
            });
          }
        });

        const sortedFavs = Object.values(productCounts).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
        setFavoriteProducts(sortedFavs);
      } catch (err) {
        console.error("Failed to fetch customer history", err);
      }
    };
    fetchHistory();
  }, [customer.id, businessId]);

  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    const newFollowUp = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: followUpData.type,
      notes: followUpData.notes,
      reminderDate: followUpData.reminderDate || null,
      status: 'Pending'
    };

    const updatedFollowUps = [newFollowUp, ...followUps];
    setFollowUps(updatedFollowUps);
    
    await db.update('customers', customer.id, { followUps: updatedFollowUps }, businessId);
    
    setIsFollowUpModalOpen(false);
    setFollowUpData({ type: 'Call', notes: '', reminderDate: '' });
  };

  const markFollowUpComplete = async (id) => {
    const updated = followUps.map(f => f.id === id ? { ...f, status: 'Completed' } : f);
    setFollowUps(updated);
    await db.update('customers', customer.id, { followUps: updated }, businessId);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'VIP': return 'bg-indigo-100 text-indigo-700';
      case 'Wholesale': return 'bg-emerald-100 text-emerald-700';
      case 'Retail': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center gap-4 border-b border-[var(--border-color)] pb-4">
        <button onClick={onBack} className="p-2 hover:bg-[var(--bg-hover)] rounded-full transition-colors text-text-secondary hover:text-text-main">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            {customer.customerType && (
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${getTypeColor(customer.customerType)}`}>
                {customer.customerType}
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">Customer since {format(new Date(customer.createdAt || Date.now()), 'MMMM yyyy')}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-bg text-primary flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-muted uppercase">Lifetime Value</p>
              <p className="text-2xl font-bold text-text-main">{currencySymbol}{(customer.totalSpending || 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-bg text-warning flex items-center justify-center">
              <ListOrdered size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-muted uppercase">Total Orders</p>
              <p className="text-2xl font-bold text-text-main">{salesHistory.length || customer.totalPurchases || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger-bg text-danger flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-muted uppercase">Outstanding</p>
              <p className="text-2xl font-bold text-text-main">{currencySymbol}{(customer.outstandingBalance || 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Col: Contact & Tab Nav */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto">
          <Card>
            <CardHeader><h3 className="font-bold text-lg">Contact Info</h3></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-text-secondary">
                <Phone size={16} className="text-primary" />
                <span className="font-medium">{customer.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <Mail size={16} className="text-primary" />
                <span className="font-medium">{customer.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <MapPin size={16} className="text-primary min-w-[16px]" />
                <span className="font-medium">{customer.address || 'No address provided'}</span>
              </div>
              {customer.notes && (
                <div className="mt-2 p-3 bg-[var(--bg-elevated)] rounded-lg text-sm text-text-secondary border-l-2 border-primary">
                  {customer.notes}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <div className="flex flex-col">
              <button onClick={() => setActiveTab('overview')} className={`p-4 text-left font-bold border-b border-[var(--border-color)] transition-colors ${activeTab === 'overview' ? 'bg-primary-bg text-primary' : 'hover:bg-[var(--bg-hover)] text-text-secondary'}`}>
                Overview & Favorites
              </button>
              <button onClick={() => setActiveTab('history')} className={`p-4 text-left font-bold border-b border-[var(--border-color)] transition-colors ${activeTab === 'history' ? 'bg-primary-bg text-primary' : 'hover:bg-[var(--bg-hover)] text-text-secondary'}`}>
                Purchase History ({salesHistory.length})
              </button>
              <button onClick={() => setActiveTab('crm')} className={`p-4 text-left font-bold transition-colors ${activeTab === 'crm' ? 'bg-primary-bg text-primary' : 'hover:bg-[var(--bg-hover)] text-text-secondary'}`}>
                Follow-ups & CRM
              </button>
            </div>
          </Card>
        </div>

        {/* Right Col: Tab Content */}
        <div className="lg:col-span-2 overflow-y-auto bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
          
          {activeTab === 'overview' && (
            <div>
              <h3 className="font-bold text-xl mb-6 flex items-center gap-2"><Heart size={20} className="text-danger"/> Favorite Products</h3>
              {favoriteProducts.length > 0 ? (
                <div className="space-y-4">
                  {favoriteProducts.map((fav, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-xl">
                      <div>
                        <p className="font-bold text-lg text-text-main">{fav.name}</p>
                        <p className="text-sm text-text-muted">Purchased {fav.quantity} times</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{currencySymbol}{fav.revenue.toLocaleString()}</p>
                        <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Total Value</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted py-8 text-center">No purchase data available to determine favorites.</p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="font-bold text-xl mb-6">Purchase History</h3>
              {salesHistory.length > 0 ? (
                <div className="space-y-4">
                  {salesHistory.map(sale => (
                    <div key={sale.id} className="p-4 border border-[var(--border-color)] rounded-xl flex items-center justify-between hover:border-primary transition-colors cursor-default">
                      <div>
                        <p className="font-bold text-text-main">Order #{sale.id.slice(-6).toUpperCase()}</p>
                        <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                          <Calendar size={12}/> {format(new Date(sale.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="font-bold text-lg">{currencySymbol}{(sale.total || 0).toLocaleString()}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${sale.paymentStatus === 'Paid' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
                          {sale.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted py-8 text-center">No purchases recorded yet.</p>
              )}
            </div>
          )}

          {activeTab === 'crm' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl flex items-center gap-2"><MessageSquare size={20} className="text-primary"/> Follow-ups</h3>
                <Button size="sm" icon={<Plus size={16}/>} onClick={() => setIsFollowUpModalOpen(true)}>Add Interaction</Button>
              </div>

              <div className="relative border-l-2 border-[var(--border-color)] ml-3 pl-6 space-y-8 py-2">
                {followUps.length > 0 ? (
                  followUps.map(f => (
                    <div key={f.id} className="relative">
                      <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-[var(--bg-card)] ${f.status === 'Completed' ? 'bg-success' : 'bg-primary'}`}></div>
                      <div className="bg-[var(--bg-elevated)] p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-text-main flex items-center gap-2">
                              {f.type}
                              {f.status === 'Pending' && <span className="text-[10px] bg-warning-bg text-warning px-1.5 py-0.5 rounded uppercase tracking-wider">Pending</span>}
                            </span>
                            <p className="text-xs text-text-muted mt-1">{format(new Date(f.date), 'MMM dd, yyyy h:mm a')}</p>
                          </div>
                          {f.status === 'Pending' && (
                            <button onClick={() => markFollowUpComplete(f.id)} className="text-xs font-bold text-primary hover:underline">Mark Done</button>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mt-2">{f.notes}</p>
                        {f.reminderDate && (
                          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-warning bg-warning-bg px-2.5 py-1 rounded-md">
                            <Calendar size={12}/> Reminder: {format(new Date(f.reminderDate), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-text-muted py-4">No follow-ups recorded. Add one to nurture this relationship!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isFollowUpModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl p-6 shadow-xl animate-slide-up">
            <h2 className="text-xl font-bold mb-4">Log Interaction</h2>
            <form onSubmit={handleSaveFollowUp} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select 
                  className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]"
                  value={followUpData.type}
                  onChange={e => setFollowUpData({...followUpData, type: e.target.value})}
                >
                  <option value="Call">Phone Call</option>
                  <option value="Email">Email Sent</option>
                  <option value="Meeting">In-Person Meeting</option>
                  <option value="Message">WhatsApp / SMS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea 
                  required
                  rows="3"
                  className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]"
                  value={followUpData.notes}
                  onChange={e => setFollowUpData({...followUpData, notes: e.target.value})}
                  placeholder="What was discussed?"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Set a future reminder? (Optional)</label>
                <input 
                  type="date"
                  className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] text-text-main"
                  value={followUpData.reminderDate}
                  onChange={e => setFollowUpData({...followUpData, reminderDate: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
                <Button type="button" variant="outline" onClick={() => setIsFollowUpModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Interaction</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
