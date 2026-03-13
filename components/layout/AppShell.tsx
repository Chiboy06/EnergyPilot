"use client";

import { ReactNode } from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    Cpu,
    Settings,
    Menu,
    X,
    Activity,
    TrendingUp,
    BarChart3,
    LogOut,
} from "lucide-react";
import { EnergyPilotLogo } from "@/components/icons/EnergyPilotLogo";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
    SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setActiveView, setSidebarOpen } from "@/lib/features/uiSlice";

const navItems = [
    { id: "dashboard" as const, label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { id: "circuits" as const, label: "Circuits", icon: Activity, href: "/circuits" },
    { id: "predictions" as const, label: "Predictions", icon: TrendingUp, href: "/predictions" },
    { id: "analytics" as const, label: "Analytics", icon: BarChart3, href: "/analytics" },
    { id: "settings" as const, label: "Settings", icon: Settings, href: "/settings" },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
    const dispatch = useAppDispatch();
    const activeView = useAppSelector((s) => s.ui.activeView);

    return (
        <nav className="flex flex-col gap-1 px-3">
            {navItems.map((item) => {
                const isActive = activeView === item.id;
                return (
                    <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => {
                            dispatch(setActiveView(item.id));
                            onNavigate?.();
                        }}
                        className={`
              group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
              transition-all duration-200 ease-in-out
              ${isActive
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent"
                            }
            `}
                    >
                        <item.icon
                            className={`h-4.5 w-4.5 shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-white"
                                }`}
                        />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}

function SidebarBrand() {
    return (
        <div className="flex items-center gap-2.5 px-4 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
                <EnergyPilotLogo size={20} className="text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
                EnergyPilot
            </span>
        </div>
    );
}

export default function AppShell({ children }: { children: ReactNode }) {
    const dispatch = useAppDispatch();
    const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);

    return (
        <div className="flex h-dvh overflow-hidden bg-slate-950">
            {/* ─── Desktop Sidebar ─── */}
            <aside className="hidden md:flex md:w-64 flex-col border-r border-white/5 bg-slate-900/50 shrink-0">
                <SidebarBrand />
                <Separator className="mx-3 bg-white/5" />
                <div className="flex-1 overflow-y-auto py-4">
                    <NavContent />
                </div>
                <Separator className="mx-3 bg-white/5" />
                <div className="flex items-center gap-3 px-4 py-4">
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "h-8 w-8",
                            },
                        }}
                    />
                    <span className="text-sm text-slate-400 truncate">
                        My Account
                    </span>
                </div>
            </aside>

            {/* ─── Main Content Area ─── */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* ─── Mobile Top Bar ─── */}
                <header className="flex md:hidden items-center justify-between border-b border-white/5 bg-slate-900/80 backdrop-blur-md px-4 py-3 sticky top-0 z-30">
                    <div className="flex items-center gap-2.5">
                        <Sheet
                            open={sidebarOpen}
                            onOpenChange={(open) => dispatch(setSidebarOpen(open))}
                        >
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-72 p-0 bg-slate-900 border-r border-white/5">
                                <SheetTitle className="sr-only">Navigation</SheetTitle>
                                <div className="flex items-center justify-between pr-2">
                                    <SidebarBrand />
                                    <SheetClose asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </SheetClose>
                                </div>
                                <Separator className="bg-white/5" />
                                <div className="py-4">
                                    <NavContent
                                        onNavigate={() => dispatch(setSidebarOpen(false))}
                                    />
                                </div>
                                <Separator className="bg-white/5" />
                                <div className="flex items-center gap-3 px-4 py-4">
                                    <UserButton
                                        appearance={{
                                            elements: {
                                                avatarBox: "h-8 w-8",
                                            },
                                        }}
                                    />
                                    <span className="text-sm text-slate-400">
                                        My Account
                                    </span>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <div className="flex items-center gap-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500">
                                <EnergyPilotLogo size={14} className="text-white" />
                            </div>
                            <span className="font-bold text-white">EnergyPilot</span>
                        </div>
                    </div>
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "h-8 w-8",
                            },
                        }}
                    />
                </header>

                {/* ─── Page Content ─── */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
                    {children}
                </main>
            </div>
        </div>
    );
}
