import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

// Devuelve todos los horarios de un restaurante, ordenados por día de la semana
export const listByRestaurant = query({
  args: { restaurantId: v.id('restaurants') },
  handler: async (ctx, args) => {
    const hours = await ctx.db
      .query('restaurant_hours')
      .withIndex('by_restaurant_day', (q) => q.eq('restaurantId', args.restaurantId))
      // .order('asc') // by_restaurant_day index already sorts by dayOfWeek implicitly after restaurantId
      .collect();

    // Ensure all 7 days are represented, filling in defaults if necessary
    // This could also be handled on the frontend, but doing it here ensures consistency.
    const days = [0, 1, 2, 3, 4, 5, 6]; // Sun-Sat
    const fullWeekHours = days.map(day => {
      const existing = hours.find(h => h.dayOfWeek === day);
      if (existing) return existing;
      // Return a default "closed" state if no entry exists
      // The schema has open/close as non-optional. For "closed", use empty strings or specific placeholder.
      // For now, let's assume frontend will interpret absence or specific values as closed.
      // To make it explicit, the schema could be updated to allow optional open/close or an isOpen flag.
      // Here, we create a default structure for missing days if frontend expects an entry for each day.
      return {
        _id: `${args.restaurantId}-day-${day}` as any, // Temporary ID for non-DB entries
        _creationTime: Date.now(), // Temporary creation time
        restaurantId: args.restaurantId,
        dayOfWeek: day,
        open: "", // Represent closed or unconfigured
        close: "", // Represent closed or unconfigured
      };
    });
    return fullWeekHours;
  },
});

// Actualiza (o crea si no existe) el horario para un día específico
export const updateHours = mutation({
  args: {
    restaurantId: v.id('restaurants'),
    dayOfWeek: v.number(), // 0-6
    open: v.string(),      // "HH:MM"
    close: v.string(),     // "HH:MM"
  },
  handler: async (ctx, args) => {
    const existingEntry = await ctx.db
      .query('restaurant_hours')
      .withIndex('by_restaurant_day', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('dayOfWeek', args.dayOfWeek)
      )
      .unique();

    if (existingEntry) {
      // Update existing entry
      await ctx.db.patch(existingEntry._id, {
        open: args.open,
        close: args.close,
      });
      return existingEntry._id;
    } else {
      // Create new entry
      // Note: The 'create' mutation already exists, but this provides upsert logic directly.
      return await ctx.db.insert('restaurant_hours', {
        restaurantId: args.restaurantId,
        dayOfWeek: args.dayOfWeek,
        open: args.open,
        close: args.close,
      });
    }
  },
});

// Copia el horario de un día fuente a todos los días de la semana para un restaurante
export const copyHoursToWeek = mutation({
  args: {
    restaurantId: v.id('restaurants'),
    sourceDayOfWeek: v.number(), // 0-6, el día del cual copiar
  },
  handler: async (ctx, args) => {
    const sourceHoursEntry = await ctx.db
      .query('restaurant_hours')
      .withIndex('by_restaurant_day', (q) =>
        q.eq('restaurantId', args.restaurantId).eq('dayOfWeek', args.sourceDayOfWeek)
      )
      .unique();

    if (!sourceHoursEntry) {
      // Or, if sourceDay has no entry, it could mean "copy closed status to all days"
      // For now, let's throw an error if the source day isn't configured.
      // Alternatively, could default to open:"", close:"" if source not found.
      throw new Error(`Source day (${args.sourceDayOfWeek}) hours not found for restaurant ${args.restaurantId}.`);
    }

    const { open, close } = sourceHoursEntry;
    const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
    let updatedCount = 0;

    for (const day of daysOfWeek) {
      const existingEntry = await ctx.db
        .query('restaurant_hours')
        .withIndex('by_restaurant_day', (q) =>
          q.eq('restaurantId', args.restaurantId).eq('dayOfWeek', day)
        )
        .unique();

      if (existingEntry) {
        if (existingEntry.open !== open || existingEntry.close !== close) {
            await ctx.db.patch(existingEntry._id, { open, close });
            updatedCount++;
        }
      } else {
        await ctx.db.insert('restaurant_hours', {
          restaurantId: args.restaurantId,
          dayOfWeek: day,
          open,
          close,
        });
        updatedCount++;
      }
    }
    return { updatedCount };
  },
});

export const create = mutation({
  args: {
    restaurantId: v.id('restaurants'),
    dayOfWeek: v.number(),
    open: v.string(),
    close: v.string(),
  },
  handler: async (ctx, args) => ctx.db.insert('restaurant_hours', args),
})
