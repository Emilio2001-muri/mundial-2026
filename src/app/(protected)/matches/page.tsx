import { createClient } from '@/lib/supabase/server'
import { MatchesClient } from './MatchesClient'

export const revalidate = 30

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: matches }, { data: predictions }] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        venue:venues(*)
      `)
      .order('kickoff_at'),
    user
      ? supabase
          .from('match_predictions')
          .select('*, scorer_predictions(*)')
          .eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
  ])

  // Map predictions by match_id
  const predMap: Record<string, unknown> = {}
  for (const p of predictions ?? []) {
    predMap[(p as { match_id: string }).match_id] = p
  }

  const matchesWithPreds = (matches ?? []).map((m) => ({
    ...m,
    my_prediction: predMap[m.id] ?? null,
  }))

  return <MatchesClient matches={matchesWithPreds} />
}
