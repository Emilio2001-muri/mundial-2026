'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { addMatchEvent, deleteMatchEvent, syncMatchEvents } from '@/app/actions/admin'
import { Plus, Trash2, Goal, RefreshCw } from 'lucide-react'

interface Player { id: string; name: string; position: string | null; team_id: string }
interface Team { id: string; name: string; fifa_code: string }
interface Event {
  id: string; event_type: string; minute: number; is_own_goal: boolean
  player: { id: string; name: string } | null
  team: { id: string; fifa_code: string } | null
}
interface Match {
  id: string; match_number: number; home_score: number | null; away_score: number | null; status: string
  home_team: Team | null; away_team: Team | null
}

interface MatchEventsClientProps {
  match: Match
  events: Event[]
  players: Player[]
}

export function MatchEventsClient({ match, events: initialEvents, players }: MatchEventsClientProps) {
  const [events, setEvents] = useState(initialEvents)
  const [minute, setMinute] = useState(1)
  const [teamId, setTeamId] = useState(match.home_team?.id ?? '')
  const [playerId, setPlayerId] = useState('')
  const [eventType, setEventType] = useState('goal')
  const [isOwnGoal, setIsOwnGoal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isSyncing, startSyncTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [syncDebug, setSyncDebug] = useState<string | null>(null)

  const teamPlayers = players.filter(p => p.team_id === teamId)

  const handleSync = () => {
    setSyncDebug(null)
    startSyncTransition(async () => {
      const res = await syncMatchEvents(match.id)
      if (res.error && !res.goalsFromApi) {
        setMessage({ text: res.error, ok: false })
      } else if (res.apiGoals === 0) {
        setMessage({ text: `API OK pero sin goles devueltos (external_id: ${res.externalId ?? 'null'})`, ok: false })
      } else {
        setMessage({ text: `✓ Sincronizados ${res.inserted} goles desde la API. external_id: ${res.externalId}`, ok: true })
        if (res.goalsFromApi?.length) {
          setSyncDebug(res.goalsFromApi.map(g => `${g.minute}' ${g.team} — ${g.scorer} [${g.type}]`).join('\n'))
        }
        window.location.reload()
      }
    })
  }

  const handleAdd = () => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('match_id', match.id)
      fd.set('team_id', teamId)
      fd.set('player_id', playerId)
      fd.set('event_type', eventType)
      fd.set('minute', String(minute))
      fd.set('is_own_goal', String(isOwnGoal))
      const res = await addMatchEvent(fd)
      if (res.error) {
        setMessage({ text: res.error, ok: false })
      } else {
        setMessage({ text: 'Evento añadido y puntos recalculados.', ok: true })
        // Optimistic: reload page data by refreshing
        window.location.reload()
      }
    })
  }

  const handleDelete = (eventId: string) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('event_id', eventId)
      fd.set('match_id', match.id)
      const res = await deleteMatchEvent(fd)
      if (res.error) {
        setMessage({ text: res.error, ok: false })
      } else {
        setEvents(prev => prev.filter(e => e.id !== eventId))
        setMessage({ text: 'Evento eliminado y puntos recalculados.', ok: true })
      }
    })
  }

  const goals = events.filter(e => ['goal', 'penalty', 'own_goal'].includes(e.event_type))

  return (
    <div className="space-y-4">
      <a href="/admin/matches" className="text-sm text-primary font-medium">← Partidos</a>
      <h1 className="text-xl font-black">
        P{match.match_number} · {match.home_team?.fifa_code} {match.home_score ?? '?'} – {match.away_score ?? '?'} {match.away_team?.fifa_code}
      </h1>

      {message && (
        <div className={`rounded-xl p-3 text-sm ${message.ok ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
          {message.text}
        </div>
      )}

      {/* Auto-sync from API */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" /> Sincronizar goles desde API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Obtiene los goles de football-data.org y los guarda automáticamente. No borra eventos manuales.</p>
          <Button onClick={handleSync} loading={isSyncing} variant="outline" className="w-full">
            <RefreshCw className="w-4 h-4" /> Sincronizar goles (API)
          </Button>
          {syncDebug && (
            <pre className="text-[10px] text-muted-foreground bg-muted rounded p-2 whitespace-pre-wrap">{syncDebug}</pre>
          )}
        </CardContent>
      </Card>

      {/* Add event form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Agregar evento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Tipo</label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-muted text-sm focus:outline-none"
              >
                <option value="goal">⚽ Gol</option>
                <option value="penalty">🎯 Penalti</option>
                <option value="own_goal">🔙 Autogol</option>
                <option value="yellow_card">🟨 T. Amarilla</option>
                <option value="red_card">🟥 T. Roja</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Minuto</label>
              <input
                type="number"
                min={1}
                max={120}
                value={minute}
                onChange={e => setMinute(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-muted text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Equipo</label>
            <select
              value={teamId}
              onChange={e => { setTeamId(e.target.value); setPlayerId('') }}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-muted text-sm focus:outline-none"
            >
              {match.home_team && <option value={match.home_team.id}>{match.home_team.name} ({match.home_team.fifa_code})</option>}
              {match.away_team && <option value={match.away_team.id}>{match.away_team.name} ({match.away_team.fifa_code})</option>}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Jugador (opcional)</label>
            <select
              value={playerId}
              onChange={e => setPlayerId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-muted text-sm focus:outline-none"
            >
              <option value="">— Sin jugador específico —</option>
              {teamPlayers
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                ))}
            </select>
          </div>

          <Button onClick={handleAdd} loading={isPending} className="w-full">
            Añadir evento + recalcular puntos
          </Button>
        </CardContent>
      </Card>

      {/* Events list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Goal className="w-4 h-4" /> Eventos registrados ({events.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Sin eventos aún.</p>
          )}
          {events.map(ev => (
            <div key={ev.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-muted-foreground w-8 flex-shrink-0">{ev.minute}&apos;</span>
                <span className="text-xs font-semibold">{ev.team?.fifa_code}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {ev.event_type === 'goal' ? '⚽' : ev.event_type === 'penalty' ? '🎯' : ev.event_type === 'own_goal' ? '🔙' : ev.event_type === 'yellow_card' ? '🟨' : '🟥'}
                  {ev.player ? ` ${ev.player.name}` : ''}
                  {ev.is_own_goal ? ' (autogol)' : ''}
                </span>
              </div>
              <button
                onClick={() => handleDelete(ev.id)}
                disabled={isPending}
                className="text-destructive/60 hover:text-destructive flex-shrink-0 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Goal summary */}
      {goals.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4">
            <p className="text-xs font-bold mb-2">Resumen de goles</p>
            {goals.map(g => (
              <p key={g.id} className="text-xs text-muted-foreground">
                {g.minute}&apos; {g.team?.fifa_code} — {g.player?.name ?? 'Desconocido'}{g.is_own_goal ? ' (AG)' : ''}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
