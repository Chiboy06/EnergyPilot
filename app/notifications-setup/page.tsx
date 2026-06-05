"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { AlertTriangle, TrendingUp, Zap, Leaf, Bell } from "lucide-react";
import { EnergyPilotLogo } from "@/components/icons/EnergyPilotLogo";

const NOTIF_ITEMS = [
  {
    icon: AlertTriangle,
    color: "#ff6b6b",
    title: "Anomaly alerts",
    desc: "The instant a circuit drifts out of profile",
  },
  {
    icon: TrendingUp,
    color: "#ffb547",
    title: "Peak demand",
    desc: "30 minutes before a forecast peak",
  },
  {
    icon: Zap,
    color: "#18e39a",
    title: "Relay actuations",
    desc: "Every breaker you trip or restore",
  },
  {
    icon: Leaf,
    color: "#5b9dff",
    title: "Weekly digest",
    desc: "Savings and efficiency, every Sunday",
  },
];

export default function NotificationsSetupPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "radial-gradient(125% 80% at 18% 0%, #0e1b2c 0%, #070d16 52%, #04060a 100%)",
        color: "#f2f6fb",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif",
      }}
    >
      {/* ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: 360, height: 360, top: -100, left: -80,
            background: "radial-gradient(circle, rgba(24,227,154,.30), transparent 65%)",
            filter: "blur(55px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 300, height: 300, bottom: -60, right: -100,
            background: "radial-gradient(circle, rgba(56,224,224,.18), transparent 65%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* header bar */}
      <header className="relative z-10 flex items-center gap-2.5 px-6 py-5">
        <div className="h-8 w-8 rounded-[10px] grid place-items-center bg-emerald-500">
          <EnergyPilotLogo size={16} className="text-white" />
        </div>
        <span className="font-bold text-white text-[15px]">Energenius</span>
      </header>

      {/* content */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pb-10 gap-7 max-w-md mx-auto w-full pt-6 justify-center">
        {/* icon + heading */}
        <div className="flex flex-col items-center gap-5 text-center">
          <div
            className="relative w-20 h-20 rounded-[26px] grid place-items-center eg-anim-floaty"
            style={{
              background: "linear-gradient(140deg, rgba(24,227,154,.22), rgba(56,224,224,.14))",
              color: "#18e39a",
              boxShadow: "0 0 36px rgba(24,227,154,0.4)",
            }}
          >
            <Bell size={36} />
            {/* red badge */}
            <span
              className="absolute rounded-full"
              style={{
                top: 16, right: 18, width: 12, height: 12,
                background: "#ff6b6b",
                border: "2px solid #0a1018",
                boxShadow: "0 0 8px #ff6b6b",
              }}
            />
          </div>

          <div className="space-y-2">
            <h1
              className="text-[25px] font-bold tracking-tight leading-tight"
              style={{ letterSpacing: "-0.02em" }}
            >
              Stay ahead of every watt
            </h1>
            <p className="text-slate-400 text-[14px] leading-relaxed max-w-[280px]">
              Turn on alerts so Energenius can reach you the moment something needs your attention.
            </p>
          </div>
        </div>

        {/* notification type list */}
        <div className="space-y-3">
          {NOTIF_ITEMS.map(({ icon: Icon, color, title, desc }, i) => (
            <div
              key={title}
              className="glass-card flex items-center gap-3 px-3.5 py-3 eg-anim-slide-up"
              style={{ borderRadius: 16, animationDelay: `${i * 60}ms` }}
            >
              <div
                className="w-10 h-10 rounded-[11px] grid place-items-center flex-none"
                style={{ background: color + "1f", color }}
              >
                <Icon size={18} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white leading-tight">{title}</p>
                <p className="text-slate-400 text-[12px] mt-0.5 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center justify-center py-4 rounded-[16px] text-[15.5px] font-semibold transition-all"
            style={{
              background: "linear-gradient(180deg,#2bf0aa,#10b981)",
              color: "#03130c",
              boxShadow: "0 8px 24px -8px rgba(24,227,154,0.5), inset 0 1px 0 rgba(255,255,255,.4)",
            }}
          >
            Enable notifications
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3.5 text-[14.5px] font-medium text-slate-400 hover:text-white transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
