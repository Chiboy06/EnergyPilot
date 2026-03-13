'use client'

import { User, Bell, AlertCircle, Wifi, Code } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const settingsGroups = [
  {
    label: 'GENERAL',
    items: [
      { id: 'account', label: 'Account', icon: User },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { id: 'thresholds', label: 'Thresholds', icon: AlertCircle },
      { id: 'devices', label: 'Device Management', icon: Wifi },
      { id: 'api', label: 'API Access', icon: Code },
    ],
  },
]

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <aside className="w-64 border-r border-border bg-background p-6 space-y-8">
      {settingsGroups.map((group) => (
        <div key={group.label}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4">{group.label}</h3>
          <nav className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-secondary text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      ))}
    </aside>
  )
}
