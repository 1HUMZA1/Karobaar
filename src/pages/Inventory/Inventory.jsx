import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, RefreshCw, 
  PackagePlus, X, Plus, Trash2, Edit, Image as ImageIcon, History, 
  Layers, CheckCircle2, Search, ArrowRightLeft, Download, Check
} from 'lucide-react';
import { db } from '../../services/databaseService';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import { TableSkeleton } from '../../components/ui/Skeleton';
import './Inventory.css';

const PRODUCT_RECOMMENDATIONS = {
  'Retail': ['T-Shirt', 'Jeans', 'Sneakers', 'Handbag', 'Sunglasses'],
  'Wholesale': ['Bulk Rice', 'Steel Pipes', 'Cotton Rolls', 'Pallet of Water'],
  'E-commerce': ['Wireless Mouse', 'Phone Case', 'USB Cable', 'Bluetooth Speaker'],
  'Services': ['Consultation Hour', 'Premium Service', 'Basic Maintenance'],
  'Manufacturing': ['Raw Plastic', 'Metal Screws', 'Wood Planks'],
  'Cafeteria / Restaurant': ['Espresso', 'Cappuccino', 'Sandwich', 'Pastry', 'Burger', 'French Fries'],
  'Other': ['General Item', 'Custom Product']
};

const Inventory = () => {
  const { currentUser, currentBusiness, userRole } = useAppContext();
  const canManageInventory = !userRole || ['OWNER', 'MANAGER', 'INVENTORY', 'ADMIN'].includes(String(userRole || '').toUpperCase());
  
  // Navigation tabs: 'levels', 'history', 'reconciliation'
  const [activeTab, setActiveTab] = useState('levels');
  const [productSearch, setProductSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL'); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK

  // Modals state
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  
  const [newProduct, setNewProduct] = useState({ 
    name: '', sku: '', stockQuantity: 0, minimumStock: 5, purchasePrice: 0, sellingPrice: 0, imageUrl: '',
    barcode: '', category: '', brand: '', status: 'Active',
    isBundle: false, requiresSerial: false, warrantyPeriod: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustReason, setAdjustReason] = useState('Count Error');
  const [adjustQuantity, setAdjustQuantity] = useState(0);

  // Receive stock multi-item state
  const [receiveItems, setReceiveItems] = useState([
    { id: Date.now(), productId: '', quantity: 1, batchNumber: '', expiryDate: '', serialNumbers: '', notes: '' }
  ]);

  // Stock Movement History state
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('ALL');

  // Stock Reconciliation state
  const [reconciliationCounts, setReconciliationCounts] = useState({});
  const [reconciliationReasons, setReconciliationReasons] = useState({});
  const [reconciliationSearch, setReconciliationSearch] = useState('');
  const [isApplyingReconciliation, setIsApplyingReconciliation] = useState(false);

  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const { data: inventory, loading, isRevalidating, refetch } = useCollection('products', currentUser?.activeBusinessId, {
    sortBy: (a, b) => (a.stockQuantity || 0) - (b.stockQuantity || 0)
  });

  // Load movements when switching to history tab
  const fetchMovements = async () => {
    if (!currentUser?.activeBusinessId) return;
    setLoadingMovements(true);
    try {
      const rawMovements = await db.getCollection('stock_movements', currentUser.activeBusinessId);
      const sorted = (rawMovements || []).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setMovements(sorted);
    } catch (err) {
      console.error('Failed to load stock movements:', err);
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMovements();
    }
  }, [activeTab, currentUser?.activeBusinessId]);

  // Overall stock stats
  const totalItems = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (Number(item.stockQuantity) || 0), 0);
  }, [inventory]);

  const stockValuation = useMemo(() => {
    return inventory.reduce((sum, item) => sum + ((Number(item.stockQuantity) || 0) * (Number(item.purchasePrice) || 0)), 0);
  }, [inventory]);

  const lowStock = useMemo(() => {
    return inventory.filter(item => (Number(item.stockQuantity) || 0) > 0 && (Number(item.stockQuantity) || 0) <= (Number(item.minimumStock) || 0)).length;
  }, [inventory]);

  const outOfStock = useMemo(() => {
    return inventory.filter(item => (Number(item.stockQuantity) || 0) === 0).length;
  }, [inventory]);

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = 
        !productSearch ||
        (item.name && item.name.toLowerCase().includes(productSearch.toLowerCase())) ||
        (item.sku && item.sku.toLowerCase().includes(productSearch.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(productSearch.toLowerCase()));

      const qty = Number(item.stockQuantity) || 0;
      const minStock = Number(item.minimumStock) || 0;

      if (!matchesSearch) return false;
      if (stockStatusFilter === 'OUT_OF_STOCK') return qty === 0;
      if (stockStatusFilter === 'LOW_STOCK') return qty > 0 && qty <= minStock;
      if (stockStatusFilter === 'IN_STOCK') return qty > minStock;
      return true;
    });
  }, [inventory, productSearch, stockStatusFilter]);

  // Filtered movements list
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesSearch = 
        !movementSearch ||
        (m.productName && m.productName.toLowerCase().includes(movementSearch.toLowerCase())) ||
        (m.sku && m.sku.toLowerCase().includes(movementSearch.toLowerCase())) ||
        (m.referenceId && m.referenceId.toLowerCase().includes(movementSearch.toLowerCase()));

      if (!matchesSearch) return false;
      if (movementTypeFilter !== 'ALL' && m.type !== movementTypeFilter) return false;
      return true;
    });
  }, [movements, movementSearch, movementTypeFilter]);

  // Filtered reconciliation products
  const reconciliationProducts = useMemo(() => {
    return inventory.filter(p => {
      if (!reconciliationSearch) return true;
      const term = reconciliationSearch.toLowerCase();
      return (p.name && p.name.toLowerCase().includes(term)) || (p.sku && p.sku.toLowerCase().includes(term));
    });
  }, [inventory, reconciliationSearch]);

  // Reconciliation variance summary
  const reconciliationSummary = useMemo(() => {
    let itemsCounted = 0;
    let discrepancyItems = 0;
    let totalNetVariance = 0;
    let totalVarianceValue = 0;

    Object.entries(reconciliationCounts).forEach(([productId, countVal]) => {
      if (countVal !== '' && !isNaN(countVal)) {
        itemsCounted++;
        const prod = inventory.find(p => p.id === productId);
        if (prod) {
          const systemQty = Number(prod.stockQuantity) || 0;
          const physicalQty = Number(countVal);
          const variance = physicalQty - systemQty;
          if (variance !== 0) {
            discrepancyItems++;
            totalNetVariance += variance;
            totalVarianceValue += variance * (Number(prod.purchasePrice) || 0);
          }
        }
      }
    });

    return { itemsCounted, discrepancyItems, totalNetVariance, totalVarianceValue };
  }, [reconciliationCounts, inventory]);

  // Apply Reconciliation Handler
  const handleApplyReconciliation = async () => {
    if (!currentUser?.activeBusinessId) return;
    const discrepancies = [];

    Object.entries(reconciliationCounts).forEach(([productId, countVal]) => {
      if (countVal !== '' && !isNaN(countVal)) {
        const prod = inventory.find(p => p.id === productId);
        if (prod) {
          const systemQty = Number(prod.stockQuantity) || 0;
          const physicalQty = Number(countVal);
          const variance = physicalQty - systemQty;
          if (variance !== 0) {
            discrepancies.push({
              product: prod,
              systemQty,
              physicalQty,
              variance,
              reason: reconciliationReasons[productId] || 'Physical Count Audit'
            });
          }
        }
      }
    });

    if (discrepancies.length === 0) {
      alert('No variances detected to reconcile. All counted quantities match system records.');
      return;
    }

    const confirmMsg = `Reconcile ${discrepancies.length} products with stock variances?\n\nThis will adjust inventory levels and write audit records to the movement history.`;
    if (!window.confirm(confirmMsg)) return;

    setIsApplyingReconciliation(true);
    try {
      for (const item of discrepancies) {
        // Update product stock
        await db.update('products', item.product.id, {
          stockQuantity: item.physicalQty
        }, currentUser.activeBusinessId);

        // Record stock movement
        await db.add('stock_movements', {
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku || '',
          type: 'reconciliation',
          quantity: item.variance,
          previousStock: item.systemQty,
          newStock: item.physicalQty,
          notes: `Reconciliation audit variance: ${item.variance > 0 ? '+' : ''}${item.variance} (${item.reason})`,
          date: new Date().toISOString(),
          createdBy: currentUser?.name || 'Inventory Auditor'
        }, currentUser.activeBusinessId);
      }

      alert(`Successfully reconciled ${discrepancies.length} products!`);
      setReconciliationCounts({});
      setReconciliationReasons({});
      refetch();
      if (activeTab === 'history') {
        fetchMovements();
      }
    } catch (err) {
      console.error('Reconciliation error:', err);
      alert('Failed to apply reconciliation: ' + (err.message || 'Unknown error'));
    } finally {
      setIsApplyingReconciliation(false);
    }
  };

  // CSV Export for Stock Movement History
  const exportMovementsCSV = () => {
    if (movements.length === 0) {
      alert('No stock movement records available to export.');
      return;
    }

    const headers = ['Date', 'Product Name', 'SKU', 'Movement Type', 'Quantity Delta', 'Before Stock', 'After Stock', 'Reference/Notes', 'Logged By'];
    const rows = movements.map(m => [
      `"${m.date ? new Date(m.date).toLocaleString() : ''}"`,
      `"${(m.productName || '').replace(/"/g, '""')}"`,
      `"${(m.sku || '').replace(/"/g, '""')}"`,
      `"${m.type || ''}"`,
      m.quantity,
      m.previousStock,
      m.newStock,
      `"${(m.notes || m.referenceId || '').replace(/"/g, '""')}"`,
      `"${(m.createdBy || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Karobaar_Stock_Movements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMovementBadge = (type) => {
    switch (type) {
      case 'purchase_receipt':
      case 'supplier_purchase':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">RESTOCK</span>;
      case 'sale':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-blue-500/30 text-blue-400 bg-blue-500/10">SALE</span>;
      case 'refund':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-purple-500/30 text-purple-400 bg-purple-500/10">REFUND</span>;
      case 'manual_adjustment':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/30 text-amber-400 bg-amber-500/10">ADJUSTMENT</span>;
      case 'reconciliation':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-indigo-500/30 text-indigo-400 bg-indigo-500/10">AUDIT</span>;
      default:
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-muted)] bg-zinc-800">{type}</span>;
    }
  };

  return (
    <div className="page-container inventory-page-container min-h-full pb-36">
      {/* Header */}
      <div className="inventory-header-container mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="inventory-title-group text-left">
          <h1 className="text-2xl font-bold flex items-center gap-3 text-[var(--text-main)]">
            Inventory & Stock Control
          </h1>
          <p className="text-secondary text-sm mt-1">Real-time stock valuation, movements audit ledger, and physical reconciliation</p>
        </div>
        {canManageInventory && (
          <div className="inventory-actions-group flex flex-wrap items-center gap-2.5">
            <Button 
              variant="outline" 
              icon={<RefreshCw size={16} className={isRevalidating ? "animate-spin" : ""} />} 
              onClick={() => { refetch(); if (activeTab === 'history') fetchMovements(); }} 
              disabled={isRevalidating} 
              className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]"
            >
              Refresh
            </Button>
            <Button 
              variant="outline" 
              icon={<Plus size={16} />} 
              onClick={() => setIsAddModalOpen(true)} 
              className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]"
            >
              Add Product
            </Button>
            <Button 
              icon={<PackagePlus size={16} />} 
              onClick={() => setIsReceiveModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white font-semibold shadow-sm"
            >
              Receive Stock
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="inventory-stats-grid mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="stat-icon bg-primary/10 text-primary p-3 rounded-xl flex items-center justify-center">
              <Package size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-secondary font-semibold">Total Stock Items</p>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mt-0.5">{totalItems.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="stat-icon bg-emerald-500/10 text-emerald-500 p-3 rounded-xl flex items-center justify-center font-bold text-lg">
              {currencySymbol}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-secondary font-semibold">Stock Valuation</p>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mt-0.5">{currencySymbol}{stockValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="stat-icon bg-amber-500/10 text-amber-500 p-3 rounded-xl flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-secondary font-semibold">Low Stock Items</p>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mt-0.5">{lowStock}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="stat-icon bg-rose-500/10 text-rose-500 p-3 rounded-xl flex items-center justify-center">
              <ArrowDownToLine size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-secondary font-semibold">Out of Stock</p>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mt-0.5">{outOfStock}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-[var(--border-color)] mb-6 gap-2">
        <button
          onClick={() => setActiveTab('levels')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'levels'
              ? 'border-[var(--text-main)] text-[var(--text-main)]'
              : 'border-transparent text-secondary hover:text-[var(--text-main)]'
          }`}
        >
          <Layers size={16} />
          Current Stock Levels
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-[var(--text-secondary)] font-mono">
            {inventory.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'history'
              ? 'border-[var(--text-main)] text-[var(--text-main)]'
              : 'border-transparent text-secondary hover:text-[var(--text-main)]'
          }`}
        >
          <History size={16} />
          Stock Movement Ledger
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'reconciliation'
              ? 'border-[var(--text-main)] text-[var(--text-main)]'
              : 'border-transparent text-secondary hover:text-[var(--text-main)]'
          }`}
        >
          <ArrowRightLeft size={16} />
          Stock Reconciliation Audit
        </button>
      </div>

      {/* TAB 1: CURRENT STOCK LEVELS */}
      {activeTab === 'levels' && (
        <Card className="border border-[var(--border-color)]">
          <CardHeader className="p-4 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by product name, SKU, or category..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:border-zinc-500 text-[var(--text-main)] placeholder:text-zinc-500"
                />
                {productSearch && (
                  <button onClick={() => setProductSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-[var(--text-main)]">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary font-medium uppercase tracking-wider">Status:</span>
              <div className="flex bg-[var(--bg-elevated)] p-0.5 rounded-lg border border-[var(--border-color)] text-xs">
                {['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStockStatusFilter(st)}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      stockStatusFilter === st
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-secondary hover:text-[var(--text-main)]'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'IN_STOCK' ? 'In Stock' : st === 'LOW_STOCK' ? 'Low' : 'Out'}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={8} cols={6} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[var(--border-color)]">
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Cost Price</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.length > 0 ? (
                      filteredInventory.map(item => {
                        const qty = Number(item.stockQuantity) || 0;
                        const min = Number(item.minimumStock) || 0;
                        const isOut = qty === 0;
                        const isLow = !isOut && qty <= min;

                        return (
                          <TableRow key={item.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                            <TableCell>
                              <div className="font-medium flex items-center gap-3">
                                {item.imageUrl ? (
                                  <div className="rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-elevated)] flex-shrink-0 w-10 h-10">
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0 text-text-muted w-10 h-10">
                                    <Package size={18} />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="font-semibold text-[var(--text-main)]">{item.name}</span>
                                  <div className="flex gap-1.5 mt-0.5">
                                    {item.category && <span className="text-[10px] text-[var(--text-muted)] bg-zinc-800/80 px-1.5 py-0.5 rounded">{item.category}</span>}
                                    {item.isBundle && <span className="text-[10px] bg-zinc-800 text-[var(--text-secondary)] border border-[var(--border-color)] px-1.5 py-0.5 rounded font-mono">BUNDLE</span>}
                                    {item.requiresSerial && <span className="text-[10px] bg-zinc-800 text-[var(--text-secondary)] border border-[var(--border-color)] px-1.5 py-0.5 rounded font-mono">SERIAL</span>}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-secondary font-mono text-sm">{item.sku || '—'}</TableCell>
                            <TableCell className="text-secondary font-mono">{currencySymbol}{(Number(item.purchasePrice) || 0).toFixed(2)}</TableCell>
                            <TableCell className="font-semibold font-mono text-white">{currencySymbol}{(Number(item.sellingPrice) || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={`font-mono text-base font-bold ${isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {qty}
                              </span>
                            </TableCell>
                            <TableCell className="text-secondary font-mono">{min}</TableCell>
                            <TableCell>
                              {isOut ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  Out of Stock
                                </span>
                              ) : isLow ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  In Stock
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {canManageInventory && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      icon={<Edit size={14} />} 
                                      onClick={() => { setEditingProduct(item); setIsEditModalOpen(true); }}
                                      className="h-8 px-2.5 text-xs bg-[var(--bg-card)]"
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      icon={<ArrowUpFromLine size={14} />} 
                                      onClick={() => { 
                                        setAdjustingProduct(item); 
                                        setAdjustQuantity(item.stockQuantity || 0); 
                                        setAdjustReason('Count Error'); 
                                        setIsAdjustModalOpen(true); 
                                      }}
                                      className="h-8 px-2.5 text-xs bg-[var(--bg-card)]"
                                    >
                                      Adjust
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-zinc-500">
                          No products found matching the criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: STOCK MOVEMENT LEDGER */}
      {activeTab === 'history' && (
        <Card className="border border-[var(--border-color)]">
          <CardHeader className="p-4 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search movement by product, SKU, or ref..."
                  value={movementSearch}
                  onChange={e => setMovementSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:border-zinc-500 text-[var(--text-main)] placeholder:text-zinc-500"
                />
                {movementSearch && (
                  <button onClick={() => setMovementSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-[var(--text-main)]">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={movementTypeFilter}
                onChange={e => setMovementTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Event Types</option>
                <option value="purchase_receipt">Restock Receipts</option>
                <option value="supplier_purchase">Supplier Purchases</option>
                <option value="sale">POS Sales</option>
                <option value="refund">Refunds</option>
                <option value="manual_adjustment">Manual Adjustments</option>
                <option value="reconciliation">Audit Reconciliations</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                icon={<Download size={14} />}
                onClick={exportMovementsCSV}
                className="h-8 px-3 text-xs bg-[var(--bg-card)]"
              >
                Export CSV
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingMovements ? (
              <div className="p-6">
                <TableSkeleton rows={8} cols={7} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[var(--border-color)]">
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity Delta</TableHead>
                      <TableHead>Stock Level Change</TableHead>
                      <TableHead>Reference / Reason</TableHead>
                      <TableHead>Logged By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.length > 0 ? (
                      filteredMovements.map(m => {
                        const qtyNum = Number(m.quantity) || 0;
                        const isPositive = qtyNum > 0;
                        const dateFormatted = m.date ? new Date(m.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—';

                        return (
                          <TableRow key={m.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                            <TableCell className="text-xs text-secondary font-mono">{dateFormatted}</TableCell>
                            <TableCell>
                              <div className="font-semibold text-[var(--text-main)] text-sm">{m.productName || 'Unknown Product'}</div>
                              {m.sku && <div className="text-[11px] text-secondary font-mono">{m.sku}</div>}
                            </TableCell>
                            <TableCell>
                              {getMovementBadge(m.type)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                                {isPositive ? `+${qtyNum}` : qtyNum}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-secondary">
                              <span className="text-[var(--text-muted)]">{m.previousStock ?? '—'}</span>
                              <span className="mx-1 text-zinc-600">→</span>
                              <span className="font-semibold text-[var(--text-main)]">{m.newStock ?? '—'}</span>
                            </TableCell>
                            <TableCell className="text-xs text-[var(--text-secondary)] max-w-xs truncate">
                              {m.notes || m.referenceId || 'Stock activity'}
                            </TableCell>
                            <TableCell className="text-xs text-secondary">{m.createdBy || 'System'}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                          No stock movement history recorded yet. Restocks, sales, and adjustments will appear here.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: STOCK RECONCILIATION AUDIT */}
      {activeTab === 'reconciliation' && (
        <div className="flex flex-col gap-6">
          <Card className="border border-[var(--border-color)] bg-[var(--bg-elevated)]">
            <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                  <ArrowRightLeft size={18} className="text-[var(--text-secondary)]" />
                  Physical Inventory Count & Reconciliation
                </h3>
                <p className="text-xs text-secondary mt-1">
                  Enter actual counted quantities in your warehouse/shop. Karobaar computes variances and posts balancing ledger entries upon commit.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-[var(--bg-elevated)] px-4 py-2.5 rounded-xl border border-[var(--border-color)]">
                <div className="text-right">
                  <div className="text-xs text-secondary">Counted Items</div>
                  <div className="font-bold text-sm text-[var(--text-main)] font-mono">{reconciliationSummary.itemsCounted} / {inventory.length}</div>
                </div>
                <div className="h-7 w-px bg-zinc-800" />
                <div className="text-right">
                  <div className="text-xs text-secondary">Variances Detected</div>
                  <div className={`font-bold text-sm font-mono ${reconciliationSummary.discrepancyItems > 0 ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>
                    {reconciliationSummary.discrepancyItems} items
                  </div>
                </div>
                <div className="h-7 w-px bg-zinc-800" />
                <div className="text-right">
                  <div className="text-xs text-secondary">Net Discrepancy Value</div>
                  <div className={`font-bold text-sm font-mono ${reconciliationSummary.totalVarianceValue < 0 ? 'text-rose-400' : reconciliationSummary.totalVarianceValue > 0 ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
                    {currencySymbol}{reconciliationSummary.totalVarianceValue.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border-color)]">
            <CardHeader className="p-4 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter products to count..."
                  value={reconciliationSearch}
                  onChange={e => setReconciliationSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:border-zinc-500 text-[var(--text-main)] placeholder:text-zinc-500"
                />
                {reconciliationSearch && (
                  <button onClick={() => setReconciliationSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-[var(--text-main)]">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const preset = {};
                    inventory.forEach(p => { preset[p.id] = p.stockQuantity || 0; });
                    setReconciliationCounts(preset);
                  }}
                  className="h-8 px-3 text-xs bg-[var(--bg-card)]"
                >
                  Preset All System Counts
                </Button>

                <Button
                  size="sm"
                  icon={<Check size={14} />}
                  onClick={handleApplyReconciliation}
                  disabled={isApplyingReconciliation || reconciliationSummary.discrepancyItems === 0}
                  className="h-8 px-4 text-xs font-semibold"
                >
                  {isApplyingReconciliation ? 'Posting Reconciliations...' : `Commit & Apply (${reconciliationSummary.discrepancyItems} adjustments)`}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[var(--border-color)]">
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">System Stock</TableHead>
                      <TableHead className="w-36 text-center">Physical Count</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Valuation Discrepancy</TableHead>
                      <TableHead>Reason for Discrepancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliationProducts.map(p => {
                      const systemQty = Number(p.stockQuantity) || 0;
                      const countVal = reconciliationCounts[p.id];
                      const isCounted = countVal !== undefined && countVal !== '';
                      const physicalQty = isCounted ? Number(countVal) : systemQty;
                      const variance = isCounted ? (physicalQty - systemQty) : 0;
                      const discrepancyVal = variance * (Number(p.purchasePrice) || 0);

                      return (
                        <TableRow key={p.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                          <TableCell>
                            <div className="font-semibold text-[var(--text-main)] text-sm">{p.name}</div>
                            {p.category && <div className="text-[11px] text-secondary">{p.category}</div>}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-secondary">{p.sku || '—'}</TableCell>
                          <TableCell className="text-right font-mono font-semibold text-[var(--text-main)]">{systemQty}</TableCell>
                          <TableCell>
                            <input
                              type="number"
                              min="0"
                              placeholder={String(systemQty)}
                              value={countVal !== undefined ? countVal : ''}
                              onChange={e => {
                                const val = e.target.value;
                                setReconciliationCounts(prev => ({ ...prev, [p.id]: val }));
                              }}
                              className="w-28 mx-auto block px-3 py-1.5 text-center rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-zinc-400"
                            />
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {isCounted ? (
                              <span className={variance === 0 ? 'text-zinc-500' : variance > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {variance > 0 ? `+${variance}` : variance}
                              </span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {isCounted && variance !== 0 ? (
                              <span className={discrepancyVal < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                {currencySymbol}{discrepancyVal.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isCounted && variance !== 0 ? (
                              <select
                                value={reconciliationReasons[p.id] || 'Physical Count Audit'}
                                onChange={e => {
                                  const r = e.target.value;
                                  setReconciliationReasons(prev => ({ ...prev, [p.id]: r }));
                                }}
                                className="px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] focus:outline-none"
                              >
                                <option value="Physical Count Audit">Physical Count Audit</option>
                                <option value="Damaged / Broken">Damaged / Broken</option>
                                <option value="Theft / Unaccounted Shrink">Theft / Shrink</option>
                                <option value="Unrecorded Restock">Unrecorded Restock</option>
                                <option value="Expired / Discarded">Expired / Discarded</option>
                              </select>
                            ) : (
                              <span className="text-xs text-zinc-600">No variance</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="biz-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="biz-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="biz-modal-header">
              <h2 className="text-lg font-bold">Add New Product</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="biz-modal-body flex flex-col gap-5 max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex gap-5 items-start">
                <div 
                  style={{ 
                    width: '110px', 
                    height: '110px', 
                    minWidth: '110px',
                    borderRadius: '12px',
                    border: '2px dashed var(--border-color)',
                    backgroundColor: 'var(--bg-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                >
                  {newProduct.imageUrl ? (
                    <img src={newProduct.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon size={22} style={{ marginBottom: '6px' }} />
                      <span style={{ fontSize: '11px', fontWeight: 500 }}>Add Image</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={(e) => handleImageUpload(e, setNewProduct)} />
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1">Product Name *</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-xl focus:outline-none transition-colors text-base mb-2 shadow-sm" 
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="e.g. Premium Cotton T-Shirt"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {(PRODUCT_RECOMMENDATIONS[currentBusiness?.type] || PRODUCT_RECOMMENDATIONS['Retail']).slice(0, 5).map(s => (
                      <span 
                        key={s} 
                        onClick={() => setNewProduct({...newProduct, name: s})}
                        className="text-xs px-2.5 py-1 rounded-full transition-all font-medium cursor-pointer flex items-center gap-1 hover:bg-[var(--bg-hover)]"
                        style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                      >
                        <Plus size={12} /> {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-xl focus:outline-none transition-colors text-sm shadow-sm" 
                    value={newProduct.sku}
                    onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                    placeholder="e.g. TSH-001"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Barcode / UPC</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-xl focus:outline-none transition-colors text-sm shadow-sm" 
                    value={newProduct.barcode}
                    onChange={e => setNewProduct({...newProduct, barcode: e.target.value})}
                    placeholder="Scan or type"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-xl focus:outline-none transition-colors text-sm shadow-sm" 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    placeholder="e.g. Apparel"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brand / Supplier</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-xl focus:outline-none transition-colors text-sm shadow-sm" 
                    value={newProduct.brand}
                    onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                    placeholder="e.g. Karobaar Essentials"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Purchase / Cost Price ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full p-2.5 rounded-xl focus:outline-none transition-colors text-sm shadow-sm" 
                    value={newProduct.purchasePrice}
                    onChange={e => setNewProduct({...newProduct, purchasePrice: parseFloat(e.target.value) || 0})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Selling Price ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full p-2.5 rounded-xl focus:outline-none transition-colors text-sm shadow-sm" 
                    value={newProduct.sellingPrice}
                    onChange={e => setNewProduct({...newProduct, sellingPrice: parseFloat(e.target.value) || 0})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Initial Opening Stock</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 rounded-xl focus:outline-none transition-colors text-sm shadow-sm" 
                    value={newProduct.stockQuantity}
                    onChange={e => setNewProduct({...newProduct, stockQuantity: parseInt(e.target.value) || 0})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Stock Alert</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 rounded-xl focus:outline-none transition-colors text-sm shadow-sm" 
                    value={newProduct.minimumStock}
                    onChange={e => setNewProduct({...newProduct, minimumStock: parseInt(e.target.value) || 0})}
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-3 border-t border-[var(--border-color)]">
                <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">Product Options</h4>
                <div className="flex flex-wrap gap-5">
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="checkbox" checked={newProduct.isBundle} onChange={(e) => setNewProduct({...newProduct, isBundle: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                    <span className="text-sm font-medium">Bundle / Combo Product</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="checkbox" checked={newProduct.requiresSerial} onChange={(e) => setNewProduct({...newProduct, requiresSerial: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                    <span className="text-sm font-medium">Track Serial Numbers</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="biz-modal-footer mt-4">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!newProduct.name.trim()) return alert('Product name is required');
                try {
                  const added = await db.add('products', { ...newProduct, businessId: currentUser.activeBusinessId }, currentUser.activeBusinessId);
                  
                  // If opening stock > 0, log opening stock movement
                  if (Number(newProduct.stockQuantity) > 0) {
                    try {
                      await db.add('stock_movements', {
                        productId: added?.id || 'new',
                        productName: newProduct.name,
                        sku: newProduct.sku || '',
                        type: 'purchase_receipt',
                        quantity: Number(newProduct.stockQuantity),
                        previousStock: 0,
                        newStock: Number(newProduct.stockQuantity),
                        notes: 'Initial opening stock creation',
                        date: new Date().toISOString(),
                        createdBy: currentUser?.name || 'Staff'
                      }, currentUser.activeBusinessId);
                    } catch (e) {}
                  }

                  setIsAddModalOpen(false);
                  setNewProduct({ 
                    name: '', sku: '', stockQuantity: 0, minimumStock: 5, purchasePrice: 0, sellingPrice: 0, imageUrl: '',
                    barcode: '', category: '', brand: '', status: 'Active',
                    isBundle: false, requiresSerial: false, warrantyPeriod: ''
                  });
                  refetch();
                } catch (e) {
                  console.error(e);
                  alert('Failed to add product');
                }
              }}>Save Product</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="biz-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="biz-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="biz-modal-header">
              <h2 className="text-lg font-bold">Edit Product: {editingProduct.name}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="biz-modal-body flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex gap-4 items-center">
                <div 
                  style={{ 
                    width: '90px', 
                    height: '90px', 
                    borderRadius: '12px',
                    border: '2px dashed var(--border-color)',
                    backgroundColor: 'var(--bg-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {editingProduct.imageUrl ? (
                    <img src={editingProduct.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageIcon size={22} className="text-secondary" />
                  )}
                  <input type="file" accept="image/*" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={(e) => handleImageUpload(e, setEditingProduct)} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1">Product Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-base focus:outline-none" 
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input 
                    type="text" 
                    className="w-full p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none" 
                    value={editingProduct.sku || ''}
                    onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Barcode</label>
                  <input 
                    type="text" 
                    className="w-full p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none" 
                    value={editingProduct.barcode || ''}
                    onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cost Price ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none" 
                    value={editingProduct.purchasePrice ?? ''}
                    onChange={e => setEditingProduct({...editingProduct, purchasePrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Selling Price ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none" 
                    value={editingProduct.sellingPrice ?? ''}
                    onChange={e => setEditingProduct({...editingProduct, sellingPrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Stock Alert</label>
                  <input 
                    type="number" 
                    className="w-full p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none" 
                    value={editingProduct.minimumStock ?? 5}
                    onChange={e => setEditingProduct({...editingProduct, minimumStock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input 
                    type="text" 
                    className="w-full p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none" 
                    value={editingProduct.category || ''}
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="biz-modal-footer mt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!editingProduct.name.trim()) return alert('Product name is required');
                try {
                  await db.update('products', editingProduct.id, editingProduct, currentUser.activeBusinessId);
                  setIsEditModalOpen(false);
                  refetch();
                } catch (e) {
                  console.error(e);
                  alert('Failed to update product');
                }
              }}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Stock Modal */}
      {isReceiveModalOpen && (
        <div className="biz-modal-overlay" onClick={() => setIsReceiveModalOpen(false)}>
          <div className="biz-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="biz-modal-header">
              <h2 className="text-lg font-bold">Receive New Stock (Restock)</h2>
              <button onClick={() => setIsReceiveModalOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="biz-modal-body flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {receiveItems.map((item, index) => (
                <div key={item.id} className="p-4 rounded-xl relative border border-[var(--border-color)] bg-[var(--bg-hover)]">
                  {receiveItems.length > 1 && (
                    <button 
                      className="absolute top-3 right-3 text-rose-400 hover:text-rose-300"
                      onClick={() => setReceiveItems(prev => prev.filter(i => i.id !== item.id))}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-secondary">Line Item #{index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium mb-1">Product *</label>
                      <select 
                        className="w-full p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none"
                        value={item.productId}
                        onChange={e => {
                          const newItems = [...receiveItems];
                          newItems[index].productId = e.target.value;
                          setReceiveItems(newItems);
                        }}
                      >
                        <option value="">-- Select Product to Restock --</option>
                        {inventory.map(invItem => (
                          <option key={invItem.id} value={invItem.id}>
                            {invItem.name} (Current: {invItem.stockQuantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Quantity *</label>
                      <input 
                        type="number" 
                        min="1" 
                        className="w-full p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-bold text-center focus:outline-none" 
                        value={item.quantity}
                        onChange={e => {
                          const newItems = [...receiveItems];
                          newItems[index].quantity = parseInt(e.target.value) || 0;
                          setReceiveItems(newItems);
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Batch # (Optional)</label>
                      <input 
                        type="text" 
                        className="w-full p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-xs focus:outline-none" 
                        value={item.batchNumber}
                        onChange={e => {
                          const newItems = [...receiveItems];
                          newItems[index].batchNumber = e.target.value;
                          setReceiveItems(newItems);
                        }}
                        placeholder="e.g. BATCH-2026-01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Expiry Date (Optional)</label>
                      <input 
                        type="date" 
                        className="w-full p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-xs focus:outline-none" 
                        value={item.expiryDate}
                        onChange={e => {
                          const newItems = [...receiveItems];
                          newItems[index].expiryDate = e.target.value;
                          setReceiveItems(newItems);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Notes / Supplier Reference</label>
                    <input 
                      type="text" 
                      className="w-full p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-xs focus:outline-none" 
                      value={item.notes}
                      onChange={e => {
                        const newItems = [...receiveItems];
                        newItems[index].notes = e.target.value;
                        setReceiveItems(newItems);
                      }}
                      placeholder="e.g. Invoice #9983 from Wholesale Supplier"
                    />
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center mt-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={<Plus size={14} />}
                  onClick={() => setReceiveItems(prev => [...prev, { id: Date.now(), productId: '', quantity: 1, batchNumber: '', expiryDate: '', serialNumbers: '', notes: '' }])}
                  className="bg-[var(--bg-card)] text-xs"
                >
                  Add Another Line Item
                </Button>
              </div>
            </div>

            <div className="biz-modal-footer mt-4">
              <Button variant="outline" onClick={() => setIsReceiveModalOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                const validItems = receiveItems.filter(i => i.productId && Number(i.quantity) > 0);
                if (validItems.length === 0) return alert('Please select at least one product with quantity greater than zero.');
                
                try {
                  for (const item of validItems) {
                    const prod = inventory.find(p => p.id === item.productId);
                    if (prod) {
                      const prevStock = Number(prod.stockQuantity) || 0;
                      const addQty = Number(item.quantity);
                      const nextStock = prevStock + addQty;

                      const updateData = { stockQuantity: nextStock };
                      if (item.batchNumber) updateData.batchNumber = item.batchNumber;
                      if (item.expiryDate) updateData.expiryDate = item.expiryDate;
                      
                      await db.update('products', prod.id, updateData, currentUser.activeBusinessId);

                      // Log stock movement audit
                      await db.add('stock_movements', {
                        productId: prod.id,
                        productName: prod.name,
                        sku: prod.sku || '',
                        type: 'purchase_receipt',
                        quantity: addQty,
                        previousStock: prevStock,
                        newStock: nextStock,
                        notes: item.notes || 'Restock receipt',
                        batchNumber: item.batchNumber || '',
                        date: new Date().toISOString(),
                        createdBy: currentUser?.name || 'Staff'
                      }, currentUser.activeBusinessId);
                    }
                  }
                  setIsReceiveModalOpen(false);
                  setReceiveItems([{ id: Date.now(), productId: '', quantity: 1, batchNumber: '', expiryDate: '', serialNumbers: '', notes: '' }]);
                  refetch();
                  if (activeTab === 'history') fetchMovements();
                  alert(`Successfully received ${validItems.length} product restocks.`);
                } catch (e) {
                  console.error(e);
                  alert('Failed to receive stock');
                }
              }}>Confirm Receipt & Restock</Button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="biz-modal-overlay" onClick={() => setIsAdjustModalOpen(false)}>
          <div className="biz-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="biz-modal-header">
              <h2 className="text-lg font-bold">Adjust Stock: {adjustingProduct.name}</h2>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="biz-modal-body flex flex-col gap-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <span className="text-sm text-secondary font-medium">Current System Stock:</span>
                <span className="font-mono text-xl font-bold text-[var(--text-main)]">{adjustingProduct.stockQuantity || 0}</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">New Physical Stock Quantity *</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-white text-lg font-bold text-center focus:outline-none" 
                  value={adjustQuantity}
                  onChange={e => setAdjustQuantity(parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason for Adjustment *</label>
                <select 
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                >
                  <option value="Count Error">Count Correction</option>
                  <option value="Damaged">Damaged / Broken</option>
                  <option value="Expired">Expired Goods</option>
                  <option value="Theft / Loss">Theft / Shrinkage</option>
                  <option value="Internal Use">Store / Internal Use</option>
                  <option value="Found Stock">Found Stock</option>
                </select>
              </div>

              <div className="text-xs text-secondary bg-[var(--bg-hover)] p-3 rounded-lg border border-[var(--border-color)]">
                Calculated adjustment delta: <strong className={adjustQuantity - (adjustingProduct.stockQuantity || 0) >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                  {adjustQuantity - (adjustingProduct.stockQuantity || 0) >= 0 ? `+${adjustQuantity - (adjustingProduct.stockQuantity || 0)}` : adjustQuantity - (adjustingProduct.stockQuantity || 0)}
                </strong>
              </div>
            </div>

            <div className="biz-modal-footer mt-4">
              <Button variant="outline" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                const prev = Number(adjustingProduct.stockQuantity) || 0;
                const next = Number(adjustQuantity);
                const delta = next - prev;

                try {
                  await db.update('products', adjustingProduct.id, {
                    stockQuantity: next
                  }, currentUser.activeBusinessId);

                  // Log to stock movements
                  await db.add('stock_movements', {
                    productId: adjustingProduct.id,
                    productName: adjustingProduct.name,
                    sku: adjustingProduct.sku || '',
                    type: 'manual_adjustment',
                    quantity: delta,
                    previousStock: prev,
                    newStock: next,
                    notes: `Manual adjustment: ${adjustReason}`,
                    date: new Date().toISOString(),
                    createdBy: currentUser?.name || 'Staff'
                  }, currentUser.activeBusinessId);

                  setIsAdjustModalOpen(false);
                  refetch();
                  if (activeTab === 'history') fetchMovements();
                } catch (e) {
                  console.error(e);
                  alert('Failed to adjust stock');
                }
              }}>Confirm Adjustment</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
