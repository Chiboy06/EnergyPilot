"use client";

import { Zap, BarChart3, Activity, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const stats = [
  {
    title: "Total Power",
    value: "2,847",
    unit: "W",
    change: "+12%",
    changeLabel: "vs last hour",
    icon: Zap,
    color: "text-emerald-400",
    showBars: true,
  },
  {
    title: "Avg per Circuit",
    value: "284.7",
    unit: "W",
    subtitle: "Across 10 active circuits",
    subtitle2: "Optimized load balance",
    icon: BarChart3,
    color: "text-blue-400",
  },
  {
    title: "Active Circuits",
    value: "10",
    total: "/10",
    subtitle: "100% Online",
    icon: Activity,
    color: "text-emerald-400",
    showDots: true,
  },
  {
    title: "Anomaly Status",
    value: "0 Alerts",
    valueColor: "text-emerald-400",
    subtitle: "Last check: 2 min ago",
    status: "System Nominal",
    statusColor: "text-emerald-400",
    icon: AlertTriangle,
    color: "text-emerald-400",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-slate-900 border-slate-800 p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
            <span className="text-sm text-slate-400">{stat.title}</span>
          </div>

          {/* Value */}
          <div className="mb-2">
            <span className={`text-3xl font-mono font-bold ${stat.valueColor || "text-white"}`}>
              {stat.value}
            </span>
            {stat.unit && <span className="text-xl font-mono text-white ml-1">{stat.unit}</span>}
            {stat.total && <span className="text-lg text-slate-500 ml-1">{stat.total}</span>}
          </div>

          {/* Change indicator */}
          {stat.change && (
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-sm text-emerald-400">{stat.change}</span>
              <span className="text-sm text-slate-500">{stat.changeLabel}</span>
            </div>
          )}

          {/* Subtitle */}
          {stat.subtitle && (
            <p className="text-sm text-slate-400">{stat.subtitle}</p>
          )}
          {stat.subtitle2 && (
            <p className="text-sm text-slate-400">{stat.subtitle2}</p>
          )}

          {/* Status */}
          {stat.status && (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className={`h-3 w-3 ${stat.statusColor}`} />
              <span className={`text-sm ${stat.statusColor}`}>{stat.status}</span>
            </div>
          )}

          {/* Bars visualization */}
          {stat.showBars && (
            <div className="flex items-end gap-1 h-8 mt-4">
              {[90, 110, 130, 140, 145, 120, 105,165, 175, 126].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-emerald-500 rounded-sm transition-all"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          )}

          {/* Dots visualization */}
          {stat.showDots && (
            <div className="flex items-center gap-1.5 mt-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-2 w-2 rounded-full bg-emerald-500" />
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
