'use server'

import { createClient } from '@/lib/supabase/server'
import { isMatchLocked } from '@/lib/scoring'
import type { PredictionFormValues } from '@/types/forms'
import { predictionFormSchema } from '@/types/forms'

export async function savePrediction(
  matchId: string,
  values: PredictionFormValues
): Promise<{ error?: string; id?: string }> {
  const parsed = predictionFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: 'Datos inválidos.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  // Fetch the match to verify lock status
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('kickoff_at, status')
    .eq('id', matchId)
    .single()

  if (matchError || !match) return { error: 'Partido no encontrado.' }

  // Server-side lock enforcement
  if (isMatchLocked(match.kickoff_at)) {
    // Check if user is admin (admins can override)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Las predicciones para este partido están bloqueadas.' }
    }
  }

  const { scorer_predictions, ...predData } = parsed.data

  // Upsert match prediction
  const { data: prediction, error: predError } = await supabase
    .from('match_predictions')
    .upsert(
      {
        match_id: matchId,
        user_id: user.id,
        ...predData,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'match_id,user_id', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (predError) return { error: predError.message }

  // Replace scorer predictions
  if (scorer_predictions && prediction) {
    await supabase
      .from('scorer_predictions')
      .delete()
      .eq('match_prediction_id', prediction.id)

    if (scorer_predictions.length > 0) {
      const { error: scorerError } = await supabase
        .from('scorer_predictions')
        .insert(
          scorer_predictions.map((sp) => ({
            match_prediction_id: prediction.id,
            player_id: sp.player_id,
            predicted_goals: sp.predicted_goals,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        )
      if (scorerError) return { error: scorerError.message }
    }
  }

  return { id: prediction!.id }
}

export async function getMyPrediction(matchId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('match_predictions')
    .select('*, scorer_predictions(*)')
    .eq('match_id', matchId)
    .eq('user_id', user.id)
    .single()

  return data
}
