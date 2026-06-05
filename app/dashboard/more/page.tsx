"use client";

export const dynamic = "force-dynamic";

import { useUser, useClerk } from "@clerk/nextjs";
import { useFacility } from "@/hooks/use-facility";
import {
  User,
  Bell,
  SlidersHorizontal,
  Cpu,
  Server,
  ChevronRight,
  LogOut,
  Wifi,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsRow {
  icon: React.ElementType;
  label: string;
  detail: string;
  href?: string;
  danger?: boolean;
}

export default function MorePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { facilityName, facilityType } = useFacility();

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "OP";

  const rows: SettingsRow[] = [
    { icon: User,             label: "Account",        detail: "Operator · Admin"    },
    { icon: Bell,             label: "Notifications",  detail: "4 enabled"            },
    { icon: SlidersHorizontal,label: "Thresholds",     detail: "edge-enforced"        },
    { icon: Cpu,              label: "Edge Devices",   detail: "3 / 4 online"         },
    { icon: Server,           label: "API Access",     detail: "MQTT · live"          },
  ];

  return (
    <div className="space-y-5">
      {/* header */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-500 mb-1">
          Settings
        </p>
        <h1 className="text-2xl font-bold text-white tracking-tight">More</h1>
      </div>

      {/* profile card */}
      <div
        className="glass-card p-4 flex items-center gap-4"
        style={{ borderColor: "rgba(24,227,154,0.2)" }}
      >
        <div
          className="w-14 h-14 rounded-[17px] grid place-items-center font-bold text-xl flex-none"
          style={{
            background: "linear-gradient(135deg,#2bf0aa,#10b981)",
            color: "#03130c",
            boxShadow: "0 0 20px rgba(24,227,154,0.4)",
          }}
        >
          {initials}
        </div>
        <div>
          <p className="text-[16px] font-semibold text-white leading-tight">
            {user?.fullName || "Energenius Operator"}
          </p>
          <p className="text-slate-400 text-[12.5px] mt-0.5">
            {user?.primaryEmailAddress?.emailAddress || "ops@energenius.io"}
          </p>
          {facilityName && (
            <p className="text-emerald-400 text-[11px] mt-1 capitalize font-medium">
              {facilityName} · {facilityType}
            </p>
          )}
        </div>
      </div>

      {/* settings rows */}
      <div
        className="glass-card overflow-hidden"
        style={{ borderRadius: 22, padding: 0 }}
      >
        {rows.map(({ icon: Icon, label, detail }, i) => (
          <div
            key={label}
            className={cn(
              "flex items-center justify-between px-4 py-3.5",
              i < rows.length - 1 && "border-b border-white/[0.07]"
            )}
          >
            <div className="flex items-center gap-3.5">
              <Icon size={18} className="text-emerald-400 flex-none" />
              <span className="text-[14.5px] font-medium text-white">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-500">{detail}</span>
              <ChevronRight size={15} className="text-slate-600" />
            </div>
          </div>
        ))}
      </div>

      {/* edge mesh status */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold text-white">Edge Mesh</span>
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
            style={{
              color: "#18e39a",
              background: "rgba(24,227,154,0.10)",
              border: "1px solid rgba(24,227,154,0.25)",
            }}
          >
            <span className="live-dot" />
            ESP-NOW
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[12.5px] text-slate-400">
              <Wifi size={13} className="text-slate-500" />
              Latency
            </span>
            <span className="font-mono text-[12.5px] text-emerald-400">0.9 ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[12.5px] text-slate-400">
              <Zap size={13} className="text-slate-500" />
              Cloud
            </span>
            <span className="font-mono text-[12.5px] text-slate-300">AWS IoT · eu-west-1</span>
          </div>
        </div>
      </div>

      {/* logout */}
      <button
        onClick={() => signOut({ redirectUrl: "/" })}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-[16px] text-[14.5px] font-semibold transition-colors"
        style={{
          color: "rgba(255,107,107,1)",
          background: "rgba(255,107,107,0.08)",
          border: "1px solid rgba(255,107,107,0.2)",
        }}
      >
        <LogOut size={18} />
        Sign out
      </button>
    </div>
  );
}
