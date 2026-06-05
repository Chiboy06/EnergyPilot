"use client";

import { AlertTriangle, Zap, Clock, TrendingUp, Leaf } from "lucide-react";
import Link from "next/link";

const anomalies = [
  {
    tone: "bad" as const,
    icon: AlertTriangle,
    title: "Harmonic distortion",
    desc: "Compressor — rising 3rd-harmonic content. Schedule inspection within 72h.",
    time: "now",
    score: "0.84",
  },
  {
    tone: "warn" as const,
    icon: TrendingUp,
    title: "Peak demand",
    desc: "Forecast exceeds contracted 18 kW cap at 19:00 by ~8%.",
    time: "2m",
    score: undefined,
  },
  {
    tone: "ok" as const,
    icon: Leaf,
    title: "Load shifted",
    desc: "Water Heater → off-peak window. Saved $0.42.",
    time: "14m",
    score: undefined,
  },
  {
    tone: "warn" as const,
    icon: Zap,
    title: "Kitchen Line inrush",
    desc: "Inrush surge cleared — monitoring.",
    time: "2h",
    score: "0.61",
  },
  {
    tone: "ok" as const,
    icon: Clock,
    title: "Model retrained",
    desc: "DeepAR nightly update complete. MAE 38W on validation.",
    time: "3h",
    score: undefined,
  },
];

const TONE = {
  bad:  { color: "rgba(255,107,107,1)",  bg: "rgba(255,107,107,0.12)"  },
  warn: { color: "rgba(255,181,71,1)",   bg: "rgba(255,181,71,0.12)"   },
  ok:   { color: "rgba(24,227,154,1)",   bg: "rgba(24,227,154,0.12)"   },
};

export function AnomalyFeed() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-1" style={{ color: "rgba(148,163,184,0.6)" }}>
            SageMaker · live
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

      <div className="space-y-2">
        {anomalies.map((a, i) => {
          const t = TONE[a.tone];
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-[14px] eg-anim-slide-up"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                animationDelay: `${i * 50}ms`,
              }}
            >
              <div
                className="w-8 h-8 rounded-[9px] grid place-items-center flex-none mt-0.5"
                style={{ background: t.bg, color: t.color }}
              >
                <a.icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold text-white truncate">{a.title}</span>
                  <span className="font-mono text-[10.5px] flex-none" style={{ color: "rgba(88,105,128,0.9)" }}>
                    {a.time}
                  </span>
                </div>
                <p className="text-[11.5px] leading-relaxed" style={{ color: "rgba(100,116,139,0.85)" }}>
                  {a.desc}
                </p>
                {a.score && (
                  <span
                    className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ color: t.color, background: t.bg, border: `1px solid ${t.color}33` }}
                  >
                    score {a.score}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
