'use client'

import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Card } from '@/components/ui/card'

export function ThresholdsSettings() {
  const [globalLoadWarning, setGlobalLoadWarning] = useState(80)
  const [autoCutoff, setAutoCutoff] = useState(95)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Safety Thresholds</h2>
        <p className="text-sm text-muted-foreground mb-6">Configure global safety triggers for all circuits.</p>

        <Card className="p-6 space-y-8">
          {/* Global Load Warning */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">Global Load Warning</p>
                <p className="text-sm text-muted-foreground">Alert when any circuit exceeds this percentage of its max capacity.</p>
              </div>
              <span className="text-2xl font-bold text-primary">{globalLoadWarning}%</span>
            </div>
            <Slider 
              value={[globalLoadWarning]} 
              onValueChange={(value) => setGlobalLoadWarning(value[0])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Auto-Cutoff Limit */}
          <div className="border-t border-border pt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">Auto-Cutoff Limit</p>
                <p className="text-sm text-muted-foreground">Automatically toggle relay OFF if critical load persists for {'>'} 10s.</p>
              </div>
              <span className="text-2xl font-bold text-destructive">{autoCutoff}%</span>
            </div>
            <Slider 
              value={[autoCutoff]} 
              onValueChange={(value) => setAutoCutoff(value[0])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
