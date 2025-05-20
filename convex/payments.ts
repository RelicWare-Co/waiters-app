import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Add a payment to an order
export const add = mutation({
  args: {
    orderId: v.id('orders'),
    method: v.string(),
    amount: v.number(),
    status: v.union(
        v.literal('pending'),
        v.literal('completed'),
        v.literal('failed')
    ),
    transactionId: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found.');
    }
    if (order.status === 'closed' || order.status === 'cancelled') {
        throw new Error(`Order is ${order.status} and cannot accept new payments.`);
    }
    if (args.amount <= 0) {
        throw new Error('Payment amount must be positive.');
    }

    // Potentially check if payment amount exceeds amount due
    // const payments = await listByOrder(ctx, { orderId: args.orderId });
    // const paidAmount = payments.reduce((sum, p) => p.status === 'completed' ? sum + p.amount : sum, 0);
    // if (paidAmount + args.amount > order.total && args.status === 'completed') {
    //   console.warn('Payment exceeds total amount due. Adjusting or flagging.');
    //   // Depending on policy, either error, adjust, or allow overpayment for tips etc.
    // }

    const paymentId = await ctx.db.insert('payments', {
      orderId: args.orderId,
      method: args.method,
      amount: args.amount,
      status: args.status,
      transactionId: args.transactionId,
      notes: args.notes,
    });

    // Optionally, if a payment is 'completed', one might re-evaluate order status
    // or trigger notifications, but closing an order should be an explicit step.

    return { paymentId };
  },
});

// List payments for a specific order
export const listByOrder = query({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payments')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .collect();
  },
});
