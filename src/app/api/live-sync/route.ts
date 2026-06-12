import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchLiveFixtures } from '@/lib/football-data'
import { advanceBracket } from '@/lib/bracket-advance'
import { doScoreMatch } from '@/lib/scoring/compute'

// Public endpoint called by client-side polling.
// No caching — always fetches fresh from football-data.org.
export const dynamic = 'force-dynamic'

const TOURNAMENT_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

/** Estimated match minute from kickoff_at (same model as UI) */
function estimateMinute(kickoffAt: string): number {
  const elapsed = (Date.now() - new Date(kickoffAt).getTime()) / 60_000
  if (elapsed <= 47) return Math.floor(Math.max(1, elapsed))
  if (elapsed <= 62) return 45
  return Math.min(120, Math.floor(45 + (elapsed - 62)))
}

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
    if (f.status === 'live') hasLive = true

    const homeId = teamMap[f.home_code]
    const awayId = teamMap[f.away_code]
    if (!homeId || !awayId) continue

    const { data: match } = await admin
      .from('matches')
      .select('id, status, home_score, away_score, kickoff_at')
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

    await admin.from('matches').update({
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

    // Auto-create anonymous goal events when score increases (player unknown from free API)
    // We reconcile: if existing events < new score for that team, add the difference
    if (scoreChanged || becameFinished) {
      const kickoffAt = f.kickoff_utc ?? match.kickoff_at
      const minute = estimateMinute(kickoffAt)

      const { data: existingEvents } = await admin
        .from('match_events')
        .select('id, team_id')
        .eq('match_id', match.id)
        .in('event_type', ['goal', 'penalty'])

      const homeGoalCount = (existingEvents ?? []).filter((e: { team_id: string }) => e.team_id === homeId).length
      const awayGoalCount = (existingEvents ?? []).filter((e: { team_id: string }) => e.team_id === awayId).length

      const newEventsToInsert = []

      // Add missing home goals
      for (let i = homeGoalCount; i < newHome; i++) {
        newEventsToInsert.push({
          match_id: match.id,
          team_id: homeId,
          player_id: null,
          event_type: 'goal',
          minute: Math.max(1, minute - (newHome - 1 - i) * 2), // stagger by 2 min if multiple goals
          is_penalty: false,
          is_own_goal: false,
        })
      }
      // Add missing away goals
      for (let i = awayGoalCount; i < newAway; i++) {
        newEventsToInsert.push({
          match_id: match.id,
          team_id: awayId,
          player_id: null,
          event_type: 'goal',
          minute: Math.max(1, minute - (newAway - 1 - i) * 2),
          is_penalty: false,
          is_own_goal: false,
        })
      }

      if (newEventsToInsert.length > 0) {
        await admin.from('match_events').insert(newEventsToInsert)
      }
    }

    // Queue scoring
    if (becameFinished || scoreChanged) {
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

  return NextResponse.json({
    updated,
    scored: matchesToScore.length,
    total: fixtures.length,
    live: hasLive,
    ts: new Date().toISOString(),
  })
}
