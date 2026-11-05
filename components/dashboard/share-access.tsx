'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Copy, ShieldCheck, Trash2, AlertCircle, Loader2, Share2, Lock, Shield, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useHubData } from '@/hooks/use-hub-data'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}

// Exactly what each role can do, as enforced by the backend.
const ROLES = {
  viewer: {
    icon: Lock,
    title: 'Viewer',
    can: 'Can see live readings, circuits, alerts, history, estimates and use the AI assistant for this hub.',
    cannot: 'Cannot switch relays, rename anything, change the tariff or manage sharing.',
  },
  controller: {
    icon: Shield,
    title: 'Controller',
    can: 'Everything a viewer can, plus switch individual relays and All ON / All OFF.',
    cannot: 'Cannot rename anything, change the tariff or manage sharing.',
  },
} as const

export function ShareAccess() {
  const { activeHub, userRole } = useHubData()
  const [role, setRole] = useState<'viewer' | 'controller'>('viewer')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accessCode = useQuery(api.sharing.getAccessCode, {})
  const members = useQuery(api.sharing.listMembers, {})
  const createCode = useMutation(api.sharing.createAccessCode)
  const revokeCode = useMutation(api.sharing.revokeAccessCode)
  const removeMember = useMutation(api.sharing.removeMember)

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError(null)
    try { await fn() } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong') } finally { setBusy(false) }
  }

  const handleCopy = async () => {
    if (!accessCode) return
    try {
      await navigator.clipboard.writeText(accessCode.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — select the code and copy it manually')
    }
  }

  if (activeHub && userRole !== 'owner') {
    return (
      <Card>
        <h2 className="text-xl font-semibold text-white mb-2">Share Access</h2>
        <p className="text-base text-slate-400">
          This hub was shared with you as a <strong className="text-white">{userRole}</strong>. Only the hub owner can create access codes or manage members.
        </p>
      </Card>
    )
  }

  const isLoading = accessCode === undefined

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-semibold text-white flex items-center gap-2">
          <Share2 className="h-5 w-5 text-emerald-400" aria-hidden /> Share Access
        </h2>
        <p className="text-base text-slate-400 mt-1">
          Give another person access to {activeHub ? <strong className="text-white">{activeHub.name}</strong> : 'your hub'} with a 6-character code.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Access code</h3>
            {accessCode ? (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3 mr-1" aria-hidden /> Active
              </Badge>
            ) : (
              <Badge className="bg-slate-800 text-slate-400 border border-slate-700">No active code</Badge>
            )}
          </div>

          {accessCode ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex-1 min-w-[140px]">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Code</p>
                  <p className="text-3xl font-mono font-bold text-emerald-400 tracking-widest">{accessCode.code}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopy}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 shrink-0">
                  <Copy className="h-4 w-4 mr-1.5" aria-hidden /> {copied ? 'Copied!' : 'Copy code'}
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-2 text-sm text-slate-300">
                <p><strong className="text-white">Who gets access:</strong> anyone signed in who enters this code in the app.</p>
                <p><strong className="text-white">Access they get:</strong> {ROLES[accessCode.role].title}. {ROLES[accessCode.role].can} {ROLES[accessCode.role].cannot}</p>
                <p><strong className="text-white">How long:</strong> the code works for any number of people until you revoke or replace it. Revoking stops new joins; people who already joined keep access until you remove them below.</p>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" disabled={busy}
                  onClick={() => confirm('Revoke this code? New people won\'t be able to join with it. People who already joined keep access until you remove them.') && run(() => revokeCode({}))}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4 mr-1.5" aria-hidden /> Revoke code
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <fieldset>
                <legend className="block text-sm font-semibold text-slate-300 mb-2">Access the next person gets</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map((key) => {
                    const r = ROLES[key]
                    const Icon = r.icon
                    return (
                      <button key={key} type="button" aria-pressed={role === key} onClick={() => setRole(key)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                          role === key ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700'
                        }`}>
                        <div className={`p-2 rounded-lg ${role === key ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`} aria-hidden>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-base text-white">{r.title}</p>
                          <p className="text-sm text-slate-300 mt-0.5">{r.can}</p>
                          <p className="text-sm text-slate-400 mt-0.5">{r.cannot}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
              <p className="text-sm text-slate-400">
                The code works for anyone who enters it, any number of times, until you revoke it.
              </p>
              <Button onClick={() => run(() => createCode({ role }))} disabled={busy}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" aria-hidden />}
                Generate {ROLES[role].title.toLowerCase()} code
              </Button>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h3 className="text-base font-semibold text-white mb-1">People with access</h3>
        <p className="text-sm text-slate-400 mb-4">Removing someone takes effect immediately.</p>
        {members === undefined ? (
          <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
        ) : members.length === 0 ? (
          <p className="text-sm text-slate-400">Nobody has joined this hub yet.</p>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {members.map((m) => (
              <li key={m._id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-base text-white truncate">{m.name ?? m.email ?? 'Unknown user'}</p>
                  <p className="text-sm text-slate-400">
                    {ROLES[m.role].title} · joined {new Date(m.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {m.name && m.email ? ` · ${m.email}` : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled={busy}
                  aria-label={`Remove ${m.name ?? m.email ?? 'member'}`}
                  onClick={() => confirm(`Remove ${m.name ?? m.email ?? 'this person'}'s access now?`) && run(() => removeMember({ memberId: m._id }))}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0">
                  <UserMinus className="h-4 w-4 mr-1.5" aria-hidden /> Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
