// convex/onboarding.ts
// Mutations and queries for the multi-step onboarding flow.
//
// Onboarding step order:
//   1. createFacility       — user names their facility and selects type
//   2. registerHub          — user enters MAC address and hub name
//   3. createCircuits       — user names their circuits (N = hub.channelCount)
//   4. completeOnboarding   — marks user.hasCompletedOnboarding = true
//
// All mutations are authenticated — they resolve the caller's userId
// from the Clerk JWT automatically. No userId in args required.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";
import { getUser, requireUser, getHubReadAccess, requireHubOwner } from "./access";

// Normalise a hub serial to "AA:BB:CC:DD:EE:FF". Throws unless it is exactly 12 hex digits,
// otherwise the hub would never match its telemetry.
function normaliseMac(raw: string): string {
  const hex = raw.toUpperCase().replace(/[^A-F0-9]/g, "");
  if (hex.length !== 12 || raw.replace(/[\s:\-.]/g, "").length !== 12) {
    throw new ConvexError("Serial must be the hub's 12-digit MAC address, e.g. EC:E3:34:66:98:3C");
  }
  return hex.replace(/(.{2})(?=.)/g, "$1:");
}

// ── Step 1: Create facility ───────────────────────────────────────────────
export const createFacility = mutation({
  args: {
    name:            v.string(),
    type: v.union(
      v.literal("residential"),
      v.literal("office"),
      v.literal("institution"),
      v.literal("industrial")
    ),
    breakerCapacity: v.optional(v.number()),
    rooms:           v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const facilityId = await ctx.db.insert("facilities", {
      userId:          user._id,
      name:            args.name,
      type:            args.type,
      breakerCapacity: args.breakerCapacity,
      rooms:           args.rooms,
      createdAt:       Date.now(),
    });

    // Set as user's active facility
    await ctx.db.patch(user._id, { activeFacilityId: facilityId });

    return facilityId;
  },
});

// ── Step 2: Register hub ──────────────────────────────────────────────────
// macAddress must match the ESP32 Thing name: "Hub_<macAddress>"
// channelCount is set here — determines how many circuits to create in step 3.
export const registerHub = mutation({
  args: {
    facilityId:   v.id("facilities"),
    name:         v.string(),
    macAddress:   v.string(),
    channelCount: v.union(
      v.literal(8),
      v.literal(16),
      v.literal(24),
      v.literal(32)
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Verify the facility belongs to this user
    const hubs = await listAccessibleHubs(ctx, user._id);
    if (!hubs.some((h) => h.facilityId === args.facilityId)) {
      throw new ConvexError("Facility not found");
    }

    const mac = normaliseMac(args.macAddress);

    // Check for duplicate MAC address across all users
    const existing = await ctx.db
      .query("hubs")
      .withIndex("by_mac", (q) => q.eq("macAddress", mac))
      .unique();

    if (existing) {
      throw new ConvexError("A hub with this MAC address is already registered");
    }

    const hubId = await ctx.db.insert("hubs", {
      userId:       user._id,
      facilityId:   args.facilityId,
      name:         args.name,
      macAddress:   mac,
      channelCount: args.channelCount,
      status:       "provisioning",
      createdAt:    Date.now(),
    });

    return { hubId, macAddress: mac };
  },
});

// ── Step 3: Create circuits ───────────────────────────────────────────────
// Creates one circuit record per channel.
// circuits array length must equal hub.channelCount.
// channelIndex is assigned automatically (0-based) — immutable after creation.
export const createCircuits = mutation({
  args: {
    hubId: v.id("hubs"),
    circuits: v.array(v.object({
      name:     v.string(),
      roomName: v.optional(v.string()),
      loadType: v.optional(v.union(
        v.literal("lighting"),
        v.literal("hvac"),
        v.literal("appliance"),
        v.literal("ev_charger"),
        v.literal("general"),
        v.literal("other")
      )),
      maxAmps: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const hub = await ctx.db.get(args.hubId);
    if (!hub || hub.userId !== user._id) {
      throw new ConvexError("Hub not found");
    }

    if (args.circuits.length !== hub.channelCount) {
      throw new ConvexError(
        `Expected ${hub.channelCount} circuits, received ${args.circuits.length}`
      );
    }

    const circuitIds: string[] = [];

    for (let i = 0; i < args.circuits.length; i++) {
      const c = args.circuits[i];
      const id = await ctx.db.insert("circuits", {
        userId:       user._id,
        hubId:        args.hubId,
        facilityId:   hub.facilityId,
        channelIndex: i,
        name:         c.name,
        roomName:     c.roomName,
        loadType:     c.loadType,
        maxAmps:      c.maxAmps,
        isActive:     true,
        createdAt:    Date.now(),
      });
      circuitIds.push(id);
    }

    return circuitIds;
  },
});

// ── Step 4: Complete onboarding (all-in-one) ─────────────────────────────
// Creates facility, registers hub, and auto-names circuits "Circuit 1…N".
// Users rename individual circuits (appliances) from the dashboard later.
export const completeOnboarding = mutation({
  args: {
    // shortcut: accepted+ignored for old native builds, delete after next EAS release
    clerkId:         v.optional(v.string()),
    serialNumber:    v.string(),
    hubName:         v.string(),
    facilityName:    v.string(),
    facilityType:    v.union(
      v.literal("residential"),
      v.literal("office"),
      v.literal("institution"),
      v.literal("industrial")
    ),
    channelCount:    v.union(
      v.literal(8),
      v.literal(16),
      v.literal(24),
      v.literal(32)
    ),
    breakerCapacity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!(args.breakerCapacity > 0)) throw new ConvexError("Breaker capacity must be greater than 0 A");
    const mac = normaliseMac(args.serialNumber);

    // 1. Create facility
    const facilityId = await ctx.db.insert("facilities", {
      userId:          user._id,
      name:            args.facilityName,
      type:            args.facilityType,
      breakerCapacity: args.breakerCapacity,
      createdAt:       Date.now(),
    });

    await ctx.db.patch(user._id, { activeFacilityId: facilityId });

    const existingHub = await ctx.db
      .query("hubs")
      .withIndex("by_mac", (q) => q.eq("macAddress", mac))
      .unique();

    if (existingHub) {
      throw new ConvexError("A hub with this MAC address is already registered");
    }

    const hubId = await ctx.db.insert("hubs", {
      userId:       user._id,
      facilityId,
      name:         args.hubName || "Hub",
      macAddress:   mac,
      channelCount: args.channelCount,
      status:       "provisioning",
      createdAt:    Date.now(),
    });

    // 3. Auto-create one circuit per channel — users rename from dashboard
    for (let i = 0; i < args.channelCount; i++) {
      await ctx.db.insert("circuits", {
        userId:       user._id,
        hubId,
        facilityId,
        channelIndex: i,
        name:         `Circuit ${i + 1}`,
        isActive:     true,
        createdAt:    Date.now(),
      });
    }

    // 4. Mark onboarding complete
    await ctx.db.patch(user._id, { hasCompletedOnboarding: true });
  },
});

// ── Queries ───────────────────────────────────────────────────────────────

// Hubs the user can see: owned ones plus ones joined with an access code.
async function listAccessibleHubs(ctx: QueryCtx, userId: Id<"users">) {
  const owned = await ctx.db
    .query("hubs")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(50);
  const memberships = await ctx.db
    .query("hubMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(50);
  const shared = [];
  for (const m of memberships) {
    const hub = await ctx.db.get(m.hubId);
    if (hub) shared.push({ ...hub, role: m.role });
  }
  return [...owned.map((h) => ({ ...h, role: "owner" as const })), ...shared];
}

// List facilities the current user owns or has joined
export const listFacilities = query({
  // shortcut: clerkId accepted+ignored for old native builds, delete after next EAS release
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const hubs = await listAccessibleHubs(ctx, user._id);
    const facilities = [];
    for (const id of new Set(hubs.map((h) => h.facilityId))) {
      const f = await ctx.db.get(id);
      if (f) facilities.push(f);
    }
    return facilities;
  },
});

// List hubs the current user owns or has joined, each with the caller's role
export const listHubs = query({
  // shortcut: clerkId accepted+ignored for old native builds, delete after next EAS release
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];
    return await listAccessibleHubs(ctx, user._id);
  },
});

// List circuits for a specific hub
export const listCircuits = query({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    if (!(await getHubReadAccess(ctx, args.hubId))) return [];
    return await ctx.db
      .query("circuits")
      .withIndex("by_hub", (q) => q.eq("hubId", args.hubId))
      .take(64);
  },
});

// ── Set active facility ───────────────────────────────────────────────────
export const renameHub = mutation({
  args: { hubId: v.id("hubs"), name: v.string() },
  handler: async (ctx, args) => {
    await requireHubOwner(ctx, args.hubId);
    const name = args.name.trim();
    if (!name) throw new ConvexError("Name cannot be empty");
    await ctx.db.patch(args.hubId, { name });
  },
});

export const setActiveFacility = mutation({
  args: { facilityId: v.id("facilities") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const hubs = await listAccessibleHubs(ctx, user._id);
    if (!hubs.some((h) => h.facilityId === args.facilityId)) {
      throw new ConvexError("Facility not found");
    }

    await ctx.db.patch(user._id, { activeFacilityId: args.facilityId });
  },
});