"use client";

import { Zap, Activity, AlertTriangle, Gauge } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useHubData } from "@/hooks/use-hub-data";
import { formatClock } from "@/lib/circuit-status";

export function StatsCards() {
  const { hubState, circuitStates, activeHub, isFresh, lastUpdated } = useHubData();
  const anomalyCount = useQuery(
    api.anomalies.getUnresolvedCount,
    activeHub?._id ? { hubId: activeHub._id } : "skip"
  ) ?? 0;

  const totalKw = hubState ? (hubState.totalPowerW / 1000).toFixed(2) : "—";
  const voltage = hubState ? hubState.voltage.toFixed(1) : "—";
  const reported = circuitStates.filter((c) => c.hasReading);
  const drawing = reported.filter((c) => c.currentAmps > 0).length;
  const configured = circuitStates.length;

  const cards = [
    {
      scope: "Whole system · live",
      label: "Total Load",
      value: totalKw,
      unit: "kW",
      sub: hubState ? "Estimated: current × voltage × 0.85 PF" : "Waiting for hub data",
      icon: Zap,
      color: "#18e39a",
    },
    {
      scope: "Whole system · live",
      label: "Mains Voltage",
      value: voltage,
      unit: hubState ? "V" : "",
      sub: hubState ? "Measured at the hub" : "Waiting for hub data",
      icon: Gauge,
      color: "#38bdf8",
    },
    {
      scope: `CH1–${configured || "?"} · live`,
      label: "Circuits Drawing Current",
      value: String(drawing),
      unit: `/ ${configured}`,
      sub: configured === 0
        ? "No circuits configured"
        : reported.length < configured
        ? `${configured - reported.length} channel(s) not reporting`
        : `${configured - drawing} with no current`,
      icon: Activity,
      color: "#a78bfa",
    },
    {
      scope: "Detected alerts · open",
      label: "Active Alerts",
      value: anomalyCount === 0 ? "None" : anomalyCount >= 100 ? "99+" : String(anomalyCount),
      unit: "",
      sub: anomalyCount === 0 ? "No open voltage or load alerts" : "Open until the condition clears",
      icon: AlertTriangle,
      color: anomalyCount > 0 ? "rgba(255,107,107,1)" : "#18e39a",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass-card p-5 lg:p-6 eg-anim-slide-up">
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-xs font-semibold tracking-[0.12em] uppercase"
                style={{ color: "rgba(148,163,184,0.8)" }}
              >
                {c.scope}
              </span>
              <div
                className="w-9 h-9 rounded-[10px] grid place-items-center flex-none"
                style={{ background: "rgba(255,255,255,0.06)", color: c.color }}
                aria-hidden
              >
                <c.icon size={17} />
              </div>
            </div>

            <p className="text-base lg:text-lg font-semibold text-white mb-1">{c.label}</p>

            <div className="mb-1 flex items-baseline gap-2">
              <span className="font-mono font-bold glow-text text-4xl xl:text-5xl" style={{ color: c.color }}>
                {c.value}
              </span>
              {c.unit && (
                <span className="font-mono text-lg" style={{ color: "rgba(148,163,184,0.85)" }}>
                  {c.unit}
                </span>
              )}
            </div>

            <p className="text-sm" style={{ color: "rgba(148,163,184,0.85)" }}>
              {c.sub}
            </p>
          </div>
        ))}
      </div>
      <p className="text-sm" style={{ color: isFresh ? "rgba(148,163,184,0.85)" : "rgba(255,181,71,1)" }}>
        {lastUpdated
          ? `${isFresh ? "Live" : "Stale — no update for over 30 s"} · last reading ${formatClock(lastUpdated)} · the hub pushes about every 5 s`
          : "No readings received from the hub yet"}
      </p>
    </div>
  );
}
