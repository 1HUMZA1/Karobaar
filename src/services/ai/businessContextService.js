/**
 * Karobaar Business Context Service 3.0
 * Retrieves current, authorized store and cafeteria context from the active workspace.
 * Builds compact, rich context for Gemini prompts and Jarvis AI 3.0 intelligence.
 */

import { localDb } from '../localDb.js';

class BusinessContextService {
  /**
   * Extract live snapshot of active workspace
   */
  async getBusinessSnapshot(authContext = {}) {
    const businessId = authContext.businessId || 
                       authContext.currentBusiness?.id || 
                       localStorage.getItem('karobaar-active-business') || 
                       'biz-sas-and-sons';

    const business = authContext.currentBusiness || {
      id: businessId,
      name: 'SAS AND SONS / SAS CAFETERIA',
      currency: 'INR',
      settings: {}
    };

    const user = authContext.currentUser || {
      name: 'Owner',
      role: 'Owner'
    };

    // Pull verified records from local offline-first store
    const products = localDb.getAll('products', businessId) || [];
    const sales = localDb.getAll('sales', businessId) || [];
    const expenses = localDb.getAll('expenses', businessId) || [];
    const customers = localDb.getAll('customers', businessId) || [];

    // Date calculations
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's Sales
    const todaySales = sales.filter(s => {
      const d = s.timestamp || s.createdAt || s.date;
      return d && d.slice(0, 10) === todayStr;
    });
    const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.totalAmount || s.total || 0), 0);
    const todayOrdersCount = todaySales.length;

    // Estimate Today's Profit
    let todayCost = 0;
    todaySales.forEach(s => {
      if (Array.isArray(s.items)) {
        s.items.forEach(item => {
          const cost = Number(item.purchasePrice || item.costPrice || 0);
          const qty = Number(item.quantity || 1);
          todayCost += cost * qty;
        });
      }
    });
    const todayProfit = Math.max(0, todayRevenue - todayCost);
    const todayMarginPct = todayRevenue > 0 ? Math.round((todayProfit / todayRevenue) * 100) : 0;

    // Month's Sales
    const monthSales = sales.filter(s => {
      const d = new Date(s.timestamp || s.createdAt || s.date);
      return !isNaN(d) && d >= startOfMonth;
    });
    const monthRevenue = monthSales.reduce((sum, s) => sum + Number(s.totalAmount || s.total || 0), 0);

    // Month's Expenses
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date || e.timestamp || e.createdAt);
      return !isNaN(d) && d >= startOfMonth;
    });
    const totalMonthExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Stock health
    const lowStockItems = products.filter(p => Number(p.stockQuantity ?? p.stock ?? 0) <= Number(p.minimumStock ?? p.minStockAlert ?? 15));
    const outOfStockItems = products.filter(p => Number(p.stockQuantity ?? p.stock ?? 0) <= 0);

    // Customer Receivables (Udhaar)
    const debtors = customers
      .filter(c => Number(c.balance || c.currentBalance || 0) > 0)
      .sort((a, b) => Number(b.balance || b.currentBalance || 0) - Number(a.balance || a.currentBalance || 0));
    const totalUdhaar = debtors.reduce((sum, c) => sum + Number(c.balance || c.currentBalance || 0), 0);

    // Cafeteria & Products sample menu
    const topProducts = products.slice(0, 8).map(p => ({
      name: p.name,
      price: p.sellingPrice || p.price,
      stock: p.stockQuantity ?? p.stock ?? 0,
      category: p.category || 'General'
    }));

    return {
      businessId,
      businessName: business.name || 'SAS CAFETERIA',
      currency: business.currency || business.settings?.currency || 'INR',
      userRole: user.role || 'Owner',
      userName: user.name || 'User',
      todayStr,
      metrics: {
        todaySalesCount: todayOrdersCount,
        todayRevenue,
        todayProfit,
        todayMarginPct,
        monthSalesCount: monthSales.length,
        monthRevenue,
        monthExpenses: totalMonthExpenses,
        totalProducts: products.length,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        totalCustomers: customers.length,
        totalOutstandingUdhaar: totalUdhaar,
        topDebtors: debtors.slice(0, 4).map(d => ({ name: d.name, amount: Number(d.balance || d.currentBalance || 0) })),
        topProducts
      }
    };
  }

  /**
   * Formats a concise text summary to inject into the Gemini system prompt
   */
  async buildSystemContext(authContext) {
    const snap = await this.getBusinessSnapshot(authContext);
    const currSym = snap.currency === 'INR' ? '₹' : (snap.currency === 'USD' ? '$' : snap.currency);

    const debtorsList = snap.metrics.topDebtors.map(d => `${d.name}: ${currSym}${d.amount.toLocaleString('en-IN')}`).join(', ');
    const menuList = snap.metrics.topProducts.map(p => `${p.name} (${currSym}${p.price}, stock: ${p.stock})`).join('; ');

    return `
YOU ARE JARVIS 3.0 — The Executive AI Co-Pilot for ${snap.businessName}.
You are speaking directly with the store owner or manager. Speak naturally, concisely, intelligently, and authoritatively.

LIVE STORE & CAFETERIA TELEMETRY:
- Business: "${snap.businessName}" (ID: ${snap.businessId})
- Current Operator: ${snap.userName} (${snap.userRole})
- Currency: ${snap.currency} (${currSym})
- Today's Sales: ${currSym}${snap.metrics.todayRevenue.toLocaleString('en-IN')} across ${snap.metrics.todaySalesCount} orders
- Today's Estimated Net Profit: ${currSym}${snap.metrics.todayProfit.toLocaleString('en-IN')} (Margin: ${snap.metrics.todayMarginPct}%)
- Total Customer Udhaar (Khata Balance): ${currSym}${snap.metrics.totalOutstandingUdhaar.toLocaleString('en-IN')}
${debtorsList ? `- Top Debtors: ${debtorsList}` : '- No outstanding customer debt'}
- Inventory Status: ${snap.metrics.totalProducts} total items (${snap.metrics.lowStockCount} low stock, ${snap.metrics.outOfStockCount} out of stock)
- Live Menu / Products: ${menuList}

CAPABILITIES:
1. When asked about cafeteria sales, profit, or expenses, quote the live telemetry metrics.
2. When asked about low stock or inventory, name the affected items and advise restocking.
3. When asked about who owes money, reference customer Khata balances.
4. When asked to start or bill an order, guide them or advise opening the POS register.
5. Answer follow-up questions seamlessly using previous conversation context.
6. Support multi-language requests (English, Urdu, Hindi, Arabic, Spanish, French, German).
`.trim();
  }
}

export const businessContextService = new BusinessContextService();
