import { db } from './databaseService';
import { localDb } from './localDb';
import { subDays, subHours, formatISO } from 'date-fns';

export const DEMO_SHOWCASE_BUSINESS = {
  id: 'karobaar-demo-store',
  name: 'Karobaar Demo Store',
  businessName: 'Karobaar Demo Store',
  category: 'Retail & Superstore',
  currency: 'INR',
  address: 'Suite 404, Tech Park Boulevard',
  phone: '+91 98000 11223',
  isDemo: true,
  settings: {
    currency: 'INR',
    theme: 'light',
    taxRate: 5
  },
  modules: {
    pos: true,
    inventory: true,
    orders: true,
    customers: true,
    expenses: true,
    suppliers: true,
    reports: true,
    employees: true,
    invoices: true
  }
};

export const DEMO_SHOWCASE_USER = {
  id: 'karobaar-demo-user',
  name: 'Karobaar Demo User',
  email: 'demo@karobaar.app',
  role: 'Owner',
  activeBusinessId: 'karobaar-demo-store',
  memberships: ['karobaar-demo-store'],
  isDemo: true,
  onboardingCompleted: true
};

export const initializeDemoData = async (businessId = 'demo-business-1') => {
  // -------------------------------------------------------------
  // 1. Dedicated SHOWCASE DEMO WORKSPACE ('karobaar-demo-store')
  // -------------------------------------------------------------
  if (businessId === 'karobaar-demo-store') {
    localDb.save('businesses', 'karobaar-demo-store', DEMO_SHOWCASE_BUSINESS, false, 'karobaar-demo-store');
    localDb.save('users', 'karobaar-demo-user', DEMO_SHOWCASE_USER, false, 'karobaar-demo-store');

    const existingProducts = await db.getCollection('products', 'karobaar-demo-store');
    if (existingProducts.length > 0) return;

    console.log('[DemoData] Seeding vibrant showcase demo store...');

    // 16 Diverse Multi-Category Products
    const showcaseProducts = [
      {
        id: 'dp1', name: 'Crispy Truffle Chicken Burger', sku: 'BUR-001', barcode: '89001',
        category: 'Food', purchasePrice: 90, sellingPrice: 190, tax: 5, stockQuantity: 48, minimumStock: 10,
        status: 'Active', unit: 'pcs', description: 'Gourmet brioche bun with crispy chicken and truffle aioli'
      },
      {
        id: 'dp2', name: 'Peri-Peri Crinkle Fries', sku: 'FF-002', barcode: '89002',
        category: 'Food', purchasePrice: 40, sellingPrice: 110, tax: 5, stockQuantity: 65, minimumStock: 15,
        status: 'Active', unit: 'plate', description: 'Hand-cut seasoned crispy crinkle cut fries'
      },
      {
        id: 'dp3', name: 'Farmhouse Mozzarella Pizza', sku: 'PIZ-003', barcode: '89003',
        category: 'Food', purchasePrice: 110, sellingPrice: 240, tax: 5, stockQuantity: 28, minimumStock: 8,
        status: 'Active', unit: 'slice', description: 'Stone-baked thin crust pizza with fresh basil and mozzarella'
      },
      {
        id: 'dp4', name: 'Smoked Paneer Panini', sku: 'PAN-004', barcode: '89004',
        category: 'Food', purchasePrice: 75, sellingPrice: 160, tax: 5, stockQuantity: 34, minimumStock: 10,
        status: 'Active', unit: 'pcs', description: 'Grilled ciabatta with spiced cottage cheese and peppers'
      },
      {
        id: 'dp5', name: 'Belgian Dark Chocolate Waffle', sku: 'WAF-005', barcode: '89005',
        category: 'Desserts', purchasePrice: 55, sellingPrice: 135, tax: 5, stockQuantity: 2, minimumStock: 8,
        status: 'Active', unit: 'pcs', description: 'Freshly baked waffle with 70% dark Belgian chocolate' // LOW STOCK ALERT
      },
      {
        id: 'dp6', name: 'Butter Almond Croissant', sku: 'CRS-006', barcode: '89006',
        category: 'Desserts', purchasePrice: 42, sellingPrice: 95, tax: 5, stockQuantity: 24, minimumStock: 6,
        status: 'Active', unit: 'pcs', description: 'Flaky French layered pastry with roasted almond slivers'
      },
      {
        id: 'dp7', name: 'Iced Caramel Macchiato', sku: 'LAT-007', barcode: '89007',
        category: 'Drinks', purchasePrice: 45, sellingPrice: 145, tax: 5, stockQuantity: 60, minimumStock: 12,
        status: 'Active', unit: 'glass', description: 'Double espresso over chilled whole milk with vanilla & caramel'
      },
      {
        id: 'dp8', name: 'Cold Brew Arabica Can', sku: 'CBW-008', barcode: '89008',
        category: 'Drinks', purchasePrice: 50, sellingPrice: 125, tax: 5, stockQuantity: 3, minimumStock: 10,
        status: 'Active', unit: 'can', description: '18-hour steeped single-origin Ethiopian cold brew' // LOW STOCK ALERT
      },
      {
        id: 'dp9', name: 'Japanese Matcha Green Latte', sku: 'MTC-009', barcode: '89009',
        category: 'Drinks', purchasePrice: 65, sellingPrice: 175, tax: 5, stockQuantity: 36, minimumStock: 8,
        status: 'Active', unit: 'cup', description: 'Ceremonial grade Uji matcha with steamed oat milk'
      },
      {
        id: 'dp10', name: 'Double Shot Velvet Espresso', sku: 'ESP-010', barcode: '89010',
        category: 'Drinks', purchasePrice: 20, sellingPrice: 85, tax: 5, stockQuantity: 95, minimumStock: 15,
        status: 'Active', unit: 'shot', description: 'Intense nutty crema blend espresso'
      },
      {
        id: 'dp11', name: 'Cold Pressed Valencia Orange', sku: 'JUC-011', barcode: '89011',
        category: 'Drinks', purchasePrice: 38, sellingPrice: 95, tax: 5, stockQuantity: 42, minimumStock: 10,
        status: 'Active', unit: 'bottle', description: '100% pure cold pressed orange juice, no added sugar'
      },
      {
        id: 'dp12', name: 'Sparkling Mineral Spring Water', sku: 'WTR-012', barcode: '89012',
        category: 'Drinks', purchasePrice: 16, sellingPrice: 45, tax: 5, stockQuantity: 110, minimumStock: 20,
        status: 'Active', unit: 'bottle', description: 'Naturally carbonated spring water 500ml'
      },
      {
        id: 'dp13', name: 'Blueberry Swirl Cheesecake', sku: 'CHK-013', barcode: '89013',
        category: 'Desserts', purchasePrice: 85, sellingPrice: 195, tax: 5, stockQuantity: 18, minimumStock: 6,
        status: 'Active', unit: 'slice', description: 'Classic baked New York cheesecake with wild blueberry compote'
      },
      {
        id: 'dp14', name: 'Dark Walnut Fudge Brownie', sku: 'BRW-014', barcode: '89014',
        category: 'Desserts', purchasePrice: 48, sellingPrice: 120, tax: 5, stockQuantity: 32, minimumStock: 8,
        status: 'Active', unit: 'pcs', description: 'Rich gooey chocolate brownie with roasted walnuts'
      },
      {
        id: 'dp15', name: 'Hazelnut Glazed Donut', sku: 'DON-015', barcode: '89015',
        category: 'Desserts', purchasePrice: 32, sellingPrice: 80, tax: 5, stockQuantity: 28, minimumStock: 6,
        status: 'Active', unit: 'pcs', description: 'Soft ring donut covered in rich hazelnut praline'
      },
      {
        id: 'dp16', name: 'Kashmiri Saffron Kahwa Tea', sku: 'TEA-016', barcode: '89016',
        category: 'Drinks', purchasePrice: 28, sellingPrice: 75, tax: 5, stockQuantity: 50, minimumStock: 10,
        status: 'Active', unit: 'cup', description: 'Traditional green tea infused with saffron, cardamom and almonds'
      }
    ];
    await db.saveCollection('products', showcaseProducts, 'karobaar-demo-store');

    // Customers with Udhaar/Khata balance
    const showcaseCustomers = [
      {
        id: 'dc1', name: 'Walk-in Customer', phone: '+91 98000 00000', email: 'walkin@demo.local',
        totalPurchases: 45, totalSpending: 14200, outstandingBalance: 0
      },
      {
        id: 'dc2', name: 'Priya Patel', phone: '+91 97123 45678', email: 'priya.p@example.com',
        totalPurchases: 14, totalSpending: 18500, outstandingBalance: 1450 // Test Udhaar
      },
      {
        id: 'dc3', name: 'Rohan Sharma', phone: '+91 98234 56789', email: 'rohan.s@example.com',
        totalPurchases: 9, totalSpending: 9400, outstandingBalance: 0
      },
      {
        id: 'dc4', name: 'Apex Logistics Corp', phone: '+91 98888 11223', email: 'billing@apexlogistics.in',
        totalPurchases: 28, totalSpending: 52000, outstandingBalance: 0
      },
      {
        id: 'dc5', name: 'Sarah Jenkins', phone: '+91 98000 44556', email: 'sarah.j@example.com',
        totalPurchases: 7, totalSpending: 8100, outstandingBalance: 0
      },
      {
        id: 'dc6', name: 'Vikram Sethi', phone: '+91 98777 44332', email: 'vikram.sethi@example.com',
        totalPurchases: 5, totalSpending: 4900, outstandingBalance: 0
      }
    ];
    await db.saveCollection('customers', showcaseCustomers, 'karobaar-demo-store');

    // Suppliers
    const showcaseSuppliers = [
      {
        id: 'dsup1', company: 'Metro Farm Fresh & Dairy', name: 'Suresh Patil', email: 'suresh@metrofarm.in',
        phone: '+91 98111 22334', outstandingBalance: 3200, status: 'Active'
      },
      {
        id: 'dsup2', company: 'Royal Arabica Bean Roasters', name: 'Anita Verma', email: 'anita@royalbeans.in',
        phone: '+91 98222 33445', outstandingBalance: 0, status: 'Active'
      },
      {
        id: 'dsup3', company: 'EcoPack Container Logistics', name: 'Rajesh Nair', email: 'rajesh@ecopack.in',
        phone: '+91 98333 44556', outstandingBalance: 1250, status: 'Active'
      }
    ];
    await db.saveCollection('suppliers', showcaseSuppliers, 'karobaar-demo-store');

    // Employees
    const showcaseEmployees = [
      {
        id: 'de1', name: 'Aarav Mehta', role: 'Manager', department: 'Operations',
        email: 'manager@karobaar-demo.com', salary: 38000, status: 'Active'
      },
      {
        id: 'de2', name: 'Sneha Roy', role: 'Staff', department: 'Cashier & POS',
        email: 'cashier@karobaar-demo.com', salary: 22000, status: 'Active'
      },
      {
        id: 'de3', name: 'Devansh Gupta', role: 'Staff', department: 'Inventory & Stock',
        email: 'inventory@karobaar-demo.com', salary: 19000, status: 'Active'
      }
    ];
    await db.saveCollection('employees', showcaseEmployees, 'karobaar-demo-store');

    // Rich Sales Records (Realistic distribution: Today, Yesterday, and 7-day trend)
    const now = new Date();
    const showcaseSales = [
      // Today orders (Total ~ ₹48,250 across 12 orders)
      {
        id: 'DS-101', orderNumber: '#ORD-101', invoiceNumber: 'INV-DEMO-101', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subHours(now, 1)), total: 1840, paymentMethod: 'UPI', status: 'Completed',
        items: [
          { productId: 'dp1', name: 'Crispy Truffle Chicken Burger', quantity: 4, price: 190, costPrice: 90, total: 760 },
          { productId: 'dp2', name: 'Peri-Peri Crinkle Fries', quantity: 4, price: 110, costPrice: 40, total: 440 },
          { productId: 'dp7', name: 'Iced Caramel Macchiato', quantity: 4, price: 145, costPrice: 45, total: 580 },
          { productId: 'dp12', name: 'Sparkling Mineral Spring Water', quantity: 1, price: 45, costPrice: 16, total: 45 }
        ]
      },
      {
        id: 'DS-102', orderNumber: '#ORD-102', invoiceNumber: 'INV-DEMO-102', customerId: 'dc4', customerName: 'Apex Logistics Corp',
        date: formatISO(subHours(now, 2)), total: 8450, paymentMethod: 'UPI', status: 'Completed',
        items: [
          { productId: 'dp1', name: 'Crispy Truffle Chicken Burger', quantity: 15, price: 190, costPrice: 90, total: 2850 },
          { productId: 'dp3', name: 'Farmhouse Mozzarella Pizza', quantity: 15, price: 240, costPrice: 110, total: 3600 },
          { productId: 'dp7', name: 'Iced Caramel Macchiato', quantity: 10, price: 145, costPrice: 45, total: 1450 },
          { productId: 'dp14', name: 'Dark Walnut Fudge Brownie', quantity: 5, price: 120, costPrice: 48, total: 600 }
        ]
      },
      {
        id: 'DS-103', orderNumber: '#ORD-103', invoiceNumber: 'INV-DEMO-103', customerId: 'dc3', customerName: 'Rohan Sharma',
        date: formatISO(subHours(now, 3)), total: 2350, paymentMethod: 'Card', status: 'Completed',
        items: [
          { productId: 'dp3', name: 'Farmhouse Mozzarella Pizza', quantity: 4, price: 240, costPrice: 110, total: 960 },
          { productId: 'dp9', name: 'Japanese Matcha Green Latte', quantity: 4, price: 175, costPrice: 65, total: 700 },
          { productId: 'dp13', name: 'Blueberry Swirl Cheesecake', quantity: 3, price: 195, costPrice: 85, total: 585 }
        ]
      },
      {
        id: 'DS-104', orderNumber: '#ORD-104', invoiceNumber: 'INV-DEMO-104', customerId: 'dc2', customerName: 'Priya Patel',
        date: formatISO(subHours(now, 4)), total: 1450, paymentMethod: 'Udhaar', status: 'Pending', balanceDue: 1450,
        items: [
          { productId: 'dp1', name: 'Crispy Truffle Chicken Burger', quantity: 3, price: 190, costPrice: 90, total: 570 },
          { productId: 'dp4', name: 'Smoked Paneer Panini', quantity: 3, price: 160, costPrice: 75, total: 480 },
          { productId: 'dp8', name: 'Cold Brew Arabica Can', quantity: 2, price: 125, costPrice: 50, total: 250 },
          { productId: 'dp6', name: 'Butter Almond Croissant', quantity: 1, price: 95, costPrice: 42, total: 95 }
        ]
      },
      {
        id: 'DS-105', orderNumber: '#ORD-105', invoiceNumber: 'INV-DEMO-105', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subHours(now, 5)), total: 3250, paymentMethod: 'Cash', status: 'Completed',
        items: [
          { productId: 'dp4', name: 'Smoked Paneer Panini', quantity: 5, price: 160, costPrice: 75, total: 800 },
          { productId: 'dp2', name: 'Peri-Peri Crinkle Fries', quantity: 6, price: 110, costPrice: 40, total: 660 },
          { productId: 'dp11', name: 'Cold Pressed Valencia Orange', quantity: 8, price: 95, costPrice: 38, total: 760 },
          { productId: 'dp15', name: 'Hazelnut Glazed Donut', quantity: 12, price: 80, costPrice: 32, total: 960 }
        ]
      },
      {
        id: 'DS-106', orderNumber: '#ORD-106', invoiceNumber: 'INV-DEMO-106', customerId: 'dc5', customerName: 'Sarah Jenkins',
        date: formatISO(subHours(now, 6)), total: 5400, paymentMethod: 'Card', status: 'Completed',
        items: [
          { productId: 'dp3', name: 'Farmhouse Mozzarella Pizza', quantity: 10, price: 240, costPrice: 110, total: 2400 },
          { productId: 'dp1', name: 'Crispy Truffle Chicken Burger', quantity: 8, price: 190, costPrice: 90, total: 1520 },
          { productId: 'dp7', name: 'Iced Caramel Macchiato', quantity: 8, price: 145, costPrice: 45, total: 1160 }
        ]
      },
      {
        id: 'DS-107', orderNumber: '#ORD-107', invoiceNumber: 'INV-DEMO-107', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subHours(now, 7)), total: 980, paymentMethod: 'Cash', status: 'Completed',
        items: [
          { productId: 'dp1', name: 'Crispy Truffle Chicken Burger', quantity: 2, price: 190, costPrice: 90, total: 380 },
          { productId: 'dp2', name: 'Peri-Peri Crinkle Fries', quantity: 2, price: 110, costPrice: 40, total: 220 },
          { productId: 'dp7', name: 'Iced Caramel Macchiato', quantity: 2, price: 145, costPrice: 45, total: 290 }
        ]
      },
      {
        id: 'DS-108', orderNumber: '#ORD-108', invoiceNumber: 'INV-DEMO-108', customerId: 'dc6', customerName: 'Vikram Sethi',
        date: formatISO(subHours(now, 8)), total: 4900, paymentMethod: 'UPI', status: 'Completed',
        items: [
          { productId: 'dp3', name: 'Farmhouse Mozzarella Pizza', quantity: 8, price: 240, costPrice: 110, total: 1920 },
          { productId: 'dp4', name: 'Smoked Paneer Panini', quantity: 8, price: 160, costPrice: 75, total: 1280 },
          { productId: 'dp13', name: 'Blueberry Swirl Cheesecake', quantity: 6, price: 195, costPrice: 85, total: 1170 },
          { productId: 'dp10', name: 'Double Shot Velvet Espresso', quantity: 5, price: 85, costPrice: 20, total: 425 }
        ]
      },
      {
        id: 'DS-109', orderNumber: '#ORD-109', invoiceNumber: 'INV-DEMO-109', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subHours(now, 9)), total: 6800, paymentMethod: 'UPI', status: 'Completed',
        items: [
          { productId: 'dp1', name: 'Crispy Truffle Chicken Burger', quantity: 12, price: 190, costPrice: 90, total: 2280 },
          { productId: 'dp3', name: 'Farmhouse Mozzarella Pizza', quantity: 10, price: 240, costPrice: 110, total: 2400 },
          { productId: 'dp7', name: 'Iced Caramel Macchiato', quantity: 12, price: 145, costPrice: 45, total: 1740 }
        ]
      },
      {
        id: 'DS-110', orderNumber: '#ORD-110', invoiceNumber: 'INV-DEMO-110', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subHours(now, 10)), total: 3950, paymentMethod: 'Cash', status: 'Completed',
        items: [
          { productId: 'dp2', name: 'Peri-Peri Crinkle Fries', quantity: 10, price: 110, costPrice: 40, total: 1100 },
          { productId: 'dp4', name: 'Smoked Paneer Panini', quantity: 10, price: 160, costPrice: 75, total: 1600 },
          { productId: 'dp14', name: 'Dark Walnut Fudge Brownie', quantity: 8, price: 120, costPrice: 48, total: 960 }
        ]
      },
      {
        id: 'DS-111', orderNumber: '#ORD-111', invoiceNumber: 'INV-DEMO-111', customerId: 'dc4', customerName: 'Apex Logistics Corp',
        date: formatISO(subHours(now, 11)), total: 5430, paymentMethod: 'UPI', status: 'Completed',
        items: [
          { productId: 'dp1', name: 'Crispy Truffle Chicken Burger', quantity: 10, price: 190, costPrice: 90, total: 1900 },
          { productId: 'dp7', name: 'Iced Caramel Macchiato', quantity: 10, price: 145, costPrice: 45, total: 1450 },
          { productId: 'dp3', name: 'Farmhouse Mozzarella Pizza', quantity: 8, price: 240, costPrice: 110, total: 1920 }
        ]
      },
      {
        id: 'DS-112', orderNumber: '#ORD-112', invoiceNumber: 'INV-DEMO-112', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subHours(now, 12)), total: 3200, paymentMethod: 'Card', status: 'Completed',
        items: [
          { productId: 'dp6', name: 'Butter Almond Croissant', quantity: 10, price: 95, costPrice: 42, total: 950 },
          { productId: 'dp9', name: 'Japanese Matcha Green Latte', quantity: 8, price: 175, costPrice: 65, total: 1400 },
          { productId: 'dp15', name: 'Hazelnut Glazed Donut', quantity: 8, price: 80, costPrice: 32, total: 640 }
        ]
      },

      // Yesterday orders (~₹38,400 across 6 orders)
      {
        id: 'DS-201', orderNumber: '#ORD-201', invoiceNumber: 'INV-DEMO-201', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subDays(now, 1)), total: 9200, paymentMethod: 'UPI', status: 'Completed',
        items: [{ productId: 'dp1', name: 'Crispy Truffle Chicken Burger', quantity: 20, price: 190, costPrice: 90, total: 3800 }]
      },
      {
        id: 'DS-202', orderNumber: '#ORD-202', invoiceNumber: 'INV-DEMO-202', customerId: 'dc4', customerName: 'Apex Logistics Corp',
        date: formatISO(subDays(now, 1)), total: 11500, paymentMethod: 'UPI', status: 'Completed',
        items: [{ productId: 'dp3', name: 'Farmhouse Mozzarella Pizza', quantity: 25, price: 240, costPrice: 110, total: 6000 }]
      },
      {
        id: 'DS-203', orderNumber: '#ORD-203', invoiceNumber: 'INV-DEMO-203', customerId: 'dc3', customerName: 'Rohan Sharma',
        date: formatISO(subDays(now, 1)), total: 6400, paymentMethod: 'Card', status: 'Completed',
        items: [{ productId: 'dp4', name: 'Smoked Paneer Panini', quantity: 20, price: 160, costPrice: 75, total: 3200 }]
      },
      {
        id: 'DS-204', orderNumber: '#ORD-204', invoiceNumber: 'INV-DEMO-204', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subDays(now, 1)), total: 4800, paymentMethod: 'Cash', status: 'Completed',
        items: [{ productId: 'dp2', name: 'Peri-Peri Crinkle Fries', quantity: 20, price: 110, costPrice: 40, total: 2200 }]
      },
      {
        id: 'DS-205', orderNumber: '#ORD-205', invoiceNumber: 'INV-DEMO-205', customerId: 'dc5', customerName: 'Sarah Jenkins',
        date: formatISO(subDays(now, 1)), total: 6500, paymentMethod: 'Card', status: 'Completed',
        items: [{ productId: 'dp7', name: 'Iced Caramel Macchiato', quantity: 25, price: 145, costPrice: 45, total: 3625 }]
      },

      // Past 5 Days Trend Data
      {
        id: 'DS-301', orderNumber: '#ORD-301', invoiceNumber: 'INV-DEMO-301', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subDays(now, 2)), total: 32400, paymentMethod: 'UPI', status: 'Completed',
        items: [{ productId: 'dp1', name: 'Crispy Truffle Chicken Burger', quantity: 60, price: 190, costPrice: 90, total: 11400 }]
      },
      {
        id: 'DS-401', orderNumber: '#ORD-401', invoiceNumber: 'INV-DEMO-401', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subDays(now, 3)), total: 29800, paymentMethod: 'Card', status: 'Completed',
        items: [{ productId: 'dp3', name: 'Farmhouse Mozzarella Pizza', quantity: 50, price: 240, costPrice: 110, total: 12000 }]
      },
      {
        id: 'DS-501', orderNumber: '#ORD-501', invoiceNumber: 'INV-DEMO-501', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subDays(now, 4)), total: 41200, paymentMethod: 'UPI', status: 'Completed',
        items: [{ productId: 'dp1', name: 'Crispy Truffle Chicken Burger', quantity: 80, price: 190, costPrice: 90, total: 15200 }]
      },
      {
        id: 'DS-601', orderNumber: '#ORD-601', invoiceNumber: 'INV-DEMO-601', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subDays(now, 5)), total: 36700, paymentMethod: 'Cash', status: 'Completed',
        items: [{ productId: 'dp4', name: 'Smoked Paneer Panini', quantity: 70, price: 160, costPrice: 75, total: 11200 }]
      },
      {
        id: 'DS-701', orderNumber: '#ORD-701', invoiceNumber: 'INV-DEMO-701', customerId: 'dc1', customerName: 'Walk-in Customer',
        date: formatISO(subDays(now, 6)), total: 45100, paymentMethod: 'UPI', status: 'Completed',
        items: [{ productId: 'dp3', name: 'Farmhouse Mozzarella Pizza', quantity: 85, price: 240, costPrice: 110, total: 20400 }]
      }
    ];
    await db.saveCollection('sales', showcaseSales, 'karobaar-demo-store');

    // Showcase Expenses
    const showcaseExpenses = [
      {
        id: 'dex1', description: 'Fresh Farm Dairy & Whole Milk Delivery', category: 'Supplies',
        amount: 3400, date: formatISO(now), paymentMethod: 'Cash', note: 'Daily dairy supply batch #440'
      },
      {
        id: 'dex2', description: 'Organic Bakery Flour & Pizza Yeast Import', category: 'Supplies',
        amount: 2800, date: formatISO(now), paymentMethod: 'UPI', note: 'Bakery raw ingredients delivery'
      },
      {
        id: 'dex3', description: 'Eco-Friendly Takeout Containers & Cups', category: 'Packaging',
        amount: 1650, date: formatISO(now), paymentMethod: 'Card', note: 'Biodegradable meal boxes'
      },
      {
        id: 'dex4', description: 'Store Central HVAC & Power Utility', category: 'Electricity',
        amount: 2550, date: formatISO(now), paymentMethod: 'Bank Transfer', note: 'Operational electricity'
      },
      {
        id: 'dex5', description: 'Premium Arabica Coffee Bean Roast Restock', category: 'Supplies',
        amount: 5400, date: formatISO(subDays(now, 2)), paymentMethod: 'Bank Transfer', note: 'Single-origin 25kg bag'
      },
      {
        id: 'dex6', description: 'High-Speed Fiber Business Internet', category: 'Utilities',
        amount: 1800, date: formatISO(subDays(now, 4)), paymentMethod: 'UPI', note: 'Monthly gigabit broadband'
      }
    ];
    await db.saveCollection('expenses', showcaseExpenses, 'karobaar-demo-store');

    console.log('[DemoData] Showcase demo store initialized successfully with 16 products & 18 orders.');
    return;
  }

  // -------------------------------------------------------------
  // 2. Real / Local Business Fallback ('demo-business-1')
  // -------------------------------------------------------------
  const existingBiz = localDb.get('businesses', businessId);
  if (!existingBiz) {
    const demoBusinessDoc = {
      id: businessId,
      name: 'My Store',
      currency: 'INR',
      category: 'General Store & Services',
      address: '',
      phone: '',
      settings: {
        currency: 'INR',
        theme: 'light',
        taxRate: 5
      },
      modules: {
        pos: true,
        inventory: true,
        orders: true,
        customers: true,
        expenses: true,
        suppliers: true,
        reports: true,
        employees: true,
        invoices: true
      }
    };
    localDb.save('businesses', businessId, demoBusinessDoc, false, businessId);
  }

  const existingUser = localDb.get('users', 'demo-user-1');
  if (!existingUser) {
    const demoUserDoc = {
      id: 'demo-user-1',
      name: 'Store Owner',
      email: 'owner@karobaar.app',
      role: 'Owner',
      activeBusinessId: businessId,
      memberships: [businessId],
      onboardingCompleted: true
    };
    localDb.save('users', 'demo-user-1', demoUserDoc, false, businessId);
  }

  const products = await db.getCollection('products', businessId);
  if (products.length === 0) {
    console.log('Initializing Karobaar sample store data for:', businessId);
    
    const demoProducts = [
      {
        id: 'p1', name: 'Burger', sku: 'BUR-001', barcode: '8901234001',
        category: 'Food', purchasePrice: 45, sellingPrice: 80,
        tax: 5, stockQuantity: 45, minimumStock: 10, status: 'Active',
        unit: 'pcs', description: 'Classic grilled patty burger with lettuce & house sauce'
      },
      {
        id: 'p2', name: 'French Fries', sku: 'FF-002', barcode: '8901234002',
        category: 'Food', purchasePrice: 25, sellingPrice: 50,
        tax: 5, stockQuantity: 60, minimumStock: 15, status: 'Active',
        unit: 'plate', description: 'Crispy golden salted potato fries'
      },
      {
        id: 'p3', name: 'Cold Coffee', sku: 'CC-003', barcode: '8901234003',
        category: 'Drinks', purchasePrice: 35, sellingPrice: 70,
        tax: 5, stockQuantity: 35, minimumStock: 8, status: 'Active',
        unit: 'glass', description: 'Rich blended iced coffee with chocolate drizzle'
      },
      {
        id: 'p4', name: 'Chocolate Donut', sku: 'DON-004', barcode: '8901234004',
        category: 'Food', purchasePrice: 30, sellingPrice: 60,
        tax: 5, stockQuantity: 25, minimumStock: 5, status: 'Active',
        unit: 'pcs', description: 'Glazed ring donut with Belgian chocolate frosting'
      },
      {
        id: 'p5', name: 'Brownie', sku: 'BRW-005', barcode: '8901234005',
        category: 'Food', purchasePrice: 28, sellingPrice: 55,
        tax: 5, stockQuantity: 30, minimumStock: 6, status: 'Active',
        unit: 'pcs', description: 'Warm fudgy walnut brownie'
      },
      {
        id: 'p6', name: 'Ice Cream', sku: 'IC-006', barcode: '8901234006',
        category: 'Drinks', purchasePrice: 12, sellingPrice: 25,
        tax: 5, stockQuantity: 40, minimumStock: 10, status: 'Active',
        unit: 'scoop', description: 'Creamy vanilla scoop with waffle crisp'
      },
      {
        id: 'p7', name: 'Popcorn', sku: 'POP-007', barcode: '8901234007',
        category: 'Food', purchasePrice: 15, sellingPrice: 40,
        tax: 5, stockQuantity: 50, minimumStock: 10, status: 'Active',
        unit: 'tub', description: 'Freshly popped butter popcorn'
      }
    ];
    await db.saveCollection('products', demoProducts, businessId);

    const demoCustomers = [
      {
        id: 'c1', name: 'Walk-in Customer', phone: '+91 98765 43210', email: 'walkin@customer.local',
        totalPurchases: 12, totalSpending: 3840, outstandingBalance: 0
      },
      {
        id: 'c2', name: 'Rahul Sharma', phone: '+91 98234 56789', email: 'rahul.s@example.com',
        totalPurchases: 4, totalSpending: 1250, outstandingBalance: 120
      },
      {
        id: 'c3', name: 'Ayesha Khan', phone: '+91 97123 45678', email: 'ayesha.k@example.com',
        totalPurchases: 6, totalSpending: 2100, outstandingBalance: 0
      }
    ];
    await db.saveCollection('customers', demoCustomers, businessId);

    const demoEmployees = [
      {
        id: 'e1', name: 'Store Manager', role: 'Manager', department: 'Management',
        email: 'manager@karobaar.app', salary: 35000, status: 'Active'
      },
      {
        id: 'e2', name: 'Cashier Staff', role: 'Staff', department: 'Counter',
        email: 'counter@karobaar.app', salary: 18000, status: 'Active'
      }
    ];
    await db.saveCollection('employees', demoEmployees, businessId);

    const today = new Date();
    const demoSales = [
      {
        id: 'ORD001', orderNumber: '#ORD001', invoiceNumber: 'INV-1001', customerId: 'c1', customerName: 'Walk-in Customer',
        date: formatISO(today), total: 480, paymentMethod: 'UPI', status: 'Completed',
        items: [
          { productId: 'p1', name: 'Burger', quantity: 3, price: 80, total: 240 },
          { productId: 'p3', name: 'Cold Coffee', quantity: 2, price: 70, total: 140 },
          { productId: 'p2', name: 'French Fries', quantity: 2, price: 50, total: 100 }
        ]
      },
      {
        id: 'ORD002', orderNumber: '#ORD002', invoiceNumber: 'INV-1002', customerId: 'c1', customerName: 'Walk-in Customer',
        date: formatISO(subDays(today, 1)), total: 360, paymentMethod: 'Cash', status: 'Completed',
        items: [
          { productId: 'p1', name: 'Burger', quantity: 2, price: 80, total: 160 },
          { productId: 'p3', name: 'Cold Coffee', quantity: 2, price: 70, total: 140 },
          { productId: 'p4', name: 'Chocolate Donut', quantity: 1, price: 60, total: 60 }
        ]
      },
      {
        id: 'ORD003', orderNumber: '#ORD003', invoiceNumber: 'INV-1003', customerId: 'c2', customerName: 'Rahul Sharma',
        date: formatISO(subDays(today, 2)), total: 620, paymentMethod: 'Card', status: 'Completed',
        items: [
          { productId: 'p1', name: 'Burger', quantity: 4, price: 80, total: 320 },
          { productId: 'p2', name: 'French Fries', quantity: 3, price: 50, total: 150 },
          { productId: 'p5', name: 'Brownie', quantity: 2, price: 55, total: 110 },
          { productId: 'p7', name: 'Popcorn', quantity: 1, price: 40, total: 40 }
        ]
      }
    ];
    await db.saveCollection('sales', demoSales, businessId);

    const demoExpenses = [
      {
        id: 'ex1', description: 'Store Electricity Bill', category: 'Electricity',
        amount: 3200, date: formatISO(subDays(today, 2)), paymentMethod: 'UPI', note: 'Monthly electricity charges'
      },
      {
        id: 'ex2', description: 'Store Showroom Monthly Rent', category: 'Rent',
        amount: 15000, date: formatISO(subDays(today, 5)), paymentMethod: 'Bank Transfer', note: 'Shop premise lease'
      },
      {
        id: 'ex3', description: 'Bakery & Milk Supplies', category: 'Supplies',
        amount: 4500, date: formatISO(today), paymentMethod: 'Cash', note: 'Dairy and fresh bread buns'
      }
    ];
    await db.saveCollection('expenses', demoExpenses, businessId);

    const demoSuppliers = [
      {
        id: 'sup1', company: 'Metro Dairy & Bakery', name: 'Suresh Patil', email: 'suresh@metrobakery.in',
        phone: '+91 98111 22334', outstandingBalance: 2400, status: 'Active'
      },
      {
        id: 'sup2', company: 'Everfresh Beverages', name: 'Anita Verma', email: 'anita@everfresh.in',
        phone: '+91 98222 33445', outstandingBalance: 0, status: 'Active'
      }
    ];
    await db.saveCollection('suppliers', demoSuppliers, businessId);
  }
};

/**
 * Resets the demo showcase workspace back to its fresh state.
 */
export const resetDemoWorkspace = async () => {
  const businessId = 'karobaar-demo-store';
  const collections = ['products', 'customers', 'sales', 'expenses', 'suppliers', 'employees', 'orders'];
  
  // Clear existing demo records from localDb
  collections.forEach(col => {
    if (localDb.db[col]) {
      Object.keys(localDb.db[col]).forEach(key => {
        const item = localDb.db[col][key];
        if (item?.businessId === businessId || item?._businessId === businessId) {
          delete localDb.db[col][key];
        }
      });
    }
  });
  localDb.persist();

  // Re-seed freshly
  await initializeDemoData(businessId);
};
