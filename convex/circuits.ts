// convex/circuits.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";
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

export const renameCircuit = mutation({
  args: { circuitId: v.id("circuits"), name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const circuit = await ctx.db.get(args.circuitId);
    if (!circuit || circuit.userId !== user._id) throw new ConvexError("Circuit not found");
    await ctx.db.patch(args.circuitId, { name: args.name.trim() });
  },
});
