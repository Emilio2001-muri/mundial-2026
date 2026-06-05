/**
 * Generic DTOs for football data providers.
 * Adapters normalize external API responses into these shapes.
 */

export interface MatchDTO {
  external_id: string
  match_number: number
  phase: string
  group_name: string | null
  home_team_code: string | null
  away_team_code: string | null
  home_placeholder: string | null
  away_placeholder: string | null
  venue_name: string | null
  venue_city: string | null
  venue_timezone: string | null
  kickoff_utc: string // ISO UTC
  status: string
  home_score: number | null
  away_score: number | null
  home_score_et: number | null
  away_score_et: number | null
  home_penalties: number | null
  away_penalties: number | null
}

export interface TeamDTO {
  fifa_code: string
  name: string
  flag_url: string | null
  group_name: string | null
  confederation: string | null
}

export interface PlayerDTO {
  external_id: string | null
  team_code: string
  name: string
  position: string | null
  shirt_number: number | null
}

export interface LineupDTO {
  match_external_id: string
  team_code: string
  starters: Array<{ player_external_id: string | null; name: string; position: string | null; shirt_number: number | null }>
  bench: Array<{ player_external_id: string | null; name: string; position: string | null; shirt_number: number | null }>
}

export interface EventDTO {
  match_external_id: string
  team_code: string
  player_name: string
  player_external_id: string | null
  event_type: 'goal' | 'own_goal' | 'penalty' | 'yellow_card' | 'red_card' | 'substitution'
  minute: number
  extra_minute: number | null
  is_penalty: boolean
  is_own_goal: boolean
}

export interface StandingDTO {
  group_name: string
  team_code: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  points: number
}

export interface TournamentStatsDTO {
  top_scorers: Array<{ player_name: string; team_code: string; goals: number }>
  top_assists: Array<{ player_name: string; team_code: string; assists: number }>
  total_goals: number
}

// ─────────────────────────────────────────────
// Provider interface
// ─────────────────────────────────────────────
export interface FootballDataProvider {
  name: string
  getFixtures(tournamentId?: string): Promise<MatchDTO[]>
  getLiveMatches(): Promise<MatchDTO[]>
  getMatchEvents(externalMatchId: string): Promise<EventDTO[]>
  getLineup(externalMatchId: string): Promise<LineupDTO | null>
  getStandings(tournamentId?: string): Promise<StandingDTO[]>
  getTeams(tournamentId?: string): Promise<TeamDTO[]>
  getPlayers(teamCode: string): Promise<PlayerDTO[]>
}
