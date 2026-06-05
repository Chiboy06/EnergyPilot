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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase mb-1.5" style={{ color: "rgba(148,163,184,0.55)" }}>
            SageMaker · Load Forecasting
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Energy Forecast &amp; Insights</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "rgba(100,116,139,0.9)" }}>
            DeepAR model · retrained nightly · MAE 38W on validation
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-[13px] font-medium transition-colors self-start"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(148,163,184,0.9)",
          }}
        >
          ☰ Model Settings
        </button>
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
