'use client'

import { useTransition, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { globalPredictionFormSchema, type GlobalPredictionFormValues } from '@/types/forms'
import type { Team, Player, GlobalPrediction, Tournament } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { saveGlobalPredictions } from '@/app/actions/global-predictions'
import { Check, Lock, AlertTriangle } from 'lucide-react'
import { formatMatchTime } from '@/lib/utils'

interface GlobalPredictionsClientProps {
  tournament: Tournament | null
  teams: Team[]
  players: Player[]
  existing: GlobalPrediction | null
  locked: boolean
}

const TEAM_FIELDS: Array<{ key: keyof GlobalPredictionFormValues; label: string; emoji: string; points: number }> = [
  { key: 'champion_team_id', label: 'Campeón', emoji: '🏆', points: 5 },
  { key: 'runner_up_team_id', label: 'Subcampeón', emoji: '🥈', points: 3 },
  { key: 'third_place_team_id', label: 'Tercer lugar', emoji: '🥉', points: 2 },
  { key: 'finalist_one_team_id', label: 'Finalista A', emoji: '⚽', points: 5 },
  { key: 'finalist_two_team_id', label: 'Finalista B', emoji: '⚽', points: 5 },
]

const PLAYER_FIELDS: Array<{ key: keyof GlobalPredictionFormValues; label: string; emoji: string; points: number }> = [
  { key: 'golden_ball_player_id', label: 'Balón de Oro', emoji: '🏅', points: 5 },
  { key: 'silver_ball_player_id', label: 'Balón de Plata', emoji: '🥈', points: 2 },
  { key: 'bronze_ball_player_id', label: 'Balón de Bronce', emoji: '🥉', points: 1 },
  { key: 'golden_boot_player_id', label: 'Bota de Oro', emoji: '👟', points: 3 },
  { key: 'golden_glove_player_id', label: 'Guante de Oro', emoji: '🥊', points: 3 },
  { key: 'best_young_player_id', label: 'Mejor jugador joven', emoji: '⭐', points: 3 },
]

export function GlobalPredictionsClient({ tournament, teams, players, existing, locked }: GlobalPredictionsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { control, handleSubmit, watch } = useForm<GlobalPredictionFormValues>({
    resolver: zodResolver(globalPredictionFormSchema),
    defaultValues: {
      champion_team_id: existing?.champion_team_id ?? null,
      runner_up_team_id: existing?.runner_up_team_id ?? null,
      third_place_team_id: existing?.third_place_team_id ?? null,
      finalist_one_team_id: existing?.finalist_one_team_id ?? null,
      finalist_two_team_id: existing?.finalist_two_team_id ?? null,
      golden_ball_player_id: existing?.golden_ball_player_id ?? null,
      silver_ball_player_id: existing?.silver_ball_player_id ?? null,
      bronze_ball_player_id: existing?.bronze_ball_player_id ?? null,
      golden_boot_player_id: existing?.golden_boot_player_id ?? null,
      golden_glove_player_id: existing?.golden_glove_player_id ?? null,
      best_young_player_id: existing?.best_young_player_id ?? null,
    },
  })

  const onSubmit = async (values: GlobalPredictionFormValues) => {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveGlobalPredictions(tournament?.id ?? '', values)
      if (result.error) setError(result.error)
      else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-black">Predicciones Globales</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Puntos por acertar campeón, premios individuales y más
        </p>
      </motion.div>

      {locked && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive font-medium">Predicciones globales bloqueadas.</p>
          </CardContent>
        </Card>
      )}

      {tournament && (
        <p className="text-xs text-muted-foreground">
          Cierre: {formatMatchTime(tournament.global_predictions_lock_at, undefined, 'full')}
        </p>
      )}

      {/* Team predictions */}
      <Card>
        <CardHeader><CardTitle>Equipos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {TEAM_FIELDS.map(({ key, label, emoji, points }) => (
            <Controller
              key={key}
              name={key}
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <span>{emoji}</span> {label}
                    </label>
                    <Badge variant="default" className="text-[10px]">+{points} pts</Badge>
                  </div>
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    disabled={locked}
                    className="w-full h-10 rounded-xl border border-input bg-muted/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">Seleccionar equipo…</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.fifa_code})</option>
                    ))}
                  </select>
                </div>
              )}
            />
          ))}
        </CardContent>
      </Card>

      {/* Player predictions */}
      <Card>
        <CardHeader><CardTitle>Premios individuales</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {PLAYER_FIELDS.map(({ key, label, emoji, points }) => (
            <Controller
              key={key}
              name={key}
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <span>{emoji}</span> {label}
                    </label>
                    <Badge variant="default" className="text-[10px]">+{points} pts</Badge>
                  </div>
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    disabled={locked}
                    className="w-full h-10 rounded-xl border border-input bg-muted/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">Seleccionar jugador…</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            />
          ))}
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </p>
      )}

      {!locked && (
        <Button type="submit" variant={saved ? 'secondary' : 'gradient'} size="lg" className="w-full" loading={isPending}>
          {saved ? <><Check className="w-4 h-4" /> Guardado</> : 'Guardar predicciones globales'}
        </Button>
      )}
    </form>
  )
}
