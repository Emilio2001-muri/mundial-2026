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

  // Include profiles that have no snapshot yet (e.g. registered after last recalculation)
  const snapshotUserIds = new Set(sorted.map((s) => s.user_id))
  const missingProfiles = (profiles ?? []).filter((p) => !snapshotUserIds.has(p.id))
  const nextRank = sorted.length + 1
  const missingEntries = missingProfiles.map((p, i) => ({
    id: `pre-${p.id}`,
    user_id: p.id,
    rank: nextRank + i,
    previous_rank: null,
    total_points: 0,
    exact_scores_count: 0,
    success_rate: 0,
    scorer_points: 0,
    created_at: p.created_at,
    profile: p,
  }))

  const preRanking = sorted.length === 0
    ? missingEntries
    : [...sorted, ...missingEntries]

  return <LeaderboardClient initialData={preRanking as any} currentUserId={user?.id ?? ''} isPreTournament={sorted.length === 0} />
}
