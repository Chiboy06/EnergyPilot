import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Get user from users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const limit = args.limit ?? 50;
    return await ctx.db
      .query("readings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

export const add = mutation({
  args: {
    deviceId: v.id("devices"),
    power: v.number(),
    energy: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get user from users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== user._id) {
      throw new Error("Device not found or unauthorized");
    }

    return await ctx.db.insert("readings", {
      deviceId: args.deviceId,
      power: args.power,
      energy: args.energy,
      timestamp: Date.now(),
      userId: user._id,
      deviceManagementId: user.deviceManagementId,
    });
  },
});
