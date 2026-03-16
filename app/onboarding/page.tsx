"use client";

import { Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Loader2 } from "lucide-react";

function OnboardingContent() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAddDevice = searchParams.get("addDevice") === "true";

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) return null;

  return <OnboardingWizard isAddDevice={isAddDevice} />;
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
