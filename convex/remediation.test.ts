/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.ts");

// Owner with one 8-channel hub; optional viewer/controller members.
async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const mkUser = (clerkId: string) =>
      ctx.db.insert("users", {
        clerkId, email: `${clerkId}@test`, deviceManagementId: clerkId,
        hasCompletedOnboarding: true, createdAt: 0, lastSignIn: 0,
      });
    const owner = await mkUser("owner");
    const viewer = await mkUser("viewer");
    const controller = await mkUser("controller");
    const stranger = await mkUser("stranger");
    const facilityId = await ctx.db.insert("facilities", {
      userId: owner, name: "F", type: "residential", breakerCapacity: 100, createdAt: 0,
    });
    await ctx.db.patch(owner, { activeFacilityId: facilityId });
    const hubId = await ctx.db.insert("hubs", {
      userId: owner, facilityId, name: "Hub", macAddress: "AA:BB:CC:DD:EE:FF",
      channelCount: 8, status: "online", createdAt: 0,
    });
    const circuitIds: Id<"circuits">[] = [];
    for (let i = 0; i < 8; i++) {
      circuitIds.push(await ctx.db.insert("circuits", {
        userId: owner, hubId, facilityId, channelIndex: i, name: `Circuit ${i + 1}`,
        isActive: true, createdAt: 0, ...(i === 0 ? { maxAmps: 10 } : {}),
      }));
    }
    await ctx.db.insert("hubMembers", { hubId, userId: viewer, role: "viewer", joinedAt: 0 });
    await ctx.db.insert("hubMembers", { hubId, userId: controller, role: "controller", joinedAt: 0 });
    return { owner, viewer, controller, stranger, facilityId, hubId, circuitIds };
  });
  const as = (clerkId: string) => t.withIdentity({ subject: clerkId });
  return { t, as, ...ids };
}

const frame = (overrides: Partial<{ voltage: number; totalCurrent: number; timestamp: number; channels: number[] }> = {}) => ({
  macAddress: "AA:BB:CC:DD:EE:FF",
  voltage: 230,
  totalCurrent: 2,
  timestamp: 1_767_225_600, // 2026-01-01 00:00 UTC = 01:00 WAT
  channels: [2, 0, 0, 0, 0, 0, 0, 0],
  ...overrides,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("relay access", () => {
  test("sendCommand without a signed-in user is rejected, even with a clerkId argument", async () => {
    const { t, hubId } = await setup();
    await expect(
      t.mutation(api.relay.sendCommand, { hubId, relayNum: 0, state: false, clerkId: "owner" })
    ).rejects.toThrow(/Not authenticated/);
    const rows = await t.run((ctx) => ctx.db.query("relayStates").collect());
    expect(rows).toHaveLength(0);
  });

  test("viewer can read telemetry but cannot switch; controller can", async () => {
    const { as, hubId } = await setup();
    await as("viewer").mutation(internal.telemetry.ingest, frame()).catch(() => {});
    const states = await as("viewer").query(api.telemetry.getCircuitStates, { hubId });
    expect(states).toHaveLength(8);
    await expect(
      as("viewer").mutation(api.relay.sendCommand, { hubId, relayNum: 0, state: false })
    ).rejects.toThrow(/viewers cannot switch/);
    await as("controller").mutation(api.relay.sendCommand, { hubId, relayNum: 0, state: false });
    const relays = await as("owner").query(api.relay.getRelayStates, { hubId });
    expect(relays).toMatchObject([{ relayNum: 0, state: false, pending: true }]);
  });

  test("non-members see nothing", async () => {
    const { as, hubId } = await setup();
    expect(await as("stranger").query(api.telemetry.getCircuitStates, { hubId })).toEqual([]);
    expect(await as("stranger").query(api.telemetry.getHubState, { hubId })).toBeNull();
  });

  test("relay numbers outside the hub's channels are rejected; master writes every channel", async () => {
    const { as, hubId } = await setup();
    await expect(as("owner").mutation(api.relay.sendCommand, { hubId, relayNum: 8, state: true })).rejects.toThrow(/relayNum/);
    await expect(as("owner").mutation(api.relay.sendCommand, { hubId, relayNum: -1, state: true })).rejects.toThrow(/relayNum/);
    await as("owner").mutation(api.relay.sendCommand, { hubId, relayNum: 255, state: true });
    const relays = await as("owner").query(api.relay.getRelayStates, { hubId });
    expect(relays.map((r) => r.relayNum)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("energy rollups", () => {
  test("daily kWh is the sum of every frame's 5-second energy, labelled with the WAT day", async () => {
    const { t, as, hubId } = await setup();
    const ts = 1_767_225_600; // 01:00 WAT on 2026-01-01
    for (let i = 0; i < 3; i++) {
      await t.mutation(internal.telemetry.ingest, frame({ timestamp: ts + i * 5 }));
    }
    const watts = 230 * 2 * 0.85;
    const expectedKwh = (3 * watts * 5) / 3600 / 1000;
    const days = await as("owner").query(api.telemetry.getConsumptionByDay, {
      hubId, fromTimestamp: ts - 86400, toTimestamp: ts + 60,
    });
    expect(days).toHaveLength(1);
    expect(days[0].date).toBe("2026-01-01");
    expect(days[0].totalKwh).toBeCloseTo(expectedKwh, 3);
    expect(days[0].readings).toBe(3);

    const circuits = await as("owner").query(api.telemetry.getConsumptionByCircuit, {
      hubId, fromTimestamp: ts - 86400, toTimestamp: ts + 60,
    });
    expect(circuits[0]).toMatchObject({ channelIndex: 0 });
    expect(circuits[0].totalKwh).toBeCloseTo(expectedKwh, 3);
  });
});

describe("forecast", () => {
  test("an hour averaging 1000 W is estimated as 1 kWh", async () => {
    const { t, owner, hubId } = await setup();
    const nowSec = Math.floor(Date.now() / 1000);
    await t.run(async (ctx) => {
      for (let h = 1; h <= 24; h++) {
        for (let k = 0; k < 2; k++) {
          await ctx.db.insert("hubReadings", {
            hubId, userId: owner, voltage: 230, totalCurrentAmps: 5, totalPowerW: 1000,
            timestamp: nowSec - h * 3600 + k * 60, receivedAt: 0,
          });
        }
      }
    });
    await t.mutation(internal.forecasts.generate, { hubId, userId: owner });
    const f = await t.run((ctx) => ctx.db.query("forecasts").first());
    expect(f).not.toBeNull();
    const withData = f!.dataPoints.filter((p) => (p.samples ?? 0) > 0);
    expect(withData.length).toBeGreaterThan(0);
    for (const p of withData) expect(p.predictedKwh).toBeCloseTo(1, 3);
  });
});

describe("alerts", () => {
  test("recorded even when notifications are off, not duplicated, and auto-resolved when the condition clears", async () => {
    const { t, as, owner, hubId } = await setup();
    await t.run((ctx) => ctx.db.insert("userPreferences", {
      userId: owner, loadWarningPct: 80, autoCutoffPct: 95, pushEnabled: false, emailEnabled: false,
      notifyHighLoad: false, notifyVoltageHigh: false, notifyVoltageLow: false, notifyCircuitOverload: false,
      currency: "NGN", timezone: "Africa/Lagos", updatedAt: 0,
    }));
    const ts = 1_767_225_600;
    await t.mutation(internal.telemetry.ingest, frame({ voltage: 180, timestamp: ts }));
    await t.mutation(internal.telemetry.ingest, frame({ voltage: 181, timestamp: ts + 400 }));
    let open = await as("owner").query(api.anomalies.getAnomalies, { hubId });
    expect(open.filter((a) => a.type === "voltage_low")).toHaveLength(1);

    await t.mutation(internal.telemetry.ingest, frame({ voltage: 230, timestamp: ts + 405 }));
    open = await as("owner").query(api.anomalies.getAnomalies, { hubId });
    expect(open.filter((a) => a.type === "voltage_low")).toHaveLength(0);
    expect(await as("owner").query(api.anomalies.getUnresolvedCount, { hubId })).toBe(0);
  });
});

describe("secrets", () => {
  test("preferences.get never returns the Gemini or API key", async () => {
    const { as } = await setup();
    await as("owner").mutation(api.preferences.setGeminiApiKey, { geminiApiKey: "AIzaSECRETSECRET" });
    const prefs = await as("owner").query(api.preferences.get, {});
    expect(JSON.stringify(prefs)).not.toContain("AIzaSECRET");
    const status = await as("owner").query(api.preferences.getGeminiKeyStatus, {});
    expect(status.hasKey).toBe(true);
    expect(status.maskedKey).not.toContain("SECRETSECRET");
  });
});

describe("AI relay control", () => {
  function stubGemini(functionCall: unknown) {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ functionCall }] } }] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  test("the AI only proposes; nothing switches until the user confirms", async () => {
    const { as, hubId } = await setup();
    await as("owner").mutation(api.preferences.setGeminiApiKey, { geminiApiKey: "AIzaTEST" });
    stubGemini({ name: "propose_relay_switch", args: { channel: 1, state: false } });

    const res = await as("owner").action(api.ai.sendMessage, { hubId, content: "turn off circuit 1" });
    expect(res.relayAction).toMatchObject({ relayNum: 0, state: false, status: "proposed" });
    expect(await as("owner").query(api.relay.getRelayStates, { hubId })).toHaveLength(0);

    const msgs = await as("owner").query(api.ai.getMessages, { hubId });
    const proposal = msgs.find((m) => m.relayAction?.status === "proposed")!;
    await as("owner").mutation(api.ai.resolveRelayProposal, { messageId: proposal._id, confirm: true });
    expect(await as("owner").query(api.relay.getRelayStates, { hubId })).toMatchObject([{ relayNum: 0, state: false }]);
  });

  test("proposals for unknown channels are refused", async () => {
    const { as, hubId } = await setup();
    await as("owner").mutation(api.preferences.setGeminiApiKey, { geminiApiKey: "AIzaTEST" });
    stubGemini({ name: "propose_relay_switch", args: { channel: 99, state: false } });
    const res = await as("owner").action(api.ai.sendMessage, { hubId, content: "turn off 99" });
    expect(res.relayAction).toBeUndefined();
  });

  test("createLiveToken refuses users without access to the hub", async () => {
    const { as, hubId } = await setup();
    await expect(as("stranger").action(api.ai.createLiveToken, { hubId })).rejects.toThrow(/access denied/);
  });
});

describe("relay confirmation timeout", () => {
  test("a command the hub never confirms reverts and unlocks after 20 s", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok", { status: 200 }))); // Lambda accepts, hub silent
    process.env.RELAY_LAMBDA_URL = "https://lambda.test";
    process.env.IOT_RELAY_SECRET = "s";
    const { t, as, owner, hubId } = await setup();
    await t.run((ctx) => ctx.db.insert("relayStates", {
      hubId, userId: owner, relayNum: 2, state: true, updatedAt: 0, source: "firmware", pending: false,
    }));
    await as("owner").mutation(api.relay.sendCommand, { hubId, relayNum: 2, state: false });
    expect(await as("owner").query(api.relay.getRelayStates, { hubId })).toMatchObject([{ state: false, pending: true }]);
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await as("owner").query(api.relay.getRelayStates, { hubId })).toMatchObject([{ state: true, pending: false }]);
    vi.useRealTimers();
  });
});
