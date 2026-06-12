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
import { internal } from "./_generated/api";

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

    // Detect anomalies from this frame and record if new
    await ctx.runMutation(internal.anomalies.detectAndRecord, {
      hubId:            hub._id,
      userId:           hub.userId,
      voltage:          args.voltage,
      totalCurrentAmps: args.totalCurrent,
      totalPowerW,
      channels:         args.channels,
      timestamp:        args.timestamp,
    });
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

// Nigeria grid carbon intensity — kg CO2 per kWh (IEA Nigeria 2023)
const NIGERIA_CARBON_KG_PER_KWH = 0.43;

// ── Public: aggregate hub readings by calendar day ────────────────────────
// Reads at most 25,000 documents total (budget spread across days) to avoid
// Convex's 32k-per-execution limit. Energy values are extrapolated when the
// sample is smaller than a full day of 5-second readings (17,280/day).
// Returns newest day first.
export const getConsumptionByDay = query({
  args: {
    hubId:         v.id("hubs"),
    fromTimestamp: v.number(),   // Unix epoch seconds
    toTimestamp:   v.number(),   // Unix epoch seconds
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
    const facility = await ctx.db.get(hub.facilityId);
    const tariffPerKwh = facility?.tariffPerKwh ?? 68;

    const INTERVAL_SECONDS = 5;
    const WAT_OFFSET        = 3600; // UTC+1

    // Build WAT-aligned day boundaries covering the requested range
    const firstDayStart =
      Math.floor((args.fromTimestamp + WAT_OFFSET) / 86400) * 86400 - WAT_OFFSET;
    const dayStarts: number[] = [];
    for (let d = firstDayStart; d < args.toTimestamp; d += 86400) {
      dayStarts.push(d);
    }
    if (dayStarts.length === 0) return [];

    // Spread 25,000-read budget evenly across days
    const samplePerDay = Math.max(10, Math.floor(25000 / dayStarts.length));

    const dayRows = await Promise.all(
      dayStarts.map(async (dayFrom) => {
        const dayTo      = dayFrom + 86400;
        const rangeFrom  = Math.max(dayFrom, args.fromTimestamp);
        const rangeTo    = Math.min(dayTo,   args.toTimestamp);
        const expectedN  = (rangeTo - rangeFrom) / INTERVAL_SECONDS;

        const readings = await ctx.db
          .query("hubReadings")
          .withIndex("by_hub_time", (q) =>
            q.eq("hubId", args.hubId)
             .gte("timestamp", rangeFrom)
             .lt("timestamp",  rangeTo)
          )
          .take(samplePerDay);

        if (readings.length === 0) return null;

        // If we hit the sample cap, scale up proportionally
        const scale =
          readings.length >= samplePerDay ? expectedN / samplePerDay : 1;

        const sampledKwh = readings.reduce((s, r) => s + r.totalPowerW, 0)
          * INTERVAL_SECONDS / 3600 / 1000;
        const totalKwh = sampledKwh * scale;
        const peakW    = Math.max(...readings.map(r => r.totalPowerW));
        const avgV     =
          readings.reduce((s, r) => s + r.voltage, 0) / readings.length;

        return {
          timestamp: dayFrom,
          date:      new Date(dayFrom * 1000).toISOString().split("T")[0],
          totalKwh:  Math.round(totalKwh * 1000) / 1000,
          peakW:     Math.round(peakW),
          avgV:      Math.round(avgV * 10) / 10,
          costNgn:   Math.round(totalKwh * tariffPerKwh * 100) / 100,
          carbonKg:  Math.round(totalKwh * NIGERIA_CARBON_KG_PER_KWH * 1000) / 1000,
        };
      })
    );

    return dayRows
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => b.timestamp - a.timestamp);
  },
});

// ── Public: per-circuit energy totals for a time range ────────────────────
// Uses sampling: reads the most recent N channel readings per circuit (newest
// first), computes average power, then multiplies by total period hours.
// Budget: 25,000 reads ÷ circuit count, capped at 2,000 per circuit.
export const getConsumptionByCircuit = query({
  args: {
    hubId:         v.id("hubs"),
    fromTimestamp: v.number(),
    toTimestamp:   v.number(),
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

    const circuits = await ctx.db
      .query("circuits")
      .withIndex("by_hub", (q) => q.eq("hubId", args.hubId))
      .collect();

    if (circuits.length === 0) return [];

    // Spread 25,000-read budget across circuits, cap at 2,000 per circuit
    const maxPerCircuit = Math.min(
      2000,
      Math.floor(25000 / circuits.length)
    );
    const timeRangeHours = (args.toTimestamp - args.fromTimestamp) / 3600;

    const result = await Promise.all(circuits.map(async (circuit) => {
      // Take the most recent N readings in the window (desc = newest first)
      const readings = await ctx.db
        .query("channelReadings")
        .withIndex("by_circuit_time", (q) =>
          q.eq("circuitId", circuit._id)
           .gte("timestamp", args.fromTimestamp)
           .lte("timestamp", args.toTimestamp)
        )
        .order("desc")
        .take(maxPerCircuit);

      // avgPower × total hours → estimated kWh for the full period
      const avgPowerW = readings.length > 0
        ? readings.reduce((s, r) => s + r.powerW, 0) / readings.length
        : 0;
      const totalKwh = (avgPowerW * timeRangeHours) / 1000;

      return {
        circuitId:    circuit._id,
        channelIndex: circuit.channelIndex,
        name:         circuit.name,
        loadType:     circuit.loadType ?? "general",
        totalKwh:     Math.round(totalKwh * 1000) / 1000,
      };
    }));

    return result.sort((a, b) => b.totalKwh - a.totalKwh);
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