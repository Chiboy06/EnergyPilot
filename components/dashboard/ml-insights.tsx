'use client'

import { Card } from '@/components/ui/card'
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useHubData } from '@/hooks/use-hub-data'

function fmtAge(ts: number) {
  const d = Date.now() - ts
  if (d < 90_000) return 'just now'
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return `${Math.floor(d / 86_400_000)}d ago`
}

function titleCase(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function MLInsights() {
  const { activeHub } = useHubData()
  const hubId = activeHub?._id

  const anomalies = useQuery(
    api.anomalies.getAnomalies,
    hubId ? { hubId, includeResolved: true, limit: 5 } : 'skip'
  )

  const isLoading = anomalies === undefined && !!hubId

  const updatedLabel = (() => {
    if (!anomalies || anomalies.length === 0) return 'No events'
    return fmtAge(anomalies[0].timestamp)
  })()

  return (
    <Card className="bg-card border-border p-4 md:p-6 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-foreground">Live Insights</h3>
        <span className="text-xs text-muted-foreground">
          {isLoading ? 'Loading…' : `Updated ${updatedLabel}`}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
        </div>
      ) : !anomalies || anomalies.length === 0 ? (
        <div className="flex items-start gap-4 p-4 rounded-lg border border-border">
          <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">All systems nominal</p>
            <p className="text-xs text-muted-foreground mt-1">
              No anomalies detected across all monitored circuits.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {anomalies.map((a) => {
            const isResolved = !!a.resolvedAt
            const isCritical = a.severity === 'critical' && !isResolved
            return (
              <div
                key={a._id}
                className="w-full flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg border border-border bg-secondary/20 text-left"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isResolved ? (
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>
                  ) : isCritical ? (
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-foreground text-sm">{titleCase(a.type)}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{fmtAge(a.timestamp)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.message}</p>
                  {isResolved && (
                    <p className="text-xs text-emerald-500 mt-1">Resolved {fmtAge(a.resolvedAt!)}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
