'use client'

import { useState, useTransition, useEffect } from 'react'
import { adminSavePredictionForUser, adminSaveFullPrediction, getMatchPlayersForAdmin } from '@/app/actions/admin'
import { X, Plus } from 'lucide-react'

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
  home_team_id: string | null
  away_team_id: string | null
  home_team: { id: string; fifa_code: string } | null
  away_team: { id: string; fifa_code: string } | null
  home_placeholder: string | null
  away_placeholder: string | null
}

interface Player {
  id: string
  team_id: string
  name: string
  position: string | null
  shirt_number: number | null
}

interface ScorerEntry {
  player_id: string
  predicted_goals: number
}

interface Props {
  users: User[]
  matches: Match[]
  players: Player[]
}

const PHASE_LABEL: Record<string, string> = {
  round_of_32: 'R32',
  round_of_16: 'Octavos',
  quarter_final: 'Cuartos',
  semi_final: 'Semis',
  third_place: '3er lugar',
  final: 'Final',
}

function matchLabel(m: Match) {
  const home = m.home_team?.fifa_code ?? m.home_placeholder ?? '?'
  const away = m.away_team?.fifa_code ?? m.away_placeholder ?? '?'
  const phase = PHASE_LABEL[m.phase] ?? m.phase
  const date = new Date(m.kickoff_at).toLocaleDateString('es-MX', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  })
  return `M${m.match_number} · ${home} vs ${away} (${phase} · ${date})`
}

const POSITION_LABEL: Record<string, string> = { GK: 'POR', DF: 'DEF', MF: 'MED', FW: 'DEL' }

export function AdminManualPredictionsClient({ users, matches, players }: Props) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [scorers, setScorers] = useState<ScorerEntry[]>([])
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [players, setPlayers] = useState<{ id: string; name: string; team_id: string; fifa_code: string }[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [scorers, setScorers] = useState<{ player_id: string; player_name: string; fifa_code: string; predicted_goals: number }[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [selectedGoals, setSelectedGoals] = useState(1)

  const selectedMatch = matches.find(m => m.id === selectedMatchId) ?? null

  // Players for the selected match's two teams
  const matchPlayers = selectedMatch
    ? players.filter(p =>
        p.team_id === selectedMatch.home_team_id ||
        p.team_id === selectedMatch.away_team_id
      )
    : []

  const homePlayers = selectedMatch
    ? players.filter(p => p.team_id === selectedMatch.home_team_id)
    : []

  const awayPlayers = selectedMatch
    ? players.filter(p => p.team_id === selectedMatch.away_team_id)
    : []

  const handleMatchChange = async (matchId: string) => {
    setSelectedMatchId(matchId)
    setHomeScore(0)
    setAwayScore(0)
    setScorers([])
    setSelectedPlayerId('')
    setPlayers([])
    setMessage(null)
    if (matchId) {
      setLoadingPlayers(true)
      const result = await getMatchPlayersForAdmin(matchId)
      setPlayers(result.players)
      setLoadingPlayers(false)
    }
    setScorers([])
    setMessage(null)
  }

  const addScorer = () => {
    if (!matchPlayers.length) return
    setScorers(prev => [...prev, { player_id: matchPlayers[0].id, predicted_goals: 1 }])
  }

  const updateScorer = (index: number, field: keyof ScorerEntry, value: string | number) => {
    setScorers(prev => prev.map((s, i) =>
      i === index ? { ...s, [field]: field === 'predicted_goals' ? Number(value) : value } : s
    ))
  }

  const removeScorer = (index: number) => {
    setScorers(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !selectedMatchId) {
      setMessage({ text: 'Selecciona usuario y partido.', ok: false })
      return
    }
    setMessage(null)
    startTransition(async () => {
      const result = await adminSaveFullPrediction(selectedUserId, selectedMatchId, homeScore, awayScore, scorers.map(s => ({ player_id: s.player_id, predicted_goals: s.predicted_goals })))
        selectedUserId,
        selectedMatchId,
        homeScore,
        awayScore,
        scorers.filter(s => s.player_id)
      )
      if (result.error) {
        setMessage({ text: `Error: ${result.error}`, ok: false })
      } else {
        setMessage({ text: '✅ Predicción guardada correctamente.', ok: true })
        setScorers([])
      }
    })
  }

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
            onChange={e => handleMatchChange(e.target.value)}
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
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Marcador predicho</label>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold min-w-[36px] text-right">
                  {selectedMatch.home_team?.fifa_code ?? selectedMatch.home_placeholder ?? 'LOC'}
                </span>
                <input
                  type="number"
                  min={0} max={99}
                  value={homeScore}
                  onChange={e => setHomeScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-muted-foreground text-sm font-medium">–</span>
                <input
                  type="number"
                  min={0} max={99}
                  value={awayScore}
                  onChange={e => setAwayScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-bold min-w-[36px]">
                  {selectedMatch.away_team?.fifa_code ?? selectedMatch.away_placeholder ?? 'VIS'}
                </span>
              </div>
            </div>

            {/* Scorer predictions */}
            {matchPlayers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">⚽ Goleadores predichos</label>
                  <button
                    type="button"
                    onClick={addScorer}
                    className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </button>
                </div>

                {scorers.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sin goleadores predichos. Toca «Agregar» para añadir.</p>
                )}

                {scorers.map((entry, idx) => {
                  const entryPlayer = matchPlayers.find(p => p.id === entry.player_id)
                  const isHome = entryPlayer ? entryPlayer.team_id === selectedMatch.home_team_id : true
                  const teamPlayers = isHome ? homePlayers : awayPlayers

                  return (
                    <div key={idx} className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-2">
                      {/* Team side toggle */}
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const first = homePlayers[0]
                            if (first) updateScorer(idx, 'player_id', first.id)
                          }}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            entryPlayer?.team_id === selectedMatch.home_team_id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {selectedMatch.home_team?.fifa_code ?? 'LOC'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const first = awayPlayers[0]
                            if (first) updateScorer(idx, 'player_id', first.id)
                          }}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            entryPlayer?.team_id === selectedMatch.away_team_id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {selectedMatch.away_team?.fifa_code ?? 'VIS'}
                        </button>
                      </div>

                      {/* Player select */}
                      <select
                        value={entry.player_id}
                        onChange={e => updateScorer(idx, 'player_id', e.target.value)}
                        className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary min-w-0"
                      >
                        {teamPlayers.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.shirt_number ? `#${p.shirt_number} ` : ''}{p.name}
                            {p.position ? ` (${POSITION_LABEL[p.position] ?? p.position})` : ''}
                          </option>
                        ))}
                      </select>

                      {/* Goals */}
                      <input
                        type="number"
                        min={1} max={10}
                        value={entry.predicted_goals}
                        onChange={e => updateScorer(idx, 'predicted_goals', e.target.value)}
                        className="w-12 rounded-lg border border-border bg-background px-1.5 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-xs text-muted-foreground">gol{entry.predicted_goals !== 1 ? 'es' : ''}</span>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeScorer(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Goleadores */}
      {selectedMatchId && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-semibold text-sm">Goleadores (opcional)</h3>
          {loadingPlayers && <p className="text-xs text-gray-500">Cargando jugadores…</p>}
          {players.length > 0 && (
            <div className="flex gap-2 flex-wrap items-end">
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="border rounded px-2 py-1 text-sm flex-1 min-w-0"
              >
                <option value="">— Seleccionar jugador —</option>
                {Array.from(new Set(players.map((p) => p.fifa_code))).map((code) => (
                  <optgroup key={code} label={code}>
                    {players.filter((p) => p.fifa_code === code).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select
                value={selectedGoals}
                onChange={(e) => setSelectedGoals(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm w-20"
              >
                {[1, 2, 3, 4, 5].map((g) => (
                  <option key={g} value={g}>{g} gol{g > 1 ? 'es' : ''}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!selectedPlayerId) return
                  const player = players.find((p) => p.id === selectedPlayerId)
                  if (!player) return
                  setScorers((prev) => {
                    const existing = prev.find((s) => s.player_id === selectedPlayerId)
                    if (existing) return prev.map((s) => s.player_id === selectedPlayerId ? { ...s, predicted_goals: selectedGoals } : s)
                    return [...prev, { player_id: player.id, player_name: player.name, fifa_code: player.fifa_code, predicted_goals: selectedGoals }]
                  })
                  setSelectedPlayerId('')
                  setSelectedGoals(1)
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Agregar
              </button>
            </div>
          )}
          {scorers.length > 0 && (
            <ul className="space-y-1">
              {scorers.map((s) => (
                <li key={s.player_id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-sm">
                  <span><span className="font-medium text-xs text-gray-400 mr-1">{s.fifa_code}</span>{s.player_name} — {s.predicted_goals} gol{s.predicted_goals > 1 ? 'es' : ''}</span>
                  <button type="button" onClick={() => setScorers((prev) => prev.filter((x) => x.player_id !== s.player_id))} className="text-red-500 text-xs ml-2">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {message && (
          <p className={`text-sm font-medium rounded-lg px-3 py-2 ${
            message.ok
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-destructive/10 text-destructive'
          }`}>
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
