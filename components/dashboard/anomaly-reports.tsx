'use client'

import { AlertTriangle, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const anomalies = [
  {
    date: 'Jan 28, 14:30',
    circuit: 'Outdoor',
    severity: 'Critical',
    status: 'Resolved',
    icon: AlertTriangle,
  },
  {
    date: 'Jan 12, 09:15',
    circuit: 'Kitchen',
    severity: 'Warning',
    status: 'Resolved',
    icon: AlertTriangle,
  },
]

export function AnomalyReports() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Anomaly Reports</h3>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">DATE</th>
              <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">CIRCUIT</th>
              <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">SEVERITY</th>
              <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.map((anomaly, index) => (
              <tr key={index} className="border-b border-border hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-4 text-foreground">{anomaly.date}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <anomaly.icon className="h-4 w-4" />
                    {anomaly.circuit}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge className={
                    anomaly.severity === 'Critical' 
                      ? 'bg-destructive/20 text-destructive'
                      : 'bg-warning/20 text-warning'
                  }>
                    {anomaly.severity}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge className="bg-primary/20 text-primary">
                    {anomaly.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
