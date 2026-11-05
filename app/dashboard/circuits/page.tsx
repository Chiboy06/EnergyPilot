"use client";

export const dynamic = "force-dynamic";

import { CircuitGrid } from "@/components/dashboard/circuit-grid"
import { useHubData } from '@/hooks/use-hub-data'
import { circuitLoad } from '@/lib/circuit-status'
import { useState } from 'react'

export default function CircuitsPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'issues'>('all')
  const { circuitStates, facilityName, activeHub } = useHubData()

  const issueCount = circuitStates.filter((c) => circuitLoad(c).status === 'HIGH LOAD').length

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.12em] uppercase mb-1.5" style={{ color: "rgba(148,163,184,0.8)" }}>
          {facilityName ?? "Facility"} · {activeHub ? `${activeHub.channelCount}-channel hub` : "no hub"}
        </p>
        <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Circuits</h1>
        <p className="text-base lg:text-lg mt-1" style={{ color: "rgba(148,163,184,0.85)" }}>
          {circuitStates.length} circuits configured · per-circuit current, estimated power and relay control
        </p>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Filter circuits">
        {(['all', 'active', 'issues'] as const).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={activeFilter === f}
            onClick={() => setActiveFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeFilter === f
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-transparent text-slate-400 border border-transparent hover:text-slate-200'
            }`}
          >
            {f === 'issues' ? `High load (${issueCount})` : f === 'active' ? 'Drawing current' : 'All'}
          </button>
        ))}
      </div>

      <CircuitGrid filter={activeFilter} />
    </div>
  )
}
