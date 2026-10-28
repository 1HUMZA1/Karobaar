import React, { useState, useMemo } from 'react';
import { 
  Download, TrendingUp, Users, Box, Banknote, Calendar, BarChart2, 
  Briefcase, FileText, Loader2, ArrowUpRight, ArrowDownRight, PackageX, 
  Zap, Printer, AlertCircle, ArrowRightLeft, DollarSign, Wallet, ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useCollection';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileReports } from './MobileReports';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement);

const Reports = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const currencySymbol = currentBusiness?.settings?.currency === 'INR' ? '₹' : '$';
  
  // Date filtering: 'today', 'yesterday', '7d', 'this_month', 'all_time'
  const [dateRange, setDateRange] = useState('this_month');
  const [activeTab, setActiveTab] = useState('pnl'); // pnl, sales, cash, receivables, payables, inventory, exports
  const [exporting, setExporting] = useState(null);

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

  const periodPurchases = useMemo(() => {
    return purchases.filter(p => {
      if (dateRange === 'all_time') return true;
      if (!p.date) return false;
      const d = new Date(p.date);
      return isWithinInterval(d, { start: filterBounds.start, end: filterBounds.end });
    });
  }, [purchases, filterBounds, dateRange]);

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

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto' }}>
      {/* Header with Title and Print / Export button */}
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Financial & Business Reports
          </h1>
          <p className="text-secondary text-sm">Audited P&L statements, cash flows, inventory risk, and balance reconciliations</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Multi-Period Date Selector */}
          <div className="flex bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-color)]">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: '7 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'all_time', label: 'All Time' }
            ].map(period => (
              <button
                key={period.id}
                onClick={() => setDateRange(period.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateRange === period.id
                    ? 'bg-zinc-800 text-white shadow-sm font-bold'
                    : 'text-secondary hover:text-[var(--text-main)]'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Printer size={15} />}
            onClick={() => window.print()}
            className="h-9 px-3 text-xs bg-[var(--bg-card)] print:hidden"
          >
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Incomplete Financial Data Warning Banner */}
      {incompleteCostInfo.hasIncompleteData && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300">Notice on Financial Cost Accuracy: </span>
            <span className="text-[var(--text-secondary)]">
              {incompleteCostInfo.missingProductCount} sold items (such as {incompleteCostInfo.missingProductNames.join(', ')}) do not have a defined purchase/cost price in the inventory catalog.
              Their COGS is tracked as {currencySymbol}0.00. Update purchase prices in <a href="#/inventory" className="underline font-semibold text-[var(--text-main)]">Inventory</a> for 100% exact gross profit calculation.
            </span>
          </div>
        </div>
      )}

      {/* Executive Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-4">
            <span className="text-xs uppercase tracking-wider text-secondary font-semibold">Net Sales Revenue</span>
            <h3 className="text-2xl font-bold font-mono text-[var(--text-main)] mt-1">
              {currencySymbol}{pnlData.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[11px] text-secondary mt-1 block">
              {pnlData.ordersCount} transactions ({currencySymbol}{pnlData.averageOrderValue.toFixed(2)} AOV)
            </span>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-4">
            <span className="text-xs uppercase tracking-wider text-secondary font-semibold">Cost of Goods (COGS)</span>
            <h3 className="text-2xl font-bold font-mono text-[var(--text-secondary)] mt-1">
              {currencySymbol}{pnlData.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[11px] text-secondary mt-1 block">
              Gross Profit: <strong className="text-emerald-400">{currencySymbol}{pnlData.grossProfit.toFixed(2)}</strong> ({pnlData.grossMargin.toFixed(1)}%)
            </span>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-4">
            <span className="text-xs uppercase tracking-wider text-secondary font-semibold">Operating Expenses</span>
            <h3 className="text-2xl font-bold font-mono text-rose-400 mt-1">
              {currencySymbol}{pnlData.totalOpExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[11px] text-secondary mt-1 block">
              Across {periodExpenses.length} expense entries
            </span>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-4">
            <span className="text-xs uppercase tracking-wider text-secondary font-semibold">Net Business Profit</span>
            <h3 className={`text-2xl font-bold font-mono mt-1 ${pnlData.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currencySymbol}{pnlData.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[11px] text-secondary mt-1 block">
              Net Margin: <strong>{pnlData.netMargin.toFixed(1)}%</strong>
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[var(--border-color)] mb-6 gap-2 overflow-x-auto">
        {[
          { id: 'pnl', label: 'Profit & Loss Statement' },
          { id: 'cash', label: 'Cash Flow & Tenders' },
          { id: 'receivables', label: `Receivables (Udhaar: ${currencySymbol}${receivables.totalReceivable.toFixed(0)})` },
          { id: 'payables', label: `Payables (Suppliers: ${currencySymbol}${payables.totalPendingPO.toFixed(0)})` },
          { id: 'inventory', label: 'Stock Valuation & Dead Stock' },
          { id: 'exports', label: 'CSV & Export Center' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'border-[var(--text-main)] text-[var(--text-main)]'
                : 'border-transparent text-secondary hover:text-[var(--text-main)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PROFIT & LOSS STATEMENT */}
      {activeTab === 'pnl' && (
        <Card className="border border-[var(--border-color)]">
          <CardHeader className="p-5 border-b border-[var(--border-color)] flex flex-row items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[var(--text-main)]">Profit & Loss Statement</h3>
              <p className="text-xs text-secondary mt-0.5">Period: <strong className="text-white">{filterBounds.label}</strong></p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              onClick={() => handleExport('PNL')}
              className="h-8 px-3 text-xs bg-[var(--bg-card)]"
            >
              Export P&L CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-sm">
                <tbody>
                  {/* Revenue Section */}
                  <tr className="bg-[var(--bg-hover)] border-b border-[var(--border-color)]">
                    <td colSpan={2} className="p-3 text-xs uppercase font-bold text-[var(--text-muted)]">1. Operating Revenue</td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="p-3 pl-8 text-secondary">Gross Sales</td>
                    <td className="p-3 pr-8 text-right font-semibold text-[var(--text-main)]">{currencySymbol}{pnlData.grossRevenue.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="p-3 pl-8 text-secondary">Less: Sales Discounts & Reductions</td>
                    <td className="p-3 pr-8 text-right text-rose-400 font-semibold">- {currencySymbol}{pnlData.discountsGiven.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-[var(--bg-elevated)] font-bold border-b border-[var(--border-color)]">
                    <td className="p-3 pl-6 text-white">Net Sales Revenue</td>
                    <td className="p-3 pr-8 text-right text-[var(--text-main)] text-base">{currencySymbol}{pnlData.netRevenue.toFixed(2)}</td>
                  </tr>

                  {/* COGS Section */}
                  <tr className="bg-[var(--bg-hover)] border-b border-[var(--border-color)]">
                    <td colSpan={2} className="p-3 text-xs uppercase font-bold text-[var(--text-muted)]">2. Cost of Sales</td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="p-3 pl-8 text-secondary">Cost of Goods Sold (COGS)</td>
                    <td className="p-3 pr-8 text-right text-rose-400 font-semibold">- {currencySymbol}{pnlData.totalCOGS.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-[var(--bg-elevated)] font-bold border-b border-[var(--border-color)]">
                    <td className="p-3 pl-6 text-emerald-400">Gross Operating Profit</td>
                    <td className="p-3 pr-8 text-right text-emerald-400 text-base">
                      {currencySymbol}{pnlData.grossProfit.toFixed(2)}
                      <span className="text-xs font-normal text-secondary ml-2">({pnlData.grossMargin.toFixed(1)}% margin)</span>
                    </td>
                  </tr>

                  {/* Operating Expenses Section */}
                  <tr className="bg-[var(--bg-hover)] border-b border-[var(--border-color)]">
                    <td colSpan={2} className="p-3 text-xs uppercase font-bold text-[var(--text-muted)]">3. Operating Expenses</td>
                  </tr>
                  {Object.entries(pnlData.expenseBreakdown).map(([cat, amt]) => (
                    <tr key={cat} className="border-b border-[var(--border-color)]">
                      <td className="p-3 pl-8 text-secondary">{cat}</td>
                      <td className="p-3 pr-8 text-right text-[var(--text-secondary)]">{currencySymbol}{amt.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[var(--bg-elevated)] font-bold border-b border-[var(--border-color)]">
                    <td className="p-3 pl-6 text-white">Total Operating Expenses</td>
                    <td className="p-3 pr-8 text-right text-rose-400 text-base">- {currencySymbol}{pnlData.totalOpExpenses.toFixed(2)}</td>
                  </tr>

                  {/* Net Profit Section */}
                  <tr className="bg-[var(--bg-elevated)] font-bold border-t-2 border-white">
                    <td className="p-4 pl-6 text-lg text-[var(--text-main)]">Net Business Profit / (Loss)</td>
                    <td className={`p-4 pr-8 text-right text-xl ${pnlData.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currencySymbol}{pnlData.netProfit.toFixed(2)}
                      <div className="text-xs text-secondary font-normal mt-0.5">Net Profit Margin: {pnlData.netMargin.toFixed(1)}%</div>
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
            <Card className="border border-[var(--border-color)]">
              <CardContent className="p-5">
                <span className="text-xs uppercase tracking-wider text-secondary font-semibold">Total Cash Collected</span>
                <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {currencySymbol}{tenderAndCashData.cashSales.toFixed(2)}
                </h3>
                <p className="text-xs text-secondary mt-1">Hard cash in POS register drawer</p>
              </CardContent>
            </Card>

            <Card className="border border-[var(--border-color)]">
              <CardContent className="p-5">
                <span className="text-xs uppercase tracking-wider text-secondary font-semibold">Cash Paid Out</span>
                <h3 className="text-2xl font-bold font-mono text-rose-400 mt-1">
                  - {currencySymbol}{tenderAndCashData.cashExpenses.toFixed(2)}
                </h3>
                <p className="text-xs text-secondary mt-1">Direct cash petty expenses & payouts</p>
              </CardContent>
            </Card>

            <Card className="border border-[var(--border-color)]">
              <CardContent className="p-5">
                <span className="text-xs uppercase tracking-wider text-secondary font-semibold">Net Drawer Cash Flow</span>
                <h3 className={`text-2xl font-bold font-mono mt-1 ${tenderAndCashData.netCashFlow >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  {currencySymbol}{tenderAndCashData.netCashFlow.toFixed(2)}
                </h3>
                <p className="text-xs text-secondary mt-1">Net physical currency generated in period</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-[var(--border-color)]">
            <CardHeader className="p-4 border-b border-[var(--border-color)]">
              <h3 className="font-bold text-base text-[var(--text-main)]">Payment Tender Breakdown</h3>
              <p className="text-xs text-secondary">Distribution of revenue by payment mode</p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <div className="text-xs text-secondary uppercase font-semibold">Cash</div>
                  <div className="text-xl font-bold text-[var(--text-main)] font-mono mt-1">{currencySymbol}{tenderAndCashData.cashSales.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <div className="text-xs text-secondary uppercase font-semibold">UPI / QR Code</div>
                  <div className="text-xl font-bold text-[var(--text-main)] font-mono mt-1">{currencySymbol}{tenderAndCashData.upiSales.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <div className="text-xs text-secondary uppercase font-semibold">Card / POS</div>
                  <div className="text-xl font-bold text-[var(--text-main)] font-mono mt-1">{currencySymbol}{tenderAndCashData.cardSales.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <div className="text-xs text-secondary uppercase font-semibold">Udhaar / Credit</div>
                  <div className="text-xl font-bold text-amber-400 font-mono mt-1">{currencySymbol}{tenderAndCashData.udhaarSales.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: RECEIVABLES (UDHAAR) */}
      {activeTab === 'receivables' && (
        <Card className="border border-[var(--border-color)]">
          <CardHeader className="p-4 border-b border-[var(--border-color)] flex flex-row items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[var(--text-main)]">Customer Khata (Receivables)</h3>
              <p className="text-xs text-secondary">Outstanding customer balances awaiting recovery</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              onClick={() => handleExport('Receivables')}
              className="h-8 px-3 text-xs bg-[var(--bg-card)]"
            >
              Export CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-secondary text-xs uppercase">
                    <th className="p-3">Customer</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3 text-right">Outstanding Due</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.list.length > 0 ? (
                    receivables.list.map(c => (
                      <tr key={c.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                        <td className="p-3 font-semibold text-[var(--text-main)]">{c.name}</td>
                        <td className="p-3 font-mono text-xs text-secondary">{c.phone || 'No phone'}</td>
                        <td className="p-3 text-right font-mono font-bold text-amber-400">
                          {currencySymbol}{(Number(c.outstandingBalance) || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <a
                            href={`#/payments`}
                            className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-medium"
                          >
                            Collect / Khata
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-zinc-500">
                        Zero pending customer Udhaar. All receivables are settled!
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
        <Card className="border border-[var(--border-color)]">
          <CardHeader className="p-4 border-b border-[var(--border-color)] flex flex-row items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[var(--text-main)]">Supplier Khata (Payables)</h3>
              <p className="text-xs text-secondary">Pending supplier purchase orders and dues</p>
            </div>
            <a
              href="#/purchases"
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-white hover:bg-[var(--bg-hover)] font-semibold"
            >
              Open Purchases
            </a>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-secondary text-xs uppercase">
                    <th className="p-3">PO Number</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3 text-right">Amount Due</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payables.pendingPurchases.length > 0 ? (
                    payables.pendingPurchases.map(p => (
                      <tr key={p.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                        <td className="p-3 font-mono text-xs font-semibold text-[var(--text-main)]">{p.poNumber || p.id}</td>
                        <td className="p-3 text-xs text-secondary">{p.date ? format(new Date(p.date), 'MMM dd, yyyy') : '—'}</td>
                        <td className="p-3 font-medium text-white">{p.supplierName || 'Unknown Supplier'}</td>
                        <td className="p-3 text-right font-mono font-bold text-rose-400">
                          {currencySymbol}{(Number(p.total) || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {p.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-zinc-500">
                        No pending supplier purchase orders. All payables are up to date!
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-[var(--border-color)]">
            <CardHeader className="p-4 border-b border-[var(--border-color)]">
              <h3 className="font-bold text-base text-[var(--text-main)] flex items-center gap-2">
                <Zap size={16} className="text-emerald-400" />
                Top 10 Selling Products
              </h3>
              <p className="text-xs text-secondary">Best performing items by volume</p>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-secondary text-xs uppercase">
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">Units Sold</th>
                    <th className="p-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {productAnalytics.topSellers.map(p => (
                    <tr key={p.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                      <td className="p-3 font-medium text-white">{p.name}</td>
                      <td className="p-3 text-right font-mono font-bold text-[var(--text-main)]">{p.unitsSold}</td>
                      <td className="p-3 text-right font-mono text-emerald-400">{currencySymbol}{p.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                  {productAnalytics.topSellers.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-8 text-zinc-500">No sales recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border-color)]">
            <CardHeader className="p-4 border-b border-[var(--border-color)]">
              <h3 className="font-bold text-base text-[var(--text-main)] flex items-center gap-2">
                <PackageX size={16} className="text-rose-400" />
                Dead Stock Risk
              </h3>
              <p className="text-xs text-secondary">Products with high stock (&gt;5) but zero sales in this period</p>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-secondary text-xs uppercase">
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Unsold Units</th>
                  </tr>
                </thead>
                <tbody>
                  {productAnalytics.deadStock.slice(0, 10).map(p => (
                    <tr key={p.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                      <td className="p-3 font-medium text-white">{p.name}</td>
                      <td className="p-3 text-xs text-secondary">{p.category || '—'}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-400">{p.stockQuantity}</td>
                    </tr>
                  ))}
                  {productAnalytics.deadStock.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-8 text-zinc-500">No dead stock detected. Good turnover!</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 6: EXPORTS */}
      {activeTab === 'exports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-[var(--border-color)]">
            <CardHeader className="p-4"><CardTitle className="text-sm font-bold">P&L Statement</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 flex flex-col gap-3">
              <p className="text-xs text-secondary">Formal statement of income, costs, and net margin.</p>
              <Button size="sm" icon={<Download size={14} />} onClick={() => handleExport('PNL')} className="w-full">
                Download P&L CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border-color)]">
            <CardHeader className="p-4"><CardTitle className="text-sm font-bold">Sales Register</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 flex flex-col gap-3">
              <p className="text-xs text-secondary">Detailed ledger of invoices, payment methods, and customers.</p>
              <Button size="sm" icon={<Download size={14} />} onClick={() => handleExport('Sales')} className="w-full">
                Download Sales CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border-color)]">
            <CardHeader className="p-4"><CardTitle className="text-sm font-bold">Receivables (Udhaar)</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 flex flex-col gap-3">
              <p className="text-xs text-secondary">Customer dues and contact list for recovery tracking.</p>
              <Button size="sm" icon={<Download size={14} />} onClick={() => handleExport('Receivables')} className="w-full">
                Download Udhaar CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border-color)]">
            <CardHeader className="p-4"><CardTitle className="text-sm font-bold">Inventory Valuation</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 flex flex-col gap-3">
              <p className="text-xs text-secondary">Total stock on hand, purchase cost, and asset valuation.</p>
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
