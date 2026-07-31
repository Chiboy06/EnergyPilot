"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { AnalyticsStats } from "@/components/dashboard/analytics-stats";
import { ConsumptionChart } from "@/components/dashboard/consumption-chart";
import { UsageBreakdown } from "@/components/dashboard/usage-breakdown";
import { EfficiencyScore } from "@/components/dashboard/efficiency-score";
import { AnomalyReports } from "@/components/dashboard/anomaly-reports";

const RANGES = [{ label: "7d", days: 7 }, { label: "14d", days: 14 }, { label: "30d", days: 30 }];

export default function AnalyticsPage() {
  const [rangeDays, setRangeDays] = useState(30);

  return (
    <div className="space-y-6 eg-anim-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase mb-1.5" style={{ color: "rgba(148,163,184,0.55)" }}>
            Reporting · Timestream
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "rgba(100,116,139,0.9)" }}>
            Historical consumption, breakdown and efficiency benchmarks
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map(r => (
            <button key={r.label} onClick={() => setRangeDays(r.days)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={rangeDays === r.days
                ? { background: "rgba(24,227,154,0.15)", color: "#18e39a", border: "1px solid rgba(24,227,154,0.3)" }
                : { background: "rgba(255,255,255,0.05)", color: "rgba(148,163,184,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <AnalyticsStats rangeDays={rangeDays} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConsumptionChart rangeDays={rangeDays} />
        </div>
        <div>
          <UsageBreakdown rangeDays={rangeDays} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <EfficiencyScore />
        </div>
        <div className="lg:col-span-2">
          <AnomalyReports />
        </div>
      </div>
    </div>
  );
}
