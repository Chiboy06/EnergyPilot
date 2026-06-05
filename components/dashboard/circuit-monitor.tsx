"use client";

import { Power, Loader2 } from "lucide-react";
import Link from "next/link";
import { useFacility } from "@/hooks/use-facility";
import { getRoomIcon, getRoomMockPower } from "@/lib/room-utils";

export function CircuitMonitor() {
  const { rooms, facilityName, isLoading } = useFacility();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-1" style={{ color: "rgba(148,163,184,0.6)" }}>
            {facilityName || "Facility"} · live
          </p>
          <h2 className="text-[17px] font-semibold text-white">Circuit Monitor</h2>
        </div>
        <Link
          href="/dashboard/circuits"
          className="text-[12.5px] font-medium transition-colors"
          style={{ color: "#18e39a" }}
        >
          View All →
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="text-emerald-400 animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-[13px]" style={{ color: "rgba(100,116,139,0.8)" }}>
          No rooms configured.{" "}
          <Link href="/dashboard/settings" style={{ color: "#18e39a" }}>
            Add facility in Settings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.slice(0, 6).map((room) => {
            const { power, percentage, status, statusColor } = getRoomMockPower(room);
            const Icon = getRoomIcon(room);
            const isAnomaly = status === "ANOMALY";
            const barColor = isAnomaly ? "#ff6b6b" : percentage > 80 ? "#ffb547" : "#18e39a";

            return (
              <div
                key={room}
                className="glass-card p-4 eg-anim-slide-up"
                style={isAnomaly ? { borderColor: "rgba(255,107,107,0.35)" } : undefined}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-[10px] grid place-items-center flex-none"
                    style={{
                      background: isAnomaly ? "rgba(255,107,107,0.14)" : "rgba(24,227,154,0.10)",
                      color: isAnomaly ? "rgba(255,107,107,1)" : "#18e39a",
                    }}
                  >
                    <Icon size={17} />
                  </div>
                  <button
                    className="w-8 h-8 grid place-items-center rounded-[9px] transition-colors"
                    style={{
                      background: "rgba(24,227,154,0.08)",
                      border: "1px solid rgba(24,227,154,0.18)",
                      color: "#18e39a",
                    }}
                  >
                    <Power size={14} />
                  </button>
                </div>

                <div className="mb-3">
                  <p className="text-[13px] font-medium text-white leading-tight">{room}</p>
                  <p className="font-mono font-bold text-[22px] text-white leading-tight mt-0.5">
                    {power.toLocaleString()}{" "}
                    <span className="text-[13px] font-normal" style={{ color: "rgba(100,116,139,0.9)" }}>W</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percentage}%`, background: barColor, boxShadow: `0 0 8px ${barColor}55` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span style={{ color: isAnomaly ? "rgba(255,107,107,1)" : "rgba(148,163,184,0.7)" }}>
                      {status}
                    </span>
                    <span className="font-mono" style={{ color: "rgba(100,116,139,0.8)" }}>{percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
