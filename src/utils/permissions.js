/**
 * Karobaar — Permissions & Role-Based Access Control (RBAC) System
 * Inspired by Vyapar's enterprise team architecture.
 * Pure monochrome, robust, granular, and fail-safe.
 */

// 1. Canonical Permission Keys
export const PERMISSIONS = {
  // Sales & POS
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_EDIT: 'sales.edit',
  SALES_CANCEL: 'sales.cancel',
  
  // Invoices & Billing
  INVOICES_VIEW: 'invoices.view',
  INVOICES_CREATE: 'invoices.create',
  
  // Khata & Payments
  PAYMENTS_RECORD: 'payments.record',
  PAYMENTS_VIEW: 'payments.view',
  
  // Products & Catalog
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  
  // Inventory & Stock Adjustments
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
  PURCHASES_MANAGE: 'purchases.manage',
  
  // Expenses & Petty Cash
  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_APPROVE: 'expenses.approve',
  
  // Reports & Financial Analytics
  REPORTS_VIEW: 'reports.view',
  REPORTS_PROFIT_VIEW: 'reports.profit.view',
  
  // Customer & CRM
  CUSTOMERS_MANAGE: 'customers.manage',
  SUPPLIERS_MANAGE: 'suppliers.manage',
  
  // HR & Attendance
  ATTENDANCE_MANAGE: 'attendance.manage',
  EMPLOYEES_MANAGE: 'employees.manage',
  PAYROLL_MANAGE: 'payroll.manage',
  
  // Team & Workspace Admin
  TEAM_VIEW: 'team.view',
  TEAM_INVITE: 'team.invite',
  TEAM_MANAGE: 'team.manage',
  SETTINGS_MANAGE: 'settings.manage',
  BUSINESS_TRANSFER: 'business.transfer_ownership',
  BUSINESS_DELETE: 'business.delete'
};

// 2. Canonical Predefined Roles
export const ROLES = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  INVENTORY: 'Inventory Staff',
  ACCOUNTANT: 'Accountant',
  CUSTOM: 'Custom'
};

// 3. Permission Definitions with Grouping, Labels & Descriptions
export const PERMISSION_GROUPS = [
  {
    groupId: 'sales_pos',
    groupName: 'Sales, POS & Billing',
    permissions: [
      { key: PERMISSIONS.SALES_VIEW, label: 'View Sales & Orders', description: 'Can view past sales orders and daily transactions' },
      { key: PERMISSIONS.SALES_CREATE, label: 'Create New Sale (POS)', description: 'Can bill customers and open POS register' },
      { key: PERMISSIONS.SALES_EDIT, label: 'Edit Completed Orders', description: 'Can modify order details and prices' },
      { key: PERMISSIONS.SALES_CANCEL, label: 'Cancel or Refund Sales', description: 'Can void orders or issue customer refunds' },
      { key: PERMISSIONS.INVOICES_VIEW, label: 'View Tax Invoices', description: 'Can view and print customer tax invoices' },
      { key: PERMISSIONS.INVOICES_CREATE, label: 'Generate Invoices', description: 'Can draft, finalize and issue tax invoices' },
      { key: PERMISSIONS.PAYMENTS_RECORD, label: 'Record Khata Payments', description: 'Can accept cash, UPI, or card payments on customer balances' }
    ]
  },
  {
    groupId: 'inventory_catalog',
    groupName: 'Products & Inventory',
    permissions: [
      { key: PERMISSIONS.PRODUCTS_VIEW, label: 'View Products & Stock', description: 'Can browse inventory catalog and selling prices' },
      { key: PERMISSIONS.PRODUCTS_CREATE, label: 'Add New Products', description: 'Can register new products, barcodes and prices' },
      { key: PERMISSIONS.PRODUCTS_EDIT, label: 'Edit Product Details', description: 'Can edit names, categories, and purchase costs' },
      { key: PERMISSIONS.PRODUCTS_DELETE, label: 'Delete Products', description: 'Can permanently remove products from catalog' },
      { key: PERMISSIONS.INVENTORY_VIEW, label: 'View Stock Ledger', description: 'Can inspect stock movements and low-stock alerts' },
      { key: PERMISSIONS.INVENTORY_ADJUST, label: 'Adjust Stock & Reconciliation', description: 'Can perform physical stock audits and manual adjustments' },
      { key: PERMISSIONS.PURCHASES_MANAGE, label: 'Supplier Purchases', description: 'Can record purchase invoices and stock inward' }
    ]
  },
  {
    groupId: 'finance_reports',
    groupName: 'Finance, Expenses & Reports',
    permissions: [
      { key: PERMISSIONS.EXPENSES_VIEW, label: 'View Expenses', description: 'Can view petty cash outlays and supplier bills' },
      { key: PERMISSIONS.EXPENSES_CREATE, label: 'Record Expenses', description: 'Can log business expenses and attach receipts' },
      { key: PERMISSIONS.EXPENSES_APPROVE, label: 'Approve Expenses', description: 'Can authorize staff expense claims' },
      { key: PERMISSIONS.REPORTS_VIEW, label: 'View General Reports', description: 'Can view sales volume, inventory counts, and customer lists' },
      { key: PERMISSIONS.REPORTS_PROFIT_VIEW, label: 'View Profit & Loss (P&L)', description: 'Can view gross profit, net profit margins, and COGS' }
    ]
  },
  {
    groupId: 'customers_hr',
    groupName: 'Customers & Team Attendance',
    permissions: [
      { key: PERMISSIONS.CUSTOMERS_MANAGE, label: 'Manage Customers & Udhaar', description: 'Can add, edit, and set credit limits for customers' },
      { key: PERMISSIONS.SUPPLIERS_MANAGE, label: 'Manage Suppliers Directory', description: 'Can maintain vendor contracts and contact details' },
      { key: PERMISSIONS.ATTENDANCE_MANAGE, label: 'Clock-in & Attendance', description: 'Can log daily attendance and clock in/out' },
      { key: PERMISSIONS.EMPLOYEES_MANAGE, label: 'Manage Staff Records', description: 'Can view and edit employee profiles and roles' },
      { key: PERMISSIONS.PAYROLL_MANAGE, label: 'Manage Payroll & Wages', description: 'Can view staff salaries and disburse payroll' }
    ]
  },
  {
    groupId: 'administration',
    groupName: 'Business Administration & Security',
    permissions: [
      { key: PERMISSIONS.TEAM_VIEW, label: 'View Team Members', description: 'Can see list of team members and assigned roles' },
      { key: PERMISSIONS.TEAM_INVITE, label: 'Invite New Members', description: 'Can generate invite links and add staff' },
      { key: PERMISSIONS.TEAM_MANAGE, label: 'Manage Team & Permissions', description: 'Can modify permissions, suspend or remove members' },
      { key: PERMISSIONS.SETTINGS_MANAGE, label: 'Manage Business Settings', description: 'Can edit tax rates, invoices format, and store info' },
      { key: PERMISSIONS.BUSINESS_TRANSFER, label: 'Transfer Business Ownership', description: 'Can hand over primary ownership to another verified member' },
      { key: PERMISSIONS.BUSINESS_DELETE, label: 'Delete Business', description: 'Permanent deletion of business and all data' }
    ]
  }
];

// All flat permissions list
export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));

// 4. Default Permission Sets per Role
export const ROLE_PERMISSIONS_MAP = {
  [ROLES.OWNER]: ALL_PERMISSIONS,

  [ROLES.MANAGER]: [
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_EDIT,
    PERMISSIONS.SALES_CANCEL,
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.PAYMENTS_RECORD,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.PURCHASES_MANAGE,
    PERMISSIONS.EXPENSES_VIEW,
    PERMISSIONS.EXPENSES_CREATE,
    PERMISSIONS.EXPENSES_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_PROFIT_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.SUPPLIERS_MANAGE,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.EMPLOYEES_MANAGE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_INVITE,
    PERMISSIONS.SETTINGS_MANAGE
    // NO BUSINESS_TRANSFER, NO BUSINESS_DELETE, NO TEAM_MANAGE (cannot revoke owner)
  ],

  [ROLES.CASHIER]: [
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.PAYMENTS_RECORD,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.ATTENDANCE_MANAGE
    // Restricted: No P&L, No Expenses, No Inventory Adjustment, No Team Admin
  ],

  [ROLES.INVENTORY]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.PURCHASES_MANAGE,
    PERMISSIONS.SUPPLIERS_MANAGE,
    PERMISSIONS.ATTENDANCE_MANAGE
    // Restricted: No Sales, No Invoices, No Financial reports
  ],

  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.PAYMENTS_RECORD,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.EXPENSES_VIEW,
    PERMISSIONS.EXPENSES_CREATE,
    PERMISSIONS.EXPENSES_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_PROFIT_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.SUPPLIERS_MANAGE,
    PERMISSIONS.PAYROLL_MANAGE,
    PERMISSIONS.ATTENDANCE_MANAGE
    // Restricted: No POS checkout, No stock adjustments, No Team Admin
  ],

  [ROLES.CUSTOM]: []
};

// 5. Normalizer & Permission Checking Utility
export const normalizeRole = (role) => {
  if (!role) return ROLES.CASHIER;
  const lower = String(role).trim().toLowerCase();
  if (lower === 'owner' || lower === 'admin') return ROLES.OWNER;
  if (lower === 'manager' || lower === 'supervisor') return ROLES.MANAGER;
  if (lower === 'cashier' || lower === 'sales' || lower === 'staff') return ROLES.CASHIER;
  if (lower.includes('inventory') || lower.includes('warehouse')) return ROLES.INVENTORY;
  if (lower.includes('accountant') || lower.includes('finance')) return ROLES.ACCOUNTANT;
  if (lower === 'custom') return ROLES.CUSTOM;
  return role;
};

/**
 * Check if a user possesses a specific permission.
 * Fails safely if user or role is invalid.
 *
 * @param {string|object} userOrRole - Current user object or role string
 * @param {string} permissionKey - Key from PERMISSIONS
 * @param {Array<string>} [customPermissions] - Optional explicit custom permissions array
 * @returns {boolean}
 */
export const hasPermission = (userOrRole, permissionKey, customPermissions = null) => {
  if (!permissionKey) return true;

  let role = 'Owner';
  let userCustomPerms = customPermissions;

  if (typeof userOrRole === 'object' && userOrRole !== null) {
    role = userOrRole.role || 'Owner';
    if (!userCustomPerms && Array.isArray(userOrRole.permissions)) {
      userCustomPerms = userOrRole.permissions;
    }
  } else if (typeof userOrRole === 'string') {
    role = userOrRole;
  }

  const normalized = normalizeRole(role);

  // Owner always has 100% unrestricted access
  if (normalized === ROLES.OWNER) {
    return true;
  }

  // If custom permissions array is provided, evaluate that first
  if (Array.isArray(userCustomPerms) && userCustomPerms.length > 0) {
    return userCustomPerms.includes(permissionKey);
  }

  // Fallback to role-based default permissions map
  const rolePerms = ROLE_PERMISSIONS_MAP[normalized] || [];
  return rolePerms.includes(permissionKey);
};

// 6. Role UI Metadata & Badges (Strict Monochrome Palette)
export const ROLE_METADATA = {
  [ROLES.OWNER]: {
    label: 'Owner',
    tag: 'FULL ACCESS',
    description: 'Complete unrestricted control over finances, members, settings, and business records.',
    badgeClass: 'bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-[10px] px-2 py-0.5 rounded'
  },
  [ROLES.MANAGER]: {
    label: 'Manager',
    tag: 'OPERATIONAL',
    description: 'Can manage daily sales, stock, expenses, reports, and staff invites. Cannot delete business or transfer ownership.',
    badgeClass: 'border border-black dark:border-white font-mono font-bold text-[10px] px-2 py-0.5 rounded text-black dark:text-white'
  },
  [ROLES.CASHIER]: {
    label: 'Cashier',
    tag: 'POS TERMINAL',
    description: 'Restricted to creating sales, printing invoices, and accepting customer khata payments.',
    badgeClass: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono font-medium text-[10px] px-2 py-0.5 rounded'
  },
  [ROLES.INVENTORY]: {
    label: 'Inventory Staff',
    tag: 'STOCK OPS',
    description: 'Restricted to catalog management, stock count reconciliation, and supplier purchases.',
    badgeClass: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono font-medium text-[10px] px-2 py-0.5 rounded'
  },
  [ROLES.ACCOUNTANT]: {
    label: 'Accountant',
    tag: 'FINANCE & P&L',
    description: 'Restricted to ledger books, expenses, tax invoices, and full Profit & Loss analytics.',
    badgeClass: 'border border-zinc-400 dark:border-zinc-600 font-mono text-[10px] px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300'
  },
  [ROLES.CUSTOM]: {
    label: 'Custom Role',
    tag: 'GRANULAR',
    description: 'Explicit granular access configured specifically for this team member.',
    badgeClass: 'border border-dashed border-zinc-500 font-mono text-[10px] px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300'
  }
};
