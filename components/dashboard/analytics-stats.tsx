'use client'

import { useMemo } from 'react'
import { DollarSign, Leaf, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useHubData } from '@/hooks/use-hub-data'

export function AnalyticsStats() {
  const { activeHub } = useHubData()
  const hubId = activeHub?._id

  const { from, to } = useMemo(() => {
    const to = Math.floor(Date.now() / 1000)
    return { from: to - 30 * 86400, to }
  }, [])

  const days = useQuery(
    api.telemetry.getConsumptionByDay,
    hubId ? { hubId, fromTimestamp: from, toTimestamp: to } : 'skip'
  )

  const totalKwh   = days ? days.reduce((s, d) => s + d.totalKwh, 0) : null
  const totalCost  = days ? days.reduce((s, d) => s + d.costNgn, 0) : null
  const totalCarbon = days ? days.reduce((s, d) => s + d.carbonKg, 0) : null
  const peakW       = days && days.length > 0 ? Math.max(...days.map(d => d.peakW)) : null

  const fmt = (v: number | null, decimals = 1) =>
    v === null ? '—' : v.toFixed(decimals)

  const stats = [
    {
      label: 'Total Consumption',
      value: fmt(totalKwh),
      unit: 'kWh',
      sub: days ? `${days.length}-day window` : 'Loading…',
      icon: Zap,
    },
    {
      label: 'Estimated Cost',
      value: totalCost === null ? '—' : `₦${(totalCost / 1000).toFixed(1)}k`,
      unit: '',
      sub: totalCost !== null ? `₦${(totalCost / (days?.length ?? 1)).toFixed(0)}/day avg` : 'Loading…',
      icon: DollarSign,
    },
    {
      label: 'Carbon Footprint',
      value: fmt(totalCarbon, 0),
      unit: 'kg',
      sub: 'CO₂ equivalent',
      icon: Leaf,
    },
    {
      label: 'Peak Power',
      value: peakW !== null ? (peakW / 1000).toFixed(2) : '—',
      unit: 'kW',
      sub: 'Max single reading',
      icon: Zap,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                  {stat.unit && (
                    <span className="text-xs text-muted-foreground">{stat.unit}</span>
                  )}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground">{stat.sub}</p>
          </Card>
        )
      })}
    </div>
  )
}
