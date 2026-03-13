'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { date: 'Jan 1', consumption: 12, cost: 1.8 },
  { date: 'Jan 5', consumption: 16, cost: 2.4 },
  { date: 'Jan 10', consumption: 20, cost: 3.0 },
  { date: 'Jan 15', consumption: 25, cost: 3.75 },
  { date: 'Jan 20', consumption: 28, cost: 4.2 },
  { date: 'Jan 25', consumption: 30, cost: 4.5 },
  { date: 'Jan 30', consumption: 31, cost: 4.65 },
]

export function ConsumptionChart() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Consumption Trend</h3>
          <p className="text-sm text-muted-foreground">Daily energy usage over the last 30 days</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">kWh</Button>
          <Button variant="outline" size="sm">Cost</Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgb(16, 185, 129)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="rgb(16, 185, 129)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 148, 158, 0.1)" />
          <XAxis 
            dataKey="date" 
            stroke="rgb(139, 148, 158)"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="rgb(139, 148, 158)"
            style={{ fontSize: '12px' }}
            label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgb(22, 27, 34)',
              border: '1px solid rgb(48, 54, 61)',
              borderRadius: '8px'
            }}
            cursor={false}
          />
          <Area 
            type="monotone" 
            dataKey="consumption" 
            stroke="rgb(16, 185, 129)" 
            fillOpacity={1} 
            fill="url(#colorConsumption)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
