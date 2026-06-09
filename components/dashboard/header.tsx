"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { Bell, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DashboardSidebar } from "./sidebar";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useHubData } from "@/hooks/use-hub-data";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":             "Overview",
  "/dashboard/circuits":    "Circuits",
  "/dashboard/predictions": "Predictions",
  "/dashboard/analytics":   "Analytics",
  "/dashboard/settings":    "Settings",
  "/dashboard/alerts":      "Alerts",
  "/dashboard/more":        "More",
};

export function DashboardHeader() {
  const { user } = useUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hubState } = useHubData();

  const routeLabel = ROUTE_LABELS[pathname] ?? "Dashboard";

  const totalKw = hubState ? (hubState.totalPowerW / 1000).toFixed(2) : "—";
  const anomalyCount = 0;

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join("").toUpperCase() || "OP";

  return (
    <header
      className="h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20"
      style={{
        background: "rgba(7,11,18,0.60)",
        backdropFilter: "blur(18px) saturate(160%)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-3">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-400 hover:text-white"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64" style={{ background: "transparent", border: "none" }}>
            <DashboardSidebar onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="hidden sm:flex items-center gap-2 text-[13.5px]">
          <span style={{ color: "rgba(148,163,184,0.7)" }}>EnergyPilot</span>
          <ChevronRight size={13} style={{ color: "rgba(88,105,128,0.8)" }} />
          <span className="font-semibold text-white">{routeLabel}</span>
        </div>
      </div>

      {/* Right: live kW + bell + avatar */}
      <div className="flex items-center gap-3">
        {/* Live kW reading */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="live-dot" />
          <span className="font-mono text-[13px]" style={{ color: "#18e39a" }}>
            {totalKw} kW
          </span>
        </div>

        <div className="hidden sm:block w-px h-5" style={{ background: "rgba(255,255,255,0.10)" }} />

        {/* Bell */}
        <button
          className="relative w-9 h-9 grid place-items-center rounded-[10px] transition-colors"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "rgba(148,163,184,1)",
          }}
        >
          <Bell size={16} />
          {anomalyCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
              style={{ background: "rgba(255,107,107,1)", boxShadow: "0 0 6px rgba(255,107,107,0.8)" }}
            />
          )}
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right">
            <p className="text-[13px] font-semibold text-white leading-none">{user?.firstName || "Operator"}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(88,105,128,1)" }}>Admin</p>
          </div>
          <div
            className="w-9 h-9 rounded-[10px] grid place-items-center font-bold text-[13px] flex-none"
            style={{
              background: "linear-gradient(135deg,#2bf0aa,#10b981)",
              color: "#03130c",
            }}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
