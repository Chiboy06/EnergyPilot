"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  Zap,
  LayoutDashboard,
  Activity,
  TrendingUp,
  BarChart3,
  Settings,
  Wifi,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",             icon: LayoutDashboard, label: "Overview"    },
  { href: "/dashboard/circuits",    icon: Activity,        label: "Circuits"    },
  { href: "/dashboard/predictions", icon: TrendingUp,      label: "Predictions" },
  { href: "/dashboard/analytics",   icon: BarChart3,       label: "Analytics"   },
  { href: "/dashboard/settings",    icon: Settings,        label: "Settings"    },
];

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <aside
      className="w-full h-full flex flex-col"
      style={{
        background: "rgba(7,11,18,0.72)",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div
          className="w-9 h-9 rounded-[11px] grid place-items-center flex-none"
          style={{
            background: "linear-gradient(135deg,#2bf0aa,#10b981)",
            boxShadow: "0 0 20px rgba(24,227,154,0.45), inset 0 1px 0 rgba(255,255,255,.35)",
          }}
        >
          <Zap size={18} style={{ color: "#03130c", fill: "#03130c" }} />
        </div>
        <div>
          <div className="text-[16px] font-bold text-white tracking-tight leading-none">
            EnergyPilot
          </div>
          <div
            className="text-[9px] font-semibold tracking-[0.15em] uppercase mt-0.5"
            style={{ color: "rgba(24,227,154,0.6)" }}
          >
            Smart Energy OS
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-3.5 py-3 rounded-[12px] text-[14px] font-medium transition-all duration-200"
              style={
                isActive
                  ? {
                      background: "rgba(24,227,154,0.12)",
                      color: "#18e39a",
                      border: "1px solid rgba(24,227,154,0.28)",
                      boxShadow: "0 0 18px -6px rgba(24,227,154,0.5)",
                    }
                  : {
                      color: "rgba(148,163,184,1)",
                      border: "1px solid transparent",
                    }
              }
            >
              <item.icon size={17} className="flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Edge Mesh widget */}
      <div className="mx-3 mb-3 p-3.5 rounded-[14px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Wifi size={13} style={{ color: "#18e39a" }} />
          <span className="text-[9px] font-semibold tracking-[0.15em] uppercase" style={{ color: "rgba(24,227,154,0.6)" }}>
            Edge Mesh
          </span>
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11.5px]" style={{ color: "rgba(148,163,184,0.8)" }}>ESP-NOW</span>
          <span className="font-mono text-[11.5px]" style={{ color: "#18e39a" }}>0.9 ms</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11.5px]" style={{ color: "rgba(148,163,184,0.8)" }}>Nodes</span>
          <span className="font-mono text-[11.5px] text-white">3 / 4 up</span>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors"
          style={{
            color: "rgba(255,107,107,0.9)",
            background: "rgba(255,107,107,0.07)",
            border: "1px solid rgba(255,107,107,0.18)",
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
