"use client";

import { useUser } from "@clerk/nextjs";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PowerChart } from "@/components/dashboard/power-chart";
import { CircuitMonitor } from "@/components/dashboard/circuit-monitor";
import { AnomalyFeed } from "@/components/dashboard/anomaly-feed";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome back, {user?.firstName || "User"}!
        </h1>
        <p className="text-slate-400">
          Here&lsquo;s your energy overview for today.
        </p>
      </div>

      <StatsCards />
      <PowerChart />
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
