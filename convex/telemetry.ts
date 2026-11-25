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
//   6. Adds the frame's energy to the daily rollups (hubDailyEnergy / circuitDailyEnergy)

import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getHubReadAccess } from "./access";

// Power is estimated as V × I × PF: the hub measures current and voltage only.
export const POWER_FACTOR = 0.85;
const ONLINE_THRESHOLD_MS = 30_000; // 30 seconds
// shortcut: each frame counts as one 5 s interval of energy; upgrade to measured
// inter-frame gaps if the firmware cadence ever changes.
export const INTERVAL_SECONDS = 5;
const WAT_OFFSET = 3600; // Nigeria (WAT) = UTC+1, no DST

// Nigeria grid carbon intensity — kg CO2 per kWh (IEA Nigeria 2023)
const NIGERIA_CARBON_KG_PER_KWH = 0.43;
export const DEFAULT_TARIFF_NGN = 68;

// WAT calendar day for a Unix-seconds timestamp.
export function watDay(tsSec: number): { day: string; dayStart: number } {
  const dayStart = Math.floor((tsSec + WAT_OFFSET) / 86400) * 86400 - WAT_OFFSET;
  const day = new Date((dayStart + WAT_OFFSET) * 1000).toISOString().slice(0, 10);
  return { day, dayStart };
}

export const frameKwh = (powerW: number) => (powerW * INTERVAL_SECONDS) / 3600 / 1000;

// Add one frame to the daily rollups.
export async function addToRollups(
  ctx: MutationCtx,
  hubId: Id<"hubs">,
  tsSec: number,
  voltage: number,
  totalPowerW: number,
  circuitPowers: { circuitId: Id<"circuits">; powerW: number }[],
  demo?: boolean
) {
  const { day, dayStart } = watDay(tsSec);
  const hubDay = await ctx.db
    .query("hubDailyEnergy")
    .withIndex("by_hub_day", (q) => q.eq("hubId", hubId).eq("day", day))
    .unique();
  if (hubDay) {
    await ctx.db.patch(hubDay._id, {
      kwh:   hubDay.kwh + frameKwh(totalPowerW),
      peakW: Math.max(hubDay.peakW, totalPowerW),
      vSum:  hubDay.vSum + voltage,
      n:     hubDay.n + 1,
    });
  } else {
    await ctx.db.insert("hubDailyEnergy", {
      hubId, day, dayStart, kwh: frameKwh(totalPowerW), peakW: totalPowerW, vSum: voltage, n: 1, demo,
    });
  }

  for (const { circuitId, powerW } of circuitPowers) {
    const row = await ctx.db
      .query("circuitDailyEnergy")
      .withIndex("by_circuit_day", (q) => q.eq("circuitId", circuitId).eq("day", day))
      .unique();
    if (row) await ctx.db.patch(row._id, { kwh: row.kwh + frameKwh(powerW) });
    else await ctx.db.insert("circuitDailyEnergy", { circuitId, hubId, day, kwh: frameKwh(powerW), demo });
  }
}

// ── Internal: ingest one telemetry frame ──────────────────────────────────
export const ingest = internalMutation({
  args: {
    macAddress:   v.string(),
    voltage:      v.number(),
    totalCurrent: v.number(),
    timestamp:    v.number(),
    channels:     v.array(v.number()),
    demo:         v.optional(v.boolean()), // only set by convex/demo.ts, never by the HTTP endpoint
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const demo = args.demo || undefined;

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
      demo,
    });

    // 4. Insert per-circuit readings
    // Only process channels up to hub.channelCount — ignore extras if firmware
    // sends more than expected (defensive, should never happen).
    const channelCount = Math.min(args.channels.length, hub.channelCount);
    const circuitPowers: { circuitId: Id<"circuits">; powerW: number }[] = [];

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
      circuitPowers.push({ circuitId: circuit._id, powerW });

      await ctx.db.insert("channelReadings", {
        circuitId:   circuit._id,
        hubId:       hub._id,
        userId:      hub.userId,
        currentAmps,
        powerW,
        timestamp:   args.timestamp,
        receivedAt:  now,
        demo,
      });
    }

    // 5. Daily energy rollups
    await addToRollups(ctx, hub._id, args.timestamp, args.voltage, totalPowerW, circuitPowers, demo);

    // Detect anomalies from this frame and record if new
    await ctx.runMutation(internal.anomalies.detectAndRecord, {
      hubId:            hub._id,
      userId:           hub.userId,
      voltage:          args.voltage,
      totalCurrentAmps: args.totalCurrent,
      totalPowerW,
      channels:         args.channels,
      timestamp:        args.timestamp,
      demo,
    });
  },
});

// ── Internal: one-off backfill of rollups from stored readings ────────────
// Run once after deploying rollups:
//   npx convex run telemetry:backfillRollups '{"hubId":"<id>","before":<unix seconds of deploy>}'
// Only readings older than `before` are counted, so frames ingested after the
// deploy (already rolled up live) are not double counted. Re-schedules itself in batches.
export const backfillRollups = internalMutation({
  args: {
    hubId:  v.id("hubs"),
    before: v.number(),
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("hubReadings")
      .withIndex("by_hub_time", (q) => q.eq("hubId", args.hubId).lt("timestamp", args.before))
      .paginate({ numItems: 200, cursor: args.cursor ?? null });

    for (const r of page.page) {
      const channel = await ctx.db
        .query("channelReadings")
        .withIndex("by_hub_time", (q) => q.eq("hubId", args.hubId).eq("timestamp", r.timestamp))
        .take(64);
      await addToRollups(
        ctx, args.hubId, r.timestamp, r.voltage, r.totalPowerW,
        channel.map((c) => ({ circuitId: c.circuitId, powerW: c.powerW }))
      );
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.telemetry.backfillRollups, {
        hubId: args.hubId, before: args.before, cursor: page.continueCursor,
      });
    }
  },
});

// ── Public: get live hub state (for dashboard cards) ─────────────────────
// Real-time — Convex pushes updates to the client automatically.
// Returns null if hub not found or the caller has no access.
// Note: isOnline is only re-evaluated when data changes; clients should derive
// freshness from lastUpdated with their own clock.
export const getHubState = query({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    if (!(await getHubReadAccess(ctx, args.hubId))) return null;

    const state = await ctx.db
      .query("hubState")
      .withIndex("by_hub", (q) => q.eq("hubId", args.hubId))
      .unique();

    if (!state) return null;

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
    if (!(await getHubReadAccess(ctx, args.hubId))) return [];
    const limit = Math.min(Math.max(1, args.limit ?? 100), 500);
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
    const circuit = await ctx.db.get(args.circuitId);
    if (!circuit || !(await getHubReadAccess(ctx, circuit.hubId))) return [];
    const limit = Math.min(Math.max(1, args.limit ?? 100), 500);
    return await ctx.db
      .query("channelReadings")
      .withIndex("by_circuit_time", (q) => q.eq("circuitId", args.circuitId))
      .order("desc")
      .take(limit);
  },
});

// ── Public: energy per WAT calendar day, from the daily rollups ───────────
// Totals count every received 5 s frame; days with no data are omitted.
// Returns newest day first.
export const getConsumptionByDay = query({
  args: {
    hubId:         v.id("hubs"),
    fromTimestamp: v.number(),   // Unix epoch seconds
    toTimestamp:   v.number(),   // Unix epoch seconds
  },
  handler: async (ctx, args) => {
    const access = await getHubReadAccess(ctx, args.hubId);
    if (!access) return [];
    const facility = await ctx.db.get(access.hub.facilityId);
    const tariffPerKwh = facility?.tariffPerKwh ?? DEFAULT_TARIFF_NGN;

    const rows = await ctx.db
      .query("hubDailyEnergy")
      .withIndex("by_hub_day", (q) =>
        q.eq("hubId", args.hubId)
         .gte("day", watDay(args.fromTimestamp).day)
         .lte("day", watDay(args.toTimestamp).day)
      )
      .take(400);

    return rows
      .map((d) => ({
        timestamp: d.dayStart,
        date:      d.day,
        totalKwh:  Math.round(d.kwh * 1000) / 1000,
        peakW:     Math.round(d.peakW),
        avgV:      Math.round((d.vSum / d.n) * 10) / 10,
        readings:  d.n,
        costNgn:   Math.round(d.kwh * tariffPerKwh * 100) / 100,
        carbonKg:  Math.round(d.kwh * NIGERIA_CARBON_KG_PER_KWH * 1000) / 1000,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  },
});

// ── Public: per-circuit energy totals for a time range, from rollups ──────
export const getConsumptionByCircuit = query({
  args: {
    hubId:         v.id("hubs"),
    fromTimestamp: v.number(),
    toTimestamp:   v.number(),
  },
  handler: async (ctx, args) => {
    if (!(await getHubReadAccess(ctx, args.hubId))) return [];

    const circuits = await ctx.db
      .query("circuits")
      .withIndex("by_hub", (q) => q.eq("hubId", args.hubId))
      .take(64);
    if (circuits.length === 0) return [];

    const rows = await ctx.db
      .query("circuitDailyEnergy")
      .withIndex("by_hub_day", (q) =>
        q.eq("hubId", args.hubId)
         .gte("day", watDay(args.fromTimestamp).day)
         .lte("day", watDay(args.toTimestamp).day)
      )
      .take(64 * 400);

    const kwhByCircuit = new Map<string, number>();
    for (const r of rows) kwhByCircuit.set(r.circuitId, (kwhByCircuit.get(r.circuitId) ?? 0) + r.kwh);

    return circuits
      .map((circuit) => ({
        circuitId:    circuit._id,
        channelIndex: circuit.channelIndex,
        name:         circuit.name,
        loadType:     circuit.loadType ?? "general",
        totalKwh:     Math.round((kwhByCircuit.get(circuit._id) ?? 0) * 1000) / 1000,
      }))
      .sort((a, b) => b.totalKwh - a.totalKwh);
  },
});

// ── Public: get all circuit states for a hub (for the channels tab) ───────
// Returns each circuit with its latest reading merged in.
export const getCircuitStates = query({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    if (!(await getHubReadAccess(ctx, args.hubId))) return [];

    // Get hubState for the raw channel array (most efficient)
    const state = await ctx.db
      .query("hubState")
      .withIndex("by_hub", (q) => q.eq("hubId", args.hubId))
      .unique();

    const circuits = await ctx.db
      .query("circuits")
      .withIndex("by_hub", (q) => q.eq("hubId", args.hubId))
      .take(64);

    // Merge live current into each circuit record. hasReading is false when the
    // hub has never reported this channel (shown as "no data", not 0 W).
    return circuits.map((circuit) => {
      const amps = state?.channelCurrents[circuit.channelIndex];
      const hasReading = typeof amps === "number";
      return {
        ...circuit,
        hasReading,
        currentAmps: hasReading ? amps : 0,
        powerW:      hasReading && state ? amps * state.voltage * POWER_FACTOR : 0,
        lastUpdated: state?.lastUpdated ?? null,
        isOnline:    state ? Date.now() - state.lastUpdated < ONLINE_THRESHOLD_MS : false,
      };
    });
  },
});
