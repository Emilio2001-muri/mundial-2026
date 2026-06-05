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

// ── Sync fixtures (manual mode stub) ─────────────────────────────
export async function syncFixtures(): Promise<{ error?: string; count?: number }> {
  await requireAdmin()
  return { error: 'Usa modo manual: edita los resultados en Admin → Partidos.' }
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

