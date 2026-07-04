/**
 * bracket-advance.ts
 *
 * After group stage matches are updated, calculates standings for each group
 * and promotes 1st/2nd place teams to their Round-of-32 slots.
 * Also handles "best third-place" teams for the 4 extra slots.
 *
 * FIFA 2026 Round of 32 structure (from migration 006):
 * Match 73: 1º A  vs 2º B    Match 74: 1º C  vs 2º D
 * Match 75: 1º B  vs 2º A    Match 76: 1º D  vs 2º C
 * Match 77: 1º E  vs 3º ?    Match 78: 1º G  vs 3º ?
 * Match 79: 1º F  vs 3º ?    Match 80: 1º H  vs 2º E/F/G
 * Match 81: 1º I  vs 2º J    Match 82: 1º K  vs 2º L
 * Match 83: 1º J  vs 2º I    Match 84: 1º L  vs 2º K
 * Match 85-88: best third-place teams
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const TOURNAMENT_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

type Standing = {
  team_id: string
  fifa_code: string
  pts: number
  gd: number
  gf: number
  groupName: string
}

async function computeGroupStandings(
  admin: SupabaseClient,
  groupName: string
): Promise<Standing[]> {
  const { data: matches } = await admin
    .from('matches')
    .select('home_team_id, away_team_id, home_score, away_score, status, home_team:teams!matches_home_team_id_fkey(id,fifa_code), away_team:teams!matches_away_team_id_fkey(id,fifa_code)')
    .eq('tournament_id', TOURNAMENT_ID)
    .eq('phase', 'group')
    .eq('group_name', groupName)

  const map: Record<string, Standing> = {}

  const ensure = (teamId: string, code: string) => {
    if (!map[teamId]) map[teamId] = { team_id: teamId, fifa_code: code, pts: 0, gd: 0, gf: 0, groupName }
  }

  for (const m of matches ?? []) {
    const ht = (m.home_team as unknown as { id: string; fifa_code: string } | null)
    const at = (m.away_team as unknown as { id: string; fifa_code: string } | null)
    if (!ht || !at) continue
    ensure(ht.id, ht.fifa_code)
    ensure(at.id, at.fifa_code)
    if (m.status !== 'finished' || m.home_score == null || m.away_score == null) continue

    map[ht.id].gf += m.home_score
    map[ht.id].gd += m.home_score - m.away_score
    map[at.id].gf += m.away_score
    map[at.id].gd += m.away_score - m.home_score

    if (m.home_score > m.away_score) { map[ht.id].pts += 3 }
    else if (m.home_score < m.away_score) { map[at.id].pts += 3 }
    else { map[ht.id].pts += 1; map[at.id].pts += 1 }
  }

  return Object.values(map).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
}

// Check if all matches in a group are finished
async function isGroupComplete(admin: SupabaseClient, groupName: string): Promise<boolean> {
  const { data } = await admin
    .from('matches')
    .select('status')
    .eq('tournament_id', TOURNAMENT_ID)
    .eq('phase', 'group')
    .eq('group_name', groupName)
  if (!data?.length) return false
  return data.every(m => m.status === 'finished')
}

// Get match by number
async function getKOMatch(admin: SupabaseClient, matchNumber: number) {
  const { data } = await admin
    .from('matches')
    .select('id, home_team_id, away_team_id, status, home_score, away_score, home_penalties, away_penalties, winner_team_id')
    .eq('tournament_id', TOURNAMENT_ID)
    .eq('match_number', matchNumber)
    .maybeSingle()
  return data
}

// Set teams on a KO match (only if not yet locked / played)
async function promoteTeams(
  admin: SupabaseClient,
  matchNumber: number,
  homeId: string | null,
  awayId: string | null
) {
  const m = await getKOMatch(admin, matchNumber)
  if (!m) return
  if (m.status === 'finished') return // don't overwrite played matches

  // Set or correct the slot. We overwrite when the incoming (winner) team
  // differs from what's currently there so that fixing an upstream result
  // repairs the downstream bracket. Finished matches are never touched.
  const update: Record<string, string | null> = {}
  if (homeId && m.home_team_id !== homeId) update.home_team_id = homeId
  if (awayId && m.away_team_id !== awayId) update.away_team_id = awayId
  if (Object.keys(update).length === 0) return

  await admin.from('matches').update(update).eq('id', m.id)
}

/**
 * Main entry: calculate all group standings and advance teams to R32.
 * Also advances KO rounds when matches finish. Safe to call after every score update.
 */
export async function advanceBracket(admin: SupabaseClient): Promise<void> {
  const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
  const standings: Record<string, Standing[]> = {}
  const complete: Record<string, boolean> = {}

  await Promise.all(
    GROUPS.map(async (g) => {
      standings[g] = await computeGroupStandings(admin, g)
      complete[g] = await isGroupComplete(admin, g)
    })
  )

  const first  = (g: string) => complete[g] ? standings[g][0]?.team_id ?? null : null
  const second = (g: string) => complete[g] ? standings[g][1]?.team_id ?? null : null
  const third  = (g: string) => complete[g] ? standings[g][2]?.team_id ?? null : null

  // R32 — match numbers from migration 007 (real FIFA 2026 bracket)
  // 73: 2A vs 2B
  await promoteTeams(admin, 73, second('A'), second('B'))
  // 74: 1E vs 3rd A/B/C/D/F (best 3rd determined once all groups done)
  await promoteTeams(admin, 74, first('E'), null)
  // 75: 1F vs 2C
  await promoteTeams(admin, 75, first('F'), second('C'))
  // 76: 1C vs 2F
  await promoteTeams(admin, 76, first('C'), second('F'))
  // 77: 1I vs 3rd C/D/F/G/H
  await promoteTeams(admin, 77, first('I'), null)
  // 78: 2E vs 2I
  await promoteTeams(admin, 78, second('E'), second('I'))
  // 79: 1A vs 3rd C/E/F/H/I
  await promoteTeams(admin, 79, first('A'), null)
  // 80: 1L vs 3rd E/H/I/J/K
  await promoteTeams(admin, 80, first('L'), null)
  // 81: 1D vs 3rd B/E/F/I/J
  await promoteTeams(admin, 81, first('D'), null)
  // 82: 1G vs 3rd A/E/H/I/J
  await promoteTeams(admin, 82, first('G'), null)
  // 83: 2K vs 2L
  await promoteTeams(admin, 83, second('K'), second('L'))
  // 84: 1H vs 2J
  await promoteTeams(admin, 84, first('H'), second('J'))
  // 85: 1B vs 3rd E/F/G/I/J
  await promoteTeams(admin, 85, first('B'), null)
  // 86: 1J vs 2H
  await promoteTeams(admin, 86, first('J'), second('H'))
  // 87: 1K vs 3rd D/E/I/J/L
  await promoteTeams(admin, 87, first('K'), null)
  // 88: 2D vs 2G
  await promoteTeams(admin, 88, second('D'), second('G'))

  // Best 3rd-place teams — distributed to the 6 slots that require a 3rd place team.
  // Slots: 74(away), 77(away), 79(away), 80(away), 81(away), 82(away), 85(away), 87(away)
  // In official FIFA rules the specific mapping depends on which groups qualified;
  // for simplicity we rank all thirds and assign sequentially by points/GD/GF.
  if (GROUPS.every(g => complete[g])) {
    const thirdsRanked = GROUPS
      .map(g => ({ ...standings[g][2], groupName: g }))
      .filter(t => t.team_id)
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)

    // Away slots that need a best-3rd
    const thirdSlots = [74, 77, 79, 80, 81, 82, 85, 87]
    for (let i = 0; i < thirdSlots.length && i < thirdsRanked.length; i++) {
      const slot = await getKOMatch(admin, thirdSlots[i])
      if (slot && !slot.away_team_id && slot.status !== 'finished') {
        await admin.from('matches').update({ away_team_id: thirdsRanked[i].team_id }).eq('id', (slot as unknown as { id: string }).id)
      }
    }
  }

  // Advance KO rounds (R32 → R16 → QF → SF → Final)
  // R16 pairings per migration 007: 89=W74vsW77, 90=W73vsW75, 91=W76vsW78, 92=W79vsW80, 93=W83vsW84, 94=W81vsW82, 95=W86vsW88, 96=W85vsW87
  await advanceKORound(admin, [[74,77,89],[73,75,90],[76,78,91],[79,80,92],[83,84,93],[81,82,94],[86,88,95],[85,87,96]])
  await advanceKORound(admin, [[89,90,97],[93,94,98],[91,92,99],[95,96,100]])
  await advanceKORound(admin, [[97,98,101],[99,100,102]])
  await advanceKORound(admin, [[101,102,104]])
  await advanceLosers(admin, [101,102], 103)
}

async function advanceKORound(admin: SupabaseClient, pairs: [number,number,number][]) {
  for (const [m1num, m2num, nextNum] of pairs) {
    const [m1, m2] = await Promise.all([getKOMatch(admin, m1num), getKOMatch(admin, m2num)])
    if (!m1 || !m2) continue
    const w1 = m1.status === 'finished' ? getWinner(m1) : null
    const w2 = m2.status === 'finished' ? getWinner(m2) : null
    if (w1 || w2) await promoteTeams(admin, nextNum, w1, w2)
  }
}

async function advanceLosers(admin: SupabaseClient, nums: [number,number], target: number) {
  const [m1, m2] = await Promise.all(nums.map(n => getKOMatch(admin, n)))
  if (!m1 || !m2) return
  const l1 = m1.status === 'finished' ? getLoser(m1) : null
  const l2 = m2.status === 'finished' ? getLoser(m2) : null
  if (l1 || l2) await promoteTeams(admin, target, l1, l2)
}

type KOMatch = { home_team_id: string; away_team_id: string; home_score?: number | null; away_score?: number | null; home_penalties?: number | null; away_penalties?: number | null; winner_team_id?: string | null }

// Determine the team that advances from a knockout match.
// Priority: admin-designated winner (penalty shootout on a draw) →
// penalty scores → regular/extra-time score. A draw with no designated
// winner is unresolved and returns null (never defaults to the home team).
function getWinner(m: KOMatch): string | null {
  if (m.winner_team_id) return m.winner_team_id
  if (m.home_penalties != null && m.away_penalties != null && m.home_penalties !== m.away_penalties) {
    return m.home_penalties > m.away_penalties ? m.home_team_id : m.away_team_id
  }
  const hs = m.home_score, as = m.away_score
  if (hs != null && as != null && hs !== as) {
    return hs > as ? m.home_team_id : m.away_team_id
  }
  return null
}
function getLoser(m: KOMatch): string | null {
  const winner = getWinner(m)
  if (!winner) return null
  return winner === m.home_team_id ? m.away_team_id : m.home_team_id
}

