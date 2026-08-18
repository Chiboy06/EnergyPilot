"use client";

import { useMemo, useState } from "react";
import { X, Zap, Wind, Lightbulb, Car, Cpu } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function getLoadTypeIcon(loadType?: string) {
  switch (loadType) {
    case "lighting":   return Lightbulb;
    case "hvac":       return Wind;
    case "ev_charger": return Car;
    case "general":    return Cpu;
    default:           return Zap;
  }
}

interface CircuitEnergyModalProps {
  circuitId: Id<"circuits">;
  circuitName: string;
  loadType?: string;
  channelIndex: number;
  onClose: () => void;
}

type ChartType = "bar" | "line";
type Metric = "power" | "current";

export function CircuitEnergyModal({
  circuitId,
  circuitName,
  loadType,
  channelIndex,
  onClose,
}: CircuitEnergyModalProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [metric, setMetric] = useState<Metric>("power");

  const readings = useQuery(api.telemetry.getCircuitReadings, {
    circuitId,
    limit: 60,
  });

  const Icon = getLoadTypeIcon(loadType);

  const chartData = useMemo(() => {
    if (!readings) return [];
    return [...readings]
      .reverse()
      .map((r, i) => ({
        label: i % 10 === 0
          ? new Date(r.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
        power: Math.round(r.powerW),
        current: Math.round(r.currentAmps * 100) / 100,
      }));
  }, [readings]);

  const latest = readings?.[0];
  const avgPower = readings?.length
    ? Math.round(readings.reduce((s, r) => s + r.powerW, 0) / readings.length)
    : 0;
  const peakPower = readings?.length
    ? Math.round(Math.max(...readings.map((r) => r.powerW)))
    : 0;
  const estimatedKwh = readings?.length
    ? Math.round((avgPower * (readings.length * 5)) / 3600 / 1000 * 1000) / 1000
    : 0;

  const dataKey = metric === "power" ? "power" : "current";
  const yLabel = metric === "power" ? "W" : "A";
  const color = "#18e39a";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl p-6 space-y-5"
        style={{
          background: "rgba(15,23,42,0.97)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[9px]" style={{ background: "rgba(24,227,154,0.10)", color: "#18e39a" }}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-[16px]">{circuitName}</h2>
              <p className="text-[11px]" style={{ color: "rgba(100,116,139,0.8)" }}>
                CH{channelIndex + 1} · Energy consumption history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "rgba(100,116,139,0.8)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Current Power", value: `${latest ? Math.round(latest.powerW) : 0} W` },
            { label: "Peak (session)", value: `${peakPower} W` },
            { label: "Est. Energy", value: `${estimatedKwh} kWh` },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-[10px] mb-1" style={{ color: "rgba(100,116,139,0.8)" }}>{label}</p>
              <p className="text-white font-mono font-bold text-[15px]">{value}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {(["bar", "line"] as ChartType[]).map((t) => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                style={
                  chartType === t
                    ? { background: "rgba(24,227,154,0.15)", color: "#18e39a", border: "1px solid rgba(24,227,154,0.3)" }
                    : { background: "transparent", color: "rgba(100,116,139,0.8)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {t === "bar" ? "Bar Chart" : "Line Chart"}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {(["power", "current"] as Metric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                style={
                  metric === m
                    ? { background: "rgba(24,227,154,0.15)", color: "#18e39a", border: "1px solid rgba(24,227,154,0.3)" }
                    : { background: "transparent", color: "rgba(100,116,139,0.8)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {m === "power" ? "Power (W)" : "Current (A)"}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: 240 }}>
          {readings === undefined ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-500" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm" style={{ color: "rgba(100,116,139,0.8)" }}>
              No readings yet for this circuit.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="rgba(100,116,139,0.6)" style={{ fontSize: 10 }} />
                  <YAxis stroke="rgba(100,116,139,0.6)" style={{ fontSize: 10 }} unit={` ${yLabel}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgb(15,23,42)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`${v} ${yLabel}`, metric === "power" ? "Power" : "Current"]}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="rgba(100,116,139,0.6)" style={{ fontSize: 10 }} />
                  <YAxis stroke="rgba(100,116,139,0.6)" style={{ fontSize: 10 }} unit={` ${yLabel}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgb(15,23,42)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`${v} ${yLabel}`, metric === "power" ? "Power" : "Current"]}
                    cursor={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: color }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        <p className="text-[10px] text-center" style={{ color: "rgba(100,116,139,0.5)" }}>
          Showing last {chartData.length} readings · 5-second intervals
        </p>
      </div>
    </div>
  );
}
