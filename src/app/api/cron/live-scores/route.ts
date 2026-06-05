import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { recalculateMatchScores } from '@/app/actions/scoring'

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

// Called every 60s during match windows
export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()

    // Find matches that just finished (status=live but should be finished based on kickoff + 110min)
    const cutoff = new Date(Date.now() - 110 * 60_000).toISOString()
    const { data: liveMatches } = await admin
      .from('matches')
      .select('id, kickoff_at, status')
      .eq('status', 'live')
      .lt('kickoff_at', cutoff)

    if (liveMatches?.length) {
      for (const m of liveMatches) {
        await recalculateMatchScores(m.id)
      }
    }

    // Lock predictions for matches about to kick off
    const lockWindow = new Date(Date.now() + 60_000).toISOString() // next 60s
    const now = new Date().toISOString()

    const { data: soonMatches } = await admin
      .from('matches')
      .select('id')
      .lte('kickoff_at', lockWindow)
      .eq('status', 'scheduled')

    const soonIds = (soonMatches ?? []).map((m: { id: string }) => m.id)
    if (soonIds.length > 0) {
      await admin
        .from('match_predictions')
        .update({ status: 'locked', locked_at: now })
        .in('match_id', soonIds)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[cron/live-scores]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
