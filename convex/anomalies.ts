// convex/anomalies.ts
// Anomaly detection queries and mutations.
// Detection logic is triggered inside telemetry.ingest after each frame.

import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

async function requireUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) throw new ConvexError("User not found");
  return user;
}

// ── Internal: detect and record anomalies from a telemetry frame ──────────
export const detectAndRecord = internalMutation({
  args: {
    hubId:            v.id("hubs"),
    userId:           v.id("users"),
    voltage:          v.number(),
    totalCurrentAmps: v.number(),
    totalPowerW:      v.number(),
    channels:         v.array(v.number()),
    timestamp:        v.number(),  // Unix epoch seconds from firmware
  },
  handler: async (ctx, args) => {
    const now = args.timestamp * 1000;

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .unique();

    const loadWarningPct = prefs?.loadWarningPct ?? 80;
    const autoCutoffPct  = prefs?.autoCutoffPct  ?? 95;

    const hub = await ctx.db.get(args.hubId);
    if (!hub) return;
    const facility = await ctx.db.get(hub.facilityId);
    const breakerAmps = facility?.breakerCapacity ?? 100;

    const VOLTAGE_HIGH = 253;
    const VOLTAGE_LOW  = 196;

    const anomaliesToInsert: {
      circuitId?: any;
      type: string;
      severity: string;
      message: string;
      value: number;
      threshold: number;
    }[] = [];

    // 1. Voltage high
    if (args.voltage > VOLTAGE_HIGH && prefs?.notifyVoltageHigh !== false) {
      anomaliesToInsert.push({
        type:      "voltage_high",
        severity:  "critical",
        message:   `Voltage ${args.voltage.toFixed(1)}V exceeds safe limit of ${VOLTAGE_HIGH}V`,
        value:     args.voltage,
        threshold: VOLTAGE_HIGH,
      });
    }

    // 2. Voltage low (skip if near-zero — hub offline)
    if (args.voltage > 10 && args.voltage < VOLTAGE_LOW && prefs?.notifyVoltageLow !== false) {
      anomaliesToInsert.push({
        type:      "voltage_low",
        severity:  "warning",
        message:   `Voltage ${args.voltage.toFixed(1)}V below safe minimum of ${VOLTAGE_LOW}V`,
        value:     args.voltage,
        threshold: VOLTAGE_LOW,
      });
    }

    // 3. Zero voltage with active load — possible fault
    if (args.voltage < 10 && args.totalCurrentAmps > 0.5) {
      anomaliesToInsert.push({
        type:      "zero_voltage_with_load",
        severity:  "critical",
        message:   `Current detected (${args.totalCurrentAmps.toFixed(2)}A) with no voltage — possible fault`,
        value:     args.voltage,
        threshold: 10,
      });
    }

    // 4. High total load
    const loadPct = breakerAmps > 0 ? (args.totalCurrentAmps / breakerAmps) * 100 : 0;
    if (loadPct >= loadWarningPct && prefs?.notifyHighLoad !== false) {
      anomaliesToInsert.push({
        type:      "high_load",
        severity:  loadPct >= autoCutoffPct ? "critical" : "warning",
        message:   `Total load at ${loadPct.toFixed(1)}% of breaker capacity (${args.totalCurrentAmps.toFixed(1)}A / ${breakerAmps}A)`,
        value:     loadPct,
        threshold: loadWarningPct,
      });
    }

    // 5. Per-circuit overload
    if (prefs?.notifyCircuitOverload !== false) {
      const circuits = await ctx.db
        .query("circuits")
        .withIndex("by_hub", (q: any) => q.eq("hubId", args.hubId))
        .collect();
      for (const circuit of circuits) {
        if (!circuit.maxAmps || !circuit.isActive) continue;
        const channelAmps = args.channels[circuit.channelIndex] ?? 0;
        const circuitLoadPct = (channelAmps / circuit.maxAmps) * 100;
        if (circuitLoadPct >= 90) {
          anomaliesToInsert.push({
            circuitId: circuit._id,
            type:      "circuit_overload",
            severity:  circuitLoadPct >= 100 ? "critical" : "warning",
            message:   `Circuit "${circuit.name}" at ${circuitLoadPct.toFixed(1)}% capacity (${channelAmps.toFixed(2)}A / ${circuit.maxAmps}A)`,
            value:     channelAmps,
            threshold: circuit.maxAmps * 0.9,
          });
        }
      }
    }

    // Deduplication: skip same anomaly type within 5 minutes
    const DEDUP_WINDOW_MS = 5 * 60 * 1000;
    const cutoff = now - DEDUP_WINDOW_MS;

    for (const a of anomaliesToInsert) {
      const recent = await ctx.db
        .query("anomalies")
        .withIndex("by_hub_time", (q: any) =>
          q.eq("hubId", args.hubId).gte("timestamp", cutoff)
        )
        .filter((q: any) =>
          q.and(
            q.eq(q.field("type"), a.type),
            q.eq(q.field("resolvedAt"), undefined),
            a.circuitId
              ? q.eq(q.field("circuitId"), a.circuitId)
              : q.eq(q.field("circuitId"), undefined)
          )
        )
        .first();
      if (recent) continue;

      await ctx.db.insert("anomalies", {
        hubId:      args.hubId,
        userId:     args.userId,
        circuitId:  a.circuitId,
        type:       a.type as any,
        severity:   a.severity as any,
        message:    a.message,
        value:      a.value,
        threshold:  a.threshold,
        timestamp:  now,
      });
    }
  },
});

// ── Public: get anomalies for a hub ───────────────────────────────────────
export const getAnomalies = query({
  args: {
    hubId:           v.id("hubs"),
    includeResolved: v.optional(v.boolean()),
    limit:           v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];
    const hub = await ctx.db.get(args.hubId);
    if (!hub || hub.userId !== user._id) return [];
    const limit = args.limit ?? 50;
    const q = ctx.db
      .query("anomalies")
      .withIndex("by_hub_time", (q: any) => q.eq("hubId", args.hubId))
      .order("desc");
    if (!args.includeResolved) {
      return await q
        .filter((f: any) => f.eq(f.field("resolvedAt"), undefined))
        .take(limit);
    }
    return await q.take(limit);
  },
});

// ── Public: resolve / dismiss an anomaly ──────────────────────────────────
export const resolve = mutation({
  args: { anomalyId: v.id("anomalies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    const anomaly = await ctx.db.get(args.anomalyId);
    if (!anomaly) throw new ConvexError("Anomaly not found");
    const hub  = await ctx.db.get(anomaly.hubId);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || hub?.userId !== user._id) throw new ConvexError("Access denied");
    await ctx.db.patch(args.anomalyId, { resolvedAt: Date.now() });
  },
});

// ── Public: unresolved anomaly count (for badge indicator) ────────────────
export const getUnresolvedCount = query({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return 0;
    const hub = await ctx.db.get(args.hubId);
    if (!hub || hub.userId !== user._id) return 0;
    const unresolved = await ctx.db
      .query("anomalies")
      .withIndex("by_hub_unresolved", (q: any) =>
        q.eq("hubId", args.hubId).eq("resolvedAt", undefined)
      )
      .collect();
    return unresolved.length;
  },
});
