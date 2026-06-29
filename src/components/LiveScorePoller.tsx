'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Polls /api/live-sync and refreshes the page data when scores change.
// Uses time-based detection: if current time is inside any match window
// (kickoff_at to kickoff_at + 120 min) we poll aggressively even before
// the API marks the match as live.
// Intervals: 10s when confirmed live, 20s when inside time window, 120s otherwise.
// The server caches responses for 12s (Cache-Control s-maxage=12), so polling
// at 20s means each client causes at most ~1 actual serverless execution per 20s.

const TOURNAMENT_START = new Date('2026-06-11T00:00:00Z')
const TOURNAMENT_END   = new Date('2026-07-20T00:00:00Z')

function isTournamentActive() {
  const now = new Date()
  return now >= TOURNAMENT_START && now <= TOURNAMENT_END
}

export function LiveScorePoller() {
  const router = useRouter()
  const [live, setLive] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevUpdatedRef = useRef(0)

  const poll = async () => {
    try {
      const res = await fetch('/api/live-sync', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json() as { live?: boolean; updated?: number; scored?: number }
      const isLive = !!data.live
      setLive(isLive)

      // Always refresh if anything changed in the DB
      const updated = data.updated ?? 0
      const scored = data.scored ?? 0
      if (updated > 0 || scored > 0 || updated !== prevUpdatedRef.current) {
        prevUpdatedRef.current = updated
        router.refresh()
      }
    } catch {
      // network error — silently skip
    }
  }

  // Time-based interval: poll fast during match windows regardless of API status
  const getInterval = () => {
    if (live) return 10_000
    // Check if we're inside a WC 2026 match time slot (UTC).
    // Actual R32/R16/QF/SF/Final kickoff slots used in migration 019:
    // 17:00, 18:00, 19:00, 20:00, 20:30, 21:00, 22:00, 23:00, 01:00
    const nowMin = new Date().getUTCHours() * 60 + new Date().getUTCMinutes()
    const slots = [17 * 60, 18 * 60, 19 * 60, 20 * 60, 20 * 60 + 30, 21 * 60, 22 * 60, 23 * 60, 1 * 60]
    const inWindow = slots.some((slot) => {
      const diff = ((nowMin - slot) % 1440 + 1440) % 1440
      return diff <= 130 // within 130 min after kickoff
    })
    // 20s during match window, 2 min when idle (server caches 12s so this is fine)
    return inWindow ? 20_000 : 120_000
  }

  useEffect(() => {
    if (!isTournamentActive()) return

    // Poll immediately on mount
    poll()

    // Use a self-rescheduling timer so interval adapts after each poll
    let timeout: ReturnType<typeof setTimeout>
    function schedule() {
      timeout = setTimeout(async () => {
        await poll()
        schedule()
      }, getInterval())
    }
    schedule()

    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Live indicator — shown during confirmed live matches
  if (!live) return null

  return (
    <span
      title="Partido en vivo — actualizando cada 10s"
      className="fixed top-3 right-3 z-50 flex items-center gap-1.5 text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 rounded-full px-2.5 py-1 backdrop-blur-sm"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      EN VIVO
    </span>
  )
}
