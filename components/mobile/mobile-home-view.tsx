"use client";

import { useHubData } from "@/hooks/use-hub-data";
import { getRoomIcon } from "@/lib/room-utils";
import { useUser } from "@clerk/nextjs";
import { Activity, AlertTriangle, Zap } from "lucide-react";
import { useMemo, useEffect, useRef, useState } from "react";

// ── tiny sparkline (SVG, no deps) ──────────────────────────────────────────────
function Sparkline({
  data,
  w = 300,
  h = 44,
  color = "#18e39a",
}: {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
}) {
  if (data.length < 2) return <svg width={w} height={h} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const pad = 3;
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (w - pad * 2),
    h - pad - ((v - min) / rng) * (h - pad * 2),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const id = `sp-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: "block", width: "100%", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w - pad},${h} L${pad},${h} Z`} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r={2.6}
        fill={color}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
      />
    </svg>
  );
}

// ── mini load bar ──────────────────────────────────────────────────────────────
function LoadBar({ pct, color = "#18e39a" }: { pct: number; color?: string }) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: 5, background: "rgba(255,255,255,0.07)" }}
    >
      <div
        style={{
          width: `${Math.min(100, pct)}%`,
          height: "100%",
          borderRadius: 999,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          boxShadow: `0 0 10px ${color}66`,
          transition: "width .4s cubic-bezier(.2,.8,.2,1)",
        }}
      />
    </div>
  );
}

// ── glass card ─────────────────────────────────────────────────────────────────
function MCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 22,
        backdropFilter: "blur(18px) saturate(150%)",
        WebkitBackdropFilter: "blur(18px) saturate(150%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.12)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── animated number: eases toward target ──────────────────────────────────────
function useEased(target: number, ms = 700) {
  const [val, setVal] = useState(target);
  const ref = useRef({ from: target, to: target, start: 0 });
  useEffect(() => {
    ref.current = { from: val, to: target, start: performance.now() };
    let raf: number;
    const step = (t: number) => {
      const p = Math.min(1, (t - ref.current.start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(ref.current.from + (ref.current.to - ref.current.from) * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}


// ── generate sparkline history ─────────────────────────────────────────────────
function useSparkHistory(value: number, len = 18) {
  const hist = useRef<number[]>([]);
  useEffect(() => {
    hist.current.push(value);
    if (hist.current.length > len) hist.current.shift();
  }, [value, len]);
  return hist.current.length >= 2 ? [...hist.current] : Array(2).fill(value);
}

const BREAKER_V = 220;
const BREAKER_PF = 0.85;

// ── main component ─────────────────────────────────────────────────────────────
export function MobileHomeView() {
  const { user } = useUser();
  const {
    hubState,
    circuitStates,
    hubReadings,
    relayStateMap,
    breakerCapacity,
    facilityName,
    isLoading,
    hasHub,
  } = useHubData();

  const totalKw = (hubState?.totalPowerW ?? 0) / 1000;
  const easedTotal = useEased(totalKw);

  // Sparkline from real hub readings (newest-first → reverse for chronological)
  const readingHistory = useMemo(
    () => [...(hubReadings ?? [])].reverse().map((r) => r.totalPowerW / 1000),
    [hubReadings]
  );
  const fallbackSparkData = useSparkHistory(totalKw);
  const sparkData = readingHistory.length >= 2 ? readingHistory : fallbackSparkData;

  // Map circuit states to display shape
  const circuits = useMemo(() => {
    const maxW = breakerCapacity * BREAKER_V * BREAKER_PF;
    return circuitStates.map((c) => {
      const on = relayStateMap[c.channelIndex] ?? true;
      const pct = maxW > 0 ? Math.min(100, Math.round((c.powerW / maxW) * 100)) : 0;
      const status = !on ? "OFFLINE" : pct >= 88 ? "HIGH LOAD" : "NOMINAL";
      return { name: c.name, power: c.powerW, percentage: pct, status, on };
    });
  }, [circuitStates, relayStateMap, breakerCapacity]);

  const anomalies = useMemo(() => circuits.filter((c) => c.status === "HIGH LOAD"), [circuits]);
  const active    = useMemo(() => circuits.filter((c) => c.on), [circuits]);

  const top4 = useMemo(
    () => [...circuits].sort((a, b) => b.power - a.power).slice(0, 4),
    [circuits]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* page header */}
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-[10px] font-semibold tracking-[0.18em] uppercase mb-1"
            style={{ color: "rgba(136,147,164,1)" }}
          >
            {facilityName ?? "Smart Energy OS"}
          </p>
          <h1
            className="text-[28px] font-bold leading-none"
            style={{ color: "#f2f6fb", letterSpacing: "-0.02em" }}
          >
            Hi, {user?.firstName ?? "there"} 👋
          </h1>
        </div>
        <span
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{
            color: "#18e39a",
            background: "rgba(24,227,154,0.10)",
            border: "1px solid rgba(24,227,154,0.25)",
          }}
        >
          <span className="live-dot" />
          live
        </span>
      </div>

      {/* hero load card */}
      <MCard style={{ padding: 20 }}>
        <p
          className="text-center text-[10px] font-semibold tracking-[0.16em] uppercase mb-3"
          style={{ color: "rgba(136,147,164,1)" }}
        >
          Total Live Load
        </p>
        <div className="flex items-baseline justify-center gap-1.5 mb-3">
          <span
            className="font-mono glow-text leading-none"
            style={{ fontSize: 52, fontWeight: 700, color: "#18e39a" }}
          >
            {easedTotal.toFixed(2)}
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 20, color: "rgba(136,147,164,1)" }}
          >
            kW
          </span>
        </div>
        <Sparkline data={sparkData} color="#18e39a" h={44} />
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "Circuits", value: `${active.length}/${circuits.length}` },
            { label: "Anomalies", value: String(anomalies.length) },
            { label: "Status", value: anomalies.length > 0 ? "Alert" : "Normal" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span
                className="font-mono font-bold"
                style={{
                  fontSize: 16,
                  color: label === "Anomalies" && anomalies.length > 0
                    ? "#ff6b6b"
                    : "#18e39a",
                }}
              >
                {value}
              </span>
              <span style={{ fontSize: 10, color: "rgba(90,102,120,1)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </MCard>

      {/* status row */}
      <div className="grid grid-cols-2 gap-3">
        <MCard style={{ padding: 16 }}>
          <p
            className="text-[10px] font-semibold tracking-[0.14em] uppercase mb-2"
            style={{ color: "rgba(136,147,164,1)" }}
          >
            Active
          </p>
          <p
            className="font-mono font-bold leading-none glow-text"
            style={{ fontSize: 26, color: "#18e39a" }}
          >
            {active.length}
            <span style={{ fontSize: 15, color: "rgba(90,102,120,1)" }}>
              /{circuits.length}
            </span>
          </p>
          <p style={{ fontSize: 11, color: "rgba(136,147,164,1)", marginTop: 4 }}>
            channels online
          </p>
        </MCard>
        <MCard
          style={{
            padding: 16,
            borderColor:
              anomalies.length > 0 ? "rgba(255,107,107,0.4)" : undefined,
          }}
        >
          <p
            className="text-[10px] font-semibold tracking-[0.14em] uppercase mb-2"
            style={{ color: "rgba(136,147,164,1)" }}
          >
            Anomalies
          </p>
          <p
            className="font-mono font-bold leading-none"
            style={{
              fontSize: 26,
              color: anomalies.length > 0 ? "#ff6b6b" : "#18e39a",
            }}
          >
            {anomalies.length}
          </p>
          <p style={{ fontSize: 11, color: "rgba(136,147,164,1)", marginTop: 4 }}>
            {anomalies.length > 0
              ? anomalies[0].name.split(" ")?.[0] ?? "active"
              : "all nominal"}
          </p>
        </MCard>
      </div>

      {/* top circuits */}
      {top4.length > 0 && (
        <MCard style={{ padding: 18 }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: 15, fontWeight: 650, color: "#f2f6fb" }}>
              Top Circuits
            </span>
            <Activity size={15} style={{ color: "#18e39a" }} />
          </div>
          <div className="space-y-3.5">
            {top4.map((c) => {
              const Icon = getRoomIcon(c.name);
              const isAnom = c.status === "ANOMALY";
              const barColor = isAnom ? "#ff6b6b" : "#18e39a";
              return (
                <div key={c.name} className="flex items-center gap-3">
                  <div
                    className="flex-none grid place-items-center rounded-[9px]"
                    style={{
                      width: 32,
                      height: 32,
                      background: barColor + "1f",
                      color: barColor,
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-[13px] font-medium truncate"
                        style={{ color: "#f2f6fb" }}
                      >
                        {c.name}
                      </span>
                      <span
                        className="font-mono text-[12px] ml-2 flex-none"
                        style={{ color: "rgba(196,204,216,1)" }}
                      >
                        {c.power.toLocaleString()}W
                      </span>
                    </div>
                    <LoadBar pct={c.percentage} color={barColor} />
                  </div>
                </div>
              );
            })}
          </div>
        </MCard>
      )}

      {/* anomaly banner (if any) */}
      {anomalies.length > 0 && (
        <MCard
          style={{
            padding: 14,
            borderColor: "rgba(255,107,107,0.4)",
            background: "rgba(255,107,107,0.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex-none grid place-items-center rounded-[13px]"
              style={{
                width: 44,
                height: 44,
                background: "rgba(255,107,107,0.16)",
                color: "#ff6b6b",
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div className="flex-1">
              <p
                className="font-semibold"
                style={{ fontSize: 15, color: "#f2f6fb" }}
              >
                {anomalies.length} active anomal
                {anomalies.length === 1 ? "y" : "ies"}
              </p>
              <p style={{ fontSize: 12.5, color: "rgba(136,147,164,1)", marginTop: 2 }}>
                Go to Alerts tab to isolate the affected breaker
              </p>
            </div>
            <Zap size={14} style={{ color: "#ff6b6b", flexShrink: 0 }} />
          </div>
        </MCard>
      )}
    </div>
  );
}
