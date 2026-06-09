"use client";

export const dynamic = "force-dynamic";

import { CircuitGrid } from "@/components/dashboard/circuit-grid"
import { useFacility } from '@/hooks/use-facility'
import { useHubData } from '@/hooks/use-hub-data'
import { useState } from 'react'

const VOLTAGE = 220;
const POWER_FACTOR = 0.85;

export default function CircuitsPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'issues'>('all')
  const { facilityName, facilityType } = useFacility()
  const { circuitStates, breakerCapacity } = useHubData()

  const issueCount = circuitStates.filter((c) => {
    const maxW = (c.maxAmps ?? breakerCapacity) * VOLTAGE * POWER_FACTOR
    return maxW > 0 && (c.powerW / maxW) * 100 >= 85
  }).length

  return (
    <div className="space-y-5">
      {/* Page title */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase mb-1.5" style={{ color: "rgba(148,163,184,0.55)" }}>
          {facilityName ?? "Facility"} · Breaker array · CH1–16
        </p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Circuits</h1>
        <p className="text-[13px] mt-0.5" style={{ color: "rgba(100,116,139,0.9)" }}>
          16-channel power monitoring · relay control
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'issues'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeFilter === f
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-transparent text-slate-500 border border-transparent hover:text-slate-300'
            }`}
          >
            {f === 'issues' ? `Issues (${issueCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <CircuitGrid filter={activeFilter} />
    </div>
  )
}
