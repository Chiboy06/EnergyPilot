'use client'

import { Card } from '@/components/ui/card'

export function EfficiencyScore() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-8">Efficiency Score</h3>

      <div className="space-y-8">
        {/* Grade */}
        <div className="text-center">
          <div className="text-5xl font-bold text-primary mb-2">A+</div>
          <p className="text-sm text-muted-foreground">Vs Neighbors</p>
        </div>

        {/* Optimizer */}
        <div className="border-t border-border pt-8">
          <div className="text-2xl font-bold text-primary mb-2">94%</div>
          <p className="text-sm text-muted-foreground">Optimizer</p>
        </div>
      </div>
    </Card>
  )
}
