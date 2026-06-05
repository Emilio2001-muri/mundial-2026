'use server'

import { createClient } from '@/lib/supabase/server'
import { globalPredictionFormSchema, type GlobalPredictionFormValues } from '@/types/forms'

export async function saveGlobalPredictions(
  tournamentId: string,
  values: GlobalPredictionFormValues
): Promise<{ error?: string }> {
  if (!tournamentId) return { error: 'Torneo no encontrado.' }

  const parsed = globalPredictionFormSchema.safeParse(values)
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  // Check lock
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('global_predictions_lock_at')
    .eq('id', tournamentId)
    .single()

  if (tournament && new Date() >= new Date(tournament.global_predictions_lock_at)) {
    // Check admin override
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return { error: 'Las predicciones globales están bloqueadas.' }
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
      },
      { onConflict: 'tournament_id,user_id', ignoreDuplicates: false }
    )

  if (error) return { error: error.message }
  return {}
}
