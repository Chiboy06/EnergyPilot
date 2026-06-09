"use client";

import { useState } from "react";
import { Loader2, Zap, Wind, Lightbulb, Car, Cpu } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useHubData } from "@/hooks/use-hub-data";
import Link from "next/link";

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
  const { circuitStates, breakerCapacity, isLoading, relayStateMap, sendCommand, activeHub } = useHubData();
  const [confirmAllOff, setConfirmAllOff] = useState(false);

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
        <Link href="/onboarding" className="text-primary hover:underline">
          onboarding
        </Link>{" "}
        to set up your facility.
      </div>
    );
  }

  const enriched = circuitStates.map((circuit) => {
    const maxW = (circuit.maxAmps ?? breakerCapacity) * VOLTAGE * POWER_FACTOR;
    const percentage = maxW > 0 ? Math.min(100, Math.round((circuit.powerW / maxW) * 100)) : 0;
    const status =
      percentage === 0 ? "OFFLINE" : percentage >= 85 ? "HIGH LOAD" : "ACTIVE";
    return { ...circuit, percentage, status };
  });

  const filtered = enriched.filter((c) => {
    if (filter === "active") return c.powerW > 0;
    if (filter === "issues") return c.percentage >= 85;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Master controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => activeHub && sendCommand({ hubId: activeHub._id, relayNum: 255, state: true })}
          disabled={!activeHub}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: "rgba(24,227,154,0.15)", color: "#18e39a", border: "1px solid rgba(24,227,154,0.3)" }}
        >
          All ON
        </button>
        <button
          onClick={() => setConfirmAllOff(true)}
          disabled={!activeHub}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          All OFF
        </button>
      </div>

      {/* All OFF confirmation dialog */}
      {confirmAllOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="glass-card p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-white font-semibold text-[15px]">Turn off all circuits?</h3>
            <p className="text-[13px]" style={{ color: "rgba(100,116,139,0.9)" }}>
              This will de-energise all 16 relays immediately.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  if (activeHub) sendCommand({ hubId: activeHub._id, relayNum: 255, state: false });
                  setConfirmAllOff(false);
                }}
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
          const barColor = isHighLoad ? "#ffb547" : "#18e39a";
          const statusColor = isHighLoad ? "rgba(255,181,71,1)" : status === "OFFLINE" ? "rgba(88,105,128,0.8)" : "#18e39a";
          const statusBg = isHighLoad ? "rgba(255,181,71,0.12)" : status === "OFFLINE" ? "rgba(88,105,128,0.12)" : "rgba(24,227,154,0.12)";
          const statusBorder = isHighLoad ? "rgba(255,181,71,0.3)" : status === "OFFLINE" ? "rgba(88,105,128,0.3)" : "rgba(24,227,154,0.3)";
          const isOn = relayStateMap[circuit.channelIndex] ?? false;

          return (
            <div key={circuit._id} className="glass-card relative p-5 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-[9px]"
                    style={{ background: "rgba(24,227,154,0.10)", color: "#18e39a" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-[14px]">{circuit.name}</h3>
                    <p className="text-[11px]" style={{ color: "rgba(88,105,128,0.9)" }}>
                      CH{circuit.channelIndex + 1}
                    </p>
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
                <span
                  className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: statusColor, background: statusBg, border: `1px solid ${statusBorder}` }}
                >
                  {status}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11.5px]" style={{ color: "rgba(100,116,139,0.8)" }}>Load</span>
                  <span className="text-[11.5px] font-mono" style={{ color: "rgba(148,163,184,0.8)" }}>{percentage}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${percentage}%`, background: barColor }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-[11px]" style={{ color: "rgba(100,116,139,0.8)" }}>
                  Pred:{" "}
                  <span className="font-mono font-medium" style={{ color: "#18e39a" }}>
                    {Math.round(circuit.powerW * 0.95)} W
                  </span>
                </span>
                <Switch
                  checked={isOn}
                  onCheckedChange={(checked) => {
                    if (activeHub) sendCommand({ hubId: activeHub._id, relayNum: circuit.channelIndex, state: checked });
                  }}
                  aria-label={`Toggle ${circuit.name}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
