import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GlobalPredictionsClient } from './GlobalPredictionsClient'
import type { Team, Player, GlobalPrediction, Tournament } from '@/types'

export default async function GlobalPredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: tournament }, { data: teams }, { data: players }, { data: existing }] =
    await Promise.all([
      supabase.from('tournaments').select('*').single(),
      supabase.from('teams').select('*').order('name'),
      supabase.from('players').select('*').order('name'),
      supabase
        .from('global_predictions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

  const locked = tournament
    ? new Date() >= new Date(tournament.global_predictions_lock_at)
    : false

  return (
    <GlobalPredictionsClient
      existingPrediction={existing as GlobalPrediction | null}
      teams={(teams ?? []) as Team[]}
      players={(players ?? []) as Player[]}
      locked={locked}
    />
  )
}
