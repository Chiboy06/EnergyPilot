"use client";

import { Zap, Activity, AlertTriangle, Gauge } from "lucide-react";
import { useFacility } from "@/hooks/use-facility";
import { getRoomMockPower } from "@/lib/room-utils";

export function StatsCards() {
  const { rooms } = useFacility();

  const totalW = rooms.reduce((sum, r) => sum + getRoomMockPower(r).power, 0);
  const activeCircuits = rooms.filter((r) => getRoomMockPower(r).power > 0).length;
  const anomalies = rooms.filter((r) => getRoomMockPower(r).status === "ANOMALY");
  const voltage = 229 + Math.sin(Date.now() / 10000) * 2;

  const cards = [
    {
      eyebrow: "Real-time · ESP32",
      label: "Total Load",
      value: (totalW / 1000).toFixed(2),
      unit: "kW",
      sub: `${rooms.length} circuits monitored`,
      icon: Zap,
      color: "#18e39a",
      glow: "rgba(24,227,154,0.35)",
    },
    {
      eyebrow: "True-RMS · Mains",
      label: "Mains Voltage",
      value: voltage.toFixed(1),
      unit: "V",
      sub: "within ±5% nominal",
      icon: Gauge,
      color: "#38bdf8",
      glow: "rgba(56,189,248,0.35)",
    },
    {
      eyebrow: "Breaker array · CH1–16",
      label: "Active Circuits",
      value: String(activeCircuits),
      unit: `/ ${rooms.length}`,
      sub: activeCircuits === rooms.length ? "All circuits live" : `${rooms.length - activeCircuits} idle`,
      icon: Activity,
      color: "#18e39a",
      glow: "rgba(24,227,154,0.35)",
    },
    {
      eyebrow: "SageMaker · live",
      label: "Anomaly Status",
      value: anomalies.length === 0 ? "Clear" : String(anomalies.length),
      unit: anomalies.length === 0 ? "" : " alert" + (anomalies.length > 1 ? "s" : ""),
      sub: anomalies.length === 0 ? "All circuits nominal" : anomalies[0],
      icon: AlertTriangle,
      color: anomalies.length > 0 ? "rgba(255,107,107,1)" : "#18e39a",
      glow: anomalies.length > 0 ? "rgba(255,107,107,0.35)" : "rgba(24,227,154,0.35)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="glass-card p-5 eg-anim-slide-up">
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-[10px] font-semibold tracking-[0.15em] uppercase"
              style={{ color: "rgba(148,163,184,0.6)" }}
            >
              {c.eyebrow}
            </span>
            <div
              className="w-8 h-8 rounded-[9px] grid place-items-center flex-none"
              style={{ background: c.glow.replace("0.35", "0.15"), color: c.color }}
            >
              <c.icon size={15} />
            </div>
          </div>

          <div className="mb-1 flex items-baseline gap-1.5">
            <span
              className="font-mono font-bold glow-text"
              style={{ fontSize: 30, color: c.color }}
            >
              {c.value}
            </span>
            {c.unit && (
              <span className="font-mono text-[14px]" style={{ color: "rgba(148,163,184,0.7)" }}>
                {c.unit}
              </span>
            )}
          </div>

          <p
            className="text-[11.5px]"
            style={{ color: "rgba(100,116,139,0.9)" }}
          >
            {c.sub}
          </p>

          <p className="text-[12.5px] font-semibold mt-2 text-white">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
