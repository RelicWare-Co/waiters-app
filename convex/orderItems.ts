import { mutation } from './_generated/server';
import { query } from './_generated/server';
import { v } from 'convex/values';
import type { Id, Doc } from './_generated/dataModel';

// Helper function to recalculate and update order total
async function updateOrderTotal(ctx: any, orderId: Id<'orders'>) {
  const items = await ctx.db
    .query('order_items')
    .withIndex('by_order', (q: any) => q.eq('orderId', orderId))
    .collect();
  
  const newTotal = items.reduce((sum: number, item: Doc<'order_items'>) => sum + item.price * item.quantity, 0);
  
  await ctx.db.patch(orderId, { total: newTotal });
  return newTotal;
}

// Add an item to an order
export const addItem = mutation({
  args: {
    orderId: v.id('orders'),
    productId: v.id('products'),
    quantity: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order || order.status !== 'open') {
      throw new Error('Order not found or is not open.');
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error('Product not found.');
    }
    if (!product.isAvailable) {
      throw new Error(`Product '${product.name}' is currently unavailable.`);
    }

    const newItemId = await ctx.db.insert('order_items', {
      orderId: args.orderId,
      productId: args.productId,
      productName: product.name, // Denormalizing product name for easier display
      quantity: args.quantity,
      price: product.price, // Price at the time of adding
      notes: args.notes,
    });

    const updatedTotal = await updateOrderTotal(ctx, args.orderId);
    return { newItemId, updatedTotal };
  },
});

// Update an existing order item
export const updateItem = mutation({
  args: {
    orderItemId: v.id('order_items'),
    quantity: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { orderItemId, quantity, notes } = args;
    const item = await ctx.db.get(orderItemId);
    if (!item) {
      throw new Error('Order item not found.');
    }

    const order = await ctx.db.get(item.orderId);
    if (!order || order.status !== 'open') {
      throw new Error('Order is not open for modifications.');
    }

    const updates: Partial<Doc<'order_items'>> = {};
    if (quantity !== undefined) {
      if (quantity <= 0) {
        // If quantity is zero or less, effectively remove the item
        await ctx.db.delete(orderItemId);
      } else {
        updates.quantity = quantity;
      }
    }
    if (notes !== undefined) {
      updates.notes = notes;
    }

    if (Object.keys(updates).length > 0 && updates.quantity !== 0) {
      await ctx.db.patch(orderItemId, updates);
    }
    
    const updatedTotal = await updateOrderTotal(ctx, item.orderId);
    return { updatedTotal };
  },
});

// Remove an item from an order
export const removeItem = mutation({
  args: { orderItemId: v.id('order_items') },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.orderItemId);
    if (!item) {
      throw new Error('Order item not found.');
    }

    const order = await ctx.db.get(item.orderId);
    if (!order || order.status !== 'open') {
      throw new Error('Order is not open for modifications.');
    }

    await ctx.db.delete(args.orderItemId);
    const updatedTotal = await updateOrderTotal(ctx, item.orderId);
    return { updatedTotal };
  },
});

// Helper to get items for an order (could be in orders.ts too)
export const listByOrder = query({
    args: { orderId: v.id('orders') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('order_items')
            .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
            .collect();
    }
});
