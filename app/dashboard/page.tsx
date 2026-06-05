"use client";

import { useUser } from "@clerk/nextjs";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PowerChart } from "@/components/dashboard/power-chart";
import { CircuitMonitor } from "@/components/dashboard/circuit-monitor";
import { AnomalyFeed } from "@/components/dashboard/anomaly-feed";
import { MobileHomeView } from "@/components/mobile/mobile-home-view";
import { useFacility } from "@/hooks/use-facility";
import { useIsMobile } from "@/hooks/use-mobile";

const FACILITY_TYPE_LABELS: Record<string, string> = {
  residential: "Residential",
  office: "Office",
  institution: "Institution",
  industrial: "Industrial",
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { facilityName, facilityType, rooms } = useFacility();
  const isMobile = useIsMobile();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Mobile: full-bleed glassmorphism home screen
  if (isMobile) {
    return (
      <div
        className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 relative overflow-hidden"
        style={{ minHeight: "calc(100vh - 60px)" }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute rounded-full"
            style={{
              width: 300, height: 300, top: -80, left: -60,
              background: "radial-gradient(circle, rgba(24,227,154,.28), transparent 65%)",
              filter: "blur(50px)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 260, height: 260, top: 120, right: -90,
              background: "radial-gradient(circle, rgba(56,224,224,.16), transparent 65%)",
              filter: "blur(55px)",
            }}
          />
        </div>
        <div className="relative z-10 p-4">
          <MobileHomeView />
        </div>
      </div>
    );
  }

  // Desktop: Liquid Glass overview
  return (
    <div className="space-y-6 eg-anim-fade-in">
      {/* Page header */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase mb-1.5" style={{ color: "rgba(148,163,184,0.55)" }}>
          {facilityName
            ? `${facilityName} · ${FACILITY_TYPE_LABELS[facilityType ?? ""] ?? facilityType}`
            : "Energenius · Smart Energy OS"}
        </p>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {user?.firstName || "Operator"}
            </h1>
            <p className="text-[13.5px] mt-0.5" style={{ color: "rgba(100,116,139,0.9)" }}>
              {rooms.length} circuits monitored · real-time telemetry active
            </p>
          </div>
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
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
      </div>

      {/* Hero stat cards */}
      <StatsCards />

      {/* Power chart */}
      <PowerChart />

      {/* Circuit monitor + anomaly feed */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CircuitMonitor />
        </div>
        <div>
          <AnomalyFeed />
        </div>
      </div>
    </div>
  );
}
