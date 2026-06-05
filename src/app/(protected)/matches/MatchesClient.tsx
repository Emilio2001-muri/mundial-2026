'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MatchCard } from '@/components/matches/MatchCard'
import type { MatchWithPrediction, MatchPhase } from '@/types'
import { phaseLabel } from '@/lib/utils'

const PHASES: MatchPhase[] = [
  'group',
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'third_place',
  'final',
]

interface MatchesClientProps {
  matches: MatchWithPrediction[]
}

export function MatchesClient({ matches }: MatchesClientProps) {
  const [activePhase, setActivePhase] = useState<MatchPhase | 'all'>('all')
  const [search, setSearch] = useState('')

  const phases = PHASES.filter((p) => matches.some((m) => m.phase === p))

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const filtered = matches.filter((m) => {
    if (activePhase !== 'all' && m.phase !== activePhase) return false
    if (search.trim()) {
      const q = normalize(search)
      const home  = normalize(m.home_team?.name ?? m.home_team?.fifa_code ?? m.home_placeholder ?? '')
      const hCode = normalize(m.home_team?.fifa_code ?? '')
      const away  = normalize(m.away_team?.name ?? m.away_team?.fifa_code ?? m.away_placeholder ?? '')
      const aCode = normalize(m.away_team?.fifa_code ?? '')
      const venue = normalize(m.venue?.city ?? '')
      if (!home.includes(q) && !away.includes(q) && !hCode.includes(q) && !aCode.includes(q) && !venue.includes(q)) return false
    }
    return true
  })

  // Group by phase
  const grouped: Partial<Record<MatchPhase, MatchWithPrediction[]>> = {}
  for (const m of filtered) {
    if (!grouped[m.phase]) grouped[m.phase] = []
    grouped[m.phase]!.push(m)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black">Partidos</h1>
        <p className="text-muted-foreground text-sm">{matches.length} partidos · Mundial 2026</p>
      </div>

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar equipo…"
        className="w-full h-10 rounded-xl border border-input bg-muted/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {/* Phase filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        <button
          onClick={() => setActivePhase('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activePhase === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          Todos
        </button>
        {phases.map((p) => (
          <button
            key={p}
            onClick={() => setActivePhase(p)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activePhase === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {phaseLabel(p)}
          </button>
        ))}
      </div>

      {/* Matches grouped by phase */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold">Sin resultados</p>
          <p className="text-sm text-muted-foreground">Prueba otra búsqueda</p>
        </div>
      ) : (
        Object.entries(grouped).map(([phase, phaseMatches]) => (
          <div key={phase} className="space-y-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              {phaseLabel(phase)}
            </h2>
            {phaseMatches.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <MatchCard match={match} />
              </motion.div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
