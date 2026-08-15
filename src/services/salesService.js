import { db } from './databaseService';

export const salesService = {
  async createSale({ items, customerId, paymentMethod, subtotal, tax, discount, total }) {
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
    const savedSale = await db.add('sales', sale);

    // 2. Update Inventory
    const products = await db.getCollection('products');
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const newQuantity = product.stockQuantity - item.quantity;
        await db.update('products', product.id, { 
          stockQuantity: Math.max(0, newQuantity)
        });
      }
    }

    // 3. Update Customer History
    if (customerId) {
      const customer = await db.getById('customers', customerId);
      if (customer) {
        await db.update('customers', customerId, {
          totalPurchases: (customer.totalPurchases || 0) + 1,
          totalSpending: (customer.totalSpending || 0) + total,
          lastPurchase: new Date().toISOString()
        });
      }
    }

    return savedSale;
  }
};
