'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
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

  const chartData = useMemo(() => {
    if (!forecast?.dataPoints?.length) return []
    const nowMs = Date.now()
    return forecast.dataPoints.map((pt) => {
      const tsMs    = pt.timestamp * 1000
      const isPast  = tsMs < nowMs
      const label   = new Date(tsMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return {
        label,
        predicted:   pt.predictedKwh,
        upper:       pt.confidenceHigh,
        lower:       pt.confidenceLow,
        isNow:       !isPast && tsMs - nowMs < 3_600_000,
      }
    })
  }, [forecast])

  const nowIdx = chartData.findIndex((d) => d.isNow)
  const nowLabel = chartData[nowIdx]?.label ?? ''

  const isLoading = forecast === undefined && !!hubId

  return (
    <Card className="bg-card border-border p-4 md:p-6 rounded-lg">
      <div className="mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">24-Hour Load Projection</h3>
        <p className="text-xs md:text-sm text-muted-foreground">
          {forecast
            ? `Moving-average forecast · generated ${new Date(forecast.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Forecast from moving-average model'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-primary flex-shrink-0" style={{ width: 12 }} />
          <span className="text-xs text-muted-foreground">Forecast</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 flex-shrink-0" style={{ width: 12, background: 'rgba(59,130,246,0.4)' }} />
          <span className="text-xs text-muted-foreground">Confidence band</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
          No forecast available yet — runs daily at 01:00 WAT once telemetry is collected.
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
                tick={{ fill: '#8b949e', fontSize: 11 }}
                axisLine={{ stroke: '#30363d' }}
                tickLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: '#8b949e', fontSize: 11 }}
                axisLine={{ stroke: '#30363d' }}
                tickLine={false}
                tickFormatter={(v) => `${v.toFixed(1)}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '0.5rem', color: '#e6edf3' }}
                formatter={(value) => typeof value === 'number' ? `${value.toFixed(2)} kWh` : null}
              />
              {/* Confidence band */}
              <Area type="monotone" dataKey="upper" fill="url(#confBand)" stroke="none" isAnimationActive={false} />
              {/* Forecast line */}
              <Area
                type="monotone"
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
