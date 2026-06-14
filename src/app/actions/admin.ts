'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Guard: only admins ───────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')
  return supabase
}

// ── Delete a match prediction (and its scorer_predictions) ───────
export async function deleteMatchPrediction(formData: FormData) {
  const supabase = await requireAdmin()
  const id = formData.get('prediction_id') as string
  await supabase.from('scorer_predictions').delete().eq('prediction_id', id)
  await supabase.from('match_predictions').delete().eq('id', id)
  revalidatePath('/admin')
}

// ── Clear a prediction comment only ─────────────────────────────
export async function clearPredictionComment(formData: FormData) {
  const supabase = await requireAdmin()
  const id = formData.get('prediction_id') as string
  await supabase.from('match_predictions').update({ comment: null }).eq('id', id)
  revalidatePath('/admin')
}

// ── Delete a global prediction (resets user's global picks) ─────
export async function deleteGlobalPrediction(formData: FormData) {
  const supabase = await requireAdmin()
  const id = formData.get('prediction_id') as string
  await supabase.from('global_predictions').delete().eq('id', id)
  revalidatePath('/admin/audit')
}

// ── Unlock global prediction (allows user to re-edit) ────────────
export async function unlockGlobalPrediction(formData: FormData) {
  await requireAdmin()
  const admin = createAdminClient()
  const id = formData.get('prediction_id') as string
  // Set admin_unlocked so the client bypasses the tournament lock gate
  await admin.from('global_predictions').update({ admin_unlocked: true, submitted_at: null }).eq('id', id)
  revalidatePath('/admin/audit')
}

// ── Unlock match prediction (admin override – lets user re-edit) ──
export async function unlockMatchPrediction(formData: FormData) {
  const adminClient = createAdminClient()
  await requireAdmin()
  const id = formData.get('prediction_id') as string
  await adminClient.from('match_predictions').update({ admin_unlocked: true }).eq('id', id)
  revalidatePath('/admin/audit')
}

// ── Re-lock match prediction (after admin unlocked it) ───────────
export async function relockMatchPrediction(formData: FormData) {
  const adminClient = createAdminClient()
  await requireAdmin()
  const id = formData.get('prediction_id') as string
  await adminClient.from('match_predictions').update({ admin_unlocked: false }).eq('id', id)
  revalidatePath('/admin/audit')
}

// ── Update match result ──────────────────────────────────────────
// Accepts both FormData (server action) and (matchId, home, away) (client call)
export async function updateMatchResult(formDataOrId: FormData | string, homeScoreArg?: number, awayScoreArg?: number): Promise<{ error?: string }> {
  const supabase = await requireAdmin()
  let matchId: string, homeScore: number, awayScore: number, status: string
  if (typeof formDataOrId === 'string') {
    matchId = formDataOrId
    homeScore = homeScoreArg ?? 0
    awayScore = awayScoreArg ?? 0
    status = 'finished'
  } else {
    matchId = formDataOrId.get('match_id') as string
    homeScore = parseInt(formDataOrId.get('home_score') as string, 10)
    awayScore = parseInt(formDataOrId.get('away_score') as string, 10)
    status = formDataOrId.get('status') as string
  }
  const { error } = await supabase.from('matches').update({
    home_score: isNaN(homeScore) ? null : homeScore,
    away_score: isNaN(awayScore) ? null : awayScore,
    status,
  }).eq('id', matchId)
  revalidatePath('/admin/matches')
  revalidatePath('/matches')
  revalidatePath('/bracket')
  if (error) return { error: error.message }
  return {}
}

// ── Update user role ─────────────────────────────────────────────
export async function updateUserRole(formData: FormData) {
  const supabase = await requireAdmin()
  const userId = formData.get('user_id') as string
  const role = formData.get('role') as string
  await supabase.from('profiles').update({ role }).eq('id', userId)
  revalidatePath('/admin/users')
}

// ── Delete user ──────────────────────────────────────────────────
export async function deleteUser(formData: FormData) {
  await requireAdmin()
  const admin = createAdminClient()
  const userId = formData.get('user_id') as string
  await admin.auth.admin.deleteUser(userId)
  revalidatePath('/admin/users')
}

// ── Scoring rules ────────────────────────────────────────────────
export async function updateScoringRule(rule: { id: string; points: number; enabled: boolean; description?: string }): Promise<{ error?: string }> {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('scoring_rules')
    .update({ points: rule.points, enabled: rule.enabled })
    .eq('id', rule.id)
  if (error) return { error: error.message }
  revalidatePath('/admin/scoring')
  return {}
}

// ── Rebuild all matches from football-data.org API ───────────────
// Deletes existing group stage matches and recreates from real API data.
// Knockout placeholders remain untouched.
export async function rebuildMatchesFromAPI(): Promise<{ error?: string; inserted?: number; skipped?: string[] }> {
  await requireAdmin()
  const admin = createAdminClient()

  const { fetchLiveFixtures } = await import('@/lib/football-data')
  const { fixtures, error } = await fetchLiveFixtures()
  if (error) return { error }
  if (!fixtures.length) return { error: 'La API no devolvió partidos. Verifica la clave o el ID de competición (FOOTBALL_DATA_COMPETITION=2000).' }

  const TOURNAMENT_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

  // Load all teams for lookup (by TLA code and by name)
  const { data: teams } = await admin.from('teams').select('id, fifa_code, name')
  const byCode: Record<string, string> = {}
  const byName: Record<string, string> = {}
  for (const t of teams ?? []) {
    byCode[t.fifa_code.toUpperCase()] = t.id
    byName[t.name.toLowerCase()] = t.id
  }

  const findTeam = (code: string, name: string): string | null => {
    return byCode[code.toUpperCase()]
      ?? byCode[name.toUpperCase().slice(0, 3)]
      ?? byName[name.toLowerCase()]
      ?? null
  }

  // Load venues for matching
  const { data: venues } = await admin.from('venues').select('id, name').limit(20)
  const firstVenueId = venues?.[0]?.id ?? null

  // Only process group stage from API (knockout rounds are set by migration)
  const groupFixtures = fixtures.filter(f => f.phase === 'group')
  if (!groupFixtures.length) return { error: 'La API no tiene partidos de fase de grupos todavía.' }

  // Delete existing group stage matches (and their predictions) for this tournament
  await admin.from('matches')
    .delete()
    .eq('tournament_id', TOURNAMENT_ID)
    .eq('phase', 'group')

  let inserted = 0
  const skipped: string[] = []

  for (const f of groupFixtures) {
    const homeId = findTeam(f.home_code, f.home_name)
    const awayId = findTeam(f.away_code, f.away_name)

    if (!homeId) { skipped.push(`No encontrado: ${f.home_code} (${f.home_name})`); continue }
    if (!awayId) { skipped.push(`No encontrado: ${f.away_code} (${f.away_name})`); continue }

    await admin.from('matches').insert({
      tournament_id: TOURNAMENT_ID,
      phase: 'group',
      group_name: f.group_name,
      home_team_id: homeId,
      away_team_id: awayId,
      venue_id: firstVenueId,
      kickoff_at: f.kickoff_utc,
      status: f.status,
      home_score: f.home_score,
      away_score: f.away_score,
    })
    inserted++
  }

  revalidatePath('/matches')
  revalidatePath('/admin/matches')
  revalidatePath('/bracket')
  return { inserted, skipped }
}

// ── Sync fixtures (football-data.org) ────────────────────────────
export async function syncFixtures(): Promise<{ error?: string; count?: number; updated?: number }> {
  await requireAdmin()
  const admin = createAdminClient()

  const { fetchLiveFixtures } = await import('@/lib/football-data')
  const { fixtures, error } = await fetchLiveFixtures()

  if (error) return { error }
  if (!fixtures.length) return { error: 'La API no devolvió partidos. Verifica la clave o el ID de competición (prueba con FOOTBALL_DATA_COMPETITION=2000).' }

  // Load all teams by code for fast lookup
  const { data: teams } = await admin.from('teams').select('id, fifa_code')
  const teamMap: Record<string, string> = {}
  for (const t of teams ?? []) teamMap[t.fifa_code] = t.id

  const TOURNAMENT_ID = 'a1b2c3d4-0000-0000-0000-000000000001'
  let updated = 0

  for (const f of fixtures) {
    const homeId = teamMap[f.home_code]
    const awayId = teamMap[f.away_code]
    if (!homeId || !awayId) continue

    // Find existing match by team IDs
    const { data: match } = await admin
      .from('matches')
      .select('id')
      .eq('tournament_id', TOURNAMENT_ID)
      .eq('home_team_id', homeId)
      .eq('away_team_id', awayId)
      .maybeSingle()

    if (match) {
      // Update kickoff time AND scores/status
      await admin.from('matches').update({
        kickoff_at: f.kickoff_utc,
        home_score: f.home_score,
        away_score: f.away_score,
        home_score_et: f.home_score_et,
        away_score_et: f.away_score_et,
        home_penalties: f.home_penalties,
        away_penalties: f.away_penalties,
        status: f.status,
      }).eq('id', match.id)
    } else {
      // Match not in DB yet — insert it (group stage new entry)
      await admin.from('matches').insert({
        tournament_id: TOURNAMENT_ID,
        phase: 'group',
        home_team_id: homeId,
        away_team_id: awayId,
        kickoff_at: f.kickoff_utc,
        status: f.status,
        home_score: f.home_score,
        away_score: f.away_score,
      })
    }
    updated++
  }

  revalidatePath('/matches')
  revalidatePath('/bracket')
  revalidatePath('/leaderboard')

  // Advance bracket (promote classified teams to knockout rounds)
  const { advanceBracket } = await import('@/lib/bracket-advance')
  await advanceBracket(admin)
  revalidatePath('/bracket')

  return { count: fixtures.length, updated }
}

// ── Add match event (goal, etc.) ─────────────────────────────────
export async function addMatchEvent(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()
  const matchId = formData.get('match_id') as string
  const playerId = formData.get('player_id') as string || null
  const teamId = formData.get('team_id') as string
  const eventType = formData.get('event_type') as string
  const minute = parseInt(formData.get('minute') as string, 10) || 0
  const isOwnGoal = formData.get('is_own_goal') === 'true'

  const { error } = await admin.from('match_events').insert({
    match_id: matchId,
    team_id: teamId,
    player_id: playerId || null,
    event_type: eventType,
    minute,
    is_own_goal: isOwnGoal,
  })
  if (error) return { error: error.message }

  // Recalculate scores immediately
  const { recalculateMatchScores } = await import('@/app/actions/scoring')
  await recalculateMatchScores(matchId)

  revalidatePath('/admin/matches')
  revalidatePath(`/matches/${matchId}`)
  return {}
}

// ── Delete match event ────────────────────────────────────────────
export async function deleteMatchEvent(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()
  const eventId = formData.get('event_id') as string
  const matchId = formData.get('match_id') as string

  const { error } = await admin.from('match_events').delete().eq('id', eventId)
  if (error) return { error: error.message }

  // Only recalculate if the match already has a valid finished result.
  // Skipping recalculation when the match has no score prevents wiping
  // existing prediction_scores when the admin is correcting events on a
  // match whose result hasn't been entered yet.
  const { data: match } = await admin
    .from('matches')
    .select('status, home_score, away_score')
    .eq('id', matchId)
    .single()

  if (match?.status === 'finished' && match?.home_score !== null && match?.away_score !== null) {
    const { recalculateMatchScores } = await import('@/app/actions/scoring')
    await recalculateMatchScores(matchId)
  }

  revalidatePath('/admin/matches')
  revalidatePath(`/matches/${matchId}`)
  return {}
}

// ── Save tournament awards (for scoring global predictions) ───────
export async function saveTournamentAwards(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()
  const TOURNAMENT_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

  const awards = {
    champion_team_id:      formData.get('champion_team_id') as string || null,
    runner_up_team_id:     formData.get('runner_up_team_id') as string || null,
    third_place_team_id:   formData.get('third_place_team_id') as string || null,
    golden_ball_player_id: formData.get('golden_ball_player_id') as string || null,
    silver_ball_player_id: formData.get('silver_ball_player_id') as string || null,
    bronze_ball_player_id: formData.get('bronze_ball_player_id') as string || null,
    golden_boot_player_id: formData.get('golden_boot_player_id') as string || null,
    golden_glove_player_id:formData.get('golden_glove_player_id') as string || null,
    best_young_player_id:  formData.get('best_young_player_id') as string || null,
  }

  const { error } = await admin
    .from('tournaments')
    .update(awards)
    .eq('id', TOURNAMENT_ID)

  if (error) return { error: error.message }

  // Recalculate global prediction scores
  const { recalculateGlobalScores } = await import('@/app/actions/scoring')
  await recalculateGlobalScores(TOURNAMENT_ID)

  revalidatePath('/admin/awards')
  revalidatePath('/leaderboard')
  return {}
}

// ── Create user account ──────────────────────────────────────────
export async function createUserAccount(
  email: string,
  password: string,
  displayName: string,
  role: 'admin' | 'user' = 'user'
): Promise<{ error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) return { error: error.message }
  await admin.from('profiles').upsert({
    id: data.user.id,
    display_name: displayName,
    role,
  })
  revalidatePath('/admin/users')
  return {}
}

// ── Force-sync goal events for a specific match ──────────────────
// Calls football-data.org to fetch goal events and saves them.
// Returns debug info about what the API returned.
export async function syncMatchEvents(matchId: string): Promise<{
  error?: string
  apiGoals?: number
  inserted?: number
  externalId?: string | null
  goalsFromApi?: Array<{ minute: number; scorer: string; team: string; type: string }>
}> {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: match } = await admin
    .from('matches')
    .select('id, external_id, home_team_id, away_team_id, home_score, away_score')
    .eq('id', matchId)
    .maybeSingle()

  if (!match) return { error: 'Partido no encontrado' }
  if (!match.external_id) return { error: 'Este partido no tiene external_id (no ha sido vinculado con la API)', externalId: null }
  if (!match.home_team_id || !match.away_team_id) return { error: 'Faltan team IDs en el partido' }

  const { fetchMatchGoals } = await import('@/lib/football-data')
  const { goals, error: apiError } = await fetchMatchGoals(match.external_id)

  if (apiError) return { error: `Error de API: ${apiError}`, externalId: match.external_id }
  if (!goals.length) return {
    apiGoals: 0,
    externalId: match.external_id,
    goalsFromApi: [],
    error: 'La API no devolvió goles para este partido (puede ser partido sin goles, o la API aún no tiene los datos)',
  }

  // Load players for both teams
  const { data: players } = await admin.from('players').select('id, name, team_id').in('team_id', [match.home_team_id, match.away_team_id])
  const { data: allTeams } = await admin.from('teams').select('id, fifa_code')
  const tmap: Record<string, string> = {}
  for (const t of allTeams ?? []) tmap[t.fifa_code] = t.id

  function norm(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim()
  }
  function findPlayer(name: string, teamId: string): string | null {
    if (!name) return null
    const n = norm(name)
    const parts = n.split(' ').filter(Boolean)
    let hit = (players ?? []).find((p) => p.team_id === teamId && norm(p.name) === n)
    if (hit) return hit.id
    if (parts.length >= 2 && parts[0].length === 1) {
      const initial = parts[0]; const lastName = parts[parts.length - 1]
      hit = (players ?? []).find((p) => { const pp = norm(p.name).split(' ').filter(Boolean); return p.team_id === teamId && pp[pp.length-1] === lastName && pp[0].startsWith(initial) })
      if (hit) return hit.id
    }
    const lastName = parts[parts.length - 1]
    if (lastName.length > 2) { hit = (players ?? []).find((p) => p.team_id === teamId && norm(p.name).endsWith(lastName)); if (hit) return hit.id }
    hit = (players ?? []).find((p) => { const pn = norm(p.name); return p.team_id === teamId && parts.some((part) => part.length > 3 && pn.includes(part)) })
    return hit?.id ?? null
  }

  // Delete previous API-sourced and null-player events
  await admin.from('match_events').delete().eq('match_id', matchId).is('player_id', null).in('event_type', ['goal', 'penalty', 'own_goal'])
  await admin.from('match_events').delete().eq('match_id', matchId).in('event_type', ['goal', 'penalty', 'own_goal']).filter('metadata->>source', 'eq', 'api')

  const inserts = goals.map((g) => {
    let scoringTeamId = tmap[g.teamCode] ?? match.home_team_id!
    if (g.type === 'OWN') scoringTeamId = scoringTeamId === match.home_team_id ? match.away_team_id! : match.home_team_id!
    const playerId = findPlayer(g.scorerName, tmap[g.teamCode] ?? match.home_team_id!)
    return { match_id: matchId, team_id: scoringTeamId, player_id: playerId, event_type: g.type === 'PENALTY' ? 'penalty' : g.type === 'OWN' ? 'own_goal' : 'goal', minute: g.minute + (g.injuryTime ?? 0), is_penalty: g.type === 'PENALTY', is_own_goal: g.type === 'OWN', metadata: { source: 'api', scorer_name: g.scorerName || '' } }
  })

  const { error: insertError } = await admin.from('match_events').insert(inserts)
  if (insertError) return { error: `Error al insertar: ${insertError.message}`, externalId: match.external_id, apiGoals: goals.length }

  // Re-score the match
  const { doScoreMatch } = await import('@/lib/scoring/compute')
  await doScoreMatch(matchId, admin)

  revalidatePath(`/matches/${matchId}`)
  revalidatePath('/leaderboard')

  return {
    apiGoals: goals.length,
    inserted: inserts.length,
    externalId: match.external_id,
    goalsFromApi: goals.map((g) => ({ minute: g.minute, scorer: g.scorerName || '(sin nombre)', team: g.teamCode, type: g.type })),
  }
}

// ── Re-score ALL finished matches ────────────────────────────────
// Regenerates prediction_scores with clean reason text.
// Safe: skips matches without scores, never touches prediction rows.
export async function rescoreAllFinishedMatches(): Promise<{ error?: string; rescored: number }> {
  await requireAdmin()
  const admin = createAdminClient()
  const { doScoreMatch } = await import('@/lib/scoring/compute')

  const { data: matches } = await admin
    .from('matches')
    .select('id')
    .eq('status', 'finished')

  if (!matches?.length) return { rescored: 0 }

  let rescored = 0
  for (const m of matches) {
    try {
      await doScoreMatch(m.id, admin)
      rescored++
    } catch {
      // skip individual failures
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/leaderboard')
  return { rescored }
}

// Safe: NEVER touches match_predictions, scorer_predictions, global_predictions,
// or prediction_scores (those represent real user data).
export async function cleanupOldData(): Promise<{ error?: string; deleted: Record<string, number> }> {
  await requireAdmin()
  const admin = createAdminClient()
  const deleted: Record<string, number> = {}

  // Keep only the 3 most-recent leaderboard snapshot batches per tournament.
  // Each batch = one recalculation run (all users share same created_at minute).
  const { data: allSnapshots } = await admin
    .from('leaderboard_snapshots')
    .select('id, tournament_id, created_at')
    .order('created_at', { ascending: false })

  if (allSnapshots?.length) {
    const byTournament: Record<string, { id: string; created_at: string }[]> = {}
    for (const s of allSnapshots) {
      if (!byTournament[s.tournament_id]) byTournament[s.tournament_id] = []
      byTournament[s.tournament_id].push({ id: s.id, created_at: s.created_at })
    }

    const idsToDelete: string[] = []
    for (const rows of Object.values(byTournament)) {
      // Distinct batches (truncated to minute)
      const batches = [...new Set(rows.map((r) => r.created_at.slice(0, 16)))]
      const keepBatches = new Set(batches.slice(0, 3))
      for (const r of rows) {
        if (!keepBatches.has(r.created_at.slice(0, 16))) {
          idsToDelete.push(r.id)
        }
      }
    }

    if (idsToDelete.length) {
      for (let i = 0; i < idsToDelete.length; i += 500) {
        await admin.from('leaderboard_snapshots').delete().in('id', idsToDelete.slice(i, i + 500))
      }
      deleted.leaderboard_snapshots = idsToDelete.length
    }
  }

  revalidatePath('/admin')
  return { deleted }
}

