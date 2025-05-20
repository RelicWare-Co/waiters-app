import { query } from './_generated/server'
import { v } from 'convex/values'

// Helper function to get the start of today in UTC milliseconds
function getStartOfTodayUTC(): number {
  const now = new Date()
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return startOfToday.getTime()
}

export const getAdminDashboardKpis = query({
  args: { restaurantId: v.id('restaurants') },
  handler: async (ctx, args) => {
    const startOfToday = getStartOfTodayUTC()

    // 1. Get 'closed' orders from today for sales calculation
    const todaysClosedOrders = await ctx.db
      .query('orders')
      .withIndex('by_restaurant_status', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('status', 'closed')
      )
      .filter((q) => q.gte(q.field('_creationTime'), startOfToday))
      .collect()

    let dailySales = 0
    for (const order of todaysClosedOrders) {
      dailySales += order.total
    }

    const countTodaysClosedOrders = todaysClosedOrders.length

    // 2. Get 'open' orders for open tables count
    const openOrders = await ctx.db
      .query('orders')
      .withIndex('by_restaurant_status', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('status', 'open')
      )
      .collect()

    const openTablesCount = openOrders.length

    return {
      dailySales,
      countTodaysClosedOrders,
      openTablesCount,
    }
  },
})

export const getAdminDashboardAlerts = query({
  args: { restaurantId: v.id('restaurants') },
  handler: async (ctx, args) => {
    // 1. Get products out of stock
    const outOfStockProducts = await ctx.db
      .query('products')
      .withIndex('by_restaurant_available', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('isAvailable', false)
      )
      .collect()

    // 2. Get failed payments from today
    const startOfToday = getStartOfTodayUTC() // Re-use helper from KPI query

    const recentFailedPayments = await ctx.db
      .query('payments')
      .withIndex('by_restaurant_status', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('status', 'failed')
      )
      .filter((q) => q.gte(q.field('_creationTime'), startOfToday))
      .collect()

    return {
      outOfStockProducts,
      recentFailedPayments,
    }
  },
})
