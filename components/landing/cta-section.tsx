"use client"

import { ArrowRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-24 bg-linear-to-b from-[#1A1D24] from-1% via-[#27c79242] via-98% to-[#1A1D24]">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Start monitoring in minutes</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-8">Free 14-day trial. No credit card required.</p>

          <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-11"
            />
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap h-11">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </form>

          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>2,547 users joined this week</span>
          </div>
        </div>
      </div>
    </section>
  )
}
