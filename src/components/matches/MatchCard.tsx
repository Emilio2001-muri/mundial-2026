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


