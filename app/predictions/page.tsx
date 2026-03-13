"use client";

import { Authenticated } from "convex/react";
import AppShell from "@/components/layout/AppShell";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    TrendingUp,
    TrendingDown,
    Brain,
    Clock,
    AlertTriangle,
    CheckCircle2,
    BarChart3,
} from "lucide-react";

// Mock prediction data for UI display
const predictions = [
    {
        id: 1,
        title: "Peak Usage Forecast",
        description: "Expected peak consumption between 6-9 PM today",
        value: "3.2 kW",
        trend: "up" as const,
        confidence: 94,
        timeframe: "Today",
    },
    {
        id: 2,
        title: "Weekly Consumption",
        description: "Projected total energy usage for this week",
        value: "342 kWh",
        trend: "down" as const,
        confidence: 88,
        timeframe: "This Week",
    },
    {
        id: 3,
        title: "Monthly Bill Estimate",
        description: "Estimated electricity bill based on current patterns",
        value: "$127.50",
        trend: "down" as const,
        confidence: 82,
        timeframe: "This Month",
    },
    {
        id: 4,
        title: "Solar Generation",
        description: "Expected solar panel output for tomorrow",
        value: "8.5 kWh",
        trend: "up" as const,
        confidence: 76,
        timeframe: "Tomorrow",
    },
];

const anomalies = [
    {
        id: 1,
        title: "Unusual Spike",
        description: "Kitchen circuit exceeded historical norm by 45%.",
        location: "Kitchen",
        time: "14:02",
        severity: "warning" as const,
    },
    {
        id: 2,
        title: "Voltage Drop",
        description: "Severe voltage irregularity detected in HVAC unit.",
        location: "HVAC",
        time: "09:45",
        severity: "error" as const,
    },
    {
        id: 3,
        title: "Pattern Learned",
        description: "New usage pattern identified for weekday mornings.",
        location: "System",
        time: "Yesterday",
        severity: "info" as const,
    },
];

function PredictionsContent() {
    return (
        <div className="space-y-8 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                    ML Predictions
                </h1>
                <p className="text-sm text-slate-400">
                    AI-powered forecasts and anomaly detection for your energy ecosystem.
                </p>
            </div>

            {/* Prediction Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {predictions.map((pred) => (
                    <Card key={pred.id} className="bg-slate-900 border-white/5 hover:border-emerald-500/20 transition-all group">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 border-slate-700">
                                    {pred.timeframe}
                                </Badge>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Brain className="h-3.5 w-3.5 text-emerald-400" />
                                    {pred.confidence}% confidence
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <CardTitle className="text-base font-semibold text-white mb-1">
                                    {pred.title}
                                </CardTitle>
                                <p className="text-sm text-slate-400">{pred.description}</p>
                            </div>
                            <div className="flex items-end justify-between pt-2">
                                <span className="text-3xl font-bold text-white tracking-tight">{pred.value}</span>
                                <div className={`flex items-center gap-1 text-sm font-medium ${pred.trend === "up" ? "text-amber-400" : "text-emerald-400"}`}>
                                    {pred.trend === "up" ? (
                                        <TrendingUp className="h-4 w-4" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4" />
                                    )}
                                    {pred.trend === "up" ? "Higher" : "Lower"} than avg
                                </div>
                            </div>
                            {/* Confidence bar */}
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-emerald-500/60"
                                    style={{ width: `${pred.confidence}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Anomaly Feed */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Anomaly Feed</h2>
                        <p className="text-sm text-slate-400 mt-1">Recent AI detections and learned patterns.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-slate-400">Live</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {anomalies.map((anomaly) => {
                        const severityConfig = {
                            warning: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                            error: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                            info: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                        };
                        const config = severityConfig[anomaly.severity];

                        return (
                            <Card key={anomaly.id} className={`border ${config.bg} bg-slate-900/50`}>
                                <CardContent className="pt-5 pb-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-0.5 ${config.color}`}>
                                            {config.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className={`font-semibold ${config.color}`}>{anomaly.title}</h4>
                                                <span className="text-xs text-slate-500 flex-shrink-0">{anomaly.time}</span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1">{anomaly.description}</p>
                                            <span className="text-xs text-slate-500 mt-2 inline-block">{anomaly.location}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function PredictionsPage() {
    return (
        <Authenticated>
            <AppShell>
                <PredictionsContent />
            </AppShell>
        </Authenticated>
    );
}
