import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Target, Zap, TrendingUp, Globe, Swords } from 'lucide-react'

export const revalidate = 0

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: snapshot }, { data: recentScores }, { data: globalPred }, { data: matchPreds }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase
      .from('leaderboard_snapshots')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('prediction_scores')
      .select('points, category, reason, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('global_predictions')
      .select(`
        submitted_at, updated_at,
        champion:teams!global_predictions_champion_team_id_fkey(name, fifa_code),
        runner_up:teams!global_predictions_runner_up_team_id_fkey(name, fifa_code),
        third_place:teams!global_predictions_third_place_team_id_fkey(name, fifa_code),
        golden_boot:players!global_predictions_golden_boot_player_id_fkey(name, position),
        golden_glove:players!global_predictions_golden_glove_player_id_fkey(name, position),
        golden_ball:players!global_predictions_golden_ball_player_id_fkey(name, position),
        best_young:players!global_predictions_best_young_player_id_fkey(name, position)
      `)
      .eq('user_id', id)
      .maybeSingle(),
    supabase
      .from('match_predictions')
      .select(`
        id, predicted_home_score, predicted_away_score, created_at,
        match:matches(
          id, match_number, phase, kickoff_at, status, home_score, away_score,
          home_team:teams!matches_home_team_id_fkey(name, fifa_code, flag_url),
          away_team:teams!matches_away_team_id_fkey(name, fifa_code, flag_url)
        )
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: true })
      .limit(104),
  ])

  if (!profile) notFound()

  return (
    <div className="space-y-4">
      <a href="/leaderboard" className="text-sm text-primary font-medium">← Ranking</a>

      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-2xl font-black overflow-hidden">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile.display_name[0].toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-xl font-black">{profile.display_name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {snapshot?.rank === 1 && <Badge variant="gold">👑 Líder</Badge>}
            {snapshot?.rank && <span className="text-sm text-muted-foreground">Posición #{snapshot.rank}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Puntos</p>
                <p className="text-3xl font-black mt-0.5 gradient-text">{snapshot?.total_points ?? 0}</p>
              </div>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Éxito</p>
                <p className="text-3xl font-black mt-0.5">{snapshot?.success_rate ?? 0}%</p>
              </div>
              <Target className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Exactos</p>
                <p className="text-3xl font-black mt-0.5">{snapshot?.exact_scores_count ?? 0}</p>
              </div>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pts goleadores</p>
                <p className="text-3xl font-black mt-0.5">{snapshot?.scorer_points ?? 0}</p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent scores */}
      {(recentScores?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle>Puntos recientes</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {recentScores!.map((s, i) => (
              <div key={i} className="flex items-start justify-between py-2 border-b border-border/40 last:border-0">
                <p className="text-sm text-muted-foreground flex-1 pr-3">{s.reason}</p>
                <Badge variant={s.points > 0 ? 'success' : 'outline'}>+{s.points}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Global predictions */}
      {globalPred && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Predicciones Globales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {([
              { label: '🥇 Campeón', val: (globalPred.champion as any)?.name },
              { label: '🥈 Subcampeón', val: (globalPred.runner_up as any)?.name },
              { label: '🥉 Tercer lugar', val: (globalPred.third_place as any)?.name },
              { label: '👟 Bota de Oro', val: (globalPred.golden_boot as any)?.name },
              { label: '🧤 Guante de Oro', val: (globalPred.golden_glove as any)?.name },
              { label: '⚽ Balón de Oro', val: (globalPred.golden_ball as any)?.name },
              { label: '⭐ Mejor joven', val: (globalPred.best_young as any)?.name },
            ] as { label: string; val?: string }[]).map(({ label, val }) =>
              val ? (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold">{val}</span>
                </div>
              ) : null
            )}
            {globalPred.submitted_at && (
              <p className="text-xs text-muted-foreground pt-2">
                Enviado el {new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(globalPred.submitted_at))}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Match predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" /> Predicciones de Partidos
            <span className="ml-auto text-sm font-normal text-muted-foreground">{matchPreds?.length ?? 0}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 pt-0">
          {(matchPreds?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Sin predicciones de partidos aún.</p>
          )}
          {(matchPreds ?? []).map((mp) => {
            const m = mp.match as any
            const finished = m?.status === 'finished'
            const hs = m?.home_score as number | null
            const as_ = m?.away_score as number | null
            const ph = mp.predicted_home_score as number
            const pa = mp.predicted_away_score as number

            // Determine outcome label/color
            let outcomeClass = 'border-border/30'
            let outcomeTag: string | null = null
            if (finished && hs !== null && as_ !== null) {
              if (ph === hs && pa === as_) {
                outcomeClass = 'border-l-4 border-l-emerald-500 bg-emerald-500/5'
                outcomeTag = 'Exacto'
              } else {
                const realOutcome = hs > as_ ? 'H' : as_ > hs ? 'A' : 'D'
                const predOutcome = ph > pa ? 'H' : pa > ph ? 'A' : 'D'
                if (realOutcome === predOutcome) {
                  outcomeClass = 'border-l-4 border-l-amber-500 bg-amber-500/5'
                  outcomeTag = 'Ganador'
                } else {
                  outcomeClass = 'border-l-4 border-l-red-500 bg-red-500/5'
                  outcomeTag = 'Fallo'
                }
              }
            } else if (m?.status === 'live') {
              outcomeClass = 'border-l-4 border-l-blue-500 bg-blue-500/5'
            }

            return (
              <div key={mp.id} className={`flex items-center gap-2 py-2.5 border-b border-border/20 last:border-0 rounded px-1 ${outcomeClass}`}>
                {/* Teams + predicted score */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground w-7 text-right flex-shrink-0">{m?.home_team?.fifa_code ?? '?'}</span>
                  <span className="font-black text-sm tabular-nums px-1.5 py-0.5 rounded bg-muted">
                    {ph} – {pa}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground w-7 flex-shrink-0">{m?.away_team?.fifa_code ?? '?'}</span>
                </div>

                {/* Real result (if finished) */}
                {finished && hs !== null && (
                  <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                    Real: {hs}–{as_}
                  </span>
                )}
                {m?.status === 'live' && (
                  <span className="text-[10px] font-bold text-blue-500 flex-shrink-0">EN VIVO</span>
                )}

                {/* Outcome badge */}
                {outcomeTag && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                    outcomeTag === 'Exacto' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                    outcomeTag === 'Ganador' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                    'bg-red-500/20 text-red-600 dark:text-red-400'
                  }`}>
                    {outcomeTag}
                  </span>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
