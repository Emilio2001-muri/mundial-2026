'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Polls /api/live-sync and refreshes the page data when scores change.
// Interval: 10s when a match is live, 60s otherwise.
// Only runs between June 11 and July 19, 2026.

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

  const poll = async () => {
    try {
      const res = await fetch('/api/live-sync', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json() as { live?: boolean; updated?: number }
      setLive(!!data.live)
      if ((data.updated ?? 0) > 0) {
        router.refresh()
      }
    } catch {
      // network error — silently skip
    }
  }

  useEffect(() => {
    if (!isTournamentActive()) return

    const getInterval = () => (live ? 10_000 : 60_000)

    poll()
    intervalRef.current = setInterval(poll, getInterval())

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live])

  // Live indicator dot — only shown when a match is happening
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
