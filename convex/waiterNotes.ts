import { query } from './_generated/server';
import { v } from 'convex/values';

// Fetches today's notes, events, and promotions for a restaurant.
export const listTodaysAnnouncements = query({
  args: { 
    restaurantId: v.id('restaurants'),
    // waiterId: v.optional(v.id('waiters')) // If we need to fetch notes specific to a waiter too
  },
  handler: async (ctx, args) => {
    const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Fetch notes for the restaurant and today's date.
    // This will fetch all notes regardless of target waiterId.
    // If specific waiter notes are needed, or broadcast notes (e.g. waiterId is null),
    // the query logic and schema might need adjustment or more specific querying.
    const announcements = await ctx.db
      .query('waiter_notes')
      .withIndex('by_restaurant_date', (q) => 
        q.eq('restaurantId', args.restaurantId).eq('dateISO', todayISO)
      )
      .collect();
    
    // If we only want notes not assigned to a specific waiter (broadcasts)
    // .filter(q => q.eq(q.field('waiterId'), null)) 
    // or fetch all and filter in application code if mixed model is used.

    return announcements;
  },
});
