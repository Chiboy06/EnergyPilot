"use client"

import { Activity, Brain, Zap, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"

const features = [
  {
    icon: Activity,
    title: "Real-Time Monitoring",
    description: "Track every circuit on your hub, updated about every 5 seconds. See consumption spikes as they happen, not at the end of the month.",
    link: "Updates about every 5 s",
    color: "text-primary",
  },
  {
    icon: Brain,
    title: "24-Hour Estimates",
    description: "A daily estimate of the next 24 hours, based on your average use at each hour over the last 7 days. Alerts flag voltage and load problems.",
    link: "How it works",
    color: "text-chart-2",
  },
  {
    icon: Zap,
    title: "Intelligent Control",
    description: "Switch individual circuits remotely from the dashboard or phone app. Automation rules are not available yet.",
    link: "How it works",
    color: "text-primary",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Built for precision control</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage complex energy systems.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="bg-card border-border p-8 rounded-xl hover:border-primary/50 transition-colors"
            >
              <div className={`flex w-fit p-3 rounded-lg bg-secondary mb-6 ${feature.color}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed">{feature.description}</p>
              <Link
                href="#"
                className={`inline-flex items-center text-sm ${feature.color} hover:underline`}
              >
                {feature.link}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
