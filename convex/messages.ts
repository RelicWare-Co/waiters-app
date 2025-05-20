import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

/* ------------------------------------------------------------------
   MENSAJES GLOBAL/CHAT
-------------------------------------------------------------------*/

// Avisos del administrador (restaurant_messages)
export const listRestaurantMessages = query({
  args: { restaurantId: v.id('restaurants') },
  handler: async (ctx, args) =>
    ctx.db
      .query('restaurant_messages')
      .withIndex('by_restaurant', (q) => q.eq('restaurantId', args.restaurantId))
      .order('desc')
      .collect(),
})

export const sendRestaurantMessage = mutation({
  args: {
    restaurantId: v.id('restaurants'),
    content: v.string(),
    targetWaiterId: v.optional(v.id('waiters')),
  },
  handler: async (ctx, args) => ctx.db.insert('restaurant_messages', args),
})

// Chat general y 1-a-1
export const listChat = query({
  args: { restaurantId: v.id('restaurants'), limit: v.number() },
  handler: async (ctx, args) =>
    ctx.db
      .query('chat_messages')
      .withIndex('by_restaurant', (q) => q.eq('restaurantId', args.restaurantId))
      .order('desc')
      .take(args.limit),
})

export const sendChatMessage = mutation({
  args: {
    restaurantId: v.id('restaurants'),
    fromWaiterId: v.id('waiters'),
    toWaiterId: v.optional(v.id('waiters')),
    content: v.string(),
  },
  handler: async (ctx, args) => ctx.db.insert('chat_messages', args),
})
