import { db } from './databaseService';
import { localDb } from './localDb';
import { subDays, formatISO } from 'date-fns';

export const initializeDemoData = async (businessId = 'demo-business-1') => {
  // Ensure business entity exists in localDb
  const existingBiz = localDb.get('businesses', businessId);
  if (!existingBiz) {
    const demoBusinessDoc = {
      id: businessId,
      name: 'SAS CAFETERIA',
      currency: 'INR',
      category: 'Cafeteria & Restaurant',
      address: '123 Commercial Plaza, Main Street',
      phone: '+91 98765 00000',
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

  // Ensure user entity exists in localDb
  const existingUser = localDb.get('users', 'demo-user-1');
  if (!existingUser) {
    const demoUserDoc = {
      id: 'demo-user-1',
      name: 'SAS Cafeteria Owner',
      email: 'owner@sascafeteria.com',
      role: 'Owner',
      activeBusinessId: businessId,
      memberships: [businessId],
      onboardingCompleted: true
    };
    localDb.save('users', 'demo-user-1', demoUserDoc, false, businessId);
  }

  const products = await db.getCollection('products', businessId);
  
  if (products.length === 0) {
    console.log('Initializing Karobaar demo data for:', businessId);
    
    // 1. Food & Beverage Products matching Karobaar design specification
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

    // 2. Customers
    const demoCustomers = [
      {
        id: 'c1', name: 'Walk-in Customer', phone: '+91 98765 43210', email: 'walkin@sas.local',
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

    // 3. Employees
    const demoEmployees = [
      {
        id: 'e1', name: 'Store Manager', role: 'Manager', department: 'Management',
        email: 'manager@sascafeteria.com', salary: 35000, status: 'Active'
      },
      {
        id: 'e2', name: 'Cashier Staff', role: 'Staff', department: 'Counter',
        email: 'counter@sascafeteria.com', salary: 18000, status: 'Active'
      }
    ];
    await db.saveCollection('employees', demoEmployees, businessId);

    // 4. Sales & Orders matching Screen 5 mockups
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
      },
      {
        id: 'ORD004', orderNumber: '#ORD004', invoiceNumber: 'INV-1004', customerId: 'c1', customerName: 'Walk-in Customer',
        date: formatISO(subDays(today, 3)), total: 275, paymentMethod: 'UPI', status: 'Completed',
        items: [
          { productId: 'p5', name: 'Brownie', quantity: 3, price: 55, total: 165 },
          { productId: 'p3', name: 'Cold Coffee', quantity: 1, price: 70, total: 70 },
          { productId: 'p7', name: 'Popcorn', quantity: 1, price: 40, total: 40 }
        ]
      }
    ];
    await db.saveCollection('sales', demoSales, businessId);

    // 5. Expenses matching Screen 8
    const demoExpenses = [
      {
        id: 'ex1', description: 'Store Electricity Bill', category: 'Electricity',
        amount: 3200, date: formatISO(subDays(today, 2)), paymentMethod: 'UPI', note: 'Monthly electricity charges'
      },
      {
        id: 'ex2', description: 'Cafeteria Monthly Rent', category: 'Rent',
        amount: 15000, date: formatISO(subDays(today, 5)), paymentMethod: 'Bank Transfer', note: 'Shop premise lease'
      },
      {
        id: 'ex3', description: 'Bakery & Milk Supplies', category: 'Supplies',
        amount: 4500, date: formatISO(today), paymentMethod: 'Cash', note: 'Dairy and fresh bread buns'
      }
    ];
    await db.saveCollection('expenses', demoExpenses, businessId);

    // 6. Suppliers
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

    console.log('Demo data initialized successfully with SAS CAFETERIA profile.');
  }
};
