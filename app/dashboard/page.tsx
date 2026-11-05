"use client";

import { useUser } from "@clerk/nextjs";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PowerChart } from "@/components/dashboard/power-chart";
import { CircuitMonitor } from "@/components/dashboard/circuit-monitor";
import { AnomalyFeed } from "@/components/dashboard/anomaly-feed";
import { MobileHomeView } from "@/components/mobile/mobile-home-view";
import { useHubData } from "@/hooks/use-hub-data";
import { useIsMobile } from "@/hooks/use-mobile";

const FACILITY_TYPE_LABELS: Record<string, string> = {
  residential: "Residential",
  office: "Office",
  institution: "Institution",
  industrial: "Industrial",
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { facilityName, facilityType, circuitStates, activeHub, isFresh, lastUpdated, userRole } = useHubData();
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
        <p className="text-xs font-semibold tracking-[0.12em] uppercase mb-1.5" style={{ color: "rgba(148,163,184,0.8)" }}>
          {facilityName
            ? `${facilityName} · ${FACILITY_TYPE_LABELS[facilityType ?? ""] ?? facilityType}${userRole !== "owner" ? ` · shared with you (${userRole})` : ""}`
            : "EnergyPilot"}
        </p>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Welcome back, {user?.firstName || "Operator"}
            </h1>
            <p className="text-base lg:text-lg mt-1" style={{ color: "rgba(148,163,184,0.85)" }}>
              {activeHub
                ? `${activeHub.name} · ${circuitStates.length} circuits configured on a ${activeHub.channelCount}-channel hub`
                : "No hub connected"}
            </p>
          </div>
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
            style={isFresh
              ? { color: "#18e39a", background: "rgba(24,227,154,0.10)", border: "1px solid rgba(24,227,154,0.25)" }
              : { color: "rgba(255,181,71,1)", background: "rgba(255,181,71,0.10)", border: "1px solid rgba(255,181,71,0.25)" }}
          >
            {isFresh && <span className="live-dot" />}
            {isFresh ? "live" : lastUpdated ? "stale" : "no data"}
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
