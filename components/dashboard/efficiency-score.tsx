'use client'
import { useRange } from '@/hooks/use-range'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useHubData } from '@/hooks/use-hub-data'
import { Loader2 } from 'lucide-react'

function gradeFromScore(s: number) {
  if (s >= 85) return 'A+'
  if (s >= 75) return 'A'
  if (s >= 65) return 'B+'
  if (s >= 55) return 'B'
  if (s >= 45) return 'C'
  return 'D'
}

function gradeColor(g: string) {
  if (g === 'A+' || g === 'A') return 'text-emerald-400'
  if (g === 'B+' || g === 'B') return 'text-blue-400'
  if (g === 'C') return 'text-amber-400'
  return 'text-red-400'
}

// Day-to-day consistency of total energy use over the last 30 days.
// This is NOT an efficiency rating and has no comparison with other homes.
export function EfficiencyScore() {
  const { activeHub } = useHubData()
  const hubId = activeHub?._id

  const { from, to } = useRange(30)

  const days = useQuery(
    api.telemetry.getConsumptionByDay,
    hubId ? { hubId, fromTimestamp: from, toTimestamp: to } : 'skip'
  )

  // Efficiency score = 100 - CV*100, where CV = stddev/mean of daily kWh.
  // High score = consistent usage (low peaks relative to average) = efficient.
  const { grade, score, optimizerPct, subLabel } = useMemo(() => {
    if (!days || days.length < 2) {
      return { grade: '—', score: null, optimizerPct: null, subLabel: days ? 'Need more data' : 'Loading…' }
    }
    const kwhs = days.map(d => d.totalKwh)
    const avg = kwhs.reduce((s, v) => s + v, 0) / kwhs.length
    if (avg === 0) {
      return { grade: '—', score: null, optimizerPct: null, subLabel: 'No consumption yet' }
    }
    const std = Math.sqrt(kwhs.reduce((s, v) => s + (v - avg) ** 2, 0) / kwhs.length)
    const cv = std / avg
    const s = Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)))
    const g = gradeFromScore(s)
    // Optimizer: % of days that stayed under 120% of average (i.e., no large spikes)
    const threshold = avg * 1.2
    const goodDays = kwhs.filter(k => k <= threshold).length
    const opt = Math.round((goodDays / kwhs.length) * 100)
    return { grade: g, score: s, optimizerPct: opt, subLabel: `Based on ${days.length} day(s) of data in the last 30 days` }
  }, [days])

  const isLoading = days === undefined && !!hubId

  return (
    <Card className="p-6">
      <h3 className="text-xl lg:text-2xl font-semibold text-foreground">Usage Consistency</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        How steady your daily energy use is (100 = every day the same). Always the last 30 days; not an efficiency rating.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-center">
            <div className={`text-5xl font-bold mb-2 ${gradeColor(grade)}`}>{grade}</div>
            <p className="text-sm text-muted-foreground">
              {score !== null ? `Consistency: ${score}/100` : 'Not enough data'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{subLabel}</p>
          </div>

          <div className="border-t border-border pt-8">
            <div className={`text-2xl font-bold mb-2 ${optimizerPct !== null ? 'text-primary' : 'text-muted-foreground'}`}>
              {optimizerPct !== null ? `${optimizerPct}%` : '—'}
            </div>
            <p className="text-sm text-muted-foreground">Typical days</p>
            <p className="text-xs text-muted-foreground mt-1">
              {optimizerPct !== null ? 'Days using no more than 1.2× your daily average' : 'Awaiting telemetry'}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
