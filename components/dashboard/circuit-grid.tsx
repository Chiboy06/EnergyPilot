"use client";

import { useState } from "react";
import { Loader2, Zap, Wind, Lightbulb, Car, Cpu, Pencil, Check, X as XIcon, AlertTriangle } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useHubData } from "@/hooks/use-hub-data";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { CircuitEnergyModal } from "@/components/dashboard/circuit-energy-modal";
import { CircuitLegend } from "@/components/dashboard/circuit-monitor";
import { circuitLoad, STATUS_COLOR } from "@/lib/circuit-status";
import type { Id } from "@/convex/_generated/dataModel";

interface CircuitGridProps {
  filter: "all" | "active" | "issues";
}

function getLoadTypeIcon(loadType?: string): LucideIcon {
  switch (loadType) {
    case "lighting":   return Lightbulb;
    case "hvac":       return Wind;
    case "ev_charger": return Car;
    case "general":    return Cpu;
    default:           return Zap;
  }
}

export function CircuitGrid({ filter }: CircuitGridProps) {
  const { circuitStates, isLoading, relayStateMap, relayPendingMap, sendCommand, activeHub, userRole } = useHubData();
  const isViewer = userRole === "viewer";
  const isOwner = userRole === "owner";
  const [confirmAllOff, setConfirmAllOff] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalCircuitId, setModalCircuitId] = useState<Id<"circuits"> | null>(null);
  const renameCircuit = useMutation(api.circuits.renameCircuit);

  const anomalies = useQuery(
    api.anomalies.getAnomalies,
    activeHub?._id ? { hubId: activeHub._id, includeResolved: false } : "skip"
  ) ?? [];
  const anomalyCircuitIds = new Set(anomalies.filter((a) => a.circuitId).map((a) => a.circuitId));

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Action failed"); }
  };

  const startEdit = (id: string, name: string) => { setEditingId(id); setEditName(name); };
  const cancelEdit = () => { setEditingId(null); setEditName(""); };
  const commitEdit = async (id: Id<"circuits">) => {
    if (editName.trim()) await run(() => renameCircuit({ circuitId: id, name: editName.trim() }));
    cancelEdit();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (circuitStates.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-base">
        No circuits found. Complete{" "}
        <Link href="/onboarding" className="text-primary hover:underline">onboarding</Link>{" "}
        to set up your facility.
      </div>
    );
  }

  const enriched = circuitStates.map((circuit) => ({ ...circuit, ...circuitLoad(circuit) }));
  const filtered = enriched.filter((c) => {
    if (filter === "active") return c.status === "ACTIVE" || c.status === "HIGH LOAD";
    if (filter === "issues") return c.status === "HIGH LOAD" || anomalyCircuitIds.has(c._id);
    return true;
  });
  const modalCircuit = enriched.find((c) => c._id === modalCircuitId);
  const channelCount = activeHub?.channelCount ?? circuitStates.length;

  return (
    <div className="space-y-5">
      <CircuitLegend />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => activeHub && run(() => sendCommand({ hubId: activeHub._id, relayNum: 255, state: true }))}
            disabled={!activeHub || isViewer}
            className="px-4 py-2 rounded-lg text-base font-semibold transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
            style={{ background: "rgba(24,227,154,0.15)", color: "#18e39a", border: "1px solid rgba(24,227,154,0.3)" }}
          >
            All ON
          </button>
          <button
            onClick={() => setConfirmAllOff(true)}
            disabled={!activeHub || isViewer}
            className="px-4 py-2 rounded-lg text-base font-semibold transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
            style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            All OFF
          </button>
        </div>

        {isViewer && (
          <div className="px-3 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 text-sm font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            View only — your role can&apos;t switch relays
          </div>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      {confirmAllOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div role="dialog" aria-modal="true" className="glass-card p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-white font-semibold text-lg">Turn off all circuits?</h3>
            <p className="text-base" style={{ color: "rgba(148,163,184,0.9)" }}>
              This sends OFF to all {channelCount} relays on this hub. Running loads will be interrupted.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { if (activeHub) run(() => sendCommand({ hubId: activeHub._id, relayNum: 255, state: false })); setConfirmAllOff(false); }}
                className="flex-1 py-2 rounded-lg text-base font-semibold"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                Yes, turn all off
              </button>
              <button
                onClick={() => setConfirmAllOff(false)}
                className="flex-1 py-2 rounded-lg text-base font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {filtered.map((circuit) => {
          const { pct, status } = circuit;
          const Icon = getLoadTypeIcon(circuit.loadType);
          const hasAnomaly = anomalyCircuitIds.has(circuit._id);
          const barColor = status === "HIGH LOAD" ? "#ffb547" : "#18e39a";
          const relay = relayStateMap[circuit.channelIndex];
          const pending = relayPendingMap[circuit.channelIndex];
          const isEditing = editingId === circuit._id;
          const label = `CH${circuit.channelIndex + 1} · ${circuit.name}`;

          return (
            <div
              key={circuit._id}
              className="glass-card relative p-5 transition-all cursor-pointer hover:ring-1 hover:ring-emerald-500/30"
              onClick={() => !isEditing && setModalCircuitId(circuit._id)}
            >
              {hasAnomaly && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(255,107,107,0.15)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.3)" }}>
                  <AlertTriangle size={11} /> Open alert
                </div>
              )}

              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-[9px]" style={{ background: "rgba(24,227,154,0.10)", color: "#18e39a" }} aria-hidden>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0" onClick={(e) => isEditing && e.stopPropagation()}>
                  <p className="text-sm font-mono" style={{ color: "rgba(148,163,184,0.9)" }}>CH{circuit.channelIndex + 1}</p>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={editName}
                        maxLength={40}
                        aria-label={`New name for CH${circuit.channelIndex + 1}`}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdit(circuit._id); if (e.key === "Escape") cancelEdit(); }}
                        className="bg-transparent border-b text-white text-base outline-none w-32"
                        style={{ borderColor: "#18e39a" }}
                      />
                      <button aria-label="Save name" onClick={() => commitEdit(circuit._id)} className="text-emerald-400 hover:text-emerald-300"><Check size={15} /></button>
                      <button aria-label="Cancel rename" onClick={cancelEdit} className="text-slate-400 hover:text-slate-200"><XIcon size={15} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-white text-lg truncate">{circuit.name}</h3>
                      {isOwner && (
                        <button
                          aria-label={`Rename ${label}`}
                          onClick={(e) => { e.stopPropagation(); startEdit(circuit._id, circuit.name); }}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <div className="font-mono font-bold text-3xl text-white leading-none">
                  {circuit.hasReading ? Math.round(circuit.powerW).toLocaleString() : "—"}
                  <span className="text-base font-normal ml-1" style={{ color: "rgba(148,163,184,0.85)" }}>W (est.)</span>
                </div>
                <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,0.85)" }}>
                  {circuit.hasReading ? `${circuit.currentAmps.toFixed(2)} A measured on this circuit` : "No reading for this channel"}
                </p>
              </div>

              <div className="mb-3">
                <span className="text-sm font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: STATUS_COLOR[status], border: `1px solid ${STATUS_COLOR[status]}55` }}>
                  {status}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5 text-sm" style={{ color: "rgba(148,163,184,0.85)" }}>
                  <span>Load vs rating</span>
                  <span className="font-mono">{pct !== null ? `${pct}% of ${circuit.maxAmps} A` : "No rating configured"}</span>
                </div>
                {pct !== null && (
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
                  </div>
                )}
              </div>

              <div
                className="flex items-center justify-between pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-sm" style={{ color: "rgba(148,163,184,0.85)" }}>
                  Relay: {pending ? "command sent, awaiting hub" : relay === undefined ? "state unknown" : relay ? "ON" : "OFF"}
                </span>
                <Switch
                  checked={relay === true}
                  disabled={isViewer || !activeHub || pending}
                  onCheckedChange={(checked) => {
                    if (activeHub) run(() => sendCommand({ hubId: activeHub._id, relayNum: circuit.channelIndex, state: checked }));
                  }}
                  aria-label={`Relay for ${label}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {modalCircuit && (
        <CircuitEnergyModal
          circuitId={modalCircuit._id}
          circuitName={modalCircuit.name}
          loadType={modalCircuit.loadType}
          channelIndex={modalCircuit.channelIndex}
          maxAmps={modalCircuit.maxAmps}
          canEditRating={isOwner}
          onClose={() => setModalCircuitId(null)}
        />
      )}
    </div>
  );
}
