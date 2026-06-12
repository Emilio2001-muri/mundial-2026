import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchLiveFixtures, fetchMatchGoals } from '@/lib/football-data'
import { advanceBracket } from '@/lib/bracket-advance'
import { doScoreMatch, doRecalculateLeaderboard } from '@/lib/scoring/compute'

// Public endpoint called by client-side polling.
// No caching — always fetches fresh from football-data.org.
export const dynamic = 'force-dynamic'

const TOURNAMENT_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

export async function GET() {
  const admin = createAdminClient()

  const { fixtures, error } = await fetchLiveFixtures()
  if (error) return NextResponse.json({ error }, { status: 500 })
  if (!fixtures.length) return NextResponse.json({ updated: 0, live: false })

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
      .select('id, status, home_score, away_score, external_id, kickoff_at')
      .eq('tournament_id', TOURNAMENT_ID)
      .eq('home_team_id', homeId)
      .eq('away_team_id', awayId)
      .maybeSingle()

    if (!match) continue

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
  if (matchesToScore.length === 0) {
    try {
      await doRecalculateLeaderboard(TOURNAMENT_ID, admin)
    } catch (e) {
      console.error('[live-sync] leaderboard recalc error', e)
    }
  }

  // Catch-up: sync goal events for recently finished matches that have
  // no goal events yet — handles matches that finished before the poller
  // started or where the initial event sync failed.
  try {
    const { data: finishedMatches } = await admin
      .from('matches')
      .select('id, external_id, home_team_id, away_team_id, home_score, away_score')
      .eq('tournament_id', TOURNAMENT_ID)
      .eq('status', 'finished')
      .not('external_id', 'is', null)
      .order('kickoff_at', { ascending: false })
      .limit(10)

    let catchupCount = 0
    for (const m of finishedMatches ?? []) {
      if (catchupCount >= 2) break // max 2 API calls per poll (rate limit)
      const totalGoals = (m.home_score ?? 0) + (m.away_score ?? 0)
      if (totalGoals === 0) continue // 0-0 match, nothing to sync
      const { count } = await admin
        .from('match_events')
        .select('id', { count: 'exact', head: true })
        .eq('match_id', m.id)
        .in('event_type', ['goal', 'penalty', 'own_goal'])
      if ((count ?? 0) === 0 && m.home_team_id && m.away_team_id) {
        await syncGoalEvents(admin, m.id, m.external_id!, m.home_team_id, m.away_team_id)
        catchupCount++
      }
    }
  } catch (e) {
    console.error('[live-sync] catchup events error', e)
  }

  return NextResponse.json({
    updated,
    scored: matchesToScore.length,
    total: fixtures.length,
    live: hasLive,
    ts: new Date().toISOString(),
  })
}

/**
 * Fetch goal events from football-data.org match detail and upsert into match_events.
 * Matches player names to our players table by normalized name.
 * Fully replaces auto-generated events on every call (idempotent).
 */
async function syncGoalEvents(
  admin: ReturnType<typeof createAdminClient>,
  matchId: string,
  externalId: string,
  homeTeamId: string,
  awayTeamId: string
) {
  const { goals } = await fetchMatchGoals(externalId)
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
    // Full name match
    let hit = playerList.find((p) => p.team_id === teamId && norm(p.name) === n)
    if (hit) return hit.id
    // Last-name match
    const parts = n.split(' ')
    const lastName = parts[parts.length - 1]
    hit = playerList.find((p) => p.team_id === teamId && norm(p.name).endsWith(lastName))
    if (hit) return hit.id
    // Any significant word in common
    hit = playerList.find((p) => {
      const pn = norm(p.name)
      return p.team_id === teamId && parts.some((part) => part.length > 3 && pn.includes(part))
    })
    return hit?.id ?? null
  }

  // Delete all auto-generated events for this match (player_id = null means auto-created)
  await admin.from('match_events')
    .delete()
    .eq('match_id', matchId)
    .is('player_id', null)
    .in('event_type', ['goal', 'penalty', 'own_goal'])

  // Also wipe admin-entered events so we don't double-count when the admin
  // entered data manually before the API had player info.
  // ONLY wipe if we have real player data from the API (goals.some(g => g.scorerName))
  const hasPlayerData = goals.some((g) => g.scorerName.length > 0)
  if (hasPlayerData) {
    await admin.from('match_events')
      .delete()
      .eq('match_id', matchId)
      .in('event_type', ['goal', 'penalty', 'own_goal'])
  }

  const inserts = goals.map((g) => {
    // Determine which team scored. For OWN goals the team credited is the OPPONENT.
    let scoringTeamId = tmap[g.teamCode] ?? homeTeamId
    if (g.type === 'OWN') {
      // Own goal: credited to the team that benefited (opponent of the ball-toucher)
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
      // Always store raw scorer name so we can display it even when player_id is null
      metadata: g.scorerName ? { scorer_name: g.scorerName } : null,
    }
  })

  if (inserts.length > 0) {
    await admin.from('match_events').insert(inserts)
  }
}
