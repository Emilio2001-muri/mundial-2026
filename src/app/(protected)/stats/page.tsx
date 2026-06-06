import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const revalidate = 0

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: topScorers }, { data: teams }, { data: matches }, { data: gkPlayers }] = await Promise.all([
    // Players who scored goals
    supabase
      .from('match_events')
      .select('player_id, players(name, team_id, teams:team_id(name, fifa_code, flag_url))')
      .in('event_type', ['goal', 'penalty'])
      .eq('is_own_goal', false),
    supabase.from('teams').select('id, name, fifa_code, flag_url'),
    supabase.from('matches').select('id, home_team_id, away_team_id, home_score, away_score, status').eq('status', 'finished'),
    supabase.from('players').select('id, name, team_id, teams:team_id(name, fifa_code, flag_url)').eq('position', 'GK'),
  ])

  // Aggregate goals per player
  type ScorerAcc = Record<string, { name: string; teamName: string; teamFlag: string | null; goals: number }>
  const scorerMap: ScorerAcc = {}
  for (const ev of topScorers ?? []) {
    const evTyped = ev as unknown as {
      player_id: string | null
      players: { name: string; team_id: string; teams: { name: string; fifa_code: string; flag_url: string | null } | null } | null
    }
    if (!evTyped.player_id || !evTyped.players) continue
    const key = evTyped.player_id
    if (!scorerMap[key]) {
      scorerMap[key] = {
        name: evTyped.players.name,
        teamName: evTyped.players.teams?.fifa_code ?? '',
        teamFlag: evTyped.players.teams?.flag_url ?? null,
        goals: 0,
      }
    }
    scorerMap[key].goals++
  }

  const topScorersList = Object.values(scorerMap)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10)

  // Goals per team
  type TeamGoals = Record<string, { name: string; code: string; flag: string | null; goalsFor: number; goalsAgainst: number }>
  const teamGoals: TeamGoals = {}
  for (const t of teams ?? []) {
    teamGoals[t.id] = { name: t.name, code: t.fifa_code, flag: t.flag_url, goalsFor: 0, goalsAgainst: 0 }
  }
  for (const m of matches ?? []) {
    if (m.home_team_id && teamGoals[m.home_team_id]) {
      teamGoals[m.home_team_id].goalsFor += m.home_score ?? 0
      teamGoals[m.home_team_id].goalsAgainst += m.away_score ?? 0
    }
    if (m.away_team_id && teamGoals[m.away_team_id]) {
      teamGoals[m.away_team_id].goalsFor += m.away_score ?? 0
      teamGoals[m.away_team_id].goalsAgainst += m.home_score ?? 0
    }
  }
  const teamList = Object.values(teamGoals).filter((t) => t.goalsFor + t.goalsAgainst > 0)
  const bestAttack = [...teamList].sort((a, b) => b.goalsFor - a.goalsFor).slice(0, 5)
  const bestDefense = [...teamList].sort((a, b) => a.goalsAgainst - b.goalsAgainst).slice(0, 5)
  const totalGoals = teamList.reduce((sum, t) => sum + t.goalsFor, 0)
  const matchesPlayed = (matches ?? []).length

  // GK goals conceded per team (one GK per team — first alphabetically)
  type GKEntry = { id: string; name: string; teamName: string; teamCode: string; teamFlag: string | null; conceded: number; matchesPlayed: number }
  const gkByTeam = new Map<string, GKEntry>()
  for (const gk of gkPlayers ?? []) {
    const g = gk as unknown as { id: string; name: string; team_id: string; teams: { name: string; fifa_code: string; flag_url: string | null } | null }
    if (gkByTeam.has(g.team_id)) continue
    const conceded = (matches ?? []).reduce((acc, m) => {
      if (m.home_team_id === g.team_id) return acc + (m.away_score ?? 0)
      if (m.away_team_id === g.team_id) return acc + (m.home_score ?? 0)
      return acc
    }, 0)
    const mp = (matches ?? []).filter(m => m.home_team_id === g.team_id || m.away_team_id === g.team_id).length
    if (mp > 0) {
      gkByTeam.set(g.team_id, { id: g.id, name: g.name, teamName: g.teams?.name ?? '', teamCode: g.teams?.fifa_code ?? '', teamFlag: g.teams?.flag_url ?? null, conceded, matchesPlayed: mp })
    }
  }
  const topGKs = Array.from(gkByTeam.values()).sort((a, b) => a.conceded - b.conceded || b.matchesPlayed - a.matchesPlayed).slice(0, 10)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black">Estadísticas</h1>
        <p className="text-muted-foreground text-sm">{matchesPlayed} partidos · {totalGoals} goles totales</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-black gradient-text">{totalGoals}</p>
            <p className="text-xs text-muted-foreground mt-1">Goles totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-black">{matchesPlayed > 0 ? (totalGoals / matchesPlayed).toFixed(1) : '0.0'}</p>
            <p className="text-xs text-muted-foreground mt-1">Promedio por partido</p>
          </CardContent>
        </Card>
      </div>

      {/* Top scorers */}
      <Card>
        <CardHeader><CardTitle>Goleadores</CardTitle></CardHeader>
        <CardContent className="space-y-2 pt-0">
          {topScorersList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">No hay datos todavía</p>
          ) : (
            topScorersList.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
                <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                {s.teamFlag ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.teamFlag} alt={s.teamName} className="w-6 h-4 object-cover rounded" />
                ) : (
                  <span className="w-6 h-4 bg-muted rounded" />
                )}
                <span className="flex-1 text-sm font-medium truncate">{s.name}</span>
                <span className="text-sm font-black">{s.goals} ⚽</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Best attack */}
      <Card>
        <CardHeader><CardTitle>Mejor ataque</CardTitle></CardHeader>
        <CardContent className="space-y-2 pt-0">
          {bestAttack.map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
              <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
              {t.flag && <img src={t.flag} alt={t.code} className="w-6 h-4 object-cover rounded" />}
              <span className="flex-1 text-sm font-medium">{t.code}</span>
              <span className="text-sm font-black text-emerald-600">{t.goalsFor} ⚽</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Best defense */}
      <Card>
        <CardHeader><CardTitle>Mejor defensa</CardTitle></CardHeader>
        <CardContent className="space-y-2 pt-0">
          {bestDefense.map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
              <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
              {t.flag && <img src={t.flag} alt={t.code} className="w-6 h-4 object-cover rounded" />}
              <span className="flex-1 text-sm font-medium">{t.code}</span>
              <span className="text-sm font-black text-primary">{t.goalsAgainst} en contra</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* GKs fewest goals conceded */}
      <Card>
        <CardHeader><CardTitle>🧤 Porteros — menos goles encajados</CardTitle></CardHeader>
        <CardContent className="space-y-2 pt-0">
          {topGKs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">Sin datos de porteros aún</p>
          ) : (
            topGKs.map((g, i) => (
              <div key={g.id} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
                <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                {g.teamFlag && <img src={g.teamFlag} alt={g.teamCode} className="w-6 h-4 object-cover rounded" />}
                <span className="flex-1 text-sm font-medium truncate">{g.teamCode}</span>
                <span className="text-xs text-muted-foreground">{g.matchesPlayed} PJ</span>
                <span className="text-sm font-black">{g.conceded} GE</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
