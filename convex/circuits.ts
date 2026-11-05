// convex/circuits.ts
import { v, ConvexError } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./access";

// Owner only — members can't rename circuits.
export const renameCircuit = mutation({
  args: { circuitId: v.id("circuits"), name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const circuit = await ctx.db.get(args.circuitId);
    if (!circuit || circuit.userId !== user._id) throw new ConvexError("Circuit not found");
    const name = args.name.trim();
    if (!name || name.length > 40) throw new ConvexError("Name must be 1-40 characters");
    await ctx.db.patch(args.circuitId, { name });
  },
});
