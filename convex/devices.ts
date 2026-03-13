import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Get user from users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("solar"),
      v.literal("hvac"),
      v.literal("lighting"),
      v.literal("appliance"),
      v.literal("ev_charger"),
      v.literal("other")
    ),
    powerRating: v.number(),
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

    return await ctx.db.insert("devices", {
      name: args.name,
      type: args.type,
      powerRating: args.powerRating,
      status: "online",
      userId: user._id,
      deviceManagementId: user.deviceManagementId,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("devices") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get user from users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const device = await ctx.db.get(args.id);
    if (!device || device.userId !== user._id) {
      throw new Error("Device not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
