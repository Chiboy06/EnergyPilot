import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    deviceManagementId: v.string(),
    hasCompletedOnboarding: v.optional(v.boolean()),
    activeFacilityId: v.optional(v.string()),
    createdAt: v.number(),
    lastSignIn: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_device_management_id", ["deviceManagementId"]),

  facilities: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("residential"),
      v.literal("office"),
      v.literal("institution"),
      v.literal("industrial")
    ),
    breakerCapacity: v.optional(v.number()),
    rooms: v.optional(v.array(v.string())),
    tariffPerKwh:   v.optional(v.number()),  // cost per kWh in local currency (e.g. NGN 68)
    tariffCurrency: v.optional(v.string()),  // "NGN" default
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  hubs: defineTable({
    userId: v.id("users"),
    facilityId: v.id("facilities"),
    name: v.string(),
    macAddress: v.string(),
    channelCount: v.union(
      v.literal(8),
      v.literal(16),
      v.literal(24),
      v.literal(32)
    ),
    status: v.union(
      v.literal("provisioning"),
      v.literal("online"),
      v.literal("offline")
    ),
    lastSeenAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_mac", ["macAddress"]),

  circuits: defineTable({
    userId: v.id("users"),
    hubId: v.id("hubs"),
    facilityId: v.id("facilities"),
    channelIndex: v.number(),
    name: v.string(),
    roomName: v.optional(v.string()),
    loadType: v.optional(
      v.union(
        v.literal("lighting"),
        v.literal("hvac"),
        v.literal("appliance"),
        v.literal("ev_charger"),
        v.literal("general"),
        v.literal("other")
      )
    ),
    maxAmps: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_hub", ["hubId", "channelIndex"]),

  hubState: defineTable({
    hubId: v.id("hubs"),
    userId: v.id("users"),
    macAddress: v.string(),
    voltage: v.number(),
    totalCurrentAmps: v.number(),
    totalPowerW: v.number(),
    channelCurrents: v.array(v.number()),
    isOnline: v.boolean(),
    lastUpdated: v.number(),
  }).index("by_hub", ["hubId"]),

  // ADD THIS TABLE to convex/schema.ts
// Place it after the hubState table definition.

// ── Relay States ───────────────────────────────────────────────────────────
// One document per relay per hub.
// Written by relay.sendCommand (cloud-initiated) and
// relay.syncFromFirmware (hardware-initiated).
// Read by getRelayStates query — real-time push to dashboard.
//
// relayNum 0–15 maps directly to firmware relayStates[] array index.
// source field distinguishes cloud commands from physical button presses.
//
// NOTE: This is the Convex UI representation of relay state.
// The hardware ground truth is always the firmware's NVS storage.
// On device reboot the firmware publishes its current state,
// which is synced back here via syncFromFirmware.

relayStates: defineTable({
  hubId:     v.id("hubs"),
  userId:    v.id("users"),
  relayNum:  v.number(),     // 0-based, maps to firmware relayStates[relayNum]
  state:     v.boolean(),    // true = ON (energised), false = OFF
  updatedAt: v.number(),     // Unix ms — last time this relay changed
  source: v.union(
    v.literal("cloud"),      // command from web/mobile app
    v.literal("firmware")    // physical button press or device-initiated change
  ),
})
  .index("by_hub",       ["hubId"])
  .index("by_hub_relay", ["hubId", "relayNum"]),

  hubReadings: defineTable({
    hubId: v.id("hubs"),
    userId: v.id("users"),
    voltage: v.number(),
    totalCurrentAmps: v.number(),
    totalPowerW: v.number(),
    timestamp: v.number(),
    receivedAt: v.number(),
  }).index("by_hub_time", ["hubId", "timestamp"]),

  channelReadings: defineTable({
    circuitId: v.id("circuits"),
    hubId: v.id("hubs"),
    userId: v.id("users"),
    currentAmps: v.number(),
    powerW: v.number(),
    timestamp: v.number(),
    receivedAt: v.number(),
  }).index("by_circuit_time", ["circuitId", "timestamp"]),

  userPreferences: defineTable({
    userId:              v.id("users"),
    loadWarningPct:      v.number(),
    autoCutoffPct:       v.number(),
    pushEnabled:         v.boolean(),
    emailEnabled:        v.boolean(),
    notifyHighLoad:      v.boolean(),
    notifyVoltageHigh:   v.boolean(),
    notifyVoltageLow:    v.boolean(),
    notifyCircuitOverload: v.boolean(),
    currency:            v.string(),
    timezone:            v.string(),
    displayName:         v.optional(v.string()),
    apiKey:              v.optional(v.string()),
    geminiApiKey:        v.optional(v.string()),
    updatedAt:           v.number(),
  }).index("by_user", ["userId"]),

  anomalies: defineTable({
    hubId:      v.id("hubs"),
    userId:     v.id("users"),
    circuitId:  v.optional(v.id("circuits")),
    type: v.union(
      v.literal("high_load"),
      v.literal("circuit_overload"),
      v.literal("voltage_high"),
      v.literal("voltage_low"),
      v.literal("zero_voltage_with_load"),
    ),
    severity: v.union(
      v.literal("warning"),
      v.literal("critical"),
    ),
    message:    v.string(),
    value:      v.number(),
    threshold:  v.number(),
    resolvedAt: v.optional(v.number()),
    timestamp:  v.number(),
  })
    .index("by_hub_time",       ["hubId",  "timestamp"])
    .index("by_user_time",      ["userId", "timestamp"])
    .index("by_hub_unresolved", ["hubId",  "resolvedAt"]),

  forecasts: defineTable({
    hubId:        v.id("hubs"),
    userId:       v.id("users"),
    generatedAt:  v.number(),
    forecastType: v.union(
      v.literal("moving_average"),
      v.literal("deepar"),
    ),
    dataPoints: v.array(v.object({
      timestamp:      v.number(),
      predictedKwh:   v.number(),
      confidenceLow:  v.number(),
      confidenceHigh: v.number(),
    })),
  }).index("by_hub_time", ["hubId", "generatedAt"]),

  aiMessages: defineTable({
    userId:    v.id("users"),
    hubId:     v.id("hubs"),
    role:      v.union(v.literal("user"), v.literal("assistant")),
    content:   v.string(),
    relayAction: v.optional(v.object({
      relayNum:    v.number(),
      state:       v.boolean(),
      circuitName: v.string(),
    })),
    timestamp: v.number(),
    ttl:       v.number(),
  }).index("by_user_hub_time", ["userId", "hubId", "timestamp"]),
});
