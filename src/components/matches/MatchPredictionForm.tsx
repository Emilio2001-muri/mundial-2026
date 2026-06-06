'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { predictionFormSchema, type PredictionFormValues } from '@/types/forms'
import { isMatchLocked } from '@/lib/scoring'
import { LockCountdown } from './LockCountdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PlayerCombobox } from '@/components/ui/PlayerCombobox'
import type { MatchWithTeams, MatchPrediction, ScorerPrediction, Player, Lineup } from '@/types'
import { savePrediction } from '@/app/actions/predictions'
import { Check, AlertTriangle } from 'lucide-react'
import { haptic } from '@/lib/utils'

interface MatchPredictionFormProps {
  match: MatchWithTeams
  existingPrediction: (MatchPrediction & { scorer_predictions: ScorerPrediction[] }) | null
  homePlayers: Player[]
  awayPlayers: Player[]
  homeLineup: Lineup[]
  awayLineup: Lineup[]
}

export function MatchPredictionForm({
  match,
  existingPrediction,
  homePlayers,
  awayPlayers,
  homeLineup,
  awayLineup,
}: MatchPredictionFormProps) {
  const locked = isMatchLocked(match.kickoff_at)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = useForm<PredictionFormValues>({
    resolver: zodResolver(predictionFormSchema),
    defaultValues: {
      predicted_home_score: existingPrediction?.predicted_home_score ?? 0,
      predicted_away_score: existingPrediction?.predicted_away_score ?? 0,
      predicted_winner_team_id: existingPrediction?.predicted_winner_team_id ?? null,
      predicted_draw: existingPrediction?.predicted_draw ?? null,
      comment: existingPrediction?.comment ?? '',
      scorer_predictions:
        existingPrediction?.scorer_predictions?.map((sp) => ({
          player_id: sp.player_id,
          predicted_goals: sp.predicted_goals,
        })) ?? [],
    },
  })

  const onSubmit = async (values: PredictionFormValues) => {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await savePrediction(match.id, values)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        haptic('medium')
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Tu predicción</h2>
        <LockCountdown kickoffAt={match.kickoff_at} />
      </div>

      {locked && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-destructive font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Las predicciones están bloqueadas para este partido.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Score inputs */}
      <Card>
        <CardContent className="py-5">
          <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-3">
            {/* Home */}
            <div className="flex flex-col items-center gap-2">
              {match.home_team?.flag_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.home_team.flag_url} alt={match.home_team.name} className="w-12 h-8 object-cover rounded shadow" />
              ) : (
                <div className="w-12 h-8 bg-muted rounded" />
              )}
              <span className="text-sm font-bold">{match.home_team?.fifa_code ?? 'LOCAL'}</span>
              <Controller
                name="predicted_home_score"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min={0}
                    max={99}
                    disabled={locked}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="score-input bg-muted rounded-xl border border-input focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                )}
              />
            </div>

            <span className="text-2xl font-light text-muted-foreground text-center">–</span>

            {/* Away */}
            <div className="flex flex-col items-center gap-2">
              {match.away_team?.flag_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.away_team.flag_url} alt={match.away_team.name} className="w-12 h-8 object-cover rounded shadow" />
              ) : (
                <div className="w-12 h-8 bg-muted rounded" />
              )}
              <span className="text-sm font-bold">{match.away_team?.fifa_code ?? 'VISITA'}</span>
              <Controller
                name="predicted_away_score"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min={0}
                    max={99}
                    disabled={locked}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="score-input bg-muted rounded-xl border border-input focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scorer predictions – per-team combobox */}
      {!locked && (
        <Controller
          name="scorer_predictions"
          control={control}
          render={({ field }) => {
            const entries: ScorerEntry[] = field.value ?? []
            const homeScore = watch('predicted_home_score') ?? 0
            const awayScore = watch('predicted_away_score') ?? 0

            const setTeamScorer = (teamPlayers: Player[], playerId: string | null) => {
              const teamIds = new Set(teamPlayers.map((p) => p.id))
              const others = entries.filter((e) => !teamIds.has(e.player_id))
              if (playerId) {
                field.onChange([...others, { player_id: playerId, predicted_goals: 1 }])
              } else {
                field.onChange(others)
              }
              haptic('light')
            }

            const getTeamValue = (teamPlayers: Player[]): string | null => {
              const teamIds = new Set(teamPlayers.map((p) => p.id))
              return entries.find((e) => teamIds.has(e.player_id))?.player_id ?? null
            }

            const showHome = homePlayers.length > 0 && homeScore > 0
            const showAway = awayPlayers.length > 0 && awayScore > 0

            if (!showHome && !showAway) return <></>

            return (
              <Card>
                <CardContent className="py-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm">Goleadores predichos</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">1 punto por gol acertado</p>
                  </div>
                  {showHome && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {match.home_team?.name ?? 'Local'} · {match.home_team?.fifa_code}
                      </p>
                      <PlayerCombobox
                        players={homePlayers}
                        value={getTeamValue(homePlayers)}
                        onChange={(id) => setTeamScorer(homePlayers, id)}
                        placeholder={`Goleador de ${match.home_team?.fifa_code ?? 'Local'}…`}
                      />
                    </div>
                  )}
                  {showAway && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {match.away_team?.name ?? 'Visita'} · {match.away_team?.fifa_code}
                      </p>
                      <PlayerCombobox
                        players={awayPlayers}
                        value={getTeamValue(awayPlayers)}
                        onChange={(id) => setTeamScorer(awayPlayers, id)}
                        placeholder={`Goleador de ${match.away_team?.fifa_code ?? 'Visita'}…`}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          }}
        />
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </p>
      )}

      {/* Submit */}
      {!locked && (
        <Button
          type="submit"
          variant={saved ? 'secondary' : 'gradient'}
          size="lg"
          className="w-full"
          loading={isPending}
          disabled={!isDirty && !!existingPrediction}
        >
          {saved ? (
            <><Check className="w-4 h-4" /> Predicción guardada</>
          ) : existingPrediction ? (
            'Actualizar predicción'
          ) : (
            'Guardar predicción'
          )}
        </Button>
      )}
    </form>
  )
}

// ── Local types ──────────────────────────────────────────────────────────────
type ScorerEntry = { player_id: string; predicted_goals: number }
