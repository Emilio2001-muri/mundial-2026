import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchLiveFixtures, fetchMatchGoals } from '@/lib/football-data'
import { advanceBracket } from '@/lib/bracket-advance'
import { doScoreMatch, doRecalculateLeaderboard } from '@/lib/scoring/compute'

// Public endpoint called by client-side polling.
// Cache-Control: 12s so Vercel CDN (and client) share a single response per 12s window,
// dramatically reducing serverless function executions and Supabase query load.
export const dynamic = 'force-dynamic'

// Module-level cache — reduces burst load when the same function instance
// handles multiple concurrent requests within a short window.
let _cache: { body: unknown; ts: number } | null = null
const CACHE_MS = 12_000

const TOURNAMENT_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

export async function GET() {
  const now = Date.now()

  // Serve from module-level cache within the same function instance burst window
  if (_cache && (now - _cache.ts) < CACHE_MS) {
    return NextResponse.json(_cache.body, {
      headers: { 'Cache-Control': 'public, s-maxage=12, stale-while-revalidate=12' },
    })
  }

  const admin = createAdminClient()

  // Catchup: re-sync goal events for matches that finished in the last 3 hours
  // (limited window to reduce unnecessary API calls)
  let catchupScored = 0
  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    const { data: finishedMatches } = await admin
      .from('matches')
      .select('id, external_id, home_team_id, away_team_id, home_score, away_score')
      .eq('tournament_id', TOURNAMENT_ID)
      .eq('status', 'finished')
      .not('external_id', 'is', null)
      .gte('kickoff_at', threeHoursAgo)
      .order('kickoff_at', { ascending: false })
      .limit(5)

    let catchupApiCalls = 0
    for (const m of finishedMatches ?? []) {
      if (catchupApiCalls >= 2) break
      const totalGoals = (m.home_score ?? 0) + (m.away_score ?? 0)
      if (totalGoals === 0) continue

      const { count } = await admin
        .from('match_events')
        .select('id', { count: 'exact', head: true })
        .eq('match_id', m.id)
        .in('event_type', ['goal', 'penalty', 'own_goal'])

      const eventCount = count ?? 0
      if (eventCount < totalGoals && m.home_team_id && m.away_team_id) {
        await syncGoalEvents(admin, m.id, m.external_id!, m.home_team_id, m.away_team_id)
        catchupApiCalls++
        try {
          await doScoreMatch(m.id, admin)
          catchupScored++
        } catch (e) {
          console.error('[live-sync] catchup re-score error', m.id, e)
        }
      }
    }
  } catch (e) {
    console.error('[live-sync] catchup events error', e)
  }

  const { fixtures, error } = await fetchLiveFixtures()
  if (error) return NextResponse.json({ error, catchupScored }, { status: 500 })
  if (!fixtures.length) {
    const body = { updated: 0, live: false, catchupScored }
    _cache = { body, ts: Date.now() }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, s-maxage=12, stale-while-revalidate=12' },
    })
  }

  // Load all teams by code
  const { data: teams } = await admin.from('teams').select('id, fifa_code')
  const teamMap: Record<string, string> = {}
  for (const t of teams ?? []) teamMap[t.fifa_code] = t.id

  let updated = 0
  let hasLive = false
  const matchesToScore: string[] = []

  for (const f of fixtures) {
    if (f.status === 'live' || f.status === 'finished') hasLive = hasLive || f.status === 'live'

    const homeId = teamMap[f.home_code]
    const awayId = teamMap[f.away_code]
    if (!homeId || !awayId) continue

    const { data: match } = await admin
      .from('matches')
      .select('id, status, home_score, away_score, external_id, kickoff_at, score_override')
      .eq('tournament_id', TOURNAMENT_ID)
      .eq('home_team_id', homeId)
      .eq('away_team_id', awayId)
      .maybeSingle()

    if (!match) continue

    // Never overwrite scores that an admin manually set.
    if (match.score_override) continue

    const prevHome = match.home_score ?? 0
    const prevAway = match.away_score ?? 0
    const newHome = f.home_score ?? 0
    const newAway = f.away_score ?? 0
    const scoreChanged = prevHome !== newHome || prevAway !== newAway
    const becameFinished = f.status === 'finished' && match.status !== 'finished'
    const isActive = f.status === 'live' || f.status === 'finished'

    // Only process matches that are live or finished
    if (!isActive) continue

    await admin.from('matches').update({
      external_id: f.external_id,
      kickoff_at: f.kickoff_utc,
      status: f.status,
      home_score: f.home_score,
      away_score: f.away_score,
      home_score_et: f.home_score_et,
      away_score_et: f.away_score_et,
      home_penalties: f.home_penalties,
      away_penalties: f.away_penalties,
    }).eq('id', match.id)

    updated++

    // Sync goal events:
    // - always for live matches (so events appear immediately as goals are scored)
    // - on score change or when match just finished
    const externalId = match.external_id ?? f.external_id
    const shouldSyncEvents = f.status === 'live' || scoreChanged || becameFinished
    if (shouldSyncEvents && externalId) {
      await syncGoalEvents(admin, match.id, externalId, homeId, awayId)
    }
    if (scoreChanged || becameFinished) {
      matchesToScore.push(match.id)
    }
  }

  if (updated > 0) {
    await advanceBracket(admin)
  }

  for (const matchId of matchesToScore) {
    try {
      await doScoreMatch(matchId, admin)
    } catch (e) {
      console.error('[live-sync] scoring error', matchId, e)
    }
  }

  // Always recalculate leaderboard so success_rate is never stale
  // (doScoreMatch already does this when matches score, but we need it
  // even when no match scored in this poll to fix old 0% snapshots)
  if (matchesToScore.length === 0 && catchupScored === 0) {
    try {
      await doRecalculateLeaderboard(TOURNAMENT_ID, admin)
    } catch (e) {
      console.error('[live-sync] leaderboard recalc error', e)
    }
  }

  const body = {
    updated,
    scored: matchesToScore.length + catchupScored,
    total: fixtures.length,
    live: hasLive,
    ts: new Date().toISOString(),
  }
  _cache = { body, ts: Date.now() }
  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'public, s-maxage=12, stale-while-revalidate=12' },
  })
}

/**
 * Fetch goal events from football-data.org match detail and upsert into match_events.
 * Matches player names to our players table by normalized name.
 *
 * Strategy to avoid overwriting admin-entered events:
 *  - API events are tagged with metadata.source = 'api'
 *  - Only events with source='api' OR player_id=null are replaced on each poll
 *  - Admin-entered events (no source='api', have player_id) are never touched
 */
async function syncGoalEvents(
  admin: ReturnType<typeof createAdminClient>,
  matchId: string,
  externalId: string,
  homeTeamId: string,
  awayTeamId: string
) {
  const { goals, error: apiError } = await fetchMatchGoals(externalId)
  console.log(`[syncGoalEvents] match=${matchId} ext=${externalId} goals=${goals.length} apiError=${apiError ?? 'none'}`)
  if (!goals.length) return

  // Load players for both teams
  const { data: players } = await admin
    .from('players')
    .select('id, name, team_id')
    .in('team_id', [homeTeamId, awayTeamId])

  const playerList = players ?? []

  // Load teams to map code → id
  const { data: allTeams } = await admin.from('teams').select('id, fifa_code')
  const tmap: Record<string, string> = {}
  for (const t of allTeams ?? []) tmap[t.fifa_code] = t.id

  // Normalize name for fuzzy matching: lowercase, remove diacritics, strip punctuation
  function norm(s: string) {
    return s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, '')
      .trim()
  }

  function findPlayer(name: string, teamId: string): string | null {
    if (!name) return null
    const n = norm(name)
    const parts = n.split(' ').filter(Boolean)

    // Full name match
    let hit = playerList.find((p) => p.team_id === teamId && norm(p.name) === n)
    if (hit) return hit.id

    // Handle abbreviated first name: "b gutierrez" → initial 'b', last name 'gutierrez'
    if (parts.length >= 2 && parts[0].length === 1) {
      const initial = parts[0]
      const lastName = parts[parts.length - 1]
      hit = playerList.find((p) => {
        const pParts = norm(p.name).split(' ').filter(Boolean)
        return p.team_id === teamId &&
          pParts[pParts.length - 1] === lastName &&
          pParts[0].startsWith(initial)
      })
      if (hit) return hit.id
    }

    // Last-name match (last word)
    const lastName = parts[parts.length - 1]
    if (lastName.length > 2) {
      hit = playerList.find((p) => p.team_id === teamId && norm(p.name).endsWith(lastName))
      if (hit) return hit.id
    }

    // Any significant word in common (length > 3)
    hit = playerList.find((p) => {
      const pn = norm(p.name)
      return p.team_id === teamId && parts.some((part) => part.length > 3 && pn.includes(part))
    })
    if (hit) return hit.id

    // Last resort: search across all teams (handles team code mismatches from API)
    hit = playerList.find((p) => {
      const pn = norm(p.name)
      return parts.some((part) => part.length > 4 && pn.includes(part))
    })
    return hit?.id ?? null
  }

  // Delete only API-auto-generated events (tagged source='api') and unmatched nulls.
  // Admin-manually-entered events (no source tag) are NEVER deleted here.
  await admin.from('match_events')
    .delete()
    .eq('match_id', matchId)
    .is('player_id', null)
    .in('event_type', ['goal', 'penalty', 'own_goal'])

  // Delete previous API-sourced events (those tagged metadata.source='api')
  await admin.from('match_events')
    .delete()
    .eq('match_id', matchId)
    .in('event_type', ['goal', 'penalty', 'own_goal'])
    .filter('metadata->>source', 'eq', 'api')

  const inserts = goals.map((g) => {
    // Determine which team scored. For OWN goals the team credited is the OPPONENT.
    let scoringTeamId = tmap[g.teamCode] ?? homeTeamId
    if (g.type === 'OWN') {
      scoringTeamId = scoringTeamId === homeTeamId ? awayTeamId : homeTeamId
    }
    const playerId = findPlayer(g.scorerName, tmap[g.teamCode] ?? homeTeamId)
    return {
      match_id: matchId,
      team_id: scoringTeamId,
      player_id: playerId,
      event_type: g.type === 'PENALTY' ? 'penalty' : g.type === 'OWN' ? 'own_goal' : 'goal',
      minute: g.minute + (g.injuryTime ?? 0),
      is_penalty: g.type === 'PENALTY',
      is_own_goal: g.type === 'OWN',
      // Tag as API-sourced so we can distinguish from admin-entered events
      metadata: { source: 'api', scorer_name: g.scorerName || '' },
    }
  })

  if (inserts.length > 0) {
    const { error: insertError } = await admin.from('match_events').insert(inserts)
    console.log(`[syncGoalEvents] inserted ${inserts.length} events for match=${matchId}, error=${insertError?.message ?? 'none'}`)
  }
}
