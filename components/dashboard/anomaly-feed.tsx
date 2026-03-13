"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Zap, Clock } from "lucide-react"

const anomalies = [
  {
    type: "warning",
    icon: AlertTriangle,
    title: "Unusual Spike",
    description: "Kitchen circuit exceeded historical norm by 45%.",
    location: "Kitchen",
    time: "14:02",
    iconColor: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-l-warning",
  },
  {
    type: "error",
    icon: Zap,
    title: "Voltage Drop",
    description: "Severe voltage irregularity detected in HVAC unit.",
    location: "HVAC",
    time: "09:45",
    iconColor: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-l-destructive",
  },
  {
    type: "info",
    icon: Clock,
    title: "Pattern Learned",
    description: "New usage pattern identified for weekday mornings.",
    location: "System",
    time: "Yesterday",
    iconColor: "text-muted-foreground",
    bgColor: "bg-secondary",
    borderColor: "border-l-muted-foreground",
  },
]

export function AnomalyFeed() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">Anomaly Feed</h2>
          <span className="h-2 w-2 rounded-full bg-primary" />
        </div>
      </div>

      <Card className="bg-card border-border p-4">
        <p className="text-sm text-muted-foreground mb-4">Recent AI Detections</p>

        {/* Anomaly List */}
        <div className="space-y-3">
          {anomalies.map((anomaly, index) => (
            <div
              key={index}
              className={`${anomaly.bgColor} ${anomaly.borderColor} border-l-2 rounded-r-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <anomaly.icon className={`h-4 w-4 ${anomaly.iconColor} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${anomaly.iconColor}`}>{anomaly.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {anomaly.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{anomaly.location}</span>
                    <span className="text-xs text-muted-foreground">{anomaly.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <Button
          variant="outline"
          className="w-full mt-4 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          View All Logs
        </Button>
      </Card>
    </div>
  )
}
