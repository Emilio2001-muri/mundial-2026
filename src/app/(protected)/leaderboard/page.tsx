import { createClient } from '@/lib/supabase/server'
import { LeaderboardClient } from './LeaderboardClient'

export const revalidate = 0

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get latest snapshot per user
  const [{ data: snapshots }, { data: profiles }] = await Promise.all([
    supabase
      .from('leaderboard_snapshots')
      .select('*, profile:profiles(id, display_name, avatar_url, role)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('profiles')
      .select('id, display_name, avatar_url, role, created_at')
      .order('created_at', { ascending: true })
      .limit(100),
  ])

  // Deduplicate: keep latest per user
  const seen = new Set<string>()
  const latest = (snapshots ?? []).filter((s) => {
    if (seen.has(s.user_id)) return false
    seen.add(s.user_id)
    return true
  })

  const sorted = [...latest].sort((a, b) => a.rank - b.rank)

  // If no snapshots yet, show all profiles with rank 0
  const preRanking = sorted.length === 0
    ? (profiles ?? []).map((p, i) => ({
        id: `pre-${p.id}`,
        user_id: p.id,
        rank: i + 1,
        previous_rank: null,
        total_points: 0,
        exact_scores_count: 0,
        success_rate: 0,
        scorer_points: 0,
        created_at: p.created_at,
        profile: p,
      }))
    : sorted

  return <LeaderboardClient initialData={preRanking as any} currentUserId={user?.id ?? ''} isPreTournament={sorted.length === 0} />
}
