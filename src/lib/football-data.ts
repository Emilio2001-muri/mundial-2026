// football-data.org API integration
// Free plan: 10 req/min, covers World Cup 2026
// Register at: https://www.football-data.org/client/register
// Set env: FOOTBALL_DATA_API_KEY=your_key_here
//          FOOTBALL_DATA_COMPETITION=2000  (2000 = World Cup)

const API_BASE = 'https://api.football-data.org/v4'
const COMPETITION_ID = process.env.FOOTBALL_DATA_COMPETITION ?? '2000'

// football-data.org stage → our phase name
const STAGE_MAP: Record<string, string> = {
  GROUP_STAGE:    'group',
  ROUND_OF_32:    'round_of_32',
  LAST_32:        'round_of_32',
  ROUND_OF_16:    'round_of_16',
  LAST_16:        'round_of_16',
  QUARTER_FINALS: 'quarter_final',
  SEMI_FINALS:    'semi_final',
  THIRD_PLACE:    'third_place',
  FINAL:          'final',
}

// Extract group letter from "GROUP_A" → "A"
function extractGroup(group?: string | null): string | null {
  if (!group) return null
  const m = group.match(/GROUP_([A-L])/)
  return m ? m[1] : null
}

interface FDMatch {
  id: number
  matchday?: number
  stage: string
  group?: string | null
  utcDate: string
  status: string
  homeTeam: { tla: string; shortName: string; name: string }
  awayTeam: { tla: string; shortName: string; name: string }
  score: {
    fullTime: { home: number | null; away: number | null }
    extraTime?: { home: number | null; away: number | null } | null
    penalties?: { home: number | null; away: number | null } | null
  }
}

export interface FixtureUpdate {
  external_id: string
  kickoff_utc: string
  phase: string
  group_name: string | null
  status: 'scheduled' | 'live' | 'finished' | 'postponed'
  home_code: string
  home_name: string
  away_code: string
  away_name: string
  home_score: number | null
  away_score: number | null
  home_score_et: number | null
  away_score_et: number | null
  home_penalties: number | null
  away_penalties: number | null
}

function mapStatus(s: string): 'scheduled' | 'live' | 'finished' | 'postponed' {
  if (['LIVE', 'IN_PLAY', 'PAUSED', 'HALFTIME'].includes(s)) return 'live'
  if (['FINISHED', 'AWARDED'].includes(s)) return 'finished'
  if (['POSTPONED', 'CANCELLED', 'SUSPENDED'].includes(s)) return 'postponed'
  return 'scheduled'
}

export async function fetchLiveFixtures(): Promise<{ fixtures: FixtureUpdate[]; error?: string }> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return { fixtures: [], error: 'FOOTBALL_DATA_API_KEY no configurada' }
  }

  try {
    const res = await fetch(`${API_BASE}/competitions/${COMPETITION_ID}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 15 }, // Server-side cache: 15s deduplicate across concurrent users
    })
    if (!res.ok) {
      const text = await res.text()
      return { fixtures: [], error: `API error ${res.status}: ${text}` }
    }
    const data = await res.json() as { matches: FDMatch[] }
    const fixtures: FixtureUpdate[] = data.matches.map((m) => ({
      external_id: String(m.id),
      kickoff_utc: m.utcDate,
      phase: STAGE_MAP[m.stage] ?? 'group',
      group_name: extractGroup(m.group),
      status: mapStatus(m.status),
      home_code: m.homeTeam.tla,
      home_name: m.homeTeam.name,
      away_code: m.awayTeam.tla,
      away_name: m.awayTeam.name,
      home_score: m.score.fullTime.home,
      away_score: m.score.fullTime.away,
      home_score_et: m.score.extraTime?.home ?? null,
      away_score_et: m.score.extraTime?.away ?? null,
      home_penalties: m.score.penalties?.home ?? null,
      away_penalties: m.score.penalties?.away ?? null,
    }))
    return { fixtures }
  } catch (err) {
    return { fixtures: [], error: String(err) }
  }
}

