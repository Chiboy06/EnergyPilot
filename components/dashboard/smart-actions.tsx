'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, ZapOff, CheckCircle2, Loader2 } from 'lucide-react'
import { useHubData } from '@/hooks/use-hub-data'
import { circuitLoad, HIGH_LOAD_PCT } from '@/lib/circuit-status'

// Circuits at HIGH LOAD against their configured rating, with a manual relay switch.
export function SmartActions() {
  const { circuitStates, relayStateMap, sendCommand, activeHub, isLoading, userRole } = useHubData()
  const [error, setError] = useState<string | null>(null)
  const hubId = activeHub?._id
  const canControl = userRole !== 'viewer'

  const highLoad = circuitStates
    .map((c) => ({ ...c, ...circuitLoad(c) }))
    .filter((c) => c.status === 'HIGH LOAD')
  const unrated = circuitStates.filter((c) => !c.maxAmps).length

  const toggle = async (relayNum: number, state: boolean) => {
    if (!hubId) return
    setError(null)
    try {
      await sendCommand({ hubId, relayNum, state })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Relay command failed')
    }
  }

  return (
    <Card className="bg-card border-border p-4 md:p-6 rounded-lg">
      <h3 className="text-xl lg:text-2xl font-semibold text-foreground">High-Load Circuits</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Circuits drawing {HIGH_LOAD_PCT}%+ of their configured rating right now. Switching is manual — nothing is cut automatically.
      </p>
      {error && <p role="alert" className="text-sm text-red-400 mb-3">{error}</p>}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
        </div>
      ) : !hubId ? (
        <p className="text-base text-muted-foreground py-4">Connect a hub to see circuit controls.</p>
      ) : highLoad.length === 0 ? (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-medium text-foreground text-base">No circuit at high load</p>
            <p className="text-sm text-muted-foreground mt-1">
              {unrated > 0
                ? `${unrated} circuit(s) have no configured rating, so their load can't be checked.`
                : 'All rated circuits are below the high-load level.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {highLoad.slice(0, 3).map((circuit, i) => {
            const relay = relayStateMap[circuit.channelIndex]
            const turnOn = relay === false
            return (
              <div key={circuit._id} className="space-y-3">
                <div className="flex items-start gap-2">
                  <Zap className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-base">CH{circuit.channelIndex + 1} · {circuit.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {circuit.currentAmps.toFixed(1)} A of {circuit.maxAmps} A rating ({circuit.pct}%) · ~{Math.round(circuit.powerW).toLocaleString()} W
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => toggle(circuit.channelIndex, turnOn)}
                  disabled={!canControl}
                  variant={turnOn ? 'default' : 'outline'}
                  className="w-full rounded-lg h-10 gap-2"
                  aria-label={`${turnOn ? 'Turn on' : 'Turn off'} CH${circuit.channelIndex + 1} ${circuit.name}`}
                >
                  {turnOn ? <><Zap className="h-4 w-4" /> Turn on</> : <><ZapOff className="h-4 w-4" /> Turn off</>}
                </Button>
                {i < Math.min(highLoad.length, 3) - 1 && <div className="border-t border-border" />}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
