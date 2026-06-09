"use client";

import { Power, Loader2, Zap, Wind, Lightbulb, Car, Cpu } from "lucide-react";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useHubData } from "@/hooks/use-hub-data";

const VOLTAGE = 220;
const POWER_FACTOR = 0.85;

function getLoadTypeIcon(loadType?: string): LucideIcon {
  switch (loadType) {
    case "lighting":   return Lightbulb;
    case "hvac":       return Wind;
    case "ev_charger": return Car;
    case "general":    return Cpu;
    default:           return Zap;
  }
}

function getCircuitStatus(percentage: number) {
  if (percentage === 0)  return { label: "OFFLINE",   color: "rgba(88,105,128,0.8)" };
  if (percentage >= 85)  return { label: "HIGH LOAD", color: "rgba(255,181,71,1)" };
  return { label: "ACTIVE", color: "#18e39a" };
}

export function CircuitMonitor() {
  const { circuitStates, breakerCapacity, facilityName, isLoading, relayStateMap, sendCommand, activeHub } = useHubData();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-1" style={{ color: "rgba(148,163,184,0.6)" }}>
            {facilityName || "Facility"} · live
          </p>
          <h2 className="text-[17px] font-semibold text-white">Circuit Monitor</h2>
        </div>
        <Link
          href="/dashboard/circuits"
          className="text-[12.5px] font-medium transition-colors"
          style={{ color: "#18e39a" }}
        >
          View All →
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="text-emerald-400 animate-spin" />
        </div>
      ) : circuitStates.length === 0 ? (
        <div className="text-center py-12 text-[13px]" style={{ color: "rgba(100,116,139,0.8)" }}>
          No circuits found.{" "}
          <Link href="/dashboard/settings" style={{ color: "#18e39a" }}>
            Check device status
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {circuitStates.slice(0, 6).map((circuit) => {
            const maxW = (circuit.maxAmps ?? breakerCapacity) * VOLTAGE * POWER_FACTOR;
            const percentage = maxW > 0 ? Math.min(100, Math.round((circuit.powerW / maxW) * 100)) : 0;
            const { label: status, color: statusColor } = getCircuitStatus(percentage);
            const barColor = percentage >= 85 ? "#ffb547" : "#18e39a";
            const Icon = getLoadTypeIcon(circuit.loadType);
            const isOn = relayStateMap[circuit.channelIndex] ?? false;

            return (
              <div key={circuit._id} className="glass-card p-4 eg-anim-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-[10px] grid place-items-center flex-none"
                    style={{ background: "rgba(24,227,154,0.10)", color: "#18e39a" }}
                  >
                    <Icon size={17} />
                  </div>
                  <button
                    onClick={() => {
                      if (activeHub) sendCommand({ hubId: activeHub._id, relayNum: circuit.channelIndex, state: !isOn });
                    }}
                    className="w-8 h-8 grid place-items-center rounded-[9px] transition-colors"
                    style={{
                      background: isOn ? "rgba(24,227,154,0.15)" : "rgba(239,68,68,0.10)",
                      border: isOn ? "1px solid rgba(24,227,154,0.3)" : "1px solid rgba(239,68,68,0.25)",
                      color: isOn ? "#18e39a" : "#f87171",
                    }}
                  >
                    <Power size={14} />
                  </button>
                </div>

                <div className="mb-3">
                  <p className="text-[13px] font-medium text-white leading-tight">{circuit.name}</p>
                  <p className="font-mono font-bold text-[22px] text-white leading-tight mt-0.5">
                    {Math.round(circuit.powerW).toLocaleString()}{" "}
                    <span className="text-[13px] font-normal" style={{ color: "rgba(100,116,139,0.9)" }}>W</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percentage}%`, background: barColor, boxShadow: `0 0 8px ${barColor}55` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span style={{ color: statusColor }}>{status}</span>
                    <span className="font-mono" style={{ color: "rgba(100,116,139,0.8)" }}>{percentage}%</span>
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
