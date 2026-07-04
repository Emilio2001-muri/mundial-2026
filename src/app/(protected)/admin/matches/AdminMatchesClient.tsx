'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import type { Match, Team, Venue } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updateMatchResult, rebuildMatchesFromAPI, syncFixtures } from '@/app/actions/admin'
import { recalculateMatchScores } from '@/app/actions/scoring'
import { phaseLabel } from '@/lib/utils'
import { ClientTime } from '@/components/ui/ClientTime'
import { Edit, RefreshCw, Check, X, AlertTriangle, CheckCircle2, DatabaseZap, Goal, Trophy } from 'lucide-react'

interface AdminMatchesClientProps {
  matches: (Match & { home_team?: { fifa_code: string } | null; away_team?: { fifa_code: string } | null })[]
  teams: Pick<Team, 'id' | 'fifa_code' | 'name'>[]
  venues: Pick<Venue, 'id' | 'name' | 'city'>[]
}

export function AdminMatchesClient({ matches }: AdminMatchesClientProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [winnerTeamId, setWinnerTeamId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSyncing, startSync] = useTransition()
  const [isRebuilding, startRebuild] = useTransition()
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const handleRebuild = () => {
    if (!confirm('⚠️ Esto eliminará todos los partidos de fase de grupos y los reconstruirá desde la API de football-data.org con los equipos y horarios reales. ¿Continuar?')) return
    setMessage(null)
    startRebuild(async () => {
      const res = await rebuildMatchesFromAPI()
      if (res.error) {
        setMessage({ text: `Error: ${res.error}`, ok: false })
      } else {
        const skip = res.skipped?.length ? ` (${res.skipped.length} no encontrados: ${res.skipped.join(', ')})` : ''
        setMessage({ text: `✅ ${res.inserted} partidos importados desde la API.${skip}`, ok: true })
      }
    })
  }

  const handleSync = () => {
    setMessage(null)
    startSync(async () => {
      const res = await syncFixtures()
      if (res.error) {
        setMessage({ text: `Error sync: ${res.error}`, ok: false })
      } else {
        setMessage({ text: `✅ ${res.updated} marcadores actualizados de ${res.count} partidos.`, ok: true })
      }
    })
  }

  const startEdit = (match: Match & { home_team?: { fifa_code: string } | null; away_team?: { fifa_code: string } | null }) => {
    setEditingId(match.id)
    setHomeScore(match.home_score ?? 0)
    setAwayScore(match.away_score ?? 0)
    setWinnerTeamId(match.winner_team_id ?? null)
    setMessage(null)
  }

  const saveResult = (matchId: string) => {
    startTransition(async () => {
      setMessage(null)
      const isDraw = homeScore === awayScore
      const res = await updateMatchResult(matchId, homeScore, awayScore, isDraw ? winnerTeamId : null)
      if (res.error) {
        setMessage({ text: `Error: ${res.error}`, ok: false })
      } else {
        await recalculateMatchScores(matchId)
        setMessage({ text: 'Resultado guardado y puntos recalculados.', ok: true })
        setEditingId(null)
      }
    })
  }

  const statusColor: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
    scheduled: 'secondary',
    locked: 'warning',
    live: 'destructive',
    finished: 'success',
    postponed: 'warning',
  }

  return (
    <div className="space-y-4">
      <a href="/admin" className="text-sm text-primary font-medium">← Admin</a>
      <h1 className="text-xl font-black">Gestión de partidos</h1>

      {/* API sync buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="default"
          onClick={handleRebuild}
          loading={isRebuilding}
          className="flex items-center gap-2 text-sm"
        >
          <DatabaseZap className="w-4 h-4" />
          Importar desde API
        </Button>
        <Button
          variant="outline"
          onClick={handleSync}
          loading={isSyncing}
          className="flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar marcadores
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground px-1">
        "Importar desde API" reconstruye todos los partidos de grupos con los equipos y horarios reales del Mundial 2026. "Actualizar marcadores" sincroniza goles y estado en vivo.
      </p>

      {message && (
        <div className={`rounded-xl p-3 flex items-start gap-2 text-sm ${message.ok ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/10 border border-destructive/20 text-destructive'}`}>
          {message.ok
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          }
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        {matches.map((match) => (
          <Card key={match.id}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">
                      {match.home_team?.fifa_code ?? match.home_placeholder ?? '?'}
                      {' vs '}
                      {match.away_team?.fifa_code ?? match.away_placeholder ?? '?'}
                    </span>
                    <Badge variant={statusColor[match.status] ?? 'secondary'} className="text-[10px]">
                      {match.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {phaseLabel(match.phase)} · <ClientTime utcIso={match.kickoff_at} />
                  </p>
                  {match.status === 'finished' && (
                    <p className="text-sm font-bold mt-1">
                      {match.home_score} – {match.away_score}
                    </p>
                  )}
                </div>

                {editingId === match.id ? (
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={homeScore}
                        onChange={(e) => setHomeScore(Number(e.target.value))}
                        className="w-10 h-8 rounded-lg border border-input bg-muted/50 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <span className="text-muted-foreground">–</span>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={awayScore}
                        onChange={(e) => setAwayScore(Number(e.target.value))}
                        className="w-10 h-8 rounded-lg border border-input bg-muted/50 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <Button size="icon" variant="default" className="h-8 w-8" onClick={() => saveResult(match.id)} loading={isPending}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Winner selector for penalty-decided ties */}
                    {homeScore === awayScore && (
                      <div className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 space-y-1.5">
                        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Empate — ¿quién ganó por penales?
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setWinnerTeamId(match.home_team_id)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${winnerTeamId && winnerTeamId === match.home_team_id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-input hover:bg-muted'}`}
                          >
                            {match.home_team?.fifa_code ?? 'Local'} gana
                          </button>
                          <button
                            type="button"
                            onClick={() => setWinnerTeamId(null)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${!winnerTeamId ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-input hover:bg-muted'}`}
                          >
                            Empate real
                          </button>
                          <button
                            type="button"
                            onClick={() => setWinnerTeamId(match.away_team_id)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${winnerTeamId && winnerTeamId === match.away_team_id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-input hover:bg-muted'}`}
                          >
                            {match.away_team?.fifa_code ?? 'Visita'} gana
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Si eliges un ganador, quienes predijeron a ese equipo ganando reciben los 2 puntos de "ganador correcto".
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => startEdit(match)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                )}
                {/* Link to events page */}
                <a href={`/admin/matches/${match.id}`} className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
                  <Goal className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
