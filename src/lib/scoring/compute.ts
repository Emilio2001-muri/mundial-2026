/**
 * Internal scoring computation — no auth checks.
 * Used by route handlers and server actions alike.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { scoreMatchPrediction, buildRulesMap } from './engine'
import type { Match, MatchPrediction, ScorerPrediction, MatchEvent, ScoringRule } from '@/types'

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Score all predictions for a match and upsert prediction_scores.
 * Works for both 'live' (provisional) and 'finished' (final) status.
 * Recalculates the leaderboard snapshot after scoring.
 */
export async function doScoreMatch(matchId: string, admin: AdminClient): Promise<void> {
  // Fetch match with team codes for readable reason text
  const { data: match } = await admin
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(fifa_code, name),
      away_team:teams!matches_away_team_id_fkey(fifa_code, name)
    `)
    .eq('id', matchId)
    .maybeSingle()

  if (!match || match.home_score === null || match.away_score === null) return

  const { data: rulesRows } = await admin.from('scoring_rules').select('*') as { data: ScoringRule[] | null }
  const rules = buildRulesMap(rulesRows ?? [])

  const { data: predictions } = await admin
    .from('match_predictions')
    .select('*, scorer_predictions(*, player:players(id, name))')
    .eq('match_id', matchId) as { data: (MatchPrediction & { scorer_predictions: (ScorerPrediction & { player?: { id: string; name: string } | null })[] })[] | null }

  const { data: events } = await admin
    .from('match_events')
    .select('*')
    .eq('match_id', matchId) as { data: MatchEvent[] | null }

  if (!predictions?.length) return

  // Delete and re-insert scores for this match
  await admin.from('prediction_scores').delete().eq('match_id', matchId)

  const inserts: object[] = []
  for (const pred of predictions) {
    // Build a player-id → name map for scorer fallback matching
    const playerNames: Record<string, string> = {}
    for (const sp of pred.scorer_predictions ?? []) {
      const p = (sp as unknown as { player?: { id: string; name: string } | null }).player
      if (p?.id && p?.name) playerNames[p.id] = p.name
    }

    const breakdown = scoreMatchPrediction(
      match as unknown as Match,
      pred,
      pred.scorer_predictions ?? [],
      events ?? [],
      rules,
      {
        homeCode: (match as unknown as { home_team?: { fifa_code?: string } }).home_team?.fifa_code,
        awayCode: (match as unknown as { away_team?: { fifa_code?: string } }).away_team?.fifa_code,
        playerNames,
      }
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

    // Mark as scored only when the match is definitively finished
    if (match.status === 'finished') {
      await admin.from('match_predictions').update({ status: 'scored' }).eq('id', pred.id)
    }
  }

  if (inserts.length > 0) {
    await admin.from('prediction_scores').insert(inserts)
  }

  // Recalculate leaderboard snapshot
  if (match.tournament_id) {
    await doRecalculateLeaderboard(match.tournament_id, admin)
  }
}

/**
 * Rebuild leaderboard snapshots for a tournament.
 * No auth required — uses admin client.
 */
export async function doRecalculateLeaderboard(tournamentId: string, admin: AdminClient): Promise<void> {
  const { data: profiles } = await admin.from('profiles').select('id, display_name, avatar_url')
  if (!profiles?.length) return

  const [{ data: scoreData }, { data: predStats }, { data: finishedMatchData }] = await Promise.all([
    admin.from('prediction_scores').select('user_id, category, points, match_id'),
    admin.from('match_predictions').select('user_id, match_id'),
    admin.from('matches').select('id').eq('status', 'finished'),
  ])

  interface ScoreRow { user_id: string; category: string; points: number; match_id: string | null }
  interface PredRow  { user_id: string; match_id: string }

  const scores = (scoreData ?? []) as ScoreRow[]
  const preds  = (predStats ?? []) as PredRow[]
  const finishedMatchIds = new Set((finishedMatchData ?? []).map((m) => m.id))

  const snapshots = profiles.map((profile) => {
    const myScores = scores.filter((s) => s.user_id === profile.id)
    const totalPoints = myScores.reduce((sum, s) => sum + s.points, 0)
    const scorerPoints = myScores.filter((s) => s.category === 'scorer_goal').reduce((sum, s) => sum + s.points, 0)
    const globalPoints = myScores.filter((s) =>
      ['global_champion','global_runner_up','global_third','global_finalist',
       'golden_ball','silver_ball','bronze_ball','golden_boot','golden_glove','best_young']
        .includes(s.category)
    ).reduce((sum, s) => sum + s.points, 0)

    // exact_scores_count: distinct matches where user got exact score
    const exactMatchIds = new Set(
      myScores.filter((s) => s.match_id && s.category === 'exact_score').map((s) => s.match_id!)
    )
    const exactScoresCount = exactMatchIds.size

    // success_rate: (distinct matches w/ correct winner or exact) / (total finished matches predicted)
    const winnerMatchIds = new Set(
      myScores
        .filter((s) => s.match_id && (s.category === 'exact_score' || s.category === 'correct_winner'))
        .map((s) => s.match_id!)
    )
    const myFinishedPredCount = preds.filter(
      (p) => p.user_id === profile.id && finishedMatchIds.has(p.match_id)
    ).length
    const successRate = myFinishedPredCount > 0
      ? Math.round((winnerMatchIds.size / myFinishedPredCount) * 100)
      : 0

    return {
      user_id: profile.id,
      total_points: totalPoints,
      exact_scores_count: exactScoresCount,
      winners_count: winnerMatchIds.size,
      scorer_points: scorerPoints,
      global_points: globalPoints,
      success_rate: successRate,
    }
  })

  const sorted = [...snapshots].sort((a, b) => b.total_points - a.total_points)
  const ranked = sorted.map((s, i) => ({ ...s, rank: i + 1 }))

  // Get previous ranks for trend calculation.
  // Use snapshots from at least 1 hour ago so the arrows reflect a
  // meaningful position change, not the micro-delta between two consecutive
  // recalculations of the same session.
  const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString()
  const { data: prevSnapshotsRaw } = await admin
    .from('leaderboard_snapshots')
    .select('user_id, rank, created_at')
    .eq('tournament_id', tournamentId)
    .lt('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
    .limit(profiles.length * 5)

  // Fallback: if no snapshots older than 1h, use the most recent ones
  // (happens on the first day of the tournament)
  const prevSnapshotsSource = (prevSnapshotsRaw?.length)
    ? prevSnapshotsRaw
    : (await admin
        .from('leaderboard_snapshots')
        .select('user_id, rank')
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false })
        .limit(profiles.length)
      ).data ?? []

  const prevRankMap: Record<string, number> = {}
  for (const prev of prevSnapshotsSource) {
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
}
