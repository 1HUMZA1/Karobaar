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
        email: 'admin@bizflow.com', salary: 8000, status: 'Active'
      },
      {
        id: 'e2', name: 'John Doe', role: 'Salesperson', department: 'Sales',
        email: 'john@bizflow.com', salary: 4000, status: 'Active'
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

    // 5. Analytics snapshot (for dashboard)
    // In a real app this is calculated on the fly, but we'll mock some historical data
    
    console.log('Demo data initialized successfully.');
  }
};
