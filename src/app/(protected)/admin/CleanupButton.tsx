'use client'

import { useState } from 'react'

interface Props {
  action: () => Promise<{ error?: string; deleted: Record<string, number> }>
  label?: string
  confirm?: string
}

export function CleanupButton({ action, label = 'Ejecutar', confirm: confirmMsg }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function run() {
    const msg = confirmMsg ?? '¿Continuar?'
    if (!window.confirm(msg)) return
    setLoading(true)
    setResult(null)
    try {
      const res = await action()
      if (res.error) {
        setResult(`Error: ${res.error}`)
      } else {
        const parts = Object.entries(res.deleted).map(([k, v]) => `${k}: ${v}`)
        setResult(parts.length ? `✓ ${parts.join(', ')}` : 'Nada que procesar.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        onClick={run}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors disabled:opacity-50"
      >
        {loading ? 'Procesando…' : label}
      </button>
      {result && <p className="text-xs text-muted-foreground">{result}</p>}
    </div>
  )
}
