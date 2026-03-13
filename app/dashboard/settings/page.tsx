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
      case 'account':
        return <AccountSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'thresholds':
        return <ThresholdsSettings />;
      case 'devices':
        return <DeviceManagement />;
      case 'api':
        return <APIAccess />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Settings Sidebar - Horizontal on mobile, vertical on desktop */}
      <div className="lg:w-64 flex-shrink-0">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Settings Content */}
      <div className="flex-1 min-w-0">
        <div className="max-w-4xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
