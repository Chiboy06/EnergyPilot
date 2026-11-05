'use client'
import { useRange } from '@/hooks/use-range'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useHubData } from '@/hooks/use-hub-data'

type Metric = 'consumption' | 'cost'

export function ConsumptionChart({ rangeDays = 30 }: { rangeDays?: number }) {
  const [metric, setMetric] = useState<Metric>('consumption')
  const { activeHub } = useHubData()
  const hubId = activeHub?._id

  const { from, to } = useRange(rangeDays)

  const days = useQuery(
    api.telemetry.getConsumptionByDay,
    hubId ? { hubId, fromTimestamp: from, toTimestamp: to } : 'skip'
  )
  const tariff = useQuery(api.preferences.getTariffRate, {})

  // Days come back newest-first; reverse for chronological chart
  const chartData = useMemo(() => {
    if (!days) return []
    return [...days]
      .reverse()
      .map(d => ({
        date:        new Date(d.date + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        consumption: d.totalKwh,
        cost:        d.costNgn,
      }))
  }, [days])

  const isLoading = days === undefined && !!hubId

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h3 className="text-xl lg:text-2xl font-semibold text-foreground">Daily Energy Use</h3>
          <p className="text-sm lg:text-base text-muted-foreground mt-1">
            {metric === 'consumption'
              ? 'Total kWh per calendar day (WAT), whole system'
              : `Estimated cost per day at ₦${tariff?.tariffPerKwh ?? '…'}/kWh${tariff?.isDefault ? ' (app default — set your tariff in Settings → Account)' : ' (your tariff)'}`}
            {' · '}selected range: last {rangeDays} days{days ? ` · ${days.length} day(s) with data` : ''}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Each bar is one day&apos;s total, summed from every 5-second reading received that day. Days the hub was offline are missing or lower.
          </p>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Metric">
          <Button
            variant={metric === 'consumption' ? 'default' : 'outline'}
            size="sm"
            aria-selected={metric === 'consumption'}
            role="tab"
            onClick={() => setMetric('consumption')}
          >
            Energy (kWh)
          </Button>
          <Button
            variant={metric === 'cost' ? 'default' : 'outline'}
            size="sm"
            aria-selected={metric === 'cost'}
            role="tab"
            onClick={() => setMetric('cost')}
          >
            Cost (₦, est.)
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : chartData.length < 2 ? (
        <div className="flex items-center justify-center h-[300px] text-base text-muted-foreground text-center px-4">
          Not enough data yet — daily totals appear after the hub has reported on at least two days.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,148,158,0.1)" vertical={false} />
            <XAxis dataKey="date" stroke="rgb(139,148,158)" style={{ fontSize: '13px' }} interval="preserveStartEnd" />
            <YAxis
              stroke="rgb(139,148,158)"
              style={{ fontSize: '13px' }}
              label={{ value: metric === 'consumption' ? 'kWh per day' : '₦ per day', angle: -90, position: 'insideLeft', fill: 'rgb(139,148,158)', fontSize: 13 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgb(22,27,34)', border: '1px solid rgb(48,54,61)', borderRadius: '8px', fontSize: 13 }}
              formatter={(value) => {
                const v = Number(value ?? 0)
                return metric === 'consumption'
                  ? [`${v.toFixed(2)} kWh`, 'Energy that day']
                  : [`₦${v.toFixed(2)}`, 'Estimated cost that day']
              }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey={metric} fill="rgb(16,185,129)" radius={[3, 3, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
