// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /* === RESTAURANTES ===================================================== */
  restaurants: defineTable({
    name: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    paymentMethods: v.array(v.string()), // p.e. ["cash", "card", "qr"]
  }),

  restaurant_hours: defineTable({
    restaurantId: v.id("restaurants"),
    dayOfWeek: v.number(),      // 0-6   (Domingo-Sábado)
    open: v.string(),           // "08:00"
    close: v.string(),          // "22:00"
  }).index("by_restaurant", ["restaurantId"])
    .index("by_restaurant_day", ["restaurantId", "dayOfWeek"]),

  /* === PRODUCTOS & DISPONIBILIDAD ======================================= */
  products: defineTable({
    restaurantId: v.id("restaurants"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    isAvailable: v.boolean(),
  })
    .index("by_restaurant", ["restaurantId"])
    .index("by_restaurant_available", ["restaurantId", "isAvailable"]),

  unavailable_daily: defineTable({
    restaurantId: v.id("restaurants"),
    productId: v.id("products"),
    dateISO: v.string(),        // "2025-05-15"
  }).index("by_restaurant_date", ["restaurantId", "dateISO"]),

  /* === MESEROS ========================================================== */
  waiters: defineTable({
    restaurantId: v.id("restaurants"),
    name: v.string(),
    email: v.optional(v.string()),
  }).index("by_restaurant", ["restaurantId"]),

  waiter_hours: defineTable({
    waiterId: v.id("waiters"),
    dayOfWeek: v.number(),
    start: v.string(),
    end: v.string(),
  }).index("by_waiter", ["waiterId"]),

  waiter_notes: defineTable({
    restaurantId: v.id("restaurants"),
    waiterId: v.id("waiters"),
    dateISO: v.string(),
    type: v.union(
      v.literal("note"),
      v.literal("event"),
      v.literal("promotion")
    ),
    content: v.string(),
  })
    .index("by_waiter", ["waiterId"])
    .index("by_restaurant_date", ["restaurantId", "dateISO"]),

  /* === MENSAJES & CHAT ================================================== */
  restaurant_messages: defineTable({
    restaurantId: v.id("restaurants"),
    content: v.string(),
    targetWaiterId: v.optional(v.id("waiters")), // null → broadcast
  }).index("by_restaurant", ["restaurantId"]),

  chat_messages: defineTable({
    restaurantId: v.id("restaurants"),
    fromWaiterId: v.id("waiters"),
    toWaiterId: v.optional(v.id("waiters")),     // null → sala general
    content: v.string(),
  }).index("by_restaurant", ["restaurantId"]),

  /* === PEDIDOS, ITEMS, PAGOS =========================================== */
  orders: defineTable({
    restaurantId: v.id("restaurants"),
    tableNumber: v.string(),
    waiterId: v.id("waiters"),
    status: v.union(
      v.literal("open"),
      v.literal("closed"),
      v.literal("cancelled")
    ),
    total: v.number(),
    isSplit: v.optional(v.boolean()),
    paymentMethod: v.optional(v.string()),
    customerData: v.optional(
      v.object({
        name: v.optional(v.string()),
        document: v.optional(v.string()),  // NIT / cédula
        email: v.optional(v.string()),
      })
    ),
  })
    .index("by_restaurant_status", ["restaurantId", "status"])
    .index("by_waiter", ["waiterId"]),

  order_items: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    productName: v.optional(v.string()), // Denormalized for easier display
    quantity: v.number(),
    price: v.number(),           // precio capturado al momento del pedido
    notes: v.optional(v.string()) // peticiones o adiciones especiales
  }).index("by_order", ["orderId"])
    .index("by_product", ["productId"]),

  payments: defineTable({
    orderId: v.id('orders'),
    method: v.string(), // e.g., 'cash', 'card', 'qr', etc.
    amount: v.number(),
    status: v.union( // Payment status
      v.literal('pending'),
      v.literal('completed'),
      v.literal('failed')
    ),
    transactionId: v.optional(v.string()), // For external payment gateway references
    notes: v.optional(v.string()),
  }).index('by_order', ['orderId']),
});
