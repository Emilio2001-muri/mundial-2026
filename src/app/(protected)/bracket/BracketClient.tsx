'use client'

import { useState } from 'react'
import type { MatchWithTeams } from '@/types'
import { phaseLabel } from '@/lib/utils'

interface BracketClientProps {
  matches: MatchWithTeams[]
}

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

// ── Standings computation ────────────────────────────────────────
type Standing = {
  team_id: string
  name: string
  fifa_code: string
  flag_url: string | null
  p: number   // played
  w: number   // wins
  d: number   // draws
  l: number   // losses
  gf: number  // goals for
  ga: number  // goals against
  pts: number
}

function computeStandings(groupMatches: MatchWithTeams[]): Standing[] {
  const map: Record<string, Standing> = {}

  const ensure = (m: MatchWithTeams, side: 'home' | 'away') => {
    const team = side === 'home' ? m.home_team : m.away_team
    if (!team) return
    if (!map[team.id]) {
      map[team.id] = {
        team_id: team.id,
        name: team.name,
        fifa_code: team.fifa_code,
        flag_url: team.flag_url ?? null,
        p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0,
      }
    }
  }

  for (const m of groupMatches) {
    ensure(m, 'home')
    ensure(m, 'away')
    if (!m.home_team || !m.away_team) continue
    if (m.status !== 'finished' || m.home_score == null || m.away_score == null) continue
    const h = map[m.home_team.id]
    const a = map[m.away_team.id]
    h.p++; a.p++
    h.gf += m.home_score; h.ga += m.away_score
    a.gf += m.away_score; a.ga += m.home_score
    if (m.home_score > m.away_score) { h.w++; h.pts+=3; a.l++ }
    else if (m.home_score < m.away_score) { a.w++; a.pts+=3; h.l++ }
    else { h.d++; h.pts++; a.d++; a.pts++ }
  }

  return Object.values(map).sort((a,b) =>
    b.pts - a.pts || (b.gf-b.ga) - (a.gf-a.ga) || b.gf - a.gf
  )
}

// ── Match mini card ──────────────────────────────────────────────
function MiniMatch({ m }: { m: MatchWithTeams }) {
  const homeName = m.home_team?.fifa_code ?? m.home_placeholder ?? '?'
  const awayName = m.away_team?.fifa_code ?? m.away_placeholder ?? '?'
  const date = new Date(m.kickoff_at)
  const played = m.status === 'finished'
  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs ${played ? 'bg-muted/80' : 'bg-muted/40'}`}>
      <span className="font-semibold w-8 truncate text-right">{homeName}</span>
      <span className="text-muted-foreground font-mono flex-shrink-0 w-12 text-center">
        {played ? `${m.home_score}–${m.away_score}` : date.toLocaleDateString('es-MX', {month:'short',day:'numeric'})}
      </span>
      <span className="font-semibold w-8 truncate">{awayName}</span>
    </div>
  )
}

// ── Bracket match card ───────────────────────────────────────────
function BracketMatch({ m, size = 'md' }: { m: MatchWithTeams; size?: 'sm' | 'md' | 'lg' }) {
  const homeName = m.home_team?.name ?? m.home_placeholder ?? '?'
  const awayName = m.away_team?.name ?? m.away_placeholder ?? '?'
  const homeCode = m.home_team?.fifa_code ?? '???'
  const awayCode = m.away_team?.fifa_code ?? '???'
  const played = m.status === 'finished'
  const date = new Date(m.kickoff_at)
  const isPlaceholder = !m.home_team_id || !m.away_team_id

  return (
    <div className={`rounded-xl border ${isPlaceholder ? 'border-border/40 opacity-60' : 'border-border'} bg-card overflow-hidden ${size === 'lg' ? 'min-w-[140px]' : 'min-w-[120px]'}`}>
      <div className={`flex items-center gap-1.5 px-2 py-1.5 ${played && m.home_score! > m.away_score! ? 'font-bold' : ''}`}>
        {m.home_team?.flag_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.home_team.flag_url} alt={homeCode} className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
        )}
        <span className={`text-xs truncate flex-1 ${isPlaceholder ? 'text-muted-foreground italic' : ''}`}>
          {isPlaceholder ? m.home_placeholder : homeCode}
        </span>
        {played && <span className="text-xs font-bold ml-auto">{m.home_score}</span>}
      </div>
      <div className="border-t border-border/30" />
      <div className={`flex items-center gap-1.5 px-2 py-1.5 ${played && m.away_score! > m.home_score! ? 'font-bold' : ''}`}>
        {m.away_team?.flag_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.away_team.flag_url} alt={awayCode} className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
        )}
        <span className={`text-xs truncate flex-1 ${isPlaceholder ? 'text-muted-foreground italic' : ''}`}>
          {isPlaceholder ? m.away_placeholder : awayCode}
        </span>
        {played && <span className="text-xs font-bold ml-auto">{m.away_score}</span>}
      </div>
      <div className="bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground text-center">
        {played ? 'Finalizado' : date.toLocaleDateString('es-MX', {month:'short',day:'numeric'})}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────
export function BracketClient({ matches }: BracketClientProps) {
  const [tab, setTab] = useState<'groups' | 'bracket'>('groups')

  const groupMatches = matches.filter(m => m.phase === 'group')
  const r32 = matches.filter(m => m.phase === 'round_of_32')
  const r16 = matches.filter(m => m.phase === 'round_of_16')
  const qf  = matches.filter(m => m.phase === 'quarter_final')
  const sf  = matches.filter(m => m.phase === 'semi_final')
  const tp  = matches.filter(m => m.phase === 'third_place')
  const fin = matches.filter(m => m.phase === 'final')

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">Llave · Mundial 2026</h1>

      {/* Tabs */}
      <div className="flex rounded-xl bg-muted p-1 gap-1">
        {(['groups', 'bracket'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === t ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
            }`}
          >
            {t === 'groups' ? '🏟 Grupos' : '🏆 Eliminatorias'}
          </button>
        ))}
      </div>

      {/* ── GROUPS TAB ─────────────────────────────────────────── */}
      {tab === 'groups' && (
        <div className="grid grid-cols-1 gap-4">
          {GROUPS.map(grp => {
            const gm = groupMatches.filter(m => m.group_name === grp)
            const standings = computeStandings(gm)
            return (
              <div key={grp} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="bg-primary/10 px-4 py-2 flex items-center justify-between">
                  <h2 className="font-black text-sm">Grupo {grp}</h2>
                  <span className="text-xs text-muted-foreground">{gm.length} partidos</span>
                </div>

                {/* Standings table */}
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
                              i === 0 ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                              i === 1 ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                              'bg-muted text-muted-foreground'
                            }`}>{i+1}</span>
                          </td>
                          <td className="py-1">
                            <div className="flex items-center gap-1.5">
                              {s.flag_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={s.flag_url} alt={s.fifa_code} className="w-5 h-3.5 object-cover rounded-sm" />
                              )}
                              <span className="font-medium">{s.fifa_code}</span>
                            </div>
                          </td>
                          <td className="text-center py-1">{s.p}</td>
                          <td className="text-center py-1">{s.w}</td>
                          <td className="text-center py-1">{s.d}</td>
                          <td className="text-center py-1">{s.l}</td>
                          <td className="text-center py-1">{s.gf - s.ga > 0 ? `+${s.gf-s.ga}` : s.gf-s.ga}</td>
                          <td className="text-center py-1 font-bold">{s.pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Group matches */}
                <div className="px-3 pb-3 space-y-1">
                  {gm.map(m => <MiniMatch key={m.id} m={m} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── BRACKET TAB ────────────────────────────────────────── */}
      {tab === 'bracket' && (
        <div className="space-y-6">
          {/* Horizontal scrollable bracket */}
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-3 min-w-max pb-4">
              {/* Round of 32 */}
              {r32.length > 0 && (
                <BracketColumn title="Octavos" matches={r32} />
              )}
              {/* Round of 16 */}
              {r16.length > 0 && (
                <BracketColumn title={phaseLabel('round_of_16')} matches={r16} />
              )}
              {/* QF */}
              {qf.length > 0 && (
                <BracketColumn title={phaseLabel('quarter_final')} matches={qf} />
              )}
              {/* SF */}
              {sf.length > 0 && (
                <BracketColumn title={phaseLabel('semi_final')} matches={sf} />
              )}
              {/* Final + 3rd */}
              <div className="flex flex-col gap-3 justify-center">
                {fin.map(m => (
                  <div key={m.id}>
                    <p className="text-xs font-bold text-center text-primary mb-1.5">🏆 {phaseLabel('final')}</p>
                    <BracketMatch m={m} size="lg" />
                  </div>
                ))}
                {tp.map(m => (
                  <div key={m.id}>
                    <p className="text-xs font-bold text-center text-muted-foreground mb-1.5">{phaseLabel('third_place')}</p>
                    <BracketMatch m={m} size="md" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Round-by-round list view (fallback / detailed) */}
          {[
            { label: 'Ronda de 32', ph: 'round_of_32', list: r32 },
            { label: phaseLabel('round_of_16'), ph: 'round_of_16', list: r16 },
            { label: phaseLabel('quarter_final'), ph: 'quarter_final', list: qf },
            { label: phaseLabel('semi_final'), ph: 'semi_final', list: sf },
            { label: phaseLabel('third_place'), ph: 'third_place', list: tp },
            { label: phaseLabel('final'), ph: 'final', list: fin },
          ].map(({ label, list }) => list.length > 0 && (
            <div key={label} className="space-y-2">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">{label}</h2>
              <div className="grid grid-cols-1 gap-2">
                {list.map(m => {
                  const homeName = m.home_team?.name ?? m.home_placeholder ?? '?'
                  const awayName = m.away_team?.name ?? m.away_placeholder ?? '?'
                  const homeCode = m.home_team?.fifa_code ?? '?'
                  const awayCode = m.away_team?.fifa_code ?? '?'
                  const date = new Date(m.kickoff_at)
                  const played = m.status === 'finished'
                  const isPlaceholder = !m.home_team_id

                  return (
                    <div key={m.id} className={`rounded-xl border p-3 bg-card flex items-center gap-3 ${isPlaceholder ? 'opacity-50' : ''}`}>
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {m.home_team?.flag_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.home_team.flag_url} alt={homeCode} className="w-6 h-4 object-cover rounded-sm" />
                          )}
                          <span className={`text-sm font-bold ${isPlaceholder ? 'text-muted-foreground italic text-xs' : ''}`}>
                            {isPlaceholder ? m.home_placeholder : homeName}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-center min-w-[60px]">
                        {played
                          ? <span className="text-lg font-black">{m.home_score}–{m.away_score}</span>
                          : <div>
                              <p className="text-xs font-bold">{date.toLocaleDateString('es-MX',{month:'short',day:'numeric'})}</p>
                              <p className="text-[10px] text-muted-foreground">{date.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</p>
                            </div>
                        }
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          {m.away_team?.flag_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.away_team.flag_url} alt={awayCode} className="w-6 h-4 object-cover rounded-sm" />
                          )}
                          <span className={`text-sm font-bold ${isPlaceholder ? 'text-muted-foreground italic text-xs' : ''}`}>
                            {isPlaceholder ? m.away_placeholder : awayName}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BracketColumn({ title, matches }: { title: string; matches: MatchWithTeams[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">{title}</p>
      <div className="flex flex-col gap-2 justify-around flex-1">
        {matches.map(m => <BracketMatch key={m.id} m={m} />)}
      </div>
    </div>
  )
}
