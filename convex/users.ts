// convex/users.ts
// Handles user lifecycle via Clerk webhooks and provides
// user queries used across the application.
//
// Clerk webhook setup:
//   Clerk Dashboard → Webhooks → Add Endpoint
//   URL: https://<your-deployment>.convex.site/clerk-webhook
//   Events: user.created, user.updated, user.deleted

import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// ── Internal: create or update a user record ──────────────────────────────
// Called by the Clerk webhook HTTP action on user.created and user.updated.
export const upsert = internalMutation({
  args: {
    clerkId:   v.string(),
    email:     v.string(),
    firstName: v.optional(v.string()),
    lastName:  v.optional(v.string()),
    imageUrl:  v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email:     args.email,
        firstName: args.firstName,
        lastName:  args.lastName,
        imageUrl:  args.imageUrl,
        lastSignIn: Date.now(),
      });
      return existing._id;
    }

    // New user — generate a stable deviceManagementId (tenant UUID)
    const deviceManagementId = crypto.randomUUID();

    return await ctx.db.insert("users", {
      clerkId:                args.clerkId,
      email:                  args.email,
      firstName:              args.firstName,
      lastName:               args.lastName,
      imageUrl:               args.imageUrl,
      deviceManagementId,
      hasCompletedOnboarding: false,
      createdAt:              Date.now(),
      lastSignIn:             Date.now(),
    });
  },
});

// ── Internal: delete a user record ───────────────────────────────────────
// Called by the Clerk webhook on user.deleted.
// Note: does not cascade-delete facilities/hubs/circuits.
// Add cascade logic here if your product requires it.
export const deleteByClerkId = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

// ── Internal: look up a user by Clerk ID ──────────────────────────────────
export const getByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// ── Public: get the currently authenticated user ──────────────────────────
// Returns null if unauthenticated. Wrap in <Authenticated> on the frontend.
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

// ── Public: check onboarding status ──────────────────────────────────────
export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    return {
      hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
      activeFacilityId:       user.activeFacilityId ?? null,
      deviceManagementId:     user.deviceManagementId,
    };
  },
});

// ── Public: ensure user record exists after sign-in ───────────────────────
// Handles the timing gap between Clerk sign-in and the webhook firing.
// Safe to call on every app load — patches lastSignIn if user already exists.
export const storeUser = mutation({
  args: {
    clerkId:   v.optional(v.string()),
    email:     v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName:  v.optional(v.string()),
    imageUrl:  v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject ?? args.clerkId;
    if (!clerkId) return null;

    const email     = identity?.email      ?? args.email     ?? "";
    const firstName = identity?.givenName  ?? args.firstName;
    const lastName  = identity?.familyName ?? args.lastName;
    const imageUrl  = identity?.pictureUrl ?? args.imageUrl;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSignIn: Date.now(), email, firstName, lastName, imageUrl });
      return existing._id;
    }

    const deviceManagementId = crypto.randomUUID();
    return await ctx.db.insert("users", {
      clerkId,
      email,
      firstName,
      lastName,
      imageUrl,
      deviceManagementId,
      hasCompletedOnboarding: false,
      createdAt:              Date.now(),
      lastSignIn:             Date.now(),
    });
  },
});

// ── Public: get user by Clerk ID ──────────────────────────────────────────
// Verifies the requested clerkId matches the authenticated session before
// returning data — prevents cross-user access.
export const getCurrentUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.clerkId) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});