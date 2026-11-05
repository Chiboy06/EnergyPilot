"use client"

import { Card } from "@/components/ui/card"

// CONTENT NEEDED (team): a real, permissioned customer quote and a measured result.
// Until then this section states plainly that no case study is published.
export function TestimonialSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <Card className="bg-card border-border p-8 rounded-xl max-w-3xl mx-auto text-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Customer results</span>
          <p className="mt-4 text-xl sm:text-2xl font-medium text-foreground">Case studies coming soon.</p>
          <p className="mt-2 text-base text-muted-foreground">
            We&apos;ll publish measured results from real installations once customers have agreed to share them.
          </p>
        </Card>
      </div>
    </section>
  )
}
