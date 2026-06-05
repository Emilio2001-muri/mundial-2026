'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import type { Match, Team, Venue } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updateMatchResult } from '@/app/actions/admin'
import { recalculateMatchScores } from '@/app/actions/scoring'
import { formatMatchTime, phaseLabel } from '@/lib/utils'
import { Edit, RefreshCw, Check, X } from 'lucide-react'

interface AdminMatchesClientProps {
  matches: (Match & { home_team?: { fifa_code: string } | null; away_team?: { fifa_code: string } | null })[]
  teams: Pick<Team, 'id' | 'fifa_code' | 'name'>[]
  venues: Pick<Venue, 'id' | 'name' | 'city'>[]
}

export function AdminMatchesClient({ matches }: AdminMatchesClientProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const startEdit = (match: Match & { home_team?: { fifa_code: string } | null; away_team?: { fifa_code: string } | null }) => {
    setEditingId(match.id)
    setHomeScore(match.home_score ?? 0)
    setAwayScore(match.away_score ?? 0)
    setMessage(null)
  }

  const saveResult = (matchId: string) => {
    startTransition(async () => {
      const res = await updateMatchResult(matchId, homeScore, awayScore)
      if (res.error) {
        setMessage(`Error: ${res.error}`)
      } else {
        await recalculateMatchScores(matchId)
        setMessage('Resultado guardado y puntos recalculados.')
        setEditingId(null)
      }
    })
  }

  const statusColor: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
    scheduled: 'secondary',
    locked: 'warning',
    live: 'destructive',
    finished: 'success',
    postponed: 'warning',
  }

  return (
    <div className="space-y-4">
      <a href="/admin" className="text-sm text-primary font-medium">← Admin</a>
      <h1 className="text-xl font-black">Gestión de partidos</h1>

      {message && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          {message}
        </div>
      )}

      <div className="space-y-2">
        {matches.map((match) => (
          <Card key={match.id}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">
                      {match.home_team?.fifa_code ?? match.home_placeholder ?? '?'}
                      {' vs '}
                      {match.away_team?.fifa_code ?? match.away_placeholder ?? '?'}
                    </span>
                    <Badge variant={statusColor[match.status] ?? 'secondary'} className="text-[10px]">
                      {match.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {phaseLabel(match.phase)} · {formatMatchTime(match.kickoff_at)}
                  </p>
                  {match.status === 'finished' && (
                    <p className="text-sm font-bold mt-1">
                      {match.home_score} – {match.away_score}
                    </p>
                  )}
                </div>

                {editingId === match.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={homeScore}
                      onChange={(e) => setHomeScore(Number(e.target.value))}
                      className="w-10 h-8 rounded-lg border border-input bg-muted/50 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="text-muted-foreground">–</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={awayScore}
                      onChange={(e) => setAwayScore(Number(e.target.value))}
                      className="w-10 h-8 rounded-lg border border-input bg-muted/50 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <Button size="icon" variant="default" className="h-8 w-8" onClick={() => saveResult(match.id)} loading={isPending}>
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => startEdit(match)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
