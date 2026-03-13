"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function TestimonialSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Testimonial Quote */}
          <div className="space-y-8">
            <blockquote className="text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed text-foreground">
              &ldquo;EnergyPilot helped us reduce our commercial facility&apos;s energy consumption by{" "}
              <span className="text-primary">23%</span> in just the first month.&rdquo;
            </blockquote>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/placeholder-avatar.jpg" alt="Sarah Jenkins" />
                <AvatarFallback className="bg-secondary text-foreground">SJ</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">Sarah Jenkins</p>
                <p className="text-sm text-muted-foreground">Facility Manager, GreenTech Offices</p>
              </div>
            </div>
          </div>

          {/* Case Study Card */}
          <Card className="bg-card border-border p-6 md:p-8 rounded-xl">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Case Study Result</span>
            <div className="mt-6 space-y-6">
              {/* Before/After Chart */}
              <div className="flex items-end gap-2 sm:gap-4 justify-center h-48">
                <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                  <div className="w-full bg-muted rounded-t h-24" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Before</span>
                </div>
                <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                  <div className="text-xs text-muted-foreground mb-2">-23%</div>
                  <div className="w-full bg-primary rounded-t h-40" />
                  <span className="text-xs sm:text-sm text-foreground">After</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Monthly savings: $1,240.00</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
