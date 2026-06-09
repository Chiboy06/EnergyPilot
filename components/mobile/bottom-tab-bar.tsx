"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Activity, TrendingUp, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard",             icon: LayoutDashboard, label: "Overview"    },
  { href: "/dashboard/circuits",    icon: Activity,        label: "Circuits"    },
  { href: "/dashboard/predictions", icon: TrendingUp,      label: "Predictions" },
  { href: "/dashboard/analytics",   icon: BarChart3,       label: "Analytics"   },
  { href: "/dashboard/settings",    icon: Settings,        label: "Settings"    },
] as const;

export function MobileBottomTabBar() {
  const pathname = usePathname();

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-safe-area-inset-bottom"
      style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
    >
      {/* fade gradient so content doesn't clip hard under the bar */}
      <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
           style={{ background: "linear-gradient(to top, #04060a 0%, transparent 100%)" }} />

      <nav
        className="relative flex justify-around items-center px-2 py-2 rounded-[22px]"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          boxShadow: "0 8px 30px -10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        {TABS.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-colors duration-200",
                isActive ? "text-emerald-400" : "text-slate-500"
              )}
            >
              <Icon
                size={21}
                style={
                  isActive
                    ? { filter: "drop-shadow(0 0 8px rgba(16,185,129,0.7))" }
                    : undefined
                }
              />
              <span className="text-[10px] font-semibold tracking-tight leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
