'use client'

import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const devices = [
  {
    id: 1,
    name: 'Main Gateway',
    type: 'IoT Gateway',
    model: 'EP-GW-001',
    status: 'Online',
    lastSeen: 'Now',
  },
  {
    id: 2,
    name: 'Kitchen Circuit Monitor',
    type: 'Current Sensor',
    model: 'EP-CM-005',
    status: 'Online',
    lastSeen: '2m ago',
  },
  {
    id: 3,
    name: 'HVAC Controller',
    type: 'Smart Relay',
    model: 'EP-SR-003',
    status: 'Online',
    lastSeen: '1h ago',
  },
]

export function DeviceManagement() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Device Management</h2>
            <p className="text-sm text-muted-foreground">Manage connected IoT devices and sensors.</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>

        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">NAME</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">TYPE</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">MODEL</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">STATUS</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">LAST SEEN</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 text-foreground font-medium">{device.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{device.type}</td>
                    <td className="py-3 px-4 text-muted-foreground">{device.model}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-primary/20 text-primary">{device.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{device.lastSeen}</td>
                    <td className="py-3 px-4">
                      <button className="text-destructive hover:bg-destructive/10 p-2 rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
