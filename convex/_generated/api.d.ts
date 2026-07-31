/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as anomalies from "../anomalies.js";
import type * as circuits from "../circuits.js";
import type * as crons from "../crons.js";
import type * as forecasts from "../forecasts.js";
import type * as http from "../http.js";
import type * as onboarding from "../onboarding.js";
import type * as preferences from "../preferences.js";
import type * as relay from "../relay.js";
import type * as sharing from "../sharing.js";
import type * as telemetry from "../telemetry.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  anomalies: typeof anomalies;
  circuits: typeof circuits;
  crons: typeof crons;
  forecasts: typeof forecasts;
  http: typeof http;
  onboarding: typeof onboarding;
  preferences: typeof preferences;
  relay: typeof relay;
  sharing: typeof sharing;
  telemetry: typeof telemetry;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
