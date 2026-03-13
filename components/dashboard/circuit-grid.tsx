'use client'

import { useState } from 'react'
import { AlertTriangle, Home, Lightbulb, Wind, Zap, Plug, Bed, Power, Wifi, Droplet } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

interface CircuitData {
  id: string
  name: string
  location: string
  power: number
  powerUnit: string
  status: 'NORMAL' | 'ACTIVE' | 'LOW' | 'HIGH LOAD' | 'OFFLINE' | 'STEADY' | 'ANOMALY'
  load: number
  statusLabel: string
  trend?: string
  trendValue?: string
  trendType?: 'up' | 'down' | 'stable'
  icon: React.ReactNode
  anomaly?: boolean
  anomalyLabel?: string
  predictedPower?: number
  enabled?: boolean
}

const circuitsData: CircuitData[] = [
  {
    id: 'kitchen',
    name: 'Kitchen',
    location: 'Ground Floor',
    power: 2450,
    powerUnit: 'W',
    status: 'HIGH LOAD',
    load: 82,
    statusLabel: 'HIGH LOAD',
    trend: '↑ 15% vs avg',
    trendType: 'up',
    icon: <Zap className="h-5 w-5" />,
    predictedPower: 2300,
    enabled: true,
  },
  {
    id: 'living-room',
    name: 'Living Room',
    location: 'Ground Floor',
    power: 180,
    powerUnit: 'W',
    status: 'NORMAL',
    load: 12,
    statusLabel: 'Stable',
    icon: <Home className="h-5 w-5" />,
    predictedPower: 175,
    enabled: true,
  },
  {
    id: 'hvac',
    name: 'HVAC System',
    location: 'Utility',
    power: 3200,
    powerUnit: 'W',
    status: 'ACTIVE',
    load: 65,
    statusLabel: 'Cycling On',
    trend: '↑ Cycling On',
    trendType: 'up',
    icon: <Wind className="h-5 w-5" />,
    predictedPower: 3250,
    enabled: true,
  },
  {
    id: 'ev-charger',
    name: 'EV Charger',
    location: 'Garage',
    power: 0,
    powerUnit: 'W',
    status: 'OFFLINE',
    load: 0,
    statusLabel: 'Inactive',
    icon: <Plug className="h-5 w-5" />,
    enabled: false,
  },
  {
    id: 'server-rack',
    name: 'Server Rack',
    location: 'Office',
    power: 450,
    powerUnit: 'W',
    status: 'STEADY',
    load: 45,
    statusLabel: 'Constant',
    icon: <Wifi className="h-5 w-5" />,
    predictedPower: 450,
    enabled: true,
  },
  {
    id: 'master-bed',
    name: 'Master Bed',
    location: 'Upstairs',
    power: 65,
    powerUnit: 'W',
    status: 'LOW',
    load: 5,
    statusLabel: 'Dropping',
    trend: '↓ Dropping',
    trendType: 'down',
    icon: <Bed className="h-5 w-5" />,
    predictedPower: 60,
    enabled: true,
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    location: 'Garden',
    power: 1200,
    powerUnit: 'W',
    status: 'ANOMALY',
    load: 92,
    statusLabel: 'Unexpected Spike',
    anomaly: true,
    anomalyLabel: 'Unexpected Spike',
    icon: <Lightbulb className="h-5 w-5" />,
    enabled: true,
  },
  {
    id: 'guest-bed',
    name: 'Guest Bed',
    location: 'Upstairs',
    power: 0,
    powerUnit: 'W',
    status: 'OFFLINE',
    load: 0,
    statusLabel: 'Inactive',
    icon: <Bed className="h-5 w-5" />,
    enabled: false,
  },
  {
    id: 'home-office',
    name: 'Home Office',
    location: 'Ground Floor',
    power: 125,
    powerUnit: 'W',
    status: 'NORMAL',
    load: 25,
    statusLabel: 'Stable',
    icon: <Power className="h-5 w-5" />,
    predictedPower: 120,
    enabled: true,
  },
  {
    id: 'lights-down',
    name: 'Lights Down',
    location: 'Ground Floor',
    power: 320,
    powerUnit: 'W',
    status: 'ACTIVE',
    load: 40,
    statusLabel: 'Evening Ramp',
    trend: '↑ Evening Ramp',
    trendType: 'up',
    icon: <Lightbulb className="h-5 w-5" />,
    predictedPower: 350,
    enabled: true,
  },
]

interface CircuitGridProps {
  filter: 'all' | 'active' | 'issues'
}

export function CircuitGrid({ filter }: CircuitGridProps) {
  const [toggledCircuits, setToggledCircuits] = useState<Record<string, boolean>>(
    circuitsData.reduce((acc, circuit) => {
      acc[circuit.id] = circuit.enabled ?? true
      return acc
    }, {} as Record<string, boolean>)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return 'bg-primary/20 text-primary'
      case 'ACTIVE':
        return 'bg-primary/20 text-primary'
      case 'HIGH LOAD':
        return 'bg-warning/20 text-warning'
      case 'OFFLINE':
        return 'bg-muted/20 text-muted-foreground'
      case 'STEADY':
        return 'bg-primary/20 text-primary'
      case 'LOW':
        return 'bg-muted/20 text-muted-foreground'
      case 'ANOMALY':
        return 'bg-destructive/20 text-destructive'
      default:
        return 'bg-secondary/20 text-secondary-foreground'
    }
  }

  const filteredCircuits = circuitsData.filter((circuit) => {
    if (filter === 'active') {
      return toggledCircuits[circuit.id] && circuit.status !== 'OFFLINE'
    }
    if (filter === 'issues') {
      return circuit.anomaly
    }
    return true
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCircuits.map((circuit) => (
        <div
          key={circuit.id}
          className={`relative p-6 rounded-lg border transition-all ${
            circuit.anomaly
              ? 'bg-destructive/5 border-destructive/50'
              : 'bg-card border-border hover:border-primary/30'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary text-primary">
                {circuit.icon}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{circuit.name}</h3>
                <p className="text-xs text-muted-foreground">{circuit.location}</p>
              </div>
            </div>
            {circuit.anomaly && (
              <div className="text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
          </div>

          {/* Power Display */}
          <div className="mb-4">
            <div className="text-3xl font-bold text-foreground mb-1">
              {circuit.power.toLocaleString()}
              <span className="text-xs text-muted-foreground ml-1">{circuit.powerUnit}</span>
            </div>
            {circuit.anomaly ? (
              <p className="text-xs text-destructive font-medium">⚠ {circuit.anomalyLabel}</p>
            ) : circuit.trend ? (
              <p className={`text-xs font-medium ${
                circuit.trendType === 'up' ? 'text-warning' : circuit.trendType === 'down' ? 'text-muted-foreground' : 'text-primary'
              }`}>
                {circuit.trend}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">– {circuit.statusLabel}</p>
            )}
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <Badge className={`${getStatusColor(circuit.status)}`}>
              {circuit.status}
            </Badge>
          </div>

          {/* Load Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">Load</span>
              <span className="text-xs font-medium text-foreground">{circuit.load}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  circuit.load > 80 ? 'bg-warning' : 'bg-primary'
                }`}
                style={{ width: `${circuit.load}%` }}
              />
            </div>
          </div>

          {/* Predicted Power & Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {circuit.predictedPower ? (
              <div className="text-xs">
                <span className="text-muted-foreground">Pred: </span>
                <span className="text-primary font-medium">{circuit.predictedPower} W</span>
              </div>
            ) : (
              <div />
            )}
            <Switch
              checked={toggledCircuits[circuit.id]}
              onCheckedChange={(checked) => {
                setToggledCircuits(prev => ({
                  ...prev,
                  [circuit.id]: checked
                }))
              }}
              aria-label={`Toggle ${circuit.name}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
