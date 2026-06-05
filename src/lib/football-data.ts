// football-data.org API integration
// Free plan: 10 req/min, covers World Cup 2026
// Register at: https://www.football-data.org/client/register
// Set env: FOOTBALL_DATA_API_KEY=your_key_here
//          FOOTBALL_DATA_COMPETITION=2000  (2000 = World Cup)

const API_BASE = 'https://api.football-data.org/v4'
const COMPETITION_ID = process.env.FOOTBALL_DATA_COMPETITION ?? '2000'

interface FDMatch {
  id: number
  matchday?: number
  utcDate: string
  status: string // SCHEDULED | LIVE | IN_PLAY | PAUSED | FINISHED | POSTPONED | CANCELLED
  homeTeam: { tla: string; shortName: string }
  awayTeam: { tla: string; shortName: string }
  score: {
    fullTime: { home: number | null; away: number | null }
    extraTime: { home: number | null; away: number | null }
    penalties: { home: number | null; away: number | null }
  }
}

export interface FixtureUpdate {
  external_id: string
  kickoff_utc: string
  status: 'scheduled' | 'live' | 'finished' | 'postponed'
  home_code: string
  away_code: string
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
    return { fixtures: [], error: 'FOOTBALL_DATA_API_KEY no configurada. Regístrate en football-data.org y agrega la clave al .env.local' }
  }

  try {
    const res = await fetch(`${API_BASE}/competitions/${COMPETITION_ID}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 60 }, // cache 1 min
    })
    if (!res.ok) {
      const text = await res.text()
      return { fixtures: [], error: `API error ${res.status}: ${text}` }
    }
    const data = await res.json() as { matches: FDMatch[] }
    const fixtures: FixtureUpdate[] = data.matches.map((m) => ({
      external_id: String(m.id),
      kickoff_utc: m.utcDate,
      status: mapStatus(m.status),
      home_code: m.homeTeam.tla,
      away_code: m.awayTeam.tla,
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
