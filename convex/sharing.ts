// convex/sharing.ts
// Hub access code system — share read/control access with other users.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => chars[b % chars.length])
    .join("");
}

// Get current access code for the user's active hub (null if none)
export const getAccessCode = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user?.activeFacilityId) return null;
    const hub = await ctx.db
      .query("hubs")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();
    if (!hub) return null;
    const entry = await ctx.db
      .query("hubAccessCodes")
      .withIndex("by_hub", (q: any) => q.eq("hubId", hub._id))
      .first();
    return entry ?? null;
  },
});

// Generate a new access code (replaces any existing one)
export const createAccessCode = mutation({
  args: { role: v.optional(v.union(v.literal("viewer"), v.literal("controller"))) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const hub = await ctx.db
      .query("hubs")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();
    if (!hub) throw new ConvexError("No hub found");

    // Delete existing code for this hub
    const existing = await ctx.db
      .query("hubAccessCodes")
      .withIndex("by_hub", (q: any) => q.eq("hubId", hub._id))
      .collect();
    for (const e of existing) await ctx.db.delete(e._id);

    const code = generateCode();
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

// Revoke (delete) the current access code
export const revokeAccessCode = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const hub = await ctx.db
      .query("hubs")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();
    if (!hub) return;
    const existing = await ctx.db
      .query("hubAccessCodes")
      .withIndex("by_hub", (q: any) => q.eq("hubId", hub._id))
      .collect();
    for (const e of existing) await ctx.db.delete(e._id);
  },
});

// Join a hub using a 6-char access code
export const joinWithCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const entry = await ctx.db
      .query("hubAccessCodes")
      .withIndex("by_code", (q: any) => q.eq("code", args.code.toUpperCase()))
      .first();
    if (!entry) throw new ConvexError("Invalid or expired access code");
    if (entry.ownerId === user._id) throw new ConvexError("You already own this hub");

    // Upsert membership
    const existing = await ctx.db
      .query("hubMembers")
      .withIndex("by_hub", (q: any) => q.eq("hubId", entry.hubId))
      .filter((q: any) => q.eq(q.field("userId"), user._id))
      .first();

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

    // Get hub for facility reference and hub name
    const hub = await ctx.db.get(entry.hubId);
    if (hub?.facilityId) {
      await ctx.db.patch(user._id, {
        activeFacilityId: hub.facilityId,
        hasCompletedOnboarding: true,
      });
    } else {
      await ctx.db.patch(user._id, {
        hasCompletedOnboarding: true,
      });
    }

    return { hubId: entry.hubId, hubName: hub?.name ?? "Facility", role: entry.role };
  },
});
