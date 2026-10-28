/**
 * Karobaar Business Context Service
 * Retrieves current, authorized store context from the active workspace.
 * Builds compact, token-bounded context for Gemini prompts without dumping raw databases.
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
                       'demo-business-1';

    const business = authContext.currentBusiness || {
      id: businessId,
      name: 'Karobaar Business',
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
    const lowStockItems = products.filter(p => Number(p.stock || 0) <= Number(p.minStockAlert || 5));
    const outOfStockItems = products.filter(p => Number(p.stock || 0) <= 0);

    // Customer Receivables (Udhaar)
    const totalUdhaar = customers.reduce((sum, c) => sum + Number(c.balance || c.currentBalance || 0), 0);

    return {
      businessId,
      businessName: business.name || 'Store',
      currency: business.currency || business.settings?.currency || 'INR',
      userRole: user.role || 'Owner',
      userName: user.name || 'User',
      todayStr,
      metrics: {
        todaySalesCount: todaySales.length,
        todayRevenue,
        monthSalesCount: monthSales.length,
        monthRevenue,
        monthExpenses: totalMonthExpenses,
        totalProducts: products.length,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        totalCustomers: customers.length,
        totalOutstandingUdhaar: totalUdhaar
      }
    };
  }

  /**
   * Formats a concise text summary to inject into the Gemini system prompt
   */
  async buildSystemContext(authContext) {
    const snap = await this.getBusinessSnapshot(authContext);
    const currSym = snap.currency === 'INR' ? '₹' : (snap.currency === 'USD' ? '$' : snap.currency);

    return `
ACTIVE WORKSPACE CONTEXT:
- Business: "${snap.businessName}" (ID: ${snap.businessId})
- Current User: ${snap.userName} (Role: ${snap.userRole})
- Currency: ${snap.currency} (${currSym})
- Date/Time: ${new Date().toLocaleString('en-IN', { timeZoneName: 'short' })}
- Today's Revenue: ${currSym}${snap.metrics.todayRevenue.toLocaleString('en-IN')} (${snap.metrics.todaySalesCount} sales)
- Month Revenue: ${currSym}${snap.metrics.monthRevenue.toLocaleString('en-IN')} (${snap.metrics.monthSalesCount} sales)
- Month Expenses: ${currSym}${snap.metrics.monthExpenses.toLocaleString('en-IN')}
- Outstanding Receivables (Udhaar): ${currSym}${snap.metrics.totalOutstandingUdhaar.toLocaleString('en-IN')}
- Inventory: ${snap.metrics.totalProducts} total products (${snap.metrics.lowStockCount} low stock, ${snap.metrics.outOfStockCount} out of stock)
`.trim();
  }
}

export const businessContextService = new BusinessContextService();
