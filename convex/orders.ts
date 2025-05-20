import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

/* ------------------------------------------------------------------
   QUERIES
-------------------------------------------------------------------*/

// Pedidos abiertos asignados a un mesero
export const listOpenByWaiter = query({
  args: { waiterId: v.id('waiters') },
  handler: async (ctx, args) =>
    ctx.db
      .query('orders')
      .withIndex('by_waiter', (q) => q.eq('waiterId', args.waiterId))
      .filter((q) => q.eq(q.field('status'), 'open'))
      .collect(),
})

// Detalle completo de una orden (items y pagos)
export const details = query({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) return null

    const items = await ctx.db
      .query('order_items')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .collect()

    const payments = await ctx.db
      .query('payments')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .collect()

    return { order, items, payments }
  },
})

// KPIs diarios para el dashboard del administrador
export const kpiDaily = query({
  args: { restaurantId: v.id('restaurants'), dateISO: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const dateISO = args.dateISO ?? new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const start = new Date(`${dateISO}T00:00:00`).getTime()
    const end = new Date(`${dateISO}T23:59:59.999`).getTime()

    const closed = await ctx.db
      .query('orders')
      .withIndex('by_restaurant_status', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('status', 'closed')
      )
      .collect()

    const todaysClosed = closed.filter(
      (o) => o._creationTime >= start && o._creationTime <= end,
    )

    const totalSales = todaysClosed.reduce((s, o) => s + o.total, 0)
    const averageTicket =
      todaysClosed.length > 0 ? totalSales / todaysClosed.length : 0

    const openOrders = await ctx.db
      .query('orders')
      .withIndex('by_restaurant_status', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('status', 'open')
      )
      .collect()

    return {
      totalSales,
      averageTicket,
      openTables: openOrders.length,
    }
  },
})

/* ------------------------------------------------------------------
   MUTATIONS
-------------------------------------------------------------------*/

// Crea una orden junto con sus items
export const createWithItems = mutation({
  args: {
    restaurantId: v.id('restaurants'),
    waiterId: v.id('waiters'),
    tableNumber: v.string(),
    items: v.array(
      v.object({
        productId: v.id('products'),
        quantity: v.number(),
        price: v.number(),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const total = args.items.reduce(
      (sum, i) => sum + i.quantity * i.price,
      0,
    )

    const orderId = await ctx.db.insert('orders', {
      restaurantId: args.restaurantId,
      waiterId: args.waiterId,
      tableNumber: args.tableNumber,
      status: 'open',
      total,
    })

    for (const item of args.items) {
      await ctx.db.insert('order_items', {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
      })
    }

    return orderId
  },
})

// Nueva mutación para cerrar una orden después de verificar pagos
export const closeOrder = mutation({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    if (order.status !== 'open') {
      throw new Error(`Order status is '${order.status}', cannot close.`);
    }

    // Fetch all 'completed' payments for this order
    const orderPayments = await ctx.db
      .query('payments')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .filter((q) => q.eq(q.field('status'), 'completed'))
      .collect();

    const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid < order.total) {
      throw new Error(
        `Cannot close order. Total paid ($${totalPaid.toFixed(2)}) is less than order total ($${order.total.toFixed(2)}).`
      );
    }

    // Optionally, handle overpayment here (e.g., record as tip, or require exact payment)
    // For now, we allow closing if paid amount is >= total

    await ctx.db.patch(args.orderId, { status: 'closed' });

    return { success: true, message: 'Order closed successfully.' };
  },
})
