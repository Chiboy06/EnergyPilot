'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useHubData } from '@/hooks/use-hub-data'

export function LoadProjectionChart() {
  const { activeHub } = useHubData()
  const hubId = activeHub?._id

  const forecast = useQuery(
    api.forecasts.getLatest,
    hubId ? { hubId } : 'skip'
  )

  const [nowMs] = useState(() => Date.now())
  const chartData = useMemo(() => {
    if (!forecast?.dataPoints?.length) return []
    return forecast.dataPoints.map((pt) => {
      const tsMs    = pt.timestamp * 1000
      const isPast  = tsMs < nowMs
      const label   = new Date(tsMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return {
        label,
        predicted:   pt.predictedKwh,
        band:        [pt.confidenceLow, pt.confidenceHigh] as [number, number],
        isNow:       !isPast && tsMs - nowMs < 3_600_000,
      }
    })
  }, [forecast, nowMs])

  const nowIdx = chartData.findIndex((d) => d.isNow)
  const nowLabel = chartData[nowIdx]?.label ?? ''

  const isLoading = forecast === undefined && !!hubId

  return (
    <Card className="bg-card border-border p-4 md:p-6 rounded-lg">
      <div className="mb-4 md:mb-6">
        <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-1">Hourly Energy Estimate · Next 24 h</h3>
        <p className="text-sm lg:text-base text-muted-foreground">
          kWh expected in each hour (= that hour&apos;s 7-day average power). Estimate only
          {forecast ? ` · generated ${new Date(forecast.generatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-primary flex-shrink-0" style={{ width: 12 }} />
          <span className="text-sm text-muted-foreground">Estimate (kWh per hour)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 flex-shrink-0" style={{ width: 12, background: 'rgba(59,130,246,0.4)' }} />
          <span className="text-sm text-muted-foreground">Typical spread (±1 std. dev. of past readings), not a guarantee</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
          No estimate yet — generated daily at 01:00 WAT once the hub has sent data.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300} minHeight={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#8b949e', fontSize: 13 }}
                axisLine={{ stroke: '#30363d' }}
                tickLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: '#8b949e', fontSize: 13 }}
                axisLine={{ stroke: '#30363d' }}
                tickLine={false}
                tickFormatter={(v) => `${v.toFixed(1)}`}
                label={{ value: 'kWh per hour', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 13 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '0.5rem', color: '#e6edf3' }}
                formatter={(value, name) => name === 'band' && Array.isArray(value)
                  ? [`${Number(value[0]).toFixed(2)}–${Number(value[1]).toFixed(2)} kWh`, 'Typical spread']
                  : [`${Number(value).toFixed(2)} kWh`, 'Estimate']}
              />
              {/* Confidence band */}
              <Area type="linear" dataKey="band" fill="url(#confBand)" stroke="none" isAnimationActive={false} />
              {/* Forecast line */}
              <Area
                type="linear"
                dataKey="predicted"
                stroke="#10b981"
                strokeWidth={2}
                fill="rgba(16,185,129,0.06)"
                dot={false}
                isAnimationActive={false}
              />
              {nowLabel && (
                <ReferenceLine x={nowLabel} stroke="#30363d" strokeDasharray="3 3" />
              )}
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-between text-xs text-muted-foreground px-2">
            <span>{chartData[0]?.label ?? ''}</span>
            {nowLabel && <span>Now</span>}
            <span>{chartData[chartData.length - 1]?.label ?? ''}</span>
          </div>
        </>
      )}
    </Card>
  )
}
