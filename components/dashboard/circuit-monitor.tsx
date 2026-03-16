"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
          <h2 className="text-xl font-semibold text-foreground">Circuit Monitor</h2>
          {facilityName && (
            <p className="text-xs text-muted-foreground mt-0.5">{facilityName}</p>
          )}
        </div>
        <Link href="/dashboard/circuits" className="text-sm text-primary hover:underline">
          View All
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No rooms configured. Add a facility in{" "}
          <Link href="/dashboard/settings" className="text-primary hover:underline">
            Settings
          </Link>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.slice(0, 6).map((room) => {
            const { power, percentage, status, statusColor, progressColor } =
              getRoomMockPower(room);
            const Icon = getRoomIcon(room);
            return (
              <Card key={room} className="bg-card border-border p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-secondary rounded-lg">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:bg-primary/10"
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mb-4">
                  <h3 className="font-medium text-foreground">{room}</h3>
                  <p className="text-2xl font-mono font-semibold text-foreground">
                    {power.toLocaleString()}{" "}
                    <span className="text-sm text-muted-foreground">W</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${progressColor} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={statusColor}>{status}</span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
