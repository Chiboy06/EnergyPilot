/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const owner = await ctx.db.insert("users", {
      clerkId: "owner", email: "o@test", deviceManagementId: "o", hasCompletedOnboarding: true, createdAt: 0, lastSignIn: 0,
    });
    const facilityId = await ctx.db.insert("facilities", { userId: owner, name: "F", type: "office", breakerCapacity: 100, createdAt: 0 });
    const hubId = await ctx.db.insert("hubs", {
      userId: owner, facilityId, name: "Hub", macAddress: "AA:BB:CC:DD:EE:FF", channelCount: 8, status: "online", createdAt: 0,
    });
    for (let i = 0; i < 8; i++) {
      await ctx.db.insert("circuits", { userId: owner, hubId, facilityId, channelIndex: i, name: `C${i + 1}`, isActive: true, createdAt: 0 });
    }
    return { owner, hubId };
  });
  return { t, ...ids };
}

// 2026-10-07 00:00 WAT (a Wednesday)
const DAY = Date.UTC(2026, 9, 7) / 1000 - 3600;

afterEach(() => vi.useRealTimers());

test("a seeded day's rollup equals the sum of its circuits, and is marked demo", async () => {
  const { t, hubId } = await setup();
  await t.mutation(internal.demo.seedDay, { hubId, dayStart: DAY, withReadings: true });
  const { hubDay, circuitDays, readings } = await t.run(async (ctx) => ({
    hubDay: await ctx.db.query("hubDailyEnergy").first(),
    circuitDays: await ctx.db.query("circuitDailyEnergy").collect(),
    readings: await ctx.db.query("hubReadings").collect(),
  }));
  expect(hubDay?.demo).toBe(true);
  expect(hubDay?.day).toBe("2026-10-07");
  expect(hubDay!.kwh).toBeGreaterThan(5);
  expect(circuitDays).toHaveLength(8);
  expect(circuitDays.reduce((s, c) => s + c.kwh, 0)).toBeCloseTo(hubDay!.kwh, 6);
  expect(readings.length).toBeGreaterThan(1000);
  expect(readings.every((r) => r.demo)).toBe(true);
});

test("seeding never overwrites a day the real hub reported", async () => {
  const { t, hubId } = await setup();
  await t.run((ctx) => ctx.db.insert("hubDailyEnergy", { hubId, day: "2026-10-07", dayStart: DAY, kwh: 1.5, peakW: 300, vSum: 230, n: 1 }));
  await t.mutation(internal.demo.seedDay, { hubId, dayStart: DAY, withReadings: false });
  const rows = await t.run((ctx) => ctx.db.query("hubDailyEnergy").collect());
  expect(rows).toHaveLength(1);
  expect(rows[0].kwh).toBe(1.5);
});

test("purge removes demo rows and keeps real ones", async () => {
  vi.useFakeTimers();
  const { t, owner, hubId } = await setup();
  await t.run((ctx) => ctx.db.insert("hubReadings", {
    hubId, userId: owner, voltage: 230, totalCurrentAmps: 1, totalPowerW: 195, timestamp: DAY - 100, receivedAt: 123,
  }));
  await t.mutation(internal.demo.seedDay, { hubId, dayStart: DAY, withReadings: true });
  await t.mutation(internal.demo.purge, { hubId });
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  const left = await t.run(async (ctx) => ({
    readings: await ctx.db.query("hubReadings").collect(),
    days: await ctx.db.query("hubDailyEnergy").collect(),
    circuitDays: await ctx.db.query("circuitDailyEnergy").collect(),
    alerts: await ctx.db.query("anomalies").collect(),
    hub: await ctx.db.get(hubId),
  }));
  expect(left.readings).toHaveLength(1);
  expect(left.readings[0].demo).toBeUndefined();
  expect(left.days).toHaveLength(0);
  expect(left.circuitDays).toHaveLength(0);
  expect(left.alerts.filter((a) => a.demo)).toHaveLength(0);
  expect(left.hub?.lastSeenAt).toBe(123);
});

test("the live feed goes through normal ingest, marked demo, and stops on time", async () => {
  vi.useFakeTimers();
  const { t, hubId } = await setup();
  await t.mutation(internal.demo.startLive, { hubId, minutes: 0.05 }); // 3 seconds
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  const { readings, state } = await t.run(async (ctx) => ({
    readings: await ctx.db.query("hubReadings").collect(),
    state: await ctx.db.query("hubState").first(),
  }));
  expect(readings.length).toBeGreaterThanOrEqual(1);
  expect(readings.every((r) => r.demo)).toBe(true);
  expect(state?.channelCurrents).toHaveLength(8);
});

test("while live, an OFF relay reads 0 A and pending commands are confirmed", async () => {
  vi.useFakeTimers();
  const { t, owner, hubId } = await setup();
  await t.run((ctx) => ctx.db.insert("relayStates", {
    hubId, userId: owner, relayNum: 0, state: false, updatedAt: 0, source: "cloud", pending: true,
  }));
  await t.mutation(internal.demo.startLive, { hubId, minutes: 0.05 });
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  const { state, relay } = await t.run(async (ctx) => ({
    state: await ctx.db.query("hubState").first(),
    relay: await ctx.db.query("relayStates").first(),
  }));
  expect(state?.channelCurrents[0]).toBe(0);
  expect(state!.channelCurrents.slice(1).some((a) => a > 0)).toBe(true);
  expect(relay).toMatchObject({ state: false, pending: false, source: "firmware" });
});
