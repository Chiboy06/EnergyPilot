"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useHubData } from "@/hooks/use-hub-data";

function toMs(ts: number): number {
  // Firmware timestamps are Unix seconds
  return ts < 1e12 ? ts * 1000 : ts;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function PowerChart() {
  const { hubReadings, isFresh } = useHubData();

  const chartData = hubReadings
    .slice()
    .reverse()
    .map((r) => ({ time: formatTime(toMs(r.timestamp)), kw: Math.round(r.totalPowerW) / 1000 }));

  const first = hubReadings.length ? toMs(hubReadings[hubReadings.length - 1].timestamp) : null;
  const last = hubReadings.length ? toMs(hubReadings[0].timestamp) : null;

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase mb-1.5" style={{ color: "rgba(148,163,184,0.8)" }}>
          Whole system · recent readings
        </p>
        <h2 className="text-xl lg:text-2xl font-semibold text-white">Total Power — Live Trace</h2>
        <p className="text-sm lg:text-base mt-1" style={{ color: "rgba(148,163,184,0.85)" }}>
          {first && last
            ? `Instantaneous total power (kW, estimated) · last ${hubReadings.length} readings · ${formatTime(first)}–${formatTime(last)}`
            : "Instantaneous total power (kW, estimated)"}
          {first && !isFresh && " · no new data in the last 30 s"}
        </p>
      </div>

      <div className="h-72 lg:h-80">
        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#18e39a" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#18e39a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="time"
                fontSize={13}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
                tick={{ fill: "rgba(148,163,184,0.85)" }}
              />
              <YAxis
                fontSize={13}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${Number(v).toFixed(1)}`}
                tick={{ fill: "rgba(148,163,184,0.85)" }}
                label={{ value: "kW", angle: -90, position: "insideLeft", fill: "rgba(148,163,184,0.85)", fontSize: 13 }}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(7,11,18,0.92)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 12,
                  color: "#e2e8f0",
                  fontSize: 13,
                }}
                labelStyle={{ color: "rgba(148,163,184,0.9)", marginBottom: 4 }}
                formatter={(v) => [`${Number(v).toFixed(2)} kW`, "Total power (est.)"]}
                cursor={{ stroke: "rgba(255,255,255,0.08)" }}
              />
              <Area
                type="linear"
                dataKey="kw"
                stroke="#18e39a"
                strokeWidth={2}
                fill="url(#actualGrad)"
                name="Total power"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center flex-col gap-2">
            <p className="text-base" style={{ color: "rgba(148,163,184,0.85)" }}>
              Not enough readings yet — waiting for telemetry from the hub.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
