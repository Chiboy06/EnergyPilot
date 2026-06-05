"use client";

export const dynamic = "force-dynamic";

import { useFacility } from "@/hooks/use-facility";
import { getRoomMockPower } from "@/lib/room-utils";
import {
  AlertTriangle,
  TrendingUp,
  Leaf,
  CheckCircle2,
  Shield,
  Droplets,
  Bell,
} from "lucide-react";

type AlertTone = "bad" | "warn" | "ok";

interface AlertItem {
  tone: AlertTone;
  icon: React.ElementType;
  title: string;
  desc: string;
  time: string;
  score?: string;
}

const TONE_COLORS: Record<AlertTone, string> = {
  bad:  "rgba(255,107,107,1)",
  warn: "rgba(255,181,71,1)",
  ok:   "rgba(24,227,154,1)",
};
const TONE_BG: Record<AlertTone, string> = {
  bad:  "rgba(255,107,107,0.12)",
  warn: "rgba(255,181,71,0.12)",
  ok:   "rgba(24,227,154,0.12)",
};

const STATIC_ALERTS: AlertItem[] = [
  { tone: "warn", icon: TrendingUp,   title: "Peak demand",       desc: "Forecast peak 19:00 · +8% over cap",               time: "2m"  },
  { tone: "ok",   icon: Leaf,         title: "Load shifted",      desc: "Water Heater → off-peak · saved $0.42",             time: "14m" },
  { tone: "ok",   icon: CheckCircle2, title: "EV Charger 1",      desc: "Session complete · 7.4 kWh",                        time: "31m" },
  { tone: "ok",   icon: Shield,       title: "Model retrain",     desc: "DeepAR updated · MAE 38W",                          time: "1h"  },
  { tone: "warn", icon: Droplets,     title: "Kitchen Line",      desc: "Inrush surge cleared",                              time: "2h"  },
];

export default function AlertsPage() {
  const { rooms } = useFacility();

  const anomalies = rooms.filter((r) => {
    const { status } = getRoomMockPower(r);
    return status === "ANOMALY";
  });

  const liveAlerts: AlertItem[] = anomalies.map((r) => ({
    tone: "bad" as AlertTone,
    icon: AlertTriangle,
    title: r,
    desc: "Harmonic distortion — anomaly score 0.84",
    time: "now",
    score: "0.84",
  }));

  const allAlerts = [...liveAlerts, ...STATIC_ALERTS];

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-500 mb-1">
            SageMaker · live
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Alerts</h1>
        </div>
        <span
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
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

      {/* active anomaly banner */}
      {anomalies.length > 0 && (
        <div
          className="glass-card p-4 flex items-center gap-3"
          style={{
            borderColor: "rgba(255,107,107,0.4)",
            background: "rgba(255,107,107,0.06)",
          }}
        >
          <div
            className="w-11 h-11 rounded-[13px] grid place-items-center flex-none"
            style={{ background: "rgba(255,107,107,0.16)", color: "rgba(255,107,107,1)" }}
          >
            <AlertTriangle size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-white">
              {anomalies.length} active anomal{anomalies.length === 1 ? "y" : "ies"}
            </p>
            <p className="text-slate-400 text-[13px] mt-0.5">
              Tap an alert to isolate the affected breaker
            </p>
          </div>
        </div>
      )}

      {/* no anomalies banner */}
      {anomalies.length === 0 && (
        <div
          className="glass-card p-4 flex items-center gap-3"
          style={{ borderColor: "rgba(24,227,154,0.3)" }}
        >
          <div
            className="w-11 h-11 rounded-[13px] grid place-items-center flex-none"
            style={{ background: "rgba(24,227,154,0.14)", color: "#18e39a" }}
          >
            <Bell size={22} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white">All circuits nominal</p>
            <p className="text-slate-400 text-[13px] mt-0.5">No active anomalies detected</p>
          </div>
        </div>
      )}

      {/* alert list */}
      <div className="space-y-2.5">
        {allAlerts.map((item, i) => (
          <div key={i} className="glass-card p-3.5 eg-anim-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-[10px] grid place-items-center flex-none mt-0.5"
                style={{
                  background: TONE_BG[item.tone],
                  color: TONE_COLORS[item.tone],
                }}
              >
                <item.icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-semibold text-white truncate">
                    {item.title}
                  </span>
                  <span
                    className="text-[11px] font-mono flex-none"
                    style={{ color: "rgba(88,105,128,1)" }}
                  >
                    {item.time}
                  </span>
                </div>
                <p className="text-slate-400 text-[12.5px] mt-0.5">{item.desc}</p>
                {item.score && (
                  <span
                    className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      color: "rgba(255,107,107,1)",
                      background: "rgba(255,107,107,0.10)",
                      border: "1px solid rgba(255,107,107,0.28)",
                    }}
                  >
                    score {item.score}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
