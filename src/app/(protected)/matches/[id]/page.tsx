import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MatchDetailClient } from './MatchDetailClient'
import type { MatchWithTeams, MatchPrediction, ScorerPrediction, Player, Lineup, MatchEvent } from '@/types'

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: match },
    { data: prediction },
    { data: events },
    { data: lineups },
  ] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        venue:venues(*)
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('match_predictions')
      .select('*, scorer_predictions(*)')
      .eq('match_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('match_events').select('*').eq('match_id', id),
    supabase.from('lineups').select('*').eq('match_id', id),
  ])

  if (!match) notFound()

  // Get players for both teams
  const teamIds = [match.home_team_id, match.away_team_id].filter(Boolean) as string[]
  const { data: players } = teamIds.length
    ? await supabase.from('players').select('*').in('team_id', teamIds).limit(200)
    : { data: [] }

  const homePlayers = (players ?? []).filter((p: Player) => p.team_id === match.home_team_id)
  const awayPlayers = (players ?? []).filter((p: Player) => p.team_id === match.away_team_id)
  const homeLineup = (lineups ?? []).filter((l: Lineup) => l.team_id === match.home_team_id)
  const awayLineup = (lineups ?? []).filter((l: Lineup) => l.team_id === match.away_team_id)

  return (
    <MatchDetailClient
      match={match as MatchWithTeams}
      prediction={prediction as (MatchPrediction & { scorer_predictions: ScorerPrediction[] }) | null}
      events={events as MatchEvent[]}
      homePlayers={homePlayers as Player[]}
      awayPlayers={awayPlayers as Player[]}
      homeLineup={homeLineup as Lineup[]}
      awayLineup={awayLineup as Lineup[]}
      adminUnlocked={(prediction as any)?.admin_unlocked ?? false}
    />
  )
}
