import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AdminManualPredictionsClient } from './AdminManualPredictionsClient'

export const revalidate = 0

export default async function AdminManualPredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  const [{ data: users }, { data: matches }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, display_name')
      .order('display_name'),
    admin
      .from('matches')
      .select(`
        id, match_number, phase, kickoff_at, status,
        home_placeholder, away_placeholder,
        home_team:teams!matches_home_team_id_fkey(fifa_code),
        away_team:teams!matches_away_team_id_fkey(fifa_code)
      `)
      // Show all knockout + recent group matches sorted by number
      .neq('phase', 'group')
      .order('match_number'),
  ])

  return (
    <AdminManualPredictionsClient
      users={(users ?? []) as { id: string; display_name: string | null }[]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      matches={(matches ?? []) as any[]}
    />
  )
}
