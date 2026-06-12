'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useHubData } from '@/hooks/use-hub-data'

type Metric = 'consumption' | 'cost'

export function ConsumptionChart() {
  const [metric, setMetric] = useState<Metric>('consumption')
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

  // Days come back newest-first; reverse for chronological chart
  const chartData = useMemo(() => {
    if (!days) return []
    return [...days]
      .reverse()
      .map(d => ({
        date:        d.date.slice(5), // "MM-DD"
        consumption: d.totalKwh,
        cost:        d.costNgn,
      }))
  }, [days])

  const isLoading = days === undefined && !!hubId

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Consumption Trend</h3>
          <p className="text-sm text-muted-foreground">
            Daily energy usage — last {days ? days.length : 30} days
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={metric === 'consumption' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetric('consumption')}
          >
            kWh
          </Button>
          <Button
            variant={metric === 'cost' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetric('cost')}
          >
            Cost ₦
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
          No data yet — readings will appear once your hub sends telemetry.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="rgb(16,185,129)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="rgb(16,185,129)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,148,158,0.1)" />
            <XAxis
              dataKey="date"
              stroke="rgb(139,148,158)"
              style={{ fontSize: '12px' }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="rgb(139,148,158)"
              style={{ fontSize: '12px' }}
              label={{
                value: metric === 'consumption' ? 'kWh' : '₦',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(22,27,34)',
                border: '1px solid rgb(48,54,61)',
                borderRadius: '8px',
              }}
              formatter={(value) => {
                const v = Number(value ?? 0);
                return metric === 'consumption'
                  ? [`${v.toFixed(2)} kWh`, 'Consumption']
                  : [`₦${v.toFixed(2)}`, 'Cost'];
              }}
              cursor={false}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="rgb(16,185,129)"
              fillOpacity={1}
              fill="url(#colorMain)"
              strokeWidth={1.8}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
