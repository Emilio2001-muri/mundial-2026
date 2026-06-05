import { describe, it, expect } from 'vitest'
import {
  isMatchLocked,
  msUntilLock,
  countPlayerGoals,
  scoreMatchPrediction,
  scoreGlobalPredictions,
  estimateWinProbability,
  buildRulesMap,
  DEFAULT_SCORING_RULES,
} from '@/lib/scoring/engine'
import type { Match, MatchPrediction, ScorerPrediction, MatchEvent, ScoringRule } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────

const MATCH_ID = 'match-1'
const USER_ID = 'user-1'
const PLAYER_A = 'player-a'
const TEAM_HOME = 'team-home'
const TEAM_AWAY = 'team-away'
const RULES = DEFAULT_SCORING_RULES

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: MATCH_ID,
    tournament_id: 'tournament-1',
    external_id: null,
    match_number: 1,
    phase: 'group',
    group_name: 'A',
    home_team_id: TEAM_HOME,
    away_team_id: TEAM_AWAY,
    home_placeholder: null,
    away_placeholder: null,
    venue_id: null,
    kickoff_at: '2026-06-11T20:00:00Z',
    prediction_lock_at: '2026-06-11T19:59:00Z',
    status: 'finished',
    home_score: 2,
    away_score: 1,
    home_score_et: null,
    away_score_et: null,
    home_penalties: null,
    away_penalties: null,
    winner_team_id: TEAM_HOME,
    advancing_team_id: null,
    metadata: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function makePrediction(overrides: Partial<MatchPrediction> = {}): MatchPrediction {
  return {
    id: 'pred-1',
    match_id: MATCH_ID,
    user_id: USER_ID,
    predicted_home_score: 2,
    predicted_away_score: 1,
    predicted_winner_team_id: TEAM_HOME,
    predicted_draw: false,
    predicted_advancing_team_id: null,
    confidence: null,
    comment: null,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    locked_at: null,
    ...overrides,
  }
}

// ── isMatchLocked ─────────────────────────────────────────────────
describe('isMatchLocked', () => {
  it('returns false when more than 1 minute before kickoff', () => {
    const kickoff = new Date(Date.now() + 5 * 60_000).toISOString()
    expect(isMatchLocked(kickoff)).toBe(false)
  })

  it('returns true exactly at lock time (1 min before kickoff)', () => {
    const kickoff = new Date(Date.now() + 30_000).toISOString() // 30s from now → lock is 30s ago
    expect(isMatchLocked(kickoff)).toBe(true)
  })

  it('returns true after kickoff', () => {
    const kickoff = new Date(Date.now() - 10 * 60_000).toISOString()
    expect(isMatchLocked(kickoff)).toBe(true)
  })

  it('uses override date', () => {
    const kickoff = '2026-06-11T20:00:00Z'
    const nowBefore = new Date('2026-06-11T19:58:00Z') // 2 min before lock
    const nowAfter = new Date('2026-06-11T20:00:00Z')
    expect(isMatchLocked(kickoff, nowBefore)).toBe(false)
    expect(isMatchLocked(kickoff, nowAfter)).toBe(true)
  })
})

// ── msUntilLock ───────────────────────────────────────────────────
describe('msUntilLock', () => {
  it('returns positive ms when before lock', () => {
    const kickoff = '2026-06-11T20:00:00Z'
    const now = new Date('2026-06-11T19:55:00Z')
    expect(msUntilLock(kickoff, now)).toBeGreaterThan(0)
  })

  it('returns negative ms after lock', () => {
    const kickoff = '2026-06-11T20:00:00Z'
    const now = new Date('2026-06-11T20:05:00Z')
    expect(msUntilLock(kickoff, now)).toBeLessThan(0)
  })
})

// ── countPlayerGoals ──────────────────────────────────────────────
describe('countPlayerGoals', () => {
  const events: MatchEvent[] = [
    { id: '1', match_id: MATCH_ID, team_id: TEAM_HOME, player_id: PLAYER_A, event_type: 'goal', minute: 10, extra_minute: null, is_penalty: false, is_own_goal: false, metadata: null },
    { id: '2', match_id: MATCH_ID, team_id: TEAM_HOME, player_id: PLAYER_A, event_type: 'goal', minute: 45, extra_minute: null, is_penalty: false, is_own_goal: false, metadata: null },
    { id: '3', match_id: MATCH_ID, team_id: TEAM_HOME, player_id: PLAYER_A, event_type: 'own_goal', minute: 60, extra_minute: null, is_penalty: false, is_own_goal: true, metadata: null },
    { id: '4', match_id: MATCH_ID, team_id: TEAM_HOME, player_id: 'player-b', event_type: 'goal', minute: 70, extra_minute: null, is_penalty: false, is_own_goal: false, metadata: null },
  ]

  it('counts regular goals', () => {
    expect(countPlayerGoals(events, PLAYER_A)).toBe(2)
  })

  it('excludes own goals by default', () => {
    expect(countPlayerGoals(events, PLAYER_A, { countOwnGoals: false, countPenalties: true })).toBe(2)
  })

  it('counts own goals when enabled', () => {
    expect(countPlayerGoals(events, PLAYER_A, { countOwnGoals: true, countPenalties: true })).toBe(3)
  })

  it('returns 0 for player with no goals', () => {
    expect(countPlayerGoals(events, 'player-c')).toBe(0)
  })
})

// ── scoreMatchPrediction ──────────────────────────────────────────
describe('scoreMatchPrediction', () => {
  it('awards exact score + winner points (3+2=5)', () => {
    const match = makeMatch({ home_score: 2, away_score: 1 })
    const pred = makePrediction({ predicted_home_score: 2, predicted_away_score: 1 })
    const result = scoreMatchPrediction(match, pred, [], [], RULES)
    expect(result.total_points).toBe(5) // 3 exact + 2 winner
    expect(result.items.some((i) => i.category === 'exact_score')).toBe(true)
    expect(result.items.some((i) => i.category === 'correct_winner')).toBe(true)
  })

  it('awards only winner points when score is wrong but winner correct', () => {
    const match = makeMatch({ home_score: 3, away_score: 0 })
    const pred = makePrediction({ predicted_home_score: 1, predicted_away_score: 0 })
    const result = scoreMatchPrediction(match, pred, [], [], RULES)
    expect(result.total_points).toBe(2) // only winner
    expect(result.items.some((i) => i.category === 'exact_score')).toBe(false)
  })

  it('awards 0 when prediction is totally wrong', () => {
    const match = makeMatch({ home_score: 0, away_score: 2 })
    const pred = makePrediction({ predicted_home_score: 2, predicted_away_score: 0 })
    const result = scoreMatchPrediction(match, pred, [], [], RULES)
    expect(result.total_points).toBe(0)
  })

  it('awards draw points when both predict and actual are draw', () => {
    const match = makeMatch({ home_score: 1, away_score: 1 })
    const pred = makePrediction({ predicted_home_score: 1, predicted_away_score: 1 })
    const result = scoreMatchPrediction(match, pred, [], [], RULES)
    expect(result.total_points).toBe(5) // exact(3) + winner(2)
  })

  it('awards scorer points for each goal', () => {
    const match = makeMatch({ home_score: 2, away_score: 0 })
    const pred = makePrediction({ predicted_home_score: 2, predicted_away_score: 0 })
    const scorerPreds: ScorerPrediction[] = [{ id: 'sp1', match_prediction_id: 'pred-1', player_id: PLAYER_A, predicted_goals: 2, created_at: '', updated_at: '' }]
    const events: MatchEvent[] = [
      { id: 'e1', match_id: MATCH_ID, team_id: TEAM_HOME, player_id: PLAYER_A, event_type: 'goal', minute: 10, extra_minute: null, is_penalty: false, is_own_goal: false, metadata: null },
      { id: 'e2', match_id: MATCH_ID, team_id: TEAM_HOME, player_id: PLAYER_A, event_type: 'goal', minute: 35, extra_minute: null, is_penalty: false, is_own_goal: false, metadata: null },
    ]
    const result = scoreMatchPrediction(match, pred, scorerPreds, events, RULES)
    const scorerPoints = result.items.filter((i) => i.category === 'scorer_goal').reduce((s, i) => s + i.points, 0)
    expect(scorerPoints).toBe(2) // 2 goals × 1 point each
  })

  it('returns 0 when match is not finished', () => {
    const match = makeMatch({ status: 'live', home_score: null, away_score: null })
    const pred = makePrediction()
    const result = scoreMatchPrediction(match, pred, [], [], RULES)
    expect(result.total_points).toBe(0)
  })
})

// ── buildRulesMap ─────────────────────────────────────────────────
describe('buildRulesMap', () => {
  it('builds map from enabled rules only', () => {
    const rules: ScoringRule[] = [
      { id: '1', key: 'exact_score', points: 4, description: '', enabled: true, metadata: null },
      { id: '2', key: 'correct_winner', points: 2, description: '', enabled: false, metadata: null },
    ]
    const map = buildRulesMap(rules)
    expect(map['exact_score']).toBe(4)
    expect(map['correct_winner']).toBeUndefined()
  })
})

// ── estimateWinProbability ────────────────────────────────────────
describe('estimateWinProbability', () => {
  const entries = [
    { user_id: 'u1', total_points: 100, success_rate: 60 },
    { user_id: 'u2', total_points: 80, success_rate: 50 },
    { user_id: 'u3', total_points: 60, success_rate: 40 },
  ]

  it('returns a probability between 1 and 99', () => {
    const p = estimateWinProbability(entries[0], entries, 10)
    expect(p).toBeGreaterThanOrEqual(1)
    expect(p).toBeLessThanOrEqual(99)
  })

  it('leader has higher probability than last place', () => {
    const p1 = estimateWinProbability(entries[0], entries, 10)
    const p3 = estimateWinProbability(entries[2], entries, 10)
    expect(p1).toBeGreaterThan(p3)
  })
})
