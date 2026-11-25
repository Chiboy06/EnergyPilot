// convex/demo.ts
// Presentation data for a hub: generated history, a live feed, and removal.
// Every row written here carries `demo: true` so `demo:purge` removes exactly
// this data and nothing the real hub sent. All functions are internal: run them
// from the CLI only (add --prod for production):
//
//   npx convex run demo:seedHistory '{"hubId":"<id>","days":120}'
//   npx convex run demo:startLive   '{"hubId":"<id>","minutes":180}'
//   npx convex run demo:stopLive    '{"hubId":"<id>"}'
//   npx convex run demo:purge       '{"hubId":"<id>"}'
//
// The load shape follows a working office building in Lagos: weekday office
// hours, lighter weekends, daily grid outages and occasional low-voltage sags.

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { POWER_FACTOR, watDay } from "./telemetry";

const WAT_OFFSET = 3600;
const LIVE_INTERVAL_MS = 5000;
const READINGS_DAYS = 8;        // minute-level readings for the last days (24-h estimate needs 7)

type Kind = "ac" | "light" | "outdoor" | "socket" | "always" | "fridge";
// One entry per channel; channels beyond this list repeat it.
const CHANNELS: { kind: Kind; watts: number }[] = [
  { kind: "ac", watts: 1800 }, { kind: "ac", watts: 1600 }, { kind: "ac", watts: 1400 },
  { kind: "light", watts: 600 }, { kind: "light", watts: 450 }, { kind: "light", watts: 350 },
  { kind: "socket", watts: 900 }, { kind: "socket", watts: 700 }, { kind: "socket", watts: 1200 },
  { kind: "always", watts: 300 }, { kind: "always", watts: 250 }, { kind: "ac", watts: 2000 },
  { kind: "socket", watts: 500 }, { kind: "fridge", watts: 400 }, { kind: "outdoor", watts: 150 },
  { kind: "socket", watts: 800 },
];

// Deterministic PRNG so a seeded day always looks the same.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Share of a channel's rated watts in use at a given WAT hour (0–24, fractional).
function usage(kind: Kind, hour: number, weekend: boolean): number {
  const office = hour >= 8 && hour < 17.5;
  const scale = weekend ? 0.25 : 1;
  switch (kind) {
    case "ac":      return office ? (0.55 + 0.4 * Math.sin(((hour - 8) / 9.5) * Math.PI)) * scale : 0.03;
    case "light":   return office ? 0.9 * scale : hour >= 17.5 && hour < 20 ? 0.3 * scale : 0.05;
    case "outdoor": return hour >= 18.5 || hour < 6.5 ? 1 : 0;
    case "socket":  return office ? 0.6 * scale : 0.08;
    case "always":  return 0.85;
    case "fridge":  return 0.45;
  }
}

type DayPlan = {
  dayFactor: number;
  outages: [number, number][];   // [startMinute, endMinute)
  sag: [number, number] | null;  // low-voltage window
};

function planDay(dayStart: number): DayPlan {
  const r = rng(dayStart);
  const outages: [number, number][] = [];
  const count = Math.floor(r() * 3);  // 0–2 grid outages a day
  for (let i = 0; i < count; i++) {
    const start = Math.floor(r() * 1380);
    outages.push([start, Math.min(1440, start + 45 + Math.floor(r() * 180))]);
  }
  const sagStart = 600 + Math.floor(r() * 420);
  return {
    dayFactor: 0.85 + r() * 0.3,
    outages,
    sag: r() < 0.15 ? [sagStart, sagStart + 20 + Math.floor(r() * 40)] : null,
  };
}

// One reading for a moment in time. null = grid outage (the hub sends nothing).
function frameAt(tsSec: number, channelCount: number, plan: DayPlan, noise: () => number) {
  const { dayStart } = watDay(tsSec);
  const minute = Math.floor((tsSec - dayStart) / 60);
  if (plan.outages.some(([a, b]) => minute >= a && minute < b)) return null;
  const hour = (tsSec - dayStart) / 3600;
  const weekday = new Date((tsSec + WAT_OFFSET) * 1000).getUTCDay();
  const weekend = weekday === 0 || weekday === 6;
  const sagging = plan.sag !== null && minute >= plan.sag[0] && minute < plan.sag[1];
  const voltage = sagging ? 186 + noise() * 8 : 222 + noise() * 12;
  const watts = Array.from({ length: channelCount }, (_, i) => {
    const c = CHANNELS[i % CHANNELS.length];
    const cycle = c.kind === "fridge" ? (Math.floor(minute / 12) % 2 ? 1.6 : 0.4) : 1;
    return Math.max(0, c.watts * usage(c.kind, hour, weekend) * plan.dayFactor * cycle * (0.9 + noise() * 0.2));
  });
  const channels = watts.map((w) => w / (voltage * POWER_FACTOR));
  return { voltage, channels, totalCurrent: channels.reduce((s, a) => s + a, 0), watts };
}

async function demoHub(ctx: MutationCtx, hubId: Id<"hubs">) {
  const hub = await ctx.db.get(hubId);
  if (!hub) throw new Error("Hub not found");
  return hub;
}

// ── History: one WAT day of rollups (+ minute readings for recent days) ─────
export const seedDay = internalMutation({
  args: { hubId: v.id("hubs"), dayStart: v.number(), withReadings: v.boolean() },
  handler: async (ctx, args) => {
    const hub = await demoHub(ctx, args.hubId);
    const { day } = watDay(args.dayStart);
    // Never touch a day the real hub already reported.
    const existing = await ctx.db
      .query("hubDailyEnergy")
      .withIndex("by_hub_day", (q) => q.eq("hubId", hub._id).eq("day", day))
      .unique();
    if (existing) return;

    const circuits = await ctx.db
      .query("circuits")
      .withIndex("by_hub", (q) => q.eq("hubId", hub._id))
      .take(64);
    const plan = planDay(args.dayStart);
    const noise = rng(args.dayStart + 7);

    let kwh = 0, peakW = 0, vSum = 0, frames = 0;
    const circuitKwh = new Array(hub.channelCount).fill(0);
    let sagStart: number | null = null;
    let sagMinV = Infinity;

    for (let m = 0; m < 1440; m++) {
      const ts = args.dayStart + m * 60;
      const f = frameAt(ts, hub.channelCount, plan, noise);
      if (!f) continue;
      const totalW = f.totalCurrent * f.voltage * POWER_FACTOR;
      kwh += (totalW * 60) / 3.6e6;
      f.watts.forEach((w, i) => { circuitKwh[i] += (w * 60) / 3.6e6; });
      peakW = Math.max(peakW, totalW);
      vSum += f.voltage * 12; // 12 five-second frames per minute
      frames += 12;
      if (f.voltage < 196 && sagStart === null) sagStart = ts;
      if (f.voltage < 196) sagMinV = Math.min(sagMinV, f.voltage);
      if (f.voltage >= 196 && sagStart !== null) {
        await ctx.db.insert("anomalies", {
          hubId: hub._id, userId: hub.userId, type: "voltage_low", severity: "warning",
          message: `Voltage ${sagMinV.toFixed(1)}V below safe minimum of 196V`,
          value: sagMinV, threshold: 196, timestamp: sagStart * 1000, resolvedAt: ts * 1000, demo: true,
        });
        sagStart = null;
        sagMinV = Infinity;
      }
      if (args.withReadings) {
        await ctx.db.insert("hubReadings", {
          hubId: hub._id, userId: hub.userId, voltage: f.voltage, totalCurrentAmps: f.totalCurrent,
          totalPowerW: totalW, timestamp: ts, receivedAt: ts * 1000, demo: true,
        });
      }
    }
    if (frames === 0) return;

    await ctx.db.insert("hubDailyEnergy", {
      hubId: hub._id, day, dayStart: args.dayStart, kwh, peakW, vSum, n: frames, demo: true,
    });
    for (const c of circuits) {
      if (c.channelIndex >= hub.channelCount) continue;
      await ctx.db.insert("circuitDailyEnergy", {
        circuitId: c._id, hubId: hub._id, day, kwh: circuitKwh[c.channelIndex], demo: true,
      });
    }
  },
});

// Seeds the `days` full days before today, then refreshes the 24-h estimate.
export const seedHistory = internalMutation({
  args: { hubId: v.id("hubs"), days: v.number() },
  handler: async (ctx, args) => {
    const hub = await demoHub(ctx, args.hubId);
    const today = watDay(Math.floor(Date.now() / 1000)).dayStart;
    for (let d = 1; d <= Math.min(args.days, 400); d++) {
      await ctx.scheduler.runAfter(d * 200, internal.demo.seedDay, {
        hubId: hub._id, dayStart: today - d * 86400, withReadings: d <= READINGS_DAYS,
      });
    }
    await ctx.scheduler.runAfter(args.days * 200 + 30_000, internal.forecasts.generate, {
      hubId: hub._id, userId: hub.userId,
    });
  },
});

// ── Live feed: one frame every 5 s through the normal ingest path ──────────
export const startLive = internalMutation({
  args: { hubId: v.id("hubs"), minutes: v.number() },
  handler: async (ctx, args) => {
    const hub = await demoHub(ctx, args.hubId);
    const alreadyRunning = (hub.demoLiveUntil ?? 0) > Date.now();
    await ctx.db.patch(hub._id, { demoLiveUntil: Date.now() + args.minutes * 60_000 });
    if (!alreadyRunning) await ctx.scheduler.runAfter(0, internal.demo.liveTick, { hubId: hub._id });
  },
});

export const stopLive = internalMutation({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.hubId, { demoLiveUntil: 0 });
  },
});

export const liveTick = internalMutation({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    const hub = await demoHub(ctx, args.hubId);
    if ((hub.demoLiveUntil ?? 0) <= Date.now()) return;
    const ts = Math.floor(Date.now() / 1000);
    const plan = planDay(watDay(ts).dayStart);
    plan.outages = []; // keep the feed running while presenting
    const f = frameAt(ts, hub.channelCount, plan, rng(ts));

    // Act like the hub firmware: confirm pending relay commands, and an OFF
    // relay draws no current. Relays with no known state are treated as ON.
    const relays = await ctx.db
      .query("relayStates")
      .withIndex("by_hub", (q) => q.eq("hubId", hub._id))
      .take(64);
    const off = new Set(relays.filter((r) => !r.state).map((r) => r.relayNum));
    for (const r of relays) {
      if (r.pending) await ctx.db.patch(r._id, { pending: false, source: "firmware", updatedAt: Date.now() });
    }

    if (f) {
      const channels = f.channels.map((a, i) => (off.has(i) ? 0 : a));
      await ctx.runMutation(internal.telemetry.ingest, {
        macAddress: hub.macAddress, voltage: f.voltage, totalCurrent: channels.reduce((sum, a) => sum + a, 0),
        timestamp: ts, channels, demo: true,
      });
    }
    await ctx.scheduler.runAfter(LIVE_INTERVAL_MS, internal.demo.liveTick, { hubId: hub._id });
  },
});

// ── Removal: deletes every demo row for the hub, one page at a time ─────────
const PURGE_STEPS = ["hubReadings", "channelReadings", "hubDailyEnergy", "circuitDailyEnergy", "anomalies", "forecasts"] as const;

export const purge = internalMutation({
  args: {
    hubId: v.id("hubs"),
    step: v.optional(v.number()),
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const hub = await demoHub(ctx, args.hubId);
    const step = args.step ?? 0;
    if (step === 0 && !args.cursor) await ctx.db.patch(hub._id, { demoLiveUntil: 0 });

    if (step >= PURGE_STEPS.length) {
      // Restore live state to the last real reading.
      const state = await ctx.db.query("hubState").withIndex("by_hub", (q) => q.eq("hubId", hub._id)).unique();
      if (state) await ctx.db.delete(state._id);
      const lastReal = await ctx.db
        .query("hubReadings")
        .withIndex("by_hub_time", (q) => q.eq("hubId", hub._id))
        .order("desc")
        .first();
      await ctx.db.patch(hub._id, { lastSeenAt: lastReal?.receivedAt });
      return;
    }

    const table = PURGE_STEPS[step];
    const opts = { numItems: 300, cursor: args.cursor ?? null };
    const page =
      table === "hubReadings" ? await ctx.db.query("hubReadings").withIndex("by_hub_time", (q) => q.eq("hubId", hub._id)).paginate(opts)
      : table === "channelReadings" ? await ctx.db.query("channelReadings").withIndex("by_hub_time", (q) => q.eq("hubId", hub._id)).paginate(opts)
      : table === "hubDailyEnergy" ? await ctx.db.query("hubDailyEnergy").withIndex("by_hub_day", (q) => q.eq("hubId", hub._id)).paginate(opts)
      : table === "circuitDailyEnergy" ? await ctx.db.query("circuitDailyEnergy").withIndex("by_hub_day", (q) => q.eq("hubId", hub._id)).paginate(opts)
      : table === "anomalies" ? await ctx.db.query("anomalies").withIndex("by_hub_time", (q) => q.eq("hubId", hub._id)).paginate(opts)
      : await ctx.db.query("forecasts").withIndex("by_hub_time", (q) => q.eq("hubId", hub._id)).paginate(opts);

    for (const doc of page.page) {
      // Forecasts are derived data; the nightly job rebuilds them from real readings.
      if (table === "forecasts" || ("demo" in doc && doc.demo)) await ctx.db.delete(doc._id);
    }
    await ctx.scheduler.runAfter(0, internal.demo.purge, page.isDone
      ? { hubId: hub._id, step: step + 1, cursor: null }
      : { hubId: hub._id, step, cursor: page.continueCursor });
  },
});
