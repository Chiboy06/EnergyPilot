"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
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
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-white">
      <div className="hidden lg:block lg:w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 h-screen sticky top-0">
        <DashboardSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        <DashboardHeader />
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
