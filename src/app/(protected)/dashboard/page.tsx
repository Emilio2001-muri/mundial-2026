import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'
import type { Profile } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: latestSnapshot }, { data: pendingMatches }, { data: recentScores }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('leaderboard_snapshots')
        .select('*, profile:profiles(display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('matches')
        .select('id, kickoff_at, status, home_team:teams!matches_home_team_id_fkey(fifa_code, flag_url), away_team:teams!matches_away_team_id_fkey(fifa_code, flag_url)')
        .in('status', ['scheduled'])
        .gt('kickoff_at', new Date().toISOString())
        .order('kickoff_at')
        .limit(5),
      supabase
        .from('prediction_scores')
        .select(`
          points, category, reason, created_at, match_id,
          match:matches(
            id,
            home_score, away_score, status,
            home_team:teams!matches_home_team_id_fkey(fifa_code),
            away_team:teams!matches_away_team_id_fkey(fifa_code)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

  const mySnapshot = latestSnapshot?.find((s) => s.user_id === user.id)
  const rank = mySnapshot?.rank ?? null
  const totalPoints = mySnapshot?.total_points ?? 0
  const leaderCount = latestSnapshot?.length ?? 0
  const firstPlace = latestSnapshot?.[0]

  return (
    <DashboardClient
      profile={profile as Profile}
      rank={rank}
      totalPoints={totalPoints}
      leaderCount={leaderCount}
      firstPlacePoints={firstPlace?.total_points ?? 0}
      successRate={mySnapshot?.success_rate ?? 0}
      exactScores={mySnapshot?.exact_scores_count ?? 0}
      pendingMatches={(pendingMatches ?? []) as unknown[]}
      recentScores={(recentScores ?? []) as unknown[]}
    />
  )
}
