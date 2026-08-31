import React, { useState } from 'react';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { Search, SlidersHorizontal, Plus, ChevronRight } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import './MobileProducts.css';

export const MobileProducts = ({ products, searchTerm, setSearchTerm, onAddProduct, currencySymbol, loading, onProductClick }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Mock categories based on products
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))].slice(0, 5);

  const displayProducts = products.filter(p => 
    (activeCategory === 'All' || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 50);

  return (
    <div className="mobile-products-page pb-20">
      <MobileHeader 
        title="Products" 
        rightIcon="plus" 
        rightOnClick={onAddProduct}
      />
      
      <div className="px-4 py-2 sticky top-0 bg-[var(--bg-card)] z-30 shadow-sm border-b border-[var(--border-color)]">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input 
              type="text" 
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary-color)]" 
              placeholder="Search products or scan barcode..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)]">
            <SlidersHorizontal size={18} />
          </button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-[var(--primary-color)] text-[var(--bg-primary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-color)]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">
        {loading ? (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading products...</p>
        ) : displayProducts.length > 0 ? (
          displayProducts.map(product => (
            <div key={product.id} className="flex items-center gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl active:scale-[0.98] transition-transform" onClick={() => onProductClick(product)}>
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                {product.image ? <img src={product.image} className="w-full h-full object-cover" alt={product.name}/> : <div className="text-xs text-[var(--text-muted)]">No Img</div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[var(--text-main)] truncate mb-0.5">{product.name}</h3>
                <p className="text-[10px] text-[var(--text-muted)] truncate mb-1">{product.category || 'Uncategorized'}</p>
                <p className="text-sm font-bold text-[var(--text-main)]">{currencySymbol}{product.price}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {product.stock <= (product.lowStockThreshold || 5) ? (
                  <span className="text-[10px] font-bold text-[var(--warning-color)]">Low Stock</span>
                ) : (
                  <span className="text-[10px] font-bold text-[var(--success-color)]">In Stock</span>
                )}
                <span className="text-[9px] text-[var(--text-muted)]">Stock: {product.stock}</span>
                <ChevronRight size={16} className="text-[var(--text-muted)] mt-1" />
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">No products found</p>
        )}
      </div>
    </div>
  );
};
