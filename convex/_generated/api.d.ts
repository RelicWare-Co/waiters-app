/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as dashboard from "../dashboard.js";
import type * as messages from "../messages.js";
import type * as orderItems from "../orderItems.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as products from "../products.js";
import type * as restaurantHours from "../restaurantHours.js";
import type * as restaurantReports from "../restaurantReports.js";
import type * as restaurants from "../restaurants.js";
import type * as unavailableDaily from "../unavailableDaily.js";
import type * as waiterHours from "../waiterHours.js";
import type * as waiterNotes from "../waiterNotes.js";
import type * as waiters from "../waiters.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  dashboard: typeof dashboard;
  messages: typeof messages;
  orderItems: typeof orderItems;
  orders: typeof orders;
  payments: typeof payments;
  products: typeof products;
  restaurantHours: typeof restaurantHours;
  restaurantReports: typeof restaurantReports;
  restaurants: typeof restaurants;
  unavailableDaily: typeof unavailableDaily;
  waiterHours: typeof waiterHours;
  waiterNotes: typeof waiterNotes;
  waiters: typeof waiters;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
