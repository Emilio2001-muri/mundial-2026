/**
 * Scoring Engine
 * Pure, side-effect-free scoring functions used both in server actions
 * and SQL triggers. All rules are driven by a ScoringRule config map.
 */

import type {
  Match,
  MatchPrediction,
  ScorerPrediction,
  MatchEvent,
  GlobalPrediction,
  ScoreItem,
  MatchScoreBreakdown,
  ScoringRule,
} from '@/types'

// ─────────────────────────────────────────────
// Default scoring rule keys
// ─────────────────────────────────────────────
export const SCORING_KEYS = {
  EXACT_SCORE: 'exact_score',
  CORRECT_WINNER: 'correct_winner',
  SCORER_GOAL: 'scorer_goal',
  GLOBAL_CHAMPION: 'global_champion',
  GLOBAL_RUNNER_UP: 'global_runner_up',
  GLOBAL_THIRD: 'global_third',
  GLOBAL_FINALIST: 'global_finalist',
  GOLDEN_BALL: 'golden_ball',
  SILVER_BALL: 'silver_ball',
  BRONZE_BALL: 'bronze_ball',
  GOLDEN_BOOT: 'golden_boot',
  GOLDEN_GLOVE: 'golden_glove',
  BEST_YOUNG: 'best_young',
} as const

export type ScoringKey = (typeof SCORING_KEYS)[keyof typeof SCORING_KEYS]

export const DEFAULT_SCORING_RULES: Record<ScoringKey, number> = {
  exact_score: 3,
  correct_winner: 2,
  scorer_goal: 1,
  global_champion: 5,
  global_runner_up: 3,
  global_third: 2,
  global_finalist: 5,
  golden_ball: 5,
  silver_ball: 2,
  bronze_ball: 1,
  golden_boot: 3,
  golden_glove: 3,
  best_young: 3,
}

export type RulesMap = Record<string, number>

function getRulePoints(rules: RulesMap, key: ScoringKey): number {
  return rules[key] ?? DEFAULT_SCORING_RULES[key] ?? 0
}

// ─────────────────────────────────────────────
// Is a match locked to predictions?
// ─────────────────────────────────────────────
export function isMatchLocked(kickoff_at: string, nowOverride?: Date): boolean {
  const now = nowOverride ?? new Date()
  const lockTime = new Date(new Date(kickoff_at).getTime() - 60_000) // 1 min before kickoff
  return now >= lockTime
}

// ─────────────────────────────────────────────
// Time remaining until lock (ms)
// ─────────────────────────────────────────────
export function msUntilLock(kickoff_at: string, nowOverride?: Date): number {
  const now = nowOverride ?? new Date()
  const lockTime = new Date(new Date(kickoff_at).getTime() - 60_000)
  return lockTime.getTime() - now.getTime()
}

// ─────────────────────────────────────────────
// Normalize a name: lowercase, strip diacritics + punctuation
// ─────────────────────────────────────────────
function normName(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
}

function nameMatchesScorerName(playerName: string, scorerName: string): boolean {
  const pn = normName(playerName)
  const sn = normName(scorerName)
  if (pn === sn) return true
  const sParts = sn.split(' ').filter(Boolean)
  const pParts = pn.split(' ').filter(Boolean)
  // Last name match
  const sLast = sParts[sParts.length - 1]
  const pLast = pParts[pParts.length - 1]
  if (sLast.length > 2 && sLast === pLast) return true
  // Abbreviated first name: "b gutierrez" vs "brian gutierrez"
  if (sParts.length >= 2 && sParts[0].length === 1) {
    const initial = sParts[0]
    const sLastName = sParts[sParts.length - 1]
    if (pParts[pParts.length - 1] === sLastName && pParts[0].startsWith(initial)) return true
  }
  // Significant word in common
  return sParts.some((part) => part.length > 4 && pn.includes(part))
}

// ─────────────────────────────────────────────
// Aggregate goals scored by a player in a match
// (excludes own goals, includes penalties by default)
// ─────────────────────────────────────────────
export function countPlayerGoals(
  events: MatchEvent[],
  playerId: string,
  options = { countOwnGoals: false, countPenalties: true },
  playerName?: string
): number {
  return events.filter((e) => {
    if (e.player_id !== playerId) {
      // Fallback: event has no player_id but metadata.scorer_name matches
      if (e.player_id !== null) return false
      if (!playerName) return false
      const scorerName = e.metadata?.scorer_name as string | undefined
      if (!scorerName) return false
      if (!nameMatchesScorerName(playerName, scorerName)) return false
    }
    // Own goals: skip unless enabled
    if ((e.event_type === 'own_goal' || e.is_own_goal) && !options.countOwnGoals) return false
    // Only count goal-scoring events
    if (!['goal', 'penalty', 'own_goal'].includes(e.event_type)) return false
    // Penalties: skip unless enabled
    if (e.event_type === 'penalty' && !options.countPenalties) return false
    return true
  }).length
}

// ─────────────────────────────────────────────
// Score a single match prediction
// ─────────────────────────────────────────────
export function scoreMatchPrediction(
  match: Match,
  prediction: MatchPrediction,
  scorerPredictions: ScorerPrediction[],
  matchEvents: MatchEvent[],
  rules: RulesMap,
  opts?: { homeCode?: string; awayCode?: string; playerNames?: Record<string, string> }
): MatchScoreBreakdown {
  const items: ScoreItem[] = []

  if (
    match.home_score === null ||
    match.away_score === null ||
    (match.status !== 'finished' && match.status !== 'live')
  ) {
    return { user_id: prediction.user_id, match_id: match.id, total_points: 0, items }
  }

  const predHome = prediction.predicted_home_score
  const predAway = prediction.predicted_away_score
  const actualHome = match.home_score
  const actualAway = match.away_score

  // ── Exact score ──────────────────────────────
  const homeLabel = opts?.homeCode ?? 'Local'
  const awayLabel = opts?.awayCode ?? 'Visitante'

  // Determine the actual winner. In knockout ties decided by penalties the
  // regular-time score is a draw, but an admin can designate the advancing
  // team via winner_team_id. In that case the "ganador correcto" points go to
  // whoever predicted that team to win.
  let actualWinner: 'home' | 'away' | 'draw' =
    actualHome > actualAway ? 'home' : actualAway > actualHome ? 'away' : 'draw'
  if (actualWinner === 'draw' && match.winner_team_id) {
    if (match.winner_team_id === match.home_team_id) actualWinner = 'home'
    else if (match.winner_team_id === match.away_team_id) actualWinner = 'away'
  }

  if (predHome === actualHome && predAway === actualAway) {
    const pts = getRulePoints(rules, SCORING_KEYS.EXACT_SCORE)
    items.push({
      category: 'exact_score',
      points: pts,
      reason: `+${pts} marcador exacto: ${homeLabel} ${actualHome}-${actualAway} ${awayLabel}`,
    })

    // Exact score implies correct winner — add winner points too
    const winnerPts = getRulePoints(rules, SCORING_KEYS.CORRECT_WINNER)
    const predWinner =
      predHome! > predAway! ? 'home' : predAway! > predHome! ? 'away' : 'draw'
    if (actualWinner === predWinner) {
      items.push({
        category: 'correct_winner',
        points: winnerPts,
        reason: `+${winnerPts} ganador correcto (incluido en marcador exacto).`,
      })
    }
  } else if (predHome !== null && predAway !== null) {
    // ── Correct winner / draw ──────────────────
    const predWinner =
      predHome > predAway ? 'home' : predAway > predHome ? 'away' : 'draw'

    if (actualWinner === predWinner) {
      const pts = getRulePoints(rules, SCORING_KEYS.CORRECT_WINNER)
      const winnerLabel =
        actualWinner === 'draw'
          ? 'empate'
          : actualWinner === 'home'
          ? `${homeLabel} gana`
          : `${awayLabel} gana`
      items.push({
        category: 'correct_winner',
        points: pts,
        reason: `+${pts} resultado correcto: ${winnerLabel} (${actualHome}-${actualAway})`,
      })
    } else {
      items.push({
        category: 'correct_winner',
        points: 0,
        reason: `0 puntos por resultado: predijiste ${predHome}-${predAway} pero el resultado fue ${actualHome}-${actualAway}.`,
      })
    }
  }

  // ── Scorer predictions ─────────────────────
  for (const sp of scorerPredictions) {
    const playerName = opts?.playerNames?.[sp.player_id]
    const goalsScored = countPlayerGoals(matchEvents, sp.player_id, undefined, playerName)
    if (goalsScored > 0) {
      const pts = getRulePoints(rules, SCORING_KEYS.SCORER_GOAL) * goalsScored
      items.push({
        category: 'scorer_goal',
        points: pts,
        reason: `+${pts} goleador: el jugador anotó ${goalsScored} gol${goalsScored > 1 ? 'es' : ''}.`,
      })
    } else {
      items.push({
        category: 'scorer_goal',
        points: 0,
        reason: `0 puntos: el jugador que predijiste no anotó.`,
      })
    }
  }

  const total = items.reduce((sum, i) => sum + i.points, 0)
  return { user_id: prediction.user_id, match_id: match.id, total_points: total, items }
}

// ─────────────────────────────────────────────
// Score global tournament predictions
// ─────────────────────────────────────────────
export interface TournamentResults {
  champion_team_id: string | null
  runner_up_team_id: string | null
  third_place_team_id: string | null
  golden_ball_player_id: string | null
  silver_ball_player_id: string | null
  bronze_ball_player_id: string | null
  golden_boot_player_id: string | null
  golden_glove_player_id: string | null
  best_young_player_id: string | null
}

export function scoreGlobalPredictions(
  prediction: GlobalPrediction,
  results: TournamentResults,
  rules: RulesMap
): ScoreItem[] {
  const items: ScoreItem[] = []

  function check(
    key: ScoringKey,
    predicted: string | null,
    actual: string | null,
    label: string
  ) {
    if (!predicted || !actual) return
    const pts = getRulePoints(rules, key)
    if (predicted === actual) {
      items.push({ category: key as ScoreItem['category'], points: pts, reason: `+${pts} ${label}: acertaste.` })
    } else {
      items.push({ category: key as ScoreItem['category'], points: 0, reason: `0 ${label}: no acertaste.` })
    }
  }

  check(SCORING_KEYS.GLOBAL_CHAMPION, prediction.champion_team_id, results.champion_team_id, 'campeón')
  check(SCORING_KEYS.GLOBAL_RUNNER_UP, prediction.runner_up_team_id, results.runner_up_team_id, 'subcampeón')
  check(SCORING_KEYS.GLOBAL_THIRD, prediction.third_place_team_id, results.third_place_team_id, 'tercer lugar')
  check(SCORING_KEYS.GOLDEN_BALL, prediction.golden_ball_player_id, results.golden_ball_player_id, 'Balón de Oro')
  check(SCORING_KEYS.SILVER_BALL, prediction.silver_ball_player_id, results.silver_ball_player_id, 'Balón de Plata')
  check(SCORING_KEYS.BRONZE_BALL, prediction.bronze_ball_player_id, results.bronze_ball_player_id, 'Balón de Bronce')
  check(SCORING_KEYS.GOLDEN_BOOT, prediction.golden_boot_player_id, results.golden_boot_player_id, 'Bota de Oro')
  check(SCORING_KEYS.GOLDEN_GLOVE, prediction.golden_glove_player_id, results.golden_glove_player_id, 'Guante de Oro')
  check(SCORING_KEYS.BEST_YOUNG, prediction.best_young_player_id, results.best_young_player_id, 'Mejor jugador joven')

  // Finalists (order-independent)
  const actualFinalists = [results.champion_team_id, results.runner_up_team_id].filter(Boolean) as string[]
  const predictedFinalists = [prediction.finalist_one_team_id, prediction.finalist_two_team_id].filter(Boolean) as string[]
  for (const pred of predictedFinalists) {
    const pts = getRulePoints(rules, SCORING_KEYS.GLOBAL_FINALIST)
    if (actualFinalists.includes(pred)) {
      items.push({ category: 'global_finalist', points: pts, reason: `+${pts} finalista acertado.` })
    }
  }

  return items
}

// ─────────────────────────────────────────────
// Estimate win probability (heuristic)
// ─────────────────────────────────────────────
export interface LeaderboardEntry {
  user_id: string
  total_points: number
  success_rate: number
}

export function estimateWinProbability(
  entry: LeaderboardEntry,
  allEntries: LeaderboardEntry[],
  remainingMatches: number,
  pointsPerMatch = 5
): number {
  if (allEntries.length === 0) return 0

  const maxRemaining = remainingMatches * pointsPerMatch
  const myMaxPossible = entry.total_points + maxRemaining

  // How many rivals can still surpass me?
  const canSurpass = allEntries.filter(
    (e) => e.user_id !== entry.user_id && e.total_points + maxRemaining > entry.total_points
  ).length
  const totalRivals = allEntries.length - 1

  // Base probability from current rank
  const sorted = [...allEntries].sort((a, b) => b.total_points - a.total_points)
  const myRank = sorted.findIndex((e) => e.user_id === entry.user_id) + 1
  const rankFactor = (allEntries.length - myRank + 1) / allEntries.length

  // Form factor from success_rate
  const formFactor = entry.success_rate / 100

  // How many rivals cannot surpass me even with perfect run?
  const dominateFactor = totalRivals > 0 ? (totalRivals - canSurpass) / totalRivals : 0

  // Weighted estimate
  const raw = (rankFactor * 0.4 + formFactor * 0.3 + dominateFactor * 0.3) * 100
  return Math.max(1, Math.min(99, Math.round(raw)))
}

// ─────────────────────────────────────────────
// Build rules map from ScoringRule[]
// ─────────────────────────────────────────────
export function buildRulesMap(rules: ScoringRule[]): RulesMap {
  return rules.reduce<RulesMap>((acc, r) => {
    if (r.enabled) acc[r.key] = r.points
    return acc
  }, {})
}
