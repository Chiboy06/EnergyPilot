"use client"

import { Card } from "@/components/ui/card"

export function ComparisonSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Before EnergyPilot */}
          <div className="space-y-6 px-4">
            <span className="text-sm text-muted-foreground">Before EnergyPilot</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              Energy waste hides in{" "}
              <span className="text-destructive line-through decoration-destructive/50">plain sight</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Without per-circuit data, you only see the total on your bill — not which circuit used it.
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
          <Card className="bg-card border-border p-6 md:p-8 rounded-lg md:rounded-none">
            <span className="text-sm text-primary">With EnergyPilot</span>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 mb-6">
              Total clarity in one dashboard
            </h3>
            {/* CONTENT NEEDED (team): a real, verified total once there is one to show. */}
            <p className="text-base text-muted-foreground">
              Current on every circuit, updated about every 5 seconds, with daily energy totals and in-app alerts.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
