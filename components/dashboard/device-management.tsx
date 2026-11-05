'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Plus, Wifi, WifiOff, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STALE_MS = 30_000
const ROLE_LABEL = { owner: 'Owner', controller: 'Shared · controller', viewer: 'Shared · viewer' } as const

export function DeviceManagement() {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const currentUser = useQuery(api.users.getMe, {})
  const hubs = useQuery(api.onboarding.listHubs, {})
  const setActiveFacility = useMutation(api.onboarding.setActiveFacility)

  const isLoading = currentUser === undefined || hubs === undefined
  const hasRealHubs = hubs && hubs.length > 0
  const activeFacilityId = currentUser?.activeFacilityId
  const activeHub = hubs?.find((h) => h.facilityId === activeFacilityId)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Devices</h2>
          <p className="text-base text-muted-foreground">Hubs you own or that were shared with you. Removing a hub isn&apos;t available in the app yet.</p>
        </div>
        <Button
          onClick={() => router.push('/onboarding?addDevice=true')}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden />
          Add hub
        </Button>
      </div>

      {/* Facility switcher — only shown when user has multiple hubs */}
      {hasRealHubs && hubs.length > 1 && (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white hover:border-slate-600 transition-colors"
          >
            <span className="text-slate-400">Showing:</span>
            <span className="font-medium">{activeHub?.name ?? '—'}</span>
            <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full mt-1 left-0 z-20 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
              {hubs.map((hub) => (
                <button
                  key={hub._id}
                  onClick={async () => {
                    setError(null)
                    try { await setActiveFacility({ facilityId: hub.facilityId }) }
                    catch (e) { setError(e instanceof Error ? e.message : 'Could not switch hub') }
                    setDropdownOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-700 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-white">{hub.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{hub.macAddress}</p>
                  </div>
                  {hub.facilityId === activeFacilityId && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

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
                  {['NAME', 'ACCESS', 'MAC ADDRESS', 'CHANNELS', 'LAST DATA', 'ADDED'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hubs.map((hub) => (
                  <tr key={hub._id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{hub.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{ROLE_LABEL[hub.role]}</td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{hub.macAddress}</td>
                    <td className="py-3 px-4 text-muted-foreground">{hub.channelCount} ch</td>
                    <td className="py-3 px-4">
                      {(() => {
                        const fresh = !!hub.lastSeenAt && Date.now() - hub.lastSeenAt < STALE_MS
                        return (
                          <Badge className={cn(fresh ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-300')}>
                            {fresh ? <Wifi className="h-3 w-3 mr-1 inline" aria-hidden /> : <WifiOff className="h-3 w-3 mr-1 inline" aria-hidden />}
                            {hub.lastSeenAt
                              ? fresh ? 'Reporting now' : `Last ${new Date(hub.lastSeenAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                              : 'No data received yet'}
                          </Badge>
                        )
                      })()}
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
          <div className="text-center py-12 text-base text-muted-foreground">
            No hubs yet. Use <strong>Add hub</strong> to register one, or join a shared hub with an access code during onboarding.
          </div>
        )}
      </Card>
    </div>
  )
}
