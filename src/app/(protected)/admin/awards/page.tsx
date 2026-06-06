import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { saveTournamentAwards } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const revalidate = 0

const TOURNAMENT_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

export default async function AdminAwardsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: tournament }, { data: teams }, batch1, batch2] = await Promise.all([
    admin.from('tournaments').select('*').eq('id', TOURNAMENT_ID).single(),
    admin.from('teams').select('id, name, fifa_code').order('name'),
    admin.from('players').select('id, name, position, team_id').range(0, 999),
    admin.from('players').select('id, name, position, team_id').range(1000, 1999),
  ])

  const players = [...(batch1.data ?? []), ...(batch2.data ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  const outfield = players.filter(p => p.position !== 'GK')
  const goalkeepers = players.filter(p => p.position === 'GK')

  const teamSelect = (name: string, current: string | null) => (
    <select name={name} defaultValue={current ?? ''} className="w-full px-3 py-2 rounded-lg border border-input bg-muted text-sm focus:outline-none">
      <option value="">— Sin definir —</option>
      {(teams ?? []).map((t: any) => (
        <option key={t.id} value={t.id}>{t.name} ({t.fifa_code})</option>
      ))}
    </select>
  )

  const playerSelect = (name: string, current: string | null, list: typeof players) => (
    <select name={name} defaultValue={current ?? ''} className="w-full px-3 py-2 rounded-lg border border-input bg-muted text-sm focus:outline-none">
      <option value="">— Sin definir —</option>
      {list.map(p => (
        <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
      ))}
    </select>
  )

  return (
    <div className="space-y-4">
      <a href="/admin" className="text-sm text-primary font-medium">← Admin</a>
      <h1 className="text-xl font-black">🏆 Premios del Torneo</h1>
      <p className="text-sm text-muted-foreground">
        Al guardar, se recalculan automáticamente los puntos de predicciones globales de todos los participantes.
      </p>

      <form action={saveTournamentAwards} className="space-y-4">
        {/* Equipos */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">🥇 Clasificación de equipos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-semibold block mb-1">Campeón (+5 pts)</label>
              {teamSelect('champion_team_id', tournament?.champion_team_id)}
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold block mb-1">Subcampeón (+3 pts)</label>
              {teamSelect('runner_up_team_id', tournament?.runner_up_team_id)}
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold block mb-1">Tercer lugar (+2 pts)</label>
              {teamSelect('third_place_team_id', tournament?.third_place_team_id)}
            </div>
          </CardContent>
        </Card>

        {/* Balones */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">⭐ Balones</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-semibold block mb-1">Balón de Oro (+5 pts)</label>
              {playerSelect('golden_ball_player_id', tournament?.golden_ball_player_id, outfield)}
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold block mb-1">Balón de Plata (+2 pts)</label>
              {playerSelect('silver_ball_player_id', tournament?.silver_ball_player_id, outfield)}
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold block mb-1">Balón de Bronce (+1 pt)</label>
              {playerSelect('bronze_ball_player_id', tournament?.bronze_ball_player_id, outfield)}
            </div>
          </CardContent>
        </Card>

        {/* Premios individuales */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">🎖️ Premios individuales</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-semibold block mb-1">Bota de Oro — goleador (+3 pts)</label>
              {playerSelect('golden_boot_player_id', tournament?.golden_boot_player_id, outfield)}
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold block mb-1">Guante de Oro — portero (+3 pts)</label>
              {playerSelect('golden_glove_player_id', tournament?.golden_glove_player_id, goalkeepers)}
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold block mb-1">Mejor jugador joven (+3 pts)</label>
              {playerSelect('best_young_player_id', tournament?.best_young_player_id, outfield)}
            </div>
          </CardContent>
        </Card>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          Guardar premios + recalcular puntos globales
        </button>
      </form>
    </div>
  )
}
