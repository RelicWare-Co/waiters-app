import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const listByRestaurant = query({
  args: { restaurantId: v.id('restaurants') },
  handler: async (ctx, args) =>
    ctx.db
      .query('waiters')
      .withIndex('by_restaurant', (q) => q.eq('restaurantId', args.restaurantId))
      .collect(),
})

export const get = query({
  args: { id: v.id('waiters') },
  handler: async (ctx, args) => ctx.db.get(args.id),
})

export const create = mutation({
  args: {
    restaurantId: v.id('restaurants'),
    name: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => ctx.db.insert('waiters', args),
})
