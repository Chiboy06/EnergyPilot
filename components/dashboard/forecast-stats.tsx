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

  const { totalKwh, peakKw, peakLabel, carbonKg } = useMemo(() => {
    if (!forecast?.dataPoints?.length) {
      return { totalKwh: null, peakKw: null, peakLabel: '—', carbonKg: null }
    }
    const pts = forecast.dataPoints
    const totalKwh = pts.reduce((s, p) => s + p.predictedKwh, 0)
    const peakPt   = pts.reduce((a, b) => b.predictedKwh > a.predictedKwh ? b : a)
    const peakDate = new Date(peakPt.timestamp * 1000)
    const peakLabel = peakDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const CARBON_KG_PER_KWH = 0.43
    return {
      totalKwh,
      peakKw:   peakPt.predictedKwh,
      peakLabel,
      carbonKg: totalKwh * CARBON_KG_PER_KWH,
    }
  }, [forecast])

  const fmt1 = (v: number | null) => v === null ? '—' : v.toFixed(1)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <Card className="bg-card border-border p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <TrendingDown className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground mb-1">Forecast (Next 24h)</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{fmt1(totalKwh)}</span>
          <span className="text-sm text-muted-foreground">kWh</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {forecast ? 'Moving-average model' : 'Loading…'}
        </p>
      </Card>

      <Card className="bg-card border-border p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground mb-1">Peak Forecast</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{fmt1(peakKw)}</span>
          <span className="text-sm text-muted-foreground">kW</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Highest predicted hour</p>
      </Card>

      <Card className="bg-card border-border p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <Clock className="h-5 w-5 text-warning" />
        </div>
        <p className="text-sm text-muted-foreground mb-1">Next Peak Time</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{peakLabel}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Predicted peak load hour</p>
      </Card>

      <Card className="bg-card border-border p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <Leaf className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground mb-1">Carbon · 24h</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{fmt1(carbonKg)}</span>
          <span className="text-sm text-muted-foreground">kg CO₂</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">0.43 kg/kWh (Nigeria grid)</p>
      </Card>
    </div>
  )
}
