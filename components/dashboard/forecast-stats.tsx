'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingDown, BarChart3, Clock, Leaf } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useHubData } from '@/hooks/use-hub-data'

export function ForecastStats() {
  const { activeHub } = useHubData()
  const hubId = activeHub?._id

  const forecast = useQuery(
    api.forecasts.getLatest,
    hubId ? { hubId } : 'skip'
  )

  const { totalKwh, peakKwh, peakLabel, carbonKg, missingHours } = useMemo(() => {
    if (!forecast?.dataPoints?.length) {
      return { totalKwh: null, peakKwh: null, peakLabel: '—', carbonKg: null, missingHours: 0 }
    }
    const pts = forecast.dataPoints
    const totalKwh = pts.reduce((s, p) => s + p.predictedKwh, 0)
    const peakPt   = pts.reduce((a, b) => b.predictedKwh > a.predictedKwh ? b : a)
    const peakDate = new Date(peakPt.timestamp * 1000)
    const peakLabel = peakDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const CARBON_KG_PER_KWH = 0.43
    return {
      totalKwh,
      peakKwh:  peakPt.predictedKwh,
      missingHours: pts.filter((p) => p.samples === 0).length,
      peakLabel,
      carbonKg: totalKwh * CARBON_KG_PER_KWH,
    }
  }, [forecast])

  const fmt1 = (v: number | null) => v === null ? '—' : v.toFixed(1)
  const generated = forecast ? new Date(forecast.generatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null

  const cards = [
    { icon: TrendingDown, label: 'Estimated energy · next 24 h', value: fmt1(totalKwh), unit: 'kWh', sub: 'Sum of the 24 hourly estimates' },
    { icon: BarChart3, label: 'Highest estimated hour', value: peakKwh === null ? '—' : peakKwh.toFixed(2), unit: 'kWh in that hour', sub: 'Energy expected in the busiest hour' },
    { icon: Clock, label: 'Busiest hour (est.)', value: peakLabel, unit: '', sub: 'Hour starting at this time' },
    { icon: Leaf, label: 'Carbon · next 24 h (est.)', value: fmt1(carbonKg), unit: 'kg CO₂', sub: '0.43 kg/kWh (Nigeria grid average)' },
  ]

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map(({ icon: Icon, label, value, unit, sub }) => (
          <Card key={label} className="bg-card border-border p-6 rounded-lg">
            <Icon className="h-5 w-5 text-primary mb-3" aria-hidden />
            <p className="text-base font-semibold text-foreground mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">{value}</span>
              {unit && <span className="text-base text-muted-foreground">{unit}</span>}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{sub}</p>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {forecast === undefined
          ? 'Loading…'
          : forecast === null
          ? 'No estimate yet — the first one is made at 01:00 WAT after the hub has sent data.'
          : `Generated ${generated} from the last 7 days of readings.${missingHours ? ` ${missingHours} hour(s) had no history and show 0.` : ''}`}
      </p>
    </div>
  )
}
