/**
 * Karobaar Business Planning & Recommendation Engine
 * Produces evidence-backed, actionable business intelligence.
 * Every insight adheres strictly to the 5-part structure:
 * 1. What was observed.
 * 2. Supporting data and date range.
 * 3. Why it matters.
 * 4. Practical next step.
 * 5. Important limitations / assumptions.
 */

import { localDb } from '../localDb.js';
import { aiActionService } from './aiActionService.js';

class RecommendationEngine {
  /**
   * Generates comprehensive evidence-based business intelligence recommendations
   */
  async generateBusinessRecommendations(businessId = 'demo-business-1') {
    const [salesSummary, profitSummary, inventorySummary, customerBalances] = await Promise.all([
      aiActionService.executeTool('get_sales_summary', { period: 'this_month' }, { businessId }),
      aiActionService.executeTool('calculate_profit', { period: 'this_month' }, { businessId }),
      aiActionService.executeTool('get_inventory_status', {}, { businessId }),
      aiActionService.executeTool('get_customer_balances', { limit: 5 }, { businessId })
    ]);

    const insights = [];

    // 1. Inventory Stockout Risk Recommendation
    if (inventorySummary.lowStockCount > 0 || inventorySummary.outOfStockCount > 0) {
      const lowCount = inventorySummary.lowStockCount;
      const oosCount = inventorySummary.outOfStockCount;

      insights.push({
        id: 'rec_inventory_stockout',
        category: 'Inventory & Supply Chain',
        severity: oosCount > 0 ? 'HIGH' : 'MEDIUM',
        title: `Restock Required: ${oosCount} items out of stock, ${lowCount} running low`,
        observation: `Identified ${oosCount} catalog products with zero inventory and ${lowCount} products below their minimum safety threshold.`,
        supportingData: `Total catalog items: ${inventorySummary.totalCatalogProducts}. Current inventory value: ₹${inventorySummary.estimatedInventoryValue.toLocaleString('en-IN')}. Evaluation date: Current active snapshot.`,
        whyItMatters: `Stockouts directly cause missed customer billing at POS, lower daily revenue, and risk driving regular shoppers to competitors.`,
        practicalNextStep: `Review the AI Restock Plan and place supplier reorders for high-velocity items immediately.`,
        limitation: `Assumes current supplier lead times are within 3-5 business days and historical sales velocity remains steady.`
      });
    }

    // 2. Net Profit Margin & Operating Expense Recommendation
    if (profitSummary.success) {
      const margin = profitSummary.netMarginPercentage;
      const isLow = margin < 15;

      insights.push({
        id: 'rec_profit_margin',
        category: 'Financial Health',
        severity: isLow ? 'HIGH' : 'LOW',
        title: isLow ? `Low Net Margin Alert (${margin}%)` : `Healthy Net Margin (${margin}%)`,
        observation: isLow 
          ? `Operating expenses (₹${profitSummary.operatingExpenses.toLocaleString('en-IN')}) are taking a large portion of gross profit (₹${profitSummary.grossProfit.toLocaleString('en-IN')}).`
          : `Business is operating with a solid net margin of ${margin}% for the current month.`,
        supportingData: `Revenue: ₹${profitSummary.revenue.toLocaleString('en-IN')}, COGS: ₹${profitSummary.costOfGoodsSold.toLocaleString('en-IN')}, Net Profit: ₹${profitSummary.netProfit.toLocaleString('en-IN')}. Period: This Month.`,
        whyItMatters: isLow 
          ? `A net margin below 15% leaves little buffer for sudden demand drops, seasonal slowdowns, or unexpected maintenance expenses.`
          : `Maintaining consistent net margins provides capital for store expansion, higher stock levels, and marketing.`,
        practicalNextStep: isLow 
          ? `Audit categorized operating expenses to identify discretionary costs and negotiate vendor wholesale pricing.`
          : `Maintain current pricing strategy and review top margin contributors to increase their sales volume.`,
        limitation: `COGS calculations are derived from configured product cost prices. Products without recorded cost prices use standard category margin estimates.`
      });
    }

    // 3. Customer Receivables (Udhaar / Khata) Recommendation
    if (customerBalances.success && customerBalances.totalOutstandingReceivables > 0) {
      const totalUdhaar = customerBalances.totalOutstandingReceivables;
      const debtorCount = customerBalances.debtorsCount;

      insights.push({
        id: 'rec_customer_udhaar',
        category: 'Cash Flow & Credit',
        severity: totalUdhaar > 15000 ? 'MEDIUM' : 'LOW',
        title: `Outstanding Customer Udhaar: ₹${totalUdhaar.toLocaleString('en-IN')} across ${debtorCount} accounts`,
        observation: `₹${totalUdhaar.toLocaleString('en-IN')} is currently tied up in outstanding customer balances across ${debtorCount} customers.`,
        supportingData: `Top debtors ledger: ${customerBalances.topDebtors.map(d => `${d.name} (₹${d.outstandingUdhaar})`).slice(0, 3).join(', ')}.`,
        whyItMatters: `High outstanding credit limits available cash flow to buy fresh inventory and pay recurring operational bills.`,
        practicalNextStep: `Send polite WhatsApp payment reminders to top debtors and consider setting a credit limit per customer.`,
        limitation: `Assumes all recorded customer credit transactions in Khata represent active recoverable dues.`
      });
    }

    // 4. Slow-Moving Inventory Recommendation
    const products = localDb.getAll('products', businessId) || [];
    const sales = localDb.getAll('sales', businessId) || [];
    const soldProductIds = new Set();
    sales.forEach(s => {
      (s.items || []).forEach(i => soldProductIds.add(i.productId || i.id));
    });

    const stagnantProducts = products.filter(p => !soldProductIds.has(p.id) && Number(p.stock || 0) > 10);
    if (stagnantProducts.length > 0) {
      const stagnantCapital = stagnantProducts.reduce((sum, p) => sum + (Number(p.stock) * Number(p.price || 0)), 0);

      insights.push({
        id: 'rec_stagnant_inventory',
        category: 'Inventory Optimization',
        severity: 'LOW',
        title: `${stagnantProducts.length} Slow-Moving Products Holding ₹${Math.round(stagnantCapital).toLocaleString('en-IN')} Capital`,
        observation: `${stagnantProducts.length} items with more than 10 units in stock have generated 0 recorded sales recently.`,
        supportingData: `Identified items include: ${stagnantProducts.map(p => p.name).slice(0, 4).join(', ')}. Capital tied: ₹${Math.round(stagnantCapital).toLocaleString('en-IN')}.`,
        whyItMatters: `Stagnant inventory occupies shelf space, ties up operating cash, and increases the risk of product expiration or damage.`,
        practicalNextStep: `Create a bundled promotion, discount offer, or feature these products near the checkout counter to liquidate stock.`,
        limitation: `Based on sales transactions recorded in Karobaar. Offline or unrecorded transactions are not accounted for.`
      });
    }

    return {
      success: true,
      businessId,
      evaluationTimestamp: new Date().toISOString(),
      totalRecommendations: insights.length,
      recommendations: insights
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
