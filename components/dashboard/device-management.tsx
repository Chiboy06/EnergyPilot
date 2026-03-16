'use client'

import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'
import { Trash2, Plus, Wifi, WifiOff, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Static demo rows shown when no real hubs exist yet
const DEMO_DEVICES = [
  { id: 1, name: 'Main Gateway', type: 'IoT Gateway', model: 'EP-GW-001', status: 'Online', lastSeen: 'Now' },
  { id: 2, name: 'Kitchen Circuit Monitor', type: 'Current Sensor', model: 'EP-CM-005', status: 'Online', lastSeen: '2m ago' },
  { id: 3, name: 'HVAC Controller', type: 'Smart Relay', model: 'EP-SR-003', status: 'Online', lastSeen: '1h ago' },
]

export function DeviceManagement() {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const { user } = useUser()
  const currentUser = useQuery(
    api.users.getCurrentUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  )
  const hubs = useQuery(
    api.onboarding.listHubs,
    user?.id ? { clerkId: user.id } : "skip"
  )
  const setActiveFacility = useMutation(api.onboarding.setActiveFacility)

  const isLoading = currentUser === undefined || hubs === undefined
  const hasRealHubs = hubs && hubs.length > 0
  const activeSerial = currentUser?.activeFacilityId
  const activeHub = hubs?.find((h) => h.serialNumber === activeSerial)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Device Management</h2>
          <p className="text-sm text-muted-foreground">Manage connected IoT devices and sensors.</p>
        </div>
        <Button
          onClick={() => router.push('/onboarding?addDevice=true')}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Facility switcher — only shown when user has multiple hubs */}
      {hasRealHubs && hubs.length > 1 && (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white hover:border-slate-600 transition-colors"
          >
            <span className="text-slate-400">Active facility:</span>
            <span className="font-medium">{activeHub?.facilityName ?? activeHub?.name ?? '—'}</span>
            <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full mt-1 left-0 z-20 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
              {hubs.map((hub) => (
                <button
                  key={hub._id}
                  onClick={async () => {
                    if (!user) return
                    await setActiveFacility({ clerkId: user.id, serialNumber: hub.serialNumber! })
                    setDropdownOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-700 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-white">{hub.facilityName ?? hub.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{hub.facilityType ?? 'Hub'} · {hub.serialNumber}</p>
                  </div>
                  {hub.serialNumber === activeSerial && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
          </div>
        ) : hasRealHubs ? (
          /* Real hubs from Convex */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['NAME', 'SERIAL', 'FACILITY', 'TYPE', 'STATUS', 'ADDED'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hubs.map((hub) => (
                  <tr key={hub._id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{hub.name}</td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{hub.serialNumber}</td>
                    <td className="py-3 px-4 text-muted-foreground">{hub.facilityName ?? '—'}</td>
                    <td className="py-3 px-4 text-muted-foreground capitalize">{hub.facilityType ?? '—'}</td>
                    <td className="py-3 px-4">
                      <Badge className={cn(hub.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400')}>
                        {hub.status === 'online' ? <Wifi className="h-3 w-3 mr-1 inline" /> : <WifiOff className="h-3 w-3 mr-1 inline" />}
                        <span className="capitalize">{hub.status}</span>
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(hub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Static demo data — shown before any real device is added */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">NAME</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">TYPE</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">MODEL</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">STATUS</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">LAST SEEN</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_DEVICES.map((device) => (
                  <tr key={device.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 text-foreground font-medium">{device.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{device.type}</td>
                    <td className="py-3 px-4 text-muted-foreground">{device.model}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-primary/20 text-primary">{device.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{device.lastSeen}</td>
                    <td className="py-3 px-4">
                      <button className="text-destructive hover:bg-destructive/10 p-2 rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
