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
  Loader2,
  Zap,
  AlertCircle,
} from "lucide-react";


const FACILITY_TYPES = [
  { id: "residential", label: "Residential", sub: "House, Apartment, Condo", icon: Home },
  { id: "office", label: "Office", sub: "Corporate, Co-working", icon: Building2 },
  { id: "institution", label: "Institution", sub: "University, School, Hospital", icon: GraduationCap },
  { id: "industrial", label: "Industrial", sub: "Factory, Warehouse, Plant", icon: Factory },
] as const;

type FacilityType = (typeof FACILITY_TYPES)[number]["id"];

// Exactly 12 hex digits, optionally separated by ":" "-" "." or spaces (matches the server check).
function isValidSerial(raw: string) {
  return /^[0-9A-F]{12}$/i.test(raw.replace(/[\s:\-.]/g, ""));
}

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
  const serialValid = isValidSerial(serial);
  const canProceed = serialValid && hubName.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Connect your Hub</h1>
        <p className="text-slate-400 mt-2 text-sm">
          We need to pair your EnergyPilot Hub to your account to start receiving data.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="hub-serial" className="block text-sm font-medium text-white mb-1.5">Hub serial number (MAC address)</label>
          <Input
            id="hub-serial"
            aria-invalid={serial.length > 0 && !serialValid}
            value={serial}
            onChange={(e) => setSerial(e.target.value.toUpperCase())}
            placeholder="EC:E3:34:66:98:3C"
            className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 font-mono"
          />
          <p className={cn("text-sm mt-1", serial.length > 0 && !serialValid ? "text-red-400" : "text-slate-400")}>
            {serial.length > 0 && !serialValid
              ? "Enter all 12 characters (0-9, A-F), e.g. EC:E3:34:66:98:3C"
              : "12 characters on the label on the back of your hub. It must match exactly, or the hub's data won't reach your account."}
          </p>
        </div>
        <div>
          <label htmlFor="hub-name" className="block text-sm font-medium text-white mb-1.5">Hub name</label>
          <Input
            id="hub-name"
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
          Register hub
        </Button>
      </div>
    </div>
  );
}


// ─── Step 4: Registered ───────────────────────────────────────────────────────
function StepRegistered({ serial, channelCount, onComplete }: { serial: string; channelCount: number; onComplete: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" aria-hidden />
      <div>
        <h1 className="text-2xl font-bold text-white">Hub registered</h1>
        <p className="text-slate-300 mt-2 text-base">
          Hub <span className="font-mono">{serial}</span> is linked to your account with {channelCount} circuits
          named Circuit 1–{channelCount}. Rename them on the Circuits page.
        </p>
        <p className="text-slate-400 mt-2 text-sm">
          Readings appear once the hub is powered, online and sends its first data. Until then the dashboard shows
          &ldquo;no data&rdquo;.
        </p>
      </div>
      <Button onClick={onComplete} className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold h-11">
        Continue
      </Button>
    </div>
  );
}

// ─── Step 1B: Join Hub with Code ──────────────────────────────────────────────
function StepJoinWithCode({
  onBack, onJoined,
}: {
  onBack: () => void;
  onJoined: (hubName: string, role: "viewer" | "controller") => void;
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
      const result = await joinWithCode({ code: trimmed });
      onJoined(result.hubName, result.role);
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

  const currentUser = useQuery(api.users.getMe, user?.id ? {} : "skip");

  const [onboardingMode, setOnboardingMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [joined, setJoined] = useState<{ hubName: string; role: "viewer" | "controller" } | null>(null);

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

  const handleProvision = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await completeOnboarding({
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

          {joined ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-white">You joined {joined.hubName} as a {joined.role}</h2>
              <p className="text-base text-slate-300">
                {joined.role === "controller"
                  ? "You can see live readings, circuits, alerts and history, and switch relays. You can't rename anything or manage sharing."
                  : "You can see live readings, circuits, alerts and history. You can't switch relays, rename anything or manage sharing."}
              </p>
              <p className="text-sm text-slate-400">The owner can remove your access at any time.</p>
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
              onJoined={(hubName, role) => setJoined({ hubName, role })}
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
                <StepRegistered
                  serial={serial}
                  channelCount={channelCount}
                  onComplete={() => router.push(isAddDevice ? "/dashboard/settings" : "/dashboard")}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
