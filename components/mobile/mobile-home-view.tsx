"use client";

import { useHubData } from "@/hooks/use-hub-data";
import { getRoomIcon } from "@/lib/room-utils";
import { useUser } from "@clerk/nextjs";
import { Activity, AlertTriangle } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { circuitLoad, formatClock } from "@/lib/circuit-status";
import { useMemo, useEffect, useRef, useState, useId } from "react";

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
  const uid = useId();
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
  const id = `sp-${uid.replace(/:/g, "")}`;
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


// ── main component ─────────────────────────────────────────────────────────────
export function MobileHomeView() {
  const { user } = useUser();
  const {
    hubState,
    circuitStates,
    hubReadings,
    facilityName,
    isLoading,
    activeHub,
    isFresh,
    lastUpdated,
  } = useHubData();

  const openAlerts = useQuery(
    api.anomalies.getAnomalies,
    activeHub?._id ? { hubId: activeHub._id, includeResolved: false, limit: 5 } : "skip"
  ) ?? [];

  const totalKw = (hubState?.totalPowerW ?? 0) / 1000;
  const easedTotal = useEased(totalKw);

  // Sparkline from real hub readings only (newest-first → reverse for chronological)
  const sparkData = useMemo(
    () => [...(hubReadings ?? [])].reverse().map((r) => r.totalPowerW / 1000),
    [hubReadings]
  );

  const circuits = useMemo(
    () => circuitStates.map((c) => ({ ...c, ...circuitLoad(c) })),
    [circuitStates]
  );
  const drawing = circuits.filter((c) => c.status === "ACTIVE" || c.status === "HIGH LOAD");
  const highLoad = circuits.filter((c) => c.status === "HIGH LOAD");
  const top4 = useMemo(
    () => [...circuits].filter((c) => c.hasReading).sort((a, b) => b.powerW - a.powerW).slice(0, 4),
    [circuits]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const muted = "rgba(160,170,186,1)";

  return (
    <div className="space-y-4">
      {/* page header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] uppercase mb-1" style={{ color: muted }}>
            {facilityName ?? "EnergyPilot"}
          </p>
          <h1 className="text-[28px] font-bold leading-none" style={{ color: "#f2f6fb", letterSpacing: "-0.02em" }}>
            Hi, {user?.firstName ?? "there"}
          </h1>
        </div>
        <span
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={isFresh
            ? { color: "#18e39a", background: "rgba(24,227,154,0.10)", border: "1px solid rgba(24,227,154,0.25)" }
            : { color: "rgba(255,181,71,1)", background: "rgba(255,181,71,0.10)", border: "1px solid rgba(255,181,71,0.25)" }}
        >
          {isFresh && <span className="live-dot" aria-hidden />}
          {isFresh ? "live" : lastUpdated ? "stale" : "no data"}
        </span>
      </div>

      {/* hero load card */}
      <MCard style={{ padding: 20 }}>
        <p className="text-center text-xs font-semibold tracking-[0.14em] uppercase mb-3" style={{ color: muted }}>
          Whole system · total load (est.)
        </p>
        <div className="flex items-baseline justify-center gap-1.5 mb-1">
          <span className="font-mono glow-text leading-none" style={{ fontSize: 52, fontWeight: 700, color: "#18e39a" }}>
            {hubState ? easedTotal.toFixed(2) : "—"}
          </span>
          <span className="font-mono" style={{ fontSize: 20, color: muted }}>kW</span>
        </div>
        <p className="text-center text-sm mb-3" style={{ color: muted }}>
          {lastUpdated ? `Last reading ${formatClock(lastUpdated)}${isFresh ? "" : " — no update for 30 s+"}` : "Waiting for hub data"}
        </p>
        {sparkData.length >= 2 && <Sparkline data={sparkData} color="#18e39a" h={44} />}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "Voltage", value: hubState ? `${hubState.voltage.toFixed(0)} V` : "—" },
            { label: "Drawing", value: `${drawing.length}/${circuits.length}` },
            { label: "Open alerts", value: String(openAlerts.length) },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span
                className="font-mono font-bold"
                style={{ fontSize: 17, color: label === "Open alerts" && openAlerts.length > 0 ? "#ff6b6b" : "#18e39a" }}
              >
                {value}
              </span>
              <span style={{ fontSize: 12, color: muted }}>{label}</span>
            </div>
          ))}
        </div>
      </MCard>

      {/* top circuits */}
      {top4.length > 0 && (
        <MCard style={{ padding: 18 }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 16, fontWeight: 650, color: "#f2f6fb" }}>Top circuits now</span>
            <Activity size={15} style={{ color: "#18e39a" }} aria-hidden />
          </div>
          <p className="text-sm mb-4" style={{ color: muted }}>Individual circuits · estimated watts · bar = % of configured rating</p>
          <div className="space-y-3.5">
            {top4.map((c) => {
              const Icon = getRoomIcon(c.name);
              const barColor = c.status === "HIGH LOAD" ? "#ffb547" : "#18e39a";
              return (
                <div key={c._id} className="flex items-center gap-3">
                  <div className="flex-none grid place-items-center rounded-[9px]"
                    style={{ width: 32, height: 32, background: barColor + "1f", color: barColor }} aria-hidden>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium truncate" style={{ color: "#f2f6fb" }}>
                        CH{c.channelIndex + 1} · {c.name}
                      </span>
                      <span className="font-mono text-sm ml-2 flex-none" style={{ color: "rgba(196,204,216,1)" }}>
                        {Math.round(c.powerW).toLocaleString()} W
                      </span>
                    </div>
                    {c.pct !== null
                      ? <LoadBar pct={c.pct} color={barColor} />
                      : <p className="text-xs" style={{ color: muted }}>No rating configured · {c.currentAmps.toFixed(1)} A</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </MCard>
      )}

      {/* alert banner (real recorded alerts, plus circuits at high load) */}
      {(openAlerts.length > 0 || highLoad.length > 0) && (
        <MCard style={{ padding: 14, borderColor: "rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="flex-none grid place-items-center rounded-[13px]"
              style={{ width: 44, height: 44, background: "rgba(255,107,107,0.16)", color: "#ff6b6b" }} aria-hidden>
              <AlertTriangle size={22} />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ fontSize: 15, color: "#f2f6fb" }}>
                {openAlerts.length > 0
                  ? `${openAlerts.length} open alert${openAlerts.length === 1 ? "" : "s"}`
                  : `${highLoad.length} circuit${highLoad.length === 1 ? "" : "s"} at high load`}
              </p>
              <p style={{ fontSize: 13, color: muted, marginTop: 2 }}>
                {openAlerts[0]?.message ?? `CH${highLoad[0].channelIndex + 1} · ${highLoad[0].name}`}
              </p>
            </div>
          </div>
        </MCard>
      )}
    </div>
  );
}
