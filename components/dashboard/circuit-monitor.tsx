"use client";

import { useState } from "react";
import { Power, Loader2, Zap, Wind, Lightbulb, Car, Cpu } from "lucide-react";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useHubData } from "@/hooks/use-hub-data";
import { circuitLoad, STATUS_COLOR, STATUS_LEGEND } from "@/lib/circuit-status";

function getLoadTypeIcon(loadType?: string): LucideIcon {
  switch (loadType) {
    case "lighting":   return Lightbulb;
    case "hvac":       return Wind;
    case "ev_charger": return Car;
    case "general":    return Cpu;
    default:           return Zap;
  }
}

export function CircuitLegend() {
  return (
    <p className="text-sm leading-relaxed" style={{ color: "rgba(148,163,184,0.85)" }}>
      {STATUS_LEGEND.map((l, i) => (
        <span key={l.status}>
          {i > 0 && " · "}
          <span className="font-semibold" style={{ color: STATUS_COLOR[l.status] }}>{l.status}</span> = {l.meaning}
        </span>
      ))}
      {" · "}Watts are estimated from measured current × hub voltage × 0.85 power factor.
    </p>
  );
}

export function CircuitMonitor() {
  const { circuitStates, facilityName, isLoading, relayStateMap, relayPendingMap, sendCommand, activeHub, userRole } = useHubData();
  const [error, setError] = useState<string | null>(null);
  const canControl = userRole !== "viewer";

  const toggle = async (relayNum: number, state: boolean) => {
    if (!activeHub) return;
    setError(null);
    try {
      await sendCommand({ hubId: activeHub._id, relayNum, state });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Relay command failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] uppercase mb-1" style={{ color: "rgba(148,163,184,0.8)" }}>
            {facilityName || "Facility"} · individual circuits · live
          </p>
          <h2 className="text-xl lg:text-2xl font-semibold text-white">Circuit Monitor</h2>
        </div>
        <Link href="/dashboard/circuits" className="text-sm lg:text-base font-medium" style={{ color: "#18e39a" }}>
          View all {circuitStates.length} →
        </Link>
      </div>

      <div className="mb-4"><CircuitLegend /></div>
      {error && <p role="alert" className="mb-3 text-sm text-red-400">{error}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="text-emerald-400 animate-spin" />
        </div>
      ) : circuitStates.length === 0 ? (
        <div className="text-center py-12 text-base" style={{ color: "rgba(148,163,184,0.85)" }}>
          No circuits configured.{" "}
          <Link href="/dashboard/settings" style={{ color: "#18e39a" }}>Check device status</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {circuitStates.slice(0, 6).map((circuit) => {
            const { pct, status } = circuitLoad(circuit);
            const barColor = status === "HIGH LOAD" ? "#ffb547" : "#18e39a";
            const Icon = getLoadTypeIcon(circuit.loadType);
            const relay = relayStateMap[circuit.channelIndex];
            const pending = relayPendingMap[circuit.channelIndex];
            const label = `CH${circuit.channelIndex + 1} · ${circuit.name}`;

            return (
              <div key={circuit._id} className="glass-card p-4 lg:p-5 eg-anim-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-[10px] grid place-items-center flex-none"
                    style={{ background: "rgba(24,227,154,0.10)", color: "#18e39a" }} aria-hidden>
                    <Icon size={17} />
                  </div>
                  <button
                    onClick={() => toggle(circuit.channelIndex, relay === undefined ? false : !relay)}
                    disabled={!canControl || !activeHub || pending}
                    aria-label={`${label}: relay ${relay === undefined ? "state unknown" : relay ? "on" : "off"}${pending ? ", command pending" : ""}. ${relay === false ? "Turn on" : "Turn off"}`}
                    title={!canControl ? "View-only access" : relay === undefined ? "Relay state unknown — sends OFF" : undefined}
                    className="h-9 px-2.5 flex items-center gap-1.5 rounded-[9px] text-xs font-semibold transition-colors disabled:opacity-50"
                    style={{
                      background: relay ? "rgba(24,227,154,0.15)" : relay === false ? "rgba(239,68,68,0.10)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${relay ? "rgba(24,227,154,0.3)" : relay === false ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.12)"}`,
                      color: relay ? "#18e39a" : relay === false ? "#f87171" : "rgba(148,163,184,0.9)",
                    }}
                  >
                    <Power size={14} />
                    {pending ? "…" : relay === undefined ? "?" : relay ? "ON" : "OFF"}
                  </button>
                </div>

                <div className="mb-3">
                  <p className="text-base font-semibold text-white leading-tight">
                    <span className="font-mono" style={{ color: "rgba(148,163,184,0.9)" }}>CH{circuit.channelIndex + 1}</span> · {circuit.name}
                  </p>
                  <p className="font-mono font-bold text-3xl text-white leading-tight mt-1">
                    {circuit.hasReading ? Math.round(circuit.powerW).toLocaleString() : "—"}{" "}
                    <span className="text-base font-normal" style={{ color: "rgba(148,163,184,0.85)" }}>W</span>
                  </p>
                  <p className="text-sm" style={{ color: "rgba(148,163,184,0.85)" }}>
                    {circuit.hasReading ? `${circuit.currentAmps.toFixed(2)} A measured · this circuit` : "No reading for this channel"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  {pct !== null && (
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold" style={{ color: STATUS_COLOR[status] }}>{status}</span>
                    <span className="font-mono" style={{ color: "rgba(148,163,184,0.85)" }}>
                      {pct !== null ? `${pct}% of ${circuit.maxAmps} A rating` : "No rating configured"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
