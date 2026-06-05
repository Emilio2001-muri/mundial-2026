import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchLiveFixtures } from '@/lib/football-data'

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  return authHeader === expected
}

// Called by Vercel Cron: runs every 2 min during World Cup
export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { fixtures, error } = await fetchLiveFixtures()
    if (error) return NextResponse.json({ error }, { status: 500 })
    if (!fixtures.length) return NextResponse.json({ message: 'No fixtures returned from provider' })

    const admin = createAdminClient()
    let updated = 0

    for (const f of fixtures) {
      // Match by home/away codes within the same day
      const day = f.kickoff_utc.slice(0, 10)
      const { data: match } = await admin
        .from('matches')
        .select('id')
        .gte('kickoff_at', `${day}T00:00:00Z`)
        .lte('kickoff_at', `${day}T23:59:59Z`)
        .maybeSingle()

      if (!match) continue

      const { error: updateErr } = await admin
        .from('matches')
        .update({
          home_score: f.home_score,
          away_score: f.away_score,
          home_score_et: f.home_score_et,
          away_score_et: f.away_score_et,
          home_penalties: f.home_penalties,
          away_penalties: f.away_penalties,
          status: f.status,
        })
        .eq('id', match.id)

      if (!updateErr) updated++
    }

    return NextResponse.json({ success: true, total: fixtures.length, updated })
  } catch (err) {
    console.error('[cron/sync-fixtures]', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

