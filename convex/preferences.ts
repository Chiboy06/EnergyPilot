// convex/preferences.ts
// User preference management — settings persistence for web and mobile.

import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { DEFAULT_TARIFF_NGN } from "./telemetry";
import { getUser, requireUser } from "./access";
import type { Id } from "./_generated/dataModel";

const DEFAULTS = {
  loadWarningPct:        80,
  autoCutoffPct:         95,
  pushEnabled:           true,
  emailEnabled:          false,
  notifyHighLoad:        true,
  notifyVoltageHigh:     true,
  notifyVoltageLow:      true,
  notifyCircuitOverload: true,
  currency:              "NGN",
  timezone:              "Africa/Lagos",
};

// Get preferences — defaults merged with stored values. Secrets are never returned.
export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (!prefs) return { ...DEFAULTS, userId: user._id };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { geminiApiKey, apiKey, ...safe } = prefs;
    return safe;
  },
});

// Server-only: the user's Gemini key for AI actions.
export const getGeminiKeyInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    return prefs?.geminiApiKey ?? null;
  },
});

// Update preferences — upserts the document
export const update = mutation({
  args: {
    loadWarningPct:        v.optional(v.number()),
    autoCutoffPct:         v.optional(v.number()),
    pushEnabled:           v.optional(v.boolean()),
    emailEnabled:          v.optional(v.boolean()),
    notifyHighLoad:        v.optional(v.boolean()),
    notifyVoltageHigh:     v.optional(v.boolean()),
    notifyVoltageLow:      v.optional(v.boolean()),
    notifyCircuitOverload: v.optional(v.boolean()),
    currency:              v.optional(v.string()),
    timezone:              v.optional(v.string()),
    displayName:           v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const warn = args.loadWarningPct ?? existing?.loadWarningPct ?? DEFAULTS.loadWarningPct;
    const crit = args.autoCutoffPct  ?? existing?.autoCutoffPct  ?? DEFAULTS.autoCutoffPct;
    if (warn < 50 || warn > 100 || crit < 50 || crit > 100) {
      throw new ConvexError("Thresholds must be between 50% and 100%");
    }
    if (crit < warn) throw new ConvexError("Critical level cannot be below the warning level");
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
    } else {
      await ctx.db.insert("userPreferences", {
        ...DEFAULTS, ...args, userId: user._id, updatedAt: now,
      });
    }
  },
});

// Set user-supplied Gemini API key (stored at rest, never returned in full)
export const setGeminiApiKey = mutation({
  args: { geminiApiKey: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!args.geminiApiKey.startsWith("AIza")) {
      throw new ConvexError("Invalid Gemini API key format — must start with AIza");
    }
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { geminiApiKey: args.geminiApiKey, updatedAt: now });
    } else {
      await ctx.db.insert("userPreferences", {
        ...DEFAULTS, userId: user._id, geminiApiKey: args.geminiApiKey, updatedAt: now,
      });
    }
  },
});

// Remove user-supplied Gemini API key
export const removeGeminiApiKey = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { geminiApiKey: undefined, updatedAt: Date.now() });
    }
  },
});

// Tariff for the user's active facility. isDefault = no tariff saved yet.
export const getTariffRate = query({
  args: {},
  handler: async (ctx) => {
    const fallback = { tariffPerKwh: DEFAULT_TARIFF_NGN, currency: "NGN", isDefault: true };
    const user = await getUser(ctx);
    if (!user?.activeFacilityId) return fallback;
    const facility = await ctx.db.get(user.activeFacilityId as Id<"facilities">);
    if (!facility?.tariffPerKwh) return fallback;
    return { tariffPerKwh: facility.tariffPerKwh, currency: facility.tariffCurrency ?? "NGN", isDefault: false };
  },
});

// Set tariff rate on the user's active facility (owner only)
export const setTariffRate = mutation({
  args: { tariffPerKwh: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!Number.isFinite(args.tariffPerKwh) || args.tariffPerKwh <= 0 || args.tariffPerKwh > 10000) {
      throw new ConvexError("Tariff must be a positive amount per kWh");
    }
    if (!user.activeFacilityId) throw new ConvexError("No active facility");
    const facility = await ctx.db.get(user.activeFacilityId as Id<"facilities">);
    if (!facility || facility.userId !== user._id) throw new ConvexError("Only the facility owner can set the tariff");
    await ctx.db.patch(facility._id, { tariffPerKwh: args.tariffPerKwh });
  },
});

// Get masked Gemini key status — NEVER return full key to frontend
export const getGeminiKeyStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return { hasKey: false, maskedKey: null };
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (!prefs?.geminiApiKey) return { hasKey: false, maskedKey: null };
    return {
      hasKey:    true,
      maskedKey: prefs.geminiApiKey.substring(0, 4) + "••••••••••••" + prefs.geminiApiKey.slice(-4),
    };
  },
});
