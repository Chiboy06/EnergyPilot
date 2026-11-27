// convex/relay.ts
// Relay command mutations and queries for circuit breaker control.
//
// Flow:
//   Frontend calls api.relay.sendCommand (mutation)
//     → writes relayState with pending: true
//     → calls internal action relay.publishToIoT
//         → POST to Lambda /relay-command endpoint
//             → Lambda publishes to MQTT energenius/Hub_MAC/commands
//                 → ESP32 Node C → ESP-NOW → Node A actuates relay
//     → firmware reports back via /relay-command-callback → syncFromFirmware clears pending
//
// Environment variable required in Convex dashboard:
//   RELAY_LAMBDA_URL     — https://<lambda-function-url>/relay-command
//   IOT_RELAY_SECRET     — shared secret matching Lambda RELAY_COMMAND_SECRET

import { v, ConvexError } from "convex/values";
import { mutation, query, internalAction, internalQuery, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getHubReadAccess, requireHubControlAccess } from "./access";

const MASTER = 255;
// No confirmation from the hub within this time = the command was lost; revert.
const ACK_TIMEOUT_MS = 20_000;

// Upsert one relay's state. Returns the previous state (undefined = never known).
async function writeRelay(
  ctx: MutationCtx,
  hubId: Id<"hubs">,
  userId: Id<"users">,
  relayNum: number,
  fields: { state: boolean; source: "cloud" | "firmware"; pending: boolean }
): Promise<boolean | undefined> {
  const existing = await ctx.db
    .query("relayStates")
    .withIndex("by_hub_relay", (q) => q.eq("hubId", hubId).eq("relayNum", relayNum))
    .unique();
  const updatedAt = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, { ...fields, updatedAt });
    return existing.state;
  }
  await ctx.db.insert("relayStates", { hubId, userId, relayNum, ...fields, updatedAt });
  return undefined;
}

// ── Public mutation: send relay command ───────────────────────────────────
// Called from Next.js and React Native. Requires owner or controller role.
export const sendCommand = mutation({
  args: {
    hubId:    v.id("hubs"),
    relayNum: v.number(),          // 0..channelCount-1 for one relay, 255 for all
    state:    v.boolean(),         // true = ON, false = OFF
    // shortcut: accepted+ignored for old native builds, delete after next EAS release
    clerkId:  v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { hub } = await requireHubControlAccess(ctx, args.hubId);

    const isMaster = args.relayNum === MASTER;
    if (!isMaster && (!Number.isInteger(args.relayNum) || args.relayNum < 0 || args.relayNum >= hub.channelCount)) {
      throw new ConvexError(`relayNum must be 0-${hub.channelCount - 1} or 255 (all)`);
    }

    const relays = isMaster
      ? Array.from({ length: hub.channelCount }, (_, i) => i)
      : [args.relayNum];
    const previous: { relayNum: number; state?: boolean }[] = [];
    for (const relayNum of relays) {
      const state = await writeRelay(ctx, hub._id, hub.userId, relayNum, {
        state: args.state, source: "cloud", pending: true,
      });
      previous.push({ relayNum, state });
    }

    await ctx.scheduler.runAfter(0, internal.relay.publishToIoT, {
      hubId:      hub._id,
      macAddress: hub.macAddress,
      relayNum:   args.relayNum,
      state:      args.state,
      previous,
    });
    await ctx.scheduler.runAfter(ACK_TIMEOUT_MS, internal.relay.rollback, { hubId: hub._id, previous });

    return { success: true };
  },
});

// ── Internal action: publish to IoT Core via Lambda ───────────────────────
// On failure the optimistic state is rolled back so the UI never shows a
// switch position the hardware never received.
export const publishToIoT = internalAction({
  args: {
    hubId:      v.id("hubs"),
    macAddress: v.string(),
    relayNum:   v.number(),
    state:      v.boolean(),
    previous:   v.array(v.object({ relayNum: v.number(), state: v.optional(v.boolean()) })),
  },
  handler: async (ctx, args) => {
    const lambdaUrl = process.env.RELAY_LAMBDA_URL;
    const secret    = process.env.IOT_RELAY_SECRET;

    let error: string | null = null;
    if (!lambdaUrl || !secret) {
      error = "RELAY_LAMBDA_URL or IOT_RELAY_SECRET not set";
    } else {
      try {
        const response = await fetch(lambdaUrl, {
          method:  "POST",
          headers: { "Content-Type": "application/json", "x-relay-secret": secret },
          body: JSON.stringify({ macAddress: args.macAddress, relayNum: args.relayNum, state: args.state }),
        });
        if (!response.ok) error = `Lambda returned ${response.status}: ${await response.text()}`;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
    }

    if (error) {
      console.error(`[Relay] ${error}`);
      await ctx.runMutation(internal.relay.rollback, { hubId: args.hubId, previous: args.previous });
      return;
    }
    console.log(`[Relay] Command published: Hub_${args.macAddress} relay=${args.relayNum} state=${args.state}`);
  },
});

// Restore pre-command states after a failed publish. Never-known relays are removed (= Unknown).
export const rollback = internalMutation({
  args: {
    hubId:    v.id("hubs"),
    previous: v.array(v.object({ relayNum: v.number(), state: v.optional(v.boolean()) })),
  },
  handler: async (ctx, args) => {
    // While the demo feed runs it stands in for the hub and confirms commands itself.
    const hub = await ctx.db.get(args.hubId);
    if ((hub?.demoLiveUntil ?? 0) > Date.now()) return;
    for (const p of args.previous) {
      const doc = await ctx.db
        .query("relayStates")
        .withIndex("by_hub_relay", (q) => q.eq("hubId", args.hubId).eq("relayNum", p.relayNum))
        .unique();
      if (!doc || !doc.pending) continue; // firmware already reported the real state
      if (p.state === undefined) await ctx.db.delete(doc._id);
      else await ctx.db.patch(doc._id, { state: p.state, pending: false, updatedAt: Date.now() });
    }
  },
});

// ── Public query: get all relay states for a hub ──────────────────────────
// Owner, controller or viewer. Sorted by relayNum ascending.
export const getRelayStates = query({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    const access = await getHubReadAccess(ctx, args.hubId);
    if (!access) return [];
    const states = await ctx.db
      .query("relayStates")
      .withIndex("by_hub", (q) => q.eq("hubId", args.hubId))
      .take(64);
    return states.sort((a, b) => a.relayNum - b.relayNum);
  },
});

// ── Internal query: look up hub by MAC address ───────────────────────────
// Used by the /relay-command-callback HTTP endpoint to resolve a hub.
export const getHubByMac = internalQuery({
  args: { macAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("hubs")
      .withIndex("by_mac", (q) => q.eq("macAddress", args.macAddress))
      .unique();
  },
});

// ── Internal mutation: sync relay state from firmware ─────────────────────
// Called when the hub reports a relay state (button press or command ack).
// Firmware is the ground truth, so this clears any pending flag.
export const syncFromFirmware = internalMutation({
  args: {
    hubId:    v.id("hubs"),
    relayNum: v.number(),
    state:    v.boolean(),
  },
  handler: async (ctx, args) => {
    const hub = await ctx.db.get(args.hubId);
    if (!hub) return;
    if (!Number.isInteger(args.relayNum) || args.relayNum < 0 || args.relayNum >= hub.channelCount) return;
    await writeRelay(ctx, hub._id, hub.userId, args.relayNum, {
      state: args.state, source: "firmware", pending: false,
    });
  },
});
