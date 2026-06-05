'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { globalPredictionFormSchema, type GlobalPredictionFormValues } from '@/types/forms'
import { saveGlobalPredictions } from '@/app/actions/global-predictions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PlayerCombobox } from '@/components/ui/PlayerCombobox'
import type { GlobalPrediction, Player, Team } from '@/types'
import { Check, AlertTriangle, Trophy, Star, Shield, Zap, Award } from 'lucide-react'
import { haptic } from '@/lib/utils'

interface GlobalPredictionsClientProps {
  existingPrediction: GlobalPrediction | null
  teams: Team[]
  players: Player[]
  locked: boolean
}

// Team combobox (reuses PlayerCombobox style but for teams)
function TeamCombobox({
  teams, value, onChange, placeholder,
}: { teams: Team[]; value: string | null; onChange: (v: string | null) => void; placeholder: string }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = teams.find(t => t.id === value) ?? null

  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const filtered = search.trim()
    ? teams.filter(t => normalize(t.name).includes(normalize(search)) || normalize(t.fifa_code).includes(normalize(search)))
    : teams

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors cursor-pointer
          ${open ? 'border-ring ring-1 ring-ring' : 'border-input'} bg-background hover:bg-muted/50`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selected?.flag_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.flag_url} alt={selected.fifa_code} className="w-6 h-4 object-cover rounded-sm flex-shrink-0" />
          )}
          <span className={selected ? 'font-medium' : 'text-muted-foreground'}>{selected?.name ?? placeholder}</span>
        </div>
        <span className="text-muted-foreground text-xs flex-shrink-0">▼</span>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar equipo…"
              className="w-full text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</li>}
            {filtered.map(t => (
              <li key={t.id}>
                <button type="button"
                  onClick={() => { onChange(t.id === value ? null : t.id); setOpen(false); setSearch('') }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors ${t.id === value ? 'bg-primary/10 text-primary font-semibold' : ''}`}
                >
                  {t.flag_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.flag_url} alt={t.fifa_code} className="w-6 h-4 object-cover rounded-sm flex-shrink-0" />
                  )}
                  <span>{t.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{t.fifa_code}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function GlobalPredictionsClient({
  existingPrediction, teams, players, locked,
}: GlobalPredictionsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtered player lists by position
  const goalkeepers = players.filter(p => p.position === 'GK')
  const outfield = players.filter(p => p.position !== 'GK')
  const forwards = players.filter(p => p.position === 'FW')
  // "Young player" = born after 2002 — we don't have birth dates so just use all outfield
  const youngPlayers = outfield

  const { control, handleSubmit, formState: { isDirty } } = useForm<GlobalPredictionFormValues>({
    resolver: zodResolver(globalPredictionFormSchema),
    defaultValues: {
      champion_team_id: existingPrediction?.champion_team_id ?? null,
      runner_up_team_id: existingPrediction?.runner_up_team_id ?? null,
      third_place_team_id: existingPrediction?.third_place_team_id ?? null,
      finalist_one_team_id: existingPrediction?.finalist_one_team_id ?? null,
      finalist_two_team_id: existingPrediction?.finalist_two_team_id ?? null,
      golden_ball_player_id: existingPrediction?.golden_ball_player_id ?? null,
      silver_ball_player_id: existingPrediction?.silver_ball_player_id ?? null,
      bronze_ball_player_id: existingPrediction?.bronze_ball_player_id ?? null,
      golden_boot_player_id: existingPrediction?.golden_boot_player_id ?? null,
      golden_glove_player_id: existingPrediction?.golden_glove_player_id ?? null,
      best_young_player_id: existingPrediction?.best_young_player_id ?? null,
    },
  })

  const onSubmit = async (values: GlobalPredictionFormValues) => {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveGlobalPredictions('', values)
      if (result?.error) { setError(result.error) }
      else { setSaved(true); haptic('medium'); setTimeout(() => setSaved(false), 3000) }
    })
  }

  const sections = [
    {
      title: 'Equipos clasificados',
      icon: <Trophy className="w-4 h-4 text-yellow-500" />,
      fields: [
        { name: 'champion_team_id' as const,      label: 'Campeón',         pts: '+5 pts', isTeam: true },
        { name: 'runner_up_team_id' as const,     label: 'Subcampeón',      pts: '+3 pts', isTeam: true },
        { name: 'third_place_team_id' as const,   label: 'Tercer lugar',    pts: '+2 pts', isTeam: true },
        { name: 'finalist_one_team_id' as const,  label: 'Finalista A',     pts: '+5 pts', isTeam: true },
        { name: 'finalist_two_team_id' as const,  label: 'Finalista B',     pts: '+5 pts', isTeam: true },
      ],
    },
    {
      title: 'Balones',
      icon: <Star className="w-4 h-4 text-blue-400" />,
      fields: [
        { name: 'golden_ball_player_id' as const,  label: '🥇 Balón de Oro',   pts: '+5 pts', players: outfield },
        { name: 'silver_ball_player_id' as const,  label: '🥈 Balón de Plata', pts: '+2 pts', players: outfield },
        { name: 'bronze_ball_player_id' as const,  label: '🥉 Balón de Bronce',pts: '+1 pt',  players: outfield },
      ],
    },
    {
      title: 'Premios individuales',
      icon: <Award className="w-4 h-4 text-orange-400" />,
      fields: [
        { name: 'golden_boot_player_id' as const,  label: '👟 Bota de Oro (goleador)', pts: '+3 pts', players: forwards.length > 0 ? forwards : outfield },
        { name: 'golden_glove_player_id' as const, label: '🧤 Guante de Oro (portero)', pts: '+3 pts', players: goalkeepers },
        { name: 'best_young_player_id' as const,   label: '⭐ Mejor jugador joven',    pts: '+3 pts', players: youngPlayers },
      ],
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black">Predicciones Globales</h1>
        <p className="text-sm text-muted-foreground">Se cierran al inicio del torneo · 11 jun 2026</p>
      </div>

      {locked && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-destructive font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Las predicciones globales están cerradas.
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {sections.map(section => (
          <Card key={section.title}>
            <CardContent className="py-4 space-y-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                {section.icon} {section.title}
              </h2>
              {section.fields.map(field => (
                <div key={field.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{field.pts}</span>
                  </div>
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: f }) => (
                      ('isTeam' in field) ? (
                        <TeamCombobox
                          teams={teams}
                          value={f.value as string | null}
                          onChange={f.onChange}
                          placeholder="Seleccionar equipo…"
                        />
                      ) : (
                        <PlayerCombobox
                          players={('players' in field ? field.players : undefined) ?? outfield}
                          value={f.value as string | null}
                          onChange={f.onChange}
                          placeholder="Buscar jugador…"
                          disabled={locked}
                        />
                      )
                    )}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </p>
        )}

        {!locked && (
          <Button type="submit" variant="gradient" size="lg" className="w-full"
            loading={isPending} disabled={!isDirty && !!existingPrediction}>
            {saved ? <><Check className="w-4 h-4" /> Predicciones guardadas</> : existingPrediction ? 'Actualizar predicciones' : 'Guardar predicciones globales'}
          </Button>
        )}
      </form>
    </div>
  )
}
