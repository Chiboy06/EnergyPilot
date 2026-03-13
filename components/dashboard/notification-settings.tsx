'use client'

import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'

export function NotificationSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Notification Settings</h2>
        <p className="text-sm text-muted-foreground mb-6">Control how and when you receive alerts.</p>

        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between py-4 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Email Alerts</p>
              <p className="text-sm text-muted-foreground">Receive email notifications for anomalies and high usage.</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between py-4 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Critical Alerts</p>
              <p className="text-sm text-muted-foreground">Immediate notification for safety-critical events.</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between py-4 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Weekly Reports</p>
              <p className="text-sm text-muted-foreground">Get a weekly summary of energy consumption.</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Marketing Updates</p>
              <p className="text-sm text-muted-foreground">New features and optimization tips.</p>
            </div>
            <Switch />
          </div>
        </Card>
      </div>
    </div>
  )
}
