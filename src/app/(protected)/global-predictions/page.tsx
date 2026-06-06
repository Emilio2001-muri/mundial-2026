import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GlobalPredictionsClient } from './GlobalPredictionsClient'
import type { Team, Player, GlobalPrediction } from '@/types'

export const revalidate = 0

export default async function GlobalPredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: tournament }, { data: teams }, { data: players }, { data: existing }, { data: profile }] =
    await Promise.all([
      supabase.from('tournaments').select('*').single(),
      supabase.from('teams').select('*').order('name'),
      supabase.from('players').select('id,name,position,team_id').limit(2000),
      supabase
        .from('global_predictions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('profiles').select('role').eq('id', user.id).single(),
    ])

  const locked = tournament
    ? new Date() >= new Date(tournament.global_predictions_lock_at)
    : false

  const isAdmin = profile?.role === 'admin'

  return (
    <GlobalPredictionsClient
      existingPrediction={existing as GlobalPrediction | null}
      teams={(teams ?? []) as Team[]}
      players={((players ?? []) as Player[]).sort((a, b) => a.name.localeCompare(b.name))}
      locked={locked}
      isAdmin={isAdmin}
      lockAt={tournament?.global_predictions_lock_at ?? null}
    />
  )
}
