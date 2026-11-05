'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Key, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
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
  const [geminiInput, setGeminiInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  const geminiStatus = useQuery(api.preferences.getGeminiKeyStatus, {})
  const setGeminiKey = useMutation(api.preferences.setGeminiApiKey)
  const removeGemini = useMutation(api.preferences.removeGeminiApiKey)

  const handleSaveGemini = async () => {
    if (!geminiInput.trim()) return
    setSaving(true)
    setError(null)
    setSaveOk(false)
    try {
      await setGeminiKey({ geminiApiKey: geminiInput.trim() })
      setGeminiInput('')
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save key')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveGemini = async () => {
    if (!confirm('Remove your Gemini API key? The Energenius assistant will stop working until you add one.')) return
    try {
      await removeGemini({})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove key')
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-semibold text-white">AI Key</h2>
        <p className="text-base text-slate-400 mt-1">
          The Energenius assistant uses your own Google Gemini API key. It is stored on the server, used only for your
          assistant requests, and never sent back to this page or your phone — only the first characters are shown.
        </p>
      </div>

      {geminiStatus === undefined ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Gemini API key</h3>
              <p className="text-sm text-slate-400 mt-0.5">Create one at aistudio.google.com. Usage is billed to your Google account.</p>
            </div>
            {geminiStatus.hasKey ? (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden /> Configured
              </Badge>
            ) : (
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="h-3 w-3 mr-1" aria-hidden /> Not set
              </Badge>
            )}
          </div>

          {geminiStatus.hasKey && (
            <div className="flex items-center gap-2 mb-4">
              <Input value={geminiStatus.maskedKey ?? ''} readOnly aria-label="Saved key (masked)"
                className="bg-slate-800/60 border-slate-700 text-white font-mono text-sm" />
              <Button variant="outline" size="sm" onClick={handleRemoveGemini} aria-label="Remove Gemini key"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0">
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <label htmlFor="gemini-key" className="block text-sm font-medium text-slate-300">
              {geminiStatus.hasKey ? 'Replace key' : 'Enter your Gemini API key'}
            </label>
            <Input
              id="gemini-key"
              type="password"
              autoComplete="off"
              placeholder="AIza..."
              value={geminiInput}
              onChange={e => { setGeminiInput(e.target.value); setError(null); setSaveOk(false) }}
              className="bg-slate-800/60 border-slate-700 text-white font-mono text-sm focus:border-emerald-500"
            />
            {error && (
              <p role="alert" className="text-sm text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
              </p>
            )}
            {saveOk && (
              <p className="text-sm text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden /> Gemini API key saved
              </p>
            )}
            <Button
              onClick={handleSaveGemini}
              disabled={!geminiInput.trim() || saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" aria-hidden />}
              {geminiStatus.hasKey ? 'Update key' : 'Save key'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
