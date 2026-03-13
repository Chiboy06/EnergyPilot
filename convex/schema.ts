import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(), // Clerk user ID
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    deviceManagementId: v.string(), // Unique ID for device management
    createdAt: v.number(),
    lastSignIn: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_device_management_id", ["deviceManagementId"]),

  devices: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("solar"),
      v.literal("hvac"),
      v.literal("lighting"),
      v.literal("appliance"),
      v.literal("ev_charger"),
      v.literal("other")
    ),
    status: v.union(
      v.literal("online"),
      v.literal("offline"),
      v.literal("warning")
    ),
    powerRating: v.number(), // watts
    userId: v.id("users"), // Reference to users table
    deviceManagementId: v.string(), // User's device management ID
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_device_management_id", ["deviceManagementId"]),

  readings: defineTable({
    deviceId: v.id("devices"),
    power: v.number(), // current watts
    energy: v.number(), // kWh consumed in this reading period
    timestamp: v.number(),
    userId: v.id("users"),
    deviceManagementId: v.string(),
  })
    .index("by_device", ["deviceId", "timestamp"])
    .index("by_user", ["userId", "timestamp"])
    .index("by_device_management_id", ["deviceManagementId", "timestamp"]),
});
