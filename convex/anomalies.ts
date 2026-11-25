// convex/anomalies.ts
// Anomaly detection queries and mutations.
// Detection logic is triggered inside telemetry.ingest after each frame.
//
// Lifecycle: an anomaly opens when a frame shows the condition, stays open (no
// duplicates) while the condition persists, and is auto-resolved by the first
// frame that no longer shows it. Detection always runs; the notify* preferences
// only control delivery (which is not implemented yet), never what is recorded.

import { v, ConvexError } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getHubReadAccess, requireHubOwner } from "./access";

const VOLTAGE_HIGH = 253;  // +10% of 230 V nominal
const VOLTAGE_LOW  = 196;  // -15% of 230 V nominal
const CIRCUIT_WARN_PCT = 90;
export const DEFAULT_BREAKER_AMPS = 100;

type AnomalyType = "high_load" | "circuit_overload" | "voltage_high" | "voltage_low" | "zero_voltage_with_load";

// Same anomaly = same type on the same circuit (or hub-wide when no circuit).
const keyOf = (type: string, circuitId?: Id<"circuits">) => `${type}:${circuitId ?? "hub"}`;

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
    demo:             v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = args.timestamp * 1000;

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    const loadWarningPct = prefs?.loadWarningPct ?? 80;
    const criticalPct    = prefs?.autoCutoffPct  ?? 95;

    const hub = await ctx.db.get(args.hubId);
    if (!hub) return;
    const facility = await ctx.db.get(hub.facilityId);
    const breakerAmps = facility?.breakerCapacity && facility.breakerCapacity > 0
      ? facility.breakerCapacity
      : DEFAULT_BREAKER_AMPS;

    const found: {
      circuitId?: Id<"circuits">;
      type: AnomalyType;
      severity: "warning" | "critical";
      message: string;
      value: number;
      threshold: number;
    }[] = [];

    if (args.voltage > VOLTAGE_HIGH) {
      found.push({
        type: "voltage_high", severity: "critical",
        message: `Voltage ${args.voltage.toFixed(1)}V exceeds safe limit of ${VOLTAGE_HIGH}V`,
        value: args.voltage, threshold: VOLTAGE_HIGH,
      });
    }

    // Skip near-zero voltage — that is the "no voltage" case below.
    if (args.voltage > 10 && args.voltage < VOLTAGE_LOW) {
      found.push({
        type: "voltage_low", severity: "warning",
        message: `Voltage ${args.voltage.toFixed(1)}V below safe minimum of ${VOLTAGE_LOW}V`,
        value: args.voltage, threshold: VOLTAGE_LOW,
      });
    }

    if (args.voltage < 10 && args.totalCurrentAmps > 0.5) {
      found.push({
        type: "zero_voltage_with_load", severity: "critical",
        message: `Current detected (${args.totalCurrentAmps.toFixed(2)}A) with no voltage — possible fault`,
        value: args.voltage, threshold: 10,
      });
    }

    const loadPct = (args.totalCurrentAmps / breakerAmps) * 100;
    if (loadPct >= loadWarningPct) {
      found.push({
        type: "high_load",
        severity: loadPct >= criticalPct ? "critical" : "warning",
        message: `Total load at ${loadPct.toFixed(1)}% of breaker capacity (${args.totalCurrentAmps.toFixed(1)}A / ${breakerAmps}A)`,
        value: loadPct, threshold: loadWarningPct,
      });
    }

    const circuits = await ctx.db
      .query("circuits")
      .withIndex("by_hub", (q) => q.eq("hubId", args.hubId))
      .take(64);
    for (const circuit of circuits) {
      if (!circuit.maxAmps || !circuit.isActive) continue;
      const channelAmps = args.channels[circuit.channelIndex] ?? 0;
      const circuitLoadPct = (channelAmps / circuit.maxAmps) * 100;
      if (circuitLoadPct >= CIRCUIT_WARN_PCT) {
        found.push({
          circuitId: circuit._id,
          type: "circuit_overload",
          severity: circuitLoadPct >= 100 ? "critical" : "warning",
          message: `Circuit "${circuit.name}" at ${circuitLoadPct.toFixed(1)}% of its ${circuit.maxAmps}A rating (${channelAmps.toFixed(2)}A)`,
          value: channelAmps, threshold: circuit.maxAmps * (CIRCUIT_WARN_PCT / 100),
        });
      }
    }

    // Open anomalies for this hub (bounded — at most one per type/circuit).
    const open = await ctx.db
      .query("anomalies")
      .withIndex("by_hub_unresolved", (q) => q.eq("hubId", args.hubId).eq("resolvedAt", undefined))
      .take(200);
    const openByKey = new Map(open.map((a) => [keyOf(a.type, a.circuitId), a]));
    const foundKeys = new Set(found.map((a) => keyOf(a.type, a.circuitId)));

    // Resolve anomalies whose condition is no longer present.
    for (const a of open) {
      if (!foundKeys.has(keyOf(a.type, a.circuitId))) {
        await ctx.db.patch(a._id, { resolvedAt: now });
      }
    }

    for (const a of found) {
      const existing = openByKey.get(keyOf(a.type, a.circuitId));
      if (existing) {
        // Still ongoing — escalate severity if it got worse, never duplicate.
        if (a.severity === "critical" && existing.severity !== "critical") {
          await ctx.db.patch(existing._id, { severity: "critical", message: a.message, value: a.value });
        }
        continue;
      }
      await ctx.db.insert("anomalies", {
        hubId:     args.hubId,
        userId:    args.userId,
        circuitId: a.circuitId,
        type:      a.type,
        severity:  a.severity,
        message:   a.message,
        value:     a.value,
        threshold: a.threshold,
        timestamp: now,
        demo:      args.demo || undefined,
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
    if (!(await getHubReadAccess(ctx, args.hubId))) return [];
    const limit = Math.min(Math.max(1, args.limit ?? 50), 200);
    if (!args.includeResolved) {
      const open = await ctx.db
        .query("anomalies")
        .withIndex("by_hub_unresolved", (q) => q.eq("hubId", args.hubId).eq("resolvedAt", undefined))
        .take(200);
      return open.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }
    return await ctx.db
      .query("anomalies")
      .withIndex("by_hub_time", (q) => q.eq("hubId", args.hubId))
      .order("desc")
      .take(limit);
  },
});

// ── Public: resolve / dismiss an anomaly (hub owner only) ─────────────────
export const resolve = mutation({
  args: { anomalyId: v.id("anomalies") },
  handler: async (ctx, args) => {
    const anomaly = await ctx.db.get(args.anomalyId);
    if (!anomaly) throw new ConvexError("Anomaly not found");
    await requireHubOwner(ctx, anomaly.hubId);
    await ctx.db.patch(args.anomalyId, { resolvedAt: Date.now() });
  },
});

// ── Public: unresolved anomaly count (for badge indicator) ────────────────
// Capped at 100; the UI shows "99+" above that.
export const getUnresolvedCount = query({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    if (!(await getHubReadAccess(ctx, args.hubId))) return 0;
    const unresolved = await ctx.db
      .query("anomalies")
      .withIndex("by_hub_unresolved", (q) => q.eq("hubId", args.hubId).eq("resolvedAt", undefined))
      .take(100);
    return unresolved.length;
  },
});
