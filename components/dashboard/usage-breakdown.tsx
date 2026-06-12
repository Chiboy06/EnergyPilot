'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useHubData } from '@/hooks/use-hub-data'

const LOAD_TYPE_META: Record<string, { label: string; color: string }> = {
  hvac:       { label: 'HVAC',       color: 'bg-blue-500' },
  lighting:   { label: 'Lighting',   color: 'bg-purple-500' },
  appliance:  { label: 'Appliances', color: 'bg-amber-500' },
  ev_charger: { label: 'EV Charger', color: 'bg-cyan-500' },
  general:    { label: 'General',    color: 'bg-emerald-500' },
  other:      { label: 'Other',      color: 'bg-gray-500' },
}

export function UsageBreakdown() {
  const { activeHub } = useHubData()
  const hubId = activeHub?._id

  const { from, to } = useMemo(() => {
    const to = Math.floor(Date.now() / 1000)
    return { from: to - 30 * 86400, to }
  }, [])

  const circuits = useQuery(
    api.telemetry.getConsumptionByCircuit,
    hubId ? { hubId, fromTimestamp: from, toTimestamp: to } : 'skip'
  )

  const breakdown = useMemo(() => {
    if (!circuits || circuits.length === 0) return []
    const totals: Record<string, number> = {}
    for (const c of circuits) {
      const key = c.loadType ?? 'general'
      totals[key] = (totals[key] ?? 0) + c.totalKwh
    }
    const grand = Object.values(totals).reduce((s, v) => s + v, 0)
    if (grand === 0) return []
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([type, kwh]) => ({
        type,
        label:      LOAD_TYPE_META[type]?.label ?? type,
        color:      LOAD_TYPE_META[type]?.color ?? 'bg-gray-500',
        percentage: Math.round((kwh / grand) * 100),
        kwh:        kwh.toFixed(1),
      }))
  }, [circuits])

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Usage Breakdown</h3>

      {circuits === undefined && !!hubId ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
        </div>
      ) : breakdown.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No circuit data yet.
        </p>
      ) : (
        <div className="space-y-4">
          {breakdown.map((item) => (
            <div key={item.type}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-foreground">
                  {item.percentage}%
                  <span className="text-xs text-muted-foreground ml-1">({item.kwh} kWh)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
