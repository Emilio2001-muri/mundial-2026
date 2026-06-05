'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Clock, Radio } from 'lucide-react'
import { msUntilLock, isMatchLocked } from '@/lib/scoring'
import { formatCountdown } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface LockCountdownProps {
  kickoffAt: string
  className?: string
}

export function LockCountdown({ kickoffAt, className }: LockCountdownProps) {
  const [ms, setMs] = useState(() => msUntilLock(kickoffAt))
  const locked = ms <= 0

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = msUntilLock(kickoffAt)
      setMs(remaining)
      if (remaining <= 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [kickoffAt])

  const isUrgent = ms > 0 && ms < 5 * 60 * 1000 // < 5 min

  return (
    <AnimatePresence mode="wait">
      {locked ? (
        <motion.div
          key="locked"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
            'bg-destructive/10 text-destructive text-xs font-semibold',
            className
          )}
        >
          <Lock className="w-3 h-3" />
          <span>Bloqueado</span>
        </motion.div>
      ) : isUrgent ? (
        <motion.div
          key="urgent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold animate-pulse',
            className
          )}
        >
          <Clock className="w-3 h-3" />
          <span>Cierra en {formatCountdown(ms)}</span>
        </motion.div>
      ) : (
        <motion.div
          key="open"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold',
            className
          )}
        >
          <Radio className="w-3 h-3" />
          <span>Abierto · {formatCountdown(ms)}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
