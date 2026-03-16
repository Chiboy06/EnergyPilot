'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { User, Mail, Globe, Shield, Moon, Eye, Zap, DollarSign } from 'lucide-react'

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="text-sm text-slate-400 mt-0.5">{description}</p>
    </div>
  )
}

function SettingRow({ icon: Icon, label, description, children }: {
  icon: React.ElementType; label: string; description: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-800/60 last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
        <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-slate-500 truncate">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}

export function AccountSettings() {
  const { user } = useUser()
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'
  const email = user?.primaryEmailAddress?.emailAddress || ''

  return (
    <div className="space-y-6">
      <SectionHeader title="Account Settings" description="Manage your personal information and preferences." />

      {/* Profile card */}
      <Card>
        <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-800/60">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{fullName}</p>
            <p className="text-sm text-slate-400">{email}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Shield className="h-3 w-3" /> Administrator
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input defaultValue={fullName} className="pl-9 bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input type="email" defaultValue={email} className="pl-9 bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Time Zone</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
              <Select defaultValue="utc+01">
                <SelectTrigger className="pl-9 bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="utc+01">(UTC+01:00) West Africa Time</SelectItem>
                  <SelectItem value="utc+00">(UTC+00:00) Greenwich Mean Time</SelectItem>
                  <SelectItem value="utc-05">(UTC-05:00) Eastern Time</SelectItem>
                  <SelectItem value="utc-08">(UTC-08:00) Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Role</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input value="Administrator" disabled className="pl-9 bg-slate-800/40 border-slate-700/50 text-slate-400 cursor-not-allowed" />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-6">
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Display preferences */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-1">Display Preferences</h3>
        <p className="text-xs text-slate-500 mb-4">Customize how data is presented in your dashboard.</p>

        <SettingRow icon={Moon} label="Dark Mode" description="Use dark theme for low-light environments (Recommended)">
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow icon={Eye} label="High Contrast Charts" description="Increase visual distinction for color-blind accessibility">
          <Switch />
        </SettingRow>
      </Card>

      {/* Units */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-1">Units & Currency</h3>
        <p className="text-xs text-slate-500 mb-4">Set your preferred measurement units.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Energy Unit</label>
            <div className="relative">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
              <Select defaultValue="watts">
                <SelectTrigger className="pl-9 bg-slate-800/60 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="watts">Watts (W)</SelectItem>
                  <SelectItem value="kilowatts">Kilowatts (kW)</SelectItem>
                  <SelectItem value="megawatts">Megawatts (MW)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Currency</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
              <Select defaultValue="ngn">
                <SelectTrigger className="pl-9 bg-slate-800/60 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="ngn">NGN (₦)</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="gbp">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
