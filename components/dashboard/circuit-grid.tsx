"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useFacility } from "@/hooks/use-facility";
import { getRoomIcon, getRoomMockPower } from "@/lib/room-utils";
import Link from "next/link";

interface CircuitGridProps {
  filter: "all" | "active" | "issues";
}

export function CircuitGrid({ filter }: CircuitGridProps) {
  const { rooms, isLoading } = useFacility();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  const isEnabled = (room: string) => enabled[room] !== false;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HIGH LOAD": return "bg-warning/20 text-warning";
      case "ANOMALY":   return "bg-destructive/20 text-destructive";
      case "OFFLINE":   return "bg-muted/20 text-muted-foreground";
      case "LOW":       return "bg-muted/20 text-muted-foreground";
      default:          return "bg-primary/20 text-primary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No rooms configured. Complete{" "}
        <Link href="/onboarding" className="text-primary hover:underline">
          onboarding
        </Link>{" "}
        to set up your facility.
      </div>
    );
  }

  const circuits = rooms.map((room) => {
    const mock = getRoomMockPower(room);
    return { room, ...mock, enabled: isEnabled(room) };
  });

  const filtered = circuits.filter((c) => {
    if (filter === "active") return c.enabled && c.status !== "OFFLINE";
    if (filter === "issues") return c.status === "ANOMALY" || c.status === "HIGH LOAD";
    return true;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {filtered.map(({ room, power, percentage, status, statusColor, progressColor }) => {
        const Icon = getRoomIcon(room);
        const isAnomaly = status === "ANOMALY";
        return (
          <div
            key={room}
            className="glass-card relative p-5 transition-all"
            style={isAnomaly ? { borderColor: "rgba(255,107,107,0.38)" } : undefined}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-[9px]"
                  style={{
                    background: isAnomaly ? "rgba(255,107,107,0.14)" : "rgba(24,227,154,0.10)",
                    color: isAnomaly ? "rgba(255,107,107,1)" : "#18e39a",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-[14px]">{room}</h3>
                  <p className="text-[11px]" style={{ color: "rgba(88,105,128,0.9)" }}>Circuit</p>
                </div>
              </div>
              {isAnomaly && <AlertTriangle size={17} style={{ color: "rgba(255,107,107,1)" }} />}
            </div>

            <div className="mb-3">
              <div className="font-mono font-bold text-[26px] text-white leading-none">
                {power.toLocaleString()}
                <span className="text-[12px] font-normal ml-1" style={{ color: "rgba(100,116,139,0.8)" }}>W</span>
              </div>
            </div>

            <div className="mb-3">
              <span
                className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  color: isAnomaly ? "rgba(255,107,107,1)" : status === "HIGH LOAD" ? "rgba(255,181,71,1)" : "#18e39a",
                  background: isAnomaly ? "rgba(255,107,107,0.12)" : status === "HIGH LOAD" ? "rgba(255,181,71,0.12)" : "rgba(24,227,154,0.12)",
                  border: `1px solid ${isAnomaly ? "rgba(255,107,107,0.3)" : status === "HIGH LOAD" ? "rgba(255,181,71,0.3)" : "rgba(24,227,154,0.3)"}`,
                }}
              >
                {status}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11.5px]" style={{ color: "rgba(100,116,139,0.8)" }}>Load</span>
                <span className="text-[11.5px] font-mono" style={{ color: "rgba(148,163,184,0.8)" }}>{percentage}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    background: isAnomaly ? "#ff6b6b" : percentage > 80 ? "#ffb547" : "#18e39a",
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="text-[11px]" style={{ color: "rgba(100,116,139,0.8)" }}>
                Pred:{" "}
                <span className="font-mono font-medium" style={{ color: "#18e39a" }}>
                  {Math.round(power * 0.95)} W
                </span>
              </span>
              <Switch
                checked={isEnabled(room)}
                onCheckedChange={(checked) =>
                  setEnabled((prev) => ({ ...prev, [room]: checked }))
                }
                aria-label={`Toggle ${room}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
