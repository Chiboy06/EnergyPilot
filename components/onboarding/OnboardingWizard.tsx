"use client";

import { useState, useEffect } from "react";
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
  Plus,
  X,
} from "lucide-react";

// ─── Facility type room presets ───────────────────────────────────────────────
const ROOM_PRESETS: Record<string, string[]> = {
  residential: [
    "Kitchen",
    "Parlour",
    "Master Bedroom",
    "Bedroom 2",
    "Bedroom 3",
    "Bathroom",
    "Garage",
    "Laundry Room",
    "Home Office",
    "Dining Room",
  ],
  office: [
    "Reception",
    "Open Office",
    "Conference Room A",
    "Conference Room B",
    "Manager's Office",
    "Server Room",
    "Break Room",
    "Storage Room",
    "Board Room",
    "Lobby",
  ],
  institution: [
    "Dean's Office",
    "Deputy Dean's Office",
    "Secretary's Office",
    "Faculty Board Room",
    "Lecture Hall A",
    "Lecture Hall B",
    "Staff Room",
    "Computer Lab",
    "Library",
    "Administrative Office",
  ],
  industrial: [
    "Production Floor",
    "Control Room",
    "Storage Bay",
    "Loading Dock",
    "Maintenance Workshop",
    "Quality Control",
    "Admin Office",
    "Generator Room",
    "Compressor Room",
    "Packaging Area",
  ],
};

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

// ─── Step 2: Connect Hub ──────────────────────────────────────────────────────
function StepConnectHub({
  serial, setSerial,
  hubName, setHubName,
  onBack, onNext,
}: {
  serial: string; setSerial: (v: string) => void;
  hubName: string; setHubName: (v: string) => void;
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
          <label className="block text-sm font-medium text-white mb-1.5">Device Serial Number</label>
          <Input
            value={serial}
            onChange={(e) => setSerial(e.target.value.toUpperCase())}
            placeholder="VS-2024-XXXX"
            className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 font-mono"
          />
          <p className="text-xs text-emerald-400 mt-1">Where can I find this?</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Hub Name</label>
          <Input
            value={hubName}
            onChange={(e) => setHubName(e.target.value)}
            placeholder="e.g. Main Hub"
            className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
          />
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

// ─── Step 3: Circuit / Room Configuration ────────────────────────────────────
function StepRooms({
  facilityType,
  rooms, setRooms,
  onBack, onNext,
}: {
  facilityType: FacilityType;
  rooms: string[]; setRooms: (r: string[]) => void;
  onBack: () => void; onNext: () => void;
}) {
  const [customInput, setCustomInput] = useState("");
  const presets = ROOM_PRESETS[facilityType] ?? [];

  const toggle = (name: string) => {
    setRooms(
      rooms.includes(name) ? rooms.filter((r) => r !== name) : [...rooms, name]
    );
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !rooms.includes(trimmed)) {
      setRooms([...rooms, trimmed]);
    }
    setCustomInput("");
  };

  const remove = (name: string) => setRooms(rooms.filter((r) => r !== name));

  const canProceed = rooms.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Configure Rooms</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Select the rooms or zones your Hub will monitor.
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Suggested for your facility</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((name) => {
            const selected = rooms.includes(name);
            return (
              <button
                key={name}
                onClick={() => toggle(name)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border transition-all",
                  selected
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                )}
              >
                {selected && "✓ "}{name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom room input */}
      <div className="flex gap-2">
        <Input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="Add custom room..."
          className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
        />
        <Button
          onClick={addCustom}
          disabled={!customInput.trim()}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected rooms */}
      {rooms.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Selected ({rooms.length})</p>
          <div className="flex flex-wrap gap-2">
            {rooms.map((room) => (
              <span
                key={room}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm"
              >
                {room}
                <button onClick={() => remove(room)} className="hover:text-red-400 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 h-11">
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold h-11">
          Continue
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

// ─── Root Wizard ──────────────────────────────────────────────────────────────
export function OnboardingWizard({ isAddDevice = false }: { isAddDevice?: boolean }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const completeOnboarding = useMutation(api.onboarding.completeOnboarding);

  // Use clerkId-based query — ctx.auth.getUserIdentity() always returns null
  // in this setup because auth.config.ts has no providers configured.
  const currentUser = useQuery(
    api.users.getCurrentUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Tracks whether onboarding was completed in THIS session — suppresses the
  // reactive redirect so the provisioning animation can finish first.
  const [justCompleted, setJustCompleted] = useState(false);

  // Step 1
  const [facilityName, setFacilityName] = useState("");
  const [facilityType, setFacilityType] = useState<FacilityType | "">("");
  const [breakerCapacity, setBreakerCapacity] = useState("");
  // Step 2
  const [serial, setSerial] = useState("");
  const [hubName, setHubName] = useState("");
  // Step 3
  const [rooms, setRooms] = useState<string[]>([]);

  // Redirect already-onboarded users away — UNLESS they're intentionally
  // adding a new device (isAddDevice=true) or just completed this session.
  useEffect(() => {
    if (!justCompleted && !isAddDevice && currentUser && currentUser.hasCompletedOnboarding) {
      router.replace("/dashboard");
    }
  }, [currentUser, router, justCompleted, isAddDevice]);

  // Wait for Clerk to load
  if (!isLoaded || currentUser === undefined) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const handleProvision = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await completeOnboarding({
        clerkId: user!.id,
        serialNumber: serial,
        hubName,
        facilityName,
        facilityType,
        facilityRooms: JSON.stringify(rooms),
        breakerCapacity: Number(breakerCapacity),
      });
      // Set flag BEFORE step change so the useEffect above doesn't redirect
      setJustCompleted(true);
      setStep(3);
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
          <StepDots current={step} total={4} />

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

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
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepRooms
              facilityType={facilityType as FacilityType}
              rooms={rooms} setRooms={setRooms}
              onBack={() => setStep(1)}
              onNext={handleProvision}
            />
          )}
          {step === 3 && (
            <StepProvisioning
              serial={serial}
              onComplete={() => router.push(isAddDevice ? "/dashboard/settings" : "/dashboard")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
