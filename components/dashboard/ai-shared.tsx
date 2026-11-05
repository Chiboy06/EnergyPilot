"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Zap, ZapOff } from "lucide-react";

// What the assistant can and can't do — shown in every AI entry point.
export const AI_SCOPE_TEXT =
  "Energenius answers energy and electrical-system questions. Answers that use your hub's live readings, " +
  "circuits, open alerts and last 7 days of usage say so; anything else is general AI knowledge and can be wrong. " +
  "It has no forecast or billing data. It can suggest switching one circuit, but nothing switches until you tap Confirm.";

export const AI_SUGGESTIONS = [
  "What's my total power draw right now?",
  "Which circuit is using the most power?",
  "Are there any open alerts?",
  "How did my energy use change this week?",
];

type RelayAction = {
  relayNum: number;
  state: boolean;
  circuitName: string;
  status?: "proposed" | "confirmed" | "cancelled";
};

// Relay suggestion from the AI. Missing status = old message that was executed directly.
export function RelayProposal({
  messageId,
  action,
  canControl,
}: {
  messageId: Id<"aiMessages">;
  action: RelayAction;
  canControl: boolean;
}) {
  const resolve = useMutation(api.ai.resolveRelayProposal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const on = action.state;
  const color = on ? "#18e39a" : "#ff6b6b";

  const decide = async (confirm: boolean) => {
    setBusy(true);
    setError(null);
    try {
      await resolve({ messageId, confirm });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete");
    } finally {
      setBusy(false);
    }
  };

  const statusText =
    action.status === "confirmed" ? "Confirmed — command sent"
    : action.status === "cancelled" ? "Cancelled — nothing switched"
    : action.status === "proposed" ? "Suggested — not switched yet"
    : "Switched (older message)";

  return (
    <div className="mt-2 rounded-[10px] p-2.5" style={{ border: `1px solid ${color}55`, background: `${color}14` }}>
      <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color }}>
        {on ? <Zap size={13} aria-hidden /> : <ZapOff size={13} aria-hidden />}
        Turn {on ? "ON" : "OFF"} · {action.circuitName}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "rgba(203,213,225,0.9)" }}>{statusText}</p>
      {action.status === "proposed" && (
        canControl ? (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => decide(true)}
              disabled={busy}
              className="px-3 py-1 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: color, color: "#03130c" }}
            >
              Confirm
            </button>
            <button
              onClick={() => decide(false)}
              disabled={busy}
              className="px-3 py-1 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(226,232,240,0.95)" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-xs mt-1" style={{ color: "rgba(203,213,225,0.9)" }}>View-only access — you can&apos;t switch relays.</p>
        )
      )}
      {error && <p role="alert" className="text-xs mt-1 text-red-400">{error}</p>}
    </div>
  );
}
