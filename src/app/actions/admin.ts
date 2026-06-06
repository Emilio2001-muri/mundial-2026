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
  return { count: fixtures.length, updated }
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

