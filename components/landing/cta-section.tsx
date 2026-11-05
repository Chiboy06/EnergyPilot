"use client"

import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-24 bg-linear-to-b from-[#1A1D24] from-1% via-[#27c79242] via-98% to-[#1A1D24]">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Start monitoring in minutes</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-8">Create an account, then register your hub with its serial number.</p>

          <Link href="/sign-up" className="inline-block">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap h-11">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

        </div>
      </div>
    </section>
  )
}
