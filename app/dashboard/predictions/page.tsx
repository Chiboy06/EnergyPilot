"use client";

export const dynamic = "force-dynamic";

import { ForecastStats } from "@/components/dashboard/forecast-stats";
import { LoadProjectionChart } from "@/components/dashboard/load-projection-chart";
import { MLInsights } from "@/components/dashboard/ml-insights";
import { SmartActions } from "@/components/dashboard/smart-actions";

export default function PredictionsPage() {
  return (
    <div className="space-y-6 eg-anim-fade-in">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold tracking-[0.12em] uppercase mb-1.5" style={{ color: "rgba(148,163,184,0.8)" }}>
          Estimate · not a validated forecast
        </p>
        <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">24-Hour Energy Estimate</h1>
        <p className="text-base lg:text-lg mt-1 max-w-3xl" style={{ color: "rgba(148,163,184,0.85)" }}>
          For each hour of the next 24 hours, we show the average power your whole system drew at that hour over the
          last 7 days. It assumes the coming day looks like recent days, has not been checked for accuracy, and is
          regenerated once a day at 01:00 WAT.
        </p>
      </div>

      <ForecastStats />
      <LoadProjectionChart />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MLInsights />
        </div>
        <div className="lg:col-span-1">
          <SmartActions />
        </div>
      </div>
    </div>
  );
}
