'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Slider } from '@/components/ui/slider'
import { AlertTriangle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6">
      {children}
    </div>
  )
}

function ThresholdSlider({
  icon: Icon,
  label,
  description,
  value,
  onChange,
  onCommit,
  color,
}: {
  icon: React.ElementType
  label: string
  description: string
  value: number
  onChange: (v: number) => void
  onCommit: (v: number) => void
  color: 'emerald' | 'red'
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
            color === 'emerald' ? 'bg-emerald-500/10' : 'bg-red-500/10'
          )}>
            <Icon className={cn('h-4 w-4', color === 'emerald' ? 'text-emerald-400' : 'text-red-400')} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className={cn(
          'text-2xl font-bold tabular-nums shrink-0',
          color === 'emerald' ? 'text-emerald-400' : 'text-red-400'
        )}>
          {value}%
        </div>
      </div>

      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          onValueCommit={(v) => onCommit(v[0])}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-slate-600">0%</span>
          <span className="text-xs text-slate-600">50%</span>
          <span className="text-xs text-slate-600">100%</span>
        </div>
      </div>

      <div className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
        value >= 90
          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
          : value >= 70
          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      )}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {value >= 90 ? 'Critical zone' : value >= 70 ? 'Warning zone' : 'Safe zone'}
      </div>
    </div>
  )
}

export function ThresholdsSettings() {
  const prefs = useQuery(api.preferences.get)
  const update = useMutation(api.preferences.update)

  const [loadWarning, setLoadWarning] = useState(80)
  const [autoCutoff, setAutoCutoff] = useState(95)

  // Sync local state once prefs load
  useEffect(() => {
    if (prefs) {
      setLoadWarning(prefs.loadWarningPct ?? 80)
      setAutoCutoff(prefs.autoCutoffPct ?? 95)
    }
  }, [prefs?.loadWarningPct, prefs?.autoCutoffPct])

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Safety Thresholds</h2>
        <p className="text-sm text-slate-400 mt-0.5">Configure global safety triggers for all circuits.</p>
      </div>

      <Card>
        <div className="space-y-8">
          <ThresholdSlider
            icon={AlertTriangle}
            label="Global Load Warning"
            description="Alert when any circuit exceeds this percentage of its max capacity."
            value={loadWarning}
            onChange={setLoadWarning}
            onCommit={(v) => update({ loadWarningPct: v })}
            color="emerald"
          />
          <div className="border-t border-slate-800/60 pt-8">
            <ThresholdSlider
              icon={Zap}
              label="Auto-Cutoff Limit"
              description="Automatically toggle relay OFF if critical load persists for > 10s."
              value={autoCutoff}
              onChange={setAutoCutoff}
              onCommit={(v) => update({ autoCutoffPct: v })}
              color="red"
            />
          </div>
        </div>
      </Card>

      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300/80">
          Setting the auto-cutoff below 80% may cause frequent interruptions. Recommended range is 90–95%.
        </p>
      </div>
    </div>
  )
}
