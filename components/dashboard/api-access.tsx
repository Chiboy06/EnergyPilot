'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Copy, Eye, EyeOff, RefreshCw, ShieldCheck, Key, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
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

export function APIAccess() {
  const [keyVisible, setKeyVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [geminiInput, setGeminiInput] = useState('')
  const [geminiVisible, setGeminiVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  const prefs          = useQuery(api.preferences.get, {})
  const geminiStatus   = useQuery(api.preferences.getGeminiKeyStatus, {})
  const getOrCreateKey = useMutation(api.preferences.getOrCreateApiKey)
  const rotateKey      = useMutation(api.preferences.rotateApiKey)
  const setGeminiKey   = useMutation(api.preferences.setGeminiApiKey)
  const removeGemini   = useMutation(api.preferences.removeGeminiApiKey)

  const apiKey = prefs?.apiKey ?? null

  const handleGetKey = async () => {
    await getOrCreateKey({})
  }

  const handleRotate = async () => {
    if (!confirm('Rotate the API key? The old key will stop working immediately.')) return
    await rotateKey({})
  }

  const handleCopy = () => {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveGemini = async () => {
    if (!geminiInput.trim()) return
    setSaving(true)
    setSaveError(null)
    setSaveOk(false)
    try {
      await setGeminiKey({ geminiApiKey: geminiInput.trim() })
      setGeminiInput('')
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save key')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveGemini = async () => {
    if (!confirm('Remove Gemini API key? Energenius AI will stop working.')) return
    await removeGemini({})
  }

  const isLoading = prefs === undefined || geminiStatus === undefined

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Developer Access</h2>
        <p className="text-sm text-slate-400 mt-0.5">Manage API keys for integrations and AI features.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* EnergyPilot REST API key */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">EnergyPilot API Key</h3>
                <p className="text-xs text-slate-500 mt-0.5">Authenticate IoT ingest and external API calls.</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3 mr-1" /> {apiKey ? 'Active' : 'Not generated'}
              </Badge>
            </div>

            {apiKey ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={keyVisible ? 'text' : 'password'}
                      value={apiKey}
                      readOnly
                      className="pr-10 bg-slate-800/60 border-slate-700 text-white font-mono text-sm focus:border-emerald-500"
                    />
                    <button
                      onClick={() => setKeyVisible(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {keyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-800/60">
                  <Button
                    onClick={handleRotate}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rotate Key
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={handleGetKey} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                <Key className="h-4 w-4 mr-2" />
                Generate API Key
              </Button>
            )}
          </Card>

          {/* Gemini API key */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Gemini API Key</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Required for Energenius AI. Get a free key at{' '}
                  <span className="text-emerald-400">aistudio.google.com</span>.
                </p>
              </div>
              {geminiStatus?.hasKey ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Configured
                </Badge>
              ) : (
                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertCircle className="h-3 w-3 mr-1" /> Not set
                </Badge>
              )}
            </div>

            {geminiStatus?.hasKey && (
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Input
                    type={geminiVisible ? 'text' : 'password'}
                    value={geminiStatus.maskedKey ?? ''}
                    readOnly
                    className="pr-10 bg-slate-800/60 border-slate-700 text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => setGeminiVisible(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {geminiVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveGemini}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                  {geminiStatus?.hasKey ? 'Replace key' : 'Enter your Gemini API key'}
                </label>
                <Input
                  type="password"
                  placeholder="AIza..."
                  value={geminiInput}
                  onChange={e => { setGeminiInput(e.target.value); setSaveError(null); setSaveOk(false) }}
                  className="bg-slate-800/60 border-slate-700 text-white font-mono text-sm focus:border-emerald-500"
                />
              </div>

              {saveError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {saveError}
                </p>
              )}
              {saveOk && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Gemini API key saved
                </p>
              )}

              <Button
                onClick={handleSaveGemini}
                disabled={!geminiInput.trim() || saving}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                {geminiStatus?.hasKey ? 'Update Key' : 'Save Key'}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
