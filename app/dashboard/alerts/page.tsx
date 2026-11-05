"use client";

export const dynamic = "force-dynamic";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useHubData } from "@/hooks/use-hub-data";
import { AlertTriangle, CheckCircle2, Bell, Zap, TrendingUp } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  high_load:              "Whole-building load high",
  circuit_overload:       "Circuit near its rating",
  voltage_high:           "Mains voltage high",
  voltage_low:            "Mains voltage low",
  zero_voltage_with_load: "Current with no voltage",
};

const TYPE_ICON: Record<string, typeof AlertTriangle> = {
  high_load: TrendingUp,
  circuit_overload: Zap,
  voltage_high: Zap,
  voltage_low: Zap,
  zero_voltage_with_load: AlertTriangle,
};

function fmt(ms: number) {
  return new Date(ms).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AlertsPage() {
  const { activeHub } = useHubData();
  const alerts = useQuery(
    api.anomalies.getAnomalies,
    activeHub?._id ? { hubId: activeHub._id, includeResolved: true, limit: 50 } : "skip"
  );
  const open = (alerts ?? []).filter((a) => !a.resolvedAt);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.12em] uppercase text-slate-400 mb-1">
          Recorded by the hub&apos;s readings
        </p>
        <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Alerts</h1>
        <p className="text-base text-slate-400 mt-1 max-w-3xl">
          An alert opens when a reading crosses a fixed voltage limit (above 253 V or below 196 V), whole-building
          load passes your alert levels, or a circuit reaches 90% of its configured rating. It closes automatically
          when a later reading is back in range. Alerts are shown here only — no email or push is sent.
        </p>
      </div>

      <div
        className="glass-card p-4 flex items-center gap-3"
        style={open.length
          ? { borderColor: "rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.06)" }
          : { borderColor: "rgba(24,227,154,0.3)" }}
      >
        <div
          className="w-11 h-11 rounded-[13px] grid place-items-center flex-none"
          style={open.length
            ? { background: "rgba(255,107,107,0.16)", color: "rgba(255,107,107,1)" }
            : { background: "rgba(24,227,154,0.14)", color: "#18e39a" }}
          aria-hidden
        >
          {open.length ? <AlertTriangle size={22} /> : <Bell size={22} />}
        </div>
        <div>
          <p className="text-lg font-semibold text-white">
            {alerts === undefined
              ? "Loading…"
              : !activeHub
              ? "No hub connected"
              : open.length
              ? `${open.length} open alert${open.length === 1 ? "" : "s"}`
              : "No open alerts"}
          </p>
          <p className="text-slate-400 text-sm mt-0.5">Showing the latest {alerts?.length ?? 0} alerts, open and closed.</p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {(alerts ?? []).map((a) => {
          const Icon = a.resolvedAt ? CheckCircle2 : TYPE_ICON[a.type] ?? AlertTriangle;
          const color = a.resolvedAt ? "#18e39a" : a.severity === "critical" ? "rgba(255,107,107,1)" : "rgba(255,181,71,1)";
          return (
            <li key={a._id} className="glass-card p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-[10px] grid place-items-center flex-none mt-0.5"
                  style={{ background: `${color}1f`, color }} aria-hidden>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-base font-semibold text-white">{TYPE_LABEL[a.type] ?? a.type}</span>
                    <span className="text-sm font-semibold" style={{ color }}>
                      {a.resolvedAt ? "Closed" : a.severity === "critical" ? "Open · critical" : "Open · warning"}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mt-0.5">{a.message}</p>
                  <p className="text-slate-400 text-sm mt-1 font-mono">
                    Opened {fmt(a.timestamp)}{a.resolvedAt ? ` · closed ${fmt(a.resolvedAt)}` : ""}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
