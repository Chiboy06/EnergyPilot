// convex/relay.ts
// Relay command mutations and queries for circuit breaker control.
//
// Flow:
//   Frontend calls api.relay.sendCommand (mutation)
//     → writes optimistic relayState to Convex
//     → calls internal action relay.publishToIoT
//         → POST to Lambda /relay-command endpoint
//             → Lambda publishes to MQTT energenius/Hub_MAC/commands
//                 → ESP32 Node C → ESP-NOW → Node A actuates relay
//
// Environment variable required in Convex dashboard:
//   RELAY_LAMBDA_URL     — https://<lambda-function-url>/relay-command
//   IOT_RELAY_SECRET     — shared secret matching Lambda RELAY_COMMAND_SECRET

import { v } from "convex/values";
import { mutation, query, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";

// ── Helper: resolve authenticated user ───────────────────────────────────
// Prefers JWT verification; falls back to clerkId arg when
// CLERK_JWT_ISSUER_DOMAIN is not yet set in the Convex environment.
async function requireUser(ctx: any, clerkIdFallback?: string) {
  const identity = await ctx.auth.getUserIdentity();
  const clerkId = identity?.subject ?? clerkIdFallback;
  if (!clerkId) throw new ConvexError("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .unique();

  if (!user) throw new ConvexError("User record not found");
  return user;
}

// ── Helper: verify hub control access (owner or controller) ───────────────
async function requireHubControlAccess(ctx: any, hubId: any, userId: any) {
  const hub = await ctx.db.get(hubId);
  if (!hub) throw new ConvexError("Hub not found");

  // Hub owner has full control
  if (hub.userId === userId) return { hub, role: "owner" };

  // Check hubMembers table for invited members
  const member = await ctx.db
    .query("hubMembers")
    .withIndex("by_hub", (q: any) => q.eq("hubId", hubId))
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .first();

  if (!member) throw new ConvexError("Access denied: Not a member of this hub");

  if (member.role === "viewer") {
    throw new ConvexError("Permission denied: Viewer role cannot actuate circuit relays");
  }

  return { hub, role: member.role };
}

// ── Helper: verify hub read access (owner, controller, or viewer) ─────────
async function requireHubReadAccess(ctx: any, hubId: any, userId: any) {
  const hub = await ctx.db.get(hubId);
  if (!hub) return null;

  if (hub.userId === userId) return hub;

  const member = await ctx.db
    .query("hubMembers")
    .withIndex("by_hub", (q: any) => q.eq("hubId", hubId))
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .first();

  if (!member) return null;

  return hub;
}

// ── Public mutation: send relay command ───────────────────────────────────
// Called directly from Next.js and React Native.
// Writes optimistic state to relayStates table immediately,
// then dispatches async IoT publish so UI updates without waiting for MQTT.
export const sendCommand = mutation({
  args: {
    hubId:    v.id("hubs"),
    relayNum: v.number(),          // 0-15 for individual, 255 for master
    state:    v.boolean(),         // true = ON, false = OFF
    clerkId:  v.optional(v.string()), // fallback for dev without CLERK_JWT_ISSUER_DOMAIN
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkId);
    const { hub } = await requireHubControlAccess(ctx, args.hubId, user._id);

    // Validate relayNum
    if (args.relayNum !== 255 && (args.relayNum < 0 || args.relayNum > 15)) {
      throw new ConvexError("relayNum must be 0-15 or 255 (master)");
    }

    const now = Date.now();

    if (args.relayNum === 255) {
      // Master command — update all relay states at once
      const existing = await ctx.db
        .query("relayStates")
        .withIndex("by_hub", (q: any) => q.eq("hubId", args.hubId))
        .collect();

      for (const rs of existing) {
        await ctx.db.patch(rs._id, {
          state:     args.state,
          updatedAt: now,
          source:    "cloud",
        });
      }
    } else {
      // Individual relay — upsert the specific relay state
      const existing = await ctx.db
        .query("relayStates")
        .withIndex("by_hub_relay", (q: any) =>
          q.eq("hubId", args.hubId).eq("relayNum", args.relayNum)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          state:     args.state,
          updatedAt: now,
          source:    "cloud",
        });
      } else {
        await ctx.db.insert("relayStates", {
          hubId:     args.hubId,
          userId:    user._id,
          relayNum:  args.relayNum,
          state:     args.state,
          updatedAt: now,
          source:    "cloud",
        });
      }
    }

    // Dispatch async MQTT publish — does not block the mutation response
    await ctx.scheduler.runAfter(0, internal.relay.publishToIoT, {
      macAddress: hub.macAddress,
      relayNum:   args.relayNum,
      state:      args.state,
    });

    return { success: true };
  },
});

// ── Internal action: publish to IoT Core via Lambda ───────────────────────
// Runs asynchronously after the mutation completes.
// Uses ctx.scheduler so it doesn't block the UI response.
export const publishToIoT = internalAction({
  args: {
    macAddress: v.string(),
    relayNum:   v.number(),
    state:      v.boolean(),
  },
  handler: async (ctx, args) => {
    const lambdaUrl = process.env.RELAY_LAMBDA_URL;
    const secret    = process.env.IOT_RELAY_SECRET;

    if (!lambdaUrl || !secret) {
      console.error("[Relay] RELAY_LAMBDA_URL or IOT_RELAY_SECRET not set");
      return;
    }

    const response = await fetch(lambdaUrl, {
      method:  "POST",
      headers: {
        "Content-Type":   "application/json",
        "x-relay-secret": secret,
      },
      body: JSON.stringify({
        macAddress: args.macAddress,
        relayNum:   args.relayNum,
        state:      args.state,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[Relay] Lambda returned ${response.status}: ${body}`);
      return;
    }

    console.log(
      `[Relay] Command published: Hub_${args.macAddress} relay=${args.relayNum} state=${args.state}`
    );
  },
});

// ── Public query: get all relay states for a hub ──────────────────────────
// Real-time — Convex pushes updates automatically.
// Returns array sorted by relayNum ascending.
export const getRelayStates = query({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const hub = await requireHubReadAccess(ctx, args.hubId, user._id);
    if (!hub) return [];

    const states = await ctx.db
      .query("relayStates")
      .withIndex("by_hub", (q: any) => q.eq("hubId", args.hubId))
      .collect();

    return states.sort((a: any, b: any) => a.relayNum - b.relayNum);
  },
});

// ── Internal query: look up hub by MAC address ───────────────────────────
// Used by the /relay-command-callback HTTP endpoint to resolve a hub.
export const getHubByMac = internalQuery({
  args: { macAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("hubs")
      .withIndex("by_mac", (q: any) => q.eq("macAddress", args.macAddress))
      .unique();
  },
});

// ── Public mutation: sync relay state from firmware ───────────────────────
// Called when the hub reports a relay state change via MQTT
// (e.g. physical button press on the device panel).
// This keeps Convex in sync with hardware-initiated changes.
export const syncFromFirmware = internalMutation({
  args: {
    hubId:    v.id("hubs"),
    relayNum: v.number(),
    state:    v.boolean(),
  },
  handler: async (ctx, args) => {
    const hub = await ctx.db.get(args.hubId);
    if (!hub) return;

    const now = Date.now();

    const existing = await ctx.db
      .query("relayStates")
      .withIndex("by_hub_relay", (q: any) =>
        q.eq("hubId", args.hubId).eq("relayNum", args.relayNum)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        state:     args.state,
        updatedAt: now,
        source:    "firmware",
      });
    } else {
      await ctx.db.insert("relayStates", {
        hubId:     args.hubId,
        userId:    hub.userId,
        relayNum:  args.relayNum,
        state:     args.state,
        updatedAt: now,
        source:    "firmware",
      });
    }
  },
});