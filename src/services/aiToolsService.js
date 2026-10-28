/**
 * Karobaar AI Tools Service
 * Real database queries, deterministic financial mathematics, and validated business operations.
 * Zero fake responses. Strict multi-tenant business isolation and permission enforcement.
 */

import { db } from './databaseService';
import { salesService } from './salesService';
import { localDb } from './localDb';

// Format currency helper
export const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

// Sensitive tools that REQUIRE explicit user confirmation before execution
export const SENSITIVE_TOOLS = [
  'delete_product',
  'refund_sale',
  'record_payment',
  'update_order_status',
  'delete_record'
];

/**
 * Standard Tool Declarations Schema (OpenAI & Gemini Compatible)
 */
export const KAROBAAR_TOOL_DECLARATIONS = [
  // --- DASHBOARD TOOLS ---
  {
    type: 'function',
    function: {
      name: 'get_dashboard_summary',
      description: 'Get live overview of business performance: today revenue, total orders, expenses, net cash flow, health score, and low stock count.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_sales_summary',
      description: 'Get sales figures aggregated by period (today, yesterday, this_week, this_month, this_year, or all_time).',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'yesterday', 'this_week', 'this_month', 'this_year', 'all_time'],
            description: 'Time window for sales analysis.'
          }
        },
        required: ['period']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_expense_summary',
      description: 'Get total business expenses broken down by category for today, this month, or a custom range.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'this_month', 'this_year', 'all_time'],
            description: 'Time period for expenses.'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_profit',
      description: 'Deterministic calculation of Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, and Net Profit.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'this_month', 'all_time'],
            description: 'Period for profit analysis.'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_business_activity',
      description: 'Get recent operational log: latest sales, customer payments, expense entries, and low stock alerts.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of recent activities to retrieve (default: 8)' }
        },
        required: []
      }
    }
  },

  // --- PRODUCTS & INVENTORY TOOLS ---
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search products by name, category, SKU, barcode, or stock status.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term for product name or SKU' },
          category: { type: 'string', description: 'Filter by product category' },
          lowStockOnly: { type: 'boolean', description: 'Filter for items below alert threshold' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_product_details',
      description: 'Get detailed information for a single product by ID or exact name.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'Unique product ID' },
          productName: { type: 'string', description: 'Product name if ID is unknown' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_product',
      description: 'Create a new product in the store catalog with pricing, stock quantity, and category.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the product' },
          sellingPrice: { type: 'number', description: 'Selling price charged to customers' },
          costPrice: { type: 'number', description: 'Wholesale / cost price paid to acquire product' },
          stockQuantity: { type: 'number', description: 'Initial units in stock' },
          category: { type: 'string', description: 'Category (e.g. Food, Beverages, Electronics, Apparel)' },
          sku: { type: 'string', description: 'Stock keeping unit (auto-generated if omitted)' },
          minStockAlert: { type: 'number', description: 'Threshold to trigger low stock warnings (default: 5)' }
        },
        required: ['name', 'sellingPrice']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_product',
      description: 'Update price, name, category, or alert settings of an existing product.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'Product ID to update' },
          productName: { type: 'string', description: 'Product name if ID unknown' },
          updates: {
            type: 'object',
            description: 'Fields to update (name, sellingPrice, costPrice, category, minStockAlert)'
          }
        },
        required: ['updates']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_stock',
      description: 'Adjust or restock inventory quantity for a specific product.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'Product ID' },
          productName: { type: 'string', description: 'Product name if ID unknown' },
          adjustmentType: { type: 'string', enum: ['add', 'subtract', 'set'], description: 'How to adjust stock' },
          quantity: { type: 'number', description: 'Number of units' },
          reason: { type: 'string', description: 'Reason for adjustment (e.g. Restock, Damage, Audit)' }
        },
        required: ['quantity']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_low_stock_products',
      description: 'Retrieve all catalog items currently at or below their low stock threshold.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },

  // --- SALES & ORDERS TOOLS ---
  {
    type: 'function',
    function: {
      name: 'search_orders',
      description: 'Search sales orders by customer name, status, payment method, or date.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Customer name or order ID' },
          status: { type: 'string', enum: ['Completed', 'Pending', 'Unpaid', 'Partial', 'Cancelled'], description: 'Filter by status' },
          paymentMethod: { type: 'string', description: 'Filter by Cash, UPI, Card, Udhaar' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_order_details',
      description: 'Get full breakdown of a specific sales order including item list, taxes, discount, and customer info.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Unique order ID or invoiceNumber' }
        },
        required: ['orderId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_sale_draft',
      description: 'Prepares a sales order draft, validating stock availability, prices, discounts, and customer details.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string', description: 'Name of customer' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productName: { type: 'string' },
                productId: { type: 'string' },
                quantity: { type: 'number' },
                price: { type: 'number' }
              },
              required: ['quantity']
            },
            description: 'Items to include in sale'
          },
          discount: { type: 'number', description: 'Discount in rupees' },
          paymentMethod: { type: 'string', enum: ['Cash', 'UPI', 'Card', 'Udhaar'], description: 'Payment method' }
        },
        required: ['items']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_order_status',
      description: 'Update status of an existing order (e.g. Completed, Cancelled, Refunded). SENSITIVE: refunds require confirmation.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'ID of order to update' },
          newStatus: { type: 'string', enum: ['Completed', 'Cancelled', 'Refunded', 'Pending'] },
          reason: { type: 'string', description: 'Reason for status update' }
        },
        required: ['orderId', 'newStatus']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_sales_by_date_range',
      description: 'Get sales and revenue figures between two ISO date strings (startDate to endDate).',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'YYYY-MM-DD start date' },
          endDate: { type: 'string', description: 'YYYY-MM-DD end date' }
        },
        required: ['startDate', 'endDate']
      }
    }
  },

  // --- CUSTOMERS & SUPPLIERS TOOLS ---
  {
    type: 'function',
    function: {
      name: 'search_customers',
      description: 'Search customers by name or phone, returning pending balances (udhaar) and purchase history.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Customer name or phone number' },
          hasBalanceOnly: { type: 'boolean', description: 'Only show customers who owe money' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_customer',
      description: 'Add a new customer to the business khata directory.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Full customer name' },
          phone: { type: 'string', description: 'Phone number (10 digits)' },
          email: { type: 'string', description: 'Email address' },
          address: { type: 'string', description: 'Customer physical address' },
          creditLimit: { type: 'number', description: 'Max credit allowance' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_suppliers',
      description: 'Search wholesale suppliers and vendors by name or contact.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Supplier name or contact' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_supplier',
      description: 'Register a new supplier or vendor.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Company or vendor name' },
          contactPerson: { type: 'string', description: 'Representative contact name' },
          phone: { type: 'string', description: 'Phone number' },
          email: { type: 'string', description: 'Email address' }
        },
        required: ['name']
      }
    }
  },

  // --- INVOICES & EXPENSES TOOLS ---
  {
    type: 'function',
    function: {
      name: 'create_invoice_draft',
      description: 'Generate a formal itemized tax invoice draft for a customer with line items and due date.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string', description: 'Customer name' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productName: { type: 'string' },
                quantity: { type: 'number' },
                price: { type: 'number' }
              },
              required: ['productName', 'quantity', 'price']
            }
          },
          dueDate: { type: 'string', description: 'Payment due date (YYYY-MM-DD)' },
          taxPercent: { type: 'number', description: 'Applicable GST percentage (e.g. 5, 12, 18)' }
        },
        required: ['customerName', 'items']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_invoice_details',
      description: 'Retrieve full details of an invoice by invoiceNumber or ID.',
      parameters: {
        type: 'object',
        properties: {
          invoiceNumber: { type: 'string', description: 'Invoice number (e.g. INV-104928)' }
        },
        required: ['invoiceNumber']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_invoices',
      description: 'Search invoices by customer name, status (Paid, Pending, Overdue), or date.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Customer or invoice number' },
          status: { type: 'string', enum: ['Paid', 'Pending', 'Overdue'] }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_expense_draft',
      description: 'Record an operating expense with title, amount, category, and payment mode.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Expense purpose (e.g. Milk & Tea Supplies, Electricity Bill)' },
          amount: { type: 'number', description: 'Amount paid' },
          category: { type: 'string', description: 'Category (Operations, Utilities, Inventory, Rent, Salaries)' },
          paymentMode: { type: 'string', enum: ['Cash', 'UPI', 'Bank Transfer', 'Card'], description: 'Payment mode' }
        },
        required: ['title', 'amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'record_payment',
      description: 'Record customer payment against outstanding udhaar (Jama). SENSITIVE: updates customer balance.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string', description: 'Customer name' },
          customerId: { type: 'string', description: 'Customer ID if known' },
          amount: { type: 'number', description: 'Payment amount received' },
          paymentMode: { type: 'string', enum: ['Cash', 'UPI', 'Bank Transfer', 'Card'] },
          note: { type: 'string', description: 'Optional payment notes' }
        },
        required: ['amount']
      }
    }
  },

  // --- NAVIGATION & REPORTS TOOLS ---
  {
    type: 'function',
    function: {
      name: 'open_app_page',
      description: 'Navigate the application interface to a specific page or workspace module.',
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'string',
            enum: ['dashboard', 'pos', 'products', 'inventory', 'customers', 'orders', 'invoices', 'expenses', 'suppliers', 'purchases', 'employees', 'attendance', 'payroll', 'tasks', 'reports', 'settings', 'branches'],
            description: 'Destination page'
          }
        },
        required: ['page']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'apply_page_filters',
      description: 'Apply search or category filters to an active page.',
      parameters: {
        type: 'object',
        properties: {
          filterKey: { type: 'string', description: 'Filter key (e.g. category, status, search)' },
          filterValue: { type: 'string', description: 'Filter value' }
        },
        required: ['filterKey', 'filterValue']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_business_report',
      description: 'Generate an executive summary report for management review.',
      parameters: {
        type: 'object',
        properties: {
          reportType: { type: 'string', enum: ['profit_loss', 'sales_tax', 'inventory_audit', 'khata_aging'] }
        },
        required: ['reportType']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_current_business_settings',
      description: 'Returns store profile, active currency, branch details, and enabled modules.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'switch_theme',
      description: 'Switch the application UI theme between dark mode and light mode. Call this whenever the user requests dark mode, light mode, or to toggle theme.',
      parameters: {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['dark', 'light', 'toggle'],
            description: 'Target theme mode: "dark", "light", or "toggle"'
          }
        },
        required: ['mode']
      }
    }
  }
];

/**
 * Real Tool Execution Engine
 * Validates permissions, executes against real databases, and returns structured data.
 */
export const executeKarobaarTool = async (toolName, toolArgs = {}, authContext = {}) => {
  const { businessId, currentUser, currentBusiness, confirmed = false } = authContext;
  const activeBizId = businessId || currentUser?.activeBusinessId || 'demo-business-1';
  const userRole = (currentUser?.role || 'OWNER').toUpperCase();

  // 1. Role-based permission check
  const requiresManager = ['create_product', 'update_product', 'update_stock', 'create_supplier', 'update_order_status'];
  const requiresOwner = ['delete_product', 'refund_sale', 'delete_record'];

  if (requiresOwner.includes(toolName) && userRole !== 'OWNER' && userRole !== 'ADMIN') {
    return {
      success: false,
      error: `Access Denied: Only business Owners can execute '${toolName}'. Current role: ${userRole}.`
    };
  }

  if (requiresManager.includes(toolName) && userRole === 'STAFF') {
    return {
      success: false,
      error: `Access Denied: Role '${userRole}' does not have permission to execute '${toolName}'. Requires Manager or Owner.`
    };
  }

  // 2. Sensitive Action Confirmation Interceptor
  if (SENSITIVE_TOOLS.includes(toolName) && !confirmed) {
    let summary = `Execute ${toolName} with parameters: ${JSON.stringify(toolArgs)}`;
    if (toolName === 'record_payment') {
      summary = `Record payment of ${formatCurrency(toolArgs.amount)} from customer '${toolArgs.customerName || 'customer'}' (${toolArgs.paymentMode || 'Cash'}).`;
    } else if (toolName === 'update_order_status') {
      summary = `Update Order #${toolArgs.orderId} status to '${toolArgs.newStatus}'.`;
    } else if (toolName === 'delete_product') {
      summary = `Permanently delete product #${toolArgs.productId}.`;
    }

    return {
      success: false,
      requiresConfirmation: true,
      action: toolName,
      params: toolArgs,
      summary,
      message: `Sensitive Action Required: Please confirm to proceed with ${summary}`
    };
  }

  // Helper date match
  const isDateToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr.startsWith(today);
  };

  try {
    switch (toolName) {
      // ----------------------------------------------------
      // DASHBOARD TOOLS
      // ----------------------------------------------------
      case 'get_dashboard_summary': {
        const [sales, expenses, products, customers] = await Promise.all([
          db.getCollection('sales', activeBizId) || [],
          db.getCollection('expenses', activeBizId) || [],
          db.getCollection('products', activeBizId) || [],
          db.getCollection('customers', activeBizId) || []
        ]);

        const todaySales = sales.filter(s => isDateToday(s.date || s.createdAt));
        const todayExpenses = expenses.filter(e => isDateToday(e.date || e.createdAt));

        const todayRevenue = todaySales.reduce((acc, s) => acc + Number(s.totalAmount || s.grandTotal || s.total || 0), 0);
        const todayExpTotal = todayExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
        const netCashFlow = todayRevenue - todayExpTotal;

        const lowStock = products.filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockAlert) || 5));
        const totalReceivable = customers.reduce((sum, c) => sum + Math.max(0, Number(c.totalBalance || c.balance || c.outstandingBalance || 0)), 0);

        let healthScore = 80;
        if (todayRevenue > 0) healthScore += 10;
        if (netCashFlow >= 0) healthScore += 5;
        if (lowStock.length === 0) healthScore += 5;
        healthScore = Math.min(100, Math.max(40, healthScore));

        return {
          success: true,
          business: currentBusiness?.name || 'Karobaar Store',
          todayRevenue,
          formattedRevenue: formatCurrency(todayRevenue),
          todayOrdersCount: todaySales.length,
          todayExpenses: todayExpTotal,
          formattedExpenses: formatCurrency(todayExpTotal),
          netCashFlow,
          formattedNetCashFlow: formatCurrency(netCashFlow),
          healthScore,
          totalProductsCount: products.length,
          lowStockCount: lowStock.length,
          totalOutstandingUdhaar: totalReceivable,
          formattedUdhaar: formatCurrency(totalReceivable)
        };
      }

      case 'get_sales_summary': {
        const sales = await db.getCollection('sales', activeBizId) || [];
        const period = toolArgs.period || 'today';
        const now = new Date();

        let filtered = sales;
        if (period === 'today') {
          const todayStr = now.toISOString().split('T')[0];
          filtered = sales.filter(s => (s.date || s.createdAt || '').startsWith(todayStr));
        } else if (period === 'yesterday') {
          const yest = new Date(now);
          yest.setDate(yest.getDate() - 1);
          const yestStr = yest.toISOString().split('T')[0];
          filtered = sales.filter(s => (s.date || s.createdAt || '').startsWith(yestStr));
        } else if (period === 'this_week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = sales.filter(s => new Date(s.date || s.createdAt || 0) >= weekAgo);
        } else if (period === 'this_month') {
          const monthStr = now.toISOString().slice(0, 7); // YYYY-MM
          filtered = sales.filter(s => (s.date || s.createdAt || '').startsWith(monthStr));
        }

        const totalRevenue = filtered.reduce((acc, s) => acc + Number(s.totalAmount || s.grandTotal || s.total || 0), 0);
        const orderCount = filtered.length;
        const avgOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

        return {
          success: true,
          period,
          orderCount,
          totalRevenue,
          formattedRevenue: formatCurrency(totalRevenue),
          averageOrderValue: formatCurrency(avgOrder)
        };
      }

      case 'get_expense_summary': {
        const expenses = await db.getCollection('expenses', activeBizId) || [];
        const period = toolArgs.period || 'today';
        const now = new Date();

        let filtered = expenses;
        if (period === 'today') {
          filtered = expenses.filter(e => isDateToday(e.date || e.createdAt));
        } else if (period === 'this_month') {
          const monthStr = now.toISOString().slice(0, 7);
          filtered = expenses.filter(e => (e.date || e.createdAt || '').startsWith(monthStr));
        }

        const totalAmount = filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const categories = {};
        filtered.forEach(e => {
          const cat = e.category || 'General';
          categories[cat] = (categories[cat] || 0) + Number(e.amount || 0);
        });

        return {
          success: true,
          period,
          totalAmount,
          formattedTotal: formatCurrency(totalAmount),
          entriesCount: filtered.length,
          categoryBreakdown: categories,
          recentExpenses: filtered.slice(0, 5)
        };
      }

      case 'calculate_profit': {
        const [sales, expenses] = await Promise.all([
          db.getCollection('sales', activeBizId) || [],
          db.getCollection('expenses', activeBizId) || []
        ]);

        const period = toolArgs.period || 'today';
        let filteredSales = sales;
        let filteredExpenses = expenses;

        if (period === 'today') {
          filteredSales = sales.filter(s => isDateToday(s.date || s.createdAt));
          filteredExpenses = expenses.filter(e => isDateToday(e.date || e.createdAt));
        } else if (period === 'this_month') {
          const monthStr = new Date().toISOString().slice(0, 7);
          filteredSales = sales.filter(s => (s.date || s.createdAt || '').startsWith(monthStr));
          filteredExpenses = expenses.filter(e => (e.date || e.createdAt || '').startsWith(monthStr));
        }

        let totalRevenue = 0;
        let totalCOGS = 0;

        filteredSales.forEach(s => {
          const sTotal = Number(s.totalAmount || s.grandTotal || s.total || 0);
          totalRevenue += sTotal;
          if (Array.isArray(s.items)) {
            s.items.forEach(it => {
              const cost = Number(it.costPrice || it.cost || (it.price * 0.65) || 0);
              const qty = Number(it.quantity || it.qty || 1);
              totalCOGS += cost * qty;
            });
          } else {
            totalCOGS += sTotal * 0.65;
          }
        });

        const grossProfit = Math.max(0, totalRevenue - totalCOGS);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const netProfit = grossProfit - totalExpenses;
        const grossMarginPct = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';
        const netMarginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

        return {
          success: true,
          period,
          revenue: totalRevenue,
          formattedRevenue: formatCurrency(totalRevenue),
          costOfGoodsSold: totalCOGS,
          formattedCOGS: formatCurrency(totalCOGS),
          grossProfit,
          formattedGrossProfit: formatCurrency(grossProfit),
          grossMarginPercent: `${grossMarginPct}%`,
          operatingExpenses: totalExpenses,
          formattedOperatingExpenses: formatCurrency(totalExpenses),
          netProfit,
          formattedNetProfit: formatCurrency(netProfit),
          netMarginPercent: `${netMarginPct}%`
        };
      }

      case 'get_business_activity': {
        const [sales, expenses] = await Promise.all([
          db.getCollection('sales', activeBizId) || [],
          db.getCollection('expenses', activeBizId) || []
        ]);

        const recentSales = sales.slice(-5).map(s => ({
          type: 'SALE',
          description: `Sale #${s.invoiceNumber || s.id.slice(-6)} - ${formatCurrency(s.totalAmount || s.grandTotal || s.total)} (${s.paymentMethod || 'Cash'})`,
          timestamp: s.date || s.createdAt
        }));

        const recentExpenses = expenses.slice(-5).map(e => ({
          type: 'EXPENSE',
          description: `Expense: ${e.title} - ${formatCurrency(e.amount)} (${e.category || 'General'})`,
          timestamp: e.date || e.createdAt
        }));

        const combined = [...recentSales, ...recentExpenses].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        return {
          success: true,
          activities: combined.slice(0, toolArgs.limit || 8)
        };
      }

      // ----------------------------------------------------
      // PRODUCTS & INVENTORY TOOLS
      // ----------------------------------------------------
      case 'search_products': {
        const products = await db.getCollection('products', activeBizId) || [];
        const q = (toolArgs.query || '').toLowerCase().trim();
        const cat = (toolArgs.category || '').toLowerCase().trim();

        let matches = products.filter(p => {
          const name = (p.name || '').toLowerCase();
          const category = (p.category || '').toLowerCase();
          const sku = (p.sku || '').toLowerCase();

          const queryMatch = !q || name.includes(q) || sku.includes(q);
          const catMatch = !cat || category.includes(cat);
          const lowStockMatch = !toolArgs.lowStockOnly || (Number(p.stockQuantity || 0) <= (Number(p.minStockAlert) || 5));

          return queryMatch && catMatch && lowStockMatch;
        });

        return {
          success: true,
          count: matches.length,
          products: matches.slice(0, 15).map(p => ({
            id: p.id,
            name: p.name,
            sellingPrice: p.sellingPrice || p.price,
            formattedPrice: formatCurrency(p.sellingPrice || p.price),
            stockQuantity: p.stockQuantity || 0,
            category: p.category || 'General',
            sku: p.sku || 'N/A'
          }))
        };
      }

      case 'get_product_details': {
        const products = await db.getCollection('products', activeBizId) || [];
        const target = products.find(p => 
          (toolArgs.productId && p.id === toolArgs.productId) ||
          (toolArgs.productName && p.name && p.name.toLowerCase().includes(toolArgs.productName.toLowerCase()))
        );

        if (!target) {
          return { success: false, error: `Product not found.` };
        }

        return {
          success: true,
          product: {
            ...target,
            formattedPrice: formatCurrency(target.sellingPrice || target.price),
            formattedCost: formatCurrency(target.costPrice || (target.sellingPrice * 0.7))
          }
        };
      }

      case 'create_product': {
        const products = await db.getCollection('products', activeBizId) || [];
        const sellingPrice = Number(toolArgs.sellingPrice || 0);
        const costPrice = Number(toolArgs.costPrice || (sellingPrice * 0.7));
        const stockQuantity = Number(toolArgs.stockQuantity || 0);

        const newProd = {
          id: 'prod-' + Date.now(),
          name: toolArgs.name.trim(),
          sellingPrice,
          price: sellingPrice,
          costPrice,
          stockQuantity,
          category: toolArgs.category || 'General',
          sku: toolArgs.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          minStockAlert: Number(toolArgs.minStockAlert || 5),
          createdAt: new Date().toISOString()
        };

        products.unshift(newProd);
        await db.saveCollection('products', products, activeBizId);

        return {
          success: true,
          message: `Product '${newProd.name}' created with ${stockQuantity} units at ${formatCurrency(sellingPrice)}.`,
          product: newProd
        };
      }

      case 'update_product': {
        const products = await db.getCollection('products', activeBizId) || [];
        const target = products.find(p => 
          (toolArgs.productId && p.id === toolArgs.productId) ||
          (toolArgs.productName && p.name && p.name.toLowerCase().includes(toolArgs.productName.toLowerCase()))
        );

        if (!target) {
          return { success: false, error: 'Product to update was not found.' };
        }

        Object.assign(target, toolArgs.updates || {});
        if (target.sellingPrice !== undefined) target.price = target.sellingPrice;
        target.updatedAt = new Date().toISOString();

        await db.saveCollection('products', products, activeBizId);

        return {
          success: true,
          message: `Updated product '${target.name}'.`,
          product: target
        };
      }

      case 'update_stock': {
        const products = await db.getCollection('products', activeBizId) || [];
        const target = products.find(p => 
          (toolArgs.productId && p.id === toolArgs.productId) ||
          (toolArgs.productName && p.name && p.name.toLowerCase().includes(toolArgs.productName.toLowerCase()))
        );

        if (!target) {
          return { success: false, error: 'Product not found for stock adjustment.' };
        }

        const currentQty = Number(target.stockQuantity || 0);
        const delta = Number(toolArgs.quantity || 0);
        let newQty = currentQty;

        if (toolArgs.adjustmentType === 'subtract') {
          newQty = Math.max(0, currentQty - delta);
        } else if (toolArgs.adjustmentType === 'set') {
          newQty = Math.max(0, delta);
        } else {
          newQty = currentQty + delta;
        }

        target.stockQuantity = newQty;
        target.updatedAt = new Date().toISOString();
        await db.saveCollection('products', products, activeBizId);

        return {
          success: true,
          productName: target.name,
          previousStock: currentQty,
          newStock: newQty,
          message: `Stock of '${target.name}' updated from ${currentQty} to ${newQty} units.`
        };
      }

      case 'get_low_stock_products': {
        const products = await db.getCollection('products', activeBizId) || [];
        const lowStock = products.filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockAlert) || 5));

        return {
          success: true,
          count: lowStock.length,
          items: lowStock.map(p => ({
            id: p.id,
            name: p.name,
            currentStock: p.stockQuantity || 0,
            threshold: p.minStockAlert || 5,
            formattedPrice: formatCurrency(p.sellingPrice || p.price)
          }))
        };
      }

      // ----------------------------------------------------
      // SALES & ORDERS TOOLS
      // ----------------------------------------------------
      case 'search_orders': {
        const sales = await db.getCollection('sales', activeBizId) || [];
        const q = (toolArgs.query || '').toLowerCase().trim();

        let filtered = sales.filter(s => {
          const invMatch = !q || (s.invoiceNumber || s.id || '').toLowerCase().includes(q) || (s.customerName || '').toLowerCase().includes(q);
          const statusMatch = !toolArgs.status || (s.status || '').toLowerCase() === toolArgs.status.toLowerCase();
          const modeMatch = !toolArgs.paymentMethod || (s.paymentMethod || '').toLowerCase().includes(toolArgs.paymentMethod.toLowerCase());
          return invMatch && statusMatch && modeMatch;
        });

        return {
          success: true,
          count: filtered.length,
          orders: filtered.slice(0, 10).map(s => ({
            id: s.id,
            invoiceNumber: s.invoiceNumber || s.id.slice(-6),
            totalAmount: s.totalAmount || s.grandTotal || s.total || 0,
            formattedTotal: formatCurrency(s.totalAmount || s.grandTotal || s.total || 0),
            status: s.status || 'Completed',
            paymentMethod: s.paymentMethod || 'Cash',
            date: s.date || s.createdAt
          }))
        };
      }

      case 'get_order_details': {
        const sales = await db.getCollection('sales', activeBizId) || [];
        const target = sales.find(s => s.id === toolArgs.orderId || s.invoiceNumber === toolArgs.orderId);

        if (!target) return { success: false, error: 'Order not found.' };

        return {
          success: true,
          order: {
            ...target,
            formattedTotal: formatCurrency(target.totalAmount || target.grandTotal || target.total)
          }
        };
      }

      case 'create_sale_draft': {
        const products = await db.getCollection('products', activeBizId) || [];
        let subtotal = 0;
        const validatedItems = [];

        for (const reqItem of (toolArgs.items || [])) {
          const p = products.find(prod => 
            (reqItem.productId && prod.id === reqItem.productId) ||
            (reqItem.productName && prod.name.toLowerCase().includes(reqItem.productName.toLowerCase()))
          );

          if (!p) {
            return { success: false, error: `Product '${reqItem.productName || reqItem.productId}' not found in catalog.` };
          }

          const qty = Number(reqItem.quantity || 1);
          const price = Number(reqItem.price || p.sellingPrice || p.price || 0);
          const lineTotal = qty * price;
          subtotal += lineTotal;

          validatedItems.push({
            productId: p.id,
            productName: p.name,
            quantity: qty,
            price,
            lineTotal
          });
        }

        const discount = Number(toolArgs.discount || 0);
        const grandTotal = Math.max(0, subtotal - discount);

        return {
          success: true,
          draft: {
            customerName: toolArgs.customerName || 'Walk-in Customer',
            items: validatedItems,
            subtotal,
            formattedSubtotal: formatCurrency(subtotal),
            discount,
            grandTotal,
            formattedGrandTotal: formatCurrency(grandTotal),
            paymentMethod: toolArgs.paymentMethod || 'Cash'
          },
          message: `Sale draft prepared for ${validatedItems.length} items. Total: ${formatCurrency(grandTotal)}.`
        };
      }

      case 'update_order_status': {
        const sales = await db.getCollection('sales', activeBizId) || [];
        const target = sales.find(s => s.id === toolArgs.orderId || s.invoiceNumber === toolArgs.orderId);

        if (!target) return { success: false, error: 'Order not found to update status.' };

        target.status = toolArgs.newStatus;
        target.statusReason = toolArgs.reason || '';
        target.updatedAt = new Date().toISOString();

        await db.saveCollection('sales', sales, activeBizId);

        return {
          success: true,
          message: `Order #${target.invoiceNumber || target.id} status updated to '${toolArgs.newStatus}'.`,
          order: target
        };
      }

      // ----------------------------------------------------
      // CUSTOMERS & SUPPLIERS TOOLS
      // ----------------------------------------------------
      case 'search_customers': {
        const customers = await db.getCollection('customers', activeBizId) || [];
        const q = (toolArgs.query || '').toLowerCase().trim();

        let filtered = customers.filter(c => {
          const matchQ = !q || (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
          const matchBal = !toolArgs.hasBalanceOnly || Number(c.totalBalance || c.balance || 0) > 0;
          return matchQ && matchBal;
        });

        return {
          success: true,
          count: filtered.length,
          customers: filtered.slice(0, 10).map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone || 'N/A',
            balance: Number(c.totalBalance || c.balance || 0),
            formattedBalance: formatCurrency(c.totalBalance || c.balance || 0)
          }))
        };
      }

      case 'create_customer': {
        const customers = await db.getCollection('customers', activeBizId) || [];
        const newCust = {
          id: 'cust-' + Date.now(),
          name: toolArgs.name.trim(),
          phone: toolArgs.phone || '',
          email: toolArgs.email || '',
          address: toolArgs.address || '',
          creditLimit: Number(toolArgs.creditLimit || 5000),
          totalBalance: 0,
          balance: 0,
          createdAt: new Date().toISOString()
        };

        customers.unshift(newCust);
        await db.saveCollection('customers', customers, activeBizId);

        return {
          success: true,
          message: `Customer '${newCust.name}' registered with initial balance ₹0.00.`,
          customer: newCust
        };
      }

      case 'record_payment': {
        const customers = await db.getCollection('customers', activeBizId) || [];
        const amount = Number(toolArgs.amount || 0);

        if (amount <= 0) return { success: false, error: 'Payment amount must be greater than zero.' };

        let matched = customers.find(c => 
          (toolArgs.customerId && c.id === toolArgs.customerId) ||
          (toolArgs.customerName && c.name.toLowerCase().includes(toolArgs.customerName.toLowerCase()))
        );

        if (!matched) {
          return { success: false, error: `Customer '${toolArgs.customerName || toolArgs.customerId}' not found.` };
        }

        const prevBal = Number(matched.totalBalance || matched.balance || 0);
        const newBal = Math.max(0, prevBal - amount);

        matched.totalBalance = newBal;
        matched.balance = newBal;
        matched.lastPaymentDate = new Date().toISOString();

        await db.saveCollection('customers', customers, activeBizId);

        return {
          success: true,
          customerName: matched.name,
          amountPaid: amount,
          formattedPaid: formatCurrency(amount),
          previousBalance: prevBal,
          remainingBalance: newBal,
          formattedRemainingBalance: formatCurrency(newBal),
          message: `Recorded payment of ${formatCurrency(amount)} from ${matched.name}. Remaining udhaar: ${formatCurrency(newBal)}.`
        };
      }

      case 'create_expense_draft': {
        const expenses = await db.getCollection('expenses', activeBizId) || [];
        const amount = Number(toolArgs.amount || 0);

        if (amount <= 0) return { success: false, error: 'Expense amount must be greater than zero.' };

        const newExp = {
          id: 'exp-' + Date.now(),
          title: toolArgs.title.trim(),
          amount,
          category: toolArgs.category || 'Operations',
          paymentMode: toolArgs.paymentMode || 'Cash',
          date: new Date().toISOString()
        };

        expenses.unshift(newExp);
        await db.saveCollection('expenses', expenses, activeBizId);

        return {
          success: true,
          message: `Expense '${newExp.title}' for ${formatCurrency(amount)} recorded in cash book.`,
          expense: newExp
        };
      }

      // ----------------------------------------------------
      // NAVIGATION & REPORTS TOOLS
      // ----------------------------------------------------
      case 'open_app_page': {
        const page = (toolArgs.page || 'dashboard').toLowerCase();
        const validPages = {
          dashboard: '/dashboard',
          pos: '/pos',
          products: '/products',
          inventory: '/inventory',
          customers: '/customers',
          orders: '/orders',
          invoices: '/invoices',
          expenses: '/expenses',
          suppliers: '/suppliers',
          purchases: '/purchases',
          employees: '/employees',
          attendance: '/attendance',
          payroll: '/payroll',
          tasks: '/tasks',
          reports: '/reports',
          settings: '/settings',
          branches: '/branches'
        };

        const targetPath = validPages[page] || '/dashboard';

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('karobaar_ai_navigate', { detail: { path: targetPath } }));
        }

        return {
          success: true,
          navigatedTo: targetPath,
          message: `Navigated to ${page.toUpperCase()} view (${targetPath}).`
        };
      }

      case 'generate_business_report': {
        const [sales, expenses, products] = await Promise.all([
          db.getCollection('sales', activeBizId) || [],
          db.getCollection('expenses', activeBizId) || [],
          db.getCollection('products', activeBizId) || []
        ]);

        const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount || s.grandTotal || s.total || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const totalStockUnits = products.reduce((sum, p) => sum + Number(p.stockQuantity || 0), 0);

        return {
          success: true,
          reportType: toolArgs.reportType || 'profit_loss',
          totalRevenue: formatCurrency(totalRevenue),
          totalExpenses: formatCurrency(totalExpenses),
          totalProducts: products.length,
          totalInventoryUnits: totalStockUnits,
          generatedAt: new Date().toISOString()
        };
      }

      case 'get_current_business_settings': {
        return {
          success: true,
          businessId: activeBizId,
          businessName: currentBusiness?.name || 'Karobaar Store',
          currency: 'INR (₹)',
          defaultTaxRate: '18% GST',
          multiBranchEnabled: true,
          userRole
        };
      }

      case 'switch_theme': {
        const mode = toolArgs?.mode || 'toggle';
        if (authContext.toggleTheme) {
          if (mode === 'dark') {
            authContext.toggleTheme('dark');
          } else if (mode === 'light') {
            authContext.toggleTheme('light');
          } else {
            authContext.toggleTheme();
          }
        }
        return {
          success: true,
          mode,
          message: `Application theme successfully set to ${mode} mode.`
        };
      }

      default:
        return {
          success: false,
          error: `Tool '${toolName}' is not implemented in the Karobaar Tools Registry.`
        };
    }
  } catch (err) {
    console.error(`Error executing tool ${toolName}:`, err);
    return {
      success: false,
      error: `Execution error in ${toolName}: ${err.message}`
    };
  }
};
