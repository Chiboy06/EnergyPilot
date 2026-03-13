'use client'

import { CircuitGrid } from '@/components/dashboard/circuit-grid'
import { useState } from 'react'

export default function CircuitsPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'issues'>('all')

  return (
    <div className="flex-1 flex flex-col">
      {/* <DashboardHeader 
        title="Circuits"
        breadcrumb={['Dashboard', 'Circuits']}
      /> */}

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Filter Tabs */}
          <div className="mb-8 flex gap-4">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-secondary text-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'active'
                  ? 'bg-secondary text-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter('issues')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'issues'
                  ? 'bg-secondary text-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Issues (1)
            </button>
          </div>

          {/* Circuits Grid */}
          <CircuitGrid filter={activeFilter} />
        </div>
      </main>
    </div>
  )
}
