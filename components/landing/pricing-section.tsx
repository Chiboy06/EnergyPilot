"use client"

import { Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    description: "Perfect for home hobbyists.",
    price: "$0",
    period: "/mo",
    features: ["1 Location", "5 Circuits", "24h Data Retention"],
    cta: "Get Started",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    description: "For serious monitoring needs.",
    price: "$29",
    period: "/mo",
    features: ["Unlimited Circuits", "ML Predictions", "30-day Retention", "Anomaly Alerts"],
    cta: "Start Free Trial",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For commercial facilities.",
    price: "Custom",
    period: "",
    features: ["Multi-site Management", "API Access", "SLA & SLA", "Dedicated Support"],
    cta: "Contact Sales",
    variant: "outline" as const,
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground">Start for free, scale as you grow.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`bg-card border-border p-8 rounded-xl relative ${
                plan.popular ? "border-primary ring-1 ring-primary bg-linear-to-b from-[#1ce7a30d] from-90% to-[#1a1c22]" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary text-white hover:bg-primary/90 shadow-[#1A1D24] shadow-xl"
                      : "border-border hover:bg-secondary"
                  }`}
                  variant={plan.variant}
                >
                  {plan.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
