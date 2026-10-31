import React, { useState, useMemo } from 'react';
import { 
  Download, TrendingUp, Users, Box, Banknote, Calendar, BarChart3, 
  Briefcase, FileText, Loader2, PackageX, Zap, Printer, AlertCircle, 
  DollarSign, Wallet, CheckCircle2, FileSpreadsheet, Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileReports } from './MobileReports';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';
import './Reports.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement);

const Reports = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';
  
  // Permission Gate: Profit & Loss is restricted to Owner, Manager, and Accountant
  const canViewProfit = hasPermission(currentUser, PERMISSIONS.REPORTS_PROFIT_VIEW);

  // Date filtering: 'today', 'yesterday', '7d', 'this_month', 'all_time'
  const [dateRange, setDateRange] = useState('this_month');
  const [activeTab, setActiveTab] = useState(() => canViewProfit ? 'pnl' : 'cash'); // pnl, cash, receivables, payables, inventory, exports
  const [, setExporting] = useState(null);

  // Collections
  const { data: sales = [] } = useCollection('sales', currentUser?.activeBusinessId);
  const { data: expenses = [] } = useCollection('expenses', currentUser?.activeBusinessId);
  const { data: products = [] } = useCollection('products', currentUser?.activeBusinessId);
  const { data: customers = [] } = useCollection('customers', currentUser?.activeBusinessId);
  const { data: purchases = [] } = useCollection('purchases', currentUser?.activeBusinessId);
  const { data: suppliers = [] } = useCollection('suppliers', currentUser?.activeBusinessId);

  // Filter Boundaries
  const filterBounds = useMemo(() => {
    const now = new Date();
    if (dateRange === 'today') {
      return { start: startOfDay(now), end: endOfDay(now), label: 'Today (' + format(now, 'MMM dd, yyyy') + ')' };
    }
    if (dateRange === 'yesterday') {
      const y = subDays(now, 1);
      return { start: startOfDay(y), end: endOfDay(y), label: 'Yesterday (' + format(y, 'MMM dd, yyyy') + ')' };
    }
    if (dateRange === '7d') {
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now), label: 'Last 7 Days' };
    }
    if (dateRange === 'this_month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfDay(monthStart), end: endOfDay(now), label: format(now, 'MMMM yyyy') };
    }
    return { start: new Date(0), end: new Date(8640000000000000), label: 'All Time' };
  }, [dateRange]);

  // Filtered Collections by Period
  const periodSales = useMemo(() => {
    return sales.filter(s => {
      if (s.status === 'cancelled' || s.status === 'Refunded' || s.status === 'Cancelled') return false;
      if (dateRange === 'all_time') return true;
      if (!s.date) return false;
      const d = new Date(s.date);
      return isWithinInterval(d, { start: filterBounds.start, end: filterBounds.end });
    });
  }, [sales, filterBounds, dateRange]);

  const periodExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (dateRange === 'all_time') return true;
      if (!e.date) return false;
      const d = new Date(e.date);
      return isWithinInterval(d, { start: filterBounds.start, end: filterBounds.end });
    });
  }, [expenses, filterBounds, dateRange]);

  // Product cost map for COGS calculation
  const productCostMap = useMemo(() => {
    const map = {};
    products.forEach(p => {
      map[p.id] = {
        purchasePrice: Number(p.purchasePrice || p.costPrice || 0),
        name: p.name,
        hasCost: (p.purchasePrice !== undefined && p.purchasePrice !== null && Number(p.purchasePrice) > 0) || (p.costPrice !== undefined && Number(p.costPrice) > 0)
      };
    });
    return map;
  }, [products]);

  // Incomplete Financial Data Flagging
  const incompleteCostInfo = useMemo(() => {
    const missingProductIds = new Set();
    let missingSalesCount = 0;

    periodSales.forEach(s => {
      if (Array.isArray(s.items)) {
        s.items.forEach(item => {
          const prodInfo = productCostMap[item.productId];
          if (!prodInfo || !prodInfo.hasCost) {
            missingProductIds.add(item.name || item.productId || 'Unknown Item');
            missingSalesCount++;
          }
        });
      }
    });

    return {
      hasIncompleteData: missingProductIds.size > 0,
      missingProductCount: missingProductIds.size,
      missingProductNames: Array.from(missingProductIds).slice(0, 3),
      affectedTransactions: missingSalesCount
    };
  }, [periodSales, productCostMap]);

  // --- FINANCIAL CALCULATIONS (P&L & REVENUE) ---
  const pnlData = useMemo(() => {
    let grossRevenue = 0;
    let discountsGiven = 0;
    let netRevenue = 0;
    let totalCOGS = 0;

    periodSales.forEach(s => {
      const saleNet = Number(s.amountPaid || s.total || 0);
      const saleDiscount = Number(s.discountAmount || s.discount || 0);
      grossRevenue += (saleNet + saleDiscount);
      discountsGiven += saleDiscount;
      netRevenue += saleNet;

      if (Array.isArray(s.items)) {
        s.items.forEach(item => {
          const qty = Number(item.quantity) || 1;
          const cost = productCostMap[item.productId]?.purchasePrice || Number(item.costPrice || 0);
          totalCOGS += (qty * cost);
        });
      }
    });

    const grossProfit = netRevenue - totalCOGS;
    const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    // Categorized Operating Expenses
    const expenseBreakdown = {
      'Rent & Facility': 0,
      'Utilities & Bills': 0,
      'Salaries & Wages': 0,
      'Marketing & Ads': 0,
      'Supplies & Operations': 0,
      'General & Administrative': 0
    };

    let totalOpExpenses = 0;
    periodExpenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      totalOpExpenses += amt;
      const cat = (e.category || '').toLowerCase();
      if (cat.includes('rent')) expenseBreakdown['Rent & Facility'] += amt;
      else if (cat.includes('util') || cat.includes('electric') || cat.includes('water') || cat.includes('bill')) expenseBreakdown['Utilities & Bills'] += amt;
      else if (cat.includes('salar') || cat.includes('wage') || cat.includes('payroll')) expenseBreakdown['Salaries & Wages'] += amt;
      else if (cat.includes('market') || cat.includes('ad') || cat.includes('promo')) expenseBreakdown['Marketing & Ads'] += amt;
      else if (cat.includes('suppl') || cat.includes('pack') || cat.includes('store')) expenseBreakdown['Supplies & Operations'] += amt;
      else expenseBreakdown['General & Administrative'] += amt;
    });

    const netProfit = grossProfit - totalOpExpenses;
    const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    return {
      grossRevenue,
      discountsGiven,
      netRevenue,
      totalCOGS,
      grossProfit,
      grossMargin,
      totalOpExpenses,
      expenseBreakdown,
      netProfit,
      netMargin,
      ordersCount: periodSales.length,
      averageOrderValue: periodSales.length > 0 ? (netRevenue / periodSales.length) : 0
    };
  }, [periodSales, periodExpenses, productCostMap]);

  // --- CASH FLOW & TENDER BREAKDOWN ---
  const tenderAndCashData = useMemo(() => {
    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let udhaarSales = 0;
    let otherSales = 0;

    periodSales.forEach(s => {
      const amt = Number(s.amountPaid || s.total || 0);
      const mode = (s.paymentMethod || '').toLowerCase();
      if (mode.includes('cash')) cashSales += amt;
      else if (mode.includes('upi') || mode.includes('gpay') || mode.includes('phonepe') || mode.includes('paytm')) upiSales += amt;
      else if (mode.includes('card') || mode.includes('debit') || mode.includes('credit')) cardSales += amt;
      else if (mode.includes('udhaar') || mode.includes('due') || mode.includes('credit_khata') || s.paymentStatus === 'Pending') udhaarSales += amt;
      else otherSales += amt;
    });

    // Cash Expenses
    let cashExpenses = 0;
    let nonCashExpenses = 0;
    periodExpenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      const mode = (e.paymentMethod || '').toLowerCase();
      if (mode.includes('cash')) cashExpenses += amt;
      else nonCashExpenses += amt;
    });

    // Net Register Cash Flow
    const netCashFlow = cashSales - cashExpenses;

    return {
      cashSales,
      upiSales,
      cardSales,
      udhaarSales,
      otherSales,
      cashExpenses,
      nonCashExpenses,
      netCashFlow
    };
  }, [periodSales, periodExpenses]);

  // --- RECEIVABLES & PAYABLES ---
  const receivables = useMemo(() => {
    const list = customers
      .filter(c => (Number(c.outstandingBalance) || 0) > 0)
      .sort((a, b) => (Number(b.outstandingBalance) || 0) - (Number(a.outstandingBalance) || 0));
    const totalReceivable = list.reduce((sum, c) => sum + (Number(c.outstandingBalance) || 0), 0);
    return { list, totalReceivable, count: list.length };
  }, [customers]);

  const payables = useMemo(() => {
    const pendingPurchases = purchases.filter(p => p.status === 'Pending' || p.paymentStatus === 'Pending');
    const totalPendingPO = pendingPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    return {
      pendingPurchases,
      totalPendingPO,
      suppliersCount: suppliers.length
    };
  }, [purchases, suppliers]);

  // --- PRODUCT PERFORMANCE & DEAD STOCK ---
  const productAnalytics = useMemo(() => {
    const pMap = {};
    products.forEach(p => {
      pMap[p.id] = { ...p, unitsSold: 0, revenue: 0 };
    });

    periodSales.forEach(s => {
      if (Array.isArray(s.items)) {
        s.items.forEach(it => {
          if (pMap[it.productId]) {
            pMap[it.productId].unitsSold += (Number(it.quantity) || 0);
            pMap[it.productId].revenue += ((Number(it.quantity) || 0) * (Number(it.price) || 0));
          }
        });
      }
    });

    const all = Object.values(pMap);
    const topSellers = [...all].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 10);
    const deadStock = all.filter(p => p.unitsSold === 0 && Number(p.stockQuantity) > 5).sort((a, b) => Number(b.stockQuantity) - Number(a.stockQuantity));
    const totalInventoryValuation = products.reduce((sum, p) => sum + ((Number(p.stockQuantity) || 0) * (Number(p.purchasePrice || p.costPrice || 0))), 0);

    return { topSellers, deadStock, totalInventoryValuation };
  }, [products, periodSales]);

  // Export CSV functions
  const downloadCSV = (filename, rows) => {
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (type) => {
    setExporting(type);
    try {
      if (type === 'PNL') {
        const rows = [
          ["Karobaar Business Management - Profit & Loss Statement"],
          ["Period", `"${filterBounds.label}"`],
          ["Generated At", `"${new Date().toLocaleString()}"`],
          [""],
          ["Line Item", "Amount"],
          ["Gross Sales", pnlData.grossRevenue.toFixed(2)],
          ["Less: Customer Discounts", (-pnlData.discountsGiven).toFixed(2)],
          ["Net Sales Revenue", pnlData.netRevenue.toFixed(2)],
          ["Cost of Goods Sold (COGS)", (-pnlData.totalCOGS).toFixed(2)],
          ["Gross Profit", pnlData.grossProfit.toFixed(2)],
          ["Gross Margin %", `${pnlData.grossMargin.toFixed(1)}%`],
          [""],
          ["Operating Expenses:"],
          ...Object.entries(pnlData.expenseBreakdown).map(([cat, amt]) => [`"${cat}"`, amt.toFixed(2)]),
          ["Total Operating Expenses", (-pnlData.totalOpExpenses).toFixed(2)],
          [""],
          ["Net Profit / (Loss)", pnlData.netProfit.toFixed(2)],
          ["Net Margin %", `${pnlData.netMargin.toFixed(1)}%`]
        ];
        downloadCSV(`Karobaar_PNL_${dateRange}_${format(new Date(), 'yyyyMMdd')}.csv`, rows);
      } else if (type === 'Sales') {
        const rows = [
          ["Invoice / ID", "Date", "Customer", "Payment Method", "Items Count", "Total Amount", "Status"],
          ...periodSales.map(s => [
            `"${s.invoiceNumber || s.id}"`,
            `"${s.date ? new Date(s.date).toLocaleString() : ''}"`,
            `"${(s.customerName || 'Walk-in Customer').replace(/"/g, '""')}"`,
            `"${s.paymentMethod || 'Cash'}"`,
            s.items?.length || 1,
            Number(s.amountPaid || s.total || 0).toFixed(2),
            `"${s.status || 'Completed'}"`
          ])
        ];
        downloadCSV(`Karobaar_Sales_${dateRange}_${format(new Date(), 'yyyyMMdd')}.csv`, rows);
      } else if (type === 'Receivables') {
        const rows = [
          ["Customer Name", "Phone", "Outstanding Udhaar", "Last Activity"],
          ...receivables.list.map(c => [
            `"${(c.name || '').replace(/"/g, '""')}"`,
            `"${c.phone || ''}"`,
            Number(c.outstandingBalance || 0).toFixed(2),
            `"${c.lastPurchaseDate || ''}"`
          ])
        ];
        downloadCSV(`Karobaar_Receivables_${format(new Date(), 'yyyyMMdd')}.csv`, rows);
      } else if (type === 'Inventory') {
        const rows = [
          ["Product Name", "SKU", "Category", "In Stock", "Purchase Price", "Selling Price", "Valuation"],
          ...products.map(p => [
            `"${(p.name || '').replace(/"/g, '""')}"`,
            `"${p.sku || ''}"`,
            `"${p.category || ''}"`,
            p.stockQuantity || 0,
            Number(p.purchasePrice || 0).toFixed(2),
            Number(p.sellingPrice || 0).toFixed(2),
            ((Number(p.stockQuantity) || 0) * (Number(p.purchasePrice) || 0)).toFixed(2)
          ])
        ];
        downloadCSV(`Karobaar_Inventory_Valuation_${format(new Date(), 'yyyyMMdd')}.csv`, rows);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export CSV: ' + e.message);
    } finally {
      setExporting(null);
    }
  };

  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <MobileReports 
        currencySymbol={currencySymbol}
        totalRevenue={pnlData.netRevenue}
        revenueGrowth={0}
        totalOrders={pnlData.ordersCount}
        averageOrderValue={pnlData.averageOrderValue}
        totalCustomers={customers.length}
        returnOrders={0}
        topSellingProducts={productAnalytics.topSellers}
        salesByDayChart={{
          labels: ['Total'],
          datasets: [{ label: 'Sales', data: [pnlData.netRevenue], borderColor: '#fff' }]
        }}
      />
    );
  }

  // Navigation tab definitions
  const tabs = [
    ...(canViewProfit ? [{ id: 'pnl', label: 'Profit & Loss Statement', icon: <FileSpreadsheet size={15} /> }] : []),
    { id: 'cash', label: 'Cash Flow & Tenders', icon: <Wallet size={15} /> },
    { 
      id: 'receivables', 
      label: 'Receivables (Udhaar)', 
      icon: <Users size={15} />,
      badge: `${currencySymbol}${receivables.totalReceivable.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      badgeVariant: receivables.totalReceivable > 0 ? 'amber' : 'default'
    },
    { 
      id: 'payables', 
      label: 'Payables (Suppliers)', 
      icon: <Building2 size={15} />,
      badge: `${currencySymbol}${payables.totalPendingPO.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      badgeVariant: payables.totalPendingPO > 0 ? 'rose' : 'default'
    },
    { id: 'inventory', label: 'Stock Valuation & Dead Stock', icon: <Box size={15} /> },
    { id: 'exports', label: 'CSV & Export Center', icon: <Download size={15} /> }
  ];

  return (
    <div className="reports-page-wrapper px-4 md:px-8 py-6 pb-40">
      
      {/* 1. Header with Left-Aligned Title and Right-Aligned Date Filter & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
        <div className="flex flex-col gap-1.5 text-left">
          <div className="flex items-center gap-2 text-text-muted font-bold text-xs tracking-wider uppercase">
            <FileText size={14} className="text-primary" />
            <span>Financial Intelligence</span>
            <span className="text-zinc-600">•</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
              Audited Engine
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Financial & Business Reports
          </h1>
          <p className="text-xs lg:text-sm text-text-secondary font-medium">
            Audited P&L statements, cash flows, inventory risk, and balance reconciliations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filter Buttons */}
          <div className="flex items-center bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)] shadow-sm">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: '7 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'all_time', label: 'All Time' }
            ].map(period => (
              <button
                key={period.id}
                type="button"
                onClick={() => setDateRange(period.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  dateRange === period.id
                    ? 'bg-zinc-800 text-white shadow-sm font-extrabold'
                    : 'text-text-secondary hover:text-white hover:bg-[var(--bg-hover)]'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 h-9 px-3.5 text-xs font-bold rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-white transition-all shadow-sm print-hidden"
          >
            <Printer size={14} className="text-text-muted" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Incomplete Financial Data Warning Banner */}
      {incompleteCostInfo.hasIncompleteData && (
        <div className="mb-6 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3.5">
          <AlertCircle size={20} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300">Notice on Financial Cost Accuracy: </span>
            <span className="text-zinc-300">
              {incompleteCostInfo.missingProductCount} sold items (such as {incompleteCostInfo.missingProductNames.join(', ')}) do not have a defined purchase/cost price in the inventory catalog.
              Their COGS is tracked as {currencySymbol}0.00. Update purchase prices in <a href="#/inventory" className="underline font-bold text-white hover:text-amber-300">Inventory</a> for 100% exact gross profit calculation.
            </span>
          </div>
        </div>
      )}

      {/* 2. Executive Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {/* Net Sales Revenue */}
        <div className="reports-kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-bold">
              Net Sales Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono text-white tracking-tight my-1">
            {currencySymbol}{pnlData.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-text-secondary font-semibold mt-1 flex items-center gap-1.5">
            <span>{pnlData.ordersCount} transactions</span>
            <span className="text-zinc-600">•</span>
            <span>{currencySymbol}{pnlData.averageOrderValue.toFixed(2)} AOV</span>
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="reports-kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-bold">
              Cost of Goods (COGS)
            </span>
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-text-muted">
              <Box size={15} />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono text-zinc-300 tracking-tight my-1">
            {canViewProfit 
              ? `${currencySymbol}${pnlData.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
              : '••••••'}
          </div>
          <div className="text-xs text-text-secondary font-semibold mt-1">
            {canViewProfit ? (
              <span className="flex items-center gap-1.5">
                <span>Gross Profit:</span>
                <strong className="text-emerald-400 font-bold">{currencySymbol}{pnlData.grossProfit.toFixed(2)}</strong>
                <span className="text-zinc-500">({pnlData.grossMargin.toFixed(1)}%)</span>
              </span>
            ) : (
              <span className="text-zinc-500 font-medium">Restricted to Owner / Manager</span>
            )}
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="reports-kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-bold">
              Operating Expenses
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <Banknote size={15} />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono text-rose-400 tracking-tight my-1">
            {currencySymbol}{pnlData.totalOpExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-text-secondary font-semibold mt-1">
            Across {periodExpenses.length} expense entries
          </div>
        </div>

        {/* Net Business Profit */}
        <div className="reports-kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-bold">
              Net Business Profit
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              canViewProfit && pnlData.netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              <TrendingUp size={15} />
            </div>
          </div>
          <div className={`text-2xl lg:text-3xl font-extrabold font-mono tracking-tight my-1 ${
            canViewProfit 
              ? (pnlData.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400') 
              : 'text-zinc-400'
          }`}>
            {canViewProfit 
              ? `${currencySymbol}${pnlData.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
              : '••••••'}
          </div>
          <div className="text-xs text-text-secondary font-semibold mt-1">
            {canViewProfit ? (
              <span className="flex items-center gap-1.5">
                <span>Net Margin:</span>
                <strong className={pnlData.netMargin >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {pnlData.netMargin.toFixed(1)}%
                </strong>
              </span>
            ) : (
              <span className="text-zinc-500 font-medium">Restricted to Owner / Manager</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Navigation Tab Bar (Clipped Scrollbar & Cut-off text completely eliminated) */}
      <div className="mb-6">
        <div className="reports-tabs-bar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`reports-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  tab.badgeVariant === 'amber'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : tab.badgeVariant === 'rose'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-zinc-700/60 text-zinc-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: PROFIT & LOSS STATEMENT */}
      {activeTab === 'pnl' && (
        <Card className="border border-[var(--border-color)] overflow-hidden shadow-sm">
          <CardHeader className="p-5 border-b border-[var(--border-color)] flex flex-row items-center justify-between bg-[var(--bg-card)]">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FileSpreadsheet size={17} className="text-primary" />
                Profit & Loss Statement
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Accounting Period: <strong className="text-white">{filterBounds.label}</strong>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              onClick={() => handleExport('PNL')}
              className="h-8 px-3.5 text-xs bg-[var(--bg-hover)] border-[var(--border-color)] text-white hover:bg-zinc-800"
            >
              Export P&L CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="reports-table-container">
              <table className="reports-statement-table font-mono text-sm">
                <tbody>
                  {/* Revenue Section */}
                  <tr className="bg-[var(--bg-hover)] no-hover border-b border-[var(--border-color)]">
                    <td colSpan={2} className="py-2.5 px-5 text-xs uppercase font-extrabold text-zinc-400 tracking-wider">
                      1. Operating Revenue
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-3 px-8 text-text-secondary font-sans font-medium">Gross Sales</td>
                    <td className="py-3 px-8 text-right font-bold text-white">{currencySymbol}{pnlData.grossRevenue.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-3 px-8 text-text-secondary font-sans font-medium">Less: Sales Discounts & Reductions</td>
                    <td className="py-3 px-8 text-right text-rose-400 font-semibold">- {currencySymbol}{pnlData.discountsGiven.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-[var(--bg-card)] font-bold border-b border-[var(--border-color)]">
                    <td className="py-3.5 px-6 text-white font-sans font-bold">Net Sales Revenue</td>
                    <td className="py-3.5 px-8 text-right text-white text-base font-extrabold">{currencySymbol}{pnlData.netRevenue.toFixed(2)}</td>
                  </tr>

                  {/* COGS Section */}
                  <tr className="bg-[var(--bg-hover)] no-hover border-b border-[var(--border-color)]">
                    <td colSpan={2} className="py-2.5 px-5 text-xs uppercase font-extrabold text-zinc-400 tracking-wider">
                      2. Cost of Sales
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-3 px-8 text-text-secondary font-sans font-medium">Cost of Goods Sold (COGS)</td>
                    <td className="py-3 px-8 text-right text-rose-400 font-semibold">- {currencySymbol}{pnlData.totalCOGS.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-[var(--bg-card)] font-bold border-b border-[var(--border-color)]">
                    <td className="py-3.5 px-6 text-emerald-400 font-sans font-bold">Gross Operating Profit</td>
                    <td className="py-3.5 px-8 text-right text-emerald-400 text-base font-extrabold">
                      {currencySymbol}{pnlData.grossProfit.toFixed(2)}
                      <span className="text-xs font-normal text-text-secondary ml-2 font-sans">({pnlData.grossMargin.toFixed(1)}% margin)</span>
                    </td>
                  </tr>

                  {/* Operating Expenses Section */}
                  <tr className="bg-[var(--bg-hover)] no-hover border-b border-[var(--border-color)]">
                    <td colSpan={2} className="py-2.5 px-5 text-xs uppercase font-extrabold text-zinc-400 tracking-wider">
                      3. Operating Expenses
                    </td>
                  </tr>
                  {Object.entries(pnlData.expenseBreakdown).map(([cat, amt]) => (
                    <tr key={cat} className="border-b border-[var(--border-color)]">
                      <td className="py-3 px-8 text-text-secondary font-sans font-medium">{cat}</td>
                      <td className="py-3 px-8 text-right text-zinc-300 font-semibold">{currencySymbol}{amt.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[var(--bg-card)] font-bold border-b border-[var(--border-color)]">
                    <td className="py-3.5 px-6 text-white font-sans font-bold">Total Operating Expenses</td>
                    <td className="py-3.5 px-8 text-right text-rose-400 text-base font-extrabold">- {currencySymbol}{pnlData.totalOpExpenses.toFixed(2)}</td>
                  </tr>

                  {/* Net Profit Section */}
                  <tr className="bg-zinc-900/90 font-bold border-t-2 border-zinc-600">
                    <td className="py-4 px-6 text-base lg:text-lg text-white font-sans font-extrabold">
                      Net Business Profit / (Loss)
                    </td>
                    <td className={`py-4 px-8 text-right text-lg lg:text-xl font-extrabold ${pnlData.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currencySymbol}{pnlData.netProfit.toFixed(2)}
                      <div className="text-xs text-text-secondary font-normal font-sans mt-0.5">
                        Net Profit Margin: <strong className="text-white">{pnlData.netMargin.toFixed(1)}%</strong>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: CASH FLOW & TENDERS */}
      {activeTab === 'cash' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="reports-kpi-card">
              <span className="text-[11px] uppercase tracking-wider text-text-secondary font-bold">Total Cash Collected</span>
              <div className="text-2xl lg:text-3xl font-extrabold font-mono text-emerald-400 tracking-tight my-1">
                {currencySymbol}{tenderAndCashData.cashSales.toFixed(2)}
              </div>
              <p className="text-xs text-text-secondary mt-1 font-medium">Hard cash in POS register drawer</p>
            </div>

            <div className="reports-kpi-card">
              <span className="text-[11px] uppercase tracking-wider text-text-secondary font-bold">Cash Paid Out</span>
              <div className="text-2xl lg:text-3xl font-extrabold font-mono text-rose-400 tracking-tight my-1">
                - {currencySymbol}{tenderAndCashData.cashExpenses.toFixed(2)}
              </div>
              <p className="text-xs text-text-secondary mt-1 font-medium">Direct cash petty expenses & payouts</p>
            </div>

            <div className="reports-kpi-card">
              <span className="text-[11px] uppercase tracking-wider text-text-secondary font-bold">Net Drawer Cash Flow</span>
              <div className={`text-2xl lg:text-3xl font-extrabold font-mono tracking-tight my-1 ${tenderAndCashData.netCashFlow >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {currencySymbol}{tenderAndCashData.netCashFlow.toFixed(2)}
              </div>
              <p className="text-xs text-text-secondary mt-1 font-medium">Net physical currency generated in period</p>
            </div>
          </div>

          <Card className="border border-[var(--border-color)] overflow-hidden">
            <CardHeader className="p-5 border-b border-[var(--border-color)]">
              <h3 className="font-bold text-base text-white">Payment Tender Breakdown</h3>
              <p className="text-xs text-text-secondary">Distribution of revenue by payment mode</p>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)]">
                  <div className="text-xs text-text-secondary uppercase font-bold">Cash</div>
                  <div className="text-xl font-extrabold text-white font-mono mt-1">{currencySymbol}{tenderAndCashData.cashSales.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)]">
                  <div className="text-xs text-text-secondary uppercase font-bold">UPI / QR Code</div>
                  <div className="text-xl font-extrabold text-white font-mono mt-1">{currencySymbol}{tenderAndCashData.upiSales.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)]">
                  <div className="text-xs text-text-secondary uppercase font-bold">Card / POS</div>
                  <div className="text-xl font-extrabold text-white font-mono mt-1">{currencySymbol}{tenderAndCashData.cardSales.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)]">
                  <div className="text-xs text-text-secondary uppercase font-bold">Udhaar / Credit</div>
                  <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">{currencySymbol}{tenderAndCashData.udhaarSales.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: RECEIVABLES (UDHAAR) */}
      {activeTab === 'receivables' && (
        <Card className="border border-[var(--border-color)] overflow-hidden">
          <CardHeader className="p-5 border-b border-[var(--border-color)] flex flex-row items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Users size={16} className="text-amber-400" />
                Customer Khata (Receivables)
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Outstanding customer balances awaiting recovery ({receivables.count} customers with dues)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              onClick={() => handleExport('Receivables')}
              className="h-8 px-3.5 text-xs bg-[var(--bg-hover)] border-[var(--border-color)] text-white hover:bg-zinc-800"
            >
              Export CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="reports-table-container">
              <table className="reports-statement-table text-sm">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th className="text-right">Outstanding Due</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.list.length > 0 ? (
                    receivables.list.map(c => (
                      <tr key={c.id}>
                        <td className="font-bold text-white">{c.name}</td>
                        <td className="font-mono text-xs text-text-secondary">{c.phone || 'No phone'}</td>
                        <td className="text-right font-mono font-bold text-amber-400">
                          {currencySymbol}{(Number(c.outstandingBalance) || 0).toFixed(2)}
                        </td>
                        <td className="text-right">
                          <a
                            href="#/payments"
                            className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors inline-block"
                          >
                            Collect / Khata
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="no-hover">
                      <td colSpan={4} className="text-center py-12 text-zinc-500">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 size={24} className="text-emerald-400" />
                          <span className="font-semibold text-zinc-400">Zero pending customer Udhaar. All receivables are settled!</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: PAYABLES (SUPPLIERS) */}
      {activeTab === 'payables' && (
        <Card className="border border-[var(--border-color)] overflow-hidden">
          <CardHeader className="p-5 border-b border-[var(--border-color)] flex flex-row items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Building2 size={16} className="text-rose-400" />
                Supplier Khata (Payables)
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Pending supplier purchase orders and dues ({payables.pendingPurchases.length} open POs)
              </p>
            </div>
            <a
              href="#/purchases"
              className="text-xs px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)] text-white hover:bg-zinc-800 font-bold transition-all"
            >
              Open Purchases
            </a>
          </CardHeader>
          <CardContent className="p-0">
            <div className="reports-table-container">
              <table className="reports-statement-table text-sm">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Date</th>
                    <th>Supplier Name</th>
                    <th className="text-right">Amount Due</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payables.pendingPurchases.length > 0 ? (
                    payables.pendingPurchases.map(p => (
                      <tr key={p.id}>
                        <td className="font-mono text-xs font-bold text-white">{p.poNumber || p.id}</td>
                        <td className="text-xs text-text-secondary">{p.date ? format(new Date(p.date), 'MMM dd, yyyy') : '—'}</td>
                        <td className="font-semibold text-white">{p.supplierName || 'Unknown Supplier'}</td>
                        <td className="text-right font-mono font-bold text-rose-400">
                          {currencySymbol}{(Number(p.total) || 0).toFixed(2)}
                        </td>
                        <td className="text-center">
                          <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                            {p.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="no-hover">
                      <td colSpan={5} className="text-center py-12 text-zinc-500">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 size={24} className="text-emerald-400" />
                          <span className="font-semibold text-zinc-400">No pending supplier purchase orders. All payables are up to date!</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: INVENTORY RISK */}
      {activeTab === 'inventory' && (
        <div className="flex flex-col gap-6">
          {/* Valuation Banner */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Box size={20} />
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase font-bold tracking-wider">Total Warehouse Inventory Valuation</span>
                <div className="text-2xl font-extrabold font-mono text-white mt-0.5">
                  {currencySymbol}{productAnalytics.totalInventoryValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <a
              href="#/products"
              className="text-xs px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)] text-white hover:bg-zinc-800 font-bold transition-all"
            >
              Manage Products
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-[var(--border-color)] overflow-hidden">
              <CardHeader className="p-5 border-b border-[var(--border-color)]">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Zap size={16} className="text-emerald-400" />
                  Top 10 Selling Products
                </h3>
                <p className="text-xs text-text-secondary">Best performing items by volume</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="reports-table-container">
                  <table className="reports-statement-table text-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-right">Units Sold</th>
                        <th className="text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productAnalytics.topSellers.map(p => (
                        <tr key={p.id}>
                          <td className="font-semibold text-white">{p.name}</td>
                          <td className="text-right font-mono font-bold text-white">{p.unitsSold}</td>
                          <td className="text-right font-mono font-bold text-emerald-400">{currencySymbol}{p.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                      {productAnalytics.topSellers.length === 0 && (
                        <tr className="no-hover"><td colSpan={3} className="text-center py-8 text-zinc-500">No sales recorded yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[var(--border-color)] overflow-hidden">
              <CardHeader className="p-5 border-b border-[var(--border-color)]">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <PackageX size={16} className="text-rose-400" />
                  Dead Stock Risk
                </h3>
                <p className="text-xs text-text-secondary">Products with high stock (&gt;5) but zero sales in this period</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="reports-table-container">
                  <table className="reports-statement-table text-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th className="text-right">Unsold Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productAnalytics.deadStock.slice(0, 10).map(p => (
                        <tr key={p.id}>
                          <td className="font-semibold text-white">{p.name}</td>
                          <td className="text-xs text-text-secondary">{p.category || '—'}</td>
                          <td className="text-right font-mono font-bold text-rose-400">{p.stockQuantity}</td>
                        </tr>
                      ))}
                      {productAnalytics.deadStock.length === 0 && (
                        <tr className="no-hover"><td colSpan={3} className="text-center py-8 text-zinc-500">No dead stock detected. Good turnover!</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 6: EXPORTS */}
      {activeTab === 'exports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-[var(--border-color)] hover:border-zinc-700 transition-all">
            <CardHeader className="p-5 pb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                <FileSpreadsheet size={18} />
              </div>
              <CardTitle className="text-sm font-bold text-white">P&L Statement</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex flex-col gap-3">
              <p className="text-xs text-text-secondary min-h-[32px]">Formal statement of income, costs, and net margin.</p>
              <Button size="sm" icon={<Download size={14} />} onClick={() => handleExport('PNL')} className="w-full">
                Download P&L CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border-color)] hover:border-zinc-700 transition-all">
            <CardHeader className="p-5 pb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                <BarChart3 size={18} />
              </div>
              <CardTitle className="text-sm font-bold text-white">Sales Register</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex flex-col gap-3">
              <p className="text-xs text-text-secondary min-h-[32px]">Detailed ledger of invoices, payment methods, and customers.</p>
              <Button size="sm" icon={<Download size={14} />} onClick={() => handleExport('Sales')} className="w-full">
                Download Sales CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border-color)] hover:border-zinc-700 transition-all">
            <CardHeader className="p-5 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
                <Users size={18} />
              </div>
              <CardTitle className="text-sm font-bold text-white">Receivables (Udhaar)</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex flex-col gap-3">
              <p className="text-xs text-text-secondary min-h-[32px]">Customer dues and contact list for recovery tracking.</p>
              <Button size="sm" icon={<Download size={14} />} onClick={() => handleExport('Receivables')} className="w-full">
                Download Udhaar CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border-color)] hover:border-zinc-700 transition-all">
            <CardHeader className="p-5 pb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
                <Box size={18} />
              </div>
              <CardTitle className="text-sm font-bold text-white">Inventory Valuation</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex flex-col gap-3">
              <p className="text-xs text-text-secondary min-h-[32px]">Total stock on hand, purchase cost, and asset valuation.</p>
              <Button size="sm" icon={<Download size={14} />} onClick={() => handleExport('Inventory')} className="w-full">
                Download Stock CSV
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
