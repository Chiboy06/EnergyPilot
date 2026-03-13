"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Zap,
    Power,
    Home,
    Monitor,
    Server,
    Car,
    Lightbulb,
    Fan,
} from "lucide-react";

const circuitIcons: Record<string, React.ReactNode> = {
    solar: <Zap className="h-5 w-5" />,
    hvac: <Fan className="h-5 w-5" />,
    lighting: <Lightbulb className="h-5 w-5" />,
    appliance: <Home className="h-5 w-5" />,
    ev_charger: <Car className="h-5 w-5" />,
    other: <Monitor className="h-5 w-5" />,
};

const statusConfig: Record<string, { label: string; color: string; barColor: string }> = {
    online: { label: "Active", color: "text-emerald-400", barColor: "bg-emerald-500" },
    offline: { label: "Inactive", color: "text-slate-500", barColor: "bg-slate-700" },
    warning: { label: "High Load", color: "text-amber-400", barColor: "bg-amber-500" },
};

export default function CircuitsPage() {
    const devices = useQuery(api.devices.list) ?? [];

    const totalPower = devices.reduce((sum, d) => sum + d.powerRating, 0);
    const maxPower = Math.max(...devices.map((d) => d.powerRating), 1);

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                    Circuit Monitor
                </h1>
                <p className="text-sm text-slate-400">
                    Monitor individual circuits and their real-time load status.
                </p>
            </div>

            {/* Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <Card className="bg-slate-900 border-white/5">
                    <CardContent className="pt-6">
                        <div className="text-xs text-slate-400 mb-1">Total Circuits</div>
                        <div className="text-2xl sm:text-3xl font-bold text-white">{devices.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-white/5">
                    <CardContent className="pt-6">
                        <div className="text-xs text-slate-400 mb-1">Total Load</div>
                        <div className="text-2xl sm:text-3xl font-bold text-white">
                            {totalPower >= 1000 ? `${(totalPower / 1000).toFixed(1)}` : totalPower}
                            <span className="text-sm text-emerald-400 ml-1">{totalPower >= 1000 ? "kW" : "W"}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-white/5">
                    <CardContent className="pt-6">
                        <div className="text-xs text-slate-400 mb-1">Active Circuits</div>
                        <div className="text-2xl sm:text-3xl font-bold text-white">
                            {devices.filter((d) => d.status === "online").length}
                            <span className="text-sm text-slate-500 ml-1">/ {devices.length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Circuit Cards Grid */}
            {devices.length === 0 ? (
                <Card className="border border-dashed border-slate-800 bg-slate-900/20">
                    <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
                        <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-slate-800/50 border border-slate-700 mb-4 sm:mb-5">
                            <Server className="h-6 w-6 sm:h-8 sm:w-8 text-slate-500" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">No circuits detected</h3>
                        <p className="text-sm text-slate-400 mt-2 max-w-sm">
                            Add devices from the Overview page to see them here as circuits.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {devices.map((device) => {
                        const config = statusConfig[device.status] ?? statusConfig.offline;
                        const loadPercentage = Math.round((device.powerRating / maxPower) * 100);

                        return (
                            <Card
                                key={device._id}
                                className="bg-slate-900 border-white/5 hover:border-emerald-500/20 transition-all group overflow-hidden"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-400 group-hover:text-emerald-400 transition-colors flex-shrink-0">
                                                {circuitIcons[device.type] ?? circuitIcons.other}
                                            </div>
                                            <CardTitle className="text-sm sm:text-base font-semibold text-white truncate">
                                                {device.name}
                                            </CardTitle>
                                        </div>
                                        <button className="h-8 w-8 rounded-lg border border-slate-700 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 transition-colors flex-shrink-0">
                                            <Power className="h-4 w-4" />
                                        </button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <span className="text-xl sm:text-2xl font-bold text-white">
                                            {device.powerRating >= 1000
                                                ? `${(device.powerRating / 1000).toFixed(0)},${String(device.powerRating % 1000).padStart(3, "0")}`
                                                : device.powerRating}
                                        </span>
                                        <span className="text-sm text-slate-400 ml-1">W</span>
                                    </div>

                                    {/* Load Bar */}
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${config.barColor}`}
                                            style={{ width: `${loadPercentage}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className={config.color}>{config.label}</span>
                                        <span className="text-slate-500">{loadPercentage}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
