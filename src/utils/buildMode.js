/**
 * Build Mode Manager
 * In debug builds (desktop Flutter, local dev, website preview), bypass sign-in 
 * and take the user straight to the live dashboard.
 * Release mode (?release=true or karobaar_force_release_mode=true) preserves authentication.
 */

export const isReleaseBuild = () => {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';
    if (params.get('release') === 'true' || hash.includes('release=true')) return true;
    if (localStorage.getItem('karobaar_force_release_mode') === 'true') return true;
  } catch (_) {}
  return false;
};

export const isDebugBuild = () => {
  return !isReleaseBuild();
};

export const DEFAULT_DEBUG_USER = {
  id: 'user-sas-and-sons',
  uid: 'user-sas-and-sons',
  name: '1_HUMZA_1',
  displayName: '1_HUMZA_1',
  email: 'owner@sasandsons.com',
  phone: '+91 98765 43210',
  role: 'Owner',
  activeBusinessId: 'biz-sas-and-sons',
  memberships: ['biz-sas-and-sons'],
  onboardingCompleted: true,
  permissions: ['all']
};

export const DEFAULT_DEBUG_BUSINESS = {
  id: 'biz-sas-and-sons',
  name: 'SAS AND SONS',
  businessName: 'SAS AND SONS',
  category: 'Wholesale & Retail',
  type: 'Wholesale',
  ownerId: 'user-sas-and-sons',
  ownerName: '1_HUMZA_1',
  ownerEmail: 'owner@sasandsons.com',
  phone: '+91 98765 43210',
  address: 'Main Commercial Market',
  city: 'Main Branch',
  country: 'India',
  currency: 'INR',
  currencySymbol: '₹',
  isDemo: false,
  settings: {
    businessName: 'SAS AND SONS',
    category: 'Wholesale & Retail',
    type: 'Wholesale',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    theme: 'light',
    taxRate: 5,
    lowStockThreshold: 5,
    invoicePrefix: 'SAS-',
    paymentTerms: 'Immediate / Due on Receipt',
    invoiceFooter: 'Thank you for choosing SAS AND SONS!'
  },
  modules: {
    pos: true,
    sales: true,
    inventory: true,
    orders: true,
    customers: true,
    expenses: true,
    suppliers: true,
    reports: true,
    employees: true,
    invoices: true,
    purchases: true,
    attendance: true,
    payroll: true,
    tasks: true,
    branches: true,
    settings: true
  }
};
