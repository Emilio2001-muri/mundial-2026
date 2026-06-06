'use client'

import { motion } from 'framer-motion'
import { phaseLabel } from '@/lib/utils'
import { isMatchLocked } from '@/lib/scoring'
import { MatchPredictionForm } from '@/components/matches/MatchPredictionForm'
import { LockCountdown } from '@/components/matches/LockCountdown'
import { ClientTime } from '@/components/ui/ClientTime'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MatchWithTeams, MatchPrediction, ScorerPrediction, Player, Lineup, MatchEvent } from '@/types'
import { MapPin } from 'lucide-react'

interface MatchDetailClientProps {
  match: MatchWithTeams
  prediction: (MatchPrediction & { scorer_predictions: ScorerPrediction[] }) | null
  events: MatchEvent[]
  homePlayers: Player[]
  awayPlayers: Player[]
  homeLineup: Lineup[]
  awayLineup: Lineup[]
}

export function MatchDetailClient({
  match,
  prediction,
  events,
  homePlayers,
  awayPlayers,
  homeLineup,
  awayLineup,
}: MatchDetailClientProps) {
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  return (
    <div className="space-y-4">
      {/* Back */}
      <a href="/matches" className="text-sm text-primary font-medium flex items-center gap-1">
        ← Partidos
      </a>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card glass>
          <CardContent className="py-5">
            {/* Phase label */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                {phaseLabel(match.phase)}
                {match.group_name && ` · Grupo ${match.group_name}`}
              </span>
              {isLive ? (
                <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  EN VIVO
                </span>
              ) : (
                <LockCountdown kickoffAt={match.kickoff_at} />
              )}
            </div>

            {/* Teams + Score */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                {match.home_team?.flag_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={match.home_team.flag_url} alt={match.home_team.name} className="w-16 h-11 object-cover rounded shadow-md" />
                ) : (
                  <div className="w-16 h-11 bg-muted rounded-lg flex items-center justify-center text-2xl">🏳️</div>
                )}
                <span className="font-bold text-sm text-center">{match.home_team?.name ?? match.home_placeholder ?? 'Por definir'}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                {isFinished || isLive ? (
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-black">{match.home_score ?? 0}</span>
                    <span className="text-muted-foreground text-xl">–</span>
                    <span className="text-4xl font-black">{match.away_score ?? 0}</span>
                  </div>
                ) : (
                  <ClientTime utcIso={match.kickoff_at} format="full" className="text-base font-bold text-muted-foreground" fallback="…" />
                )}
                {match.home_penalties !== null && (
                  <span className="text-xs text-muted-foreground">
                    Penales: {match.home_penalties} – {match.away_penalties}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                {match.away_team?.flag_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={match.away_team.flag_url} alt={match.away_team.name} className="w-16 h-11 object-cover rounded shadow-md" />
                ) : (
                  <div className="w-16 h-11 bg-muted rounded-lg flex items-center justify-center text-2xl">🏳️</div>
                )}
                <span className="font-bold text-sm text-center">{match.away_team?.name ?? match.away_placeholder ?? 'Por definir'}</span>
              </div>
            </div>

            {/* Venue */}
            {match.venue && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{match.venue.name} · {match.venue.city}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Events (if finished/live) */}
      {events.length > 0 && (isFinished || isLive) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="py-4">
              <h3 className="font-bold text-sm mb-3">Eventos del partido</h3>
              <div className="space-y-2">
                {events.filter((e) => ['goal', 'own_goal', 'penalty'].includes(e.event_type)).map((e) => (
                  <div key={e.id} className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-muted-foreground w-8 text-right font-mono">{e.minute}&apos;</span>
                    <span>{e.event_type === 'own_goal' ? '⚽ (AG)' : e.event_type === 'penalty' ? '⚽ (P)' : '⚽'}</span>
                    <span className="font-medium flex-1 truncate">Gol registrado</span>
                    {e.is_penalty && <Badge variant="warning" className="text-[9px]">Penal</Badge>}
                    {e.is_own_goal && <Badge variant="destructive" className="text-[9px]">A.G.</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Prediction form */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <MatchPredictionForm
          match={match}
          existingPrediction={prediction}
          homePlayers={homePlayers}
          awayPlayers={awayPlayers}
          homeLineup={homeLineup}
          awayLineup={awayLineup}
        />
      </motion.div>
    </div>
  )
}
