import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GlobalPredictionsClient } from './GlobalPredictionsClient'
import type { Team, Player, GlobalPrediction } from '@/types'

export const revalidate = 0

export default async function GlobalPredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: tournament }, { data: teams }, { data: existing }, { data: profile }, batch1, batch2] =
    await Promise.all([
      supabase.from('tournaments').select('*').single(),
      supabase.from('teams').select('*').order('name'),
      supabase
        .from('global_predictions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('profiles').select('role').eq('id', user.id).single(),
      // Fetch players in two batches to bypass Supabase's 1000-row max_rows limit
      supabase.from('players').select('id,name,position,team_id').range(0, 999),
      supabase.from('players').select('id,name,position,team_id').range(1000, 1999),
    ])

  const players = [...(batch1.data ?? []), ...(batch2.data ?? [])]

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
      adminUnlocked={existing?.admin_unlocked ?? false}
    />
  )
}
