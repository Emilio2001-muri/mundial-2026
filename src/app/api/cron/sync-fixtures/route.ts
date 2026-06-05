import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getFootballDataProvider } from '@/lib/football-data'

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  return authHeader === expected
}

// Called by Vercel Cron once per day
export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const provider = getFootballDataProvider()
    const fixtures = await provider.getFixtures()

    if (!fixtures.length) {
      return NextResponse.json({ message: 'No fixtures returned from provider' })
    }

    const admin = createAdminClient()
    let updated = 0

    for (const f of fixtures) {
      if (!f.external_id) continue
      const { error } = await admin
        .from('matches')
        .upsert(
          {
            external_id: f.external_id,
            kickoff_at: f.kickoff_utc,
            status:
              f.status === 'FT' ? 'finished'
              : f.status === '1H' || f.status === 'HT' || f.status === '2H' ? 'live'
              : 'scheduled',
            home_score: f.home_score,
            away_score: f.away_score,
            home_score_et: f.home_score_et,
            away_score_et: f.away_score_et,
            home_penalties: f.home_penalties,
            away_penalties: f.away_penalties,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'external_id', ignoreDuplicates: false }
        )
      if (!error) updated++
    }

    return NextResponse.json({ success: true, updated })
  } catch (err) {
    console.error('[cron/sync-fixtures]', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
