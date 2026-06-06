'use client'

import { useState } from 'react'
import type { MatchWithTeams } from '@/types'
import { ClientTime } from '@/components/ui/ClientTime'

interface BracketClientProps {
  matches: MatchWithTeams[]
}

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

// ── Standings ────────────────────────────────────────────────────
type Standing = {
  team_id: string; name: string; fifa_code: string; flag_url: string | null
  p:number; w:number; d:number; l:number; gf:number; ga:number; pts:number
}
function computeStandings(gm: MatchWithTeams[]): Standing[] {
  const map: Record<string, Standing> = {}
  const ensure = (m: MatchWithTeams, side: 'home' | 'away') => {
    const t = side === 'home' ? m.home_team : m.away_team
    if (!t || map[t.id]) return
    map[t.id] = { team_id: t.id, name: t.name, fifa_code: t.fifa_code, flag_url: t.flag_url ?? null, p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 }
  }
  for (const m of gm) {
    ensure(m,'home'); ensure(m,'away')
    if (!m.home_team || !m.away_team || m.status !== 'finished' || m.home_score == null || m.away_score == null) continue
    const h = map[m.home_team.id], a = map[m.away_team.id]
    h.p++; a.p++; h.gf += m.home_score; h.ga += m.away_score; a.gf += m.away_score; a.ga += m.home_score
    if (m.home_score > m.away_score) { h.w++; h.pts+=3; a.l++ }
    else if (m.home_score < m.away_score) { a.w++; a.pts+=3; h.l++ }
    else { h.d++; h.pts++; a.d++; a.pts++ }
  }
  return Object.values(map).sort((a,b) => b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf)
}

// ── MiniMatch (groups tab) ────────────────────────────────────────
function MiniMatch({ m }: { m: MatchWithTeams }) {
  const hc = m.home_team?.fifa_code ?? '?'
  const ac = m.away_team?.fifa_code ?? '?'
  const played = m.status === 'finished'
  const live = m.status === 'live'
  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs ${live ? 'bg-green-500/10' : played ? 'bg-muted/80' : 'bg-muted/30'}`}>
      <span className="font-semibold w-8 truncate text-right">{hc}</span>
      <span className={`font-mono w-12 text-center ${live ? 'text-green-500 font-bold' : 'text-muted-foreground'}`}>
        {played || live ? `${m.home_score ?? 0}–${m.away_score ?? 0}` : <ClientTime utcIso={m.kickoff_at} className="text-[10px]" />}
      </span>
      <span className="font-semibold w-8 truncate">{ac}</span>
    </div>
  )
}

// ── KO Match row (R32 list style) ────────────────────────────────
function KOMatchRow({ m }: { m: MatchWithTeams }) {
  const homeDefined = !!m.home_team_id
  const awayDefined = !!m.away_team_id
  const played = m.status === 'finished'
  const live = m.status === 'live'
  const homeCode = m.home_team?.fifa_code ?? null
  const awayCode = m.away_team?.fifa_code ?? null
  const homeLabel = homeDefined ? (m.home_team?.name ?? homeCode ?? '?') : (m.home_placeholder ?? '?')
  const awayLabel = awayDefined ? (m.away_team?.name ?? awayCode ?? '?') : (m.away_placeholder ?? '?')

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden transition-all ${live ? 'border-green-500/50' : 'border-border'}`}>
      {/* Home */}
      <div className={`flex items-center gap-3 px-4 py-2.5 ${played && (m.home_score ?? 0) > (m.away_score ?? 0) ? 'bg-primary/5' : ''}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {m.home_team?.flag_url
            ? <img src={m.home_team.flag_url} alt={homeCode ?? ''} className="w-7 h-5 object-cover rounded-sm flex-shrink-0" />
            : <span className="w-7 h-5 rounded-sm bg-muted flex-shrink-0" />}
          <span className={`text-sm truncate ${!homeDefined ? 'text-muted-foreground italic text-xs' : 'font-semibold'}`}>{homeLabel}</span>
        </div>
        <span className={`text-lg font-black tabular-nums w-6 text-right ${played && (m.home_score ?? 0) > (m.away_score ?? 0) ? 'text-foreground' : 'text-muted-foreground'}`}>
          {played || live ? m.home_score ?? 0 : ''}
        </span>
      </div>
      {/* Divider with date/status */}
      <div className="relative flex items-center">
        <div className="flex-1 h-px bg-border/60" />
        <span className={`mx-3 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
          live ? 'bg-green-500 text-white animate-pulse' :
          played ? 'bg-muted text-muted-foreground' :
          'bg-muted/50 text-muted-foreground'
        }`}>
          {live ? 'EN VIVO' : played ? 'Final' : <ClientTime utcIso={m.kickoff_at} className="text-[10px]" />}
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      {/* Away */}
      <div className={`flex items-center gap-3 px-4 py-2.5 ${played && (m.away_score ?? 0) > (m.home_score ?? 0) ? 'bg-primary/5' : ''}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {m.away_team?.flag_url
            ? <img src={m.away_team.flag_url} alt={awayCode ?? ''} className="w-7 h-5 object-cover rounded-sm flex-shrink-0" />
            : <span className="w-7 h-5 rounded-sm bg-muted flex-shrink-0" />}
          <span className={`text-sm truncate ${!awayDefined ? 'text-muted-foreground italic text-xs' : 'font-semibold'}`}>{awayLabel}</span>
        </div>
        <span className={`text-lg font-black tabular-nums w-6 text-right ${played && (m.away_score ?? 0) > (m.home_score ?? 0) ? 'text-foreground' : 'text-muted-foreground'}`}>
          {played || live ? m.away_score ?? 0 : ''}
        </span>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export function BracketClient({ matches }: BracketClientProps) {
  const [tab, setTab] = useState<'groups' | 'r32' | 'final'>('r32')

  const groupMatches = matches.filter(m => m.phase === 'group')
  const r32   = matches.filter(m => m.phase === 'round_of_32').sort((a,b) => a.match_number - b.match_number)
  const r16   = matches.filter(m => m.phase === 'round_of_16').sort((a,b) => a.match_number - b.match_number)
  const qf    = matches.filter(m => m.phase === 'quarter_final').sort((a,b) => a.match_number - b.match_number)
  const sf    = matches.filter(m => m.phase === 'semi_final').sort((a,b) => a.match_number - b.match_number)
  const tp    = matches.filter(m => m.phase === 'third_place')
  const fin   = matches.filter(m => m.phase === 'final')

  const tabs = [
    { id: 'groups', label: '📋 Grupos' },
    { id: 'r32',    label: '⚔️ 16avos' },
    { id: 'final',  label: '🏆 Fase Final' },
  ] as const

  return (
    <div className="space-y-4 pb-6">
      <h1 className="text-xl font-black">Llave · Mundial 2026</h1>

      {/* Tabs */}
      <div className="flex rounded-xl bg-muted p-1 gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === t.id ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── GROUPS ─────────────────────────────────────────────── */}
      {tab === 'groups' && (
        <div className="grid grid-cols-1 gap-4">
          {GROUPS.map(grp => {
            const gm = groupMatches.filter(m => m.group_name === grp)
            const standings = computeStandings(gm)
            return (
              <div key={grp} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="bg-primary/10 px-4 py-2 flex items-center justify-between">
                  <h2 className="font-black text-sm">Grupo {grp}</h2>
                  <span className="text-xs text-muted-foreground">{gm.filter(m => m.status === 'finished').length}/{gm.length}</span>
                </div>
                {standings.length > 0 && (
                  <div className="px-3 py-2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left py-1 w-5">#</th>
                          <th className="text-left py-1">Equipo</th>
                          <th className="text-center py-1 w-6">J</th>
                          <th className="text-center py-1 w-6">G</th>
                          <th className="text-center py-1 w-6">E</th>
                          <th className="text-center py-1 w-6">P</th>
                          <th className="text-center py-1 w-8">GD</th>
                          <th className="text-center py-1 w-8 font-bold text-foreground">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((s, i) => (
                          <tr key={s.team_id} className={i < 2 ? 'text-foreground' : 'text-muted-foreground'}>
                            <td className="py-1">
                              <span className={`w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                                i === 0 ? 'bg-green-500/20 text-green-600' : i === 1 ? 'bg-blue-500/20 text-blue-600' : 'bg-muted'
                              }`}>{i+1}</span>
                            </td>
                            <td className="py-1">
                              <div className="flex items-center gap-1.5">
                                {s.flag_url && <img src={s.flag_url} alt={s.fifa_code} className="w-5 h-3.5 object-cover rounded-sm" />}
                                <span className="font-medium">{s.fifa_code}</span>
                              </div>
                            </td>
                            <td className="text-center py-1">{s.p}</td>
                            <td className="text-center py-1">{s.w}</td>
                            <td className="text-center py-1">{s.d}</td>
                            <td className="text-center py-1">{s.l}</td>
                            <td className="text-center py-1">{s.gf-s.ga > 0 ? `+${s.gf-s.ga}` : s.gf-s.ga}</td>
                            <td className="text-center py-1 font-bold">{s.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="px-3 pb-3 space-y-1">
                  {gm.map(m => <MiniMatch key={m.id} m={m} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── R32 LIST ────────────────────────────────────────────── */}
      {tab === 'r32' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground px-1">
            Los clasificados se irán definiendo conforme termine cada grupo
          </p>
          <div className="grid grid-cols-1 gap-3">
            {r32.map(m => <KOMatchRow key={m.id} m={m} />)}
          </div>
        </div>
      )}

      {/* ── FINAL PHASE TREE ────────────────────────────────────── */}
      {tab === 'final' && (
        <div className="space-y-8">
          {/* Octavos */}
          {r16.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Octavos de Final</h2>
              <div className="grid grid-cols-1 gap-3">
                {r16.map(m => <KOMatchRow key={m.id} m={m} />)}
              </div>
            </section>
          )}

          {/* Cuartos */}
          {qf.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Cuartos de Final</h2>
              <div className="grid grid-cols-2 gap-3">
                {qf.map(m => <KOMatchRow key={m.id} m={m} />)}
              </div>
            </section>
          )}

          {/* Semis */}
          {sf.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Semifinales</h2>
              <div className="grid grid-cols-2 gap-3">
                {sf.map(m => <KOMatchRow key={m.id} m={m} />)}
              </div>
            </section>
          )}

          {/* Tercer lugar */}
          {tp.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">3er Lugar</h2>
              <div className="max-w-sm mx-auto">
                {tp.map(m => <KOMatchRow key={m.id} m={m} />)}
              </div>
            </section>
          )}

          {/* Final */}
          {fin.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-black text-primary uppercase tracking-widest px-1 text-center">🏆 FINAL · 19 Jul</h2>
              <div className="max-w-sm mx-auto">
                {fin.map(m => <KOMatchRow key={m.id} m={m} />)}
              </div>
            </section>
          )}

          {r16.length === 0 && qf.length === 0 && sf.length === 0 && fin.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Los partidos de fases finales aparecerán conforme avance el torneo
            </div>
          )}
        </div>
      )}
    </div>
  )
}
