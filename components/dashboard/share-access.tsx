'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Copy, ShieldCheck, Trash2, CheckCircle2, AlertCircle, Loader2, Share2, Lock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}

export function ShareAccess() {
  const [role, setRole] = useState<'viewer' | 'controller'>('viewer')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accessCode = useQuery(api.sharing.getAccessCode, {})
  const createCode = useMutation(api.sharing.createAccessCode)
  const revokeCode = useMutation(api.sharing.revokeAccessCode)

  const handleCreateCode = async () => {
    setCreating(true)
    setError(null)
    try {
      await createCode({ role })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate access code')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = () => {
    if (!accessCode) return
    navigator.clipboard.writeText(accessCode.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevoke = async () => {
    if (!confirm('Revoke this access code? Anyone attempting to join with it will be blocked.')) return
    try {
      await revokeCode({})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to revoke access code')
    }
  }

  const isLoading = accessCode === undefined

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Share2 className="h-5 w-5 text-emerald-400" /> Share Access
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Generate temporary access codes to invite family members, technicians, or managers to your facility.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Active Access Code</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Share this code with another user during onboarding to grant access to your facility.
              </p>
            </div>
            {accessCode ? (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3 mr-1" /> Code Active
              </Badge>
            ) : (
              <Badge className="bg-slate-800 text-slate-400 border border-slate-700">
                No Active Code
              </Badge>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {accessCode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Access Code</p>
                  <p className="text-2xl font-mono font-bold text-emerald-400 tracking-widest">{accessCode.code}</p>
                </div>
                <div className="text-right mr-2">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Role Granted</p>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 bg-emerald-500/10 capitalize">
                    {accessCode.role}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 shrink-0"
                >
                  <Copy className="h-4 w-4 mr-1.5" />
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">
                  Code permits 1-time redemption. Hub owner maintains full control.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevoke}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Revoke Code
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Permission Role for Next Guest
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('viewer')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      role === 'viewer'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${role === 'viewer' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">Viewer</p>
                      <p className="text-xs text-slate-400 mt-0.5">Read-only live telemetry, analytics, & predictions. Cannot toggle relays.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('controller')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      role === 'controller'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${role === 'controller' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">Controller</p>
                      <p className="text-xs text-slate-400 mt-0.5">All viewer privileges + remote circuit relay switching.</p>
                    </div>
                  </button>
                </div>
              </div>

              <Button
                onClick={handleCreateCode}
                disabled={creating}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
              >
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
                Generate Access Code
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
