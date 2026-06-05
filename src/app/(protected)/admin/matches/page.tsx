import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminMatchesClient } from './AdminMatchesClient'
import type { Match, Team, Venue } from '@/types'

export default async function AdminMatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: matches }, { data: teams }, { data: venues }] = await Promise.all([
    supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(fifa_code), away_team:teams!matches_away_team_id_fkey(fifa_code)')
      .order('kickoff_at')
      .limit(104),
    supabase.from('teams').select('id, fifa_code, name').order('name'),
    supabase.from('venues').select('id, name, city').order('name'),
  ])

  return (
    <AdminMatchesClient
      matches={(matches ?? []) as unknown as Match[]}
      teams={(teams ?? []) as Pick<Team, 'id' | 'fifa_code' | 'name'>[]}
      venues={(venues ?? []) as Pick<Venue, 'id' | 'name' | 'city'>[]}
    />
  )
}
