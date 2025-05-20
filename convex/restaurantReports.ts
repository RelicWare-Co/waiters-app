import { query } from './_generated/server'
import { v } from 'convex/values'

// Reporte de ventas agrupadas
export const salesByWaiter = query({
  args: {
    restaurantId: v.id('restaurants'),
    startISO: v.string(),
    endISO: v.string(),
  },
  handler: async (ctx, args) => {
    const start = new Date(args.startISO).getTime()
    const end = new Date(args.endISO).getTime()

    const orders = await ctx.db
      .query('orders')
      .withIndex('by_restaurant_status', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('status', 'closed'),
      )
      .collect()

    const filtered = orders.filter(
      (o) => o._creationTime >= start && o._creationTime <= end,
    )

    const map: Record<string, { total: number; orders: number }> = {}
    for (const o of filtered) {
      const key = o.waiterId.toString()
      map[key] = map[key] || { total: 0, orders: 0 }
      map[key].total += o.total
      map[key].orders += 1
    }
    return map
  },
})
