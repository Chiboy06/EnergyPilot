'use client'

import { Card } from '@/components/ui/card'

const usageData = [
  { category: 'HVAC', percentage: 42, color: 'bg-blue-500' },
  { category: 'Appliances', percentage: 28, color: 'bg-warning' },
  { category: 'Lighting', percentage: 15, color: 'bg-purple-500' },
  { category: 'Always On', percentage: 15, color: 'bg-gray-500' },
]

export function UsageBreakdown() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Usage Breakdown</h3>

      <div className="space-y-4">
        {usageData.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">{item.category}</span>
              <span className="text-sm font-semibold text-foreground">{item.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
