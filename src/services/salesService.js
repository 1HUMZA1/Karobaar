import { db } from './databaseService';

export const salesService = {
  async createSale({ items, customerId, employeeId, employeeName, paymentMethod, subtotal, tax, discount, total, amountPaid, balanceDue, dueDate, businessId }) {
    if (!businessId) throw new Error("businessId is required to create a sale");
    
    // Default values if not provided (e.g. legacy calls)
    const finalAmountPaid = amountPaid !== undefined ? amountPaid : total;
    const finalBalanceDue = balanceDue !== undefined ? balanceDue : 0;
    
    let status = 'Completed';
    if (finalBalanceDue > 0 && finalAmountPaid === 0) status = 'Unpaid';
    else if (finalBalanceDue > 0 && finalAmountPaid > 0) status = 'Partial';

    const sale = {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customerId,
      employeeId: employeeId || null,
      employeeName: employeeName || 'Admin',
      paymentMethod,
      subtotal,
      tax,
      discount,
      total,
      amountPaid: finalAmountPaid,
      balanceDue: finalBalanceDue,
      dueDate: dueDate || new Date().toISOString(),
      items,
      date: new Date().toISOString(),
      status
    };

    // 1. Save Sale
    const savedSale = await db.add('sales', sale, businessId);

    // 2. Update Inventory
    const products = await db.getCollection('products', businessId);
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const newQuantity = product.stockQuantity - item.quantity;
        await db.update('products', product.id, { 
          stockQuantity: Math.max(0, newQuantity)
        }, businessId);
      }
    }

    // 3. Update Customer History & Outstanding Balance
    if (customerId) {
      const customer = await db.getById('customers', customerId, businessId);
      if (customer) {
        await db.update('customers', customerId, {
          totalPurchases: (customer.totalPurchases || 0) + 1,
          totalSpending: (customer.totalSpending || 0) + total,
          outstandingBalance: (customer.outstandingBalance || 0) + finalBalanceDue,
          lastPurchase: new Date().toISOString()
        }, businessId);
      }
    }

    // 4. Create Invoice Record
    const invoice = {
      saleId: savedSale.id,
      invoiceNumber: sale.invoiceNumber,
      customerId,
      date: sale.date,
      dueDate: sale.dueDate,
      amount: total,
      amountPaid: finalAmountPaid,
      balanceDue: finalBalanceDue,
      status: finalBalanceDue > 0 ? 'Pending' : 'Paid',
      paymentMethod
    };
    await db.add('invoices', invoice, businessId);

    return savedSale;
  },
  
  async refundSale(saleId, businessId) {
    if (!businessId) throw new Error("businessId is required to refund a sale");
    
    const sale = await db.getById('sales', saleId, businessId);
    if (!sale) throw new Error("Sale not found");
    if (sale.status === 'Refunded') throw new Error("Sale is already refunded");

    // 1. Mark Sale as Refunded
    await db.update('sales', saleId, { status: 'Refunded' }, businessId);

    // 2. Restore Inventory
    const products = await db.getCollection('products', businessId);
    for (const item of sale.items || []) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const newQuantity = (product.stockQuantity || 0) + item.quantity;
        await db.update('products', product.id, { 
          stockQuantity: newQuantity
        }, businessId);
      }
    }

    // 3. Update Customer History
    if (sale.customerId) {
      const customer = await db.getById('customers', sale.customerId, businessId);
      if (customer) {
        await db.update('customers', sale.customerId, {
          totalPurchases: Math.max(0, (customer.totalPurchases || 0) - 1),
          totalSpending: Math.max(0, (customer.totalSpending || 0) - sale.total)
        }, businessId);
      }
    }

    // 4. Update Invoice Record
    const invoices = await db.getCollection('invoices', businessId);
    const invoice = invoices.find(inv => inv.saleId === saleId);
    if (invoice) {
      await db.update('invoices', invoice.id, { status: 'Refunded' }, businessId);
    }

    return true;
  }
};
