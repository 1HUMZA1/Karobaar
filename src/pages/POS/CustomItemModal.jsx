import React, { useState } from 'react';
import { X, Plus, PackagePlus } from 'lucide-react';

export const CustomItemModal = ({ isOpen, onClose, onAddCustomItem, currencySymbol = '₹' }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState('Custom Service');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    if (!name.trim()) {
      alert('Please enter an item name');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Please enter a valid price');
      return;
    }
    const parsedQty = parseInt(quantity, 10) || 1;

    onAddCustomItem({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      price: parsedPrice,
      sellingPrice: parsedPrice,
      quantity: parsedQty,
      category: category.trim() || 'Custom',
      stockQuantity: 9999,
      isCustom: true
    });

    setName('');
    setPrice('');
    setQuantity(1);
    onClose();
  };

  return (
    <div className="biz-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="biz-modal-content" 
        style={{ maxWidth: '440px', width: '92%', padding: '24px', borderRadius: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackagePlus size={20} color="var(--text-main)" />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>Add Custom / Open Item</h3>
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
              Item Name / Description *
            </label>
            <input 
              type="text" 
              placeholder="e.g. Gift Wrap, Repair Fee, Custom Service"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Unit Price ({currencySymbol}) *
              </label>
              <input 
                type="number" 
                step="any"
                placeholder="0.00"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                min="0.01"
                style={{ width: '100%', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Quantity
              </label>
              <input 
                type="number" 
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                min="1"
                style={{ width: '100%', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Category
            </label>
            <input 
              type="text" 
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Service, Custom, Miscellaneous"
              style={{ width: '100%', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ flex: 1, height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{ flex: 2, height: '40px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--text-main)', color: 'var(--bg-card)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Add to Cart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
