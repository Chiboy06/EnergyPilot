'use client'

import { CircuitGrid } from '@/components/dashboard/circuit-grid'
import { useFacility } from '@/hooks/use-facility'
import { getRoomMockPower } from '@/lib/room-utils'
import { useState } from 'react'

export default function CircuitsPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'issues'>('all')
  const { rooms, facilityName, facilityType } = useFacility()

  const issueCount = rooms.filter((r) => {
    const { status } = getRoomMockPower(r)
    return status === 'ANOMALY' || status === 'HIGH LOAD'
  }).length

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Page title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Circuits</h1>
            {facilityName && (
              <p className="text-sm text-muted-foreground capitalize">
                {facilityName} &middot; {facilityType}
              </p>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="mb-8 flex gap-4">
            {(['all', 'active', 'issues'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === f
                    ? 'bg-secondary text-foreground'
                    : 'bg-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'issues' ? `Issues (${issueCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <CircuitGrid filter={activeFilter} />
        </div>
      </main>
    </div>
  )
}
