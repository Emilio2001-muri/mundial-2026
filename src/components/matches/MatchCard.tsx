'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { isMatchLocked } from '@/lib/scoring'
import type { MatchWithPrediction } from '@/types'
import { phaseLabel } from '@/lib/utils'

interface MatchCardProps {
  match: MatchWithPrediction
}

export function MatchCard({ match }: MatchCardProps) {
  const pred = match.my_prediction ?? null
  const locked = isMatchLocked(match.kickoff_at)
  const kickoff = new Date(match.kickoff_at)

  const homeName = match.home_team?.fifa_code ?? match.home_placeholder ?? '?'
  const awayName = match.away_team?.fifa_code ?? match.away_placeholder ?? '?'
  const played = match.status === 'finished'
  const live = match.status === 'live'

  return (
    <Link href={`/matches/${match.id}`} className="block">
      <div className={`rounded-xl border bg-card px-4 py-3 flex items-center gap-3 transition-colors hover:bg-muted/50 active:scale-[0.99] ${live ? 'border-green-500/40 bg-green-500/5' : 'border-border'}`}>
        {/* Home */}
        <div className="flex-1 flex flex-col items-end gap-0.5 min-w-0">
          {match.home_team?.flag_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.home_team.flag_url} alt={homeName} className="w-8 h-5 object-cover rounded-sm" />
          )}
          <span className="text-sm font-bold truncate">{homeName}</span>
        </div>

        {/* Score / Time */}
        <div className="flex-shrink-0 text-center min-w-[72px]">
          {played ? (
            <div>
              <span className="text-xl font-black tabular-nums">{match.home_score} – {match.away_score}</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Final</p>
            </div>
          ) : live ? (
            <div>
              <span className="text-xl font-black tabular-nums text-green-500">{match.home_score ?? 0} – {match.away_score ?? 0}</span>
              <p className="text-[10px] text-green-500 font-bold mt-0.5 animate-pulse">EN VIVO</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold">{kickoff.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}</p>
              <p className="text-xs text-muted-foreground">{kickoff.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )}

          {/* Prediction badge */}
          {pred && (
            <div className="mt-1 text-[10px] font-semibold text-primary bg-primary/10 rounded px-1.5 py-0.5 inline-block">
              {pred.predicted_home_score ?? '?'} – {pred.predicted_away_score ?? '?'}
            </div>
          )}
          {!pred && !locked && !played && (
            <div className="mt-1 text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 inline-block">
              Predecir
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex flex-col items-start gap-0.5 min-w-0">
          {match.away_team?.flag_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.away_team.flag_url} alt={awayName} className="w-8 h-5 object-cover rounded-sm" />
          )}
          <span className="text-sm font-bold truncate">{awayName}</span>
        </div>
      </div>
    </Link>
  )
}


import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatMatchTime, phaseLabel } from '@/lib/utils'
import { isMatchLocked } from '@/lib/scoring'
import { LockCountdown } from './LockCountdown'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { MatchWithPrediction } from '@/types'
import { CheckCircle2, XCircle, Minus } from 'lucide-react'

interface MatchCardProps {
  match: MatchWithPrediction
  userTimezone?: string
  showPrediction?: boolean
}

const statusColors: Record<string, string> = {
  scheduled: 'secondary',
  locked: 'warning',
  live: 'destructive',
  finished: 'outline',
  postponed: 'warning',
}

export function MatchCard({ match, userTimezone, showPrediction = true }: MatchCardProps) {
  const locked = isMatchLocked(match.kickoff_at)
  const pred = match.my_prediction
  const hasPred = pred?.predicted_home_score !== null && pred?.predicted_away_score !== null
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  const homeTeam = match.home_team
  const awayTeam = match.away_team

  return (
    <Link href={`/matches/${match.id}`}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', bounce: 0.1, duration: 0.2 }}
      >
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            {/* Phase / Status bar */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
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

            {/* Match row */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3">
              {/* Home team */}
              <div className="flex flex-col items-center gap-1 text-center">
                {homeTeam?.flag_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={homeTeam.flag_url} alt={homeTeam.name} className="w-10 h-7 object-cover rounded shadow" />
                ) : (
                  <div className="w-10 h-7 bg-muted rounded flex items-center justify-center text-lg">🏳️</div>
                )}
                <span className="text-xs font-semibold truncate max-w-[80px]">
                  {homeTeam?.fifa_code ?? match.home_placeholder ?? '?'}
                </span>
              </div>

              {/* Score / Time */}
              <div className="flex flex-col items-center gap-0.5 min-w-[80px]">
                {isFinished || isLive ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black">{match.home_score ?? 0}</span>
                    <span className="text-muted-foreground font-light">–</span>
                    <span className="text-2xl font-black">{match.away_score ?? 0}</span>
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">
                    {formatMatchTime(match.kickoff_at, userTimezone)}
                  </span>
                )}
                {isFinished && (pred?.score_breakdown?.total_points ?? 0) > 0 && (
                  <Badge variant="success" className="text-[10px]">
                    +{pred!.score_breakdown!.total_points} pts
                  </Badge>
                )}
              </div>

              {/* Away team */}
              <div className="flex flex-col items-center gap-1 text-center">
                {awayTeam?.flag_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={awayTeam.flag_url} alt={awayTeam.name} className="w-10 h-7 object-cover rounded shadow" />
                ) : (
                  <div className="w-10 h-7 bg-muted rounded flex items-center justify-center text-lg">🏳️</div>
                )}
                <span className="text-xs font-semibold truncate max-w-[80px]">
                  {awayTeam?.fifa_code ?? match.away_placeholder ?? '?'}
                </span>
              </div>
            </div>

            {/* Prediction row */}
            {showPrediction && (
              <div className="px-4 pb-3 border-t border-border/40 pt-2">
                {hasPred ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Tu predicción: <span className="font-semibold text-foreground">{pred!.predicted_home_score} – {pred!.predicted_away_score}</span>
                    </span>
                    {isFinished && (
                      <>
                        {(pred?.score_breakdown?.total_points ?? 0) > 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Minus className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {locked ? 'Sin predicción' : 'Pendiente de predicción'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}
