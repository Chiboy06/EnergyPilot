'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Slider } from '@/components/ui/slider'
import { AlertTriangle, Zap } from 'lucide-react'
import { useHubData } from '@/hooks/use-hub-data'

const MIN_PCT = 50

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6">
      {children}
    </div>
  )
}

function LevelSlider({
  id, icon: Icon, label, description, value, min, onChange, onCommit,
}: {
  id: string
  icon: React.ElementType
  label: string
  description: string
  value: number
  min: number
  onChange: (v: number) => void
  onCommit: (v: number) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-slate-800" aria-hidden>
            <Icon className="h-4 w-4 text-slate-300" />
          </div>
          <div>
            <p id={`${id}-label`} className="text-base font-medium text-white">{label}</p>
            <p className="text-sm text-slate-400">{description}</p>
          </div>
        </div>
        <div className="text-3xl font-bold tabular-nums shrink-0 text-white">{value}%</div>
      </div>
      <Slider
        aria-labelledby={`${id}-label`}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        onValueCommit={(v) => onCommit(v[0])}
        min={min}
        max={100}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-sm text-slate-500">
        <span>{min}%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

export function ThresholdsSettings() {
  const prefs = useQuery(api.preferences.get, {})
  const update = useMutation(api.preferences.update)
  const { breakerCapacity, userRole } = useHubData()
  // Drafts hold the slider position while dragging; otherwise show saved values.
  const [warningDraft, setWarning] = useState<number | null>(null)
  const [criticalDraft, setCritical] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const warning = warningDraft ?? prefs?.loadWarningPct ?? 80
  const critical = criticalDraft ?? prefs?.autoCutoffPct ?? 95

  const save = async (fields: { loadWarningPct?: number; autoCutoffPct?: number }) => {
    setError(null)
    try { await update(fields) } catch (e) { setError(e instanceof Error ? e.message : 'Could not save') }
    setWarning(null)
    setCritical(null)
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-semibold text-white">Load alert levels</h2>
        <p className="text-base text-slate-400 mt-1">
          When the whole building&apos;s current reaches these percentages of the main breaker capacity
          {breakerCapacity ? ` (${breakerCapacity} A, set during onboarding)` : ''}, an alert is recorded on the dashboard.
          {userRole !== 'owner' && ' These levels are your personal preference and apply to hubs you own.'}
        </p>
      </div>

      <div role="note" className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-amber-200/90">
          These levels only open alerts. Nothing is switched off automatically — EnergyPilot has no automatic cutoff.
          The default levels are app defaults, not engineering-validated safety limits; have a qualified electrician
          confirm values for your installation. Individual circuits use their own configured rating (alert at 90%).
        </p>
      </div>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      <Card>
        <div className="space-y-8">
          <LevelSlider
            id="warning"
            icon={AlertTriangle}
            label="Warning level"
            description="Records a warning alert for whole-building load."
            value={warning}
            min={MIN_PCT}
            onChange={(v) => { setWarning(v); if (critical < v) setCritical(v) }}
            onCommit={(v) => save({ loadWarningPct: v, autoCutoffPct: Math.max(critical, v) })}
          />
          <div className="border-t border-slate-800/60 pt-8">
            <LevelSlider
              id="critical"
              icon={Zap}
              label="Critical level"
              description="Marks the whole-building load alert as critical. Cannot be below the warning level."
              value={critical}
              min={warning}
              onChange={setCritical}
              onCommit={(v) => save({ autoCutoffPct: v })}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
