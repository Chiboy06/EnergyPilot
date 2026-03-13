'use client'

import { TrendingDown, DollarSign, Leaf, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function AnalyticsStats() {
  const stats = [
    {
      label: 'Total Consumption',
      value: '842.5',
      unit: 'kWh',
      trend: '↓ 4.2% vs last period',
      trendType: 'down',
      icon: Zap,
    },
    {
      label: 'Estimated Cost',
      value: '$142.30',
      unit: '',
      trend: '– On track with budget',
      trendType: 'stable',
      icon: DollarSign,
    },
    {
      label: 'Carbon Footprint',
      value: '186',
      unit: 'kg',
      trend: '↑ Improved efficiency',
      trendType: 'up',
      icon: Leaf,
    },
    {
      label: 'Peak Power',
      value: '5.2',
      unit: 'kW',
      trend: '⚠ Spike detected Jan 12',
      trendType: 'warning',
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
                  {stat.unit && <span className="text-xs text-muted-foreground">{stat.unit}</span>}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className={`text-xs font-medium ${
              stat.trendType === 'down' ? 'text-destructive' :
              stat.trendType === 'up' ? 'text-primary' :
              stat.trendType === 'warning' ? 'text-warning' :
              'text-muted-foreground'
            }`}>
              {stat.trend}
            </p>
          </Card>
        )
      })}
    </div>
  )
}
