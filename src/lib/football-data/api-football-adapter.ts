/**
 * API-Football adapter (api-sports.io / rapid-api)
 * Free tier: 100 requests/day
 * https://www.api-football.com/documentation-v3
 */
import type {
  FootballDataProvider,
  MatchDTO,
  EventDTO,
  LineupDTO,
  StandingDTO,
  TeamDTO,
  PlayerDTO,
} from './types'

const FIFA_WC_2026_ID = 1 // Update with actual API-Football tournament ID

interface ApiResponse<T> {
  results: number
  response: T[]
  errors: unknown
}

export class ApiFootballAdapter implements FootballDataProvider {
  name = 'api-football'
  private baseUrl: string
  private apiKey: string
  private leagueId: number

  constructor(
    apiKey: string,
    baseUrl = 'https://v3.football.api-sports.io',
    leagueId = FIFA_WC_2026_ID
  ) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
    this.leagueId = leagueId
  }

  private async fetch<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
    const url = new URL(`${this.baseUrl}${path}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

    const res = await fetch(url.toString(), {
      headers: {
        'x-apisports-key': this.apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      console.error(`[ApiFootball] ${path} failed: ${res.status}`)
      return []
    }

    const json: ApiResponse<T> = await res.json()
    return json.response ?? []
  }

  async getFixtures(): Promise<MatchDTO[]> {
    const raw = await this.fetch<Record<string, unknown>>('/fixtures', {
      league: String(this.leagueId),
      season: '2026',
    })

    return raw.map((f) => {
      const fix = f as Record<string, Record<string, unknown>>
      const fixture = fix.fixture as Record<string, unknown>
      const teams = fix.teams as Record<string, Record<string, unknown>>
      const goals = fix.goals as Record<string, number | null>
      const score = fix.score as Record<string, Record<string, number | null>>
      const venue = fix.venue as Record<string, string>

      return {
        external_id: String(fixture.id),
        match_number: 0,
        phase: String(fix.league?.round ?? 'group'),
        group_name: null,
        home_team_code: String(teams.home?.code ?? ''),
        away_team_code: String(teams.away?.code ?? ''),
        home_placeholder: null,
        away_placeholder: null,
        venue_name: venue?.name ?? null,
        venue_city: venue?.city ?? null,
        venue_timezone: null,
        kickoff_utc: String(fixture.date),
        status: String((fixture.status as Record<string, string>)?.short ?? 'NS'),
        home_score: goals?.home ?? null,
        away_score: goals?.away ?? null,
        home_score_et: score?.extratime?.home ?? null,
        away_score_et: score?.extratime?.away ?? null,
        home_penalties: score?.penalty?.home ?? null,
        away_penalties: score?.penalty?.away ?? null,
      }
    })
  }

  async getLiveMatches(): Promise<MatchDTO[]> {
    const raw = await this.fetch<Record<string, unknown>>('/fixtures', {
      league: String(this.leagueId),
      season: '2026',
      live: 'all',
    })
    return raw.map((f) => {
      const fix = f as Record<string, Record<string, unknown>>
      const fixture = fix.fixture as Record<string, unknown>
      const teams = fix.teams as Record<string, Record<string, unknown>>
      const goals = fix.goals as Record<string, number | null>
      return {
        external_id: String(fixture.id),
        match_number: 0,
        phase: 'group',
        group_name: null,
        home_team_code: String(teams.home?.code ?? ''),
        away_team_code: String(teams.away?.code ?? ''),
        home_placeholder: null,
        away_placeholder: null,
        venue_name: null,
        venue_city: null,
        venue_timezone: null,
        kickoff_utc: String(fixture.date),
        status: 'live',
        home_score: goals?.home ?? null,
        away_score: goals?.away ?? null,
        home_score_et: null,
        away_score_et: null,
        home_penalties: null,
        away_penalties: null,
      }
    })
  }

  async getMatchEvents(externalMatchId: string): Promise<EventDTO[]> {
    const raw = await this.fetch<Record<string, unknown>>('/fixtures/events', {
      fixture: externalMatchId,
    })

    return raw.map((e) => {
      const ev = e as Record<string, unknown>
      const type = String(ev.type ?? '').toLowerCase()
      const detail = String(ev.detail ?? '').toLowerCase()
      const time = ev.time as Record<string, number | null>
      const team = ev.team as Record<string, unknown>
      const player = ev.player as Record<string, unknown>

      return {
        match_external_id: externalMatchId,
        team_code: String(team?.id ?? ''),
        player_name: String(player?.name ?? ''),
        player_external_id: player?.id ? String(player.id) : null,
        event_type:
          detail.includes('own goal') ? 'own_goal'
          : detail.includes('penalty') && type === 'goal' ? 'penalty'
          : type === 'goal' ? 'goal'
          : type === 'card' && detail.includes('yellow') ? 'yellow_card'
          : type === 'card' ? 'red_card'
          : 'substitution',
        minute: time?.elapsed ?? 0,
        extra_minute: time?.extra ?? null,
        is_penalty: detail.includes('penalty'),
        is_own_goal: detail.includes('own goal'),
      }
    })
  }

  async getLineup(externalMatchId: string): Promise<LineupDTO | null> {
    const raw = await this.fetch<Record<string, unknown>>('/fixtures/lineups', {
      fixture: externalMatchId,
    })

    if (!raw.length) return null

    const home = raw[0] as Record<string, unknown>
    const team = home.team as Record<string, unknown>
    const startXI = (home.startXI as Array<Record<string, unknown>>) ?? []
    const bench = (home.substitutes as Array<Record<string, unknown>>) ?? []

    return {
      match_external_id: externalMatchId,
      team_code: String(team?.code ?? ''),
      starters: startXI.map((p) => {
        const player = p.player as Record<string, unknown>
        return {
          player_external_id: player?.id ? String(player.id) : null,
          name: String(player?.name ?? ''),
          position: String((player?.pos as string) ?? ''),
          shirt_number: Number(player?.number ?? 0),
        }
      }),
      bench: bench.map((p) => {
        const player = p.player as Record<string, unknown>
        return {
          player_external_id: player?.id ? String(player.id) : null,
          name: String(player?.name ?? ''),
          position: String((player?.pos as string) ?? ''),
          shirt_number: Number(player?.number ?? 0),
        }
      }),
    }
  }

  async getStandings(): Promise<StandingDTO[]> {
    const raw = await this.fetch<Record<string, unknown>>('/standings', {
      league: String(this.leagueId),
      season: '2026',
    })

    const result: StandingDTO[] = []
    for (const league of raw) {
      const standings = ((league as Record<string, unknown>).league as Record<string, unknown>)
      const groups = (standings?.standings as unknown[][]) ?? []
      for (const group of groups) {
        for (const entry of group) {
          const e = entry as Record<string, unknown>
          const team = e.team as Record<string, unknown>
          const all = e.all as Record<string, unknown>
          const goals = all.goals as Record<string, number>
          result.push({
            group_name: String(e.group ?? ''),
            team_code: String(team?.code ?? ''),
            played: Number(all.played ?? 0),
            won: Number((all as Record<string, number>).win ?? 0),
            drawn: Number((all as Record<string, number>).draw ?? 0),
            lost: Number((all as Record<string, number>).lose ?? 0),
            goals_for: goals?.for ?? 0,
            goals_against: goals?.against ?? 0,
            points: Number(e.points ?? 0),
          })
        }
      }
    }
    return result
  }

  async getTeams(): Promise<TeamDTO[]> {
    const raw = await this.fetch<Record<string, unknown>>('/teams', {
      league: String(this.leagueId),
      season: '2026',
    })
    return raw.map((r) => {
      const t = (r as Record<string, Record<string, unknown>>).team
      return {
        fifa_code: String(t?.code ?? ''),
        name: String(t?.name ?? ''),
        flag_url: String((t?.logo as string) ?? ''),
        group_name: null,
        confederation: null,
      }
    })
  }

  async getPlayers(teamCode: string): Promise<PlayerDTO[]> {
    // API-Football uses team ID, not code — this would need a lookup
    console.warn(`[ApiFootball] getPlayers called for team ${teamCode} — needs team ID mapping`)
    return []
  }
}
