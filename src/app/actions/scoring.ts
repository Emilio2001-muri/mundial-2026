'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  scoreGlobalPredictions,
  buildRulesMap,
  type TournamentResults,
} from '@/lib/scoring'
import { doScoreMatch, doRecalculateLeaderboard } from '@/lib/scoring/compute'
import type { GlobalPrediction, ScoringRule } from '@/types'

export async function recalculateMatchScores(matchId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'No autorizado.' }

  const admin = createAdminClient()
  await doScoreMatch(matchId, admin)
  return {}
}

export async function recalculateLeaderboard(tournamentId: string): Promise<{ error?: string }> {
  const admin = createAdminClient()
  await doRecalculateLeaderboard(tournamentId, admin)
  return {}
}

export async function recalculateGlobalScores(tournamentId: string): Promise<{ error?: string }> {
  const admin = createAdminClient()

  // Get tournament awards
  const { data: tournament } = await admin
    .from('tournaments')
    .select('champion_team_id, runner_up_team_id, third_place_team_id, golden_ball_player_id, silver_ball_player_id, bronze_ball_player_id, golden_boot_player_id, golden_glove_player_id, best_young_player_id')
    .eq('id', tournamentId)
    .single()

  if (!tournament) return { error: 'Torneo no encontrado.' }

  const { data: rulesRows } = await admin.from('scoring_rules').select('*')
  const { buildRulesMap, scoreGlobalPredictions } = await import('@/lib/scoring')
  const rules = buildRulesMap(rulesRows ?? [])

  const { data: predictions } = await admin
    .from('global_predictions')
    .select('*')
    .eq('tournament_id', tournamentId)

  if (!predictions?.length) return {}

  // Delete existing global scores
  await admin.from('prediction_scores')
    .delete()
    .in('user_id', predictions.map((p: { user_id: string }) => p.user_id))
    .in('category', ['global_champion', 'global_runner_up', 'global_third', 'global_finalist', 'golden_ball', 'silver_ball', 'bronze_ball', 'golden_boot', 'golden_glove', 'best_young'])

  const inserts = []
  for (const pred of predictions) {
    const items = scoreGlobalPredictions(pred, tournament, rules)
    for (const item of items) {
      if (item.points > 0) {
        inserts.push({
          user_id: pred.user_id,
          match_id: null,
          prediction_id: null,
          category: item.category,
          points: item.points,
          reason: item.reason,
          created_at: new Date().toISOString(),
        })
      }
    }
  }

  if (inserts.length > 0) {
    await admin.from('prediction_scores').insert(inserts)
  }

  await recalculateLeaderboard(tournamentId)
  return {}
}
