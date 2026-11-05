// convex/access.ts
// Shared auth + hub access helpers. Identity always comes from the Clerk JWT,
// never from a client-supplied argument.

import { ConvexError } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

export type HubRole = "owner" | "controller" | "viewer";

// Returns the signed-in user, or null when not signed in / not yet synced.
export async function getUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

export async function requireUser(ctx: QueryCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");
  const user = await getUser(ctx);
  if (!user) throw new ConvexError("User record not found");
  return user;
}

// Owner, or a member who joined with an access code. Null when no access.
export async function getHubRole(
  ctx: QueryCtx,
  hubId: Id<"hubs">,
  userId: Id<"users">
): Promise<{ hub: Doc<"hubs">; role: HubRole } | null> {
  const hub = await ctx.db.get(hubId);
  if (!hub) return null;
  if (hub.userId === userId) return { hub, role: "owner" };
  const member = await ctx.db
    .query("hubMembers")
    .withIndex("by_hub_user", (q) => q.eq("hubId", hubId).eq("userId", userId))
    .unique();
  return member ? { hub, role: member.role } : null;
}

// For queries: null when the caller can't read this hub (UI shows empty state).
export async function getHubReadAccess(ctx: QueryCtx, hubId: Id<"hubs">) {
  const user = await getUser(ctx);
  if (!user) return null;
  const access = await getHubRole(ctx, hubId, user._id);
  return access ? { ...access, user } : null;
}

export async function requireHubControlAccess(ctx: QueryCtx, hubId: Id<"hubs">) {
  const user = await requireUser(ctx);
  const access = await getHubRole(ctx, hubId, user._id);
  if (!access) throw new ConvexError("Access denied: not a member of this hub");
  if (access.role === "viewer") {
    throw new ConvexError("Permission denied: viewers cannot switch relays");
  }
  return { ...access, user };
}

export async function requireHubOwner(ctx: QueryCtx, hubId: Id<"hubs">) {
  const user = await requireUser(ctx);
  const hub = await ctx.db.get(hubId);
  if (!hub || hub.userId !== user._id) throw new ConvexError("Hub not found");
  return { hub, user };
}
