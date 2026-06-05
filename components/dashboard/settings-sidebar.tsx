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
    <aside className="glass-card p-2 space-y-3">
      {settingsGroups.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase px-3 py-1.5" style={{ color: "rgba(88,105,128,0.9)" }}>
            {group.label}
          </p>
          <nav className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm transition-all text-left"
                  style={
                    isActive
                      ? { background: "rgba(24,227,154,0.12)", border: "1px solid rgba(24,227,154,0.28)", color: "#18e39a" }
                      : { border: "1px solid transparent", color: "rgba(148,163,184,0.85)" }
                  }
                >
                  <div
                    className="h-8 w-8 rounded-[9px] flex items-center justify-center shrink-0"
                    style={
                      isActive
                        ? { background: "rgba(24,227,154,0.14)", color: "#18e39a" }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(88,105,128,0.9)" }
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-[13.5px] text-white">{item.label}</p>
                    <p className="text-[11px]" style={{ color: "rgba(88,105,128,0.8)" }}>{item.description}</p>
                  </div>
                  {isActive && <ChevronRight size={14} style={{ color: "#18e39a" }} />}
                </button>
              )
            })}
          </nav>
        </div>
      ))}
    </aside>
  )
}
