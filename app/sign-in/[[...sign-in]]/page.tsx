"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { EnergyPilotLogo } from "@/components/icons/EnergyPilotLogo";
import Link from "next/link";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0f1419]">
      {/* Left Panel - Testimonial */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-16">
        <div className="relative z-10 w-full max-w-lg">
          <Link href="/" className="flex items-center gap-2 mb-32">
            <EnergyPilotLogo size={24} className="text-emerald-400" />
            <span className="text-xl font-bold text-white">EnergyPilot</span>
          </Link>

          <blockquote className="space-y-8">
            <p className="text-3xl font-bold text-white leading-tight">
              &quot;EnergyPilot transformed how we manage energy across our 50
              locations. The anomaly detection alone saved us $120k last year.&quot;
            </p>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-700" />
              <div>
                <div className="font-semibold text-white">Sarah Miller</div>
                <div className="text-sm text-slate-400">
                  VP of Operations at TechSpace
                </div>
              </div>
            </div>
          </blockquote>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 relative bg-[#0f1419]">
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <EnergyPilotLogo size={20} className="text-emerald-400" />
            <span className="text-xl font-bold text-white">EnergyPilot</span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          <SignIn
            appearance={{
              variables: {
                colorPrimary: "#10b981",
                colorBackground: "#0f1419",
                colorInputBackground: "#1a1f26",
                colorInputText: "#ffffff",
                colorText: "#ffffff",
                colorTextSecondary: "#94a3b8",
                borderRadius: "0.5rem",
              },
              elements: {
                card: "bg-transparent shadow-none",
                headerTitle: "text-3xl font-bold text-white",
                headerSubtitle: "text-slate-400",
                socialButtonsBlockButton:
                  "bg-transparent border-[#2a2f36] text-white hover:bg-[#1a1f26]",
                dividerLine: "bg-[#2a2f36]",
                dividerText: "text-slate-500",
                formFieldLabel: "text-white",
                formFieldInput:
                  "bg-[#1a1f26] border-[#2a2f36] text-white placeholder:text-slate-500 focus:border-emerald-500",
                formButtonPrimary:
                  "bg-emerald-500 hover:bg-emerald-600 text-black font-semibold",
                footerActionText: "text-slate-400",
                footerActionLink: "text-emerald-400 hover:text-emerald-300",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
