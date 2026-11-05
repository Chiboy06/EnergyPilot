'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useHubData } from '@/hooks/use-hub-data'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Mail, Wifi, WifiOff, Check, Loader2 } from 'lucide-react'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}

const ROLE_TEXT = {
  owner:      'Owner of this hub',
  controller: 'Controller — shared with you; can view and switch relays',
  viewer:     'Viewer — shared with you; view only',
} as const

function useSaver() {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)
  const save = async (fn: () => Promise<unknown>) => {
    setState('saving'); setError(null)
    try {
      await fn()
      setState('saved')
      setTimeout(() => setState('idle'), 2500)
    } catch (e) {
      setState('idle')
      setError(e instanceof Error ? e.message : 'Could not save')
    }
  }
  return { state, error, save }
}

export function AccountSettings() {
  const { user } = useUser()
  const { activeHub, hubState, isFresh, userRole } = useHubData()
  const isOwner = userRole === 'owner'

  // Profile — Clerk is the source of truth for the name; Convex syncs from it.
  // Drafts are null until edited, so the fields show the saved values.
  const [firstDraft, setFirstName] = useState<string | null>(null)
  const [lastDraft, setLastName] = useState<string | null>(null)
  const firstName = firstDraft ?? user?.firstName ?? ''
  const lastName = lastDraft ?? user?.lastName ?? ''
  const nameSaver = useSaver()

  // Hub rename
  const [hubDraft, setHubName] = useState<string | null>(null)
  const hubName = hubDraft ?? activeHub?.name ?? ''
  const hubSaver = useSaver()
  const renameHub = useMutation(api.onboarding.renameHub)

  // Tariff
  const tariffData = useQuery(api.preferences.getTariffRate, {})
  const setTariff = useMutation(api.preferences.setTariffRate)
  const [tariffDraft, setTariffLocal] = useState<string | null>(null)
  const tariff = tariffDraft ?? (tariffData && !tariffData.isDefault ? String(tariffData.tariffPerKwh) : '')
  const tariffSaver = useSaver()
  const tariffValue = parseFloat(tariff)
  const tariffValid = Number.isFinite(tariffValue) && tariffValue > 0

  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const initials = [user?.firstName, user?.lastName].filter(Boolean).map(s => s![0]).join('').toUpperCase() || 'U'

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-semibold text-white">Account</h2>
        <p className="text-base text-slate-400 mt-1">Your profile, your hub&apos;s name and your electricity tariff. Sharing is under Share Access.</p>
      </div>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-800/60">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl" aria-hidden>
            {initials}
          </div>
          <div>
            <p className="font-semibold text-white text-lg">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}</p>
            <p className="text-sm text-slate-400">{email}</p>
            {activeHub && (
              <p className="mt-1 text-sm text-emerald-400">{ROLE_TEXT[userRole]}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first-name" className="block text-sm font-medium text-slate-300 mb-1.5">First name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden />
              <Input id="first-name" value={firstName} onChange={e => setFirstName(e.target.value)}
                className="pl-9 bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label htmlFor="last-name" className="block text-sm font-medium text-slate-300 mb-1.5">Last name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden />
              <Input id="last-name" value={lastName} onChange={e => setLastName(e.target.value)}
                className="pl-9 bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">Email (managed by your sign-in account)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden />
              <Input id="email" value={email} disabled className="pl-9 bg-slate-800/40 border-slate-700/50 text-slate-400 cursor-not-allowed" />
            </div>
          </div>
        </div>
        {nameSaver.error && <p role="alert" className="mt-3 text-sm text-red-400">{nameSaver.error}</p>}
        <div className="flex justify-end mt-6">
          <Button
            onClick={() => user && nameSaver.save(() => user.update({ firstName: firstName.trim(), lastName: lastName.trim() }))}
            disabled={nameSaver.state === 'saving' || !firstName.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-6">
            {nameSaver.state === 'saving' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : nameSaver.state === 'saved' ? <Check className="h-4 w-4 mr-2" /> : null}
            {nameSaver.state === 'saved' ? 'Saved' : 'Save name'}
          </Button>
        </div>
      </Card>

      {/* Hub */}
      {activeHub && (
        <Card>
          <h3 className="text-base font-semibold text-white mb-1">Hub</h3>
          <p className="text-sm text-slate-400 mb-4">
            {isOwner ? 'Rename your hub or check its live status.' : 'Shared with you — only the owner can rename it.'}
          </p>
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            {isFresh ? <Wifi className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden /> : <WifiOff className="h-4 w-4 text-slate-500 shrink-0" aria-hidden />}
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-white truncate">{activeHub.name}</p>
              <p className="text-sm text-slate-400 font-mono">{activeHub.macAddress} · {isFresh ? 'reporting' : 'no data in the last 30 s'}</p>
            </div>
            {hubState && (
              <div className="text-right shrink-0">
                <p className="text-sm font-mono text-emerald-400">{hubState.voltage.toFixed(1)} V</p>
                <p className="text-sm text-slate-400">{(hubState.totalPowerW / 1000).toFixed(2)} kW total</p>
              </div>
            )}
          </div>
          {isOwner && (
            <>
              <label htmlFor="hub-name" className="block text-sm font-medium text-slate-300 mb-1.5">Hub name</label>
              <Input id="hub-name" value={hubName} onChange={e => setHubName(e.target.value)}
                className="bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500 mb-3" />
              {hubSaver.error && <p role="alert" className="mb-3 text-sm text-red-400">{hubSaver.error}</p>}
              <div className="flex justify-end">
                <Button onClick={() => hubSaver.save(() => renameHub({ hubId: activeHub._id, name: hubName.trim() }))}
                  disabled={hubSaver.state === 'saving' || !hubName.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                  {hubSaver.state === 'saving' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : hubSaver.state === 'saved' ? <Check className="h-4 w-4 mr-2" /> : null}
                  {hubSaver.state === 'saved' ? 'Saved' : 'Rename hub'}
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Tariff */}
      <Card>
        <h3 className="text-base font-semibold text-white mb-1">Electricity tariff</h3>
        <p className="text-sm text-slate-400 mb-4">
          Every cost on the dashboard is energy × this rate.{' '}
          {tariffData?.isDefault
            ? `No tariff is set, so costs use the app default of ₦${tariffData.tariffPerKwh}/kWh — enter your own rate from your electricity bill.`
            : tariffData ? `Currently ₦${tariffData.tariffPerKwh}/kWh.` : ''}
        </p>
        {isOwner ? (
          <>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" aria-hidden>₦</span>
                <Input type="number" min="0" step="0.01" inputMode="decimal" aria-label="Tariff in naira per kWh"
                  placeholder={tariffData?.isDefault ? `${tariffData.tariffPerKwh} (default)` : ''}
                  value={tariff} onChange={e => setTariffLocal(e.target.value)}
                  className="pl-7 bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500" />
              </div>
              <span className="text-sm text-slate-400 shrink-0">per kWh</span>
              <Button onClick={() => tariffSaver.save(() => setTariff({ tariffPerKwh: tariffValue }))}
                disabled={tariffSaver.state === 'saving' || !tariffValid}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold shrink-0">
                {tariffSaver.state === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : tariffSaver.state === 'saved' ? <Check className="h-4 w-4" /> : 'Save'}
              </Button>
            </div>
            {tariffSaver.error && <p role="alert" className="mt-3 text-sm text-red-400">{tariffSaver.error}</p>}
          </>
        ) : (
          <p className="text-sm text-slate-400">Only the hub owner can change the tariff.</p>
        )}
      </Card>
    </div>
  )
}
