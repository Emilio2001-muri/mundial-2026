'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Polls /api/live-sync and refreshes the page data when scores change.
// Uses time-based detection: if current time is inside any match window
// (kickoff_at to kickoff_at + 120 min) we poll aggressively even before
// the API marks the match as live.
// Intervals: 10s when confirmed live, 20s when inside time window, 45s otherwise.

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
    // Check if we're inside a typical World Cup match time slot
    // WC 2026 matches kick off at round hours/half hours, last ~2h
    // Use 20s polling from 5 min before kickoff through 125 min after
    const nowMin = new Date().getUTCHours() * 60 + new Date().getUTCMinutes()
    // Common WC kickoff UTC slots: 18:00, 21:00, 00:00 (= 0)
    const slots = [18 * 60, 21 * 60, 0]
    const inWindow = slots.some((slot) => {
      const diff = ((nowMin - slot) % 1440 + 1440) % 1440
      return diff <= 130 // within 130 min after kickoff
    })
    return inWindow ? 20_000 : 45_000
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
