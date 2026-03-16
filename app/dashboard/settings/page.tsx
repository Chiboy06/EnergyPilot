'use client';

import { useState } from 'react';
import { SettingsSidebar } from '@/components/dashboard/settings-sidebar';
import { APIAccess } from '@/components/dashboard/api-access';
import { AccountSettings } from '@/components/dashboard/account-settings';
import { NotificationSettings } from '@/components/dashboard/notification-settings';
import { ThresholdsSettings } from '@/components/dashboard/threshold-settings';
import { DeviceManagement } from '@/components/dashboard/device-management';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');

  const renderContent = () => {
    switch (activeTab) {
      case 'account': return <AccountSettings />;
      case 'notifications': return <NotificationSettings />;
      case 'thresholds': return <ThresholdsSettings />;
      case 'devices': return <DeviceManagement />;
      case 'api': return <APIAccess />;
      default: return <AccountSettings />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account, devices, and system preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
