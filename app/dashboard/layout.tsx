"use client";

import { useAuth } from "@clerk/nextjs";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStoreUserEffect } from "@/hooks/use-store-user";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  
  // Sync user to Convex
  useStoreUserEffect();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isSignedIn) {
    return null;
  }

  // Authenticated - Show dashboard
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-white">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 h-screen sticky top-0">
        <DashboardSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        <DashboardHeader />
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
