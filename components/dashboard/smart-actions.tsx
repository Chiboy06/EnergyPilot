'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, ZapOff, CheckCircle2, Loader2 } from 'lucide-react'
import { useHubData } from '@/hooks/use-hub-data'

const VOLTAGE = 220
const POWER_FACTOR = 0.9

export function SmartActions() {
  const { circuitStates, relayStateMap, sendCommand, activeHub, breakerCapacity, isLoading } = useHubData()
  const hubId = activeHub?._id

  // Compute load % and filter to high-load circuits (> 70%)
  const withLoad = circuitStates.map(c => {
    const maxW = (c.maxAmps ?? breakerCapacity) * VOLTAGE * POWER_FACTOR
    const loadPct = maxW > 0 ? Math.min(100, (c.powerW / maxW) * 100) : 0
    return { ...c, loadPct }
  })
  const highLoadCircuits = withLoad.filter(c => c.loadPct > 70)

  return (
    <Card className="bg-card border-border p-4 md:p-6 rounded-lg">
      <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 md:mb-6">Smart Actions</h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
        </div>
      ) : !hubId ? (
        <p className="text-sm text-muted-foreground py-4">Connect a hub to see circuit controls.</p>
      ) : highLoadCircuits.length === 0 ? (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground text-sm">All circuits nominal</p>
            <p className="text-xs text-muted-foreground mt-1">
              No circuits are running above 70% capacity.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {highLoadCircuits.slice(0, 3).map((circuit) => {
            const relayOn = relayStateMap[circuit.channelIndex] !== false
            return (
              <div key={circuit._id} className="space-y-3">
                <div className="flex items-start gap-2">
                  <Zap className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm md:text-base">{circuit.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(circuit.powerW).toLocaleString()}W · {Math.round(circuit.loadPct)}% of capacity
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => hubId && sendCommand({
                    hubId,
                    relayNum: circuit.channelIndex,
                    state: !relayOn,
                  })}
                  variant={relayOn ? 'outline' : 'default'}
                  className="w-full rounded-lg h-10 gap-2"
                >
                  {relayOn ? (
                    <><ZapOff className="h-4 w-4" /> Cut Power</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Restore Power</>
                  )}
                </Button>
                {highLoadCircuits.indexOf(circuit) < highLoadCircuits.length - 1 && (
                  <div className="border-t border-border" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
