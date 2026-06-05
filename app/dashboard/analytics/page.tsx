"use client";

export const dynamic = "force-dynamic";

import { AnalyticsStats } from "@/components/dashboard/analytics-stats";
import { ConsumptionChart } from "@/components/dashboard/consumption-chart";
import { UsageBreakdown } from "@/components/dashboard/usage-breakdown";
import { EfficiencyScore } from "@/components/dashboard/efficiency-score";
import { AnomalyReports } from "@/components/dashboard/anomaly-reports";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 eg-anim-fade-in">
      {/* Page header */}
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
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-[13px] font-medium self-start"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(148,163,184,0.9)",
          }}
        >
          ↓ Export CSV
        </button>
      </div>

      <AnalyticsStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConsumptionChart />
        </div>
        <div>
          <UsageBreakdown />
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
