'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Switch } from '@/components/ui/switch'
import { Mail, AlertTriangle, BarChart2, Megaphone, Smartphone } from 'lucide-react'

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6">
      {children}
    </div>
  )
}

export function NotificationSettings() {
  const prefs = useQuery(api.preferences.get)
  const update = useMutation(api.preferences.update)

  // Local-only (no backend field)
  const [weeklyReports, setWeeklyReports] = useState(true)
  const [marketing, setMarketing] = useState(false)
  const [quietHours, setQuietHours] = useState(false)

  const criticalOn = !!(
    prefs?.notifyHighLoad &&
    prefs?.notifyVoltageHigh &&
    prefs?.notifyVoltageLow &&
    prefs?.notifyCircuitOverload
  )

  const notifications: {
    icon: React.ElementType
    label: string
    description: string
    checked: boolean
    onChange: (v: boolean) => void
  }[] = [
    {
      icon: Mail,
      label: 'Email Alerts',
      description: 'Receive email notifications for anomalies and high usage.',
      checked: prefs?.emailEnabled ?? true,
      onChange: (v) => update({ emailEnabled: v }),
    },
    {
      icon: AlertTriangle,
      label: 'Critical Alerts',
      description: 'Immediate notification for safety-critical events.',
      checked: prefs === undefined ? true : criticalOn,
      onChange: (v) =>
        update({
          notifyHighLoad: v,
          notifyVoltageHigh: v,
          notifyVoltageLow: v,
          notifyCircuitOverload: v,
        }),
    },
    {
      icon: Smartphone,
      label: 'Push Notifications',
      description: 'Real-time alerts sent to your mobile device.',
      checked: prefs?.pushEnabled ?? true,
      onChange: (v) => update({ pushEnabled: v }),
    },
    {
      icon: BarChart2,
      label: 'Weekly Reports',
      description: 'Get a weekly summary of energy consumption and savings.',
      checked: weeklyReports,
      onChange: setWeeklyReports,
    },
    {
      icon: Megaphone,
      label: 'Marketing Updates',
      description: 'New features, tips, and product announcements.',
      checked: marketing,
      onChange: setMarketing,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Notification Settings</h2>
        <p className="text-sm text-slate-400 mt-0.5">Control how and when you receive alerts.</p>
      </div>

      <Card>
        <div className="space-y-1">
          {notifications.map(({ icon: Icon, label, description, checked, onChange }, i) => (
            <div
              key={label}
              className={`flex items-center justify-between py-4 ${i < notifications.length - 1 ? 'border-b border-slate-800/60' : ''}`}
            >
              <div className="flex items-center gap-3 flex-1 mr-4">
                <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500">{description}</p>
                </div>
              </div>
              <Switch
                checked={checked}
                onCheckedChange={onChange}
                disabled={prefs === undefined && label !== 'Weekly Reports' && label !== 'Marketing Updates'}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Quiet hours — local only */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-1">Quiet Hours</h3>
        <p className="text-xs text-slate-500 mb-4">Suppress non-critical alerts during these hours.</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center">
              <span className="text-slate-400 text-xs font-bold">ZZ</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Enable Quiet Hours</p>
              <p className="text-xs text-slate-500">10:00 PM – 7:00 AM</p>
            </div>
          </div>
          <Switch checked={quietHours} onCheckedChange={setQuietHours} />
        </div>
      </Card>
    </div>
  )
}
