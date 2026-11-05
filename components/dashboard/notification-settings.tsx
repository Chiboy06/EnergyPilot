'use client'

import { Mail, AlertTriangle, BarChart2, Smartphone, Moon } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6">
      {children}
    </div>
  )
}

// No notification delivery (email, push, reports) exists yet. Rather than show
// switches that do nothing, each channel is listed as not available.
const CHANNELS = [
  { icon: Mail,          label: 'Email alerts',     description: 'Email when an alert opens.' },
  { icon: Smartphone,    label: 'Push notifications', description: 'Phone notification when an alert opens.' },
  { icon: AlertTriangle, label: 'Critical alerts',  description: 'Immediate notice for critical voltage or load alerts.' },
  { icon: BarChart2,     label: 'Weekly report',    description: 'Weekly summary of energy use.' },
  { icon: Moon,          label: 'Quiet hours',      description: 'Hold non-critical notices overnight.' },
]

export function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-semibold text-white">Notifications</h2>
        <p className="text-base text-slate-400 mt-1">
          Alerts are always recorded and shown on the dashboard and Alerts page. Sending them to you by email or
          phone is not available yet.
        </p>
      </div>

      <Card>
        <ul className="space-y-1">
          {CHANNELS.map(({ icon: Icon, label, description }, i) => (
            <li
              key={label}
              className={`flex items-center justify-between py-4 ${i < CHANNELS.length - 1 ? 'border-b border-slate-800/60' : ''}`}
            >
              <div className="flex items-center gap-3 flex-1 mr-4">
                <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0" aria-hidden>
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-base font-medium text-white">{label}</p>
                  <p className="text-sm text-slate-400">{description}</p>
                </div>
              </div>
              <span className="text-sm text-slate-400 mr-3">Not available yet</span>
              <Switch checked={false} disabled aria-label={`${label} — not available yet`} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
