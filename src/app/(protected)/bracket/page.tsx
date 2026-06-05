import { createClient } from '@/lib/supabase/server'
import { BracketClient } from './BracketClient'
import type { MatchWithTeams } from '@/types'

export const revalidate = 30

export default async function BracketPage() {
  const supabase = await createClient()
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*),
      venue:venues(name, city)
    `)
    .order('match_number')

  return <BracketClient matches={(matches ?? []) as unknown as MatchWithTeams[]} />
}
