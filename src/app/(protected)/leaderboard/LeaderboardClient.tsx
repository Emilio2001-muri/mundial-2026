'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Trophy, TrendingUp, TrendingDown, Minus, Crown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { LeaderboardSnapshot, Profile } from '@/types'

type SnapshotWithProfile = LeaderboardSnapshot & { profile: Profile }

interface LeaderboardClientProps {
  initialData: SnapshotWithProfile[]
  currentUserId: string
}

export function LeaderboardClient({ initialData, currentUserId }: LeaderboardClientProps) {
  const [entries, setEntries] = useState(initialData)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leaderboard_snapshots' },
        async () => {
          // Re-fetch latest leaderboard on change
          const { data } = await supabase
            .from('leaderboard_snapshots')
            .select('*, profile:profiles(id, display_name, avatar_url, role)')
            .order('created_at', { ascending: false })
            .limit(50)

          if (data) {
            const seen = new Set<string>()
            const latest = data.filter((s) => {
              if (seen.has(s.user_id)) return false
              seen.add(s.user_id)
              return true
            })
            setEntries([...latest].sort((a, b) => a.rank - b.rank) as SnapshotWithProfile[])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Ranking</h1>
          <p className="text-muted-foreground text-sm">Clasificación en tiempo real</p>
        </div>
        <Trophy className="w-6 h-6 text-amber-500" />
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-semibold">El ranking todavía está vacío</p>
          <p className="text-sm text-muted-foreground">Empieza haciendo predicciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {entries.map((entry, idx) => {
              const isMe = entry.user_id === currentUserId
              const movement = entry.previous_rank === null
                ? 'new'
                : entry.rank < entry.previous_rank
                ? 'up'
                : entry.rank > entry.previous_rank
                ? 'down'
                : 'same'

              return (
                <motion.div
                  key={entry.user_id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, type: 'spring', bounce: 0.2 }}
                >
                  <Link href={`/users/${entry.user_id}`}>
                    <Card
                      className={`transition-all hover:shadow-md ${
                        isMe ? 'ring-2 ring-primary/30 bg-primary/5' : ''
                      }`}
                    >
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* Rank */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                            entry.rank === 1 ? 'bg-amber-400 text-white' :
                            entry.rank === 2 ? 'bg-slate-400 text-white' :
                            entry.rank === 3 ? 'bg-amber-700 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {entry.rank === 1 ? <Crown className="w-4 h-4" /> : entry.rank}
                          </div>

                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-base font-bold flex-shrink-0 overflow-hidden">
                            {entry.profile?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={entry.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (entry.profile?.display_name?.[0] ?? '?').toUpperCase()
                            )}
                          </div>

                          {/* Name + stats */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-semibold text-sm truncate ${isMe ? 'text-primary' : ''}`}>
                                {entry.profile?.display_name ?? 'Usuario'}
                              </span>
                              {isMe && <Badge variant="default" className="text-[9px] px-1.5">Tú</Badge>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {entry.success_rate}% éxito
                              </span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">
                                {entry.exact_scores_count} exactos
                              </span>
                            </div>
                          </div>

                          {/* Points + movement */}
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-xl font-black">{entry.total_points}</span>
                            <div className="flex items-center gap-0.5">
                              {movement === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                              {movement === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
                              {movement === 'same' && <Minus className="w-3 h-3 text-muted-foreground" />}
                              {movement === 'new' && <span className="text-[10px] text-muted-foreground">nuevo</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
