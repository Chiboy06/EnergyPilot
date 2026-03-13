"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { ChevronRight, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DashboardSidebar } from "./sidebar";
import { useState } from "react";

export function DashboardHeader() {
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (!user) return "User";
    return user.fullName || user.username || user.primaryEmailAddress?.emailAddress || "User";
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Mobile Menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-slate-900 border-slate-800">
            <DashboardSidebar onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Breadcrumb - Hidden on small screens */}
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-slate-400">Dashboard</span>
          <ChevronRight className="h-4 w-4 text-slate-600" />
          <span className="text-white font-medium">Overview</span>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white truncate max-w-[150px] md:max-w-none">
            {getDisplayName()}
          </p>
          <p className="text-xs text-slate-400">
            {user?.primaryEmailAddress?.emailAddress || ""}
          </p>
        </div>
        <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
            <UserButton/>
          {/* <AvatarImage src={user?.imageUrl} alt={getDisplayName()} /> */}
          {/* <AvatarFallback className="bg-emerald-500 text-black text-sm font-semibold">
            {getInitials()}
          </AvatarFallback> */}
        </Avatar>
      </div>
    </header>
  );
}
