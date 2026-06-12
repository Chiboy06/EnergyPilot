'use client'

import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useHubData } from '@/hooks/use-hub-data'

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function AnomalyReports() {
  const { activeHub } = useHubData()
  const hubId = activeHub?._id

  const anomalies = useQuery(
    api.anomalies.getAnomalies,
    hubId ? { hubId, includeResolved: true, limit: 10 } : 'skip'
  )

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Anomaly Reports</h3>
        <span className="text-xs text-muted-foreground">
          {anomalies ? `${anomalies.length} events` : 'Loading…'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">DATE</th>
              <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">MESSAGE</th>
              <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">SEVERITY</th>
              <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {anomalies?.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No anomalies recorded yet
                </td>
              </tr>
            )}
            {(anomalies ?? []).map((a) => (
              <tr key={a._id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-4 text-foreground text-xs whitespace-nowrap">
                  {fmtDate(a.timestamp)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs">{a.message}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge className={
                    a.severity === 'critical'
                      ? 'bg-destructive/20 text-destructive'
                      : 'bg-warning/20 text-warning'
                  }>
                    {a.severity}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge className={
                    a.resolvedAt
                      ? 'bg-primary/20 text-primary'
                      : 'bg-secondary text-muted-foreground'
                  }>
                    {a.resolvedAt ? 'Resolved' : 'Active'}
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
