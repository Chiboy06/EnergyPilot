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
import type { Id } from "@/convex/_generated/dataModel";

const VOLTAGE = 220;
const POWER_FACTOR = 0.85;

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
  const { circuitStates, breakerCapacity, isLoading, relayStateMap, sendCommand, activeHub, userRole } = useHubData();
  const isViewer = userRole === 'viewer';
  const [confirmAllOff, setConfirmAllOff] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [modalCircuit, setModalCircuit] = useState<{
    _id: Id<"circuits">;
    name: string;
    loadType?: string;
    channelIndex: number;
  } | null>(null);
  const renameCircuit = useMutation(api.circuits.renameCircuit);

  const anomalies = useQuery(
    api.anomalies.getAnomalies,
    activeHub?._id ? { hubId: activeHub._id, includeResolved: false } : "skip"
  ) ?? [];

  // Set of circuitIds with active anomalies
  const anomalyCircuitIds = new Set(
    anomalies.filter((a: any) => a.circuitId).map((a: any) => a.circuitId)
  );

  const startEdit = (id: string, name: string) => { setEditingId(id); setEditName(name); };
  const cancelEdit = () => { setEditingId(null); setEditName(""); };
  const commitEdit = async (id: string) => {
    if (editName.trim()) await renameCircuit({ circuitId: id as any, name: editName.trim() });
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
      <div className="text-center py-16 text-muted-foreground text-sm">
        No circuits found. Complete{" "}
        <Link href="/onboarding" className="text-primary hover:underline">onboarding</Link>{" "}
        to set up your facility.
      </div>
    );
  }

  const enriched = circuitStates.map((circuit) => {
    const maxW = (circuit.maxAmps ?? breakerCapacity) * VOLTAGE * POWER_FACTOR;
    const percentage = maxW > 0 ? Math.min(100, Math.round((circuit.powerW / maxW) * 100)) : 0;
    const status = percentage === 0 ? "OFFLINE" : percentage >= 85 ? "HIGH LOAD" : "ACTIVE";
    return { ...circuit, percentage, status };
  });

  const filtered = enriched.filter((c) => {
    if (filter === "active") return c.powerW > 0;
    if (filter === "issues") return c.percentage >= 85 || anomalyCircuitIds.has(c._id);
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Master controls & Viewer Role Lock Notice */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => !isViewer && activeHub && sendCommand({ hubId: activeHub._id, relayNum: 255, state: true })}
            disabled={!activeHub || isViewer}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isViewer ? 'opacity-45 cursor-not-allowed' : ''}`}
            style={{ background: "rgba(24,227,154,0.15)", color: "#18e39a", border: "1px solid rgba(24,227,154,0.3)" }}
          >
            All ON
          </button>
          <button
            onClick={() => !isViewer && setConfirmAllOff(true)}
            disabled={!activeHub || isViewer}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isViewer ? 'opacity-45 cursor-not-allowed' : ''}`}
            style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            All OFF
          </button>
        </div>

        {isViewer && (
          <div className="px-3 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            View Only (Read-Only Role)
          </div>
        )}
      </div>

      {/* All OFF confirmation */}
      {confirmAllOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="glass-card p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-white font-semibold text-[15px]">Turn off all circuits?</h3>
            <p className="text-[13px]" style={{ color: "rgba(100,116,139,0.9)" }}>
              This will de-energise all 16 relays immediately.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { if (activeHub) sendCommand({ hubId: activeHub._id, relayNum: 255, state: false }); setConfirmAllOff(false); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                Yes, turn all off
              </button>
              <button
                onClick={() => setConfirmAllOff(false)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Circuit cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {filtered.map((circuit) => {
          const { percentage, status } = circuit;
          const Icon = getLoadTypeIcon(circuit.loadType);
          const isHighLoad = status === "HIGH LOAD";
          const hasAnomaly = anomalyCircuitIds.has(circuit._id);
          const barColor = isHighLoad ? "#ffb547" : "#18e39a";
          const statusColor = isHighLoad ? "rgba(255,181,71,1)" : status === "OFFLINE" ? "rgba(88,105,128,0.8)" : "#18e39a";
          const statusBg = isHighLoad ? "rgba(255,181,71,0.12)" : status === "OFFLINE" ? "rgba(88,105,128,0.12)" : "rgba(24,227,154,0.12)";
          const statusBorder = isHighLoad ? "rgba(255,181,71,0.3)" : status === "OFFLINE" ? "rgba(88,105,128,0.3)" : "rgba(24,227,154,0.3)";
          const isOn = relayStateMap[circuit.channelIndex] ?? false;
          const isEditing = editingId === circuit._id;

          return (
            <div
              key={circuit._id}
              className="glass-card relative p-5 transition-all cursor-pointer hover:ring-1 hover:ring-emerald-500/30"
              onClick={() => setModalCircuit({ _id: circuit._id as Id<"circuits">, name: circuit.name, loadType: circuit.loadType, channelIndex: circuit.channelIndex })}
            >
              {hasAnomaly && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: "rgba(255,107,107,0.15)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.3)" }}>
                  <AlertTriangle size={9} /> Alert
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-[9px]" style={{ background: "rgba(24,227,154,0.10)", color: "#18e39a" }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(circuit._id); if (e.key === "Escape") cancelEdit(); }}
                          className="bg-transparent border-b text-white text-[13px] outline-none w-28"
                          style={{ borderColor: "#18e39a" }}
                        />
                        <button onClick={() => commitEdit(circuit._id)} className="text-emerald-400 hover:text-emerald-300"><Check size={13} /></button>
                        <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-300"><XIcon size={13} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-white text-[14px]">{circuit.name}</h3>
                        <button onClick={() => startEdit(circuit._id, circuit.name)} className="text-slate-600 hover:text-slate-400 transition-colors">
                          <Pencil size={11} />
                        </button>
                      </div>
                    )}
                    <p className="text-[11px]" style={{ color: "rgba(88,105,128,0.9)" }}>CH{circuit.channelIndex + 1}</p>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="font-mono font-bold text-[26px] text-white leading-none">
                  {Math.round(circuit.powerW).toLocaleString()}
                  <span className="text-[12px] font-normal ml-1" style={{ color: "rgba(100,116,139,0.8)" }}>W</span>
                </div>
              </div>

              <div className="mb-3">
                <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: statusColor, background: statusBg, border: `1px solid ${statusBorder}` }}>
                  {status}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11.5px]" style={{ color: "rgba(100,116,139,0.8)" }}>Load</span>
                  <span className="text-[11.5px] font-mono" style={{ color: "rgba(148,163,184,0.8)" }}>{percentage}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, background: barColor }} />
                </div>
              </div>

              <div
                className="flex items-center justify-between pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[11px]" style={{ color: "rgba(100,116,139,0.8)" }}>
                  Pred:{" "}
                  <span className="font-mono font-medium" style={{ color: "#18e39a" }}>
                    {Math.round(circuit.powerW * 0.95)} W
                  </span>
                </span>
                <Switch
                  checked={isOn}
                  disabled={isViewer}
                  onCheckedChange={(checked) => {
                    if (!isViewer && activeHub) sendCommand({ hubId: activeHub._id, relayNum: circuit.channelIndex, state: checked });
                  }}
                  aria-label={`Toggle ${circuit.name}`}
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
          onClose={() => setModalCircuit(null)}
        />
      )}
    </div>
  );
}
