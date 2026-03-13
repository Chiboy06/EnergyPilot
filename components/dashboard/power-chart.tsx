"use client"

import { Card } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts"

// Generate sample data for 24 hours
const generateData = () => {
  const data = []
  for (let i = 0; i <= 24; i++) {
    const hour = i.toString().padStart(2, "0") + ":00"
    const baseActual = 1000 + Math.sin(i / 4) * 500 + Math.random() * 200
    const basePredicted = 1000 + Math.sin(i / 4) * 500 + (i > 16 ? Math.random() * 100 : 0)
    data.push({
      time: hour,
      actual: Math.round(baseActual),
      predicted: Math.round(basePredicted),
    })
  }
  return data
}

const data = generateData()

export function PowerChart() {
  return (
    <Card className="bg-card border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Power Consumption Real-time</h2>
          <p className="text-sm text-muted-foreground">Live data vs ML Prediction (24h)</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-chart-2" />
            <span className="text-sm text-muted-foreground">Predicted</span>
          </div>
        </div>
      </div>

      {/* Chart with Tooltip Card */}
      <div className="relative">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#8b949e"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#8b949e"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value / 1000}kW`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: "8px",
                  color: "#e6edf3",
                }}
                labelStyle={{ color: "#8b949e" }}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#actualGradient)"
                name="Actual"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Predicted"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Floating Tooltip Card */}
        <Card className="absolute top-4 right-4 bg-card border-border p-4 w-48">
          <p className="text-2xl font-mono font-semibold text-foreground mb-4">13:48:53</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm bg-primary" />
                <span className="text-sm text-primary">Actual</span>
              </div>
              <span className="font-mono text-sm text-foreground">1,246W</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm bg-chart-2" />
                <span className="text-sm text-chart-2">Predicted</span>
              </div>
              <span className="font-mono text-sm text-foreground">1,246W</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-sm text-destructive">Anomaly</span>
              </div>
              <span className="font-mono text-sm text-destructive">0.85</span>
            </div>
          </div>
          {/* Mini sparkline */}
          <div className="mt-4 h-8 bg-secondary/50 rounded overflow-hidden">
            <svg viewBox="0 0 100 30" className="w-full h-full">
              <path
                d="M0,25 Q10,20 20,22 T40,18 T60,15 T80,12 T100,8"
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </Card>
      </div>
    </Card>
  )
}
