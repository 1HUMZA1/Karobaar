import { db } from './databaseService';

export const salesService = {
  async createSale({ items, customerId, paymentMethod, subtotal, tax, discount, total, businessId }) {
    if (!businessId) throw new Error("businessId is required to create a sale");
    
    const sale = {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customerId,
      paymentMethod,
      subtotal,
      tax,
      discount,
      total,
      items,
      date: new Date().toISOString(),
      status: 'Completed'
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

    // 3. Update Customer History
    if (customerId) {
      const customer = await db.getById('customers', customerId, businessId);
      if (customer) {
        await db.update('customers', customerId, {
          totalPurchases: (customer.totalPurchases || 0) + 1,
          totalSpending: (customer.totalSpending || 0) + total,
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
      dueDate: sale.date, // Due immediately for POS
      amount: total,
      status: 'Paid',
      paymentMethod
    };
    await db.add('invoices', invoice, businessId);

    return savedSale;
  }
};
