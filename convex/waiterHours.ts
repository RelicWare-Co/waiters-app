import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

// Turnos de un mesero
export const listByWaiter = query({
  args: { waiterId: v.id('waiters') },
  handler: async (ctx, args) =>
    ctx.db
      .query('waiter_hours')
      .withIndex('by_waiter', (q) => q.eq('waiterId', args.waiterId))
      .collect(),
})

// Copiar turno a todos los días (utilidad para horario restaurante)
export const copyToWeek = mutation({
  args: {
    waiterId: v.id('waiters'),
    start: v.string(),
    end: v.string(),
  },
  handler: async (ctx, args) => {
    for (let day = 0; day < 7; day++) {
      await ctx.db.insert('waiter_hours', {
        waiterId: args.waiterId,
        dayOfWeek: day,
        start: args.start,
        end: args.end,
      })
    }
  },
})
