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
    .select('id, home_team_id, away_team_id, status')
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

  const update: Record<string, string | null> = {}
  if (homeId && !m.home_team_id) update.home_team_id = homeId
  if (awayId && !m.away_team_id) update.away_team_id = awayId
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

  // R32 — match numbers from migration 007
  // 73: 2A vs 2B
  await promoteTeams(admin, 73, second('A'), second('B'))
  // 74: 1E vs best 3rd of A/B/C/D/F  (best 3rd determined once groups done)
  await promoteTeams(admin, 74, first('E'), null)
  // 75: 1A vs 3rd C/D/E/F
  await promoteTeams(admin, 75, first('A'), null)
  // 76: 1F vs 2C
  await promoteTeams(admin, 76, first('F'), second('C'))
  // 77: 1I vs 3rd C/D/F/G/H
  await promoteTeams(admin, 77, first('I'), null)
  // 78: 1G vs 3rd A/E/H/I/J
  await promoteTeams(admin, 78, first('G'), null)
  // 79: 1B vs 3rd A/C/D/K/L
  await promoteTeams(admin, 79, first('B'), null)
  // 80: 1H vs 2J
  await promoteTeams(admin, 80, first('H'), second('J'))
  // 81: 1D vs 3rd B/E/F/I/J
  await promoteTeams(admin, 81, first('D'), null)
  // 82: 1C vs 2D
  await promoteTeams(admin, 82, first('C'), second('D'))
  // 83: 2K vs 2L
  await promoteTeams(admin, 83, second('K'), second('L'))
  // 84: 1J vs 2I
  await promoteTeams(admin, 84, first('J'), second('I'))
  // 85: 1K vs 3rd G/H/I/J/K/L
  await promoteTeams(admin, 85, first('K'), null)
  // 86: 1L vs 2K (after 83 winner)
  await promoteTeams(admin, 86, first('L'), second('K'))
  // 87: 2E vs 2F
  await promoteTeams(admin, 87, second('E'), second('F'))
  // 88: 2G vs 2H
  await promoteTeams(admin, 88, second('G'), second('H'))

  // Best 3rd-place teams — distributed to the 7 slots that require a 3rd place team.
  // Each 3rd place faces a 1st place team (never another 3rd).
  // The specific 3rd → slot mapping depends on which groups produced the best thirds.
  // We rank all 12 thirds and place them into the away slots of matches 74,75,77,78,79,81,85.
  if (GROUPS.every(g => complete[g])) {
    const thirdsRanked = GROUPS
      .map(g => ({ ...standings[g][2], groupName: g }))
      .filter(t => t.team_id)
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)

    // Slots that need a best-3rd as the away team
    const thirdSlots = [74, 75, 77, 78, 79, 81, 85]
    for (let i = 0; i < thirdSlots.length && i < thirdsRanked.length; i++) {
      const slot = await getKOMatch(admin, thirdSlots[i])
      if (slot && !slot.away_team_id && slot.status !== 'finished') {
        await admin.from('matches').update({ away_team_id: thirdsRanked[i].team_id }).eq('id', (slot as unknown as { id: string }).id)
      }
    }
  }

  // Advance KO rounds (R32 → R16 → QF → SF → Final)
  await advanceKORound(admin, [[73,74,89],[75,76,90],[77,78,91],[79,80,92],[81,82,93],[83,84,94],[85,86,95],[87,88,96]])
  await advanceKORound(admin, [[89,90,97],[91,92,98],[93,94,99],[95,96,100]])
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

type KOMatch = { home_team_id: string; away_team_id: string; home_score?: number | null; away_score?: number | null; home_penalties?: number | null; away_penalties?: number | null }
function getWinner(m: KOMatch): string {
  if (m.home_penalties != null) return m.home_penalties > (m.away_penalties ?? 0) ? m.home_team_id : m.away_team_id
  return (m.home_score ?? 0) >= (m.away_score ?? 0) ? m.home_team_id : m.away_team_id
}
function getLoser(m: KOMatch): string {
  if (m.home_penalties != null) return m.home_penalties > (m.away_penalties ?? 0) ? m.away_team_id : m.home_team_id
  return (m.home_score ?? 0) >= (m.away_score ?? 0) ? m.away_team_id : m.home_team_id
}

