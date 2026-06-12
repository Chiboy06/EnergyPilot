"use client";

import { AlertTriangle, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useHubData } from "@/hooks/use-hub-data";

function relTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 90_000) return "now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
  return `${Math.floor(d / 86_400_000)}d`;
}

const TYPE_ICON: Record<string, typeof AlertTriangle> = {
  high_load:               TrendingUp,
  circuit_overload:        Zap,
  voltage_high:            Zap,
  voltage_low:             Zap,
  zero_voltage_with_load:  AlertTriangle,
};

const TYPE_LABEL: Record<string, string> = {
  high_load:              "High load",
  circuit_overload:       "Circuit overload",
  voltage_high:           "Voltage high",
  voltage_low:            "Voltage low",
  zero_voltage_with_load: "Zero voltage / fault",
};

const TONE = {
  bad:  { color: "rgba(255,107,107,1)",  bg: "rgba(255,107,107,0.12)"  },
  warn: { color: "rgba(255,181,71,1)",   bg: "rgba(255,181,71,0.12)"   },
  ok:   { color: "rgba(24,227,154,1)",   bg: "rgba(24,227,154,0.12)"   },
};

export function AnomalyFeed() {
  const { activeHub } = useHubData();
  const hubId = activeHub?._id;

  const anomalies = useQuery(
    api.anomalies.getAnomalies,
    hubId ? { hubId, includeResolved: true, limit: 5 } : "skip"
  );

  const items = anomalies ?? [];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-1" style={{ color: "rgba(148,163,184,0.6)" }}>
            Anomaly detector · live
          </p>
          <h2 className="text-[17px] font-semibold text-white">Live Events</h2>
        </div>
        <Link
          href="/dashboard/alerts"
          className="text-[12px] font-medium"
          style={{ color: "#18e39a" }}
        >
          All alerts →
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] text-center py-6" style={{ color: "rgba(100,116,139,0.7)" }}>
          {hubId ? "No anomalies detected — all nominal" : "Connect a hub to see events"}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((a, i) => {
            const tone = a.resolvedAt ? "ok" : a.severity === "critical" ? "bad" : "warn";
            const t    = TONE[tone];
            const Icon = TYPE_ICON[a.type] ?? AlertTriangle;
            const score = a.severity !== "warning" ? (a.value / Math.max(a.threshold, 0.001)).toFixed(2) : undefined;

            return (
              <div
                key={a._id}
                className="flex items-start gap-3 p-3 rounded-[14px] eg-anim-slide-up"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border:     "1px solid rgba(255,255,255,0.07)",
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-[9px] grid place-items-center flex-none mt-0.5"
                  style={{ background: t.bg, color: t.color }}
                >
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold text-white truncate">
                      {TYPE_LABEL[a.type] ?? a.type}
                    </span>
                    <span className="font-mono text-[10.5px] flex-none" style={{ color: "rgba(88,105,128,0.9)" }}>
                      {relTime(a.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed truncate" style={{ color: "rgba(100,116,139,0.85)" }}>
                    {a.message}
                  </p>
                  {score && (
                    <span
                      className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ color: t.color, background: t.bg, border: `1px solid ${t.color}33` }}
                    >
                      {a.resolvedAt ? "resolved" : `score ${score}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
