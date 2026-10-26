import React, { useState } from 'react';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { Search, SlidersHorizontal, Plus, ChevronRight, Camera, ArrowLeft, Trash2, CheckCircle2 } from 'lucide-react';
import './MobileProducts.css';

export const MobileProducts = ({ 
  products = [], 
  searchTerm = '', 
  setSearchTerm = () => {}, 
  onAddProduct = () => {}, 
  currencySymbol = '₹', 
  loading = false, 
  onProductClick = () => {},
  isModalOpen = false,
  isEditing = false,
  newProduct = {},
  handleInputChange = () => {},
  handleImageUpload = () => {},
  handleAddProduct = () => {},
  closeAndResetModal = () => {},
  handleDeleteProduct = () => {},
  isSaving = false
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showSearch, setShowSearch] = useState(false);

  // Derive unique categories including Food, Drinks, Others
  const defaultCats = ['All', 'Food', 'Drinks', 'Others'];
  const dynamicCats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const combinedCats = Array.from(new Set([...defaultCats, ...dynamicCats])).slice(0, 6);

  const displayProducts = products.filter(p => {
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    const nameMatch = (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const skuMatch = (p.sku || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const catMatch = (p.category || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    return matchesCat && (nameMatch || skuMatch || catMatch);
  });

  // Screen 7 View: Add / Edit Product
  if (isModalOpen) {
    return (
      <div className="mobile-product-modal fixed inset-0 z-50 bg-[var(--bg-primary)] overflow-y-auto pb-32">
        {/* Top Header */}
        <div className="k-modal-top-bar px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between sticky top-0 z-10">
          <button 
            type="button" 
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-main)] active:bg-gray-100 dark:active:bg-zinc-800 transition-colors" 
            onClick={closeAndResetModal}
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-base font-bold text-[var(--text-main)] tracking-tight">
            {isEditing ? 'Edit Product' : 'Add Product'}
          </h2>
          <div style={{ width: 40 }}></div>
        </div>

        {/* Form Body matching Screen 7 */}
        <form onSubmit={handleAddProduct} className="px-4 py-5 flex flex-col gap-5 max-w-lg mx-auto">
          {/* Add Product Image Box */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Product Image</label>
            <label 
              className="w-full h-36 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors hover:border-black dark:hover:border-white relative"
            >
              {newProduct?.imageUrl ? (
                <img 
                  src={newProduct.imageUrl} 
                  alt="Product preview" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-main)]">
                    <Camera size={22} />
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Add Product Image</span>
                  <span className="text-[10px] text-[var(--text-muted)]">PNG, JPG or WEBP up to 5MB</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
              />
            </label>
          </div>

          {/* Product Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Product Name *</label>
            <input 
              type="text" 
              name="name"
              required
              value={newProduct?.name || ''}
              onChange={handleInputChange}
              placeholder="e.g. Burger"
              className="w-full px-3.5 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-main)] outline-none focus:border-black dark:focus:border-white transition-colors"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Category</label>
            <select
              name="category"
              value={newProduct?.category || 'Food'}
              onChange={handleInputChange}
              className="w-full px-3.5 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-main)] outline-none focus:border-black dark:focus:border-white transition-colors"
            >
              <option value="Food">Food</option>
              <option value="Drinks">Drinks</option>
              <option value="Snacks">Snacks</option>
              <option value="Desserts">Desserts</option>
              <option value="Others">Others</option>
            </select>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Price ({currencySymbol}) *</label>
            <input 
              type="number" 
              step="0.01"
              min="0"
              name="sellingPrice"
              required
              value={newProduct?.sellingPrice || ''}
              onChange={handleInputChange}
              placeholder="80.00"
              className="w-full px-3.5 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-main)] outline-none focus:border-black dark:focus:border-white transition-colors"
            />
          </div>

          {/* Stock Quantity */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Stock Quantity</label>
            <input 
              type="number" 
              min="0"
              name="stockQuantity"
              value={newProduct?.stockQuantity !== undefined ? newProduct.stockQuantity : ''}
              onChange={handleInputChange}
              placeholder="100"
              className="w-full px-3.5 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-main)] outline-none focus:border-black dark:focus:border-white transition-colors"
            />
          </div>

          {/* Optional SKU / Barcode */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">SKU / Code (Optional)</label>
            <input 
              type="text" 
              name="sku"
              value={newProduct?.sku || ''}
              onChange={handleInputChange}
              placeholder="Auto-generated if left blank"
              className="w-full px-3.5 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-main)] outline-none focus:border-black dark:focus:border-white transition-colors"
            />
          </div>

          {/* Save Product button matching Screen 7 */}
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full mt-4 py-3.5 rounded-xl bg-[#09090b] text-white font-bold text-sm tracking-wide shadow-sm active:scale-[0.99] transition-transform flex items-center justify-center gap-2 hover:bg-black disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Save Product')}
          </button>

          {/* Delete Option if editing */}
          {isEditing && (
            <button 
              type="button" 
              onClick={() => handleDeleteProduct(newProduct.id)}
              className="w-full py-3 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold text-sm active:bg-red-50 dark:active:bg-red-950/20 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              <span>Delete Product</span>
            </button>
          )}
        </form>
      </div>
    );
  }

  // Screen 6 View: Products Screen
  return (
    <div className="mobile-products-page pb-32">
      {/* Top Header matching Screen 6 */}
      <MobileHeader 
        title="Products" 
        leftIcon="back"
        rightIcon="plus" 
        rightOnClick={onAddProduct}
      />
      
      {/* Search & Categories Bar matching Screen 6 */}
      <div className="sticky top-0 bg-[var(--bg-card)] z-30 shadow-sm border-b border-[var(--border-color)]">
        <div className="px-4 pt-3 pb-2 flex gap-2">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input 
              type="text" 
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-[var(--text-main)] outline-none focus:border-black dark:focus:border-white transition-colors" 
              placeholder="Search products or scan barcode..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            type="button"
            onClick={() => setSearchTerm('')}
            className="w-9 h-9 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] active:scale-95 transition-transform"
            aria-label="Filter"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
        
        {/* Category Pills matching Screen 6 */}
        <div className="px-4 pb-2.5 flex gap-2 overflow-x-auto hide-scrollbar">
          {combinedCats.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'bg-[#09090b] text-white dark:bg-white dark:text-black shadow-xs' 
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product List matching Screen 6 */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        {loading ? (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading products...</p>
        ) : displayProducts.length > 0 ? (
          displayProducts.map(product => {
            const price = Number(product.sellingPrice || product.price || 0);
            const stockQty = product.stockQuantity !== undefined ? product.stockQuantity : (product.stock || 0);
            const isLowStock = stockQty <= (product.minimumStock || product.lowStockThreshold || 5);
            const isOutOfStock = stockQty <= 0;

            return (
              <div 
                key={product.id} 
                className="flex items-center gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl active:scale-[0.98] transition-transform cursor-pointer shadow-xs hover:border-black/30 dark:hover:border-white/30"
                onClick={() => onProductClick(product)}
              >
                {/* Thumbnail */}
                <div className="w-13 h-13 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {product.imageUrl || product.image ? (
                    <img 
                      src={product.imageUrl || product.image} 
                      className="w-full h-full object-cover" 
                      alt={product.name}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base font-bold text-[var(--text-muted)] bg-gray-100 dark:bg-zinc-800">
                      {product.name ? product.name.slice(0, 2).toUpperCase() : 'PR'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-main)] truncate mb-0.5">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] truncate mb-1">
                    {product.category || 'Food'}
                  </p>
                  
                  {/* Price and Stock Status matching Screen 6 format */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className="text-[var(--text-main)] font-bold">
                      {currencySymbol}{price.toFixed(2)}
                    </span>
                    <span className="text-[var(--text-muted)]">·</span>
                    {isOutOfStock ? (
                      <span className="text-red-500 font-medium">Out of Stock</span>
                    ) : isLowStock ? (
                      <span className="text-amber-500 font-medium">Low Stock ({stockQty})</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">In Stock</span>
                    )}
                  </div>
                </div>

                {/* Right Chevron */}
                <ChevronRight size={18} className="text-[var(--text-muted)] flex-shrink-0" />
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <p className="text-sm text-[var(--text-muted)]">No products found</p>
            <button 
              type="button" 
              onClick={onAddProduct}
              className="px-4 py-2 rounded-xl bg-[#09090b] text-white text-xs font-semibold active:scale-95 transition-transform"
            >
              Add First Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileProducts;
