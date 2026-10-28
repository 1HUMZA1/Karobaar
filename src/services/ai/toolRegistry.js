/**
 * Karobaar AI Tool Registry
 * Single Source of Truth for approved application tools.
 * Strict JSON schemas, role-based access rules, and confirmation policies.
 */

export const TOOL_PERMISSIONS = {
  STAFF: ['Staff', 'Manager', 'Owner'],
  MANAGER: ['Manager', 'Owner'],
  OWNER: ['Owner']
};

export const REGISTERED_TOOLS = [
  // ==========================================
  // 1. DASHBOARD & FINANCIAL ANALYTICS (READ)
  // ==========================================
  {
    name: 'get_dashboard_summary',
    description: 'Retrieve real-time business health summary: today sales, order count, expenses, low stock items, and receivables.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    minRole: 'Staff',
    requiresConfirmation: false
  },
  {
    name: 'get_sales_summary',
    description: 'Aggregates sales figures, order counts, average ticket size, and payment breakdown by period.',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'yesterday', 'this_week', 'this_month', 'last_month', 'this_year', 'all_time'],
          description: 'Time period for sales calculation.'
        }
      },
      required: ['period']
    },
    minRole: 'Staff',
    requiresConfirmation: false
  },
  {
    name: 'compare_sales_periods',
    description: 'Compares sales and order growth between two periods (e.g. this month vs last month, this week vs last week).',
    parameters: {
      type: 'object',
      properties: {
        basePeriod: {
          type: 'string',
          enum: ['this_month', 'this_week', 'today'],
          description: 'The current period to evaluate.'
        },
        comparisonPeriod: {
          type: 'string',
          enum: ['last_month', 'last_week', 'yesterday'],
          description: 'The previous reference period.'
        }
      },
      required: ['basePeriod', 'comparisonPeriod']
    },
    minRole: 'Manager',
    requiresConfirmation: false
  },
  {
    name: 'get_expense_summary',
    description: 'Calculates business operational expenses grouped by category, identifying top spending categories.',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'this_week', 'this_month', 'this_year', 'all_time'],
          description: 'Time window for recorded expenses.'
        }
      },
      required: []
    },
    minRole: 'Manager',
    requiresConfirmation: false
  },
  {
    name: 'calculate_profit',
    description: 'Deterministic profit and loss calculation: Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, Net Profit, and Margin Percentage.',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'this_week', 'this_month', 'all_time'],
          description: 'Time window for profit & loss calculation.'
        }
      },
      required: []
    },
    minRole: 'Owner',
    requiresConfirmation: false
  },

  // ==========================================
  // 2. INVENTORY & PRODUCTS (READ)
  // ==========================================
  {
    name: 'get_inventory_status',
    description: 'Provides inventory valuation, total SKU count, category distribution, and out-of-stock figures.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    minRole: 'Staff',
    requiresConfirmation: false
  },
  {
    name: 'get_low_stock_products',
    description: 'Identifies all inventory items currently at or below their configured minimum alert threshold.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of items to return (default: 10).'
        }
      },
      required: []
    },
    minRole: 'Staff',
    requiresConfirmation: false
  },
  {
    name: 'get_top_selling_products',
    description: 'Ranks products by total units sold and revenue generated during a given period.',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'this_week', 'this_month', 'all_time'],
          description: 'Time window for ranking.'
        },
        limit: {
          type: 'number',
          description: 'Number of top items to list (default: 5).'
        }
      },
      required: []
    },
    minRole: 'Staff',
    requiresConfirmation: false
  },
  {
    name: 'search_products',
    description: 'Search catalog by product name, category, SKU, or barcode.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term or barcode.'
        }
      },
      required: ['query']
    },
    minRole: 'Staff',
    requiresConfirmation: false
  },

  // ==========================================
  // 3. CUSTOMERS, UDHAAR & INVOICES (READ)
  // ==========================================
  {
    name: 'get_customer_balances',
    description: 'Lists customers with outstanding credit balances (Udhaar / Khata) and calculates total receivables.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max customers to list (default: 10).'
        }
      },
      required: []
    },
    minRole: 'Staff',
    requiresConfirmation: false
  },
  {
    name: 'get_pending_invoices',
    description: 'Fetches unpaid or overdue tax invoices with customer details, due dates, and amounts.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    minRole: 'Manager',
    requiresConfirmation: false
  },
  {
    name: 'get_purchase_history',
    description: 'Retrieves purchase orders from suppliers, restock spending, and supplier payments.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of records (default: 6).'
        }
      },
      required: []
    },
    minRole: 'Manager',
    requiresConfirmation: false
  },
  {
    name: 'get_business_activity',
    description: 'Recent chronological operational log: latest sales, expenses, and payments.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of recent activities (default: 8).'
        }
      },
      required: []
    },
    minRole: 'Staff',
    requiresConfirmation: false
  },

  // ==========================================
  // 4. BUSINESS PLANNING & INTELLIGENCE (ANALYSIS)
  // ==========================================
  {
    name: 'audit_business_health',
    description: 'Performs a comprehensive automated business audit: sales velocity, profit margins, expense ratios, stockout risks, and pending udhaar aging.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    minRole: 'Owner',
    requiresConfirmation: false
  },
  {
    name: 'prepare_restock_plan',
    description: 'Calculates recommended reorder quantities for low-stock items based on observed sales velocity.',
    parameters: {
      type: 'object',
      properties: {
        daysOfStockNeeded: {
          type: 'number',
          description: 'Target days of inventory coverage (default: 14 days).'
        }
      },
      required: []
    },
    minRole: 'Manager',
    requiresConfirmation: false
  },

  // ==========================================
  // 5. WRITE & DRAFT ACTIONS (WITH CONFIRMATION)
  // ==========================================
  {
    name: 'create_sale_draft',
    description: 'Prepares a draft sale with items, quantities, and customer details for POS billing. Shows review summary before confirmation.',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              price: { type: 'number' }
            },
            required: ['name', 'quantity']
          },
          description: 'List of items to add.'
        },
        paymentMethod: {
          type: 'string',
          enum: ['cash', 'upi', 'card', 'udhaar'],
          description: 'Intended payment tender.'
        },
        customerName: {
          type: 'string',
          description: 'Optional customer name.'
        }
      },
      required: ['items']
    },
    minRole: 'Staff',
    requiresConfirmation: true
  },
  {
    name: 'create_expense_draft',
    description: 'Prepares a draft business expense entry with category, amount, and payment method for user approval.',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Expense amount.' },
        category: { type: 'string', description: 'Category (e.g. Utilities, Supplies, Tea/Snacks, Rent).' },
        description: { type: 'string', description: 'Short note or reason.' },
        paymentMethod: { type: 'string', enum: ['cash', 'upi', 'bank_transfer', 'card'] }
      },
      required: ['amount', 'category']
    },
    minRole: 'Manager',
    requiresConfirmation: true
  },
  {
    name: 'update_stock',
    description: 'Adjusts inventory stock level for a product. Requires user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'ID or exact name of product.' },
        adjustment: { type: 'number', description: 'Quantity to add (positive) or deduct (negative).' },
        reason: { type: 'string', description: 'Reason for adjustment (e.g. Restock, Spoilage, Physical Audit).' }
      },
      required: ['productId', 'adjustment']
    },
    minRole: 'Manager',
    requiresConfirmation: true
  },
  {
    name: 'record_payment',
    description: 'Records a credit/udhaar settlement payment from a customer. Requires confirmation.',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'ID or exact customer name.' },
        amount: { type: 'number', description: 'Amount paid.' },
        paymentMethod: { type: 'string', enum: ['cash', 'upi', 'bank_transfer'] }
      },
      required: ['customerId', 'amount']
    },
    minRole: 'Manager',
    requiresConfirmation: true
  }
];

/**
 * Returns formatted tool declarations for LLM function calling (OpenAI / Gemini compatible)
 */
export function getRegisteredToolDeclarations() {
  return REGISTERED_TOOLS.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  }));
}

/**
 * Finds tool definition by name
 */
export function findToolDefinition(toolName) {
  return REGISTERED_TOOLS.find(t => t.name === toolName) || null;
}
