"use client";

import { useMemo, useState } from "react";
import { X, Zap, Wind, Lightbulb, Car, Cpu } from "lucide-react";
import {
  LineChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const LOAD_TYPE_ICON: Record<string, typeof Zap> = {
  lighting: Lightbulb, hvac: Wind, ev_charger: Car, general: Cpu,
};

interface CircuitEnergyModalProps {
  circuitId: Id<"circuits">;
  circuitName: string;
  loadType?: string;
  channelIndex: number;
  maxAmps?: number;
  canEditRating: boolean;
  onClose: () => void;
}

type Metric = "power" | "current";

const METRIC = {
  power:   { label: "Power", unit: "W", note: "estimated from current × voltage × 0.85 PF" },
  current: { label: "Current", unit: "A", note: "measured" },
} as const;

const fmtTime = (sec: number) =>
  new Date(sec * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function CircuitEnergyModal({
  circuitId,
  circuitName,
  loadType,
  channelIndex,
  maxAmps,
  canEditRating,
  onClose,
}: CircuitEnergyModalProps) {
  const [metric, setMetric] = useState<Metric>("current");
  const setRating = useMutation(api.circuits.setRating);
  const [ratingDraft, setRatingDraft] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const ratingText = ratingDraft ?? (maxAmps ? String(maxAmps) : "");
  const saveRating = async () => {
    setRatingError(null);
    const value = ratingText.trim() === "" ? null : Number(ratingText);
    try {
      await setRating({ circuitId, maxAmps: value });
      setRatingDraft(null);
    } catch (e) {
      setRatingError(e instanceof Error ? e.message : "Could not save the rating");
    }
  };

  const readings = useQuery(api.telemetry.getCircuitReadings, { circuitId, limit: 60 });

  const Icon = LOAD_TYPE_ICON[loadType ?? ""] ?? Zap;

  const chartData = useMemo(() => {
    if (!readings) return [];
    return [...readings].reverse().map((r) => ({
      time:    fmtTime(r.timestamp),
      power:   Math.round(r.powerW),
      current: Math.round(r.currentAmps * 100) / 100,
    }));
  }, [readings]);

  const latest = readings?.[0];
  const avgPower = readings?.length
    ? readings.reduce((s, r) => s + r.powerW, 0) / readings.length
    : 0;
  const peakPower = readings?.length ? Math.max(...readings.map((r) => r.powerW)) : 0;
  // Each reading represents one 5 s interval.
  const estimatedWh = readings?.length ? (avgPower * readings.length * 5) / 3600 : 0;

  // Share of these readings at zero / below 60% of this session's peak / at or above it.
  const usageBreakdown = useMemo(() => {
    if (!readings || readings.length === 0) return null;
    let off = 0, low = 0, high = 0;
    for (const r of readings) {
      if (r.powerW === 0) off++;
      else if (r.powerW < peakPower * 0.6) low++;
      else high++;
    }
    const total = readings.length;
    return [
      { name: "Off",  meaning: "0 W",                       value: Math.round((off  / total) * 100), color: "rgba(148,163,184,0.7)" },
      { name: "Low",  meaning: "under 60% of session peak", value: Math.round((low  / total) * 100), color: "#18e39a" },
      { name: "High", meaning: "60%+ of session peak",      value: Math.round((high / total) * 100), color: "#ffb547" },
    ].filter((b) => b.value > 0);
  }, [readings, peakPower]);

  const m = METRIC[metric];
  const span = readings && readings.length > 1
    ? `${fmtTime(readings[readings.length - 1].timestamp)}–${fmtTime(readings[0].timestamp)}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`CH${channelIndex + 1} ${circuitName} readings`}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 space-y-5"
        style={{
          background: "rgba(15,23,42,0.97)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[9px]" style={{ background: "rgba(24,227,154,0.10)", color: "#18e39a" }} aria-hidden>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-xl">CH{channelIndex + 1} · {circuitName}</h2>
              <p className="text-sm" style={{ color: "rgba(148,163,184,0.85)" }}>
                This circuit only · recent readings{span ? ` · ${span}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "rgba(148,163,184,0.9)" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Latest reading", value: latest ? `${latest.currentAmps.toFixed(2)} A · ${Math.round(latest.powerW)} W` : "—" },
            { label: "Peak in these readings", value: `${Math.round(peakPower)} W` },
            { label: "Energy over these readings", value: `${estimatedWh.toFixed(1)} Wh (est.)` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs mb-1" style={{ color: "rgba(148,163,184,0.85)" }}>{label}</p>
              <p className="text-white font-mono font-bold text-lg">{value}</p>
            </div>
          ))}
        </div>

        {usageBreakdown && (
          <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-sm font-semibold text-white mb-1">How these readings split</p>
            <p className="text-xs mb-3" style={{ color: "rgba(148,163,184,0.85)" }}>
              Relative to this circuit&apos;s own peak in the readings shown — not a safety limit.
            </p>
            <div className="flex items-center gap-4">
              <PieChart width={64} height={64} aria-hidden>
                <Pie data={usageBreakdown} dataKey="value" cx={28} cy={28} innerRadius={18} outerRadius={30} strokeWidth={0}>
                  {usageBreakdown.map((b) => <Cell key={b.name} fill={b.color} />)}
                </Pie>
              </PieChart>
              <ul className="space-y-1">
                {usageBreakdown.map((b) => (
                  <li key={b.name} className="flex items-center gap-2 text-sm" style={{ color: "rgba(203,213,225,0.95)" }}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color }} aria-hidden />
                    <span><strong>{b.name}</strong> ({b.meaning}): <span className="font-mono">{b.value}%</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-base font-semibold text-white">
            {m.label} ({m.unit}) <span className="text-sm font-normal" style={{ color: "rgba(148,163,184,0.85)" }}>— {m.note}</span>
          </p>
          <div className="flex gap-1.5" role="tablist" aria-label="Metric">
            {(["current", "power"] as Metric[]).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={metric === key}
                onClick={() => setMetric(key)}
                className="px-3 py-1 rounded-full text-sm font-semibold transition-colors"
                style={
                  metric === key
                    ? { background: "rgba(24,227,154,0.15)", color: "#18e39a", border: "1px solid rgba(24,227,154,0.3)" }
                    : { background: "transparent", color: "rgba(148,163,184,0.9)", border: "1px solid rgba(255,255,255,0.12)" }
                }
              >
                {METRIC[key].label} ({METRIC[key].unit})
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 260 }}>
          {readings === undefined ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-500" />
            </div>
          ) : chartData.length < 2 ? (
            <div className="flex items-center justify-center h-full text-base" style={{ color: "rgba(148,163,184,0.85)" }}>
              Not enough readings yet for this circuit.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="rgba(148,163,184,0.7)" style={{ fontSize: 12 }} minTickGap={40} />
                <YAxis stroke="rgba(148,163,184,0.7)" style={{ fontSize: 12 }} unit={` ${m.unit}`}
                  domain={metric === "current" && maxAmps ? [0, (dataMax: number) => Math.max(dataMax, maxAmps * 1.05)] : [0, "auto"]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgb(15,23,42)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13 }}
                  formatter={(v) => [`${v} ${m.unit}`, m.label]}
                  cursor={false}
                />
                {metric === "current" && maxAmps ? (
                  <ReferenceLine
                    y={maxAmps}
                    stroke="#f87171"
                    strokeDasharray="6 4"
                    label={{ value: `Configured rating ${maxAmps} A`, position: "insideTopRight", fill: "#f87171", fontSize: 12 }}
                  />
                ) : null}
                <Line type="linear" dataKey={metric} stroke="#18e39a" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <p className="text-sm" style={{ color: "rgba(148,163,184,0.85)" }}>
          {metric === "current"
            ? maxAmps
              ? `Dashed line: this circuit's configured rating (${maxAmps} A), used for HIGH LOAD status and overload alerts. Crossing it does not switch the circuit off.`
              : "No current rating is configured for this circuit, so no threshold line is shown."
            : "Thresholds are configured in amps — switch to Current (A) to see the configured rating."}
          {" "}Showing the last {chartData.length} readings (about one every 5 s).
        </p>

        {canEditRating && (
          <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <label htmlFor="circuit-rating" className="block text-sm font-semibold text-white mb-1">Breaker rating for this circuit (A)</label>
            <p className="text-xs mb-2" style={{ color: "rgba(148,163,184,0.85)" }}>
              Enter the rating printed on this circuit&apos;s breaker. It sets HIGH LOAD (85%) and overload alerts (90%). Leave empty to clear.
            </p>
            <div className="flex gap-2">
              <input
                id="circuit-rating"
                type="number"
                inputMode="decimal"
                min={0}
                value={ratingText}
                onChange={(e) => setRatingDraft(e.target.value)}
                className="flex-1 rounded-lg px-3 py-1.5 text-white bg-slate-800/60 border border-slate-700"
              />
              <button
                onClick={saveRating}
                disabled={ratingDraft === null}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{ background: "#18e39a", color: "#03130c" }}
              >
                Save
              </button>
            </div>
            {ratingError && <p role="alert" className="text-sm text-red-400 mt-2">{ratingError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
