import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Complete onboarding: register hub + facility info, mark user as onboarded
export const completeOnboarding = mutation({
  args: {
    clerkId: v.string(), // passed from client since auth.config has no providers
    serialNumber: v.string(),
    hubName: v.string(),
    facilityName: v.string(),
    facilityType: v.string(),
    facilityRooms: v.string(), // JSON.stringify(string[])
    breakerCapacity: v.number(),
  },
  handler: async (ctx, args) => {
    // Try identity first (works if Convex auth is configured)
    const identity = await ctx.auth.getUserIdentity();
    
    // Look up user by clerkId (works regardless of auth.config state)
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found. Please refresh and try again.");

    // Security: if identity IS available, verify it matches the clerkId
    if (identity && identity.subject !== args.clerkId) {
      throw new Error("Identity mismatch");
    }

    // Insert the hub as a device record using the existing schema
    const deviceId = await ctx.db.insert("devices", {
      name: args.hubName,
      type: "other",
      status: "online",
      powerRating: args.breakerCapacity,
      userId: user._id,
      deviceManagementId: user.deviceManagementId,
      serialNumber: args.serialNumber,
      facilityName: args.facilityName,
      facilityType: args.facilityType,
      facilityRooms: args.facilityRooms,
      breakerCapacity: args.breakerCapacity,
      createdAt: Date.now(),
    });

    // Mark onboarding complete and set active facility to this device's serial
    await ctx.db.patch(user._id, {
      hasCompletedOnboarding: true,
      activeFacilityId: args.serialNumber,
    });

    return deviceId;
  },
});

// Get all hubs (devices with serialNumber) for the current user.
// Accepts clerkId from client because ctx.auth.getUserIdentity() always returns
// null when auth.config.ts has no providers configured.
export const listHubs = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    if (!args.clerkId) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return [];

    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return devices.filter((d) => d.serialNumber);
  },
});

// Switch active facility
export const setActiveFacility = mutation({
  args: { clerkId: v.string(), serialNumber: v.string() },
  handler: async (ctx, { clerkId, serialNumber }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { activeFacilityId: serialNumber });
  },
});
