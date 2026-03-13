'use client'

import { Card } from '@/components/ui/card'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

const data = [
  { time: 'Yesterday 12:00', actual: 2.1, predicted: 2.0, upper: 2.3, lower: 1.8 },
  { time: '', actual: 2.3, predicted: 2.2, upper: 2.5, lower: 1.9 },
  { time: '', actual: 2.5, predicted: 2.4, upper: 2.7, lower: 2.1 },
  { time: '', actual: 2.8, predicted: 2.7, upper: 3.0, lower: 2.4 },
  { time: '', actual: 3.0, predicted: 2.9, upper: 3.2, lower: 2.6 },
  { time: '', actual: 3.2, predicted: 3.1, upper: 3.4, lower: 2.8 },
  { time: '', actual: 3.5, predicted: 3.4, upper: 3.7, lower: 3.1 },
  { time: '', actual: 3.8, predicted: 3.7, upper: 4.1, lower: 3.3 },
  { time: '', actual: 4.0, predicted: 4.2, upper: 4.5, lower: 3.9 },
  { time: '', actual: 4.2, predicted: 4.5, upper: 4.9, lower: 4.1 },
  { time: '', actual: 4.1, predicted: 4.8, upper: 5.2, lower: 4.4 },
  { time: 'Now', actual: 4.0, predicted: 4.8, upper: 5.3, lower: 4.3, isNow: true },
  { time: '', actual: null, predicted: 4.6, upper: 5.1, lower: 4.1 },
  { time: '', actual: null, predicted: 4.2, upper: 4.9, lower: 3.5 },
  { time: '', actual: null, predicted: 3.8, upper: 4.6, lower: 3.0 },
  { time: '', actual: null, predicted: 3.5, upper: 4.4, lower: 2.6 },
  { time: '', actual: null, predicted: 3.2, upper: 4.2, lower: 2.2 },
  { time: '', actual: null, predicted: 3.0, upper: 4.1, lower: 2.0 },
  { time: '', actual: null, predicted: 2.9, upper: 4.0, lower: 1.8 },
  { time: 'Tomorrow 12:00', actual: null, predicted: 2.8, upper: 3.9, lower: 1.7 },
]

export function LoadProjectionChart() {
  return (
    <Card className="bg-card border-border p-4 md:p-6 rounded-lg">
      <div className="mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">48-Hour Load Projection</h3>
        <p className="text-xs md:text-sm text-muted-foreground">Historical data vs. ML-generated forecast</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-primary flex-shrink-0" style={{ width: '12px' }} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Predicted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-muted-foreground flex-shrink-0" style={{ width: '12px' }} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Confidence</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300} minHeight={200}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
          <XAxis 
            dataKey="time" 
            tick={{ fill: '#8b949e', fontSize: 12 }}
            axisLine={{ stroke: '#30363d' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#8b949e', fontSize: 12 }}
            axisLine={{ stroke: '#30363d' }}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '0.5rem',
              color: '#e6edf3',
            }}
            formatter={(value) => {
              if (typeof value === 'number') {
                return `${value.toFixed(1)} kW`
              }
              return null
            }}
          />
          
          {/* Confidence interval area */}
          <Area 
            type="monotone" 
            dataKey="upper" 
            fill="url(#colorUpper)" 
            stroke="none"
            isAnimationActive={false}
          />
          
          {/* Actual line */}
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#e6edf3" 
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
          
          {/* Predicted line (dashed) */}
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#3b82f6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
          />

          {/* Now reference line */}
          <ReferenceLine 
            x={11} 
            stroke="#30363d" 
            strokeDasharray="3 3"
            label={{ value: '', position: 'top' }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 md:mt-6 flex justify-between text-xs text-muted-foreground px-2">
        <span className="text-left">Yesterday 12:00</span>
        <span className="text-center">Now</span>
        <span className="text-right">Tomorrow 12:00</span>
      </div>
    </Card>
  )
}
