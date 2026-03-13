"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Power, 
  ChefHat, 
  Sofa, 
  Fan, 
  Server, 
  Car, 
  Monitor, 
  Bed,
  Waves
} from "lucide-react"
import Link from "next/link"

const circuits = [
  {
    name: "Kitchen",
    icon: ChefHat,
    power: 845,
    status: "High Load",
    statusColor: "text-warning",
    percentage: 65,
    progressColor: "bg-warning",
  },
  {
    name: "Living Room",
    icon: Sofa,
    power: 120,
    status: "Normal",
    statusColor: "text-muted-foreground",
    percentage: 15,
    progressColor: "bg-primary",
  },
  {
    name: "HVAC",
    icon: Fan,
    power: 1250,
    status: "High Load",
    statusColor: "text-warning",
    percentage: 82,
    progressColor: "bg-warning",
  },
  {
    name: "Server Room",
    icon: Server,
    power: 450,
    status: "Steady",
    statusColor: "text-muted-foreground",
    percentage: 40,
    progressColor: "bg-warning",
  },
  {
    name: "Garage",
    icon: Car,
    power: 0,
    status: "Inactive",
    statusColor: "text-muted-foreground",
    percentage: 0,
    progressColor: "bg-muted",
  },
  {
    name: "Office",
    icon: Monitor,
    power: 210,
    status: "Normal",
    statusColor: "text-muted-foreground",
    percentage: 25,
    progressColor: "bg-primary",
  },
  {
    name: "Bedroom",
    icon: Bed,
    power: 60,
    status: "Low",
    statusColor: "text-muted-foreground",
    percentage: 8,
    progressColor: "bg-primary",
  },
  {
    name: "Pool Pump",
    icon: Waves,
    power: 1100,
    status: "Pump On",
    statusColor: "text-muted-foreground",
    percentage: 75,
    progressColor: "bg-warning",
  },
]

export function CircuitMonitor() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Circuit Monitor</h2>
        <Link href="/dashboard/circuits" className="text-sm text-primary hover:underline">
          View All
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {circuits.map((circuit) => (
          <Card key={circuit.name} className="bg-card border-border p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-secondary rounded-lg">
                <circuit.icon className="h-5 w-5 text-foreground" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:bg-primary/10"
              >
                <Power className="h-4 w-4" />
              </Button>
            </div>

            {/* Info */}
            <div className="mb-4">
              <h3 className="font-medium text-foreground">{circuit.name}</h3>
              <p className="text-2xl font-mono font-semibold text-foreground">
                {circuit.power.toLocaleString()} <span className="text-sm text-muted-foreground">W</span>
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${circuit.progressColor} rounded-full transition-all`}
                  style={{ width: `${circuit.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={circuit.statusColor}>{circuit.status}</span>
                <span className="text-muted-foreground">{circuit.percentage}%</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
