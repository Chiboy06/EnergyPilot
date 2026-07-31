"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { SettingsSidebar } from "@/components/dashboard/settings-sidebar";
import { APIAccess } from "@/components/dashboard/api-access";
import { AccountSettings } from "@/components/dashboard/account-settings";
import { NotificationSettings } from "@/components/dashboard/notification-settings";
import { ThresholdsSettings } from "@/components/dashboard/threshold-settings";
import { DeviceManagement } from "@/components/dashboard/device-management";
import { ShareAccess } from "@/components/dashboard/share-access";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");

  const renderContent = () => {
    switch (activeTab) {
      case "account":       return <AccountSettings />;
      case "notifications": return <NotificationSettings />;
      case "thresholds":    return <ThresholdsSettings />;
      case "devices":       return <DeviceManagement />;
      case "share":         return <ShareAccess />;
      case "api":           return <APIAccess />;
      default:              return <AccountSettings />;
    }
  };

  return (
    <div className="space-y-6 eg-anim-fade-in">
      {/* Page header */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase mb-1.5" style={{ color: "rgba(148,163,184,0.55)" }}>
          Configuration
        </p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-[13px] mt-0.5" style={{ color: "rgba(100,116,139,0.9)" }}>
          Manage account, devices, thresholds and integrations
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
