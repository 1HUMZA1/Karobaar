import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { db } from '../../services/databaseService';

export const QuickCustomerModal = ({ 
  isOpen, 
  onClose, 
  onCustomerCreated, 
  businessId 
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a customer name');
      return;
    }

    setSaving(true);
    try {
      const newCustomer = {
        name: name.trim(),
        phone: phone.trim() || '',
        customerType: 'Retail',
        totalPurchases: 0,
        totalSpending: 0,
        outstandingBalance: 0,
        createdAt: new Date().toISOString()
      };

      const saved = await db.add('customers', newCustomer, businessId);
      onCustomerCreated(saved);
      setName('');
      setPhone('');
      onClose();
    } catch (err) {
      console.error('Failed to create customer:', err);
      alert('Could not save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="biz-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="biz-modal-content" 
        style={{ maxWidth: '420px', width: '92%', padding: '24px', borderRadius: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="var(--text-main)" />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>Quick Add Customer</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Customer Name *
            </label>
            <input 
              type="text" 
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Phone Number
            </label>
            <input 
              type="tel" 
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ width: '100%', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="button" 
              onClick={onClose}
              disabled={saving}
              style={{ flex: 1, height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              style={{ flex: 2, height: '40px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--text-main)', color: 'var(--bg-card)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {saving ? 'Saving...' : (
                <><Check size={16} /> Save & Select</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
