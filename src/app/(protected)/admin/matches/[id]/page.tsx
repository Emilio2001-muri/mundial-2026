import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { MatchEventsClient } from './MatchEventsClient'

export const revalidate = 0

export default async function AdminMatchEventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: match }, { data: events }, batch1, batch2] = await Promise.all([
    admin.from('matches').select(`
      id, match_number, home_score, away_score, status,
      home_team:teams!matches_home_team_id_fkey(id, name, fifa_code),
      away_team:teams!matches_away_team_id_fkey(id, name, fifa_code)
    `).eq('id', id).single(),
    admin.from('match_events').select(`
      id, event_type, minute, is_own_goal,
      player:players(id, name),
      team:teams(id, fifa_code)
    `).eq('match_id', id).order('minute'),
    admin.from('players').select('id, name, position, team_id').range(0, 999),
    admin.from('players').select('id, name, position, team_id').range(1000, 1999),
  ])

  if (!match) redirect('/admin/matches')

  const players = [...(batch1.data ?? []), ...(batch2.data ?? [])]

  return (
    <MatchEventsClient
      match={match as any}
      events={(events ?? []) as any[]}
      players={players as any[]}
    />
  )
}
