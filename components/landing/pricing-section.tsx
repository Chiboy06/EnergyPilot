"use client"

import { Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// CONTENT NEEDED (team): real plans, prices and limits. Nothing is billed today,
// so no prices, trials or plan limits are shown.
const plans = [
  {
    name: "Early access",
    description: "Everything the app does today.",
    price: "Pricing to be announced",
    period: "",
    features: ["Live per-circuit current and estimated power", "Remote relay switching", "Daily energy history", "Voltage and load alerts (in-app)", "AI assistant with your own Gemini key"],
    cta: "Create an account",
    variant: "default" as const,
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Pricing</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Plans and prices haven&apos;t been announced yet.</p>
        </div>

        <div className="grid gap-8 max-w-md mx-auto">
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
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
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
              <Link href="/sign-up">
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
