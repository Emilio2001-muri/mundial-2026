'use client'

import { useState } from 'react'
import type { MatchWithTeams } from '@/types'
import { ClientTime } from '@/components/ui/ClientTime'

interface BracketClientProps {
  matches: MatchWithTeams[]
}

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

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

function MiniMatch({ m }: { m: MatchWithTeams }) {
  const hc = m.home_team?.fifa_code ?? '?'
  const ac = m.away_team?.fifa_code ?? '?'
  const played = m.status === 'finished'
  const live = m.status === 'live'
  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs ${live ? 'bg-green-500/10' : played ? 'bg-muted/80' : 'bg-muted/30'}`}>
      <span className="font-semibold w-8 truncate text-right">{hc}</span>
      <span className={`font-mono w-12 text-center ${live ? 'text-green-500 font-bold' : 'text-muted-foreground'}`}>
        {played || live ? `${m.home_score ?? 0}\u2013${m.away_score ?? 0}` : <ClientTime utcIso={m.kickoff_at} className="text-[10px]" />}
      </span>
      <span className="font-semibold w-8 truncate">{ac}</span>
    </div>
  )
}

// Compact KO card (used inside bracket pairs)
function KOCard({ m }: { m: MatchWithTeams }) {
  const homeDefined = !!m.home_team_id
  const awayDefined = !!m.away_team_id
  const played = m.status === 'finished'
  const live = m.status === 'live'
  const homeLabel = homeDefined ? (m.home_team?.fifa_code ?? '?') : (m.home_placeholder ?? '?')
  const awayLabel = awayDefined ? (m.away_team?.fifa_code ?? '?') : (m.away_placeholder ?? '?')
  const homeWin = played && (m.home_score ?? 0) > (m.away_score ?? 0)
  const awayWin = played && (m.away_score ?? 0) > (m.home_score ?? 0)

  return (
    <div className={`rounded-xl border overflow-hidden ${live ? 'border-green-500/60' : 'border-border'} bg-card`}>
      <div className={`px-2 py-0.5 text-[10px] font-semibold text-center truncate ${live ? 'bg-green-500 text-white' : 'bg-muted/50 text-muted-foreground'}`}>
        {live ? 'EN VIVO' : played ? 'Final' : <ClientTime utcIso={m.kickoff_at} format="full" className="text-[10px]" />}
      </div>
      <div className={`flex items-center gap-1.5 px-2 py-1.5 ${homeWin ? 'bg-primary/5' : ''}`}>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {m.home_team?.flag_url
            ? <img src={m.home_team.flag_url} alt="" className="w-5 h-3.5 object-cover rounded-[2px] flex-shrink-0" />
            : <span className="w-5 h-3.5 rounded-[2px] bg-muted flex-shrink-0" />}
          <span className={`text-[11px] truncate ${!homeDefined ? 'text-muted-foreground italic' : homeWin ? 'font-black' : 'font-semibold'}`}>{homeLabel}</span>
        </div>
        <span className={`text-xs tabular-nums flex-shrink-0 ${homeWin ? 'font-black' : 'text-muted-foreground'}`}>
          {played || live ? (m.home_score ?? 0) : ''}
        </span>
      </div>
      <div className="h-px bg-border/40 mx-1.5" />
      <div className={`flex items-center gap-1.5 px-2 py-1.5 ${awayWin ? 'bg-primary/5' : ''}`}>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {m.away_team?.flag_url
            ? <img src={m.away_team.flag_url} alt="" className="w-5 h-3.5 object-cover rounded-[2px] flex-shrink-0" />
            : <span className="w-5 h-3.5 rounded-[2px] bg-muted flex-shrink-0" />}
          <span className={`text-[11px] truncate ${!awayDefined ? 'text-muted-foreground italic' : awayWin ? 'font-black' : 'font-semibold'}`}>{awayLabel}</span>
        </div>
        <span className={`text-xs tabular-nums flex-shrink-0 ${awayWin ? 'font-black' : 'text-muted-foreground'}`}>
          {played || live ? (m.away_score ?? 0) : ''}
        </span>
      </div>
    </div>
  )
}

// Full-size KO row (used in later rounds)
function KOMatchRow({ m }: { m: MatchWithTeams }) {
  const homeDefined = !!m.home_team_id
  const awayDefined = !!m.away_team_id
  const played = m.status === 'finished'
  const live = m.status === 'live'
  const homeLabel = homeDefined ? (m.home_team?.name ?? m.home_team?.fifa_code ?? '?') : (m.home_placeholder ?? '?')
  const awayLabel = awayDefined ? (m.away_team?.name ?? m.away_team?.fifa_code ?? '?') : (m.away_placeholder ?? '?')

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden ${live ? 'border-green-500/50' : 'border-border'}`}>
      <div className={`flex items-center gap-3 px-4 py-2.5 ${played && (m.home_score ?? 0) > (m.away_score ?? 0) ? 'bg-primary/5' : ''}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {m.home_team?.flag_url
            ? <img src={m.home_team.flag_url} alt="" className="w-7 h-5 object-cover rounded-sm flex-shrink-0" />
            : <span className="w-7 h-5 rounded-sm bg-muted flex-shrink-0" />}
          <span className={`text-sm truncate ${!homeDefined ? 'text-muted-foreground italic text-xs' : 'font-semibold'}`}>{homeLabel}</span>
        </div>
        <span className={`text-lg font-black tabular-nums w-6 text-right ${played && (m.home_score ?? 0) > (m.away_score ?? 0) ? 'text-foreground' : 'text-muted-foreground'}`}>
          {played || live ? m.home_score ?? 0 : ''}
        </span>
      </div>
      <div className="relative flex items-center">
        <div className="flex-1 h-px bg-border/60" />
        <span className={`mx-3 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
          live ? 'bg-green-500 text-white animate-pulse' :
          played ? 'bg-muted text-muted-foreground' :
          'bg-muted/50 text-muted-foreground'
        }`}>
          {live ? 'EN VIVO' : played ? 'Final' : <ClientTime utcIso={m.kickoff_at} />}
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <div className={`flex items-center gap-3 px-4 py-2.5 ${played && (m.away_score ?? 0) > (m.home_score ?? 0) ? 'bg-primary/5' : ''}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {m.away_team?.flag_url
            ? <img src={m.away_team.flag_url} alt="" className="w-7 h-5 object-cover rounded-sm flex-shrink-0" />
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

// Bracket pair: two R32 matches feeding into one R16 match
function BracketPair({
  m1, m2, next, label
}: {
  m1: MatchWithTeams | undefined
  m2: MatchWithTeams | undefined
  next: MatchWithTeams | undefined
  label: string
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
        <div className="flex-1 h-px bg-border/30" />
      </div>
      {/* two R32 cards side by side */}
      <div className="grid grid-cols-2 gap-1.5">
        {m1 ? <KOCard m={m1} /> : <div className="rounded-xl border border-dashed border-border/30 h-16" />}
        {m2 ? <KOCard m={m2} /> : <div className="rounded-xl border border-dashed border-border/30 h-16" />}
      </div>
      {/* connector lines */}
      <div className="flex justify-center mt-0">
        <div className="w-[calc(50%-0.75rem)] h-3 border-b border-r border-border/40 rounded-br-sm" />
        <div className="w-[calc(50%-0.75rem)] h-3 border-b border-l border-border/40 rounded-bl-sm" />
      </div>
      {/* R16 card centered */}
      <div className="flex flex-col items-center">
        <div className="w-px h-2 bg-border/40" />
        <div className="w-full max-w-[180px]">
          {next
            ? <KOCard m={next} />
            : <div className="rounded-xl border border-dashed border-border/30 py-2 text-center text-[10px] text-muted-foreground">Por definir</div>
          }
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-border/60" />
      <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex-shrink-0">{children}</span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  )
}

export function BracketClient({ matches }: BracketClientProps) {
  const [tab, setTab] = useState<'groups' | 'r32' | 'final'>('r32')

  const byNum = (n: number) => matches.find(m => m.match_number === n)

  const groupMatches = matches.filter(m => m.phase === 'group')
  const qf  = matches.filter(m => m.phase === 'quarter_final').sort((a,b) => a.match_number - b.match_number)
  const sf  = matches.filter(m => m.phase === 'semi_final').sort((a,b) => a.match_number - b.match_number)
  const tp  = matches.filter(m => m.phase === 'third_place')
  const fin = matches.filter(m => m.phase === 'final')

  const tabs = [
    { id: 'groups', label: 'Grupos' },
    { id: 'r32',    label: '16avos' },
    { id: 'final',  label: 'Fases Fin.' },
  ] as const

  // R32 bracket pairs -> R16 (official FIFA 2026 flow)
  // M89=W74vsW77, M90=W73vsW75, M91=W76vsW78, M92=W79vsW80
  // M93=W83vsW84, M94=W81vsW82, M95=W86vsW88, M96=W85vsW87
  const bracketGroups = [
    { label: 'Cuadro 1', a: 74, b: 77, r16: 89 },
    { label: 'Cuadro 2', a: 73, b: 75, r16: 90 },
    { label: 'Cuadro 3', a: 76, b: 78, r16: 91 },
    { label: 'Cuadro 4', a: 79, b: 80, r16: 92 },
    { label: 'Cuadro 5', a: 83, b: 84, r16: 93 },
    { label: 'Cuadro 6', a: 81, b: 82, r16: 94 },
    { label: 'Cuadro 7', a: 86, b: 88, r16: 95 },
    { label: 'Cuadro 8', a: 85, b: 87, r16: 96 },
  ]

  return (
    <div className="space-y-4 pb-6">
      <h1 className="text-xl font-black">Llave &middot; Mundial 2026</h1>

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

      {/* GROUPS */}
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

      {/* R32 BRACKET */}
      {tab === 'r32' && (
        <div>
          <p className="text-xs text-muted-foreground px-1 mb-4">
            Cada par de 16avos alimenta un partido de Octavos de Final
          </p>
          {bracketGroups.map(bg => (
            <BracketPair
              key={bg.r16}
              label={bg.label}
              m1={byNum(bg.a)}
              m2={byNum(bg.b)}
              next={byNum(bg.r16)}
            />
          ))}
        </div>
      )}

      {/* FINAL PHASES */}
      {tab === 'final' && (
        <div className="space-y-3">
          {qf.length > 0 && (
            <>
              <SectionHeader>Cuartos de Final</SectionHeader>
              <div className="grid grid-cols-2 gap-3">
                {qf.map(m => <KOMatchRow key={m.id} m={m} />)}
              </div>
            </>
          )}
          {sf.length > 0 && (
            <>
              <SectionHeader>Semifinales</SectionHeader>
              <div className="grid grid-cols-2 gap-3">
                {sf.map(m => <KOMatchRow key={m.id} m={m} />)}
              </div>
            </>
          )}
          {tp.length > 0 && (
            <>
              <SectionHeader>3er Lugar</SectionHeader>
              <div className="max-w-sm mx-auto">
                {tp.map(m => <KOMatchRow key={m.id} m={m} />)}
              </div>
            </>
          )}
          {fin.length > 0 && (
            <>
              <SectionHeader>FINAL &middot; 19 Jul</SectionHeader>
              <div className="max-w-sm mx-auto">
                {fin.map(m => <KOMatchRow key={m.id} m={m} />)}
              </div>
            </>
          )}
          {qf.length === 0 && sf.length === 0 && fin.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Los partidos de fases finales aparecen conforme avance el torneo
            </div>
          )}
        </div>
      )}
    </div>
  )
}
