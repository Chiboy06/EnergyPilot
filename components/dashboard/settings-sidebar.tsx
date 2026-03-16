'use client'

import { User, Bell, AlertCircle, Wifi, Code, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const settingsGroups = [
  {
    label: 'General',
    items: [
      { id: 'account', label: 'Account', icon: User, description: 'Profile & preferences' },
      { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts & reports' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'thresholds', label: 'Thresholds', icon: AlertCircle, description: 'Safety limits' },
      { id: 'devices', label: 'Devices', icon: Wifi, description: 'Hubs & facilities' },
      { id: 'api', label: 'API Access', icon: Code, description: 'Developer keys' },
    ],
  },
]

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <aside className="space-y-6">
      {settingsGroups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {group.label}
          </p>
          <nav className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group',
                    isActive
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-white'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  )}
                >
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                    isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={cn('font-medium text-sm', isActive ? 'text-white' : '')}>{item.label}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-emerald-400 shrink-0" />}
                </button>
              )
            })}
          </nav>
        </div>
      ))}
    </aside>
  )
}
