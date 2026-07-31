'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useHubData } from '@/hooks/use-hub-data'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Mail, Shield, Wifi, WifiOff, Copy, RefreshCw, Trash2, Check, Loader2 } from 'lucide-react'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}

export function AccountSettings() {
  const { user } = useUser()
  const { activeHub, hubState } = useHubData()

  // Profile
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const updateName = useMutation(api.users.updateName)

  useEffect(() => {
    setFirstName(user?.firstName ?? '')
    setLastName(user?.lastName ?? '')
  }, [user?.firstName, user?.lastName])

  const handleSaveName = async () => {
    if (!firstName.trim()) return
    setSavingName(true)
    try {
      await updateName({ firstName: firstName.trim(), lastName: lastName.trim() || undefined })
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2500)
    } finally { setSavingName(false) }
  }

  // Hub rename
  const [hubName, setHubName] = useState('')
  const [savingHub, setSavingHub] = useState(false)
  const [hubSaved, setHubSaved] = useState(false)
  const renameHub = useMutation(api.onboarding.renameHub)

  useEffect(() => { if (activeHub) setHubName(activeHub.name) }, [activeHub?.name])

  const handleSaveHub = async () => {
    if (!activeHub || !hubName.trim()) return
    setSavingHub(true)
    try {
      await renameHub({ hubId: activeHub._id, name: hubName.trim() })
      setHubSaved(true)
      setTimeout(() => setHubSaved(false), 2500)
    } finally { setSavingHub(false) }
  }

  // Tariff
  const tariffData = useQuery(api.preferences.getTariffRate)
  const setTariff = useMutation(api.preferences.setTariffRate)
  const [tariff, setTariffLocal] = useState('68')
  const [savingTariff, setSavingTariff] = useState(false)
  const [tariffSaved, setTariffSaved] = useState(false)

  useEffect(() => {
    if (tariffData) setTariffLocal(String(tariffData.tariffPerKwh))
  }, [tariffData?.tariffPerKwh])

  const handleSaveTariff = async () => {
    const val = parseFloat(tariff)
    if (isNaN(val) || val <= 0) return
    setSavingTariff(true)
    try {
      await setTariff({ tariffPerKwh: val })
      setTariffSaved(true)
      setTimeout(() => setTariffSaved(false), 2500)
    } finally { setSavingTariff(false) }
  }

  // Access code
  const accessCode = useQuery(api.sharing.getAccessCode)
  const createCode = useMutation(api.sharing.createAccessCode)
  const revokeCode = useMutation(api.sharing.revokeAccessCode)
  const [copied, setCopied] = useState(false)
  const [creatingCode, setCreatingCode] = useState(false)

  const handleCreateCode = async () => {
    setCreatingCode(true)
    try { await createCode({ role: 'viewer' }) } finally { setCreatingCode(false) }
  }
  const handleCopyCode = () => {
    if (!accessCode?.code) return
    navigator.clipboard.writeText(accessCode.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const initials = [user?.firstName, user?.lastName].filter(Boolean).map(s => s![0]).join('').toUpperCase() || 'U'
  const isOnline = hubState?.isOnline ?? false

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Account Settings</h2>
        <p className="text-sm text-slate-400 mt-0.5">Manage your profile, hub, and billing preferences.</p>
      </div>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-800/60">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-white">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}</p>
            <p className="text-sm text-slate-400">{email}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Shield className="h-3 w-3" /> Administrator
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">First Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input value={firstName} onChange={e => setFirstName(e.target.value)}
                className="pl-9 bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Last Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input value={lastName} onChange={e => setLastName(e.target.value)}
                className="pl-9 bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input value={email} disabled className="pl-9 bg-slate-800/40 border-slate-700/50 text-slate-400 cursor-not-allowed" />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveName} disabled={savingName || !firstName.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-6">
            {savingName ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : nameSaved ? <Check className="h-4 w-4 mr-2" /> : null}
            {nameSaved ? 'Saved' : 'Save Name'}
          </Button>
        </div>
      </Card>

      {/* Hub */}
      {activeHub && (
        <Card>
          <h3 className="text-sm font-semibold text-white mb-1">Active Hub</h3>
          <p className="text-xs text-slate-500 mb-4">Rename your hub or view its live status.</p>
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            {isOnline ? <Wifi className="h-4 w-4 text-emerald-400 shrink-0" /> : <WifiOff className="h-4 w-4 text-slate-500 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{activeHub.name}</p>
              <p className="text-xs text-slate-500 font-mono">{activeHub.macAddress}</p>
            </div>
            {hubState && (
              <div className="text-right shrink-0">
                <p className="text-xs font-mono text-emerald-400">{hubState.voltage.toFixed(1)}V</p>
                <p className="text-xs text-slate-500">{(hubState.totalPowerW / 1000).toFixed(2)} kW</p>
              </div>
            )}
          </div>
          <Input value={hubName} onChange={e => setHubName(e.target.value)}
            className="bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500 mb-3" />
          <div className="flex justify-end">
            <Button onClick={handleSaveHub} disabled={savingHub || !hubName.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
              {savingHub ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : hubSaved ? <Check className="h-4 w-4 mr-2" /> : null}
              {hubSaved ? 'Saved' : 'Rename Hub'}
            </Button>
          </div>
        </Card>
      )}

      {/* Tariff */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-1">Electricity Tariff</h3>
        <p className="text-xs text-slate-500 mb-4">Used to calculate cost estimates across the dashboard.</p>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₦</span>
            <Input type="number" min="1" value={tariff} onChange={e => setTariffLocal(e.target.value)}
              className="pl-7 bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500" />
          </div>
          <span className="text-sm text-slate-400 shrink-0">per kWh</span>
          <Button onClick={handleSaveTariff} disabled={savingTariff}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold shrink-0">
            {savingTariff ? <Loader2 className="h-4 w-4 animate-spin" /> : tariffSaved ? <Check className="h-4 w-4" /> : 'Save'}
          </Button>
        </div>
      </Card>

      {/* Share Access Code */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-1">Share Access</h3>
        <p className="text-xs text-slate-500 mb-4">Give others view access to your hub with a 6-character code.</p>
        {accessCode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center justify-center py-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="font-mono text-2xl font-bold tracking-[0.3em] text-emerald-400">{accessCode.code}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyCode}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCreateCode} disabled={creatingCode}
                className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> New Code
              </Button>
              <Button variant="outline" size="sm" onClick={() => revokeCode({})}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Revoke
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={handleCreateCode} disabled={creatingCode}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
            {creatingCode && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Generate Access Code
          </Button>
        )}
      </Card>
    </div>
  )
}
