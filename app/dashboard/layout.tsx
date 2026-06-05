"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { MobileBottomTabBar } from "@/components/mobile/bottom-tab-bar";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useStoreUserEffect } from "@/hooks/use-store-user";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const redirectedRef = useRef(false);

  // Sync Clerk user into Convex on every session
  useStoreUserEffect();

  // Use clerkId-based query — ctx.auth.getUserIdentity() always returns null
  // in this setup because auth.config.ts has no providers configured.
  const currentUser = useQuery(
    api.users.getCurrentUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    // Wait until clerkId is available and query has resolved
    if (!user?.id || currentUser === undefined) return;
    // Only redirect once per mount to avoid loops
    if (redirectedRef.current) return;
    if (currentUser === null || !currentUser.hasCompletedOnboarding) {
      redirectedRef.current = true;
      router.push("/onboarding");
    }
  }, [isLoaded, isSignedIn, user?.id, currentUser, router]);

  // Show spinner while Clerk or Convex query is still loading
  if (!isLoaded || !user?.id || currentUser === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn || !currentUser?.hasCompletedOnboarding) return null;

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row text-white relative"
      style={{ background: "#060a11" }}
    >
      {/* Deep-space mesh blobs — drifting ambient glow */}
      <div className="eg-mesh pointer-events-none" aria-hidden>
        <span className="b1 eg-anim-drift1" style={{ width: "55vw", height: "55vw", top: "-10%", left: "-15%", background: "rgba(24,227,154,0.13)" }} />
        <span className="b2 eg-anim-drift2" style={{ width: "45vw", height: "45vw", top: "30%", right: "-12%", background: "rgba(56,189,248,0.09)" }} />
        <span className="b3 eg-anim-drift3" style={{ width: "40vw", height: "40vw", bottom: "-10%", left: "25%", background: "rgba(167,139,250,0.07)" }} />
      </div>

      {/* desktop sidebar */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0 h-screen sticky top-0 z-10">
        <DashboardSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <DashboardHeader />
        {/* extra bottom padding on mobile so content clears the tab bar */}
        <main className="flex-1 p-4 sm:p-6 pb-28 lg:pb-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* mobile bottom navigation */}
      <MobileBottomTabBar />
    </div>
  );
}
