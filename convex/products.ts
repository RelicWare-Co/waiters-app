import { query } from './_generated/server'

export const get = query({
  args: {},
  handler: async (ctx) => {
    console.log(await ctx.auth.getUserIdentity())
    return await ctx.db.query('products').collect()
  },
})
