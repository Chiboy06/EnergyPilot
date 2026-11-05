"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const demoData = {
  monitoring: {
    title: "Live Monitoring",
    description: "Real-time monitoring of multiple energy sources",
  },
  predictions: {
    title: "24-Hour Estimate",
    description: "Hourly estimate from your last 7 days of use",
  },
  control: {
    title: "Intelligent Control",
    description: "Switch circuits remotely",
  },
}

export function DemoSection() {
  const [activeTab, setActiveTab] = useState("monitoring")

  return (
    <section id="how-it-works" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">See it in action</h2>
          <p className="text-sm text-muted-foreground">Illustrative mock-up — the numbers below are not real customer data.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-secondary border border-border">
              <TabsTrigger value="monitoring" className="data-[state=active]:bg-card">
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="predictions" className="data-[state=active]:bg-card">
                Predictions
              </TabsTrigger>
              <TabsTrigger value="control" className="data-[state=active]:bg-card">
                Control
              </TabsTrigger>
            </TabsList>
          </div>

          {Object.entries(demoData).map(([key, data]) => (
            <TabsContent key={key} value={key}>
              <Card className="bg-card border-border rounded-xl overflow-hidden">
                <div className="grid lg:grid-cols-2">
                  {/* Left Panel - Chart Preview */}
                  <div className="p-6 md:p-8 lg:border-r border-border">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{data.title}</span>
                        <span className="text-xs text-muted-foreground">EXAMPLE</span>
                      </div>
                      <div className="h-64 relative bg-secondary/30 rounded-lg p-4">
                        <svg viewBox="0 0 400 200" className="w-full h-full">
                          <defs>
                            <linearGradient id={`gradient-${key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {/* Grid lines */}
                          {[40, 80, 120, 160].map((y) => (
                            <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#30363d" strokeWidth="1" />
                          ))}
                          {/* Chart line */}
                          <path
                            d="M0,160 Q40,150 80,140 T160,120 T240,100 T320,80 T400,60"
                            fill="none"
                            stroke="rgb(16, 185, 129)"
                            strokeWidth="2"
                          />
                          <path
                            d="M0,160 Q40,150 80,140 T160,120 T240,100 T320,80 T400,60 L400,200 L0,200 Z"
                            fill={`url(#gradient-${key})`}
                          />
                          {/* Prediction line (dashed) */}
                          <path
                            d="M320,80 Q360,70 400,55"
                            fill="none"
                            stroke="rgb(59, 130, 246)"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total load</span>
                          <span className="text-xs text-primary">-0.000...</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Data Table */}
                  <div className="p-6 md:p-8 border-t lg:border-t-0 border-border">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-medium text-foreground">Energy Distribution</span>
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      {[
                        { name: "CH1 · Kitchen", usage: "4.1 A", value: "780 W", status: "" },
                        { name: "CH2 · Air conditioner", usage: "7.9 A", value: "1,510 W", status: "" },
                        { name: "CH3 · Lighting", usage: "0.6 A", value: "115 W", status: "" },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-foreground">{row.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">{row.usage}</span>
                            <span className="text-sm font-mono text-foreground">{row.value}</span>
                            {row.status && (
                              <span className="text-xs text-primary">{row.status}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
