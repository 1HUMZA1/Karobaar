import { db } from './databaseService';
import { subDays, formatISO } from 'date-fns';

export const initializeDemoData = async () => {
  const products = await db.getCollection('products');
  
  if (products.length === 0) {
    console.log('Initializing demo data...');
    
    // 1. Products
    const demoProducts = [
      {
        id: 'p1', name: 'iPhone 15 Pro', sku: 'IP15P-256-BLK', barcode: '8801234567890',
        category: 'Electronics', brand: 'Apple', purchasePrice: 850, sellingPrice: 999,
        tax: 10, stockQuantity: 45, minimumStock: 10, status: 'Active'
      },
      {
        id: 'p2', name: 'MacBook Air M2', sku: 'MBA-M2-512-SLV', barcode: '8801234567891',
        category: 'Computers', brand: 'Apple', purchasePrice: 1000, sellingPrice: 1199,
        tax: 10, stockQuantity: 15, minimumStock: 5, status: 'Active'
      },
      {
        id: 'p3', name: 'Samsung Galaxy S23', sku: 'SGS23-256-PH', barcode: '8801234567892',
        category: 'Electronics', brand: 'Samsung', purchasePrice: 650, sellingPrice: 799,
        tax: 10, stockQuantity: 8, minimumStock: 10, status: 'Active' // Low stock
      }
    ];
    await db.saveCollection('products', demoProducts);

    // 2. Customers
    const demoCustomers = [
      {
        id: 'c1', name: 'Alice Smith', phone: '+1 234 567 8900', email: 'alice@example.com',
        totalPurchases: 2, totalSpending: 1998, outstandingBalance: 0
      },
      {
        id: 'c2', name: 'Bob Johnson', phone: '+1 987 654 3210', email: 'bob@example.com',
        totalPurchases: 1, totalSpending: 799, outstandingBalance: 200
      }
    ];
    await db.saveCollection('customers', demoCustomers);

    // 3. Employees
    const demoEmployees = [
      {
        id: 'e1', name: 'Admin User', role: 'Admin', department: 'Management',
        email: 'admin@ebusiness.com', salary: 8000, status: 'Active'
      },
      {
        id: 'e2', name: 'John Doe', role: 'Salesperson', department: 'Sales',
        email: 'john@ebusiness.com', salary: 4000, status: 'Active'
      }
    ];
    await db.saveCollection('employees', demoEmployees);

    // 4. Sales & Orders
    const today = new Date();
    const demoSales = [
      {
        id: 's1', invoiceNumber: 'INV-1001', customerId: 'c1', 
        date: formatISO(today), total: 999, paymentMethod: 'Card', status: 'Completed',
        items: [{ productId: 'p1', quantity: 1, price: 999 }]
      },
      {
        id: 's2', invoiceNumber: 'INV-1002', customerId: 'c2', 
        date: formatISO(subDays(today, 1)), total: 799, paymentMethod: 'Credit', status: 'Pending',
        items: [{ productId: 'p3', quantity: 1, price: 799 }]
      }
    ];
    await db.saveCollection('sales', demoSales);

    // 5. Expenses
    const demoExpenses = [
      {
        id: 'ex1', description: 'Monthly Rent', category: 'Rent',
        amount: 2500, date: formatISO(subDays(today, 5)), paymentMethod: 'Bank Transfer'
      },
      {
        id: 'ex2', description: 'Electricity Bill', category: 'Electricity',
        amount: 350, date: formatISO(subDays(today, 2)), paymentMethod: 'Card'
      },
      {
        id: 'ex3', description: 'Facebook Ads', category: 'Marketing',
        amount: 500, date: formatISO(today), paymentMethod: 'Credit Card'
      }
    ];
    await db.saveCollection('expenses', demoExpenses);

    // 6. Suppliers
    const demoSuppliers = [
      {
        id: 'sup1', company: 'TechSource Inc', name: 'David Lee', email: 'david@techsource.com',
        phone: '+1 555 019 8372', outstandingBalance: 1500, status: 'Active'
      },
      {
        id: 'sup2', company: 'Global Parts', name: 'Sarah Chen', email: 'sarah@globalparts.com',
        phone: '+1 555 928 3746', outstandingBalance: 0, status: 'Active'
      }
    ];
    await db.saveCollection('suppliers', demoSuppliers);

    // 7. Purchases
    const demoPurchases = [
      {
        id: 'po1', poNumber: 'PO-2023-001', supplierId: 'sup1', supplierName: 'TechSource Inc',
        date: formatISO(subDays(today, 3)), total: 3500, status: 'Pending',
        items: [{ productId: 'p1', quantity: 10, purchasePrice: 850 }]
      },
      {
        id: 'po2', poNumber: 'PO-2023-002', supplierId: 'sup2', supplierName: 'Global Parts',
        date: formatISO(subDays(today, 10)), total: 1200, status: 'Received',
        items: [{ productId: 'p2', quantity: 2, purchasePrice: 1000 }]
      }
    ];
    await db.saveCollection('purchases', demoPurchases);

    // 8. Leave Requests
    const demoLeave = [
      {
        id: 'l1', employeeId: 'e2', employeeName: 'John Doe', type: 'Sick Leave',
        startDate: formatISO(today), endDate: formatISO(addDays(today, 2)),
        days: 2, reason: 'Flu', status: 'Pending'
      },
      {
        id: 'l2', employeeId: 'e1', employeeName: 'Admin User', type: 'Annual Leave',
        startDate: formatISO(subDays(today, 10)), endDate: formatISO(subDays(today, 5)),
        days: 5, reason: 'Vacation', status: 'Approved'
      }
    ];
    await db.saveCollection('leave', demoLeave);

    console.log('Demo data initialized successfully.');
  }
};
