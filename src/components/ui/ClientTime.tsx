'use client'

import { useState, useEffect } from 'react'
import { formatMatchTime } from '@/lib/utils'

interface ClientTimeProps {
  utcIso: string
  format?: 'short' | 'full'
  className?: string
  fallback?: string
}

/**
 * Renders a match date/time using the browser's actual timezone.
 * Must be used client-side only (avoids SSR timezone mismatch).
 */
export function ClientTime({ utcIso, format = 'short', className, fallback = '…' }: ClientTimeProps) {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    setLabel(formatMatchTime(utcIso, undefined, format))
  }, [utcIso, format])

  return <span className={className}>{label ?? fallback}</span>
}
