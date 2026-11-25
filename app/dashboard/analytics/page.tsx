"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { AnalyticsStats } from "@/components/dashboard/analytics-stats";
import { ConsumptionChart } from "@/components/dashboard/consumption-chart";
import { UsageBreakdown } from "@/components/dashboard/usage-breakdown";
import { EfficiencyScore } from "@/components/dashboard/efficiency-score";
import { AnomalyReports } from "@/components/dashboard/anomaly-reports";
import { calendarMonth, lastDays, recentMonths } from "@/lib/range";

const DAY_RANGES = [7, 14, 30];

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default function AnalyticsPage() {
  // Fixed when the page opens, so queries don't change on every render.
  const [now] = useState(() => Math.floor(Date.now() / 1000));
  const [selected, setSelected] = useState("d30");
  const months = recentMonths(now, 12);

  const range = selected.startsWith("m")
    ? calendarMonth(now, selected.slice(1))
    : lastDays(now, Number(selected.slice(1)));

  const pill = (active: boolean) => active
    ? { background: "rgba(24,227,154,0.15)", color: "#18e39a", border: "1px solid rgba(24,227,154,0.3)" }
    : { background: "rgba(255,255,255,0.05)", color: "rgba(148,163,184,0.85)", border: "1px solid rgba(255,255,255,0.08)" };

  return (
    <div className="space-y-6 eg-anim-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] uppercase mb-1.5" style={{ color: "rgba(148,163,184,0.8)" }}>
            History · not live
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-base lg:text-lg mt-1" style={{ color: "rgba(148,163,184,0.85)" }}>
            Daily energy totals for {range.label} (WAT calendar days)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2" role="tablist" aria-label="Time range">
            {DAY_RANGES.map((d) => (
              <button key={d} onClick={() => setSelected(`d${d}`)}
                role="tab" aria-selected={selected === `d${d}`}
                className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors"
                style={pill(selected === `d${d}`)}>
                Last {d} days
              </button>
            ))}
          </div>
          <select
            aria-label="Show a calendar month"
            value={selected.startsWith("m") ? selected : ""}
            onChange={(e) => e.target.value && setSelected(e.target.value)}
            className="px-3.5 py-1.5 rounded-full text-sm font-semibold"
            style={pill(selected.startsWith("m"))}
          >
            <option value="" disabled>Month…</option>
            {months.map((m) => (
              <option key={m} value={`m${m}`} style={{ background: "#0b1220", color: "#e2e8f0" }}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>
      </div>

      <AnalyticsStats range={range} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConsumptionChart range={range} />
        </div>
        <div>
          <UsageBreakdown range={range} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <EfficiencyScore range={range} />
        </div>
        <div className="lg:col-span-2">
          <AnomalyReports />
        </div>
      </div>
    </div>
  );
}
