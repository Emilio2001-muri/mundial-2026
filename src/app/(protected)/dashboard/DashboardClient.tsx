'use client'

import { motion } from 'framer-motion'
import { Trophy, Target, Zap, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Profile } from '@/types'
import Link from 'next/link'
import { ClientTime } from '@/components/ui/ClientTime'

interface DashboardClientProps {
  profile: Profile
  rank: number | null
  totalPoints: number
  leaderCount: number
  firstPlacePoints: number
  successRate: number
  exactScores: number
  pendingMatches: unknown[]
  recentScores: unknown[]
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function DashboardClient({
  profile,
  rank,
  totalPoints,
  leaderCount,
  firstPlacePoints,
  successRate,
  exactScores,
  pendingMatches,
  recentScores,
}: DashboardClientProps) {
  const gap = firstPlacePoints - totalPoints

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Greeting */}
      <motion.div variants={itemVariants} className="pt-2">
        <h1 className="text-2xl font-black">
          Hola, <span className="gradient-text">{profile.display_name.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Mundial 2026 · Quiniela privada</p>
      </motion.div>

      {/* Points + Rank */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        <Card glass className="relative overflow-hidden">
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Puntos</p>
                <p className="text-4xl font-black mt-1 gradient-text">{totalPoints}</p>
              </div>
              <Zap className="w-5 h-5 text-amber-500 mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card glass>
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Posición</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-4xl font-black">{rank ?? '–'}</p>
                  <span className="text-muted-foreground text-sm">/ {leaderCount}</span>
                </div>
              </div>
              <Trophy className="w-5 h-5 text-primary mt-1" />
            </div>
            {rank === 1 ? (
              <Badge variant="gold" className="mt-2">👑 Líder</Badge>
            ) : gap > 0 ? (
              <p className="text-xs text-muted-foreground mt-2">A {gap} pts del 1º</p>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4 px-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Éxito</p>
              <p className="text-xl font-bold">{successRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 px-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Exactos</p>
              <p className="text-xl font-bold">{exactScores}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming matches */}
      {pendingMatches.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm">Próximos partidos</h2>
            <Link href="/matches" className="text-xs text-primary font-medium">Ver todos →</Link>
          </div>
          <div className="space-y-2">
            {(pendingMatches as Array<{
              id: string
              kickoff_at: string
              home_team: { fifa_code: string; flag_url: string | null } | null
              away_team: { fifa_code: string; flag_url: string | null } | null
            }>).map((match) => (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        {match.home_team?.fifa_code ?? '?'} vs {match.away_team?.fifa_code ?? '?'}
                      </span>
                    </div>
                    <ClientTime utcIso={match.kickoff_at} className="text-xs text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent scores */}
      {recentScores.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="font-bold text-sm mb-2">Puntos recientes</h2>
          <div className="space-y-1.5">
            {(recentScores as Array<{
              points: number
              reason: string
              created_at: string
              match: {
                id: string
                home_score: number | null
                away_score: number | null
                status: string
                home_team: { fifa_code: string } | null
                away_team: { fifa_code: string } | null
              } | null
            }>).map((score, i) => {
              const m = score.match
              const matchLabel = m?.home_team && m?.away_team
                ? `${m.home_team.fifa_code} ${m.home_score ?? '?'}–${m.away_score ?? '?'} ${m.away_team.fifa_code}`
                : null
              return (
                <div key={i} className="flex items-start justify-between py-2 border-b border-border/40 last:border-0 gap-2">
                  <div className="flex-1 min-w-0">
                    {matchLabel && (
                      <p className="text-[10px] text-muted-foreground font-mono mb-0.5">{matchLabel}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{score.reason}</p>
                  </div>
                  <Badge variant={score.points > 0 ? 'success' : 'secondary'} className="shrink-0">
                    +{score.points}
                  </Badge>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Quick links */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 pb-2">
        <Link href="/leaderboard">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="py-4 px-4 text-center">
              <Trophy className="w-6 h-6 mx-auto text-primary mb-1.5" />
              <p className="text-sm font-semibold">Ranking</p>
              <p className="text-xs text-muted-foreground">Ver clasificación</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/global-predictions">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="py-4 px-4 text-center">
              <span className="text-2xl block mb-1.5">🌍</span>
              <p className="text-sm font-semibold">Predicciones globales</p>
              <p className="text-xs text-muted-foreground">Campeón, premios…</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </motion.div>
  )
}
