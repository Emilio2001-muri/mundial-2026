'use client'

import { useState } from 'react'

interface Props {
  action: () => Promise<{ error?: string; deleted: Record<string, number> }>
}

export function CleanupButton({ action }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function run() {
    if (!confirm('¿Limpiar datos antiguos? Las predicciones de usuarios NO se tocarán.')) return
    setLoading(true)
    setResult(null)
    try {
      const res = await action()
      if (res.error) {
        setResult(`Error: ${res.error}`)
      } else {
        const parts = Object.entries(res.deleted).map(([k, v]) => `${k}: ${v}`)
        setResult(parts.length ? `Eliminados — ${parts.join(', ')}` : 'Nada que limpiar.')
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
        {loading ? 'Limpiando…' : 'Ejecutar limpieza'}
      </button>
      {result && <p className="text-xs text-muted-foreground">{result}</p>}
    </div>
  )
}
