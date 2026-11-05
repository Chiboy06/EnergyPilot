// convex/sharing.ts
// Hub access code system — share read/control access with other users.
//
// How it works (and what the UI must say):
//   - The owner generates one 6-char code per hub, tied to a role.
//   - Anyone signed in who enters the code joins as that role. The code keeps
//     working, for any number of people, until the owner revokes or replaces it.
//   - Revoking a code stops new joins; existing members keep access until the
//     owner removes them individually.

import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { getUser, requireUser } from "./access";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity; 256 % 32 = 0 → unbiased
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => chars[b % chars.length])
    .join("");
}

// The owner's hub being shared: the one in their active facility, else their first hub.
async function ownedActiveHub(ctx: QueryCtx, user: Doc<"users">) {
  const hubs = await ctx.db
    .query("hubs")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .take(50);
  return hubs.find((h) => h.facilityId === user.activeFacilityId) ?? hubs[0] ?? null;
}

// Current access code for the user's own active hub (null if none / not an owner)
export const getAccessCode = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;
    const hub = await ownedActiveHub(ctx, user);
    if (!hub) return null;
    const entry = await ctx.db
      .query("hubAccessCodes")
      .withIndex("by_hub", (q) => q.eq("hubId", hub._id))
      .first();
    return entry ? { ...entry, hubName: hub.name } : null;
  },
});

// Generate a new access code (replaces any existing one)
export const createAccessCode = mutation({
  args: { role: v.optional(v.union(v.literal("viewer"), v.literal("controller"))) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const hub = await ownedActiveHub(ctx, user);
    if (!hub) throw new ConvexError("Only a hub owner can create access codes");

    const existing = await ctx.db
      .query("hubAccessCodes")
      .withIndex("by_hub", (q) => q.eq("hubId", hub._id))
      .take(10);
    for (const e of existing) await ctx.db.delete(e._id);

    let code = generateCode();
    while (await ctx.db.query("hubAccessCodes").withIndex("by_code", (q) => q.eq("code", code)).first()) {
      code = generateCode();
    }
    await ctx.db.insert("hubAccessCodes", {
      hubId:     hub._id,
      ownerId:   user._id,
      code,
      role:      args.role ?? "viewer",
      createdAt: Date.now(),
    });
    return code;
  },
});

// Revoke (delete) the current access code. Existing members are not removed.
export const revokeAccessCode = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const hub = await ownedActiveHub(ctx, user);
    if (!hub) return;
    const existing = await ctx.db
      .query("hubAccessCodes")
      .withIndex("by_hub", (q) => q.eq("hubId", hub._id))
      .take(10);
    for (const e of existing) await ctx.db.delete(e._id);
  },
});

// People who joined the owner's active hub with a code.
export const listMembers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const hub = await ownedActiveHub(ctx, user);
    if (!hub) return [];
    const members = await ctx.db
      .query("hubMembers")
      .withIndex("by_hub", (q) => q.eq("hubId", hub._id))
      .take(100);
    const result = [];
    for (const m of members) {
      const u = await ctx.db.get(m.userId);
      result.push({
        _id:      m._id,
        role:     m.role,
        joinedAt: m.joinedAt,
        name:     [u?.firstName, u?.lastName].filter(Boolean).join(" ") || null,
        email:    u?.email ?? null,
      });
    }
    return result;
  },
});

// Owner removes one member's access immediately.
export const removeMember = mutation({
  args: { memberId: v.id("hubMembers") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const member = await ctx.db.get(args.memberId);
    if (!member) return;
    const hub = await ctx.db.get(member.hubId);
    if (!hub || hub.userId !== user._id) throw new ConvexError("Only the hub owner can remove members");
    await ctx.db.delete(args.memberId);
  },
});

// Join a hub using a 6-char access code
export const joinWithCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const entry = await ctx.db
      .query("hubAccessCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.trim().toUpperCase()))
      .first();
    if (!entry) throw new ConvexError("Invalid or revoked access code");
    if (entry.ownerId === user._id) throw new ConvexError("You already own this hub");

    const existing = await ctx.db
      .query("hubMembers")
      .withIndex("by_hub_user", (q) => q.eq("hubId", entry.hubId).eq("userId", user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { role: entry.role });
    } else {
      await ctx.db.insert("hubMembers", {
        hubId:    entry.hubId,
        userId:   user._id,
        role:     entry.role,
        joinedAt: Date.now(),
      });
    }

    const hub = await ctx.db.get(entry.hubId);
    await ctx.db.patch(user._id, {
      ...(hub?.facilityId ? { activeFacilityId: hub.facilityId } : {}),
      hasCompletedOnboarding: true,
    });

    return { hubId: entry.hubId, hubName: hub?.name ?? "Facility", role: entry.role };
  },
});
