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
export async function updateMatchResult(formData: FormData) {
  const supabase = await requireAdmin()
  const matchId = formData.get('match_id') as string
  const homeScore = parseInt(formData.get('home_score') as string, 10)
  const awayScore = parseInt(formData.get('away_score') as string, 10)
  const status = formData.get('status') as string

  await supabase.from('matches').update({
    home_score: isNaN(homeScore) ? null : homeScore,
    away_score: isNaN(awayScore) ? null : awayScore,
    status,
  }).eq('id', matchId)

  revalidatePath('/admin/matches')
  revalidatePath('/matches')
  revalidatePath('/bracket')
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


import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getFootballDataProvider } from '@/lib/football-data'
import type { ScoringRule } from '@/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function updateScoringRule(rule: ScoringRule): Promise<{ error?: string }> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('scoring_rules')
    .update({ points: rule.points, enabled: rule.enabled, description: rule.description })
    .eq('id', rule.id)

  if (error) return { error: error.message }

  // Audit
  await admin.from('audit_logs').insert({
    actor_user_id: user.id,
    action: 'update_scoring_rule',
    entity_type: 'scoring_rules',
    entity_id: rule.id,
    before: null,
    after: { points: rule.points, enabled: rule.enabled },
    created_at: new Date().toISOString(),
  })

  return {}
}

export async function updateMatchResult(
  matchId: string,
  homeScore: number,
  awayScore: number,
  homeScoreEt?: number | null,
  awayScoreEt?: number | null,
  homePenalties?: number | null,
  awayPenalties?: number | null,
): Promise<{ error?: string }> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const admin = createAdminClient()

  const { data: before } = await admin.from('matches').select('home_score, away_score').eq('id', matchId).single()

  const { error } = await admin
    .from('matches')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      home_score_et: homeScoreEt ?? null,
      away_score_et: awayScoreEt ?? null,
      home_penalties: homePenalties ?? null,
      away_penalties: awayPenalties ?? null,
      status: 'finished',
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId)

  if (error) return { error: error.message }

  await admin.from('audit_logs').insert({
    actor_user_id: user.id,
    action: 'update_match_result',
    entity_type: 'matches',
    entity_id: matchId,
    before,
    after: { home_score: homeScore, away_score: awayScore },
    created_at: new Date().toISOString(),
  })

  return {}
}

export async function syncFixtures(): Promise<{ error?: string; count?: number }> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const provider = getFootballDataProvider()
  const fixtures = await provider.getFixtures()

  if (!fixtures.length) {
    return { error: `${provider.name} returned 0 fixtures. Check API key or use manual mode.` }
  }

  const admin = createAdminClient()

  let count = 0
  for (const f of fixtures) {
    if (!f.external_id) continue
    await admin
      .from('matches')
      .upsert(
        {
          external_id: f.external_id,
          kickoff_at: f.kickoff_utc,
          status: f.status === 'FT' ? 'finished' : f.status === '1H' || f.status === '2H' ? 'live' : 'scheduled',
          home_score: f.home_score,
          away_score: f.away_score,
          home_score_et: f.home_score_et,
          away_score_et: f.away_score_et,
          home_penalties: f.home_penalties,
          away_penalties: f.away_penalties,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'external_id', ignoreDuplicates: false }
      )
    count++
  }

  return { count }
}

export async function getAuditLogs(limit = 50) {
  const user = await requireAdmin()
  if (!user) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('audit_logs')
    .select('*, actor:profiles(display_name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function createUserAccount(
  email: string,
  password: string,
  displayName: string,
  role: 'admin' | 'user' = 'user'
): Promise<{ error?: string }> {
  const currentUser = await requireAdmin()
  if (!currentUser) return { error: 'No autorizado.' }

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return { error: error.message }

  await admin.from('profiles').insert({
    id: data.user.id,
    display_name: displayName,
    role,
    timezone: 'America/Mexico_City',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return {}
}
