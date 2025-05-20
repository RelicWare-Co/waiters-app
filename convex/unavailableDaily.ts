import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

// Lista de productos marcados como no disponibles en una fecha dada
export const listByRestaurantDate = query({
  args: {
    restaurantId: v.id('restaurants'),
    dateISO: v.optional(v.string()), // YYYY-MM-DD; default hoy
  },
  handler: async (ctx, args) => {
    const dateISO = args.dateISO ?? new Date().toISOString().slice(0, 10)
    return ctx.db
      .query('unavailable_daily')
      .withIndex('by_restaurant_date', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('dateISO', dateISO),
      )
      .collect()
  },
})

// Marca un producto como no disponible para hoy
export const markUnavailable = mutation({
  args: {
    restaurantId: v.id('restaurants'),
    productId: v.id('products'),
    dateISO: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dateISO = args.dateISO ?? new Date().toISOString().slice(0, 10)
    // evita duplicados
    const existing = await ctx.db
      .query('unavailable_daily')
      .withIndex('by_restaurant_date', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('dateISO', dateISO),
      )
      .filter((q) => q.eq(q.field('productId'), args.productId))
      .first()
    if (!existing) {
      await ctx.db.insert('unavailable_daily', {
        restaurantId: args.restaurantId,
        productId: args.productId,
        dateISO,
      })
    }
  },
})

// Restablece todos los productos (elimina registros del día)
export const resetToday = mutation({
  args: { restaurantId: v.id('restaurants') },
  handler: async (ctx, args) => {
    const dateISO = new Date().toISOString().slice(0, 10)
    const todays = await ctx.db
      .query('unavailable_daily')
      .withIndex('by_restaurant_date', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('dateISO', dateISO),
      )
      .collect()
    for (const d of todays) {
      await ctx.db.delete(d._id)
    }
  },
})
