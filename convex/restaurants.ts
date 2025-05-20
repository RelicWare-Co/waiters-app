import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

// Lista todos los restaurantes
export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query('restaurants').collect(),
})

// Obtiene un restaurante por id
export const get = query({
  args: { id: v.id('restaurants') },
  handler: async (ctx, args) => ctx.db.get(args.id),
})

// Crea un nuevo restaurante
export const create = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    paymentMethods: v.array(v.string()),
  },
  handler: async (ctx, args) => ctx.db.insert('restaurants', args),
})
