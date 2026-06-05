// ─────────────────────────────────────────────
// Database row types (auto-generated shape)
// ─────────────────────────────────────────────

export type UserRole = 'admin' | 'user'
export type MatchStatus =
  | 'scheduled'
  | 'locked'
  | 'live'
  | 'finished'
  | 'postponed'
export type PredictionStatus = 'draft' | 'submitted' | 'locked' | 'scored'
export type MatchPhase =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarter_final'
  | 'semi_final'
  | 'third_place'
  | 'final'
export type EventType =
  | 'goal'
  | 'own_goal'
  | 'penalty'
  | 'yellow_card'
  | 'red_card'
  | 'substitution'
export type LineupStatus = 'starting' | 'bench' | 'not_called'
export type TournamentStatus = 'upcoming' | 'active' | 'finished'
export type ScoreCategory =
  | 'exact_score'
  | 'correct_winner'
  | 'scorer_goal'
  | 'global_champion'
  | 'global_runner_up'
  | 'global_third'
  | 'global_finalist'
  | 'golden_ball'
  | 'silver_ball'
  | 'bronze_ball'
  | 'golden_boot'
  | 'golden_glove'
  | 'best_young'

// ─────────────────────────────────────────────
// DB Table types
// ─────────────────────────────────────────────

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  role: UserRole
  timezone: string
  created_at: string
  updated_at: string
}

export interface Tournament {
  id: string
  name: string
  year: number
  starts_at: string
  ends_at: string
  global_predictions_lock_at: string
  status: TournamentStatus
}

export interface Team {
  id: string
  fifa_code: string
  name: string
  flag_url: string | null
  group_name: string | null
  confederation: string | null
  metadata: Record<string, unknown> | null
}

export interface Player {
  id: string
  team_id: string
  name: string
  position: string | null
  shirt_number: number | null
  active: boolean
  metadata: Record<string, unknown> | null
}

export interface Venue {
  id: string
  name: string
  city: string
  country: string
  timezone: string
  metadata: Record<string, unknown> | null
}

export interface Match {
  id: string
  tournament_id: string
  external_id: string | null
  match_number: number
  phase: MatchPhase
  group_name: string | null
  home_team_id: string | null
  away_team_id: string | null
  home_placeholder: string | null
  away_placeholder: string | null
  venue_id: string | null
  kickoff_at: string
  prediction_lock_at: string
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  home_score_et: number | null
  away_score_et: number | null
  home_penalties: number | null
  away_penalties: number | null
  winner_team_id: string | null
  advancing_team_id: string | null
  metadata: Record<string, unknown> | null
  updated_at: string
}

export interface MatchWithTeams extends Match {
  home_team: Team | null
  away_team: Team | null
  venue: Venue | null
}

export interface MatchPrediction {
  id: string
  match_id: string
  user_id: string
  predicted_home_score: number | null
  predicted_away_score: number | null
  predicted_winner_team_id: string | null
  predicted_draw: boolean | null
  predicted_advancing_team_id: string | null
  confidence: number | null
  comment: string | null
  status: PredictionStatus
  submitted_at: string | null
  updated_at: string
  locked_at: string | null
}

export interface ScorerPrediction {
  id: string
  match_prediction_id: string
  player_id: string
  predicted_goals: number
  created_at: string
  updated_at: string
}

export interface MatchEvent {
  id: string
  match_id: string
  team_id: string | null
  player_id: string | null
  event_type: EventType
  minute: number
  extra_minute: number | null
  is_penalty: boolean
  is_own_goal: boolean
  metadata: Record<string, unknown> | null
}

export interface Lineup {
  id: string
  match_id: string
  team_id: string
  player_id: string
  status: LineupStatus
  position: string | null
  shirt_number: number | null
  metadata: Record<string, unknown> | null
}

export interface GlobalPrediction {
  id: string
  tournament_id: string
  user_id: string
  champion_team_id: string | null
  runner_up_team_id: string | null
  third_place_team_id: string | null
  finalist_one_team_id: string | null
  finalist_two_team_id: string | null
  golden_ball_player_id: string | null
  silver_ball_player_id: string | null
  bronze_ball_player_id: string | null
  golden_boot_player_id: string | null
  golden_glove_player_id: string | null
  best_young_player_id: string | null
  submitted_at: string | null
  updated_at: string
  locked_at: string | null
}

export interface ScoringRule {
  id: string
  key: string
  points: number
  description: string
  enabled: boolean
  metadata: Record<string, unknown> | null
}

export interface PredictionScore {
  id: string
  user_id: string
  match_id: string | null
  prediction_id: string | null
  category: ScoreCategory
  points: number
  reason: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface LeaderboardSnapshot {
  id: string
  tournament_id: string
  user_id: string
  total_points: number
  rank: number
  previous_rank: number | null
  exact_scores_count: number
  winners_count: number
  scorer_points: number
  global_points: number
  success_rate: number
  created_at: string
  // Joined
  profile?: Profile
}

export interface AuditLog {
  id: string
  actor_user_id: string
  action: string
  entity_type: string
  entity_id: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  created_at: string
  // Joined
  actor?: Profile
}

// ─────────────────────────────────────────────
// Derived / UI types
// ─────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number
  previous_rank: number | null
  movement: 'up' | 'down' | 'same' | 'new'
  user_id: string
  display_name: string
  avatar_url: string | null
  total_points: number
  exact_scores_count: number
  winners_count: number
  scorer_points: number
  global_points: number
  success_rate: number
}

export interface MatchScoreBreakdown {
  user_id: string
  match_id: string
  total_points: number
  items: ScoreItem[]
}

export interface ScoreItem {
  category: ScoreCategory
  points: number
  reason: string
}

export interface PredictionWithScores extends MatchPrediction {
  scorer_predictions: ScorerPrediction[]
  score_breakdown?: MatchScoreBreakdown
}

export interface MatchWithPrediction extends MatchWithTeams {
  my_prediction?: PredictionWithScores
}

export interface WinProbability {
  user_id: string
  probability: number
  current_points: number
  max_remaining_points: number
  avg_points_per_match: number
  recent_form_factor: number
  explanation: string
  factors: Array<{ label: string; impact: 'positive' | 'negative' | 'neutral'; description: string }>
}

export interface LiveFeedItem {
  id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  message: string
  points?: number
  category?: ScoreCategory
  created_at: string
}

export interface TournamentStats {
  top_scorers: Array<{ player: Player; team: Team; goals: number }>
  top_assists: Array<{ player: Player; team: Team; assists: number }>
  clean_sheets: Array<{ team: Team; count: number }>
  goals_per_team: Array<{ team: Team; goals_for: number; goals_against: number }>
  best_attack: Team | null
  best_defense: Team | null
  total_goals: number
  avg_goals_per_match: number
  matches_played: number
}
