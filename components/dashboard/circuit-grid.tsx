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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map(({ room, power, percentage, status, statusColor, progressColor }) => {
        const Icon = getRoomIcon(room);
        const isAnomaly = status === "ANOMALY";
        return (
          <div
            key={room}
            className={`relative p-6 rounded-lg border transition-all ${
              isAnomaly
                ? "bg-destructive/5 border-destructive/50"
                : "bg-card border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{room}</h3>
                  <p className="text-xs text-muted-foreground">Circuit</p>
                </div>
              </div>
              {isAnomaly && <AlertTriangle className="h-5 w-5 text-destructive" />}
            </div>

            <div className="mb-4">
              <div className="text-3xl font-bold text-foreground mb-1">
                {power.toLocaleString()}
                <span className="text-xs text-muted-foreground ml-1">W</span>
              </div>
            </div>

            <div className="mb-4">
              <Badge className={getStatusColor(status)}>{status}</Badge>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Load</span>
                <span className="text-xs font-medium text-foreground">{percentage}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progressColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Pred: <span className="text-primary font-medium">{Math.round(power * 0.95)} W</span>
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
