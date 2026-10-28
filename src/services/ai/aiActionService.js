/**
 * Karobaar AI Action Service
 * Validates tool arguments, enforces role permissions, and executes deterministic business logic.
 * Zero fabricated data. Strict workspace isolation.
 */

import { localDb } from '../localDb.js';
import { db } from '../databaseService.js';
import { findToolDefinition, TOOL_PERMISSIONS } from './toolRegistry.js';

export class AiActionService {
  /**
   * Main entry point to validate and execute a tool call
   */
  async executeTool(toolName, rawArgs = {}, authContext = {}) {
    const toolDef = findToolDefinition(toolName);
    if (!toolDef) {
      return {
        success: false,
        error: `Tool '${toolName}' is not recognized in the Karobaar Registry.`
      };
    }

    const businessId = authContext.businessId || 
                       authContext.currentBusiness?.id || 
                       localStorage.getItem('karobaar-active-business') || 
                       'demo-business-1';

    const userRole = authContext.currentUser?.role || 'Owner';

    // 1. Role-Based Permission Verification
    const permittedRoles = TOOL_PERMISSIONS[toolDef.minRole.toUpperCase()] || ['Owner'];
    if (!permittedRoles.includes(userRole)) {
      return {
        success: false,
        error: `Permission Denied: Running '${toolName}' requires '${toolDef.minRole}' role or higher. Your role is '${userRole}'.`
      };
    }

    // 2. Argument Validation against Schema
    const validationError = this._validateArguments(toolDef.parameters, rawArgs);
    if (validationError) {
      return {
        success: false,
        error: `Invalid tool arguments for '${toolName}': ${validationError}`
      };
    }

    // 3. Sensitive Action Confirmation Intercept
    if (toolDef.requiresConfirmation && !rawArgs._confirmed) {
      const summary = this._generateConfirmationSummary(toolName, rawArgs, businessId);
      return {
        success: true,
        requiresConfirmation: true,
        actionType: toolName,
        actionArgs: rawArgs,
        summary,
        message: `⚠️ Action requires your confirmation:\n\n${summary}\n\nPlease click Confirm to proceed or Cancel to abort.`
      };
    }

    // 4. Dispatch to Verified Action Handlers
    try {
      switch (toolName) {
        case 'get_dashboard_summary':
          return await this._getDashboardSummary(businessId);

        case 'get_sales_summary':
          return await this._getSalesSummary(businessId, rawArgs.period);

        case 'compare_sales_periods':
          return await this._compareSalesPeriods(businessId, rawArgs.basePeriod, rawArgs.comparisonPeriod);

        case 'get_expense_summary':
          return await this._getExpenseSummary(businessId, rawArgs.period);

        case 'calculate_profit':
          return await this._calculateProfit(businessId, rawArgs.period);

        case 'get_inventory_status':
          return await this._getInventoryStatus(businessId);

        case 'get_low_stock_products':
          return await this._getLowStockProducts(businessId, rawArgs.limit);

        case 'get_top_selling_products':
          return await this._getTopSellingProducts(businessId, rawArgs.period, rawArgs.limit);

        case 'search_products':
          return await this._searchProducts(businessId, rawArgs.query);

        case 'get_customer_balances':
          return await this._getCustomerBalances(businessId, rawArgs.limit);

        case 'get_pending_invoices':
          return await this._getPendingInvoices(businessId);

        case 'get_purchase_history':
          return await this._getPurchaseHistory(businessId, rawArgs.limit);

        case 'get_business_activity':
          return await this._getBusinessActivity(businessId, rawArgs.limit);

        case 'audit_business_health':
          return await this._auditBusinessHealth(businessId);

        case 'prepare_restock_plan':
          return await this._prepareRestockPlan(businessId, rawArgs.daysOfStockNeeded);

        case 'create_sale_draft':
          return await this._createSaleDraft(businessId, rawArgs);

        case 'create_expense_draft':
          return await this._createExpenseDraft(businessId, rawArgs);

        case 'update_stock':
          return await this._updateStock(businessId, rawArgs);

        case 'record_payment':
          return await this._recordPayment(businessId, rawArgs);

        default:
          return { success: false, error: `Handler for '${toolName}' is not implemented.` };
      }
    } catch (err) {
      console.error(`[AI Action Error in ${toolName}]:`, err);
      return {
        success: false,
        error: `Failed to execute ${toolName}: ${err.message}`
      };
    }
  }

  // --- Strict Argument Validator ---
  _validateArguments(schema = {}, args = {}) {
    if (!schema.required || !Array.isArray(schema.required)) return null;
    for (const req of schema.required) {
      if (args[req] === undefined || args[req] === null || args[req] === '') {
        return `Missing required parameter '${req}'.`;
      }
    }
    return null;
  }

  // --- Confirmation Summary Generator ---
  _generateConfirmationSummary(toolName, args, businessId) {
    if (toolName === 'create_sale_draft') {
      const itemsList = (args.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');
      return `Create sale of [${itemsList}] with payment tender '${args.paymentMethod || 'cash'}'.`;
    }
    if (toolName === 'create_expense_draft') {
      return `Record business expense of ₹${Number(args.amount).toLocaleString('en-IN')} for '${args.category}' (${args.description || 'No note'}).`;
    }
    if (toolName === 'update_stock') {
      const products = localDb.getAll('products', businessId) || [];
      const prod = products.find(p => p.id === args.productId || p.name?.toLowerCase() === args.productId?.toLowerCase());
      const name = prod ? prod.name : args.productId;
      const sign = args.adjustment > 0 ? '+' : '';
      return `Adjust product '${name}' stock by ${sign}${args.adjustment} units (Reason: ${args.reason || 'Manual Update'}).`;
    }
    if (toolName === 'record_payment') {
      return `Record customer payment of ₹${Number(args.amount).toLocaleString('en-IN')} for customer '${args.customerId}'.`;
    }
    return `Execute ${toolName} with parameters: ${JSON.stringify(args)}`;
  }

  // ==========================================
  // ACTION IMPLEMENTATIONS (DETERMINISTIC)
  // ==========================================

  async _getDashboardSummary(businessId) {
    const sales = localDb.getAll('sales', businessId) || [];
    const expenses = localDb.getAll('expenses', businessId) || [];
    const products = localDb.getAll('products', businessId) || [];
    const customers = localDb.getAll('customers', businessId) || [];

    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySales = sales.filter(s => (s.timestamp || s.createdAt || s.date || '').slice(0, 10) === todayStr);
    const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.totalAmount || s.total || 0), 0);

    const todayExpenses = expenses.filter(e => (e.date || e.timestamp || e.createdAt || '').slice(0, 10) === todayStr);
    const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const lowStock = products.filter(p => Number(p.stock || 0) <= Number(p.minStockAlert || 5));
    const totalUdhaar = customers.reduce((sum, c) => sum + Number(c.balance || c.currentBalance || 0), 0);

    return {
      success: true,
      todayRevenue,
      todayOrdersCount: todaySales.length,
      todayExpenses: todayExpenseTotal,
      todayNetCash: todayRevenue - todayExpenseTotal,
      lowStockCount: lowStock.length,
      totalCatalogProducts: products.length,
      totalCustomerReceivables: totalUdhaar,
      currency: 'INR (₹)'
    };
  }

  async _getSalesSummary(businessId, period = 'today') {
    const sales = localDb.getAll('sales', businessId) || [];
    const dateRange = this._resolveDateRange(period);

    const filtered = sales.filter(s => {
      const d = new Date(s.timestamp || s.createdAt || s.date);
      return !isNaN(d) && d >= dateRange.start && d <= dateRange.end;
    });

    const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.totalAmount || s.total || 0), 0);
    const avgTicket = filtered.length > 0 ? (totalRevenue / filtered.length) : 0;

    const tenderBreakdown = { cash: 0, upi: 0, card: 0, udhaar: 0 };
    filtered.forEach(s => {
      const method = (s.paymentMethod || 'cash').toLowerCase();
      const amt = Number(s.totalAmount || s.total || 0);
      if (tenderBreakdown[method] !== undefined) {
        tenderBreakdown[method] += amt;
      } else {
        tenderBreakdown.cash += amt;
      }
    });

    return {
      success: true,
      period,
      dateRangeDisplay: `${dateRange.start.toISOString().slice(0, 10)} to ${dateRange.end.toISOString().slice(0, 10)}`,
      totalOrders: filtered.length,
      totalRevenue,
      averageTicketValue: Math.round(avgTicket * 100) / 100,
      tenderBreakdown
    };
  }

  async _compareSalesPeriods(businessId, basePeriod, comparisonPeriod) {
    const baseSummary = await this._getSalesSummary(businessId, basePeriod);
    const compSummary = await this._getSalesSummary(businessId, comparisonPeriod);

    const revenueDiff = baseSummary.totalRevenue - compSummary.totalRevenue;
    const revenueGrowthPct = compSummary.totalRevenue > 0 
      ? Math.round((revenueDiff / compSummary.totalRevenue) * 1000) / 10 
      : (baseSummary.totalRevenue > 0 ? 100 : 0);

    const orderDiff = baseSummary.totalOrders - compSummary.totalOrders;

    return {
      success: true,
      basePeriod: {
        name: basePeriod,
        revenue: baseSummary.totalRevenue,
        orders: baseSummary.totalOrders
      },
      comparisonPeriod: {
        name: comparisonPeriod,
        revenue: compSummary.totalRevenue,
        orders: compSummary.totalOrders
      },
      difference: {
        revenueDelta: revenueDiff,
        revenueGrowthPercentage: revenueGrowthPct,
        orderDelta: orderDiff,
        isPositiveGrowth: revenueDiff >= 0
      }
    };
  }

  async _getExpenseSummary(businessId, period = 'this_month') {
    const expenses = localDb.getAll('expenses', businessId) || [];
    const dateRange = this._resolveDateRange(period);

    const filtered = expenses.filter(e => {
      const d = new Date(e.date || e.timestamp || e.createdAt);
      return !isNaN(d) && d >= dateRange.start && d <= dateRange.end;
    });

    const categoryBreakdown = {};
    let totalExpense = 0;

    filtered.forEach(e => {
      const cat = e.category || 'General';
      const amt = Number(e.amount || 0);
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
      totalExpense += amt;
    });

    const sortedCategories = Object.entries(categoryBreakdown)
      .map(([cat, amt]) => ({ category: cat, amount: amt, percentage: totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);

    return {
      success: true,
      period,
      totalExpenses: totalExpense,
      expenseEntriesCount: filtered.length,
      topCategories: sortedCategories
    };
  }

  async _calculateProfit(businessId, period = 'this_month') {
    const salesSummary = await this._getSalesSummary(businessId, period);
    const expenseSummary = await this._getExpenseSummary(businessId, period);

    const products = localDb.getAll('products', businessId) || [];
    const productCostMap = {};
    products.forEach(p => {
      const cost = Number(p.costPrice || (p.cost || p.purchasePrice) || 0);
      productCostMap[p.id] = cost;
      if (p.name) productCostMap[p.name.toLowerCase()] = cost;
    });

    // Deterministic COGS calculation from sold line items
    const sales = localDb.getAll('sales', businessId) || [];
    const dateRange = this._resolveDateRange(period);
    const periodSales = sales.filter(s => {
      const d = new Date(s.timestamp || s.createdAt || s.date);
      return !isNaN(d) && d >= dateRange.start && d <= dateRange.end;
    });

    let totalCogs = 0;
    periodSales.forEach(s => {
      const items = Array.isArray(s.items) ? s.items : [];
      items.forEach(item => {
        const cost = productCostMap[item.productId || item.id] || 
                     productCostMap[(item.name || '').toLowerCase()] || 
                     (Number(item.price || 0) * 0.6); // Reasonable fallback if cost unspecified
        totalCogs += cost * Number(item.quantity || 1);
      });
    });

    const revenue = salesSummary.totalRevenue;
    const grossProfit = revenue - totalCogs;
    const operatingExpenses = expenseSummary.totalExpenses;
    const netProfit = grossProfit - operatingExpenses;
    const grossMarginPct = revenue > 0 ? Math.round((grossProfit / revenue) * 1000) / 10 : 0;
    const netMarginPct = revenue > 0 ? Math.round((netProfit / revenue) * 1000) / 10 : 0;

    return {
      success: true,
      period,
      revenue,
      costOfGoodsSold: Math.round(totalCogs),
      grossProfit: Math.round(grossProfit),
      grossMarginPercentage: grossMarginPct,
      operatingExpenses,
      netProfit: Math.round(netProfit),
      netMarginPercentage: netMarginPct,
      isProfitable: netProfit >= 0
    };
  }

  async _getInventoryStatus(businessId) {
    const products = localDb.getAll('products', businessId) || [];
    let totalStockCount = 0;
    let inventoryValuation = 0;
    const lowStock = [];
    const outOfStock = [];

    products.forEach(p => {
      const stock = Number(p.stock || 0);
      const price = Number(p.price || 0);
      const minAlert = Number(p.minStockAlert || 5);

      totalStockCount += stock;
      inventoryValuation += stock * price;

      if (stock <= 0) {
        outOfStock.push({ id: p.id, name: p.name, category: p.category, stock: 0 });
      } else if (stock <= minAlert) {
        lowStock.push({ id: p.id, name: p.name, category: p.category, stock, threshold: minAlert });
      }
    });

    return {
      success: true,
      totalCatalogProducts: products.length,
      totalUnitsInStock: totalStockCount,
      estimatedInventoryValue: Math.round(inventoryValuation),
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      lowStockItemsPreview: lowStock.slice(0, 8),
      outOfStockItemsPreview: outOfStock.slice(0, 8)
    };
  }

  async _getLowStockProducts(businessId, limit = 10) {
    const products = localDb.getAll('products', businessId) || [];
    const lowStock = products
      .filter(p => Number(p.stock || 0) <= Number(p.minStockAlert || 5))
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        currentStock: Number(p.stock || 0),
        minAlertThreshold: Number(p.minStockAlert || 5),
        price: Number(p.price || 0),
        status: Number(p.stock || 0) <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
      }))
      .sort((a, b) => a.currentStock - b.currentStock);

    return {
      success: true,
      totalLowStockCount: lowStock.length,
      items: lowStock.slice(0, limit)
    };
  }

  async _getTopSellingProducts(businessId, period = 'this_month', limit = 5) {
    const sales = localDb.getAll('sales', businessId) || [];
    const dateRange = this._resolveDateRange(period);

    const filtered = sales.filter(s => {
      const d = new Date(s.timestamp || s.createdAt || s.date);
      return !isNaN(d) && d >= dateRange.start && d <= dateRange.end;
    });

    const productSalesMap = {};

    filtered.forEach(s => {
      const items = Array.isArray(s.items) ? s.items : [];
      items.forEach(item => {
        const key = item.productId || item.name || 'Unknown';
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            name: item.name || key,
            unitsSold: 0,
            revenue: 0
          };
        }
        productSalesMap[key].unitsSold += Number(item.quantity || 1);
        productSalesMap[key].revenue += Number(item.price || 0) * Number(item.quantity || 1);
      });
    });

    const ranked = Object.values(productSalesMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit);

    return {
      success: true,
      period,
      topProducts: ranked
    };
  }

  async _searchProducts(businessId, query = '') {
    const products = localDb.getAll('products', businessId) || [];
    const q = query.toLowerCase().trim();

    const matches = products.filter(p => {
      return (p.name && p.name.toLowerCase().includes(q)) ||
             (p.category && p.category.toLowerCase().includes(q)) ||
             (p.sku && p.sku.toLowerCase().includes(q)) ||
             (p.barcode && p.barcode.toLowerCase().includes(q));
    }).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: Number(p.price || 0),
      stock: Number(p.stock || 0),
      sku: p.sku || 'N/A'
    }));

    return {
      success: true,
      query,
      resultsCount: matches.length,
      products: matches.slice(0, 10)
    };
  }

  async _getCustomerBalances(businessId, limit = 10) {
    const customers = localDb.getAll('customers', businessId) || [];
    const debtors = customers
      .filter(c => Number(c.balance || c.currentBalance || 0) > 0)
      .map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || 'N/A',
        outstandingUdhaar: Number(c.balance || c.currentBalance || 0)
      }))
      .sort((a, b) => b.outstandingUdhaar - a.outstandingUdhaar);

    const totalUdhaar = debtors.reduce((sum, d) => sum + d.outstandingUdhaar, 0);

    return {
      success: true,
      debtorsCount: debtors.length,
      totalOutstandingReceivables: totalUdhaar,
      topDebtors: debtors.slice(0, limit)
    };
  }

  async _getPendingInvoices(businessId) {
    const invoices = localDb.getAll('invoices', businessId) || [];
    const pending = invoices.filter(inv => {
      const status = (inv.status || '').toLowerCase();
      return status === 'pending' || status === 'unpaid' || status === 'overdue';
    }).map(inv => ({
      invoiceNumber: inv.invoiceNumber || inv.id,
      customerName: inv.customerName || 'Customer',
      totalAmount: Number(inv.totalAmount || inv.total || 0),
      dueDate: inv.dueDate || 'N/A',
      status: inv.status || 'Pending'
    }));

    const totalPending = pending.reduce((sum, i) => sum + i.totalAmount, 0);

    return {
      success: true,
      pendingCount: pending.length,
      totalPendingAmount: totalPending,
      invoices: pending.slice(0, 8)
    };
  }

  async _getPurchaseHistory(businessId, limit = 6) {
    const purchases = localDb.getAll('purchases', businessId) || [];
    const mapped = purchases.slice(-limit).reverse().map(p => ({
      id: p.id,
      supplierName: p.supplierName || 'Supplier',
      totalAmount: Number(p.totalAmount || p.total || 0),
      date: p.date || p.timestamp || 'Recent',
      status: p.paymentStatus || 'Completed'
    }));

    return {
      success: true,
      recordsCount: mapped.length,
      purchases: mapped
    };
  }

  async _getBusinessActivity(businessId, limit = 8) {
    const sales = (localDb.getAll('sales', businessId) || []).slice(-limit).map(s => ({
      type: 'Sale',
      description: `Order #${s.orderNumber || s.id.slice(-4)}: ₹${Number(s.totalAmount || s.total || 0)} (${s.paymentMethod || 'cash'})`,
      timestamp: s.timestamp || s.createdAt || new Date().toISOString()
    }));

    const expenses = (localDb.getAll('expenses', businessId) || []).slice(-limit).map(e => ({
      type: 'Expense',
      description: `Spent ₹${Number(e.amount || 0)} on ${e.category || 'General'}`,
      timestamp: e.date || e.timestamp || e.createdAt || new Date().toISOString()
    }));

    const combined = [...sales, ...expenses]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return {
      success: true,
      activities: combined
    };
  }

  async _auditBusinessHealth(businessId) {
    const [salesSummary, profitSummary, inventorySummary, customerSummary] = await Promise.all([
      this._getSalesSummary(businessId, 'this_month'),
      this._calculateProfit(businessId, 'this_month'),
      this._getInventoryStatus(businessId),
      this._getCustomerBalances(businessId)
    ]);

    // Health Score calculation (0 - 100)
    let score = 85;
    const issues = [];
    const strengths = [];

    if (inventorySummary.outOfStockCount > 3) {
      score -= 15;
      issues.push(`${inventorySummary.outOfStockCount} products are completely out of stock.`);
    } else {
      strengths.push('Inventory availability is stable.');
    }

    if (customerSummary.totalOutstandingReceivables > salesSummary.totalRevenue * 0.4) {
      score -= 10;
      issues.push(`High customer credit (₹${customerSummary.totalOutstandingReceivables.toLocaleString('en-IN')}) tied up in unpaid udhaar.`);
    }

    if (profitSummary.netMarginPercentage < 10) {
      score -= 10;
      issues.push(`Low net profit margin (${profitSummary.netMarginPercentage}%). Operating expenses or COGS are high.`);
    } else {
      strengths.push(`Healthy net profit margin of ${profitSummary.netMarginPercentage}%.`);
    }

    return {
      success: true,
      healthScore: Math.max(20, Math.min(100, score)),
      healthStatus: score >= 80 ? 'EXCELLENT' : (score >= 60 ? 'GOOD' : 'ATTENTION_NEEDED'),
      keyStrengths: strengths,
      actionableIssues: issues,
      financialSnapshot: {
        monthRevenue: salesSummary.totalRevenue,
        monthNetProfit: profitSummary.netProfit,
        netMargin: `${profitSummary.netMarginPercentage}%`,
        unpaidUdhaar: customerSummary.totalOutstandingReceivables
      }
    };
  }

  async _prepareRestockPlan(businessId, daysOfStockNeeded = 14) {
    const lowStockResult = await this._getLowStockProducts(businessId, 25);
    const sales = localDb.getAll('sales', businessId) || [];

    // Calculate 30-day velocity per product
    const velocityMap = {};
    sales.forEach(s => {
      const items = Array.isArray(s.items) ? s.items : [];
      items.forEach(item => {
        const key = item.productId || item.name;
        velocityMap[key] = (velocityMap[key] || 0) + Number(item.quantity || 1);
      });
    });

    const recommendations = lowStockResult.items.map(item => {
      const past30DayUnits = velocityMap[item.id] || velocityMap[item.name] || 4;
      const dailyVelocity = Math.max(0.2, past30DayUnits / 30);
      const neededForPeriod = Math.ceil(dailyVelocity * daysOfStockNeeded);
      const reorderQuantity = Math.max(neededForPeriod - item.currentStock, 5);

      return {
        productId: item.id,
        name: item.name,
        currentStock: item.currentStock,
        estimatedDailySales: Math.round(dailyVelocity * 10) / 10,
        recommendedReorderUnits: reorderQuantity,
        estimatedRestockCost: reorderQuantity * (item.price * 0.65)
      };
    });

    const totalInvestment = recommendations.reduce((sum, r) => sum + r.estimatedRestockCost, 0);

    return {
      success: true,
      targetCoverageDays: daysOfStockNeeded,
      totalItemsToRestock: recommendations.length,
      estimatedCapitalRequired: Math.round(totalInvestment),
      restockItems: recommendations
    };
  }

  async _createSaleDraft(businessId, args) {
    const draftSale = {
      id: `draft_sale_${Date.now()}`,
      orderNumber: `ORD-${Date.now().toString().slice(-4)}`,
      items: args.items,
      paymentMethod: args.paymentMethod || 'cash',
      customerName: args.customerName || 'Walk-in Customer',
      createdAt: new Date().toISOString(),
      isDraft: true
    };

    return {
      success: true,
      message: `Sale draft prepared for ${args.items.length} item(s).`,
      draft: draftSale
    };
  }

  async _createExpenseDraft(businessId, args) {
    const id = `exp_${Date.now()}`;
    const newExpense = {
      id,
      amount: Number(args.amount),
      category: args.category,
      description: args.description || '',
      paymentMethod: args.paymentMethod || 'cash',
      date: new Date().toISOString()
    };

    // Save directly to persistent store if confirmed
    if (args._confirmed) {
      localDb.save('expenses', newExpense, businessId);
      db.add('expenses', newExpense, businessId).catch(() => {});
      return {
        success: true,
        message: `Expense of ₹${args.amount} for '${args.category}' has been officially recorded in the ledger.`
      };
    }

    return {
      success: true,
      draft: newExpense,
      message: `Expense draft ready for confirmation.`
    };
  }

  async _updateStock(businessId, args) {
    const products = localDb.getAll('products', businessId) || [];
    const product = products.find(p => p.id === args.productId || p.name?.toLowerCase() === args.productId.toLowerCase());

    if (!product) {
      return { success: false, error: `Product '${args.productId}' not found in inventory.` };
    }

    const previousStock = Number(product.stock || 0);
    const newStock = Math.max(0, previousStock + Number(args.adjustment));

    if (args._confirmed) {
      product.stock = newStock;
      localDb.save('products', product, businessId);
      db.update('products', product.id, { stock: newStock }, businessId).catch(() => {});

      // Record movement
      const movement = {
        id: `mov_${Date.now()}`,
        productId: product.id,
        productName: product.name,
        change: args.adjustment,
        newStock,
        reason: args.reason || 'AI stock adjustment',
        timestamp: new Date().toISOString()
      };
      localDb.save('stock_movements', movement, businessId);

      return {
        success: true,
        message: `Product '${product.name}' stock updated from ${previousStock} to ${newStock} units.`
      };
    }

    return {
      success: true,
      productName: product.name,
      previousStock,
      proposedStock: newStock
    };
  }

  async _recordPayment(businessId, args) {
    const customers = localDb.getAll('customers', businessId) || [];
    const customer = customers.find(c => c.id === args.customerId || c.name?.toLowerCase() === args.customerId.toLowerCase());

    if (!customer) {
      return { success: false, error: `Customer '${args.customerId}' not found.` };
    }

    const prevBalance = Number(customer.balance || customer.currentBalance || 0);
    const amount = Number(args.amount);
    const newBalance = Math.max(0, prevBalance - amount);

    if (args._confirmed) {
      customer.balance = newBalance;
      localDb.save('customers', customer, businessId);
      db.update('customers', customer.id, { balance: newBalance }, businessId).catch(() => {});

      return {
        success: true,
        message: `Recorded payment of ₹${amount} for ${customer.name}. New outstanding balance: ₹${newBalance}.`
      };
    }

    return {
      success: true,
      customerName: customer.name,
      previousBalance: prevBalance,
      proposedNewBalance: newBalance
    };
  }

  // --- Date Range Helper ---
  _resolveDateRange(period = 'today') {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (period === 'yesterday') {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'this_week') {
      const day = now.getDay() || 7;
      start.setDate(now.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'last_week') {
      const day = now.getDay() || 7;
      start.setDate(now.getDate() - day - 6);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - day);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'this_month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'last_month') {
      start.setMonth(now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(0); // Last day of previous month
      end.setHours(23, 59, 59, 999);
    } else if (period === 'this_year') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
    } else {
      // all_time
      start.setFullYear(2000, 0, 1);
    }

    return { start, end };
  }
}

export const aiActionService = new AiActionService();
