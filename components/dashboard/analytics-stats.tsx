'use client'
import { useRange } from '@/hooks/use-range'

import { DollarSign, Leaf, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useHubData } from '@/hooks/use-hub-data'

export function AnalyticsStats({ rangeDays = 30 }: { rangeDays?: number }) {
  const { activeHub } = useHubData()
  const hubId = activeHub?._id

  const { from, to } = useRange(rangeDays)

  const days = useQuery(
    api.telemetry.getConsumptionByDay,
    hubId ? { hubId, fromTimestamp: from, toTimestamp: to } : 'skip'
  )

  const tariff = useQuery(api.preferences.getTariffRate, {})
  const totalKwh   = days ? days.reduce((s, d) => s + d.totalKwh, 0) : null
  const totalCost  = days ? days.reduce((s, d) => s + d.costNgn, 0) : null
  const totalCarbon = days ? days.reduce((s, d) => s + d.carbonKg, 0) : null
  const peakW       = days && days.length > 0 ? Math.max(...days.map(d => d.peakW)) : null

  const fmt = (v: number | null, decimals = 1) =>
    v === null ? '—' : v.toFixed(decimals)

  const ngn = (v: number) => `₦${Math.round(v).toLocaleString()}`
  const stats = [
    {
      label: 'Energy Used',
      value: fmt(totalKwh),
      unit: 'kWh',
      sub: days ? `Whole system · sum of ${days.length} day(s) with data in the last ${rangeDays} days` : 'Loading…',
      icon: Zap,
    },
    {
      label: 'Estimated Cost',
      value: totalCost === null ? '—' : ngn(totalCost),
      unit: '',
      sub: totalCost !== null && tariff
        ? `At ₦${tariff.tariffPerKwh}/kWh${tariff.isDefault ? ' — app default, no tariff configured' : ' — your configured tariff'}`
        : 'Loading…',
      icon: DollarSign,
    },
    {
      label: 'Carbon (est.)',
      value: fmt(totalCarbon, 0),
      unit: 'kg CO₂',
      sub: 'Energy × 0.43 kg/kWh (Nigeria grid average)',
      icon: Leaf,
    },
    {
      label: 'Peak Power',
      value: peakW !== null ? (peakW / 1000).toFixed(2) : '—',
      unit: 'kW',
      sub: 'Highest single 5-second reading in the range',
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
                <p className="text-base lg:text-lg font-semibold text-foreground mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl xl:text-5xl font-bold text-foreground">{stat.value}</p>
                  {stat.unit && (
                    <span className="text-base text-muted-foreground">{stat.unit}</span>
                  )}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-secondary text-primary" aria-hidden>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{stat.sub}</p>
          </Card>
        )
      })}
    </div>
  )
}
