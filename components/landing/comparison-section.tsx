"use client"

import { Card } from "@/components/ui/card"

export function ComparisonSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 border rounded-2xl gap-12 items-center">
          {/* Before EnergyPilot */}
          <div className="space-y-6 px-4">
            <span className="text-sm text-muted-foreground">Before EnergyPilot</span>
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
              Energy waste hides in{" "}
              <span className="text-destructive line-through decoration-destructive/50">plain sight</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Manual meter reading and surprise utility bills are costing you thousands.
            </p>
            <div className="space-y-2">
              {[75, 60, 85, 40, 90].map((width, i) => (
                <div
                  key={i}
                  className="h-3 bg-muted rounded"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          </div>

          {/* With EnergyPilot */}
          <Card className="bg-card border-border p-8 rounded-none">
            <span className="text-sm text-primary">With EnergyPilot</span>
            <h3 className="text-2xl lg:text-3xl font-bold mt-2 mb-6">
              Total clarity in one dashboard
            </h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl lg:text-6xl font-mono font-bold text-foreground">2,482,901</span>
              <span className="text-muted-foreground">kWh</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitored in real-time today. Every watt accounted for.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
