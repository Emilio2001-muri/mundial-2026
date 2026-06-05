/**
 * Manual adapter — all data comes from the Supabase DB directly.
 * Used as fallback when no external API is configured.
 */
import type { FootballDataProvider, MatchDTO, EventDTO, LineupDTO, StandingDTO, TeamDTO, PlayerDTO } from './types'

export class ManualAdapter implements FootballDataProvider {
  name = 'manual'

  async getFixtures(): Promise<MatchDTO[]> {
    // ManualAdapter relies on the DB — return empty, admin enters data manually
    return []
  }

  async getLiveMatches(): Promise<MatchDTO[]> {
    return []
  }

  async getMatchEvents(): Promise<EventDTO[]> {
    return []
  }

  async getLineup(): Promise<LineupDTO | null> {
    return null
  }

  async getStandings(): Promise<StandingDTO[]> {
    return []
  }

  async getTeams(): Promise<TeamDTO[]> {
    return []
  }

  async getPlayers(): Promise<PlayerDTO[]> {
    return []
  }
}
