'use client'

import { useState, useTransition } from 'react'
import { adminSavePredictionForUser } from '@/app/actions/admin'

interface User {
  id: string
  display_name: string | null
}

interface Match {
  id: string
  match_number: number
  phase: string
  kickoff_at: string
  status: string
  home_team: { fifa_code: string } | null
  away_team: { fifa_code: string } | null
  home_placeholder: string | null
  away_placeholder: string | null
}

interface Props {
  users: User[]
  matches: Match[]
}

function matchLabel(m: Match) {
  const home = m.home_team?.fifa_code ?? m.home_placeholder ?? '?'
  const away = m.away_team?.fifa_code ?? m.away_placeholder ?? '?'
  return `M${m.match_number} · ${home} vs ${away} (${m.phase.replace(/_/g, ' ')} · ${new Date(m.kickoff_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC)`
}

export function AdminManualPredictionsClient({ users, matches }: Props) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !selectedMatchId) {
      setMessage({ text: 'Selecciona usuario y partido.', ok: false })
      return
    }
    setMessage(null)
    startTransition(async () => {
      const result = await adminSavePredictionForUser(selectedUserId, selectedMatchId, homeScore, awayScore)
      if (result.error) {
        setMessage({ text: `Error: ${result.error}`, ok: false })
      } else {
        setMessage({ text: '✅ Predicción guardada correctamente.', ok: true })
      }
    })
  }

  const selectedMatch = matches.find(m => m.id === selectedMatchId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">Predicciones Manuales</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ingresa predicciones de partidos para usuarios que no pudieron hacerlo en la app.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-4 space-y-4">
        {/* User select */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Usuario</label>
          <select
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">— Seleccionar usuario —</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.display_name ?? u.id}
              </option>
            ))}
          </select>
        </div>

        {/* Match select */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Partido</label>
          <select
            value={selectedMatchId}
            onChange={e => setSelectedMatchId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">— Seleccionar partido —</option>
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                {matchLabel(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Score inputs */}
        {selectedMatch && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Marcador predicho</label>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium min-w-[40px] text-right">
                {selectedMatch.home_team?.fifa_code ?? selectedMatch.home_placeholder ?? 'Local'}
              </span>
              <input
                type="number"
                min={0}
                max={99}
                value={homeScore}
                onChange={e => setHomeScore(parseInt(e.target.value, 10) || 0)}
                className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="number"
                min={0}
                max={99}
                value={awayScore}
                onChange={e => setAwayScore(parseInt(e.target.value, 10) || 0)}
                className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm font-medium min-w-[40px]">
                {selectedMatch.away_team?.fifa_code ?? selectedMatch.away_placeholder ?? 'Visita'}
              </span>
            </div>
          </div>
        )}

        {message && (
          <p className={`text-sm font-medium ${message.ok ? 'text-green-600' : 'text-destructive'}`}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || !selectedUserId || !selectedMatchId}
          className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Guardando…' : 'Guardar predicción'}
        </button>
      </form>
    </div>
  )
}
