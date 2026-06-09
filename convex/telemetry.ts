// convex/telemetry.ts
// Internal mutation for IoT telemetry ingest (called from http.ts).
// Public queries for dashboard components.
//
// Ingest flow:
//   Lambda → POST /iot-ingest → http.ts → telemetry.ingest (this file)
//
// The ingest mutation:
//   1. Resolves hub by macAddress
//   2. Updates hub status to "online" + lastSeenAt
//   3. Upserts hubState (latest live values)
//   4. Inserts hubReadings (time-series aggregate)
//   5. For each channel: resolves circuit by channelIndex, inserts channelReadings

import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

const POWER_FACTOR = 0.85;
const ONLINE_THRESHOLD_MS = 30_000; // 30 seconds

// ── Internal: ingest one telemetry frame ──────────────────────────────────
export const ingest = internalMutation({
  args: {
    macAddress:   v.string(),
    voltage:      v.number(),
    totalCurrent: v.number(),
    timestamp:    v.number(),
    channels:     v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Resolve hub by MAC address
    const hub = await ctx.db
      .query("hubs")
      .withIndex("by_mac", (q) => q.eq("macAddress", args.macAddress))
      .unique();

    if (!hub) {
      // Hub not yet registered — discard silently.
      // This can happen if the device provisions before the user completes onboarding.
      return;
    }

    const totalPowerW = args.voltage * args.totalCurrent * POWER_FACTOR;

    // 1. Update hub status and lastSeenAt
    await ctx.db.patch(hub._id, {
      status:     "online",
      lastSeenAt: now,
    });

    // 2. Upsert hubState (one document per hub, always current values)
    const existingState = await ctx.db
      .query("hubState")
      .withIndex("by_hub", (q) => q.eq("hubId", hub._id))
      .unique();

    if (existingState) {
      await ctx.db.patch(existingState._id, {
        voltage:          args.voltage,
        totalCurrentAmps: args.totalCurrent,
        totalPowerW,
        channelCurrents:  args.channels,
        isOnline:         true,
        lastUpdated:      now,
      });
    } else {
      await ctx.db.insert("hubState", {
        hubId:            hub._id,
        userId:           hub.userId,
        macAddress:       args.macAddress,
        voltage:          args.voltage,
        totalCurrentAmps: args.totalCurrent,
        totalPowerW,
        channelCurrents:  args.channels,
        isOnline:         true,
        lastUpdated:      now,
      });
    }

    // 3. Insert hub-level aggregate reading
    await ctx.db.insert("hubReadings", {
      hubId:            hub._id,
      userId:           hub.userId,
      voltage:          args.voltage,
      totalCurrentAmps: args.totalCurrent,
      totalPowerW,
      timestamp:        args.timestamp,
      receivedAt:       now,
    });

    // 4. Insert per-circuit readings
    // Only process channels up to hub.channelCount — ignore extras if firmware
    // sends more than expected (defensive, should never happen).
    const channelCount = Math.min(args.channels.length, hub.channelCount);

    for (let i = 0; i < channelCount; i++) {
      const circuit = await ctx.db
        .query("circuits")
        .withIndex("by_hub", (q) =>
          q.eq("hubId", hub._id).eq("channelIndex", i)
        )
        .unique();

      if (!circuit || !circuit.isActive) continue;

      const currentAmps = args.channels[i];
      const powerW      = currentAmps * args.voltage * POWER_FACTOR;

      await ctx.db.insert("channelReadings", {
        circuitId:   circuit._id,
        hubId:       hub._id,
        userId:      hub.userId,
        currentAmps,
        powerW,
        timestamp:   args.timestamp,
        receivedAt:  now,
      });
    }
  },
});

// ── Public: get live hub state (for dashboard cards) ─────────────────────
// Real-time — Convex pushes updates to the client automatically.
// Returns null if hub not found or user doesn't own it.
export const getHubState = query({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const hub = await ctx.db.get(args.hubId);
    if (!hub || hub.userId !== user._id) return null;

    const state = await ctx.db
      .query("hubState")
      .withIndex("by_hub", (q) => q.eq("hubId", args.hubId))
      .unique();

    if (!state) return null;

    // Derive isOnline from lastUpdated timestamp
    const isOnline = Date.now() - state.lastUpdated < ONLINE_THRESHOLD_MS;
    return { ...state, isOnline };
  },
});

// ── Public: get recent hub readings (for voltage/power trend chart) ───────
// Returns the last N hub-level aggregate readings, newest first.
export const getHubReadings = query({
  args: {
    hubId: v.id("hubs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const hub = await ctx.db.get(args.hubId);
    if (!hub || hub.userId !== user._id) return [];

    const limit = args.limit ?? 100;

    return await ctx.db
      .query("hubReadings")
      .withIndex("by_hub_time", (q) => q.eq("hubId", args.hubId))
      .order("desc")
      .take(limit);
  },
});

// ── Public: get recent readings for one circuit (for per-circuit charts) ──
export const getCircuitReadings = query({
  args: {
    circuitId: v.id("circuits"),
    limit:     v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const circuit = await ctx.db.get(args.circuitId);
    if (!circuit || circuit.userId !== user._id) return [];

    const limit = args.limit ?? 100;

    return await ctx.db
      .query("channelReadings")
      .withIndex("by_circuit_time", (q) => q.eq("circuitId", args.circuitId))
      .order("desc")
      .take(limit);
  },
});

// ── Public: get all circuit states for a hub (for the channels tab) ───────
// Returns each circuit with its latest reading merged in.
export const getCircuitStates = query({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const hub = await ctx.db.get(args.hubId);
    if (!hub || hub.userId !== user._id) return [];

    // Get hubState for the raw channel array (most efficient)
    const state = await ctx.db
      .query("hubState")
      .withIndex("by_hub", (q) => q.eq("hubId", args.hubId))
      .unique();

    const circuits = await ctx.db
      .query("circuits")
      .withIndex("by_hub", (q) => q.eq("hubId", args.hubId))
      .collect();

    // Merge live current into each circuit record
    return circuits.map((circuit) => ({
      ...circuit,
      currentAmps: state?.channelCurrents[circuit.channelIndex] ?? 0,
      powerW: state
        ? state.channelCurrents[circuit.channelIndex] * state.voltage * POWER_FACTOR
        : 0,
      isOnline: state
        ? Date.now() - state.lastUpdated < ONLINE_THRESHOLD_MS
        : false,
    }));
  },
});