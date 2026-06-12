'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { isMatchLocked } from '@/lib/scoring'
import type { MatchWithPrediction } from '@/types'

interface MatchCardProps {
  match: MatchWithPrediction
}

function KickoffLabel({ utcIso }: { utcIso: string }) {
  const [label, setLabel] = useState<{ date: string; time: string } | null>(null)
  useEffect(() => {
    const d = new Date(utcIso)
    setLabel({
      date: d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    })
  }, [utcIso])
  if (!label) return <p className="text-xs text-muted-foreground">…</p>
  return (
    <>
      <p className="text-sm font-bold">{label.date}</p>
      <p className="text-xs text-muted-foreground">{label.time}</p>
    </>
  )
}

/** Approximate match minute derived from kickoff time */
function useLiveMinute(kickoffAt: string) {
  const [minute, setMinute] = useState<string>('')

  useEffect(() => {
    function calc() {
      const elapsed = (Date.now() - new Date(kickoffAt).getTime()) / 60_000
      if (elapsed <= 0) return setMinute('0\'')
      // First half: 0–45 min elapsed
      if (elapsed <= 45) return setMinute(`${Math.floor(elapsed)}'`)
      // Halftime break: 45–60 min elapsed
      if (elapsed <= 60) return setMinute('MT')
      // Second half: subtract 15min break
      const sh = elapsed - 15
      if (sh <= 90) return setMinute(`${Math.floor(sh)}'`)
      // Extra time
      if (elapsed <= 120) return setMinute(`${Math.floor(sh)}'`)
      // Should be over
      setMinute('90\'')
    }
    calc()
    const id = setInterval(calc, 30_000)
    return () => clearInterval(id)
  }, [kickoffAt])

  return minute
}

export function MatchCard({ match }: MatchCardProps) {
  const pred = match.my_prediction ?? null
  const locked = isMatchLocked(match.kickoff_at)

  const homeName = match.home_team?.fifa_code ?? match.home_placeholder ?? '?'
  const awayName = match.away_team?.fifa_code ?? match.away_placeholder ?? '?'
  const played = match.status === 'finished'
  const live = match.status === 'live'
  const liveMinute = useLiveMinute(match.kickoff_at)

  // First scorer prediction (enriched with player name via joined query)
  type EnrichedScorerPred = { id: string; player_id: string; player?: { name: string } | null }
  const scorerPred = (pred?.scorer_predictions as EnrichedScorerPred[] | undefined)?.[0]

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
        <div className="flex-shrink-0 text-center min-w-[80px]">
          {played ? (
            <div>
              <span className="text-xl font-black tabular-nums">{match.home_score} – {match.away_score}</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Final</p>
            </div>
          ) : live ? (
            <div>
              <span className="text-xl font-black tabular-nums text-green-500">{match.home_score ?? 0} – {match.away_score ?? 0}</span>
              <p className="text-[10px] text-green-500 font-bold mt-0.5 animate-pulse">
                {liveMinute ? `${liveMinute} · EN VIVO` : 'EN VIVO'}
              </p>
            </div>
          ) : (
            <div>
              <KickoffLabel utcIso={match.kickoff_at} />
            </div>
          )}

          {/* Score prediction */}
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

          {/* Scorer prediction */}
          {scorerPred?.player?.name && (
            <div className="mt-0.5 text-[9px] text-amber-500 bg-amber-500/10 rounded px-1.5 py-0.5 inline-block truncate max-w-[80px]">
              ⚽ {scorerPred.player.name.split(' ').pop()}
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


