'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'

export function AccountSettings() {
  return (
    <div className="space-y-8">
      {/* Account Settings */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Account Settings</h2>
        <p className="text-sm text-muted-foreground mb-6">Manage your personal information and preferences.</p>

        <Card className="p-6 space-y-6">
          {/* Full Name & Email */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
              <Input 
                value="Admin User" 
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <Input 
                type="email"
                value="admin@residence404.iot" 
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>

          {/* Time Zone & Role */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Time Zone</label>
              <Select defaultValue="utc-08">
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc-08">(UTC-08:00) Pacific Time</SelectItem>
                  <SelectItem value="utc-07">(UTC-07:00) Mountain Time</SelectItem>
                  <SelectItem value="utc-06">(UTC-06:00) Central Time</SelectItem>
                  <SelectItem value="utc-05">(UTC-05:00) Eastern Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Role</label>
              <Input 
                value="Administrator" 
                disabled
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Display Preferences */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Display Preferences</h2>
        <p className="text-sm text-muted-foreground mb-6">Customize how data is presented in your dashboard.</p>

        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between py-4 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Use dark theme for low-light environments (Recommended).</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">High Contrast Charts</p>
              <p className="text-sm text-muted-foreground">Increase visual distinction for color-blind accessibility.</p>
            </div>
            <Switch />
          </div>
        </Card>

        {/* Energy Unit & Currency */}
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Energy Unit</label>
              <Select defaultValue="watts">
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="watts">Watts (W)</SelectItem>
                  <SelectItem value="kilowatts">Kilowatts (kW)</SelectItem>
                  <SelectItem value="megawatts">Megawatts (MW)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
              <Select defaultValue="usd">
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="gbp">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
