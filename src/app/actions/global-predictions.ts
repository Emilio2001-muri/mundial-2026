'use server'

import { createClient } from '@/lib/supabase/server'
import { globalPredictionFormSchema, type GlobalPredictionFormValues } from '@/types/forms'

export async function saveGlobalPredictions(
  _tournamentId: string,
  values: GlobalPredictionFormValues
): Promise<{ error?: string }> {
  const parsed = globalPredictionFormSchema.safeParse(values)
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  // Fetch tournament directly (single tournament in DB)
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, global_predictions_lock_at')
    .single()

  if (!tournament) return { error: 'Torneo no encontrado.' }
  const tournamentId = tournament.id

  if (tournament && new Date() >= new Date(tournament.global_predictions_lock_at)) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      // Allow if admin explicitly unlocked this prediction
      const { data: existingPred } = await supabase
        .from('global_predictions')
        .select('admin_unlocked')
        .eq('user_id', user.id)
        .eq('tournament_id', tournamentId)
        .maybeSingle()
      if (!existingPred?.admin_unlocked) {
        return { error: 'Las predicciones globales están bloqueadas.' }
      }
    }
  }

  const { error } = await supabase
    .from('global_predictions')
    .upsert(
      {
        tournament_id: tournamentId,
        user_id: user.id,
        ...parsed.data,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        admin_unlocked: false, // consume the one-time unlock after saving
      },
      { onConflict: 'tournament_id,user_id', ignoreDuplicates: false }
    )

  if (error) return { error: error.message }
  return {}
}
