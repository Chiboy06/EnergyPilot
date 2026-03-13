"use client"

import Link from "next/link"
import { ArrowRight, Play, Zap, Activity, Building2, House, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Fragment } from "react/jsx-runtime"

export function HeroSection() {
  const icons = [
    {
      id: 1,
      icon: Building2
    },
    // {
    //   icon: Building2
    // },
    {
      id: 2,
      icon: House
    },
    {
      id: 3,
      icon: Server
    }
  ]
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-3xl lg:text-3xl xl:text-5xl font-bold leading-tight text-balance">
              Intelligent Energy Monitoring for{" "}
              <span className="text-primary">Smarter Spaces</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Real-time insights, ML-powered predictions, and intelligent control for residential and commercial IoT systems. Track 10+ circuits from anywhere.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-primary text-foreground hover:bg-primary/90">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary">
                <Play className="mr-2 h-4 w-4" />
                View Live Demo
              </Button>
            </div>
            <div className="pt-4">
              <p className="text-xs text-muted-foreground mb-3">TRUSTED BY 10,000+ INSTALLATIONS</p>
              <div className="flex gap-6 items-center opacity-50">
                {icons.map((i) => (
                  <Fragment key={i.id}>
                    <div className="h-6 w-6 bg-muted-foreground/20 rounded">
                      <i.icon className="h-6 w-6" />
                    </div>
                  </Fragment>
                  
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            <Card className="bg-card skew-4 border-border p-6 rounded-xl shadow-2xl">
              <div className="space-y-4">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dashboard</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary">Live</span>
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-secondary/50 border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Total Power</span>
                    </div>
                    <p className="text-2xl font-mono font-semibold text-foreground">2,847 W</p>
                    <p className="text-xs text-muted-foreground">****</p>
                  </Card>
                  <Card className="bg-secondary/50 border-border p-4">
                    <span className="text-xs text-muted-foreground">Active Circuits</span>
                    <p className="text-2xl font-mono font-semibold text-foreground mt-2">10 <span className="text-sm text-muted-foreground">/10</span></p>
                  </Card>
                </div>

                {/* Chart Preview */}
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">REAL-TIME CONSUMPTION</span>
                  <div className="h-32 relative">
                    <svg viewBox="0 0 400 100" className="w-full h-full">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,80 Q50,75 100,70 T200,50 T300,40 T400,30"
                        fill="none"
                        stroke="rgb(16, 185, 129)"
                        strokeWidth="2"
                      />
                      <path
                        d="M0,80 Q50,75 100,70 T200,50 T300,40 T400,30 L400,100 L0,100 Z"
                        fill="url(#chartGradient)"
                      />
                    </svg>
                  </div>
                </div>

                {/* Circuit Status */}
                <div className="grid grid-cols-3 gap-2">
                  {["Kitchen", "HVAC", "Office"].map((room) => (
                    <Card key={room} className="bg-secondary/30 border-border p-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-primary" />
                        <span className="text-xs text-foreground">{room}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 h-24 w-24 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
