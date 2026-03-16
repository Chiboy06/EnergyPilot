import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate unique device management ID
function generateDeviceManagementId(): string {
  return `DM-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

// Store or update user from Clerk
export const storeUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        lastSignIn: now,
      });
      return existingUser._id;
    }

    // Create new user with unique device management ID
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      deviceManagementId: generateDeviceManagementId(),
      createdAt: now,
      lastSignIn: now,
    });

    return userId;
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user;
  },
});

// Get user by device management ID
export const getUserByDeviceManagementId = query({
  args: { deviceManagementId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_device_management_id", (q) =>
        q.eq("deviceManagementId", args.deviceManagementId)
      )
      .first();
    return user;
  },
});

// Get current user (requires authentication)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});

// Get current user by clerkId passed from client.
// Used because auth.config.ts has no providers configured — ctx.auth.getUserIdentity()
// always returns null in this setup, so we accept clerkId explicitly from the client.
export const getCurrentUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    if (!args.clerkId) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});
