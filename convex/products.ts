import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

// Devuelve todos los productos de un restaurante
export const listByRestaurant = query({
  args: { restaurantId: v.id('restaurants') },
  handler: async (ctx, args) =>
    ctx.db
      .query('products')
      .withIndex('by_restaurant', (q) => q.eq('restaurantId', args.restaurantId))
      .collect(),
})

// Devuelve solamente los productos disponibles de un restaurante
export const listAvailable = query({
  args: { restaurantId: v.id('restaurants') },
  handler: async (ctx, args) =>
    ctx.db
      .query('products')
      .withIndex('by_restaurant_available', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('isAvailable', true)
      )
      .collect(),
})

// Devuelve solamente los productos NO disponibles de un restaurante
export const listUnavailableByRestaurant = query({
  args: { restaurantId: v.id('restaurants') },
  handler: async (ctx, args) =>
    ctx.db
      .query('products')
      .withIndex('by_restaurant_available', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('isAvailable', false)
      )
      .collect(),
})

// Obtiene un único producto por id
export const get = query({
  args: { id: v.id('products') },
  handler: async (ctx, args) => ctx.db.get(args.id),
})

// Crea un nuevo producto
export const create = mutation({
  args: {
    restaurantId: v.id('restaurants'),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    isAvailable: v.boolean(),
  },
  handler: async (ctx, args) => ctx.db.insert('products', args),
})

// Actualiza la disponibilidad de un producto
export const setAvailability = mutation({
  args: { id: v.id('products'), isAvailable: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isAvailable: args.isAvailable })
  },
})

// Establece todos los productos de un restaurante como disponibles
export const setAllAvailableByRestaurant = mutation({
  args: { restaurantId: v.id('restaurants') },
  handler: async (ctx, args) => {
    const productsToUpdate = await ctx.db
      .query('products')
      .withIndex('by_restaurant', (q) => q.eq('restaurantId', args.restaurantId))
      // Optionally, could filter for isAvailable: false here, but the goal is to set ALL to true.
      // .filter((q) => q.eq(q.field('isAvailable'), false))
      .collect();

    const updatePromises = productsToUpdate.map((product) =>
      ctx.db.patch(product._id, { isAvailable: true })
    );

    await Promise.all(updatePromises);
    return { updatedCount: productsToUpdate.length };
  },
})

// Actualiza los detalles de un producto (nombre, descripción, precio)
export const update = mutation({
  args: {
    id: v.id('products'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    // isAvailable is handled by setAvailability to keep mutations focused
  },
  handler: async (ctx, { id, ...rest }) => {
    // Ensure that an empty description updates to null or undefined if schema expects optional
    const dataToPatch = { ...rest };
    if (rest.description === '') {
      dataToPatch.description = undefined; // Or null, depending on schema preference for empty optional strings
    }
    await ctx.db.patch(id, dataToPatch);
  },
})

// Elimina un producto
export const deleteProduct = mutation({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
})
