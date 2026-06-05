import { createClient } from '@/lib/supabase/server'
import { LeaderboardClient } from './LeaderboardClient'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get latest snapshot per user
  const { data: snapshots } = await supabase
    .from('leaderboard_snapshots')
    .select('*, profile:profiles(id, display_name, avatar_url, role)')
    .order('created_at', { ascending: false })
    .limit(50)

  // Deduplicate: keep latest per user
  const seen = new Set<string>()
  const latest = (snapshots ?? []).filter((s) => {
    if (seen.has(s.user_id)) return false
    seen.add(s.user_id)
    return true
  })

  const sorted = [...latest].sort((a, b) => a.rank - b.rank)

  return <LeaderboardClient initialData={sorted} currentUserId={user?.id ?? ''} />
}
