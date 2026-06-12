// convex/preferences.ts
// User preference management — settings persistence for web and mobile.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

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

async function requireUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) throw new ConvexError("User not found");
  return user;
}

// Get preferences — returns defaults merged with stored values if none exist yet
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
    if (!prefs) return { ...DEFAULTS, userId: user._id, apiKey: null };
    return prefs;
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
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
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

// Generate or return existing API key
export const getOrCreateApiKey = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
    if (existing?.apiKey) return existing.apiKey;
    const apiKey = "eng_" + Array.from(
      crypto.getRandomValues(new Uint8Array(24))
    ).map((b) => b.toString(16).padStart(2, "0")).join("");
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { apiKey, updatedAt: now });
    } else {
      await ctx.db.insert("userPreferences", {
        ...DEFAULTS, userId: user._id, apiKey, updatedAt: now,
      });
    }
    return apiKey;
  },
});

// Rotate API key — generates a new one, invalidating the old
export const rotateApiKey = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
    const apiKey = "eng_" + Array.from(
      crypto.getRandomValues(new Uint8Array(24))
    ).map((b) => b.toString(16).padStart(2, "0")).join("");
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { apiKey, updatedAt: now });
    } else {
      await ctx.db.insert("userPreferences", {
        ...DEFAULTS, userId: user._id, apiKey, updatedAt: now,
      });
    }
    return apiKey;
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
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
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
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { geminiApiKey: undefined, updatedAt: Date.now() });
    }
  },
});

// Returns the actual key only to the authenticated owner — required for client-side
// Gemini Live WebSocket sessions which cannot proxy through Convex Actions.
export const getGeminiKeyForLiveSession = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
    return prefs?.geminiApiKey ?? null;
  },
});

// Get masked Gemini key status — NEVER return full key to frontend
export const getGeminiKeyStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { hasKey: false, maskedKey: null };
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return { hasKey: false, maskedKey: null };
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
    if (!prefs?.geminiApiKey) return { hasKey: false, maskedKey: null };
    return {
      hasKey:    true,
      maskedKey: prefs.geminiApiKey.substring(0, 8) + "••••••••••••••••••••",
    };
  },
});
