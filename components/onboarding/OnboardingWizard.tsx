"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { EnergyPilotLogo } from "@/components/icons/EnergyPilotLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Home,
  Building2,
  GraduationCap,
  Factory,
  CheckCircle2,
  Circle,
  Loader2,
  Wifi,
  WifiOff,
  Activity,
  TrendingUp,
  Power,
  Zap,
  ChevronRight,
  AlertCircle,
} from "lucide-react";


const FACILITY_TYPES = [
  { id: "residential", label: "Residential", sub: "House, Apartment, Condo", icon: Home },
  { id: "office", label: "Office", sub: "Corporate, Co-working", icon: Building2 },
  { id: "institution", label: "Institution", sub: "University, School, Hospital", icon: GraduationCap },
  { id: "industrial", label: "Industrial", sub: "Factory, Warehouse, Plant", icon: Factory },
] as const;

type FacilityType = (typeof FACILITY_TYPES)[number]["id"];

// ─── Step progress dots ───────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i < current ? "w-6 bg-emerald-500" : i === current ? "w-6 bg-emerald-400" : "w-2 bg-slate-700"
          )}
        />
      ))}
    </div>
  );
}

// ─── Step 1: Facility Setup ───────────────────────────────────────────────────
function StepFacility({
  facilityName, setFacilityName,
  facilityType, setFacilityType,
  breakerCapacity, setBreakerCapacity,
  onNext,
}: {
  facilityName: string; setFacilityName: (v: string) => void;
  facilityType: FacilityType | ""; setFacilityType: (v: FacilityType) => void;
  breakerCapacity: string; setBreakerCapacity: (v: string) => void;
  onNext: () => void;
}) {
  const canProceed = facilityName.trim().length > 0 && facilityType !== "" && Number(breakerCapacity) > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Set up your facility</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Tell us about the space you want to monitor to optimize our AI predictions.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Facility Name</label>
          <Input
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
            placeholder="e.g. Main Campus Block A"
            className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Facility Type</label>
          <div className="grid grid-cols-2 gap-3">
            {FACILITY_TYPES.map(({ id, label, sub, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setFacilityType(id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all",
                  facilityType === id
                    ? "border-emerald-500 bg-emerald-500/10 text-white"
                    : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-white"
                )}
              >
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", facilityType === id ? "bg-emerald-500/20" : "bg-slate-700")}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Main Breaker Capacity (Amps)</label>
          <Input
            type="number"
            value={breakerCapacity}
            onChange={(e) => setBreakerCapacity(e.target.value)}
            placeholder="e.g. 200"
            min={1}
            className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold h-11"
      >
        Continue
      </Button>
    </div>
  );
}

const CHANNEL_OPTIONS = [8, 16, 24, 32] as const;

// ─── Step 2: Connect Hub ──────────────────────────────────────────────────────
function StepConnectHub({
  serial, setSerial,
  hubName, setHubName,
  channelCount, setChannelCount,
  onBack, onNext,
}: {
  serial: string; setSerial: (v: string) => void;
  hubName: string; setHubName: (v: string) => void;
  channelCount: 8 | 16 | 24 | 32; setChannelCount: (v: 8 | 16 | 24 | 32) => void;
  onBack: () => void; onNext: () => void;
}) {
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setScanning(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const canProceed = serial.trim().length >= 6 && hubName.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Connect your Hub</h1>
        <p className="text-slate-400 mt-2 text-sm">
          We need to pair your EnergyPilot Hub to your account to start receiving data.
        </p>
      </div>

      {/* Auto-discovery zone */}
      <div className="border border-dashed border-slate-600 rounded-xl p-6 flex flex-col items-center gap-3 bg-slate-800/30">
        {scanning ? (
          <>
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
            </div>
            <p className="font-semibold text-white text-sm">Searching for devices on local network...</p>
            <p className="text-xs text-slate-500">Ensure your Hub is plugged in and connected to Wi-Fi.</p>
          </>
        ) : (
          <>
            <WifiOff className="h-10 w-10 text-slate-600" />
            <p className="font-semibold text-slate-400 text-sm">No devices found automatically.</p>
            <p className="text-xs text-slate-500">Enter your serial number below.</p>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-xs text-slate-500 uppercase tracking-widest">or enter manually</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Device Serial Number (MAC)</label>
          <Input
            value={serial}
            onChange={(e) => setSerial(e.target.value.toUpperCase())}
            placeholder="EC:E3:34:66:98:3C"
            className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 font-mono"
          />
          <p className="text-xs text-slate-500 mt-1">Found on the label on the back of your Hub.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Hub Name</label>
          <Input
            value={hubName}
            onChange={(e) => setHubName(e.target.value)}
            placeholder="e.g. Main Distribution Block"
            className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Number of Channels
            <span className="ml-2 text-xs text-slate-500 font-normal">— breaker slots in your distribution block</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CHANNEL_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setChannelCount(n)}
                className={cn(
                  "py-3 rounded-xl border text-center font-semibold text-sm transition-all",
                  channelCount === n
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-white"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Circuit names can be assigned from the dashboard after setup.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 h-11">
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold h-11">
          Connect Device
        </Button>
      </div>
    </div>
  );
}


// ─── Step 4: Provisioning ─────────────────────────────────────────────────────
const PROVISION_STEPS = [
  "Device Found",
  "Wi-Fi Credentials Exchanged",
  "Registering with AWS IoT Core...",
  "Calibrating ML baseline...",
];

function StepProvisioning({ serial, onComplete }: { serial: string; onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const done = currentStep >= PROVISION_STEPS.length;

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setCurrentStep((s) => s + 1), currentStep === 0 ? 800 : 1400);
    return () => clearTimeout(t);
  }, [currentStep, done]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Provisioning Device</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Please wait while we securely connect your Hub and initialize your workspace.
        </p>
      </div>

      <div className="space-y-3">
        {PROVISION_STEPS.map((label, idx) => {
          const isComplete = idx < currentStep;
          const isActive = idx === currentStep;
          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all",
                isComplete ? "border-emerald-500/30 bg-emerald-500/5" :
                isActive ? "border-emerald-500/50 bg-emerald-500/10" :
                "border-slate-700/50 bg-slate-800/20"
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : isActive ? (
                <Loader2 className="h-5 w-5 text-emerald-400 animate-spin shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-slate-600 shrink-0" />
              )}
              <span className={cn("text-sm font-medium", isComplete || isActive ? "text-white" : "text-slate-500")}>
                {idx === 0 ? (
                  <>{label} <span className="text-slate-400 font-mono text-xs">({serial})</span></>
                ) : label}
              </span>
            </div>
          );
        })}
      </div>

      {done && (
        <Button onClick={onComplete} className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold h-11">
          Go to Dashboard
        </Button>
      )}
    </div>
  );
}

// ─── Intro Slides (3 swipeable slides before the setup steps) ────────────────
const INTRO_SLIDES = [
  {
    icon: Activity,
    color: "#18e39a",
    title: "16 Channels, Live",
    body: "True-RMS current on every circuit, streamed from ESP32 edge nodes via sub-millisecond ESP-NOW.",
    visual: "circuits" as const,
  },
  {
    icon: TrendingUp,
    color: "#5b9dff",
    title: "Forecast & Prevent",
    body: "On-device SageMaker models predict load peaks and flag anomalies before a breaker ever trips.",
    visual: "forecast" as const,
  },
  {
    icon: Power,
    color: "#a78bfa",
    title: "Control from Anywhere",
    body: "Actuate any breaker remotely, shift load to off-peak tariffs, and cut phantom draw with one tap.",
    visual: "relay" as const,
  },
];

function CircuitsVisual() {
  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-[180px]">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="w-8 h-8 rounded-[9px] grid place-items-center text-xs"
          style={{
            background: i % 5 === 3 ? "rgba(255,107,107,0.18)" : "rgba(24,227,154,0.16)",
            color: i % 5 === 3 ? "#ff6b6b" : "#18e39a",
            animation: `eg-pulse-glow 2.4s ease-in-out ${i * 0.12}s infinite`,
          }}
        >
          <Zap size={13} />
        </span>
      ))}
    </div>
  );
}

function ForecastVisual() {
  const pts = [12, 18, 14, 22, 19, 28, 24, 33, 30, 38, 34, 30];
  const min = Math.min(...pts), max = Math.max(...pts), rng = max - min || 1;
  const w = 160, h = 60, pad = 4;
  const coords = pts.map((v, i) => [
    pad + (i / (pts.length - 1)) * (w - pad * 2),
    h - pad - ((v - min) / rng) * (h - pad * 2),
  ]);
  const line = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  return (
    <div
      className="glass-card p-4"
      style={{ borderRadius: 18, width: 200 }}
    >
      <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="fo-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b9dff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5b9dff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${line} L${w - pad},${h} L${pad},${h} Z`}
          fill="url(#fo-grad)"
        />
        <path d={line} fill="none" stroke="#5b9dff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle
          cx={coords[coords.length - 1][0]}
          cy={coords[coords.length - 1][1]}
          r="3" fill="#5b9dff"
          style={{ filter: "drop-shadow(0 0 5px #5b9dff)" }}
        />
      </svg>
      <div className="flex justify-between mt-2">
        <span className="font-mono text-[10px] text-slate-500">now</span>
        <span className="font-mono text-[11px]" style={{ color: "#5b9dff" }}>peak 19:00</span>
      </div>
    </div>
  );
}

function RelayVisual() {
  const items: [string, boolean][] = [["EV Charger", true], ["Water Heater", false], ["HVAC Rooftop", true]];
  return (
    <div className="glass-card p-4 space-y-4" style={{ borderRadius: 18, width: 200 }}>
      {items.map(([name, on]) => (
        <div key={name} className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-white">{name}</span>
          <div
            className="relative flex-none cursor-pointer"
            style={{
              width: 44, height: 26, borderRadius: 999,
              background: on
                ? "linear-gradient(180deg,rgba(43,240,170,.9),rgba(16,185,129,.9))"
                : "rgba(255,255,255,0.07)",
              border: `1px solid ${on ? "rgba(24,227,154,.5)" : "rgba(255,255,255,0.12)"}`,
              boxShadow: on ? "0 0 14px -2px rgba(24,227,154,.4)" : "none",
              transition: "all .35s ease",
            }}
          >
            <div
              style={{
                position: "absolute", top: "50%", borderRadius: "50%",
                width: 18, height: 18, background: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,.4)",
                left: on ? "calc(100% - 21px)" : 3,
                transform: "translateY(-50%)",
                transition: "left .4s cubic-bezier(.34,1.56,.5,1)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function IntroSlides({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const startX = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);
  const last = INTRO_SLIDES.length - 1;

  const go = (n: number) => setIdx(Math.max(0, Math.min(last, n)));

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    startX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (startX.current == null) return;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    setDrag(x - startX.current);
  };
  const onUp = () => {
    if (drag < -50 && idx < last) go(idx + 1);
    else if (drag > 50 && idx > 0) go(idx - 1);
    startX.current = null;
    setDrag(0);
  };

  const s = INTRO_SLIDES[idx];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "radial-gradient(125% 80% at 18% 0%, #0e1b2c 0%, #070d16 52%, #04060a 100%)" }}>
      {/* ambient glows */}
      <div className="pointer-events-none">
        <div className="fixed w-72 h-72 rounded-full -top-16 -left-16"
             style={{ background: "radial-gradient(circle, rgba(24,227,154,.32), transparent 65%)", filter: "blur(55px)" }} />
        <div className="fixed w-60 h-60 rounded-full -bottom-10 -right-16"
             style={{ background: "radial-gradient(circle, rgba(56,224,224,.20), transparent 65%)", filter: "blur(60px)" }} />
      </div>

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-[10px] grid place-items-center bg-emerald-500">
            <EnergyPilotLogo size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-[15px]">Energenius</span>
        </div>
        <button
          onClick={onDone}
          className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          Skip
        </button>
      </div>

      {/* slide */}
      <div
        className="relative z-10 flex-1 overflow-hidden select-none"
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
        onMouseLeave={() => { startX.current = null; setDrag(0); }}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
      >
        <div
          className="flex h-full"
          style={{
            width: `${INTRO_SLIDES.length * 100}%`,
            transform: `translateX(calc(${-idx * (100 / INTRO_SLIDES.length)}% + ${drag}px))`,
            transition: startX.current == null ? "transform .45s cubic-bezier(.2,.8,.2,1)" : "none",
          }}
        >
          {INTRO_SLIDES.map((slide, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center gap-8 px-8 text-center"
              style={{ width: `${100 / INTRO_SLIDES.length}%` }}
            >
              {/* visual */}
              <div className="h-40 grid place-items-center">
                {slide.visual === "circuits" && <CircuitsVisual />}
                {slide.visual === "forecast"  && <ForecastVisual />}
                {slide.visual === "relay"     && <RelayVisual />}
              </div>

              {/* icon badge */}
              <div
                className="w-16 h-16 rounded-[18px] grid place-items-center"
                style={{
                  background: slide.color + "20",
                  color: slide.color,
                  boxShadow: `0 0 26px ${slide.color}44`,
                }}
              >
                <slide.icon size={28} />
              </div>

              {/* copy */}
              <div className="space-y-3">
                <h2 className="text-[25px] font-bold text-white tracking-tight leading-tight">
                  {slide.title}
                </h2>
                <p className="text-slate-400 text-[14.5px] leading-relaxed max-w-xs">
                  {slide.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* dots + CTA */}
      <div className="relative z-10 px-6 pb-10 space-y-5">
        <div className="flex justify-center gap-2">
          {INTRO_SLIDES.map((_, d) => (
            <button
              key={d}
              onClick={() => go(d)}
              style={{
                height: 7, borderRadius: 999, cursor: "pointer",
                width: d === idx ? 26 : 7,
                background: d === idx ? "#18e39a" : "rgba(255,255,255,0.22)",
                boxShadow: d === idx ? "0 0 10px rgba(24,227,154,0.6)" : "none",
                transition: "all .35s",
                border: "none",
              }}
            />
          ))}
        </div>
        <button
          onClick={() => (idx < last ? go(idx + 1) : onDone())}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-[16px] text-[15.5px] font-semibold transition-all"
          style={{
            background: "linear-gradient(180deg,#2bf0aa,#10b981)",
            color: "#03130c",
            boxShadow: "0 8px 24px -8px rgba(24,227,154,0.5), inset 0 1px 0 rgba(255,255,255,.4)",
          }}
        >
          {idx < last ? "Next" : "Set Up Your Facility"} <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 1B: Join Hub with Code ──────────────────────────────────────────────
function StepJoinWithCode({
  onBack, onJoined,
}: {
  onBack: () => void;
  onJoined: (hubName: string) => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const joinWithCode = useMutation(api.sharing.joinWithCode);

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || loading) return;
    setError(null);
    setLoading(true);
    try {
      const result = await joinWithCode({ code: trimmed }) as any;
      if (result && 'error' in result && result.error) {
        setError(result.error as string);
      } else {
        onJoined(result?.hubName ?? 'Facility');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join hub. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12));
        setError(null);
      }
    } catch { /* clipboard permission denied */ }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Join with Access Code</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Enter the 6-character access code shared by the facility owner to connect.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Access Code
          </label>
          <Input
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(null); }}
            placeholder="e.g. RAQ5RE"
            maxLength={6}
            className="bg-slate-800/60 border-slate-700 text-white font-mono text-center text-lg tracking-widest focus:border-emerald-500 h-12"
          />
        </div>

        {/* 6-box segmented visualizer */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => {
            const char = code[i];
            return (
              <div
                key={i}
                className={cn(
                  "w-10 h-12 rounded-lg border flex items-center justify-center font-mono text-xl font-bold transition-all",
                  char ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-slate-800 bg-slate-900/60 text-slate-600"
                )}
              >
                {char || '_'}
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handlePaste}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
          >
            Paste from Clipboard
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} disabled={loading} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 h-11">
          Back
        </Button>
        <Button onClick={handleJoin} disabled={!code.trim() || loading} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold h-11">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Facility"}
        </Button>
      </div>
    </div>
  );
}

// ─── Root Wizard ──────────────────────────────────────────────────────────────
export function OnboardingWizard({ isAddDevice = false }: { isAddDevice?: boolean }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const completeOnboarding = useMutation(api.onboarding.completeOnboarding);

  const currentUser = useQuery(
    api.users.getCurrentUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const [onboardingMode, setOnboardingMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [joinedHubName, setJoinedHubName] = useState<string | null>(null);

  // Step 0
  const [facilityName, setFacilityName] = useState("");
  const [facilityType, setFacilityType] = useState<FacilityType | "">("");
  const [breakerCapacity, setBreakerCapacity] = useState("");
  // Step 1
  const [serial, setSerial] = useState("");
  const [hubName, setHubName] = useState("");
  const [channelCount, setChannelCount] = useState<8 | 16 | 24 | 32>(8);

  useEffect(() => {
    if (!justCompleted && !isAddDevice && currentUser && currentUser.hasCompletedOnboarding) {
      router.replace("/dashboard");
    }
  }, [currentUser, router, justCompleted, isAddDevice]);

  if (!isLoaded || currentUser === undefined) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // Show the 3-slide intro before the setup steps (skip for addDevice flow)
  // if (showIntro) {
  //   return <IntroSlides onDone={() => setShowIntro(false)} />;
  // }

  const handleProvision = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await completeOnboarding({
        clerkId:         user!.id,
        serialNumber:    serial,
        hubName,
        facilityName,
        facilityType:    facilityType as FacilityType,
        channelCount,
        breakerCapacity: Number(breakerCapacity),
      });
      // Set flag BEFORE step change so the useEffect above doesn't redirect
      setJustCompleted(true);
      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Provisioning failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-2.5 px-6 py-4 border-b border-white/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
          <EnergyPilotLogo size={16} className="text-white" />
        </div>
        <span className="font-bold text-white">EnergyPilot</span>
      </header>

      {/* Wizard card */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg bg-[#161b22] border border-white/5 rounded-2xl p-8 shadow-2xl">
          <StepDots current={onboardingMode === 'join' ? 1 : step} total={3} />

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {joinedHubName ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Successfully Joined {joinedHubName}!</h2>
              <p className="text-sm text-slate-400">
                You now have access to monitor live telemetry, circuits, and predictions for this facility.
              </p>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold h-11"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : onboardingMode === 'choose' ? (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">Welcome to EnergyPilot</h1>
                <p className="text-slate-400 mt-2 text-sm">
                  Choose how you want to set up your energy workspace today.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setOnboardingMode('create')}
                  className="flex items-start gap-4 p-5 rounded-xl border border-slate-700 bg-slate-800/40 text-left hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group"
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-base">Setup New Facility & Hub</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Register a brand-new EnergyPilot Hub device using its MAC serial number and set up breaker channels.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setOnboardingMode('join')}
                  className="flex items-start gap-4 p-5 rounded-xl border border-slate-700 bg-slate-800/40 text-left hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group"
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-base">Join Facility with Access Code</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Enter a 6-character access code provided by a facility owner to connect as a Viewer or Controller.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : onboardingMode === 'join' ? (
            <StepJoinWithCode
              onBack={() => setOnboardingMode('choose')}
              onJoined={(hubName) => setJoinedHubName(hubName)}
            />
          ) : (
            <>
              {step === 0 && (
                <StepFacility
                  facilityName={facilityName} setFacilityName={setFacilityName}
                  facilityType={facilityType} setFacilityType={setFacilityType}
                  breakerCapacity={breakerCapacity} setBreakerCapacity={setBreakerCapacity}
                  onNext={() => setStep(1)}
                />
              )}
              {step === 1 && (
                <StepConnectHub
                  serial={serial} setSerial={setSerial}
                  hubName={hubName} setHubName={setHubName}
                  channelCount={channelCount} setChannelCount={setChannelCount}
                  onBack={() => setStep(0)}
                  onNext={handleProvision}
                />
              )}
              {step === 2 && (
                <StepProvisioning
                  serial={serial}
                  onComplete={() => router.push(isAddDevice ? "/dashboard/settings" : "/notifications-setup")}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
