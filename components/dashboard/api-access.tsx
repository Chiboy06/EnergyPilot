'use client'

import { useState } from 'react'
import { Copy, Eye, EyeOff, RefreshCw, ShieldCheck, Clock, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}

const DEMO_KEY = 'ep_live_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'

export function APIAccess() {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(DEMO_KEY)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Developer Access</h2>
        <p className="text-sm text-slate-400 mt-0.5">Manage API keys for external integrations.</p>
      </div>

      {/* Active key */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Active API Key</h3>
            <p className="text-xs text-slate-500 mt-0.5">Use this key to authenticate API requests.</p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3 w-3 mr-1" /> Active
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type={visible ? 'text' : 'password'}
              value={DEMO_KEY}
              readOnly
              className="pr-10 bg-slate-800/60 border-slate-700 text-white font-mono text-sm focus:border-emerald-500"
            />
            <button
              onClick={() => setVisible((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 shrink-0"
          >
            <Copy className="h-4 w-4 mr-1.5" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {[
            { icon: Clock, label: 'Last used', value: 'Today at 14:02' },
            { icon: Globe, label: 'From IP', value: '192.168.1.4' },
            { icon: ShieldCheck, label: 'Permissions', value: 'Read & Write' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <Icon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xs font-medium text-slate-300">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-800/60">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Key
          </Button>
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            Revoke
          </Button>
        </div>
      </Card>

      {/* Docs callout */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
        <Globe className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-slate-300">API Documentation</p>
          <p className="text-xs text-slate-500 mt-0.5">
            View the full REST API reference at{' '}
            <span className="text-emerald-400 cursor-pointer hover:underline">docs.energypilot.io/api</span>
          </p>
        </div>
      </div>
    </div>
  )
}
