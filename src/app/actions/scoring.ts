'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  scoreMatchPrediction,
  scoreGlobalPredictions,
  buildRulesMap,
  type TournamentResults,
} from '@/lib/scoring'
import type { Match, MatchPrediction, ScorerPrediction, MatchEvent, GlobalPrediction, ScoringRule } from '@/types'

export async function recalculateMatchScores(matchId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'No autorizado.' }

  const admin = createAdminClient()

  // Fetch match
  const { data: match } = await admin.from('matches').select('*').eq('id', matchId).single() as { data: Match | null }
  if (!match) return { error: 'Partido no encontrado.' }

  // Fetch scoring rules
  const { data: rulesRows } = await admin.from('scoring_rules').select('*') as { data: ScoringRule[] | null }
  const rules = buildRulesMap(rulesRows ?? [])

  // Fetch all predictions for this match
  const { data: predictions } = await admin
    .from('match_predictions')
    .select('*, scorer_predictions(*)')
    .eq('match_id', matchId) as { data: (MatchPrediction & { scorer_predictions: ScorerPrediction[] })[] | null }

  // Fetch match events
  const { data: events } = await admin.from('match_events').select('*').eq('match_id', matchId) as { data: MatchEvent[] | null }

  if (!predictions) return {}

  // Delete existing scores for this match
  await admin.from('prediction_scores').delete().eq('match_id', matchId)

  // Recalculate
  const inserts = []
  for (const pred of predictions) {
    const breakdown = scoreMatchPrediction(
      match,
      pred,
      pred.scorer_predictions ?? [],
      events ?? [],
      rules
    )
    for (const item of breakdown.items) {
      if (item.points > 0) {
        inserts.push({
          user_id: pred.user_id,
          match_id: matchId,
          prediction_id: pred.id,
          category: item.category,
          points: item.points,
          reason: item.reason,
          created_at: new Date().toISOString(),
        })
      }
    }
    // Update prediction status
    await admin
      .from('match_predictions')
      .update({ status: 'scored' })
      .eq('id', pred.id)
  }

  if (inserts.length > 0) {
    await admin.from('prediction_scores').insert(inserts)
  }

  // Recalculate leaderboard after scoring
  const { data: tournament } = await admin.from('matches').select('tournament_id').eq('id', matchId).single()
  if (tournament?.tournament_id) {
    await recalculateLeaderboard(tournament.tournament_id)
  }

  return {}
}

export async function recalculateLeaderboard(tournamentId: string): Promise<{ error?: string }> {
  const admin = createAdminClient()

  // Get all users
  const { data: profiles } = await admin.from('profiles').select('id, display_name, avatar_url')
  if (!profiles) return {}

  // Get total points per user
  const { data: scoreData } = await admin
    .from('prediction_scores')
    .select('user_id, category, points')

  // Get prediction stats per user
  const { data: predStats } = await admin
    .from('match_predictions')
    .select('user_id, status')

  interface ScoreRow { user_id: string; category: string; points: number }
  interface PredRow { user_id: string; status: string }

  const scores = (scoreData ?? []) as ScoreRow[]
  const preds = (predStats ?? []) as PredRow[]

  // Build per-user aggregates
  const snapshots = profiles.map((profile) => {
    const myScores = scores.filter((s) => s.user_id === profile.id)
    const totalPoints = myScores.reduce((sum, s) => sum + s.points, 0)
    const exactScoresCount = myScores.filter((s) => s.category === 'exact_score').length
    const winnersCount = myScores.filter((s) => s.category === 'correct_winner').length
    const scorerPoints = myScores.filter((s) => s.category === 'scorer_goal').reduce((sum, s) => sum + s.points, 0)
    const globalPoints = myScores.filter((s) =>
      ['global_champion', 'global_runner_up', 'global_third', 'global_finalist', 'golden_ball', 'silver_ball', 'bronze_ball', 'golden_boot', 'golden_glove', 'best_young'].includes(s.category)
    ).reduce((sum, s) => sum + s.points, 0)

    const myPreds = preds.filter((p) => p.user_id === profile.id)
    const scored = myPreds.filter((p) => p.status === 'scored').length
    const successRate = scored > 0 ? Math.round(((exactScoresCount + winnersCount) / scored) * 100) : 0

    return {
      user_id: profile.id,
      total_points: totalPoints,
      exact_scores_count: exactScoresCount,
      winners_count: winnersCount,
      scorer_points: scorerPoints,
      global_points: globalPoints,
      success_rate: successRate,
    }
  })

  // Sort and assign ranks
  const sorted = [...snapshots].sort((a, b) => b.total_points - a.total_points)
  const ranked = sorted.map((s, i) => ({ ...s, rank: i + 1 }))

  // Get previous ranks
  const { data: prevSnapshots } = await admin
    .from('leaderboard_snapshots')
    .select('user_id, rank')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: false })
    .limit(profiles.length)

  const prevRankMap: Record<string, number> = {}
  for (const prev of prevSnapshots ?? []) {
    if (!prevRankMap[prev.user_id]) prevRankMap[prev.user_id] = prev.rank
  }

  const inserts = ranked.map((s) => ({
    tournament_id: tournamentId,
    user_id: s.user_id,
    total_points: s.total_points,
    rank: s.rank,
    previous_rank: prevRankMap[s.user_id] ?? null,
    exact_scores_count: s.exact_scores_count,
    winners_count: s.winners_count,
    scorer_points: s.scorer_points,
    global_points: s.global_points,
    success_rate: s.success_rate,
    created_at: new Date().toISOString(),
  }))

  await admin.from('leaderboard_snapshots').insert(inserts)

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
