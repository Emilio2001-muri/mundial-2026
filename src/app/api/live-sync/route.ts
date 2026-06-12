import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchLiveFixtures } from '@/lib/football-data'
import { advanceBracket } from '@/lib/bracket-advance'
import { doScoreMatch } from '@/lib/scoring/compute'

// Public endpoint called by client-side polling.
// No caching — always fetches fresh from football-data.org.
// The football-data.org fetch itself is cached 30s to respect rate limits.
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
    if (f.status === 'live') hasLive = true

    const homeId = teamMap[f.home_code]
    const awayId = teamMap[f.away_code]
    if (!homeId || !awayId) continue

    const { data: match } = await admin
      .from('matches')
      .select('id, status, home_score, away_score')
      .eq('tournament_id', TOURNAMENT_ID)
      .eq('home_team_id', homeId)
      .eq('away_team_id', awayId)
      .maybeSingle()

    if (!match) continue

    // Detect if score or status actually changed
    const scoreChanged =
      match.home_score !== f.home_score || match.away_score !== f.away_score
    const becameFinished = f.status === 'finished' && match.status !== 'finished'
    const isLiveWithGoal = f.status === 'live' && scoreChanged

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

    // Queue scoring for matches that finished or had a goal in live play
    if (becameFinished || isLiveWithGoal) {
      matchesToScore.push(match.id)
    }
  }

  // Advance bracket after score updates
  if (updated > 0) {
    await advanceBracket(admin)
  }

  // Trigger scoring for changed matches (non-blocking best-effort)
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
